import { useContext } from 'react';
import { PortfolioContext } from '../contexts/PortfolioContext';

export type { Transaction, PortfolioItem } from '../contexts/PortfolioContext';

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
}
