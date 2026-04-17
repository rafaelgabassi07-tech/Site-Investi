import { usePortfolio } from '../hooks/usePortfolio';
import { Loader2, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import { useMemo } from 'react';
import { motion } from 'motion/react';
import { AssetIcon } from './ui/AssetIcon';
import { useNavigate } from 'react-router-dom';

export function AssetList() {
  const { portfolio, loading } = usePortfolio();
  const navigate = useNavigate();

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
    <div className="flex flex-col items-center justify-center py-12 gap-6">
      <Loader2 className="animate-spin text-blue-500 icon-lg" />
      <p className="text-label text-slate-500 uppercase tracking-widest">Sincronizando ativos...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {assetTypes.length === 0 ? (
        <div className="py-20 text-center bg-slate-900/20 border border-dashed border-white/5 rounded-[2.5rem]">
          <p className="text-display-tiny text-slate-500 uppercase italic tracking-widest">Nenhum ativo detectado.</p>
        </div>
      ) : (
        assetTypes.map((type) => {
          const items = groupedPortfolio[type];
          const totalTypeCurrent = items.reduce((sum, item) => sum + (item.currentValue || item.totalInvested), 0);
          const totalTypeInvested = items.reduce((sum, item) => sum + item.totalInvested, 0);
          const totalTypeProfit = totalTypeCurrent - totalTypeInvested;
          const typeProfitPerc = totalTypeInvested > 0 ? (totalTypeProfit / totalTypeInvested) * 100 : 0;

          return (
            <div key={type} className="space-y-4">
              <div className="flex items-center justify-between px-1 md:px-6 pt-6 border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-8 bg-blue-600 rounded-full" />
                  <h3 className="text-display-xs text-white uppercase italic tracking-tighter">{type}</h3>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-display-tiny text-white uppercase italic">R$ {totalTypeCurrent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  <span className={`text-[10px] font-black italic ${totalTypeProfit >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                    {totalTypeProfit >= 0 ? '+' : ''}{typeProfitPerc.toFixed(2)}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                {/* Desktop Table (Condensed) */}
                <div className="hidden md:block overflow-hidden bg-slate-900/20 border border-white/5 rounded-2xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/[0.02] border-b border-white/5">
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Ativo</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest text-right">Posição</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest text-right">Preço Médio</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest text-right">Valor Atual</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest text-right">Performance</th>
                        <th className="px-6 py-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {items.map((item) => {
                        const profit = item.profit || 0;
                        const isPositive = profit >= 0;
                        return (
                          <tr 
                            key={item.ticker} 
                            className="hover:bg-white/[0.04] transition-all group cursor-pointer"
                            onClick={() => handleFetchDetails(item.ticker, item.assetType)}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-4">
                                <AssetIcon assetType={item.assetType} ticker={item.ticker} className="w-10 h-10 rounded-xl bg-white p-1" />
                                <div>
                                  <div className="text-display-tiny text-white uppercase italic group-hover:text-blue-500 transition-colors">{item.ticker}</div>
                                  <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest opacity-60">{item.assetType}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right font-black text-slate-400 text-[10px]">{item.totalQuantity} <span className="opacity-30">UND</span></td>
                            <td className="px-6 py-4 text-right font-black text-slate-400 text-[10px]">R$ {item.averagePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            <td className="px-6 py-4 text-right text-display-tiny text-white uppercase italic">R$ {(item.currentValue || item.totalInvested).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            <td className={`px-6 py-4 text-right ${isPositive ? 'text-emerald-500' : 'text-red-400'}`}>
                              <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black italic">R$ {Math.abs(profit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                <span className="text-[9px] font-black opacity-80">{isPositive ? '+' : '-'}{Math.abs(item.profitPercentage || 0).toFixed(2)}%</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-blue-500" />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile List (Condensed) */}
                <div className="md:hidden space-y-3 px-1 lg:px-2">
                  {items.map((item) => {
                    const profit = item.profit || 0;
                    const isPositive = profit >= 0;
                    return (
                      <div
                        key={item.ticker}
                        onClick={() => handleFetchDetails(item.ticker, item.assetType)}
                        className="p-4 bg-white/5 border border-white/5 rounded-2xl active:scale-[0.98] transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <AssetIcon assetType={item.assetType} ticker={item.ticker} className="w-10 h-10 rounded-xl bg-white p-1" />
                            <div>
                              <div className="text-display-tiny text-white uppercase italic">{item.ticker}</div>
                              <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{item.assetType}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-display-tiny text-white uppercase italic">
                              R$ {(item.currentValue || item.totalInvested).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                            <div className={`text-[9px] font-black flex items-center justify-end gap-1 uppercase tracking-widest ${isPositive ? 'text-emerald-500' : 'text-red-400'}`}>
                              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              {isPositive ? '+' : '-'}{Math.abs(item.profitPercentage || 0).toFixed(2)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
