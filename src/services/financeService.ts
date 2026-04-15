import { GoogleGenAI } from "@google/genai";

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
  publisher?: string;
  uuid?: string;
  thumbnail?: any;
  providerPublishTime?: number;
}

async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 2): Promise<Response> {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      if (retries > 0 && response.status >= 500) {
        console.warn(`[FINANCE] Retrying ${url} due to status ${response.status}. Retries left: ${retries - 1}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return fetchWithRetry(url, options, retries - 1);
      }
      const errorData = await response.json().catch(() => ({}));
      const message = errorData.message || errorData.error || `HTTP error! status: ${response.status}`;
      throw new Error(message);
    }
    return response;
  } catch (error) {
    if (retries > 0 && (error instanceof TypeError || (error as any).name === 'AbortError')) {
      console.warn(`[FINANCE] Retrying ${url} due to network error: ${error.message}. Retries left: ${retries - 1}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

export const financeService = {
  async getAssetDetails(ticker: string, assetType?: string): Promise<AssetDetails> {
    const encodedTicker = encodeURIComponent(ticker);
    const url = assetType ? `/api/asset/${encodedTicker}?type=${encodeURIComponent(assetType)}` : `/api/asset/${encodedTicker}`;
    const res = await fetchWithRetry(url);
    return res.json();
  },

  async getAssetHistory(ticker: string, period: string = '1y'): Promise<HistoryPoint[]> {
    const res = await fetchWithRetry(`/api/history/${encodeURIComponent(ticker)}?period=${encodeURIComponent(period)}`);
    return res.json();
  },

  async getAssetDividends(ticker: string): Promise<any[]> {
    const res = await fetchWithRetry(`/api/dividends/${encodeURIComponent(ticker)}`);
    return res.json();
  },

  async getNews(ticker?: string): Promise<NewsItem[]> {
    const url = ticker ? `/api/news?ticker=${encodeURIComponent(ticker)}` : '/api/news';
    const res = await fetchWithRetry(url);
    return res.json();
  },

  async analyzeNews(news: NewsItem[], ticker?: string): Promise<any> {
    try {
      const topNews = news.slice(0, 5).map((n: any) => n.title).join("\n");
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      const prompt = `Analise o sentimento das seguintes notícias financeiras sobre ${ticker || 'o mercado brasileiro'}. 
      Responda APENAS um JSON no formato: {"sentiment": "Bullish" | "Bearish" | "Neutral", "score": 0-100, "summary": "breve resumo de 1 frase"}.
      Notícias:
      ${topNews}`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      const text = response.text || '';
      const jsonMatch = text.match(/\{.*\}/s);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : { sentiment: "Neutral", score: 50, summary: "Análise indisponível" };
    } catch (error) {
      console.error("News analysis failed:", error);
      return { sentiment: "Neutral", score: 50, summary: "Análise indisponível no momento" };
    }
  },

  async getRanking(category: string, type: string = 'ACAO'): Promise<any[]> {
    const res = await fetchWithRetry(`/api/ranking?category=${encodeURIComponent(category)}&type=${type}`);
    return res.json();
  },

  async getPeers(ticker: string, type: string = 'ACAO'): Promise<any[]> {
    const res = await fetchWithRetry(`/api/peers/${encodeURIComponent(ticker)}?type=${encodeURIComponent(type)}`);
    return res.json();
  },

  async getScreener(filters: any, type: string = 'ACAO'): Promise<any[]> {
    const params = new URLSearchParams({ type, ...filters });
    const res = await fetchWithRetry(`/api/screener?${params.toString()}`);
    return res.json();
  },

  async search(query: string): Promise<any[]> {
    const res = await fetchWithRetry(`/api/search?q=${encodeURIComponent(query)}`);
    return res.json();
  },

  async getMarketStats(): Promise<any[]> {
    const res = await fetchWithRetry('/api/market-stats');
    return res.json();
  }
};
