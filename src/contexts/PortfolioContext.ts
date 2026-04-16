import { createContext } from 'react';
import { Transaction, PortfolioItem, TaxMonth } from '../types';

export interface PortfolioContextType {
  transactions: Transaction[];
  portfolio: PortfolioItem[];
  dividends: any[];
  taxLedger: Record<string, TaxMonth>;
  quotaHistory: any[];
  loading: boolean;
  refresh: () => Promise<void>;
  fetchDividends: () => Promise<void>;
}

export const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);
