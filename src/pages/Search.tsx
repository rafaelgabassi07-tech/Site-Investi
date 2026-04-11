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

  return (
    <div className="space-y-8 pb-24">
      <PageHeader 
        title="Busca"
        description="Encontre ativos, empresas e criptomoedas."
        icon={SearchIcon}
      />

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
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
          className="block w-full pl-12 pr-12 py-4 bg-[#0f172a] border border-slate-800 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
          placeholder="Buscar ativos ou empresas (ex: PETR4, VALE3)"
        />
        {query && (
          <button 
            onClick={() => setQuery('')}
            className="absolute inset-y-0 right-0 pr-5 flex items-center text-slate-500 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
        {['Ações', 'FIIs', 'Stocks', 'BDRs'].map((type) => (
          <button 
            key={type} 
            onClick={() => setQuery(type)}
            className="px-5 py-2 rounded-xl bg-slate-800/30 border border-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-800/50 transition-colors whitespace-nowrap shadow-sm"
          >
            {type}
          </button>
        ))}
      </div>

      <div className="space-y-4 pt-4">
        <h3 className="text-lg font-bold text-white tracking-tight mb-4">
          {results.length > 0 ? `Resultados para "${debouncedQuery}"` : 'Os mais buscados'}
        </h3>
        
        <div className="divide-y divide-slate-800/50 bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <AnimatePresence mode="popLayout">
            {(results.length > 0 ? results : mostSearched).map((asset, idx) => (
              <Link key={asset.symbol || asset.ticker} to={`/asset/${(asset.symbol || asset.ticker).replace('.SA', '')}`}>
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-4 sm:p-5 flex items-center justify-between group cursor-pointer hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <AssetIcon assetType="ACAO" ticker={asset.symbol || asset.ticker} className="w-10 h-10" />
                    <div>
                      <div className="font-bold text-white text-base group-hover:text-blue-400 transition-colors">
                        {(asset.symbol || asset.ticker).replace('.SA', '')} <span className="text-slate-500 font-medium ml-1">- {asset.shortname || asset.name}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="font-semibold text-sm text-slate-300">
                          {asset.currency || 'R$'} {asset.price || '---'}
                        </span>
                        {asset.change && (
                          <span className={`flex items-center text-xs font-semibold ${asset.positive !== false ? 'text-emerald-400' : 'text-red-400'}`}>
                            {asset.change}
                            {asset.positive !== false ? <ArrowUpRight size={14} className="ml-0.5" /> : <ArrowDownRight size={14} className="ml-0.5" />}
                          </span>
                        )}
                        <span className="text-xs text-slate-500 font-medium">
                          {asset.exchange || 'B3'}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </AnimatePresence>

          {query.length >= 2 && results.length === 0 && !loading && (
            <div className="p-12 text-center">
              <p className="text-slate-500 font-medium">Nenhum ativo encontrado para "{query}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
