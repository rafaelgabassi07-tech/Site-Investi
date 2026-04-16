import { PageHeader } from '../components/ui/PageHeader';
import { Search as SearchIcon, TrendingUp, ArrowUpRight, ArrowDownRight, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useSearchParams } from 'react-router-dom';
import { AssetIcon } from '../components/ui/AssetIcon';
import { useState, useEffect } from 'react';
import { financeService } from '../services/financeService';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [hasSearched, setHasSearched] = useState(initialQuery.length >= 2);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      if (query) {
        setSearchParams({ q: query });
      } else {
        setSearchParams({});
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [query, setSearchParams]);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    const performSearch = async () => {
      setLoading(true);
      setHasSearched(true);
      try {
        console.log(`[Search] Searching for: ${debouncedQuery}`);
        const data = await financeService.search(debouncedQuery);
        console.log(`[Search] Results:`, data);
        setResults(data);
      } catch (err) {
        console.error('Search failed', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery]);

  const mostSearched = [
    { ticker: 'PETR4', name: 'PETROBRAS', price: '38,45', change: '+2,34%', positive: true },
    { ticker: 'VALE3', name: 'VALE', price: '62,10', change: '+1,85%', positive: true },
    { ticker: 'ITUB4', name: 'ITAÚ UNIBANCO', price: '34,20', change: '+1,12%', positive: true },
    { ticker: 'BTC-USD', name: 'BITCOIN', price: '96.420', change: '+2,15%', positive: true, currency: 'US$' },
  ];

  const mapQuoteTypeToAssetType = (asset: any): string => {
    const symbol = asset.symbol || asset.ticker || '';
    const type = asset.type || asset.quoteType || '';
    
    if (type === 'CRYPTOCURRENCY' || symbol.includes('-USD')) return 'CRYPTO';
    if (type === 'ETF') return 'ETF';
    if (symbol.endsWith('.SA')) {
      if (symbol.match(/[A-Z]{4}11/)) return 'FII';
      if (symbol.match(/[A-Z]{4}3[2-5]/)) return 'BDR';
      return 'ACAO';
    }
    return 'STOCK';
  };

  return (
    <div className="space-y-4 pb-24 max-w-5xl mx-auto px-1 md:px-0">
      <PageHeader 
        title="Busca"
        description="Encontre ativos, empresas e criptomoedas em tempo real."
        icon={SearchIcon}
      />

      <div className="relative flex items-center w-full bg-slate-900/40 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] focus-within:border-blue-500/30 transition-all p-2 overflow-hidden group">
        <div className="absolute inset-0 bg-blue-600/[0.02] opacity-0 group-focus-within:opacity-100 transition-opacity" />
        <div className="pl-4 md:pl-6 text-slate-500 relative z-10">
          {loading ? (
            <Loader2 className="icon-md md:icon-lg text-blue-500 animate-spin" />
          ) : (
            <SearchIcon className="icon-md md:icon-lg group-focus-within:text-blue-500 transition-colors" />
          )}
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 min-w-0 bg-transparent border-none outline-none py-4 px-4 md:py-6 md:px-6 text-sm md:text-lg text-white font-medium placeholder:text-slate-700 placeholder:italic relative z-10"
          placeholder="Buscar ativos (ex: PETR4, AAPL, BTC-USD)"
        />
        <AnimatePresence>
          {query && (
            <motion.button 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => setQuery('')}
              className="p-4 text-slate-500 hover:text-white transition-colors bg-white/5 rounded-2xl border border-white/5 mr-2 relative z-10 hover:bg-red-500 hover:border-red-500/30"
            >
              <X className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-4 pt-2">
        {['Ações', 'FIIs', 'Stocks', 'BDRs', 'Cripto'].map((type) => (
          <button 
            key={type} 
            onClick={() => setQuery(type)}
            className="px-8 py-3.5 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] hover:bg-white/10 hover:text-white transition-all whitespace-nowrap italic active:scale-95"
          >
            {type}
          </button>
        ))}
      </div>

      <div className="space-y-6 pt-6">
        <div className="flex items-center justify-between px-3">
          <h3 className="text-tiny font-black text-white/40 uppercase tracking-[0.25em] italic">
            {hasSearched ? `Resultados para "${debouncedQuery}"` : 'Ativos em Destaque'}
          </h3>
          {hasSearched && results.length > 0 && (
            <span className="text-[10px] font-black text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20 uppercase tracking-widest shadow-lg shadow-blue-500/5">
              {results.length} ENCONTRADOS
            </span>
          )}
        </div>
        
        <div className="overflow-hidden bg-slate-900/30 backdrop-blur-3xl border border-white/5 rounded-[3.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)]">
          <div className="divide-y divide-white/5">
            <AnimatePresence mode="popLayout">
              {(hasSearched ? results : mostSearched).map((asset, idx) => {
                const ticker = asset.symbol || asset.ticker;
                if (!ticker) return null;
                
                return (
                  <Link key={ticker} to={`/asset/${ticker.replace('.SA', '')}`}>
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: idx * 0.02 }}
                      className="py-10 px-10 flex flex-col md:flex-row md:items-center justify-between group cursor-pointer hover:bg-white/[0.03] transition-all relative overflow-hidden"
                    >
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-blue-600 rounded-r-full scale-y-0 group-hover:scale-y-100 transition-transform origin-center duration-500 shadow-[0_0_20px_rgba(59,130,246,0.6)]" />
                      <div className="absolute inset-0 bg-blue-600/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex items-center gap-8 relative z-10 mb-6 md:mb-0">
                        <div className="w-16 h-16 rounded-[1.25rem] bg-white p-3.5 shadow-2xl border border-white/10 group-hover:scale-110 transition-transform duration-700 shrink-0 flex items-center justify-center relative">
                          <div className="absolute inset-0 bg-blue-600/5 rounded-[1.25rem] opacity-0 group-hover:opacity-100 transition-opacity" />
                          <AssetIcon 
                            assetType={mapQuoteTypeToAssetType(asset)} 
                            ticker={ticker} 
                            className="w-full h-full relative z-10" 
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-4 mb-2">
                            <span className="text-display-sm text-white uppercase italic group-hover:text-blue-400 transition-colors tracking-tighter leading-none">
                              {ticker.replace('.SA', '')}
                            </span>
                            <span className="px-4 py-1.5 bg-white/5 text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] rounded-xl border border-white/5 shadow-inner italic">
                              {asset.exchange || 'B3'}
                            </span>
                          </div>
                          <div className="text-[10px] font-black text-slate-600 group-hover:text-slate-400 transition-colors uppercase tracking-[0.3em] italic opacity-60 truncate max-w-[200px] md:max-w-md">
                            {asset.shortname || asset.name || ticker}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center gap-4 justify-end">
                          <span className="text-display-tiny text-white uppercase italic">
                            {asset.currency || 'R$'} {asset.price || '---'}
                          </span>
                          {asset.change && (
                            <span className={`flex items-center text-[10px] font-black px-2 py-1 rounded-lg shadow-sm ${asset.positive !== false ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' : 'text-red-400 bg-red-500/10 border border-red-500/20'}`}>
                              {asset.change}
                              {asset.positive !== false ? <TrendingUp className="icon-xs ml-1" /> : <ArrowDownRight className="icon-xs ml-1 rotate-45" />}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-black text-slate-600 mt-1.5 uppercase tracking-widest italic flex items-center justify-end gap-1.5">
                          <div className="w-1 h-1 rounded-full bg-slate-700" />
                          {asset.type || asset.quoteType || 'EQUITY'}
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                );
              })}
            </AnimatePresence>
          </div>

          {query.length >= 2 && results.length === 0 && !loading && (
            <div className="p-24 text-center space-y-6">
              <div className="w-20 h-20 rounded-[2rem] bg-white/5 flex items-center justify-center mx-auto border border-white/5 shadow-inner">
                <SearchIcon className="text-slate-700 icon-lg" />
              </div>
              <div className="space-y-2">
                <p className="text-display-tiny text-white uppercase italic">Nenhum ativo encontrado</p>
                <p className="text-tiny font-bold text-slate-500 uppercase tracking-[0.2em]">Não encontramos resultados para "{query}"</p>
              </div>
              <button 
                onClick={() => setQuery('')}
                className="px-8 py-3 bg-white/5 hover:bg-white/10 text-blue-500 text-tiny font-black uppercase tracking-widest rounded-2xl border border-blue-500/20 transition-all"
              >
                Limpar Busca
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
