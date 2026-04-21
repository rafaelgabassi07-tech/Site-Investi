import { Transaction, PortfolioItem, CorporateEvent, TaxMonth, PortfolioEngineResult } from '../types';

/**
 * Motor Core de Gestão de Portfólio
 * Implementa:
 * 1. Preço Médio Ponderado
 * 2. Eventos Corporativos (Desdobramentos/Grupamentos)
 * 3. Motor Fiscal (Isenção 20k, Compensação de Prejuízos)
 * 4. Rentabilidade TWR (Método de Cotas)
 */

/**
 * Encontra a quantidade de um ativo em uma data específica
 */
export function getHistoricalQuantity(ticker: string, targetDateStr: string, portfolio: PortfolioItem[]): number {
  const item = portfolio.find(p => p.ticker.toUpperCase() === ticker.toUpperCase());
  if (!item || !item.historicalQuantities || item.historicalQuantities.length === 0) return 0;
  
  // Use YYYY-MM-DD for comparison to avoid timezone issues
  const targetDateStrNormalized = targetDateStr.split('T')[0];
  
  // As quantidades históricas já vêm ordenadas cronologicamente pelo motor
  // Mas por segurança, garantimos que pegamos a última antes ou na data alvo
  const history = [...item.historicalQuantities].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const match = [...history].reverse().find(h => {
    const hDateStrNormalized = h.date.split('T')[0];
    // Se a data fornecida é a "Data COM" (Data com dividendo), a compra deve ocorrer ANTES *OU NO MESMO DIA* da Data COM para dar direito ao dividendo.
    return hDateStrNormalized <= targetDateStrNormalized;
  });
  
  return match ? match.quantity : 0;
}

