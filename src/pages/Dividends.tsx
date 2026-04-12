import { useState, useEffect } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Calendar, DollarSign, ArrowUpRight, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { financeService } from '../services/financeService';
import { usePortfolio } from '../hooks/usePortfolio';

export default function Dividends() {
  const { portfolio } = usePortfolio();
  const [dividends, setDividends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Todos');

  useEffect(() => {
    async function fetchAllDividends() {
      setLoading(true);
      try {
        // Use portfolio tickers or defaults
        const tickers = portfolio.length > 0 
          ? portfolio.map(p => p.ticker)
          : ['PETR4', 'VALE3', 'ITUB4', 'BBAS3', 'MXRF11', 'BBDC4', 'ABEV3'];
        
        const results = await Promise.all(
          tickers.slice(0, 10).map(async (ticker) => {
            try {
              const divs = await financeService.getAssetDividends(ticker);
              // Filter only recent/upcoming if possible, but Yahoo returns historical
              // For a real "Agenda", we'd need a different source or filter
              return divs.slice(0, 3).map(d => ({
                ...d,
                ticker,
                name: ticker // We'd need a name mapping or fetch details
              }));
            } catch {
              return [];
            }
          })
        );

        const flatDividends = results.flat().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setDividends(flatDividends);
      } catch (error) {
        console.error('Error fetching dividends:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAllDividends();
  }, [portfolio]);

  const filteredDividends = dividends.filter(d => {
    if (filter === 'Todos') return true;
    // Simple heuristic for filtering by type if we had it
    return true; 
  });

  return (
    <div className="space-y-3 pb-12">
      <PageHeader 
        title="Agenda de Dividendos"
        description="Acompanhe os pagamentos de proventos dos seus ativos."
        icon={Calendar}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2 space-y-3">
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {['Todos', 'Ações', 'FIIs', 'BDRs'].map((type) => (
              <button 
                key={type} 
                onClick={() => setFilter(type)}
                className={`px-5 py-2 rounded-xl border text-sm font-semibold transition-colors ${
                  filter === type 
                    ? 'bg-emerald-600 border-emerald-500 text-white shadow-md' 
                    : 'bg-slate-800/30 border-slate-800 text-slate-300 hover:bg-slate-800/50'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="animate-spin text-emerald-500" size={32} />
              <p className="text-slate-500 font-medium">Buscando proventos...</p>
            </div>
          ) : (
            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800/50 shadow-lg">
              {filteredDividends.length > 0 ? filteredDividends.map((item, idx) => {
                const date = new Date(item.date);
                const day = date.getDate().toString().padStart(2, '0');
                const month = date.toLocaleString('pt-BR', { month: 'short' }).toUpperCase();
                
                return (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-5 sm:p-6 flex items-center justify-between group hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-slate-800/50 rounded-xl flex flex-col items-center justify-center border border-slate-800 group-hover:border-emerald-500/30 transition-colors">
                        <span className="text-xxs font-bold text-slate-500">{month}</span>
                        <span className="text-xl font-bold text-white">{day}</span>
                      </div>
                      <div>
                        <div className="font-bold text-white text-lg tracking-tight group-hover:text-emerald-400 transition-colors">
                          {item.ticker}
                        </div>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-xxs font-bold rounded-md uppercase">
                            Provento
                          </span>
                          <span className="text-xs text-slate-500 font-medium">Data Ex: {date.toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-white text-lg">R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                      <div className="text-xxs text-slate-500 font-bold uppercase mt-1">Por Ação</div>
                    </div>
                  </motion.div>
                );
              }) : (
                <div className="p-20 text-center text-slate-500">
                  <p className="font-medium">Nenhum provento recente encontrado.</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-lg">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/5 blur-[60px] -z-10" />
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <DollarSign size={20} className="text-emerald-500" />
              </div>
              <h3 className="text-lg font-bold text-white">Resumo de Proventos</h3>
            </div>
            
            <div className="space-y-6">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Total Recebido (Histórico)</p>
                <h4 className="text-3xl font-black text-white tracking-tight">
                  R$ {dividends.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h4>
              </div>
              
              <div className="pt-6 border-t border-slate-800/50">
                <p className="text-xxs text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                  Os valores acima são baseados no histórico de proventos dos ativos selecionados.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <ArrowUpRight size={18} className="text-emerald-500" />
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Dica Nexus</h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Reinvestir seus dividendos pode acelerar drasticamente o efeito dos juros compostos em sua carteira a longo prazo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
