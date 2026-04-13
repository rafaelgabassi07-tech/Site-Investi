import { createContext } from 'react';
import { Transaction, PortfolioItem, TaxMonth } from '../types';

export interface PortfolioContextType {
  transactions: Transaction[];
  portfolio: PortfolioItem[];
  taxLedger: Record<string, TaxMonth>;
  quotaHistory: any[];
  loading: boolean;
  refresh: () => Promise<void>;
}

export const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);
