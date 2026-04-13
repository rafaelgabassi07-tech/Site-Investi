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

export interface CorporateEvent {
  ticker: string;
  date: string;
  type: 'SPLIT' | 'INPLIT' | 'DIVIDEND';
  factor?: number; // e.g., 4 for a 1:4 split (1 share becomes 4), 0.1 for 10:1 inplit
  value?: number;
}

export interface TaxMonth {
  month: string; // YYYY-MM
  salesAcoes: number;
  profitAcoes: number;
  salesFIIs: number;
  profitFIIs: number;
  lossCarryforwardAcoes: number;
  lossCarryforwardFIIs: number;
  taxDueAcoes: number;
  taxDueFIIs: number;
  isExemptAcoes: boolean;
}

export interface PortfolioEngineResult {
  currentPositions: PortfolioItem[];
  taxLedger: Record<string, TaxMonth>;
  quotaHistory: { date: string; quotaValue: number; totalPatrimony: number }[];
}
