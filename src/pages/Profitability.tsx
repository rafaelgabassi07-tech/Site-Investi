import { PageHeader } from '../components/ui/PageHeader';
import { TrendingUp, Calendar, ArrowUpRight, ArrowDownRight, BarChart3, PieChart, Activity, Loader2 } from 'lucide-react';
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
    if (quotaHistory.length === 0) return [];

    // Normalize quota history
    const firstQuota = quotaHistory[0].quotaValue;
    const normalizedPortfolio = quotaHistory.map(q => ({
      date: q.date,
      value: ((q.quotaValue / firstQuota) - 1) * 100,
      patrimony: q.totalPatrimony
    }));

    // Normalize IBOV history to match portfolio dates
    if (ibovHistory.length === 0 || !ibovHistory[0]?.close) return normalizedPortfolio;

    const firstIbov = ibovHistory[0].close;
    return normalizedPortfolio.map(p => {
      const pDate = new Date(p.date).getTime();
      // Find closest IBOV point before or at pDate
      const ibovPoint = ibovHistory.reduce((prev, curr) => {
        const currDate = new Date(curr.date).getTime();
        if (currDate <= pDate) return curr;
        return prev;
      }, ibovHistory[0]);

      return {
        ...p,
        month: new Date(p.date).toLocaleDateString('pt-BR', { month: 'short' }),
        benchmark: ibovPoint?.close ? ((ibovPoint.close / firstIbov) - 1) * 100 : 0
      };
    });
  }, [quotaHistory, ibovHistory]);

  const stats = useMemo(() => {
    if (performanceData.length === 0) return [
      { label: 'Rentabilidade Total', value: '0.00%', icon: TrendingUp, color: 'emerald' },
      { label: 'Média Mensal', value: '0.00%', icon: Calendar, color: 'blue' },
      { label: 'vs. IBOVESPA', value: '0.00%', icon: Activity, color: 'purple' },
      { label: 'Melhor Mês', value: '0.00%', icon: ArrowUpRight, color: 'emerald' },
    ];

    const totalReturn = performanceData[performanceData.length - 1].value;
    const ibovReturn = performanceData[performanceData.length - 1].benchmark || 0;
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
  }, [performanceData]);

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
        description="Acompanhe o desempenho histórico da sua carteira comparado aos principais índices."
        icon={BarChart3}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-[#0f172a] border border-slate-800 p-6 rounded-3xl relative overflow-hidden shadow-lg"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-blue-500 border border-slate-700`}>
                <stat.icon size={16} />
              </div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</span>
            </div>
            <div className={`text-2xl font-black tracking-tighter ${stat.value.startsWith('+') ? 'text-emerald-400' : stat.value.startsWith('-') ? 'text-red-400' : 'text-white'}`}>
              {stat.value}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-2 bg-[#0f172a] border border-slate-800 p-6 md:p-8 rounded-[2.5rem] shadow-xl"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-white uppercase tracking-tight flex items-center gap-3">
              <Activity className="text-blue-500" size={20} />
              Evolução da Rentabilidade (%)
            </h3>
            <div className="flex gap-4">
              <span className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <div className="w-3 h-3 rounded-full bg-blue-500" /> Carteira
              </span>
              <span className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <div className="w-3 h-3 rounded-full bg-slate-700" /> IBOVESPA
              </span>
            </div>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                  tickFormatter={(val, idx) => idx % 2 === 0 ? val : ''}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(v) => `${v.toFixed(1)}%`} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }}
                  itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                  labelStyle={{ color: '#64748b', marginBottom: '4px' }}
                  formatter={(v: any) => [`${Number(v).toFixed(2)}%`]}
                />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" animationDuration={2000} />
                <Area type="monotone" dataKey="benchmark" stroke="#475569" strokeWidth={2} fill="transparent" strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-[#0f172a] border border-slate-800 p-6 md:p-8 rounded-[2.5rem] shadow-xl"
        >
          <h3 className="text-xl font-bold text-white uppercase tracking-tight mb-8 flex items-center gap-3">
            <PieChart className="text-purple-500" size={20} />
            Alocação Atual
          </h3>
          <div className="space-y-8">
            {allocationByClass.length > 0 ? allocationByClass.map((item, idx) => (
              <div key={idx} className="space-y-3">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em]">
                  <span className="text-slate-500">{item.label}</span>
                  <span className="text-white">{item.value.toFixed(1)}%</span>
                </div>
                <div className="h-2.5 bg-slate-800/50 rounded-full overflow-hidden border border-slate-800">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${item.value}%` }}
                    transition={{ duration: 1, delay: idx * 0.1 }}
                    className={`h-full ${item.color} shadow-[0_0_10px_rgba(59,130,246,0.3)]`}
                  />
                </div>
              </div>
            )) : (
              <div className="py-20 text-center text-slate-500 text-xs font-bold uppercase tracking-widest">
                Nenhum ativo na carteira
              </div>
            )}
          </div>
          
          <div className="mt-12 p-5 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
            <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-wider text-center">
              {stats[2].value.startsWith('+') 
                ? `Sua carteira está superando o IBOVESPA em ${stats[2].value.replace('+', '')}.`
                : `Sua carteira está performando ${stats[2].value.replace('-', '')} abaixo do IBOVESPA.`}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
