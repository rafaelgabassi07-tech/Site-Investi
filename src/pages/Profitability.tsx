import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, Calendar, ArrowUpRight, ArrowDownRight, BarChart3, PieChart, Activity, Loader2 } from 'lucide-react';
import { NexusAgentUI } from '../components/NexusAgentUI';
import { motion } from 'motion/react';
import { usePortfolio } from '../hooks/usePortfolio';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { PageHeader } from '../components/ui/PageHeader';
import { formatNumber } from '../lib/utils';
import { usePrivacy } from '../hooks/usePrivacy';
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
    if (!quotaHistory || quotaHistory.length === 0 || portfolio.length === 0) return [];

    let activeHistory = [...quotaHistory];
    
    // Inject "Today" point to ensure the chart connects to the current real value
    const lastPoint = activeHistory[activeHistory.length - 1];
    const todayStr = new Date().toISOString();
    
    // If the last transaction wasn't today, simulate today's real performance
    if (lastPoint.date.split('T')[0] !== todayStr.split('T')[0]) {
      const totalInvested = portfolio.reduce((acc, curr) => acc + (curr.totalInvested || 0), 0);
      const currentTotalValue = portfolio.reduce((acc, curr) => acc + (curr.currentValue || curr.totalInvested), 0);
      
      // Calculate quota based purely on valuation change (assuming no new cashflow since last point)
      const patrimonyRatio = lastPoint.totalPatrimony > 0 ? (currentTotalValue / lastPoint.totalPatrimony) : 1;
      const newQuotaValue = lastPoint.quotaValue * patrimonyRatio;

      activeHistory.push({
        date: todayStr,
        quotaValue: newQuotaValue,
        totalPatrimony: currentTotalValue
      });
    }

    if (activeHistory.length < 2) return [];

    // Normalize quota history
    const firstQuota = activeHistory[0].quotaValue;
    if (!firstQuota) return [];

    const normalizedPortfolio = activeHistory.map(q => ({
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

      // Estimate real historical value
      // If it's the last point, inject the absolute true current profitability mathematically
      let realValue = p.value;
      if (idx === arr.length - 1) {
         const totalInvested = portfolio.reduce((acc, curr) => acc + (curr.totalInvested || 0), 0);
         const currentTotalValue = portfolio.reduce((acc, curr) => acc + (curr.currentValue || curr.totalInvested), 0);
         if (totalInvested > 0) {
            // we use the actual absolute ROI for the final point to ensure the displayed stat matches the chart
            realValue = ((currentTotalValue / totalInvested) - 1) * 100;
         }
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
      { label: 'Rentabilidade Total', value: `${totalReturn >= 0 ? '+' : ''}${formatNumber(totalReturn)}%`, icon: TrendingUp, color: totalReturn >= 0 ? 'text-emerald-600' : 'text-red-600' },
      { label: 'Média Mensal', value: `${avgMonthly >= 0 ? '+' : ''}${formatNumber(avgMonthly)}%`, icon: Calendar, color: 'text-primary' },
      { label: 'vs. IBOVESPA', value: `${alpha >= 0 ? '+' : ''}${formatNumber(alpha)}%`, icon: Activity, color: alpha >= 0 ? 'text-purple-600' : 'text-red-600' },
      { label: 'Melhor Mês', value: `${bestMonth >= 0 ? '+' : ''}${formatNumber(bestMonth)}%`, icon: ArrowUpRight, color: 'text-emerald-600' },
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
        description="Carteira vs. índices."
        icon={BarChart3}
      />

      <NexusAgentUI />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl flex flex-col items-start overflow-hidden relative shadow-sm"
      >
        <div className="w-full p-5 md:p-6 grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="flex flex-col">
              <div className="flex items-center gap-1.5 mb-1.5">
                <stat.icon className={`w-3 h-3 ${stat.color}`} />
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</span>
              </div>
              <div className={`text-xl font-bold transition-colors ${stat.value.startsWith('+') ? 'text-emerald-600' : stat.value.startsWith('-') ? 'text-red-600' : 'text-foreground'}`}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-8">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="lg:col-span-2 space-y-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-primary rounded-full shadow-sm" />
              <h3 className="nexus-title text-base">
                Evolução da Rentabilidade (%)
              </h3>
            </div>
            <div className="flex gap-6">
              <span className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                <div className="w-2 h-2 rounded-full bg-primary" /> Carteira
              </span>
              <span className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                <div className="w-2 h-2 rounded-full border border-muted-foreground/50" /> IBOVESPA
              </span>
            </div>
          </div>
          
          <div className="h-[350px] w-full -mx-4 md:mx-0 nexus-card mt-6">
            {performanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData} margin={{ top: 20, right: 0, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={10} 
                    fontWeight="700"
                    tickLine={false} 
                    axisLine={false} 
                    dy={10}
                    tickFormatter={(val) => val.toUpperCase()}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={10} 
                    fontWeight="bold"
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(v) => `${v.toFixed(1)}%`} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold', fontSize: '12px' }}
                    labelStyle={{ color: 'hsl(var(--muted-foreground))', fontSize: '10px', fontWeight: '900', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                    formatter={(v: any) => [`${Number(v).toFixed(2)}%`]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3b82f6" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                    animationDuration={2000} 
                    activeDot={{ r: 6, strokeWidth: 0, fill: '#3b82f6' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="benchmark" 
                    stroke="#64748b" 
                    strokeWidth={2} 
                    fill="transparent" 
                    strokeDasharray="5 5" 
                    activeDot={{ r: 4, strokeWidth: 0, fill: '#64748b' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground uppercase tracking-widest text-[10px] font-bold rounded-2xl">
                <Activity className="w-8 h-8 text-blue-500/20 mb-3" />
                <span>Dados insuficientes para gerar a evolução.</span>
                <span className="opacity-50 mt-1 max-w-[250px] text-center">O histórico é montado automaticamente conforme você registra transações em datas diferentes.</span>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-8"
        >
          <div className="nexus-card">
            <div className="flex items-center gap-3 px-2 mb-8">
              <div className="w-1.5 h-6 bg-purple-600 rounded-full shadow-sm" />
              <h3 className="nexus-title text-base">
                Alocação por Classe
              </h3>
            </div>
            
            <div className="space-y-8 px-2">
              {allocationByClass.length > 0 ? allocationByClass.map((item, idx) => (
                <div key={idx} className="space-y-3 pb-6 border-b border-border last:border-0 last:pb-0">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{item.label}</span>
                    <span className="text-sm font-bold text-foreground">{item.value.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden border border-border">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${item.value}%` }}
                      transition={{ duration: 1, delay: idx * 0.1 }}
                      className={`h-full ${item.color.replace('bg-', 'bg-')}`}
                    />
                  </div>
                </div>
              )) : (
                <div className="py-20 text-center text-muted-foreground text-xs font-bold uppercase tracking-widest opacity-40">
                  Sem dados
                </div>
              )}
            </div>
          </div>
          
          <div className="py-6 px-6 bg-secondary/50 border border-border rounded-xl border-l-4 border-l-primary/50 shadow-sm relative overflow-hidden group">
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <p className="text-[11px] font-bold text-foreground/80 leading-relaxed uppercase tracking-wider relative z-10">
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
