import React, { useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { calculateAdvancedPortfolio } from '../lib/portfolioCalc';
import { financeService } from '../services/financeService';

import { Transaction, PortfolioItem, TaxMonth } from '../types';
import { PortfolioContext } from './PortfolioContext';
import { parseFinanceValue } from '../lib/utils';

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [dividends, setDividends] = useState<any[]>([]);
  const [taxLedger, setTaxLedger] = useState<Record<string, TaxMonth>>({});
  const [quotaHistory, setQuotaHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingDividends, setSyncingDividends] = useState(false);
  const lastSyncRef = React.useRef<number>(0);

  const loadDividendsFromCloud = useCallback(async () => {
    try {
      const isConfigured = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (isConfigured) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('dividends')
            .select('*')
            .eq('user_id', user.id);
            
          if (error) throw error;
          if (data) {
            setDividends(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
          }
        }
      } else {
        const local = JSON.parse(localStorage.getItem('invest_dividends') || '[]');
        setDividends(local.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      }
    } catch (e) {
      console.error('Error fetching dividends from cloud:', e);
    }
  }, []);

  const syncAllDividends = useCallback(async () => {
    if (portfolio.length === 0 || syncingDividends) return;
    
    // Prevent syncing too often (once every 15 mins)
    const now = Date.now();
    if (now - lastSyncRef.current < 15 * 60 * 1000) {
      console.log('[SYNC] Skipped - last sync was recent.');
      return;
    }

    setSyncingDividends(true);
    lastSyncRef.current = now;

    try {
      console.log(`[SYNC] Iniciando varredura para ${portfolio.length} ativos...`);
      
      const results = await Promise.all(
        portfolio.slice(0, 30).map(async (item) => {
          try {
            console.log(`[SYNC] Buscando dividendos para: ${item.ticker}...`);
            const divs = await financeService.getAssetDividends(item.ticker);
            if (!divs || !Array.isArray(divs)) {
              console.log(`[SYNC] Nenhum dado retornado para ${item.ticker}`);
              return [];
            }
            
            console.log(`[SYNC] ${divs.length} dividendos encontrados para ${item.ticker}`);
            return divs.map(d => ({
              ticker: item.ticker.toUpperCase(),
              type: item.assetType || (item.ticker.toUpperCase().endsWith('11') ? 'FII' : 'ACAO'),
              date: d.date,
              amount: typeof d.amount === 'string' ? parseFloat(d.amount) : d.amount,
              is_future: new Date(d.date) > new Date()
            }));
          } catch (err) {
            console.warn(`[SYNC] Falha ao processar ${item.ticker}:`, err);
            return [];
          }
        })
      );

      const flatDividends = results.flat().filter(d => d && d.date && d.amount > 0);
      console.log(`[SYNC] Total de ${flatDividends.length} registros brutos encontrados.`);

      // Predição Automática (1 mês para FII, 3 meses para Ações)
      const futurePredictions: any[] = [];
      const currTime = new Date();
      const byTicker = flatDividends.reduce((acc, curr) => {
        if (!acc[curr.ticker]) acc[curr.ticker] = [];
        acc[curr.ticker].push(curr);
        return acc;
      }, {} as Record<string, any[]>);

      for (const ticker in byTicker) {
        const history = byTicker[ticker].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        if (history.length > 0) {
          const lastDiv = history[0];
          const nextDate = new Date(lastDiv.date);
          const isFII = ticker.endsWith('11') || lastDiv.type === 'FII';
          
          nextDate.setMonth(nextDate.getMonth() + (isFII ? 1 : 3));
          
          if (nextDate > currTime) {
            futurePredictions.push({
              ticker,
              type: lastDiv.type,
              date: nextDate.toISOString(),
              amount: lastDiv.amount,
              is_future: true
            });
          }
        }
      }

      const allToSync = [...flatDividends, ...futurePredictions];
      if (allToSync.length === 0) {
        setSyncingDividends(false);
        return;
      }

      const isConfigured = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (isConfigured) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          console.log(`[SYNC] Salvando ${allToSync.length} registros no Supabase...`);
          // Batch check exists would be better but let's do sequential for safety with RLS
          let added = 0;
          for (const div of allToSync) {
            const { data: existing } = await supabase.from('dividends')
              .select('id')
              .match({ user_id: user.id, ticker: div.ticker, date: div.date })
              .limit(1);
            
            if (!existing || existing.length === 0) {
              const { error } = await supabase.from('dividends').insert({ ...div, user_id: user.id });
              if (!error) added++;
            }
          }
          console.log(`[SYNC] Sucesso! ${added} novos proventos salvos na nuvem.`);
        }
      } else {
        const local = JSON.parse(localStorage.getItem('invest_dividends') || '[]');
        let changed = false;
        for (const div of allToSync) {
          if (!local.find((l: any) => l.ticker === div.ticker && l.date === div.date)) {
            local.push({ ...div, id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() });
            changed = true;
          }
        }
        if (changed) {
          localStorage.setItem('invest_dividends', JSON.stringify(local));
          window.dispatchEvent(new Event('invest_dividends_updated'));
          console.log('[SYNC] Sucesso! Novos proventos salvos localmente.');
        }
      }
      
      await loadDividendsFromCloud();
    } catch (e) {
      console.error('[SYNC] Falha crítica na sincronização:', e);
    } finally {
      setSyncingDividends(false);
    }
  }, [portfolio, syncingDividends, loadDividendsFromCloud]);

  // Automatic Trigger when portfolio loads or changes
  useEffect(() => {
    if (!loading && portfolio.length > 0) {
      syncAllDividends();
    }
  }, [loading, portfolio.length, syncAllDividends]);

  const fetchCurrentPrices = useCallback(async (items: PortfolioItem[]) => {
    try {
      const updated = await Promise.all(items.map(async item => {
        try {
          const data = await financeService.getAssetDetails(item.ticker, item.assetType);
          
          const results = data.results || {};
          let currentPrice = parseFinanceValue(results.precoAtual);
          
          if (currentPrice === 0) {
            const val = results['Valor de Mercado'] || results['Preço'] || results['Cotação'];
            if (val) currentPrice = parseFinanceValue(val);
          }

          if (currentPrice === 0) currentPrice = item.averagePrice;

          const currentValue = currentPrice * item.totalQuantity;
          const profit = currentValue - item.totalInvested;
          const profitPercentage = (profit / item.totalInvested) * 100;

          return { 
            ...item, 
            currentPrice, 
            currentValue, 
            profit, 
            profitPercentage 
          };
        } catch {
          return { ...item, currentPrice: item.averagePrice, currentValue: item.totalInvested, profit: 0, profitPercentage: 0 };
        }
      }));
      setPortfolio(updated);
    } catch (err) {
      console.error('Failed to fetch current prices', err);
    }
  }, []);

  const processTransactions = useCallback((txs: Transaction[], events: any[] = []) => {
    setTransactions(txs);
    const { currentPositions, taxLedger, quotaHistory } = calculateAdvancedPortfolio(txs, events);
    setTaxLedger(taxLedger);
    setQuotaHistory(quotaHistory);
    setPortfolio(currentPositions);
    setLoading(false);
    fetchCurrentPrices(currentPositions);
  }, [fetchCurrentPrices]);

  const fetchTransactions = useCallback(async () => {
    const isConfigured = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!isConfigured) {
      let localTxs = [];
      try {
        const stored = localStorage.getItem('invest_transactions');
        localTxs = stored ? JSON.parse(stored) : [];
        if (!Array.isArray(localTxs)) localTxs = [];
      } catch (e) {
        console.error('Failed to parse localStorage in PortfolioProvider, resetting:', e);
        localTxs = [];
        localStorage.setItem('invest_transactions', '[]');
      }
      processTransactions(localTxs, []);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // Fetch transactions
    const { data: txData, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: true });

    // Fetch corporate events (Splits/Inplits)
    const { data: eventData } = await supabase
      .from('corporate_events')
      .select('*');

    if (txError) {
      console.error('Error fetching transactions:', txError);
      setLoading(false);
      return;
    }

    const mappedTxs: Transaction[] = (txData || []).map(tx => ({
      id: tx.id,
      ticker: tx.ticker,
      type: tx.type as 'BUY' | 'SELL',
      assetType: tx.asset_type,
      quantity: Number(tx.quantity),
      price: Number(tx.price),
      date: tx.date,
      broker: tx.broker,
      user_id: tx.user_id
    }));

    processTransactions(mappedTxs, eventData || []);
    loadDividendsFromCloud();
  }, [processTransactions, loadDividendsFromCloud]);

  useEffect(() => {
    fetchTransactions();
    loadDividendsFromCloud();

    const isConfigured = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    const handleStorageChange = () => {
      if (!isConfigured) {
        const updatedTxs = JSON.parse(localStorage.getItem('invest_transactions') || '[]');
        processTransactions(updatedTxs);
        loadDividendsFromCloud();
      } else {
        fetchTransactions();
        loadDividendsFromCloud();
      }
    };
    window.addEventListener('invest_transactions_updated', handleStorageChange);
    window.addEventListener('invest_dividends_updated', handleStorageChange);

    if (!isConfigured) {
      return () => {
        window.removeEventListener('invest_transactions_updated', handleStorageChange);
        window.removeEventListener('invest_dividends_updated', handleStorageChange);
      }
    }

    // Real-time subscription with unique channel name to avoid conflicts
    const channel = supabase
      .channel(`portfolio-updates-${Math.random().toString(36).substring(7)}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'transactions' 
      }, () => {
        fetchTransactions();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'dividends' 
      }, () => {
        loadDividendsFromCloud();
      })
      .subscribe();

    return () => {
      window.removeEventListener('invest_transactions_updated', handleStorageChange);
      window.removeEventListener('invest_dividends_updated', handleStorageChange);
      supabase.removeChannel(channel);
    };
  }, [fetchTransactions, processTransactions, loadDividendsFromCloud]);

  return (
    <PortfolioContext.Provider value={{ 
      transactions, 
      portfolio, 
      dividends,
      taxLedger, 
      quotaHistory, 
      loading,
      syncingDividends,
      refresh: fetchTransactions,
      fetchDividends: loadDividendsFromCloud,
      syncAllDividends
    }}>
      {children}
    </PortfolioContext.Provider>
  );
}

