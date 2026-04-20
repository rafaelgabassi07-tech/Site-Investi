import { useState } from 'react';
import { Filter, Search, Loader2, ArrowUpDown, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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
        description="Filtros fundamentalistas."
        icon={Filter}
      />

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white/5 border border-white/5 rounded-xl md:rounded-2xl p-6 space-y-8 shadow-xl">
            <div className="flex items-center gap-3 pl-1">
              <SlidersHorizontal className="icon-sm text-blue-500" />
              <h3 className="text-label text-white uppercase italic tracking-tight">Filtros Inteligentes</h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-tiny font-black text-slate-500 mb-2 block uppercase tracking-widest pl-1 italic">Tipo de Ativo</label>
                <select 
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all shadow-inner"
                >
                  <option value="ACAO">Ações</option>
                  <option value="FII">FIIs</option>
                  <option value="BDR">BDRs</option>
                  <option value="ETF">ETFs</option>
                </select>
              </div>

              {[
                { label: 'Dividend Yield Mín. (%)', key: 'minDY', placeholder: 'Ex: 6' },
                { label: 'P/L Máximo', key: 'maxPL', placeholder: 'Ex: 15' },
                { label: 'P/VP Máximo', key: 'maxPVP', placeholder: 'Ex: 1.5' },
                { label: 'ROE Mínimo (%)', key: 'minROE', placeholder: 'Ex: 10' },
                { label: 'Margem Líq. Mín. (%)', key: 'minMargemLiquida', placeholder: 'Ex: 10' },
                { label: 'VPA Mínimo', key: 'minVPA', placeholder: 'Ex: 5' },
              ].map((f) => (
                <div className="space-y-2" key={f.key}>
                  <label className="text-tiny font-black text-slate-500 mb-2 block uppercase tracking-widest pl-1 italic">{f.label}</label>
                  <input 
                    type="number"
                    placeholder={f.placeholder}
                    value={filters[f.key as keyof typeof filters]}
                    onChange={(e) => setFilters({...filters, [f.key]: e.target.value})}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white font-black focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all shadow-inner"
                  />
                </div>
              ))}
            </div>

            <button 
              onClick={handleSearch}
              disabled={loading}
              className="btn-primary w-full shadow-lg shadow-blue-600/10"
            >
              {loading ? <Loader2 className="animate-spin icon-sm" /> : <Search className="icon-sm" />}
              {loading ? 'Analisando...' : 'Filtrar Mercado'}
            </button>
          </div>
        </div>

        {/* Results Area */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait" initial={false}>
            {!hasSearched ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center py-20 text-center bg-white/5 border border-white/5 border-dashed rounded-xl md:rounded-2xl"
              >
                <div className="w-20 h-20 rounded-xl md:rounded-2xl bg-white/5 flex items-center justify-center mb-6 border border-white/5 shadow-xl">
                  <Filter className="icon-lg text-slate-500" />
                </div>
                <h3 className="text-display-tiny text-white mb-2 uppercase italic">Pronto para filtrar?</h3>
                <p className="text-tiny font-bold text-slate-500 uppercase tracking-widest max-w-xs mx-auto leading-relaxed">Ajuste os filtros ao lado para encontrar as melhores oportunidades do mercado.</p>
              </motion.div>
            ) : loading ? (
              <div className="h-full flex flex-col items-center justify-center py-20 gap-6">
                <Loader2 className="icon-xl text-blue-500 animate-spin" />
                <p className="text-label text-slate-500 animate-pulse uppercase italic tracking-[0.2em]">Analisando Mercado...</p>
              </div>
            ) : results.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center py-20 text-center bg-white/5 border border-white/5 rounded-xl md:rounded-2xl shadow-xl"
              >
                <h3 className="text-display-tiny text-white mb-2 uppercase italic">Nenhum ativo encontrado</h3>
                <p className="text-tiny font-bold text-slate-400 max-w-xs mx-auto uppercase tracking-widest leading-relaxed">Tente ajustar seus filtros para obter mais resultados.</p>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between px-4">
                  <span className="text-label text-slate-400 uppercase italic tracking-tight">{results.length} Ativos Encontrados</span>
                  <div className="flex items-center gap-2 text-tiny font-black text-blue-400/60 uppercase tracking-widest">
                    <ArrowUpDown className="icon-xs" /> Ordenado por {sortConfig.key.toUpperCase()} ({sortConfig.direction === 'asc' ? 'Cresc.' : 'Decresc.'})
                  </div>
                </div>

                <div className="overflow-hidden bg-white/5 border border-white/5 rounded-xl md:rounded-2xl shadow-2xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-white/5 bg-white/5">
                          <th className="p-6 text-tiny font-black text-slate-500 uppercase tracking-[0.2em] cursor-pointer hover:text-white transition-colors pl-8" onClick={() => handleSort('ticker')}>
                            <div className="flex items-center gap-2 italic">Ativo {sortConfig.key === 'ticker' && <ArrowUpDown className="icon-xs" />}</div>
                          </th>
                          <th className="p-6 text-tiny font-black text-slate-500 uppercase tracking-[0.2em] text-right cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('price')}>
                            <div className="flex items-center justify-end gap-2 italic">Preço {sortConfig.key === 'price' && <ArrowUpDown className="icon-xs" />}</div>
                          </th>
                          <th className="p-6 text-tiny font-black text-slate-500 uppercase tracking-[0.2em] text-right cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('dy')}>
                            <div className="flex items-center justify-end gap-2 italic">DY (%) {sortConfig.key === 'dy' && <ArrowUpDown className="icon-xs" />}</div>
                          </th>
                          <th className="p-6 text-tiny font-black text-slate-500 uppercase tracking-[0.2em] text-right cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('pl')}>
                            <div className="flex items-center justify-end gap-2 italic">P/L {sortConfig.key === 'pl' && <ArrowUpDown className="icon-xs" />}</div>
                          </th>
                          <th className="p-6 text-tiny font-black text-slate-500 uppercase tracking-[0.2em] text-right cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('pvp')}>
                            <div className="flex items-center justify-end gap-2 italic">P/VP {sortConfig.key === 'pvp' && <ArrowUpDown className="icon-xs" />}</div>
                          </th>
                          <th className="p-6 pr-8"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {sortedResults.map((item, idx) => (
                          <tr key={idx} className="group hover:bg-white/5 transition-all">
                            <td className="p-6 pl-8">
                              <div className="flex items-center gap-5">
                                <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center p-2 shadow-xl border border-white/10 group-hover:scale-110 transition-transform duration-500 shrink-0">
                                  <AssetIcon assetType={type as any} ticker={item.ticker} className="w-full h-full" />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-display-tiny text-white group-hover:text-blue-400 transition-colors uppercase italic tracking-tight">{item.ticker}</div>
                                  <div className="text-tiny font-bold text-slate-500 mt-0.5 truncate max-w-[140px] uppercase tracking-widest">{item.name}</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-6 text-right text-display-tiny text-white uppercase italic">R$ {item.results.precoAtual || '0,00'}</td>
                            <td className="p-6 text-right text-display-tiny text-emerald-400 uppercase italic">{item.results.dividendYield || '0,00%'}</td>
                            <td className="p-6 text-right text-display-tiny text-slate-300 uppercase italic opacity-60">{item.results.pl || 'N/A'}</td>
                            <td className="p-6 text-right text-display-tiny text-slate-300 uppercase italic opacity-60">{item.results.pvp || 'N/A'}</td>
                            <td className="p-6 pr-8 text-right">
                              <Link to={`/asset/${item.ticker}`} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all text-slate-500 ml-auto border border-white/5 shadow-inner group/btn">
                                <ChevronRight className="icon-sm group-hover:translate-x-0.5 transition-transform" />
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
