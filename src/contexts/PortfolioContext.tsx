import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { calculateAdvancedPortfolio, TaxMonth } from '../lib/portfolioCalc';

export interface Transaction {
  id: string;
  ticker: string;
  type: 'BUY' | 'SELL';
  assetType: string;
  quantity: number;
  price: number;
  date: string;
  broker?: string;
  user_id: string;
}

export interface PortfolioItem {
  ticker: string;
  assetType: string;
  totalQuantity: number;
  averagePrice: number;
  totalInvested: number;
  currentPrice?: number;
  currentValue?: number;
  profit?: number;
  profitPercentage?: number;
}

interface PortfolioContextType {
  transactions: Transaction[];
  portfolio: PortfolioItem[];
  taxLedger: Record<string, TaxMonth>;
  quotaHistory: any[];
  loading: boolean;
  refresh: () => Promise<void>;
}

export const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
}

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [taxLedger, setTaxLedger] = useState<Record<string, TaxMonth>>({});
  const [quotaHistory, setQuotaHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCurrentPrices = useCallback(async (items: PortfolioItem[]) => {
    try {
      const updated = await Promise.all(items.map(async item => {
        try {
          const res = await fetch(`/api/asset/${item.ticker}?type=${item.assetType}`);
          if (!res.ok) throw new Error();
          const data = await res.json();
          
          let currentPrice = 0;
          const results = data.results || {};
          
          if (typeof results.precoAtual === 'number') {
            currentPrice = results.precoAtual;
          } else if (typeof results.precoAtual === 'string') {
            currentPrice = parseFloat(results.precoAtual.replace(',', '.'));
          } else {
            const val = results['Valor de Mercado'] || results['Preço'] || results['Cotação'];
            if (val) currentPrice = parseFloat(String(val).replace(',', '.'));
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
      const localTxs = JSON.parse(localStorage.getItem('invest_transactions') || '[]');
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
  }, [processTransactions]);

  useEffect(() => {
    fetchTransactions();

    const isConfigured = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!isConfigured) {
      const handleStorageChange = () => {
        const updatedTxs = JSON.parse(localStorage.getItem('invest_transactions') || '[]');
        processTransactions(updatedTxs);
      };
      window.addEventListener('invest_transactions_updated', handleStorageChange);
      return () => window.removeEventListener('invest_transactions_updated', handleStorageChange);
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTransactions, processTransactions]);

  return (
    <PortfolioContext.Provider value={{ 
      transactions, 
      portfolio, 
      taxLedger, 
      quotaHistory, 
      loading,
      refresh: fetchTransactions
    }}>
      {children}
    </PortfolioContext.Provider>
  );
}

