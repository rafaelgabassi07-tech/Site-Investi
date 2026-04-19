import { usePortfolio } from '../hooks/usePortfolio';
import { Loader2, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import { useMemo } from 'react';
import { motion } from 'motion/react';
import { AssetIcon } from './ui/AssetIcon';
import { useNavigate } from 'react-router-dom';

export function AssetList() {
  const { portfolio, loading } = usePortfolio();
  const navigate = useNavigate();

  const totalPortfolioValue = useMemo(() => {
    return portfolio.reduce((sum, item) => sum + (item.currentValue || item.totalInvested), 0);
  }, [portfolio]);

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
            <div key={type} className="bg-white/5 dark:bg-slate-900/20 border border-white/5 rounded-[2.5rem] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-6 border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-8 bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.4)]" />
                  <h3 className="text-display-xs text-white uppercase italic tracking-tighter">{type}</h3>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-display-tiny text-white uppercase italic">R$ {totalTypeCurrent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-0.5">PATRIMÔNIO TOTAL</div>
                  </div>
                  <div className={`px-3 py-1.5 rounded-xl border flex flex-col items-center ${totalTypeProfit >= 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                    <span className="text-[10px] font-black italic leading-none">
                      {totalTypeProfit >= 0 ? '+' : ''}{typeProfitPerc.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-1">
                {/* Desktop Table (Condensed) */}
                <div className="hidden md:block">
                  <div className="flex items-center px-8 py-4 bg-white/[0.01] border-b border-white/5">
                    <div className="flex-1 text-[10px] font-black uppercase text-slate-500 tracking-widest italic">Ativo / Alocação</div>
                    <div className="w-32 text-right text-[10px] font-black uppercase text-slate-500 tracking-widest italic">Posição</div>
                    <div className="w-40 text-right text-[10px] font-black uppercase text-slate-500 tracking-widest italic">Custo Médio</div>
                    <div className="w-40 text-right text-[10px] font-black uppercase text-slate-500 tracking-widest italic">Valor Atual</div>
                    <div className="w-40 text-right text-[10px] font-black uppercase text-slate-500 tracking-widest italic">Ganhos / Perdas</div>
                    <div className="w-10"></div>
                  </div>
                  <div className="divide-y divide-white/5">
                    {items.map((item) => {
                      const profit = item.profit || 0;
                      const isPositive = profit >= 0;
                      const currentVal = item.currentValue || item.totalInvested;
                      const allocation = totalPortfolioValue > 0 ? (currentVal / totalPortfolioValue) * 100 : 0;
                      
                      return (
                        <div 
                          key={item.ticker} 
                          className="flex items-center px-8 py-6 hover:bg-white/[0.03] transition-all group cursor-pointer relative"
                          onClick={() => handleFetchDetails(item.ticker, item.assetType)}
                        >
                          <div className="absolute left-0 top-0 bottom-0 w-0 group-hover:w-1 bg-blue-600 transition-all" />
                          
                          <div className="flex-1 flex items-center gap-4">
                            <div className="relative">
                              <AssetIcon assetType={item.assetType} ticker={item.ticker} className="w-11 h-11 rounded-xl bg-white p-1 shadow-2xl group-hover:scale-105 transition-transform" />
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-slate-900 rounded-full border border-white/10 flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                              </div>
                            </div>
                            <div>
                              <div className="text-display-tiny text-white uppercase italic group-hover:text-blue-400 transition-colors tracking-tighter">{item.ticker}</div>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="h-1 w-12 bg-white/5 rounded-full overflow-hidden">
                                  <div className="h-full bg-blue-500" style={{ width: `${allocation}%` }} />
                                </div>
                                <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">
                                  {allocation.toFixed(1)}% <span className="text-[8px] opacity-40">PORTFOLIO</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="w-32 text-right">
                            <div className="font-black text-slate-300 text-sm italic">{item.totalQuantity.toLocaleString('pt-BR')}</div>
                            <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">QUANTIDADE</div>
                          </div>
                          <div className="w-40 text-right">
                            <div className="font-black text-slate-400 text-sm italic">R$ {item.averagePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                            <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">CUSTO UNITÁRIO</div>
                          </div>
                          <div className="w-40 text-right">
                            <div className="text-display-tiny text-white uppercase italic text-lg tracking-tighter">R$ {currentVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                            <div className="text-[9px] font-black text-blue-500/60 uppercase tracking-widest italic">POSIÇÃO ATUAL</div>
                          </div>
                          <div className={`w-40 text-right ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                            <div className="flex flex-col items-end">
                              <span className="text-base font-black italic tracking-tighter">R$ {Math.abs(profit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              <div className="flex items-center gap-1">
                                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                <span className="text-[10px] font-black italic">{isPositive ? '+' : '-'}{Math.abs(item.profitPercentage || 0).toFixed(2)}%</span>
                              </div>
                            </div>
                          </div>
                          <div className="w-10 flex justify-end">
                            <ChevronRight className="w-5 h-5 text-slate-800 group-hover:text-blue-500 transition-transform group-hover:translate-x-1" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Mobile List (Ultra Condensed) */}
                <div className="md:hidden divide-y divide-white/5">
                  {items.map((item) => {
                    const profit = item.profit || 0;
                    const isPositive = profit >= 0;
                    const currentVal = item.currentValue || item.totalInvested;
                    const allocation = totalPortfolioValue > 0 ? (currentVal / totalPortfolioValue) * 100 : 0;

                    return (
                      <div
                        key={item.ticker}
                        onClick={() => handleFetchDetails(item.ticker, item.assetType)}
                        className="p-5 bg-transparent active:bg-white/5 transition-all flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <AssetIcon assetType={item.assetType} ticker={item.ticker} className="w-10 h-10 rounded-xl bg-white p-1 shrink-0" />
                          <div className="min-w-0">
                            <div className="text-display-tiny text-white italic truncate">{item.ticker}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="w-8 h-1 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500" style={{ width: `${allocation}%` }} />
                              </div>
                              <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">
                                {allocation.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-lg font-display font-black text-white italic leading-none mb-1">
                            R$ {currentVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                          <div className={`text-[10px] font-black flex items-center justify-end gap-1.5 uppercase tracking-widest italic ${isPositive ? 'text-emerald-500' : 'text-red-400'}`}>
                            {isPositive ? '+' : '-'}{Math.abs(item.profitPercentage || 0).toFixed(2)}%
                            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
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
