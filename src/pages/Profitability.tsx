import { PageHeader } from '../components/ui/PageHeader';
import { TrendingUp, Calendar, ArrowUpRight, ArrowDownRight, BarChart3, PieChart, Activity, Loader2 } from 'lucide-react';
import { NexusAgentUI } from '../components/NexusAgentUI';
import { motion } from 'motion/react';
import { usePortfolio } from '../hooks/usePortfolio';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { useState, useEffect, useMemo } from 'react';
import { financeService } from '../services/financeService';
import { PortfolioNav } from '../components/PortfolioNav';

export default function Profitability() {
  const { portfolio, quotaHistory, loading: loadingPortfolio } = usePortfolio();
  const [ibovHistory, setIbovHistory] = useState<any[]>([]);
  const [loadingIbov, setLoadingIbov] = useState(true);

  useEffect(() => {
    async function fetchIbov() {
      try {
        const history = await financeService.getAssetHistory('^BVSP', '1y');
        setIbovHistory(history);
      } catch (error) {
        console.error('Error fetching IBOV history:', error);
      } finally {
        setLoadingIbov(false);
      }
    }
    fetchIbov();
  }, []);

  const performanceData = useMemo(() => {
    if (!quotaHistory || quotaHistory.length < 2) return [];

    // Normalize quota history
    const firstQuota = quotaHistory[0].quotaValue;
    if (!firstQuota) return [];

    const normalizedPortfolio = quotaHistory.map(q => ({
      date: q.date,
      value: ((q.quotaValue / firstQuota) - 1) * 100,
      patrimony: q.totalPatrimony
    }));

    // Normalize IBOV history to match portfolio dates
    if (!ibovHistory || ibovHistory.length === 0 || !ibovHistory[0]?.close) return normalizedPortfolio;

    const firstIbov = ibovHistory[0].close;
    return normalizedPortfolio.map((p, idx, arr) => {
      const pDate = new Date(p.date).getTime();
      // Find closest IBOV point before or at pDate
      const ibovPoint = ibovHistory.reduce((prev, curr) => {
        const currDate = new Date(curr.date).getTime();
        if (currDate <= pDate) return curr;
        return prev;
      }, ibovHistory[0]);

      // Estimate real historical value based on patrimony vs starting
      // If it's the last point, inject the true current profitability
      let realValue = p.value;
      if (idx === arr.length - 1) {
         const totalInvested = portfolio.reduce((acc, curr) => acc + (curr.totalInvested || 0), 0);
         const currentTotalValue = portfolio.reduce((acc, curr) => acc + (curr.currentValue || curr.totalInvested), 0);
         if (totalInvested > 0) realValue = ((currentTotalValue / totalInvested) - 1) * 100;
      }

      return {
        ...p,
        value: realValue,
        month: new Date(p.date).toLocaleDateString('pt-BR', { month: 'short' }),
        benchmark: ibovPoint?.close ? ((ibovPoint.close / firstIbov) - 1) * 100 : 0
      };
    });
  }, [quotaHistory, ibovHistory, portfolio]);

  const stats = useMemo(() => {
    if (!performanceData || performanceData.length < 2) return [
      { label: 'Rentabilidade Total', value: '0.00%', icon: TrendingUp, color: 'emerald' },
      { label: 'Média Mensal', value: '0.00%', icon: Calendar, color: 'blue' },
      { label: 'vs. IBOVESPA', value: '0.00%', icon: Activity, color: 'purple' },
      { label: 'Melhor Mês', value: '0.00%', icon: ArrowUpRight, color: 'emerald' },
    ];

    const totalInvested = portfolio.reduce((acc, curr) => acc + (curr.totalInvested || 0), 0);
    const currentTotalValue = portfolio.reduce((acc, curr) => acc + (curr.currentValue || curr.totalInvested), 0);
    const trueTotalReturn = totalInvested > 0 ? ((currentTotalValue / totalInvested) - 1) * 100 : 0;

    const totalReturn = trueTotalReturn;
    const ibovReturn = performanceData.length > 0 ? (performanceData[performanceData.length - 1].benchmark || 0) : 0;
    const alpha = totalReturn - ibovReturn;

    // Monthly returns estimation
    const monthlyReturns = performanceData.reduce((acc: number[], curr, idx, arr) => {
      if (idx === 0) return acc;
      const prev = arr[idx - 1];
      const ret = ((curr.value + 100) / (prev.value + 100) - 1) * 100;
      acc.push(ret);
      return acc;
    }, []);

    const avgMonthly = monthlyReturns.length > 0 
      ? monthlyReturns.reduce((a, b) => a + b, 0) / monthlyReturns.length 
      : 0;
    
    const bestMonth = monthlyReturns.length > 0 ? Math.max(...monthlyReturns) : 0;

    return [
      { label: 'Rentabilidade Total', value: `${totalReturn >= 0 ? '+' : ''}${totalReturn.toFixed(2)}%`, icon: TrendingUp, color: totalReturn >= 0 ? 'emerald' : 'red' },
      { label: 'Média Mensal', value: `${avgMonthly >= 0 ? '+' : ''}${avgMonthly.toFixed(2)}%`, icon: Calendar, color: 'blue' },
      { label: 'vs. IBOVESPA', value: `${alpha >= 0 ? '+' : ''}${alpha.toFixed(2)}%`, icon: Activity, color: alpha >= 0 ? 'purple' : 'red' },
      { label: 'Melhor Mês', value: `${bestMonth >= 0 ? '+' : ''}${bestMonth.toFixed(2)}%`, icon: ArrowUpRight, color: 'emerald' },
    ];
  }, [performanceData, portfolio]);

  const allocationByClass = useMemo(() => {
    const map = portfolio.reduce((acc, item) => {
      const type = item.assetType || 'OUTROS';
      acc[type] = (acc[type] || 0) + (item.currentValue || item.totalInvested);
      return acc;
    }, {} as Record<string, number>);

    const total = Object.values(map).reduce((a, b) => a + b, 0);
    return Object.entries(map).map(([label, value]) => ({
      label,
      value: total > 0 ? (value / total) * 100 : 0,
      color: label === 'ACAO' ? 'bg-blue-500' : label === 'FII' ? 'bg-emerald-500' : 'bg-slate-500'
    })).sort((a, b) => b.value - a.value);
  }, [portfolio]);

  if (loadingPortfolio || loadingIbov) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Analisando Performance...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Rentabilidade"
        description="Desempenho da carteira vs. índices."
        icon={BarChart3}
      />

      <NexusAgentUI />

      <div className="grid grid-cols-2 lg:grid-cols-4 border-t border-white/5">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: idx * 0.05 }}
            className={`py-8 px-6 group border-b border-white/5 hover:bg-white/[0.01] transition-colors relative ${idx % 2 === 0 ? 'border-r md:border-r' : 'md:border-r'} ${idx % 4 === 3 ? 'lg:border-r-0' : ''}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic group-hover:text-blue-400 transition-colors">{stat.label}</span>
            </div>
            <div className={`text-xl md:text-2xl font-display font-black italic tracking-tighter transition-colors ${stat.value.startsWith('+') ? 'text-emerald-400' : stat.value.startsWith('-') ? 'text-red-400' : 'text-white'}`}>
              {stat.value}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-8">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="lg:col-span-2 space-y-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
              <h3 className="text-display-xs text-white uppercase italic tracking-tighter">
                Evolução da Rentabilidade (%)
              </h3>
            </div>
            <div className="flex gap-6">
              <span className="flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase tracking-widest italic">
                <div className="w-2 h-2 rounded-full bg-blue-500" /> Carteira
              </span>
              <span className="flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase tracking-widest italic">
                <div className="w-2 h-2 rounded-full border border-slate-700" /> IBOVESPA
              </span>
            </div>
          </div>
          
          <div className="h-[350px] w-full -mx-4 md:mx-0">
            {performanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    stroke="#475569" 
                    fontSize={10} 
                    fontWeight="bold"
                    tickLine={false} 
                    axisLine={false} 
                    dy={10}
                    tickFormatter={(val, idx) => idx % 2 === 0 ? val.toUpperCase() : ''}
                    tick={{ fill: '#64748b' }}
                  />
                  <YAxis 
                    stroke="#475569" 
                    fontSize={10} 
                    fontWeight="bold"
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(v) => `${v.toFixed(1)}%`} 
                    tick={{ fill: '#64748b' }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
                    itemStyle={{ color: '#fff', fontWeight: 'bold', fontSize: '12px' }}
                    labelStyle={{ color: '#94a3b8', fontSize: '10px', fontWeight: '900', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                    formatter={(v: any) => [`${Number(v).toFixed(2)}%`]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3b82f6" 
                    strokeWidth={4} 
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                    animationDuration={2000} 
                    activeDot={{ r: 6, strokeWidth: 0, fill: '#3b82f6' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="benchmark" 
                    stroke="#475569" 
                    strokeWidth={2} 
                    fill="transparent" 
                    strokeDasharray="5 5" 
                    activeDot={{ r: 4, strokeWidth: 0, fill: '#475569' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 uppercase tracking-widest text-[10px] font-black border border-white/5 rounded-2xl">
                <span>Dados insuficientes para gerar a evolução.</span>
                <span className="opacity-50 mt-1">É necessário ter pelo menos 2 transações em dias diferentes.</span>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-12"
        >
          <div className="space-y-8">
            <div className="flex items-center gap-3 px-2">
              <div className="w-1.5 h-6 bg-purple-500 rounded-full" />
              <h3 className="text-display-xs text-white uppercase italic tracking-tighter">
                Alocação por Classe
              </h3>
            </div>
            
            <div className="space-y-8 px-2">
              {allocationByClass.length > 0 ? allocationByClass.map((item, idx) => (
                <div key={idx} className="space-y-3 pb-6 border-b border-white/5 last:border-0 last:pb-0">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">{item.label}</span>
                    <span className="text-sm font-black text-white italic">{item.value.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${item.value}%` }}
                      transition={{ duration: 1, delay: idx * 0.1 }}
                      className={`h-full ${item.color.replace('bg-', 'bg-')} shadow-[0_0_15px_rgba(59,130,246,0.2)]`}
                    />
                  </div>
                </div>
              )) : (
                <div className="py-20 text-center text-slate-500 text-xs font-bold uppercase tracking-widest italic opacity-20">
                  Sem dados
                </div>
              )}
            </div>
          </div>
          
          <div className="py-8 px-6 bg-white/[0.01] border-l-2 border-blue-600/30">
            <p className="text-[11px] font-bold text-slate-500 leading-relaxed uppercase tracking-wider italic">
              {stats[2].value.startsWith('+') 
                ? `Alpha Positivo: Sua estratégia está gerando um excedente de ${stats[2].value.replace('+', '')} sobre o benchmark.`
                : `Benchmark Gap: A carteira está ${stats[2].value.replace('-', '')} atrás do IBOVESPA no período.`}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
