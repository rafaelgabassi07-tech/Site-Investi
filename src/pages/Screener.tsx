import { useState } from 'react';
import { Filter, Search, Loader2, ArrowUpDown, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { financeService } from '../services/financeService';
import { AssetIcon } from '../components/ui/AssetIcon';
import { PageHeader } from '../components/ui/PageHeader';

export default function Screener() {
  const [type, setType] = useState('ACAO');
  const [filters, setFilters] = useState({
    minDY: '',
    maxPL: '',
    maxPVP: '',
  });
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    setHasSearched(true);
    try {
      const data = await financeService.getScreener(filters, type);
      setResults(data);
    } catch (error) {
      console.error('Screener failed:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-24">
      <PageHeader 
        title="Busca Avançada"
        description="Filtre ativos por indicadores fundamentalistas."
        icon={Filter}
      />

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <SlidersHorizontal size={18} className="text-blue-500" />
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Filtros</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Tipo de Ativo</label>
                <select 
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="ACAO">Ações</option>
                  <option value="FII">FIIs</option>
                  <option value="BDR">BDRs</option>
                  <option value="ETF">ETFs</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Dividend Yield Mín. (%)</label>
                <input 
                  type="number"
                  placeholder="Ex: 6"
                  value={filters.minDY}
                  onChange={(e) => setFilters({...filters, minDY: e.target.value})}
                  className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">P/L Máximo</label>
                <input 
                  type="number"
                  placeholder="Ex: 15"
                  value={filters.maxPL}
                  onChange={(e) => setFilters({...filters, maxPL: e.target.value})}
                  className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">P/VP Máximo</label>
                <input 
                  type="number"
                  placeholder="Ex: 1.5"
                  value={filters.maxPVP}
                  onChange={(e) => setFilters({...filters, maxPVP: e.target.value})}
                  className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <button 
              onClick={handleSearch}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20 uppercase tracking-widest text-xs"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
              {loading ? 'Filtrando...' : 'Aplicar Filtros'}
            </button>
          </div>
        </div>

        {/* Results Area */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {!hasSearched ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center py-20 text-center bg-white/5 border border-white/10 border-dashed rounded-[2.5rem]"
              >
                <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mb-6">
                  <Filter size={32} className="text-slate-600" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Pronto para filtrar?</h3>
                <p className="text-slate-500 max-w-xs text-sm">Ajuste os filtros ao lado para encontrar as melhores oportunidades do mercado.</p>
              </motion.div>
            ) : loading ? (
              <div className="h-full flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Analisando Mercado...</p>
              </div>
            ) : results.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center py-20 text-center bg-white/5 border border-white/10 rounded-[2.5rem]"
              >
                <h3 className="text-xl font-bold text-white mb-2">Nenhum ativo encontrado</h3>
                <p className="text-slate-500 max-w-xs text-sm">Tente ajustar seus filtros para obter mais resultados.</p>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between px-4">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{results.length} Ativos Encontrados</span>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                    <ArrowUpDown size={14} /> Ordenado por DY
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-white/5">
                          <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Ativo</th>
                          <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Preço</th>
                          <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">DY (%)</th>
                          <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">P/L</th>
                          <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">P/VP</th>
                          <th className="p-6"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {results.map((item, idx) => (
                          <tr key={idx} className="group hover:bg-white/5 transition-colors">
                            <td className="p-6">
                              <div className="flex items-center gap-4">
                                <AssetIcon assetType={type as any} ticker={item.ticker} className="w-10 h-10" />
                                <div>
                                  <div className="font-black text-white group-hover:text-blue-400 transition-colors">{item.ticker}</div>
                                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate max-w-[120px]">{item.name}</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-6 text-right font-mono text-sm text-white">R$ {item.results.precoAtual || '0,00'}</td>
                            <td className="p-6 text-right font-mono text-sm text-emerald-400">{item.results.dividendYield || '0,00%'}</td>
                            <td className="p-6 text-right font-mono text-sm text-slate-300">{item.results.pl || 'N/A'}</td>
                            <td className="p-6 text-right font-mono text-sm text-slate-300">{item.results.pvp || 'N/A'}</td>
                            <td className="p-6 text-right">
                              <Link to={`/asset/${item.ticker}`} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-blue-500/20 hover:text-blue-500 transition-all">
                                <ChevronRight size={18} />
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
