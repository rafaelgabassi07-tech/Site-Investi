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
        <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Sincronizando...</p>
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
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-12 text-center">
          <Target className="w-16 h-16 text-slate-700 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Carteira Vazia</h3>
          <p className="text-slate-400">Adicione ativos na sua carteira para utilizar o rebalanceamento.</p>
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
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <DollarSign className="text-emerald-500" size={20} />
              Aporte Mensal
            </h3>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quanto deseja investir hoje?</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">R$</span>
                <input
                  type="number"
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Target className="text-blue-500" size={20} />
                Pesos Alvo
              </h3>
              <div className={`text-sm font-bold px-3 py-1 rounded-full ${isTargetValid ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                Total: {totalTarget.toFixed(1)}%
              </div>
            </div>

            <div className="space-y-4">
              {portfolio.map(item => (
                <div key={item.ticker} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-bold text-white">{item.ticker}</span>
                    <span className="text-slate-400">Atual: {((item.currentValue || item.totalInvested) / totalCurrentValue * 100 || 0).toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="0.5"
                      value={targets[item.ticker] || 0}
                      onChange={(e) => handleTargetChange(item.ticker, e.target.value)}
                      className="flex-1 accent-blue-500"
                    />
                    <div className="w-20 relative">
                      <input
                        type="number"
                        value={targets[item.ticker] || 0}
                        onChange={(e) => handleTargetChange(item.ticker, e.target.value)}
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-1.5 px-3 text-white text-sm text-right focus:outline-none focus:border-blue-500"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {!isTargetValid && (
              <div className="mt-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={16} />
                <p className="text-xs text-red-400 font-medium">A soma dos pesos deve ser exatamente 100%. Ajuste os valores acima.</p>
              </div>
            )}
          </div>
        </div>

        {/* Resultados */}
        <div className="lg:col-span-2">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp className="text-indigo-500" size={20} />
                Ordens Sugeridas
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-800/30 text-xs uppercase tracking-wider text-slate-400 font-bold">
                    <th className="p-4 pl-6">Ativo</th>
                    <th className="p-4">Atual → Alvo</th>
                    <th className="p-4">Delta (R$)</th>
                    <th className="p-4 pr-6 text-right">Ação Sugerida</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {rebalanceData.map((item, index) => (
                    <motion.tr 
                      key={item.ticker}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-slate-800/20 transition-colors"
                    >
                      <td className="p-4 pl-6">
                        <div className="font-bold text-white">{item.ticker}</div>
                        <div className="text-xs text-slate-500">R$ {(item.currentPrice || item.averagePrice).toFixed(2)}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-slate-400">{item.currentPercentage.toFixed(1)}%</span>
                          <ArrowRight size={14} className="text-slate-600" />
                          <span className="font-bold text-white">{item.targetPercentage.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`text-sm font-bold ${item.deltaValue > 0 ? 'text-emerald-400' : item.deltaValue < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                          {item.deltaValue > 0 ? '+' : ''}{item.deltaValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        {item.deltaValue > 0 ? (
                          <div className="inline-flex flex-col items-end">
                            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-bold uppercase">
                              Comprar {Math.floor(item.suggestedShares)}
                            </span>
                          </div>
                        ) : item.deltaValue < 0 ? (
                          <div className="inline-flex flex-col items-end">
                            <span className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-xs font-bold uppercase">
                              Vender {Math.floor(Math.abs(item.suggestedShares))}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-sm font-medium">Manter</span>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {!isTargetValid && (
              <div className="p-8 text-center bg-slate-800/20 backdrop-blur-sm absolute inset-0 flex flex-col items-center justify-center z-10">
                <AlertCircle className="w-12 h-12 text-slate-500 mb-4" />
                <p className="text-slate-300 font-medium">Ajuste os pesos para 100% para ver as sugestões.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
