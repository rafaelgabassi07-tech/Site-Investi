import { Transaction, PortfolioItem } from '../hooks/usePortfolio';

export interface CorporateEvent {
  ticker: string;
  date: string;
  type: 'SPLIT' | 'INPLIT' | 'DIVIDEND';
  factor?: number; // e.g., 4 for a 1:4 split (1 share becomes 4), 0.1 for 10:1 inplit
  value?: number;
}

export interface TaxMonth {
  month: string; // YYYY-MM
  salesAcoes: number;
  profitAcoes: number;
  salesFIIs: number;
  profitFIIs: number;
  lossCarryforwardAcoes: number;
  lossCarryforwardFIIs: number;
  taxDueAcoes: number;
  taxDueFIIs: number;
  isExemptAcoes: boolean;
}

export interface PortfolioEngineResult {
  currentPositions: PortfolioItem[];
  taxLedger: Record<string, TaxMonth>;
  quotaHistory: { date: string; quotaValue: number; totalPatrimony: number }[];
}

/**
 * Motor Core de Gestão de Portfólio
 * Implementa:
 * 1. Preço Médio Ponderado
 * 2. Eventos Corporativos (Desdobramentos/Grupamentos)
 * 3. Motor Fiscal (Isenção 20k, Compensação de Prejuízos)
 * 4. Rentabilidade TWR (Método de Cotas)
 */
export function calculateAdvancedPortfolio(
  transactions: Transaction[],
  events: CorporateEvent[] = [],
  currentPrices: Record<string, number> = {}
): PortfolioEngineResult {
  
  // 1. Sort everything chronologically
  const sortedTxs = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const sortedEvents = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // State
  const positions = new Map<string, PortfolioItem>();
  const taxLedger: Record<string, TaxMonth> = {};
  
  let accumulatedLossAcoes = 0;
  let accumulatedLossFIIs = 0;

  // TWR State
  let totalQuotas = 1000; // Start with 1000 quotas
  let quotaValue = 1.0; // Initial quota value
  let previousPatrimony = 0;
  const quotaHistory: { date: string; quotaValue: number; totalPatrimony: number }[] = [];

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

  // Combine and sort all events (transactions + corporate events)
  const allEvents: any[] = [
    ...sortedTxs.map(t => ({ ...t, _type: 'TX' })),
    ...sortedEvents.map(e => ({ ...e, _type: 'CORP' }))
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

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
      // We calculate the patrimony right before this transaction
      let currentPatrimonyBeforeTx = 0;
      positions.forEach(p => {
        // In a real scenario, we'd use the historical price of the asset on `tx.date`.
        // For this simulation, we use the average price as a proxy if historical isn't available,
        // or currentPrices if passed.
        const priceAtTime = currentPrices[p.ticker] || p.averagePrice; 
        currentPatrimonyBeforeTx += p.totalQuantity * priceAtTime;
      });

      // Update Quota Value based on market movement BEFORE the cash flow
      if (previousPatrimony > 0 && totalQuotas > 0) {
        quotaValue = currentPatrimonyBeforeTx / totalQuotas;
      }

      if (tx.type === 'BUY') {
        // Update Position
        const newTotalQuantity = pos.totalQuantity + tx.quantity;
        const newTotalInvested = pos.totalInvested + (tx.quantity * tx.price);
        pos.averagePrice = newTotalInvested / newTotalQuantity;
        pos.totalQuantity = newTotalQuantity;
        pos.totalInvested = newTotalInvested;

        // TWR: Buy means cash inflow -> Issue new quotas
        const cashInflow = tx.quantity * tx.price;
        const newQuotasIssued = quotaValue > 0 ? cashInflow / quotaValue : 0;
        totalQuotas += newQuotasIssued;

      } else if (tx.type === 'SELL') {
        // Calculate Profit/Loss
        const saleVolume = tx.quantity * tx.price;
        const costBasis = tx.quantity * pos.averagePrice;
        const profit = saleVolume - costBasis;

        // Update Position
        pos.totalQuantity -= tx.quantity;
        pos.totalInvested = pos.totalQuantity * pos.averagePrice;

        // TWR: Sell means cash outflow -> Destroy quotas
        const cashOutflow = saleVolume;
        const quotasDestroyed = quotaValue > 0 ? cashOutflow / quotaValue : 0;
        totalQuotas -= quotasDestroyed;

        // Tax Engine
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

      // Record TWR History
      let currentPatrimonyAfterTx = 0;
      positions.forEach(p => {
        const priceAtTime = currentPrices[p.ticker] || p.averagePrice; 
        currentPatrimonyAfterTx += p.totalQuantity * priceAtTime;
      });
      previousPatrimony = currentPatrimonyAfterTx;

      quotaHistory.push({
        date: tx.date,
        quotaValue,
        totalPatrimony: currentPatrimonyAfterTx
      });
    }
  }

  // Finalize Tax Ledger (Apply rules, 20k exemption, and loss carryforward)
  const sortedMonths = Object.keys(taxLedger).sort();
  for (const month of sortedMonths) {
    const tm = taxLedger[month];

    // Ações
    tm.isExemptAcoes = tm.salesAcoes <= 20000;
    if (tm.profitAcoes < 0) {
      accumulatedLossAcoes += Math.abs(tm.profitAcoes);
    } else if (tm.profitAcoes > 0 && !tm.isExemptAcoes) {
      // Abater prejuízo
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
      tm.taxDueAcoes = tm.profitAcoes * 0.15; // 15% IR
    }

    // FIIs (No exemption)
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
      tm.taxDueFIIs = tm.profitFIIs * 0.20; // 20% IR
    }
  }

  return {
    currentPositions: Array.from(positions.values()),
    taxLedger,
    quotaHistory
  };
}
