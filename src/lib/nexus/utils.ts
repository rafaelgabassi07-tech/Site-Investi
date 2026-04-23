export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const normalizeBRNumber = (val: string): string | null => {
  if (!val) return null;
  let clean = val.replace(/\s+/g, '').trim();
  if (clean.includes('%')) return clean;
  if (clean.includes(',')) return clean.replace(/\./g, '').replace(',', '.');
  return clean;
};

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'
];

export const getRandomAgent = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

export class LRUCache<T> {
  private cache = new Map<string, { data: T; expires: number; staleAt: number }>();
  constructor(private maxSize: number) {}
  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expires) { this.cache.delete(key); return null; }
    return { data: item.data, isStale: Date.now() > item.staleAt };
  }
  set(key: string, data: T, staleMs: number, ttlMs: number) {
    if (this.cache.size >= this.maxSize) this.cache.delete(this.cache.keys().next().value);
    this.cache.set(key, { data, staleAt: Date.now() + staleMs, expires: Date.now() + ttlMs });
  }
  delete(key: string) { this.cache.delete(key); }
  get tamanho() { return this.cache.size; }
}

export class CircuitBreaker {
  private failures = 0;
  private lastFailure = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF' = 'CLOSED';
  isOpen() {
    if (this.state === 'OPEN' && Date.now() - this.lastFailure > 30000) this.state = 'HALF';
    return this.state === 'OPEN';
  }
  recordSuccess() { this.failures = 0; this.state = 'CLOSED'; }
  recordFailure() {
    this.failures++;
    this.lastFailure = Date.now();
    if (this.failures >= 3) this.state = 'OPEN';
  }
}

export class DomainRateLimiter {
  private lastCall = 0;
  constructor(private rps: number, private burst: number) {}
  async acquire() {
    const now = Date.now();
    const wait = Math.max(0, this.lastCall + (1000 / this.rps) - now);
    this.lastCall = now + wait;
    if (wait > 0) await delay(wait);
  }
}

export function universalLexer<T = any>(html: string, template: any, current: Partial<T> = {}): Partial<T> {
  const result = { ...current };
  const lower = html.toLowerCase();
  for (const rule of template.rules) {
    if ((result as any)[rule.name]) continue;
    let found = false;
    for (const anchor of rule.anchors) {
      const idx = lower.indexOf(anchor.toLowerCase());
      if (idx !== -1) {
        const snippet = html.slice(idx, idx + 500);
        const match = snippet.match(rule.regex);
        if (match) {
          (result as any)[rule.name] = normalizeBRNumber(match[1]);
          found = true;
          break;
        }
      }
    }
  }
  return result;
}

export function getStealthHeaders(url: string, host?: string) {
  return {
    'User-Agent': getRandomAgent(),
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    'Referer': 'https://www.google.com/',
    'Host': host || extractHostname(url)
  };
}

export function canonicalizeTicker(t: string) {
  return t.toUpperCase().replace('.SA', '').trim();
}

export function inferAssetType(t: string): any {
  const c = canonicalizeTicker(t);
  if (c.endsWith('11') && c.length === 6) return 'FII';
  if (c.includes('-USD')) return 'CRYPTO';
  if (c.length > 6) return 'STOCK';
  return 'ACAO';
}

export function backoffMs(retry: number) { return Math.pow(2, retry) * 1000; }

export function extractHostname(url: string) {
  try { return new URL(url).hostname; } catch { return ''; }
}

export function formatYahooError(err: any): string {
  if (err?.response?.data?.quoteResponse?.error?.description) {
    return err.response.data.quoteResponse.error.description;
  }
  return err.message || 'Unknown error';
}
