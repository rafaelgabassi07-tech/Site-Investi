export interface AssetDetails {
  ticker: string;
  results: Record<string, any>;
  cacheStatus: string;
  news?: any[];
  metrics?: {
    source: string;
    totalTimeMs: number;
  };
}

export interface HistoryPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string | Date;
  source: string;
}

export const financeService = {
  async getAssetDetails(ticker: string, assetType: string = 'ACAO'): Promise<AssetDetails> {
    const res = await fetch(`/api/asset/${ticker}?type=${assetType}`);
    if (!res.ok) throw new Error('Failed to fetch asset details');
    return res.json();
  },

  async getAssetHistory(ticker: string, period: string = '1y'): Promise<HistoryPoint[]> {
    const res = await fetch(`/api/history/${ticker}?period=${period}`);
    if (!res.ok) throw new Error('Failed to fetch asset history');
    return res.json();
  },

  async getAssetDividends(ticker: string): Promise<any[]> {
    const res = await fetch(`/api/dividends/${ticker}`);
    if (!res.ok) throw new Error('Failed to fetch asset dividends');
    return res.json();
  },

  async getNews(ticker?: string): Promise<NewsItem[]> {
    const url = ticker ? `/api/news?ticker=${ticker}` : '/api/news';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch news');
    return res.json();
  },

  async getRanking(category: string, type: string = 'ACAO'): Promise<any[]> {
    const res = await fetch(`/api/ranking?category=${encodeURIComponent(category)}&type=${type}`);
    if (!res.ok) throw new Error('Failed to fetch ranking');
    return res.json();
  },

  async getScreener(filters: any, type: string = 'ACAO'): Promise<any[]> {
    const params = new URLSearchParams({ type, ...filters });
    const res = await fetch(`/api/screener?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch screener');
    return res.json();
  },

  async search(query: string): Promise<any[]> {
    const res = await fetch(`/api/search?q=${query}`);
    if (!res.ok) throw new Error('Failed to search');
    return res.json();
  },

  async getMarketStats(): Promise<any[]> {
    const res = await fetch('/api/market-stats');
    if (!res.ok) throw new Error('Failed to fetch market stats');
    return res.json();
  }
};
