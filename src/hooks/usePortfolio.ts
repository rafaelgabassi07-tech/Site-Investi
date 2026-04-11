import { usePortfolioContext } from '../contexts/PortfolioContext';

export type { Transaction, PortfolioItem } from '../contexts/PortfolioContext';

export function usePortfolio() {
  return usePortfolioContext();
}
