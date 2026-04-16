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

  const processTransactions = useCallback((txs: Transaction[]) => {
    setTransactions(txs);
    const { currentPositions, taxLedger, quotaHistory } = calculateAdvancedPortfolio(txs, []);
    setTaxLedger(taxLedger);
    setQuotaHistory(quotaHistory);
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
      processTransactions(localTxs);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching transactions:', error);
      setLoading(false);
      return;
    }

    console.log('Fetched transactions from Supabase:', data);

    const mappedTxs: Transaction[] = data.map(tx => ({
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
    processTransactions(mappedTxs);
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
      refresh: fetchTransactions,
      fetchDividends: loadDividendsFromCloud
    }}>
      {children}
    </PortfolioContext.Provider>
  );
}

