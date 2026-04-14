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

      <div className="relative flex items-center w-full bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl focus-within:border-blue-500/50 transition-all p-1 overflow-hidden">
        <div className="pl-3 text-slate-500">
          {loading ? (
            <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
          ) : (
            <SearchIcon className="h-5 w-5 text-slate-500" />
          )}
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 min-w-0 bg-transparent border-none outline-none py-3 px-3 text-sm md:text-lg text-white placeholder:text-slate-600"
          placeholder="Buscar ativos (ex: PETR4, AAPL, BTC-USD)"
        />
        {query && (
          <button 
            onClick={() => setQuery('')}
            className="p-2 text-slate-500 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
        {['Ações', 'FIIs', 'Stocks', 'BDRs', 'Cripto'].map((type) => (
          <button 
            key={type} 
            onClick={() => setQuery(type)}
            className="px-6 py-2 rounded-2xl bg-slate-800/20 border border-slate-800/50 text-slate-400 text-xxs font-black uppercase tracking-widest hover:bg-slate-800/40 hover:text-white transition-all whitespace-nowrap"
          >
            {type}
          </button>
        ))}
      </div>

      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
            {hasSearched ? `Resultados para "${debouncedQuery}"` : 'Ativos em Destaque'}
          </h3>
          {hasSearched && results.length > 0 && (
            <span className="text-[9px] font-black text-blue-500 bg-blue-500/5 px-2 py-0.5 rounded border border-blue-500/10 uppercase tracking-widest">
              {results.length} ENCONTRADOS
            </span>
          )}
        </div>
        
        <div className="overflow-hidden">
          <div className="divide-y divide-slate-800/30">
            <AnimatePresence mode="popLayout">
              {(hasSearched ? results : mostSearched).map((asset, idx) => {
                const ticker = asset.symbol || asset.ticker;
                if (!ticker) return null;
                
                return (
                  <Link key={ticker} to={`/asset/${ticker.replace('.SA', '')}`}>
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: idx * 0.02 }}
                      className="py-4 px-2 flex items-center justify-between group cursor-pointer hover:bg-slate-800/20 transition-all rounded-2xl"
                    >
                      <div className="flex items-center gap-4">
                        <AssetIcon 
                          assetType={mapQuoteTypeToAssetType(asset)} 
                          ticker={ticker} 
                          className="w-10 h-10" 
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-white text-base tracking-tight group-hover:text-blue-400 transition-colors">
                              {ticker.replace('.SA', '')}
                            </span>
                            <span className="px-1.5 py-0.5 bg-slate-800/50 text-slate-500 text-[8px] font-black uppercase tracking-tighter rounded border border-slate-800">
                              {asset.exchange || 'B3'}
                            </span>
                          </div>
                          <div className="text-[10px] font-bold text-slate-500 mt-0.5 uppercase tracking-wider line-clamp-1">
                            {asset.shortname || asset.name || ticker}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center gap-3 justify-end">
                          <span className="font-black text-white text-base tracking-tighter">
                            {asset.currency || 'R$'} {asset.price || '---'}
                          </span>
                          {asset.change && (
                            <span className={`flex items-center text-[9px] font-black px-1.5 py-0.5 rounded ${asset.positive !== false ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>
                              {asset.change}
                              {asset.positive !== false ? <ArrowUpRight size={10} className="ml-0.5" /> : <ArrowDownRight size={10} className="ml-0.5" />}
                            </span>
                          )}
                        </div>
                        <div className="text-[9px] font-black text-slate-600 mt-1 uppercase tracking-[0.15em]">
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
            <div className="p-20 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto border border-slate-800">
                <SearchIcon className="text-slate-600" size={24} />
              </div>
              <p className="text-slate-500 font-bold text-sm">Nenhum ativo encontrado para "{query}"</p>
              <button 
                onClick={() => setQuery('')}
                className="text-blue-500 text-xs font-black uppercase tracking-widest hover:underline"
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
