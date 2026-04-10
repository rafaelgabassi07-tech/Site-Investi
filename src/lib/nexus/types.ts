export type AssetType = 'ACAO' | 'FII' | 'ETF' | 'BDR' | 'CRIPT' | 'RF';
export type ExtendedAssetType = AssetType | string;

export type AssetLabel = 
  | 'P/L' | 'Dividend Yield' | 'P/VP' | 'VPA' | 'ROE' | 'ROIC' 
  | 'Margem Líquida' | 'Margem Bruta' | 'Margem EBIT' | 'EV/EBITDA' 
  | 'Dívida Líquida / Patrimônio' | 'CAGR Receitas 5 Anos' | 'LPA' | 'PEG Ratio'
  | 'P/EBIT' | 'P/Ativo' | 'PSR' | 'Giro Ativos' | 'Dívida Bruta / Patrimônio'
  | 'Valor Patrimonial' | 'Liquidez Diária' | 'Último Rendimento' 
  | 'Vacância Física' | 'Vacância Financeira' | 'Quantidade Ativos'
  | 'Patrimônio Líquido' | 'Valor de Mercado'
  | 'Preço Atual' | 'Variação (24h)' | 'Setor' | 'Subsetor' | 'Segmento'
  | 'Taxa de Administração' | 'Cotas Emitidas' | 'Valor de Firma';

export type ResultMap = Partial<Record<AssetLabel, string | number>>;

export interface FetchMetrics {
  totalTimeMs: number;
  bytesProcessed: number;
  foundKeys: AssetLabel[];
  earlyAbort: boolean;
  successRate: number;
  source: DataSource;
}

export type DataSource = string;

export interface FetchSuccess {
  results: ResultMap;
  metrics: FetchMetrics;
}

export interface FetchAtivoResult {
  ticker: string;
  results?: ResultMap;
  metrics?: FetchMetrics;
  error?: string;
  cacheStatus?: 'HIT' | 'MISS' | 'ERROR';
  logs?: string[];
  news?: NewsItem[];
}

export interface AssetPreset {
  url_base: string;
  labels: AssetLabel[];
}

export type Task<T> = () => Promise<T>;

export type ChartPeriod = '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y' | '10y' | 'ytd' | 'max';

export interface HistoricalQuote {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  adjClose?: number;
  volume: number;
}

export interface Dividend {
  date: Date;
  amount: number;
}

export interface NewsItem {
  title: string;
  link: string;
  pubDate: Date;
  source: string;
  uuid?: string;
  publisher?: string;
  providerPublishTime?: number;
  thumbnail?: {
    resolutions: { url: string }[];
  };
}

export interface NexusEngineConfig {
  cacheTtlMs?: number;
  cacheMaxSize?: number;
  searchCacheTtlMs?: number;
  watchdogMs?: number;
  maxRetries?: number;
  concurrencyLimit?: number;
  proxy?: string;
  circuitBreakerThreshold?: number;
  circuitBreakerResetMs?: number;
}
