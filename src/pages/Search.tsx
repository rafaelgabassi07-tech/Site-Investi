import { PageHeader } from '../components/ui/PageHeader';
import { Search as SearchIcon, TrendingUp, ArrowUpRight, ArrowDownRight, Loader2, X, Layers, Globe, Activity, ShieldAlert } from 'lucide-react';
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
  const [error, setError] = useState<string | null>(null);
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
      setError(null); // Clear error on new query
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
      setError(null);
      try {
        const data = await financeService.search(debouncedQuery);
        setResults(data || []);
        if (!data || data.length === 0) {
           // We keep results empty but don't show technical error if it's just no results
        }
      } catch (err: any) {
        console.error('Search failed', err);
        setError(err.message || 'O motor de busca Nexus está temporariamente inacessível.');
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

  const navItems = [
    { label: 'Ações BR', icon: TrendingUp, color: 'text-blue-500', active: 'bg-blue-600/20 border-blue-500/50', query: 'ações' },
    { label: 'FIIs', icon: Layers, color: 'text-emerald-500', active: 'bg-emerald-600/20 border-emerald-500/50', query: 'fiis' },
    { label: 'Stocks', icon: Globe, color: 'text-cyan-500', active: 'bg-cyan-600/20 border-cyan-500/50', query: 'stocks' },
    { label: 'BDRs', icon: Activity, color: 'text-purple-500', active: 'bg-purple-600/20 border-purple-500/50', query: 'bdrs' },
  ];

  return (
    <div className="space-y-4 pb-24 bg-background transition-colors duration-500">
      <PageHeader 
        title="Busca Global"
        description="Encontre ativos, empresas e criptomoedas em tempo real através da Nexus Engine."
        icon={SearchIcon}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-2 pb-2">
        {navItems.map((type) => (
          <button 
            key={type.label} 
            onClick={() => setQuery(type.query)}
            className={`group relative overflow-hidden p-2.5 rounded-xl border transition-all duration-300 flex items-center justify-center gap-2 ${
              query === type.query 
                ? `${type.active} text-foreground shadow-sm border-blue-500/50 scale-[1.02]` 
                : 'bg-card border-border text-muted-foreground hover:bg-secondary hover:border-blue-500/10'
            }`}
          >
            <type.icon className={`w-4 h-4 transition-all duration-300 ${query === type.query ? 'text-blue-500' : type.color}`} />
            <span className="text-[10px] font-black uppercase tracking-widest italic">{type.label}</span>
          </button>
        ))}
      </div>

      <div className="space-y-8 pt-8">
        <div className="flex items-center justify-between px-3">
          <h3 className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em] italic">
            {hasSearched ? `Resultados para "${debouncedQuery}"` : 'Ativos em Destaque'}
          </h3>
          {hasSearched && results.length > 0 && (
            <span className="text-[10px] font-black text-blue-500 bg-blue-500/10 px-4 py-1 rounded-full border border-blue-500/20 uppercase tracking-widest shadow-xl shadow-blue-500/5">
              {results.length} ENCONTRADOS
            </span>
          )}
        </div>

        {error ? (
          <div className="bg-red-500/5 border border-dashed border-red-500/20 rounded-2xl p-12 text-center space-y-4">
             <div className="flex justify-center">
                <div className="p-3 bg-red-500/10 rounded-full">
                   <ShieldAlert className="w-8 h-8 text-red-500" />
                </div>
             </div>
             <div className="space-y-1">
                <p className="text-sm font-black text-red-500 uppercase tracking-widest italic">Interrupção no Motor Nexus</p>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{error}</p>
             </div>
             <button 
              onClick={() => { setError(null); setDebouncedQuery(query); }}
              className="px-6 py-2 bg-secondary border border-border rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-accent transition-all"
             >
                Tentar Forçar Link
             </button>
          </div>
        ) : (
          <div className="overflow-hidden bg-card border border-border rounded-xl md:rounded-2xl shadow-2xl">
          <div className="divide-y divide-border">
            <AnimatePresence mode="popLayout">
              {(hasSearched ? results : mostSearched).map((asset, idx) => {
                const ticker = (asset.symbol || asset.ticker || '').replace('.SA', '');
                if (!ticker) return null;
                
                return (
                  <Link key={ticker} to={`/asset/${ticker}`}>
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ delay: idx * 0.02 }}
                      className="py-5 px-6 flex items-center justify-between group cursor-pointer hover:bg-secondary transition-all relative overflow-hidden"
                    >
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-blue-500 rounded-r-full scale-y-0 group-hover:scale-y-100 transition-transform origin-center duration-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                      
                      <div className="flex items-center gap-5 relative z-10 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-white p-2 shadow-xl border border-border group-hover:scale-110 transition-transform duration-500 shrink-0 flex items-center justify-center relative overflow-hidden">
                          <div className="absolute inset-0 bg-blue-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                          <AssetIcon 
                            assetType={mapQuoteTypeToAssetType(asset)} 
                            ticker={ticker} 
                            className="w-full h-full relative z-10" 
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-lg font-display font-black text-foreground uppercase italic group-hover:text-blue-500 transition-colors tracking-tighter leading-none">
                              {ticker}
                            </span>
                            <div className="flex items-center gap-1.5 font-black uppercase text-[8px] tracking-[0.2em] italic">
                              <span className="px-2 py-0.5 bg-secondary text-muted-foreground rounded-lg border border-border">
                                {asset.exchange || 'B3'}
                              </span>
                              <span className={`px-2 py-0.5 rounded-lg border ${
                                (asset.type || asset.quoteType) === 'EQUITY' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/10' :
                                (asset.type || asset.quoteType) === 'ETF' ? 'bg-purple-500/10 text-purple-500 border-purple-500/10' :
                                (asset.type || asset.quoteType) === 'CRYPTOCURRENCY' ? 'bg-amber-500/10 text-amber-500 border-amber-500/10' :
                                'bg-slate-500/10 text-slate-500 border-slate-500/10'
                              }`}>
                                {asset.type || asset.quoteType || 'EQUITY'}
                              </span>
                            </div>
                          </div>
                          <div className="text-[10px] font-bold text-muted-foreground group-hover:text-foreground transition-colors uppercase tracking-[0.25em] italic opacity-60 truncate">
                            {asset.shortname || asset.name || ticker}
                          </div>
                        </div>
                      </div>

                      <div className="text-right ml-4 shrink-0">
                        <div className="flex flex-col items-end gap-1">
                          <div className="text-lg font-display font-black text-foreground uppercase italic tracking-tighter group-hover:text-blue-500 transition-colors">
                             {asset.currency === 'BRL' ? 'R$' : (asset.currency || 'R$')} {asset.price || '---'}
                          </div>
                          {asset.change && (
                            <div className={`flex items-center text-[10px] font-black ${asset.positive !== false ? 'text-emerald-500' : 'text-red-500'}`}>
                              {asset.change}
                              {asset.positive !== false ? <TrendingUp className="w-3 h-3 ml-1" /> : <ArrowDownRight className="w-3 h-3 ml-1 rotate-45" />}
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
            <div className="p-24 text-center space-y-8">
              <div className="w-24 h-24 rounded-xl md:rounded-2xl bg-secondary flex items-center justify-center mx-auto border border-border shadow-inner">
                <SearchIcon className="text-muted-foreground icon-lg" />
              </div>
              <div className="space-y-3">
                <p className="text-xl font-display font-black text-foreground uppercase italic tracking-tight">Nenhum Ativo Encontrado</p>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.3em]">O motor Nexus não localizou resultados para "{query}"</p>
              </div>
              <button 
                onClick={() => setQuery('')}
                className="btn-primary"
              >
                Limpar Filtros
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  </div>
);
}
