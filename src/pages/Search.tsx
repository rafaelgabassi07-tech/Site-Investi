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
      return;
    }

    const performSearch = async () => {
      setLoading(true);
      try {
        const data = await financeService.search(debouncedQuery);
        setResults(data);
      } catch (err) {
        console.error('Search failed', err);
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

      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
          {loading ? (
            <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
          ) : (
            <SearchIcon className="h-5 w-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
          )}
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="block w-full pl-12 pr-12 py-5 bg-[#0f172a] border border-slate-800 rounded-[2rem] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all shadow-2xl"
          placeholder="Buscar ativos (ex: PETR4, AAPL, BTC-USD)"
        />
        {query && (
          <button 
            onClick={() => setQuery('')}
            className="absolute inset-y-0 right-0 pr-5 flex items-center text-slate-500 hover:text-white transition-colors"
          >
            <X size={20} />
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
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">
            {results.length > 0 ? `Resultados para "${debouncedQuery}"` : 'Ativos em Destaque'}
          </h3>
          {results.length > 0 && (
            <span className="text-xxs font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
              {results.length} ENCONTRADOS
            </span>
          )}
        </div>
        
        <div className="bg-[#0f172a] border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
          <div className="divide-y divide-slate-800/50">
            <AnimatePresence mode="popLayout">
              {(results.length > 0 ? results : mostSearched).map((asset, idx) => (
                <Link key={asset.symbol || asset.ticker} to={`/asset/${(asset.symbol || asset.ticker).replace('.SA', '')}`}>
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.03 }}
                    className="p-5 flex items-center justify-between group cursor-pointer hover:bg-slate-800/30 transition-all relative"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 scale-y-0 group-hover:scale-y-100 transition-transform origin-top" />
                    
                    <div className="flex items-center gap-5">
                      <AssetIcon 
                        assetType={mapQuoteTypeToAssetType(asset)} 
                        ticker={asset.symbol || asset.ticker} 
                        className="w-12 h-12" 
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-white text-lg tracking-tight group-hover:text-blue-400 transition-colors">
                            {(asset.symbol || asset.ticker).replace('.SA', '')}
                          </span>
                          <span className="px-1.5 py-0.5 bg-slate-800 text-slate-500 text-[8px] font-black uppercase tracking-tighter rounded border border-slate-700">
                            {asset.exchange || 'B3'}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-slate-500 mt-0.5 uppercase tracking-wider line-clamp-1">
                          {asset.shortname || asset.name}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-3 justify-end">
                        <span className="font-black text-white text-lg tracking-tighter">
                          {asset.currency || 'R$'} {asset.price || '---'}
                        </span>
                        {asset.change && (
                          <span className={`flex items-center text-xxs font-black px-1.5 py-0.5 rounded ${asset.positive !== false ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>
                            {asset.change}
                            {asset.positive !== false ? <ArrowUpRight size={12} className="ml-0.5" /> : <ArrowDownRight size={12} className="ml-0.5" />}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-black text-slate-600 mt-1 uppercase tracking-widest">
                        {asset.type || 'EQUITY'}
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
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
