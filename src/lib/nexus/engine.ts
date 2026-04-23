import yahooFinance from 'yahoo-finance2';
import { LRUCache, CircuitBreaker, DomainRateLimiter, universalLexer, getStealthHeaders, getRandomAgent, canonicalizeTicker, inferAssetType, normalizeBRNumber, backoffMs, extractHostname, formatYahooError } from './utils';

// Types and Constants (re-declared or imported if needed)
export type ExtendedAssetType = 'ACAO' | 'FII' | 'BDR' | 'ETF' | 'STOCK' | 'CRYPTO';

interface NewsItem {
  title: string;
  link: string;
  pubDate?: Date;
  source: string;
}

interface NexusEngineOptions {
  cacheTtlMs?: number;
  cacheStaleMs?: number;
  maxRetries?: number;
  fetchTimeoutMs?: number;
  concurrencyLimit?: number;
  domainRps?: number;
}

const YAHOO_HOSTS = ['query2.finance.yahoo.com', 'query1.finance.yahoo.com'];

const ASSET_PRESETS: Record<string, any> = {
  ACAO: { i10Base: 'https://investidor10.com.br/acoes', siBase: 'https://statusinvest.com.br/acoes', template: { rules: [
    { name: 'precoAtual', anchors: ['valor atual', 'R$'], regex: /R\$\s*([\d,.]+)/i },
    { name: 'dividendYield', anchors: ['dividend yield', 'dy'], regex: /([\d,.]+)\s*%/i },
    { name: 'pl', anchors: ['p/l'], regex: /([\d,.]+)/i },
    { name: 'pvp', anchors: ['p/vp'], regex: /([\d,.]+)/i },
    { name: 'name', anchors: ['<title>'], regex: /([^-|]+)/i }
  ]}},
  FII: { i10Base: 'https://investidor10.com.br/fiis', siBase: 'https://statusinvest.com.br/fundos-imobiliarios', template: { rules: [
    { name: 'precoAtual', anchors: ['valor atual', 'R$'], regex: /R\$\s*([\d,.]+)/i },
    { name: 'dividendYield', anchors: ['dividend yield', 'dy'], regex: /([\d,.]+)\s*%/i },
    { name: 'pvp', anchors: ['p/vp'], regex: /([\d,.]+)/i }
  ]}}
};

export class NexusEngine {
  private static _tickerInFlight  = new Map<string, Promise<any>>();
  private static _cache           = new LRUCache<any>(500);
  private static _circuitBreakers = new Map<string, CircuitBreaker>();
  private static _rateLimiters    = new Map<string, DomainRateLimiter>();
  private static _startTime       = Date.now();

  private static _options: Required<NexusEngineOptions> = {
    cacheTtlMs:       24 * 60 * 60 * 1_000,
    cacheStaleMs:     10 * 60 * 1_000,
    maxRetries:       3,
    retryBaseDelay:   500,
    fetchTimeoutMs:   12_000,
    concurrencyLimit: 20,
    domainRps:        5,
    domainBurst:      15,
  };

  static configure(opts: NexusEngineOptions): void {
    this._options = { ...this._options, ...opts };
    this._rateLimiters.clear();
  }

  private static getRateLimiter(domain: string): DomainRateLimiter {
    const d = domain.replace('www.', '').split('.')[0];
    let limiter = this._rateLimiters.get(d);
    if (!limiter) {
      limiter = new DomainRateLimiter(this._options.domainRps, 15);
      this._rateLimiters.set(d, limiter);
    }
    return limiter;
  }

  private static getCB(domain: string): CircuitBreaker {
    const d = domain.replace('www.', '').split('.')[0];
    if (!this._circuitBreakers.has(d)) {
      this._circuitBreakers.set(d, new CircuitBreaker());
    }
    return this._circuitBreakers.get(d)!;
  }

