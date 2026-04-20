import React, { useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { calculateAdvancedPortfolio } from '../lib/portfolioCalc';
import { financeService } from '../services/financeService';
import { nexusAgentService } from '../services/NexusAgent';

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

  const loadDividendsFromCloud = useCallback(loadDividendsFromCloudDeclaration, []);

  async function loadDividendsFromCloudDeclaration() {
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
  }

  useEffect(() => {
    return nexusAgentService.subscribe((status) => {
      setSyncingDividends(status.state === 'syncing' || status.state === 'analyzing');
      if (status.state === 'complete') {
        loadDividendsFromCloud();
      }
    });
  }, [loadDividendsFromCloud]);

  const syncAllDividends = useCallback(async () => {
    nexusAgentService.runSync(portfolio);
  }, [portfolio]);

  // Automatic Trigger when portfolio loads or changes
  useEffect(() => {
    if (!loading && portfolio.length > 0) {
      syncAllDividends();
    }
  }, [loading, portfolio.length, syncAllDividends]);

  const fetchCurrentPrices = useCallback(async (items: PortfolioItem[]) => {
    if (items.length === 0) return;
    
    try {
      const tickers = items.map(i => i.ticker);
      const [batchResults, exchangeRate] = await Promise.all([
        financeService.getQuotesBatch(tickers),
        financeService.getExchangeRate()
      ]);
      
      const updated = items.map(item => {
        const batchData = batchResults.find(b => b.ticker === item.ticker);
        let currentPrice = 0;
        let currency = 'BRL';
        
        if (batchData) {
          currentPrice = typeof batchData.price === 'number' ? batchData.price : parseFinanceValue(batchData.price);
          currency = batchData.currency || 'BRL';
        }
        
        if (!currentPrice || isNaN(currentPrice)) {
          currentPrice = item.averagePrice;
        } else if (currency === 'USD') {
          currentPrice = currentPrice * exchangeRate;
        }

        const currentValue = currentPrice * item.totalQuantity;
        const profit = currentValue - item.totalInvested;
        const profitPercentage = item.totalInvested > 0 ? (profit / item.totalInvested) * 100 : 0;

        return { 
          ...item, 
          currentPrice, 
          currentValue, 
          profit, 
          profitPercentage
        };
      });
      
      setPortfolio(updated);
      
      // Update the final data point in quotaHistory to reflect current true prices
      setQuotaHistory(prev => {
        if (!prev || prev.length === 0) return prev;
        const newHistory = [...prev];
        const lastIdx = newHistory.length - 1;
        
        let newTotalPatrimony = 0;
        updated.forEach(item => {
          newTotalPatrimony += (item.currentValue || item.totalInvested);
        });
        
        // Calculate new quota value based on the total patrimony change
        // We assume we know the amount of quotas from the provider's logic
        // The lastIdx point should have the same totalQuotas count as it's the most recent state
        // To do this right, we'd need to track quotas. 
        // For simplicity and correctness in a P/L vs TWR context, let's just update the patrimony.
        // If we want a perfect TWR, we need to pass the quota count out of calculateAdvancedPortfolio.
        
        newHistory[lastIdx] = {
          ...newHistory[lastIdx],
          totalPatrimony: newTotalPatrimony
        };
        
        return newHistory;
      });
    } catch (err) {
      console.error('Failed to fetch current prices via batch', err);
    }
  }, []);

  const processTransactions = useCallback((txs: Transaction[], events: any[] = []) => {
    setTransactions(txs);
    const { currentPositions, taxLedger, quotaHistory } = calculateAdvancedPortfolio(txs, events);
    setTaxLedger(taxLedger);
    setQuotaHistory(quotaHistory);
    setPortfolio(currentPositions);
    setLoading(false);
    
    // Only fetch prices if there are positions
    if (currentPositions.length > 0) {
      fetchCurrentPrices(currentPositions);
    }
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

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Parallelize Supabase calls
      const [txResult, eventResult] = await Promise.all([
        supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: true }),
        supabase
          .from('corporate_events')
          .select('*')
      ]);

      if (txResult.error) throw txResult.error;

      const mappedTxs: Transaction[] = (txResult.data || []).map(tx => ({
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

      processTransactions(mappedTxs, eventResult.data || []);
      loadDividendsFromCloud();
    } catch (error) {
      console.error('Error in fetchTransactions:', error);
      setLoading(false);
    }
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

  const contextValue = React.useMemo(() => ({ 
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
  }), [
    transactions, 
    portfolio, 
    dividends, 
    taxLedger, 
    quotaHistory, 
    loading, 
    syncingDividends, 
    fetchTransactions, 
    loadDividendsFromCloud, 
    syncAllDividends
  ]);

  return (
    <PortfolioContext.Provider value={contextValue}>
      {children}
    </PortfolioContext.Provider>
  );
}