export function calculateAdvancedPortfolio(
  transactions: Transaction[],
  events: CorporateEvent[] = [],
  currentPrices: Record<string, number> = {}
): PortfolioEngineResult {
  
  // 1. Sort everything chronologically, filtering out invalid dates
  const sortedTxs = [...transactions]
    .filter(t => t.date && !isNaN(new Date(t.date).getTime()))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
  const sortedEvents = [...events]
    .filter(e => e.date && !isNaN(new Date(e.date).getTime()))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // State
  const positions = new Map<string, PortfolioItem>();
  const taxLedger: Record<string, TaxMonth> = {};
  
  let accumulatedLossAcoes = 0;
  let accumulatedLossFIIs = 0;

  // TWR State
  let totalQuotas = 1000; // Start with 1000 quotas
  let quotaValue = 1.0; // Initial quota value
  let previousPatrimony = 0;
  const quotaHistory: { date: string; quotaValue: number; totalPatrimony: number; totalInvested?: number }[] = [];

  // Helper to get or create tax month
  const getTaxMonth = (dateStr: string): TaxMonth => {
    const d = new Date(dateStr);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!taxLedger[month]) {
      taxLedger[month] = {
        month,
        salesAcoes: 0, profitAcoes: 0,
        salesFIIs: 0, profitFIIs: 0,
        lossCarryforwardAcoes: 0, lossCarryforwardFIIs: 0,
        taxDueAcoes: 0, taxDueFIIs: 0,
        isExemptAcoes: true
      };
    }
    return taxLedger[month];
  };

  // Combined and sort all events (transactions + corporate events)
  const allEvents: any[] = [
    ...sortedTxs.map(t => ({ ...t, _type: 'TX' })),
    ...sortedEvents.map(e => ({ ...e, _type: 'CORP' }))
  ].sort((a, b) => {
    const timeA = new Date(a.date).getTime();
    const timeB = new Date(b.date).getTime();
    if (timeA === timeB) {
      // Prioritize CORP events on the same day if they are splits
      if (a._type === 'CORP' && b._type === 'TX') return -1;
      if (a._type === 'TX' && b._type === 'CORP') return 1;
    }
    return timeA - timeB;
  });

  // Historical quantity tracker per ticker: [ { date, quantity } ]
  const historicalQuantities = new Map<string, { date: string; quantity: number }[]>();

  for (const ev of allEvents) {
    if (ev._type === 'CORP') {
      // Handle Corporate Events (Splits / Inplits)
      const pos = positions.get(ev.ticker);
      if (pos && pos.totalQuantity > 0) {
        if (ev.type === 'SPLIT' || ev.type === 'INPLIT') {
          const factor = ev.factor || 1;
          pos.totalQuantity = pos.totalQuantity * factor;
          pos.averagePrice = pos.averagePrice / factor;
          // Total invested remains the same
          
          // Record quantity change in history
          const hq = historicalQuantities.get(ev.ticker) || [];
          hq.push({ date: ev.date, quantity: pos.totalQuantity });
          historicalQuantities.set(ev.ticker, hq);
        }
      }
    } else if (ev._type === 'TX') {
      const tx = ev as Transaction;
      const pos = positions.get(tx.ticker) || {
        ticker: tx.ticker,
        assetType: tx.assetType,
        totalQuantity: 0,
        averagePrice: 0,
        totalInvested: 0
      };

      // TWR Calculation (Before applying transaction)
      let currentPatrimonyBeforeTx = 0;
      positions.forEach(p => {
        const priceAtTime = currentPrices[p.ticker] || p.averagePrice; 
        currentPatrimonyBeforeTx += p.totalQuantity * priceAtTime;
      });

      // Update Quota Value based on market movement BEFORE the cash flow
      if (previousPatrimony > 0 && totalQuotas > 0) {
        const potentialQuotaValue = currentPatrimonyBeforeTx / totalQuotas;
        if (!isNaN(potentialQuotaValue) && isFinite(potentialQuotaValue) && potentialQuotaValue > 0) {
          quotaValue = potentialQuotaValue;
        }
      }

      if (tx.type === 'BUY') {
        const newTotalQuantity = pos.totalQuantity + tx.quantity;
        const newTotalInvested = pos.totalInvested + (tx.quantity * tx.price);
        pos.averagePrice = newTotalQuantity > 0 ? newTotalInvested / newTotalQuantity : 0;
        pos.totalQuantity = newTotalQuantity;
        pos.totalInvested = newTotalInvested;

        const cashInflow = tx.quantity * tx.price;
        const newQuotasIssued = quotaValue > 0 ? cashInflow / quotaValue : 0;
        totalQuotas += newQuotasIssued;
      } else if (tx.type === 'SELL') {
        const saleVolume = tx.quantity * tx.price;
        const costBasis = tx.quantity * pos.averagePrice;
        const profit = saleVolume - costBasis;

        pos.totalQuantity = Math.max(0, pos.totalQuantity - tx.quantity);
        pos.totalInvested = pos.totalQuantity * pos.averagePrice;

        const cashOutflow = saleVolume;
        const quotasDestroyed = quotaValue > 0 ? cashOutflow / quotaValue : 0;
        totalQuotas = Math.max(0, totalQuotas - quotasDestroyed);

        const taxM = getTaxMonth(tx.date);
        if (tx.assetType === 'ACAO') {
          taxM.salesAcoes += saleVolume;
          taxM.profitAcoes += profit;
        } else if (tx.assetType === 'FII') {
          taxM.salesFIIs += saleVolume;
          taxM.profitFIIs += profit;
        }
      }

      if (pos.totalQuantity > 0) {
        positions.set(tx.ticker, pos);
      } else {
        positions.delete(tx.ticker);
      }

      // Record quantity change in history
      const hq = historicalQuantities.get(tx.ticker) || [];
      hq.push({ date: tx.date, quantity: pos.totalQuantity });
      historicalQuantities.set(tx.ticker, hq);

      // Record TWR History
      let currentPatrimonyAfterTx = 0;
      let currentInvestedAfterTx = 0;
      positions.forEach(p => {
        const priceAtTime = currentPrices[p.ticker] || p.averagePrice; 
        currentPatrimonyAfterTx += p.totalQuantity * priceAtTime;
        currentInvestedAfterTx += p.totalInvested;
      });
      previousPatrimony = currentPatrimonyAfterTx;

      quotaHistory.push({
        date: tx.date,
        quotaValue,
        totalPatrimony: currentPatrimonyAfterTx,
        totalInvested: currentInvestedAfterTx
      });
    }
  }

  // Finalize Tax Ledger
  const sortedMonths = Object.keys(taxLedger).sort();
  for (const month of sortedMonths) {
    const tm = taxLedger[month];
    tm.isExemptAcoes = tm.salesAcoes <= 20000;
    if (tm.profitAcoes < 0) {
      accumulatedLossAcoes += Math.abs(tm.profitAcoes);
    } else if (tm.profitAcoes > 0 && !tm.isExemptAcoes) {
      if (accumulatedLossAcoes > 0) {
        if (accumulatedLossAcoes >= tm.profitAcoes) {
          tm.lossCarryforwardAcoes = tm.profitAcoes;
          accumulatedLossAcoes -= tm.profitAcoes;
          tm.profitAcoes = 0;
        } else {
          tm.lossCarryforwardAcoes = accumulatedLossAcoes;
          tm.profitAcoes -= accumulatedLossAcoes;
          accumulatedLossAcoes = 0;
        }
      }
      tm.taxDueAcoes = tm.profitAcoes * 0.15;
    }

    if (tm.profitFIIs < 0) {
      accumulatedLossFIIs += Math.abs(tm.profitFIIs);
    } else if (tm.profitFIIs > 0) {
      if (accumulatedLossFIIs > 0) {
        if (accumulatedLossFIIs >= tm.profitFIIs) {
          tm.lossCarryforwardFIIs = tm.profitFIIs;
          accumulatedLossFIIs -= tm.profitFIIs;
          tm.profitFIIs = 0;
        } else {
          tm.lossCarryforwardFIIs = accumulatedLossFIIs;
          tm.profitFIIs -= accumulatedLossFIIs;
          accumulatedLossFIIs = 0;
        }
      }
      tm.taxDueFIIs = tm.profitFIIs * 0.20;
    }
  }

  const today = new Date().toISOString();
  if (quotaHistory.length > 0) {
    let todayPatrimony = 0;
    let todayInvested = 0;
    positions.forEach(p => {
      const priceAtTime = currentPrices[p.ticker] || p.averagePrice; 
      todayPatrimony += p.totalQuantity * priceAtTime;
      todayInvested += p.totalInvested;
    });
    
    if (quotaHistory[quotaHistory.length - 1].date.split('T')[0] !== today.split('T')[0]) {
      quotaHistory.push({
        date: today,
        quotaValue,
        totalPatrimony: todayPatrimony,
        totalInvested: todayInvested
      });
    }
  }

  return {
    currentPositions: Array.from(positions.values()).map(p => ({
      ...p,
      // Provide historicQuantities so pages can query them
      historicalQuantities: historicalQuantities.get(p.ticker) || []
    })),
    taxLedger,
    quotaHistory
  };
}