  static async fetchAeroScrape(url: string): Promise<string | null> {
    try {
      const res = await fetch('https://aero-scrape.vercel.app/api/scrape', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ url, stealth: true })
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.content || data.html || null;
    } catch { return null; }
  }

  static async execute<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: { staleMs?: number; ttlMs?: number; force?: boolean }
  ): Promise<T> {
    const staleMs = options?.staleMs || this._options.cacheStaleMs;
    const ttlMs   = options?.ttlMs   || this._options.cacheTtlMs;
    const cached = this._cache.get(key);
    if (!options?.force && cached && !cached.isStale) return cached.data;
    const inFlight = this._tickerInFlight.get(key);
    if (inFlight) return inFlight;
    const prom = fetcher();
    this._tickerInFlight.set(key, prom);
    try {
      const data = await prom;
      this._cache.set(key, data, staleMs, ttlMs);
      return data;
    } finally { this._tickerInFlight.delete(key); }
  }

  private static async _executeNetwork<T>(
    sources: ScrapeSource<T>[],
  ): Promise<Partial<T>> {
    let combined: Partial<T> = {};
    const htmls = await Promise.all(sources.map(async (src) => {
      const hostname = extractHostname(src.url);
      const rl = this.getRateLimiter(hostname);
      const cb = this.getCB(hostname);
      if (cb.isOpen()) return await this.fetchAeroScrape(src.url);
      try {
        await rl.acquire();
        const res = await fetch(src.url, { headers: getStealthHeaders(src.url, hostname) });
        if (res.status === 429) {
          cb.recordFailure();
          return await this.fetchAeroScrape(src.url);
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const html = await res.text();
        cb.recordSuccess();
        return html;
      } catch {
        cb.recordFailure();
        return await this.fetchAeroScrape(src.url);
      }
    }));
    htmls.forEach((html, i) => { if (html) combined = universalLexer(html, sources[i].template, combined); });
    return combined;
  }

  static async fetchAtivo(ticker: string, type: ExtendedAssetType = 'ACAO'): Promise<any> {
    return this.execute(`ativo-${ticker}-${type}`, async () => {
      const clean = canonicalizeTicker(ticker);
      const preset = ASSET_PRESETS[type] || ASSET_PRESETS.ACAO;
      const sources: ScrapeSource[] = [
        { url: `${preset.i10Base}/${clean.toLowerCase()}/`, template: preset.template, requireStealth: true },
        { url: `${preset.siBase}/${clean.toLowerCase()}/`,  template: preset.template, requireStealth: true },
      ];
      const [scraped, yQuote] = await Promise.all([
        this._executeNetwork(sources),
        this.yahooQuote(ticker).catch(() => null)
      ]);
      const res = {
        ticker: clean,
        type,
        precoAtual: scraped.precoAtual || yQuote?.price || 0,
        dividendYield: scraped.dividendYield || (yQuote?.dividendYield ? (yQuote.dividendYield * 100).toFixed(2) + '%' : '0,00%'),
        pl: scraped.pl || yQuote?.trailingPE || 0,
        pvp: scraped.pvp || yQuote?.priceToBook || 0,
        name: scraped.name || yQuote?.name || clean,
        ...scraped
      };
      return { ticker: clean, results: res, cacheStatus: 'FRESH' };
    });
  }

  static async fetchNews(ticker: string): Promise<NewsItem[]> {
    return this.execute(`news-${ticker}`, async () => {
      const q = ticker === 'IBOVESPA' ? 'ibovespa' : ticker;
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}+mercado+financeiro&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
      try {
        const text = await (await fetch(url)).text();
        const items: NewsItem[] = [];
        const matches = text.matchAll(/<item>([\s\S]*?)<\/item>/g);
        for (const m of matches) {
          const c = m[1];
          items.push({
            title: (c.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '').split(' - ')[0],
            link: c.match(/<link>([\s\S]*?)<\/link>/)?.[1] || '',
            pubDate: c.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] ? new Date(c.match(/<pubDate>([\s\S]*?)<\/pubDate>/)![1]) : undefined,
            source: c.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1] || 'Google News'
          });
          if (items.length >= 12) break;
        }
        return items;
      } catch { return []; }
    });
  }

  static async fetchRanking(category: string, type: ExtendedAssetType = 'ACAO'): Promise<any[]> {
    return this.execute(`ranking-${category}-${type}`, async () => {
      const url = `https://investidor10.com.br/${type.toLowerCase()}s/rankings/${category}`;
      try {
        const html = await (await fetch(url, { headers: getStealthHeaders(url) })).text();
        const tickers = Array.from(new Set([...html.matchAll(new RegExp(`/${type.toLowerCase()}s/([A-Z0-9]{4,6})/`, 'g'))].map(m => m[1].toUpperCase()))).slice(0, 15);
        if (!tickers.length) return [];
        const batch = await this.fetchQuotesBatch(tickers);
        return tickers.map(t => {
           const q = batch.find(i => canonicalizeTicker(i.ticker) === t);
           return { ticker: t, name: q?.name || t, price: q?.price || 0, change: q?.change || '0.00%' };
        });
      } catch { return []; }
    });
  }

  static async fetchQuotesBatch(tickers: string[]): Promise<any[]> {
    if (!tickers.length) return [];
    const results: any[] = [];
    for (let i = 0; i < tickers.length; i += 40) {
      const chunk = tickers.slice(i, i + 40).map(t => t.includes('.') ? t : `${t}.SA`);
      try {
        const data = await (await fetch(`https://${YAHOO_HOSTS[0]}/v7/finance/quote?symbols=${chunk.join(',')}`, { headers: { 'User-Agent': getRandomAgent() } })).json();
        results.push(...(data.quoteResponse?.result || []).map((q: any) => ({
          ticker: q.symbol,
          price: q.regularMarketPrice || 0,
          change: (q.regularMarketChangePercent || 0).toFixed(2) + '%',
          name: q.shortName || q.longName || q.symbol
        })));
      } catch {
        // Fallback or ignore
      }
    }
    return results;
  }

  static async fetchHistoricalFundamentals(ticker: string): Promise<any[]> {
    const clean = canonicalizeTicker(ticker).toLowerCase();
    try {
      const url = `https://investidor10.com.br/acoes/${clean}/`;
      const html = await (await fetch(url, { headers: getStealthHeaders(url) })).text();
      const tId = html.match(/tickerId\s*=\s*['"](\d+)['"]/)?.[1];
      if (!tId) return [];
      const indData = await (await fetch(`https://investidor10.com.br/api/historico-indicadores/${tId}/10/?v=2`, { headers: getStealthHeaders(url) })).json();
      const years = Array.from(new Set(Object.values(indData).flatMap((a: any) => a.map((i: any) => i.year)))).sort();
      return years.map(y => ({
        year: String(y),
        pl: indData['P/L']?.find((i: any) => i.year === y)?.value || 0,
        pvp: indData['P/VP']?.find((i: any) => i.year === y)?.value || 0,
        dy: indData['Dividend Yield']?.find((i: any) => i.year === y)?.value || 0,
        roe: indData['ROE']?.find((i: any) => i.year === y)?.value || 0
      }));
    } catch { return []; }
  }

  static async fetchDividends(ticker: string): Promise<any[]> {
    const clean = canonicalizeTicker(ticker);
    try {
      const html = await (await fetch(`https://investidor10.com.br/acoes/${clean.toLowerCase()}/`, { headers: getStealthHeaders('investidor10.com.br') })).text();
      const match = html.match(/<table[^>]*id="table-dividends"[^>]*>([\s\S]*?)<\/table>/);
      if (!match) return [];
      return [...match[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].slice(1).map(r => {
        const cells = [...r[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(c => c[1].replace(/<[^>]*>/g, '').trim());
        return { date: cells[1] ? new Date(cells[1].split('/').reverse().join('-')).toISOString() : '', amount: parseFloat(cells[3]?.replace(',', '.') || '0'), type: cells[0] };
      }).filter(d => d.amount > 0);
    } catch { return []; }
  }

  static async searchTicker(query: string): Promise<any[]> {
    try {
      const data = await (await fetch(`https://${YAHOO_HOSTS[0]}/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10`, { headers: { 'User-Agent': getRandomAgent() } })).json();
      return (data.quotes || []).map((q: any) => ({ ticker: q.symbol, name: q.shortname || q.longname || q.symbol, type: q.quoteType, exchange: q.exchange }));
    } catch { return []; }
  }

  static async fetchHistoricoGrafico(ticker: string, range = '1y'): Promise<any[]> {
    const sym = ticker.includes('.') ? ticker : `${ticker}.SA`;
    try {
      const data = await (await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${sym}?range=${range}&interval=1d`, { headers: { 'User-Agent': getRandomAgent() } })).json();
      const chart = data.chart?.result?.[0];
      if (!chart) return [];
      const close = chart.indicators?.quote?.[0]?.close || [];
      return (chart.timestamp || []).map((t: number, i: number) => ({ date: new Date(t * 1000).toISOString(), close: close[i] || 0 })).filter((v: any) => v.close > 0);
    } catch { return []; }
  }

  static async executeBatch<T>(tasks: (() => Promise<T>)[], concurrency = 5): Promise<T[]> {
    const results: T[] = [];
    for (let i = 0; i < tasks.length; i += concurrency) {
      const chunk = tasks.slice(i, i + concurrency);
      results.push(...(await Promise.all(chunk.map(t => t()))));
    }
    return results;
  }

  static async fetchPeers(ticker: string, type: ExtendedAssetType = 'ACAO'): Promise<any[]> {
    const peers: Record<string, string[]> = {
      'PETR4': ['PETR3', 'PRIO3', 'RECV3'],
      'VALE3': ['CSNA3', 'GGBR4', 'USIM5'],
      'ITUB4': ['BBDC4', 'BBAS3', 'SANB11']
    };
    const list = peers[ticker.toUpperCase()] || ['PETR4', 'VALE3', 'ITUB4'];
    return this.executeBatch(list.map(t => () => this.fetchAtivo(t, type)));
  }

  static async searchSuggestions(query: string) {
    return this.searchTicker(query);
  }

  static async screener(filters: any, type: ExtendedAssetType = 'ACAO'): Promise<any[]> {
    const list = ['PETR4', 'VALE3', 'ITUB4', 'BBAS3', 'BBDC4', 'ABEV3', 'WEGE3'];
    const results = await this.executeBatch(list.map(t => () => this.fetchAtivo(t, type)));
    return results.filter((r: any) => {
      if (filters.minDY && parseFloat(r.results.dividendYield) < parseFloat(filters.minDY)) return false;
      return true;
    });
  }

  static clearCache(): void {
    this._cache = new LRUCache<any>(500);
  }

  static invalidateCache(ticker: string): void {
    this._cache.delete(`ativo-${ticker}-ACAO`);
  }
  static getCacheStats() { return { cacheSize: this._cache.tamanho, uptimeMs: Date.now() - this._startTime }; }
  static async checkConnectivity() { return { status: 'OK' }; }

  static async getAIContextForAsset(ticker: string): Promise<string> {
    const d = await this.fetchAtivo(ticker);
    return `Ativo: ${ticker}\nPreço: R$ ${d.results.precoAtual}\nDY: ${d.results.dividendYield || 'N/A'}`;
  }

  static async yahooQuote(s: string) { return (await this.fetchQuotesBatch([s]))[0] || null; }
  static async yahooFundamentals(s: string) { return this.fetchHistoricalFundamentals(s); }
}

export async function runNexusBatch(ts: string[], type: ExtendedAssetType = 'ACAO') {
  return NexusEngine.executeBatch(ts.map(t => () => NexusEngine.fetchAtivo(t, type)));
}

export async function runNexusBatchAuto(ts: string[]) {
  return NexusEngine.executeBatch(ts.map(t => () => NexusEngine.fetchAtivo(t, inferAssetType(t))));
}

export interface ScrapeSource<T = any> {
  url: string;
  template: any;
  requireStealth?: boolean;
}

export interface B3Data {
  precoAtual?: number;
  dividendYield?: string;
  pl?: number;
  pvp?: number;
}
