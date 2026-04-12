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
    minROE: '',
    minMargemLiquida: '',
    minVPA: '',
  });
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'dy', direction: 'desc' });

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

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const sortedResults = [...results].sort((a, b) => {
    const parse = (v: any) => {
      if (typeof v === 'number') return v;
      if (typeof v === 'string') return parseFloat(v.replace('%', '').replace(',', '.')) || 0;
      return 0;
    };

    let aVal, bVal;
    switch (sortConfig.key) {
      case 'ticker': aVal = a.ticker; bVal = b.ticker; break;
      case 'price': aVal = parse(a.results.precoAtual); bVal = parse(b.results.precoAtual); break;
      case 'dy': aVal = parse(a.results.dividendYield); bVal = parse(b.results.dividendYield); break;
      case 'pl': aVal = parse(a.results.pl); bVal = parse(b.results.pl); break;
      case 'pvp': aVal = parse(a.results.pvp); bVal = parse(b.results.pvp); break;
      default: return 0;
    }

    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

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
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <SlidersHorizontal size={18} className="text-blue-500" />
              <h3 className="text-sm font-semibold text-white">Filtros</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-2 block">Tipo de Ativo</label>
                <select 
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-slate-800/30 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  <option value="ACAO">Ações</option>
                  <option value="FII">FIIs</option>
                  <option value="BDR">BDRs</option>
                  <option value="ETF">ETFs</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 mb-2 block">Dividend Yield Mín. (%)</label>
                <input 
                  type="number"
                  placeholder="Ex: 6"
                  value={filters.minDY}
                  onChange={(e) => setFilters({...filters, minDY: e.target.value})}
                  className="w-full bg-[#0f172a] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 mb-2 block">P/L Máximo</label>
                <input 
                  type="number"
                  placeholder="Ex: 15"
                  value={filters.maxPL}
                  onChange={(e) => setFilters({...filters, maxPL: e.target.value})}
                  className="w-full bg-[#0f172a] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 mb-2 block">P/VP Máximo</label>
                <input 
                  type="number"
                  placeholder="Ex: 1.5"
                  value={filters.maxPVP}
                  onChange={(e) => setFilters({...filters, maxPVP: e.target.value})}
                  className="w-full bg-[#0f172a] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 mb-2 block">ROE Mínimo (%)</label>
                <input 
                  type="number"
                  placeholder="Ex: 10"
                  value={filters.minROE}
                  onChange={(e) => setFilters({...filters, minROE: e.target.value})}
                  className="w-full bg-[#0f172a] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 mb-2 block">Margem Líq. Mín. (%)</label>
                <input 
                  type="number"
                  placeholder="Ex: 10"
                  value={filters.minMargemLiquida}
                  onChange={(e) => setFilters({...filters, minMargemLiquida: e.target.value})}
                  className="w-full bg-[#0f172a] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 mb-2 block">VPA Mínimo</label>
                <input 
                  type="number"
                  placeholder="Ex: 5"
                  value={filters.minVPA}
                  onChange={(e) => setFilters({...filters, minVPA: e.target.value})}
                  className="w-full bg-[#0f172a] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
              </div>
            </div>

            <button 
              onClick={handleSearch}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm text-sm"
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
                className="h-full flex flex-col items-center justify-center py-20 text-center bg-slate-800/10 border border-slate-800 border-dashed rounded-2xl"
              >
                <div className="w-16 h-16 rounded-full bg-slate-800/30 flex items-center justify-center mb-6 border border-slate-800">
                  <Filter size={24} className="text-slate-500" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Pronto para filtrar?</h3>
                <p className="text-slate-400 max-w-xs text-sm font-medium">Ajuste os filtros ao lado para encontrar as melhores oportunidades do mercado.</p>
              </motion.div>
            ) : loading ? (
              <div className="h-full flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                <p className="text-slate-500 font-medium text-sm">Analisando Mercado...</p>
              </div>
            ) : results.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center py-20 text-center bg-[#0f172a] border border-slate-800 rounded-2xl shadow-sm"
              >
                <h3 className="text-lg font-bold text-white mb-2">Nenhum ativo encontrado</h3>
                <p className="text-slate-400 max-w-xs text-sm font-medium">Tente ajustar seus filtros para obter mais resultados.</p>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between px-2">
                  <span className="text-sm font-semibold text-slate-400">{results.length} Ativos Encontrados</span>
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
                    <ArrowUpDown size={14} /> Ordenado por {sortConfig.key.toUpperCase()} ({sortConfig.direction === 'asc' ? 'Cresc.' : 'Decresc.'})
                  </div>
                </div>

                <div className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-800/50 bg-slate-800/30">
                          <th className="p-5 text-xs font-semibold text-slate-400 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('ticker')}>
                            <div className="flex items-center gap-2">Ativo {sortConfig.key === 'ticker' && <ArrowUpDown size={12} />}</div>
                          </th>
                          <th className="p-5 text-xs font-semibold text-slate-400 text-right cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('price')}>
                            <div className="flex items-center justify-end gap-2">Preço {sortConfig.key === 'price' && <ArrowUpDown size={12} />}</div>
                          </th>
                          <th className="p-5 text-xs font-semibold text-slate-400 text-right cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('dy')}>
                            <div className="flex items-center justify-end gap-2">DY (%) {sortConfig.key === 'dy' && <ArrowUpDown size={12} />}</div>
                          </th>
                          <th className="p-5 text-xs font-semibold text-slate-400 text-right cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('pl')}>
                            <div className="flex items-center justify-end gap-2">P/L {sortConfig.key === 'pl' && <ArrowUpDown size={12} />}</div>
                          </th>
                          <th className="p-5 text-xs font-semibold text-slate-400 text-right cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('pvp')}>
                            <div className="flex items-center justify-end gap-2">P/VP {sortConfig.key === 'pvp' && <ArrowUpDown size={12} />}</div>
                          </th>
                          <th className="p-5"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {sortedResults.map((item, idx) => (
                          <tr key={idx} className="group hover:bg-slate-800/30 transition-colors">
                            <td className="p-5">
                              <div className="flex items-center gap-4">
                                <AssetIcon assetType={type as any} ticker={item.ticker} className="w-10 h-10" />
                                <div>
                                  <div className="font-bold text-white group-hover:text-blue-400 transition-colors">{item.ticker}</div>
                                  <div className="text-xs font-medium text-slate-500 mt-0.5 truncate max-w-[120px]">{item.name}</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-5 text-right text-sm text-white font-medium">R$ {item.results.precoAtual || '0,00'}</td>
                            <td className="p-5 text-right text-sm text-emerald-400 font-medium">{item.results.dividendYield || '0,00%'}</td>
                            <td className="p-5 text-right text-sm text-slate-300 font-medium">{item.results.pl || 'N/A'}</td>
                            <td className="p-5 text-right text-sm text-slate-300 font-medium">{item.results.pvp || 'N/A'}</td>
                            <td className="p-5 text-right">
                              <Link to={`/asset/${item.ticker}`} className="w-8 h-8 rounded-lg bg-slate-800/50 flex items-center justify-center hover:bg-blue-500/20 hover:text-blue-400 transition-all text-slate-400 ml-auto">
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
