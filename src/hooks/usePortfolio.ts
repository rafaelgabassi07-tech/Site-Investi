import { useContext } from 'react';
import { PortfolioContext } from '../contexts/PortfolioContext';
import { Transaction, PortfolioItem } from '../types';

export type { Transaction, PortfolioItem };

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
}
