import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

export interface Transaction {
  id: string;
  ticker: string;
  type: 'BUY' | 'SELL';
  assetType: string;
  quantity: number;
  price: number;
  date: string;
  broker?: string;
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

export function usePortfolio() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(collection(db, `users/${auth.currentUser.uid}/transactions`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      setTransactions(txs);
      
      // Calculate Portfolio
      const portfolioMap = new Map<string, PortfolioItem>();
      
      txs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).forEach(tx => {
        const existing = portfolioMap.get(tx.ticker) || {
          ticker: tx.ticker,
          assetType: tx.assetType,
          totalQuantity: 0,
          averagePrice: 0,
          totalInvested: 0
        };

        if (tx.type === 'BUY') {
          const newTotalQuantity = existing.totalQuantity + tx.quantity;
          const newTotalInvested = existing.totalInvested + (tx.quantity * tx.price);
          existing.averagePrice = newTotalInvested / newTotalQuantity;
          existing.totalQuantity = newTotalQuantity;
          existing.totalInvested = newTotalInvested;
        } else {
          existing.totalQuantity -= tx.quantity;
          // Preço médio não muda na venda, mas o total investido proporcional sim
          existing.totalInvested = existing.totalQuantity * existing.averagePrice;
        }

        if (existing.totalQuantity > 0) {
          portfolioMap.set(tx.ticker, existing);
        } else {
          portfolioMap.delete(tx.ticker);
        }
      });

      const portfolioList = Array.from(portfolioMap.values());
      setPortfolio(portfolioList);
      setLoading(false);
      
      // Fetch Current Prices
      fetchCurrentPrices(portfolioList);
    });

    return () => unsubscribe();
  }, []);

  const fetchCurrentPrices = async (items: PortfolioItem[]) => {
    try {
      const updated = await Promise.all(items.map(async item => {
        try {
          const res = await fetch(`/api/asset/${item.ticker}?type=${item.assetType}`);
          if (!res.ok) throw new Error();
          const data = await res.json();
          
          // Try to get current price from results
          let currentPrice = 0;
          const results = data.results || {};
          
          if (typeof results.precoAtual === 'number') {
            currentPrice = results.precoAtual;
          } else if (typeof results.precoAtual === 'string') {
            currentPrice = parseFloat(results.precoAtual.replace(',', '.'));
          } else {
            // Fallback to other possible keys
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
  };

  return { transactions, portfolio, loading };
}
