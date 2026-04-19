import { PageHeader } from '../components/ui/PageHeader';
import { Search as SearchIcon, TrendingUp, ArrowUpRight, ArrowDownRight, Loader2, X, Layers, Globe, Activity } from 'lucide-react';
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
        const data = await financeService.search(debouncedQuery);
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

      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-4 pt-8">
        {[
          { label: 'Ações', icon: TrendingUp },
          { label: 'FIIs', icon: Layers },
          { label: 'Stocks', icon: Globe },
          { label: 'BDRs', icon: Activity },
          { label: 'Cripto', icon: SearchIcon }
        ].map((type) => (
          <button 
            key={type.label} 
            onClick={() => setQuery(type.label)}
            className={`group px-6 py-4 rounded-2xl border transition-all whitespace-nowrap italic flex items-center gap-3 ${
              query === type.label 
                ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]' 
                : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10 hover:text-slate-300'
            }`}
          >
            <type.icon className={`w-4 h-4 ${query === type.label ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{type.label}</span>
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
              <div className="overflow-hidden bg-slate-900/40 backdrop-blur-3xl border border-white/5 rounded-2xl md:rounded-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)]">
          <div className="divide-y divide-white/5">
            <AnimatePresence mode="popLayout">
              {(hasSearched ? results : mostSearched).map((asset, idx) => {
                const ticker = asset.symbol || asset.ticker;
                if (!ticker) return null;
                
                return (
                  <Link key={ticker} to={`/asset/${ticker.replace('.SA', '')}`}>
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ delay: idx * 0.02 }}
                      className="py-4 px-4 md:py-5 md:px-6 flex items-center justify-between group cursor-pointer hover:bg-white/[0.03] transition-all relative overflow-hidden"
                    >
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r-full scale-y-0 group-hover:scale-y-100 transition-transform origin-center duration-300 shadow-[0_0_15px_rgba(59,130,246,0.6)]" />
                      
                      <div className="flex items-center gap-4 relative z-10 flex-1 min-w-0">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white p-2 shadow-xl border border-white/10 group-hover:scale-105 transition-transform duration-500 shrink-0 flex items-center justify-center relative">
                          <div className="absolute inset-0 bg-blue-600/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                          <AssetIcon 
                            assetType={mapQuoteTypeToAssetType(asset)} 
                            ticker={ticker} 
                            className="w-full h-full relative z-10" 
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-display-tiny text-sm text-white uppercase italic group-hover:text-blue-400 transition-colors tracking-tighter leading-none">
                              {ticker.replace('.SA', '')}
                            </span>
                            <div className="flex items-center gap-1.5 font-black uppercase text-[8px] tracking-[0.15em] italic">
                              <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-500 rounded-md border border-blue-500/10">
                                {asset.exchange || 'B3'}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded-md border ${
                                (asset.type || asset.quoteType) === 'EQUITY' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/10' :
                                (asset.type || asset.quoteType) === 'ETF' ? 'bg-purple-500/10 text-purple-500 border-purple-500/10' :
                                (asset.type || asset.quoteType) === 'CRYPTOCURRENCY' ? 'bg-amber-500/10 text-amber-500 border-amber-500/10' :
                                'bg-slate-500/10 text-slate-500 border-slate-500/10'
                              }`}>
                                {asset.type || asset.quoteType || 'EQUITY'}
                              </span>
                            </div>
                          </div>
                          <div className="text-[9px] font-black text-slate-500 group-hover:text-slate-400 transition-colors uppercase tracking-[0.2em] italic opacity-60 truncate">
                            {asset.shortname || asset.name || ticker}
                          </div>
                        </div>
                      </div>

                      <div className="text-right ml-4 shrink-0">
                        <div className="flex flex-col items-end">
                          <div className="text-display-tiny text-sm text-white uppercase italic tracking-tighter">
                             {asset.currency === 'BRL' ? 'R$' : (asset.currency || 'R$')} {asset.price || '---'}
                          </div>
                          {asset.change && (
                            <div className={`flex items-center text-[9px] font-black mt-0.5 ${asset.positive !== false ? 'text-emerald-400' : 'text-red-400'}`}>
                              {asset.change}
                              {asset.positive !== false ? <TrendingUp className="w-2.5 h-2.5 ml-0.5" /> : <ArrowDownRight className="w-2.5 h-2.5 ml-0.5 rotate-45" />}
                            </div>
                          )}
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
