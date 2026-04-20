
export interface AssetDetails {
  ticker: string;
  assetType?: string;
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
  const finalUrl = (typeof window === 'undefined' && url.startsWith('/')) 
    ? `http://localhost:3000${url}` 
    : url;

  try {
    const response = await fetch(finalUrl, options);
    if (!response.ok) {
      if (retries > 0 && response.status >= 500) {
        console.warn(`[FINANCE] Retrying ${url} due to status ${response.status}. Retries left: ${retries - 1}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return fetchWithRetry(url, options, retries - 1);
      }
      
      let message = `HTTP error! status: ${response.status}`;
      try {
        const contentType = response.headers.get('content-type');
        const text = await response.text();
        if (contentType && contentType.includes('application/json')) {
          try {
            if (text && text.trim()) {
              const errorData = JSON.parse(text);
              message = errorData.message || errorData.error || message;
            }
          } catch (e) {
            message = `Malformed JSON error response: ${text?.slice(0, 100)}`;
          }
        } else {
          if (text.includes('<!doctype') || text.includes('<html')) {
            message = `Nexus Engine is warming up or routing error (Status ${response.status}). Please try again in a few seconds.`;
          } else if (text) {
            message = `Server error: ${text.slice(0, 100)}`;
          }
        }
      } catch (e) {
        // Fallback message already set
      }
      throw new Error(message);
    }

    // Check if we got JSON even if status is OK
    const contentType = response.headers.get('content-type');
    const method = options.method || 'GET';
    if (method === 'GET' && contentType && !contentType.includes('application/json')) {
      const text = await response.clone().text();
      if (text.includes('<!doctype') || text.includes('<html')) {
        throw new Error(`Unexpected HTML response (Status ${response.status}) for ${url}. This might be a session timeout or internal routing issue.`);
      }
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

const cache: Record<string, { data: any, timestamp: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function fetchWithCache(key: string, fetcher: () => Promise<any>): Promise<any> {
  const now = Date.now();
  if (cache[key] && (now - cache[key].timestamp < CACHE_TTL)) {
    return cache[key].data;
  }
  const data = await fetcher();
  cache[key] = { data, timestamp: now };
  return data;
}

export const financeService = {
  async getAssetDetails(ticker: string, assetType?: string): Promise<AssetDetails> {
    const encodedTicker = encodeURIComponent(ticker);
    const url = assetType ? `/api/asset/${encodedTicker}?type=${encodeURIComponent(assetType)}` : `/api/asset/${encodedTicker}`;
    return fetchWithCache(`details-${ticker}-${assetType}`, async () => {
      const res = await fetchWithRetry(url);
      return res.json();
    });
  },

  async getAssetHistory(ticker: string, period: string = '1y'): Promise<HistoryPoint[]> {
    return fetchWithCache(`history-${ticker}-${period}`, async () => {
      const res = await fetchWithRetry(`/api/history/${encodeURIComponent(ticker)}?period=${encodeURIComponent(period)}`);
      return res.json();
    });
  },

  async getAssetDividends(ticker: string): Promise<any[]> {
    return fetchWithCache(`dividends-${ticker}`, async () => {
      const res = await fetchWithRetry(`/api/dividends/${encodeURIComponent(ticker)}`);
      return res.json();
    });
  },

  async getHistoricalFundamentals(ticker: string): Promise<any[]> {
    return fetchWithCache(`fundamentals-${ticker}`, async () => {
      const res = await fetchWithRetry(`/api/historical-fundamentals/${encodeURIComponent(ticker)}`);
      return res.json();
    });
  },

  async getNews(ticker?: string): Promise<NewsItem[]> {
    const url = ticker ? `/api/news?ticker=${encodeURIComponent(ticker)}` : '/api/news';
    return fetchWithCache(`news-${ticker || 'global'}`, async () => {
      const res = await fetchWithRetry(url);
      return res.json();
    });
  },

  async analyzeNews(news: NewsItem[], ticker?: string): Promise<any> {
    if (!news || news.length === 0) return { sentiment: "Neutro", score: 50, summary: "Baixo volume de informações no radar para uma análise direcional." };
    
    // Agora chama a IA Nativa do Nexus no Backend
    try {
      const res = await fetchWithRetry('/api/ai/sentiment');
      const data = await res.json();
      
      // Mapeia o retorno simplificado do backend para o formato esperado pelo widget
      const insight = data.text || "";
      const isBullish = insight.toLowerCase().includes('alta') || insight.toLowerCase().includes('momentum');
      const isBearish = insight.toLowerCase().includes('alerta') || insight.toLowerCase().includes('negativa');
      
      return { 
        sentiment: isBullish ? 'Otimista' : (isBearish ? 'Pessimista' : 'Neutro'), 
        score: isBullish ? 80 : (isBearish ? 20 : 50), 
        summary: insight 
      };
    } catch (e) {
      console.warn("[NEXUS AI] Fallback to local heuristics:", e);
      return { sentiment: "Neutro", score: 50, summary: "Análise sistêmica temporariamente em modo de contingência local." };
    }
  },

  async askNexusAI(question: string, context?: any): Promise<string> {
    try {
      const res = await fetchWithRetry('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, context })
      });
      const data = await res.json();
      return data.text;
    } catch (e) {
      return "Sistemas Nexus em manutenção. Tente novamente em breve.";
    }
  },

  async getRanking(category: string, type: string = 'ACAO'): Promise<any[]> {
    return fetchWithCache(`ranking-${category}-${type}`, async () => {
      const res = await fetchWithRetry(`/api/ranking?category=${encodeURIComponent(category)}&type=${type}`);
      return res.json();
    });
  },

  async getPeers(ticker: string, type: string = 'ACAO'): Promise<any[]> {
    return fetchWithCache(`peers-${ticker}-${type}`, async () => {
      const res = await fetchWithRetry(`/api/peers/${encodeURIComponent(ticker)}?type=${encodeURIComponent(type)}`);
      return res.json();
    });
  },

  async getScreener(filters: any, type: string = 'ACAO'): Promise<any[]> {
    const params = new URLSearchParams({ type, ...filters });
    return fetchWithCache(`screener-${params.toString()}`, async () => {
      const res = await fetchWithRetry(`/api/screener?${params.toString()}`);
      return res.json();
    });
  },

  async search(query: string): Promise<any[]> {
    return fetchWithCache(`search-${query}`, async () => {
      const res = await fetchWithRetry(`/api/search?q=${encodeURIComponent(query)}`);
      return res.json();
    });
  },

  async getMarketStats(): Promise<any[]> {
    const key = 'market-stats';
    const now = Date.now();
    if (cache[key] && (now - cache[key].timestamp < 20 * 1000)) {
      return cache[key].data;
    }
    const res = await fetchWithRetry('/api/market-stats');
    const data = await res.json();
    cache[key] = { data, timestamp: now };
    return data;
  },

  async getQuotesBatch(tickers: string[]): Promise<any[]> {
    if (tickers.length === 0) return [];
    const key = `batch-${tickers.sort().join(',')}`;
    const now = Date.now();
    // Cache batch quotes for 20 seconds
    if (cache[key] && (now - cache[key].timestamp < 20 * 1000)) {
      return cache[key].data;
    }
    
    const res = await fetchWithRetry(`/api/quotes/batch?tickers=${encodeURIComponent(tickers.join(','))}`);
    const data = await res.json();
    cache[key] = { data, timestamp: now };
    return data;
  },

  async getExchangeRate(): Promise<number> {
    return fetchWithCache('exchange-rate', async () => {
      const res = await fetchWithRetry('/api/exchange-rate');
      const data = await res.json();
      return data.rate || 5.25;
    });
  }
};
