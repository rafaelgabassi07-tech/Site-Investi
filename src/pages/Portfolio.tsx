import { usePortfolio } from '../hooks/usePortfolio';
import { Loader2, Briefcase, ChevronRight, Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { useMemo } from 'react';
import { motion } from 'motion/react';
import { PageHeader } from '../components/ui/PageHeader';
import { AssetIcon } from '../components/ui/AssetIcon';
import { useNavigate } from 'react-router-dom';

export default function Portfolio() {
  const { portfolio, loading } = usePortfolio();
  const navigate = useNavigate();

  // Grouping logic
  const groupedPortfolio = useMemo(() => {
    return portfolio.reduce((acc, item) => {
      const type = item.assetType || 'OUTROS';
      if (!acc[type]) acc[type] = [];
      acc[type].push(item);
      return acc;
    }, {} as Record<string, typeof portfolio>);
  }, [portfolio]);

  const assetTypes = useMemo(() => Object.keys(groupedPortfolio).sort(), [groupedPortfolio]);

  const handleFetchDetails = (ticker: string, assetType: string) => {
    navigate(`/portfolio/analise/${ticker}?type=${assetType}`);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
      <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Sincronizando Invest Portfolio...</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <PageHeader 
        title="Meus Ativos"
        description={<>Gestão estratégica de ativos e alocação via <span className="text-blue-500 font-bold">Invest Engine</span>.</>}
        icon={Briefcase}
        actions={
          <button 
            onClick={() => navigate('/portfolio/lancamentos')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20"
          >
            <Plus size={16} />
            Nova Operação
          </button>
        }
      />

      <div className="space-y-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-8"
        >
          {assetTypes.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-slate-800 rounded-3xl">
              <p className="text-slate-500 font-medium">Nenhum ativo em carteira.</p>
            </div>
          ) : (
            assetTypes.map((type) => {
              const items = groupedPortfolio[type];
              const totalTypeInvested = items.reduce((sum, item) => sum + item.totalInvested, 0);
              const totalTypeCurrent = items.reduce((sum, item) => sum + (item.currentValue || item.totalInvested), 0);
              const totalTypeProfit = totalTypeCurrent - totalTypeInvested;
              const typeProfitPerc = totalTypeInvested > 0 ? (totalTypeProfit / totalTypeInvested) * 100 : 0;

              return (
                <div key={type} className="space-y-2">
                  <div className="flex items-center justify-between px-2 pt-4">
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-4 bg-blue-600 rounded-full" />
                      <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">{type}</h3>
                      <span className="text-[10px] font-bold text-slate-600">
                        {items.length} {items.length === 1 ? 'ATIVO' : 'ATIVOS'}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-white">R$ {totalTypeCurrent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${totalTypeProfit >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-400'}`}>
                          {totalTypeProfit >= 0 ? '+' : ''}{typeProfitPerc.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pb-6">
                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-full">
                        <thead>
                          <tr className="border-b border-slate-800/30">
                            <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ativo</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Qtd.</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">P. Médio</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Valor Atual</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Resultado</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/20">
                          {items.map((item, idx) => {
                            const profit = item.profit || 0;
                            const isPositive = profit >= 0;
                            
                            return (
                              <motion.tr 
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.01 }}
                                key={item.ticker} 
                                className="hover:bg-slate-800/10 transition-all group cursor-pointer"
                                onClick={() => handleFetchDetails(item.ticker, item.assetType)}
                              >
                                <td className="px-4 py-4">
                                  <div className="flex items-center gap-3">
                                    <AssetIcon assetType={item.assetType} ticker={item.ticker} className="w-8 h-8" />
                                    <div>
                                      <div className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors">{item.ticker}</div>
                                      <div className="text-[10px] font-medium text-slate-600 uppercase tracking-tighter">{item.assetType}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-4 text-right font-medium text-xs text-slate-400">{item.totalQuantity}</td>
                                <td className="px-4 py-4 text-right font-medium text-xs text-slate-400">
                                  R$ {item.averagePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-4 py-4 text-right font-bold text-sm text-white">
                                  R$ {(item.currentValue || item.totalInvested).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </td>
                                <td className={`px-4 py-4 text-right font-bold text-xs ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                                  <div className="flex flex-col items-end">
                                    <span>R$ {Math.abs(profit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                    <span className="text-[10px] opacity-70 font-medium">{isPositive ? '+' : '-'}{Math.abs(item.profitPercentage || 0).toFixed(2)}%</span>
                                  </div>
                                </td>
                                <td className="px-4 py-4 text-right">
                                  <div className="flex justify-end">
                                    <div className="w-6 h-6 bg-slate-800/30 rounded flex items-center justify-center text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                                      <ChevronRight size={12} />
                                    </div>
                                  </div>
                                </td>
                              </motion.tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile List */}
                    <div className="md:hidden space-y-3">
                      {items.map((item, idx) => {
                        const profit = item.profit || 0;
                        const isPositive = profit >= 0;
                        return (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.02 }}
                            key={item.ticker}
                            onClick={() => handleFetchDetails(item.ticker, item.assetType)}
                            className="p-4 bg-slate-800/20 border border-slate-800/50 rounded-2xl active:scale-[0.98] transition-all"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <AssetIcon assetType={item.assetType} ticker={item.ticker} className="w-10 h-10" />
                                <div>
                                  <div className="font-bold text-white text-base leading-tight">{item.ticker}</div>
                                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{item.assetType}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-black text-white">
                                  R$ {(item.currentValue || item.totalInvested).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </div>
                                <div className={`text-[10px] font-bold flex items-center justify-end gap-1 ${isPositive ? 'text-emerald-500' : 'text-red-400'}`}>
                                  {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                  {isPositive ? '+' : '-'}{Math.abs(item.profitPercentage || 0).toFixed(2)}%
                                </div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800/50">
                              <div>
                                <p className="text-[10px] font-bold text-slate-600 uppercase mb-0.5">Quantidade</p>
                                <p className="text-xs font-bold text-slate-300">{item.totalQuantity}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] font-bold text-slate-600 uppercase mb-0.5">Preço Médio</p>
                                <p className="text-xs font-bold text-slate-300">R$ {item.averagePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="flex items-center gap-3 py-6 border-t border-slate-800/50 text-slate-400 text-sm font-medium"
      >
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.6)]" />
        <span>Invest Engine: Sincronização em Tempo Real Ativa</span>
        <div className="ml-auto flex items-center gap-3 opacity-60 text-xs">
          <span>v2.5.0</span>
          <div className="w-px h-3 bg-slate-700" />
          <span>Status: Optimal</span>
        </div>
      </motion.div>
    </div>
  );
}
