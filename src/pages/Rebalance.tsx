import { useState, useEffect, useMemo } from 'react';
import { usePortfolio } from '../hooks/usePortfolio';
import { PageHeader } from '../components/ui/PageHeader';
import { Scale, ArrowRight, AlertCircle, DollarSign, Target, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';

export default function Rebalance() {
  const { portfolio, loading } = usePortfolio();
  const [investmentAmount, setInvestmentAmount] = useState<string>('1000');
  const [targets, setTargets] = useState<Record<string, number>>({});

  // Initialize targets evenly if not set
  useEffect(() => {
    if (portfolio.length > 0 && Object.keys(targets).length === 0) {
      const evenSplit = 100 / portfolio.length;
      const initialTargets: Record<string, number> = {};
      portfolio.forEach(item => {
        initialTargets[item.ticker] = evenSplit;
      });
      setTargets(initialTargets);
    }
  }, [portfolio, targets]);

  const handleTargetChange = (ticker: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setTargets(prev => ({ ...prev, [ticker]: numValue }));
  };

  const totalTarget = Object.values(targets).reduce((acc, val) => acc + val, 0);
  const isTargetValid = Math.abs(totalTarget - 100) < 0.1;

  const totalCurrentValue = portfolio.reduce((acc, item) => acc + (item.currentValue || item.totalInvested), 0);
  const totalFutureValue = totalCurrentValue + (parseFloat(investmentAmount) || 0);

  const rebalanceData = portfolio.map(item => {
    const currentValue = item.currentValue || item.totalInvested;
    const currentPercentage = totalCurrentValue > 0 ? (currentValue / totalCurrentValue) * 100 : 0;
    const targetPercentage = targets[item.ticker] || 0;
    const targetValue = totalFutureValue * (targetPercentage / 100);
    const deltaValue = targetValue - currentValue;
    const currentPrice = item.currentPrice || item.averagePrice;
    const suggestedShares = currentPrice > 0 ? deltaValue / currentPrice : 0;

    return {
      ...item,
      currentPercentage,
      targetPercentage,
      targetValue,
      deltaValue,
      suggestedShares
    };
  }).sort((a, b) => b.deltaValue - a.deltaValue);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="animate-spin text-blue-500 icon-xl" />
        <p className="text-label text-slate-500 uppercase tracking-widest animate-pulse">Sincronizando...</p>
      </div>
    );
  }

  if (portfolio.length === 0) {
    return (
      <div className="space-y-8">
        <PageHeader 
          title="Rebalanceamento"
          description="Defina o peso ideal de cada ativo e deixe o sistema calcular as ordens."
          icon={Scale}
        />
        <div className="bg-white/5 border border-white/5 rounded-3xl p-12 text-center space-y-4">
          <Target className="w-16 h-16 text-slate-700 mx-auto" />
          <h3 className="text-display-tiny text-white uppercase italic">Carteira Vazia</h3>
          <p className="text-tiny font-bold text-slate-400 uppercase tracking-widest leading-relaxed max-w-xs mx-auto">Adicione ativos na sua carteira para utilizar o rebalanceamento inteligente Nexus.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Rebalanceamento Inteligente"
        description={<>Ajuste o <span className="text-blue-500 font-bold">Target Portfolio</span> e descubra o que comprar ou vender.</>}
        icon={Scale}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuração */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white/5 border border-white/5 rounded-3xl p-6 shadow-lg group">
            <h3 className="text-label text-white mb-4 flex items-center gap-2 uppercase italic tracking-tight">
              <DollarSign className="icon-sm text-emerald-500 group-hover:scale-110 transition-transform" />
              Aporte Mensal
            </h3>
            <div className="space-y-2">
              <label className="text-tiny font-bold text-slate-500 uppercase tracking-widest pl-1">Quanto deseja investir hoje?</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-black text-sm uppercase">R$</span>
                <input
                  type="number"
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white font-black text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-mono shadow-inner"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/5 rounded-3xl p-6 shadow-lg group">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-label text-white flex items-center gap-2 uppercase italic tracking-tight">
                <Target className="icon-sm text-blue-500 group-hover:scale-110 transition-transform" />
                Pesos Alvo
              </h3>
              <div className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${isTargetValid ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                Total: {totalTarget.toFixed(1)}%
              </div>
            </div>

            <div className="space-y-6">
              {portfolio.map(item => (
                <div key={item.ticker} className="space-y-3 p-4 bg-white/5 rounded-2xl border border-white/5 group/asset hover:border-blue-500/30 transition-all">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-display-tiny text-white group-hover/asset:text-blue-400 transition-colors uppercase italic">{item.ticker}</span>
                    <span className="text-tiny font-bold text-slate-500 uppercase tracking-widest opacity-60">Atual: {((item.currentValue || item.totalInvested) / totalCurrentValue * 100 || 0).toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="0.5"
                      value={targets[item.ticker] || 0}
                      onChange={(e) => handleTargetChange(item.ticker, e.target.value)}
                      className="flex-1 accent-blue-500 h-1.5 cursor-pointer"
                    />
                    <div className="w-20 relative">
                      <input
                        type="number"
                        value={targets[item.ticker] || 0}
                        onChange={(e) => handleTargetChange(item.ticker, e.target.value)}
                        className="w-full bg-white/5 border border-white/5 rounded-lg py-1.5 px-3 text-white text-xs font-black text-right focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xxs font-black">%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {!isTargetValid && (
              <div className="mt-8 p-4 bg-red-500/5 border border-red-500/10 rounded-2xl flex items-start gap-3">
                <AlertCircle className="icon-sm text-red-500/60 shrink-0 mt-0.5" />
                <p className="text-tiny font-bold text-red-400/80 uppercase tracking-widest leading-relaxed">A soma dos pesos deve ser exatamente 100%. Ajuste os valores acima.</p>
              </div>
            )}
          </div>
        </div>

        {/* Resultados */}
        <div className="lg:col-span-2">
          <div className="bg-white/5 border border-white/5 rounded-3xl shadow-xl overflow-hidden relative group">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-label text-white flex items-center gap-2 uppercase italic tracking-tight">
                <TrendingUp className="icon-sm text-indigo-500 group-hover:scale-110 transition-transform" />
                Ordens Sugeridas
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5">
                    <th className="p-4 pl-8 text-tiny font-black text-slate-500 uppercase tracking-widest">Ativo</th>
                    <th className="p-4 text-tiny font-black text-slate-500 uppercase tracking-widest">Atual → Alvo</th>
                    <th className="p-4 text-tiny font-black text-slate-500 uppercase tracking-widest">Delta</th>
                    <th className="p-4 pr-8 text-right text-tiny font-black text-slate-500 uppercase tracking-widest">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {rebalanceData.map((item, index) => (
                    <motion.tr 
                      key={item.ticker}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-white/5 transition-colors group/row"
                    >
                      <td className="p-4 pl-8">
                        <div className="text-display-tiny text-white uppercase italic group-hover/row:text-blue-400 transition-colors">{item.ticker}</div>
                        <div className="text-tiny font-bold text-slate-500 uppercase tracking-widest">R$ {(item.currentPrice || item.averagePrice).toFixed(2)}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-tiny font-black uppercase tracking-widest">
                          <span className="text-slate-500">{item.currentPercentage.toFixed(1)}%</span>
                          <ArrowRight className="icon-xs text-slate-700" />
                          <span className="text-white">{item.targetPercentage.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`text-tiny font-black uppercase tracking-widest ${item.deltaValue > 0 ? 'text-emerald-400' : item.deltaValue < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                          {item.deltaValue > 0 ? '+' : ''}{item.deltaValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </td>
                      <td className="p-4 pr-8 text-right">
                        {item.deltaValue > 0 ? (
                          <div className="inline-flex flex-col items-end">
                            <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-tiny font-black uppercase tracking-widest shadow-lg shadow-emerald-500/5">
                              Comprar {Math.floor(item.suggestedShares)}
                            </span>
                          </div>
                        ) : item.deltaValue < 0 ? (
                          <div className="inline-flex flex-col items-end">
                            <span className="px-4 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-tiny font-black uppercase tracking-widest shadow-lg shadow-red-500/5">
                              Vender {Math.floor(Math.abs(item.suggestedShares))}
                            </span>
                          </div>
                        ) : (
                          <span className="text-tiny font-black text-slate-600 uppercase tracking-widest opacity-40 italic">Manter</span>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {!isTargetValid && (
              <div className="p-8 text-center bg-slate-900/40 backdrop-blur-md absolute inset-0 flex flex-col items-center justify-center z-10 transition-all duration-500">
                <AlertCircle className="w-16 h-16 text-slate-700/50 mb-6 group-hover:scale-110 transition-transform duration-700" />
                <p className="text-label text-slate-400 uppercase italic">Ajuste os pesos para 100% para ver as sugestões inteligentes.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
