import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, Calendar, ArrowUpRight, ArrowDownRight, BarChart3, PieChart, Activity, Loader2, ChevronDown } from 'lucide-react';
import { NexusAgentUI } from '../components/NexusAgentUI';
import { motion } from 'motion/react';
import { usePortfolio } from '../hooks/usePortfolio';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { PageHeader } from '../components/ui/PageHeader';
import { formatNumber } from '../lib/utils';
import { usePrivacy } from '../hooks/usePrivacy';
import { financeService } from '../services/financeService';

const BENCHMARKS = [
  { id: '^BVSP', label: 'IBOVESPA' },
  { id: 'IFIX.SA', label: 'IFIX' },
  { id: '^GSPC', label: 'S&P 500 (SPX)' },
  { id: 'IVVB11.SA', label: 'IVVB11' },
  { id: 'SMAL11.SA', label: 'SMLL' },
  { id: 'DIVO11.SA', label: 'IDIV' }
];

export default function Profitability() {
  const { portfolio, quotaHistory, loading: loadingPortfolio } = usePortfolio();
  const [benchmarkHistory, setBenchmarkHistory] = useState<any[]>([]);
  const [loadingBenchmark, setLoadingBenchmark] = useState(true);
  const [selectedBenchmark, setSelectedBenchmark] = useState(BENCHMARKS[0]);

  useEffect(() => {
    async function fetchBenchmark() {
      setLoadingBenchmark(true);
      try {
        const history = await financeService.getAssetHistory(selectedBenchmark.id, '1y');
        setBenchmarkHistory(history);
      } catch (error) {
        console.error(`Error fetching ${selectedBenchmark.label} history:`, error);
      } finally {
        setLoadingBenchmark(false);
      }
    }
    fetchBenchmark();
  }, [selectedBenchmark]);

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

    // Normalize benchmark history to match portfolio dates
    if (!benchmarkHistory || benchmarkHistory.length === 0 || !benchmarkHistory[0]?.close) return normalizedPortfolio;

    const firstBench = benchmarkHistory[0].close;
    return normalizedPortfolio.map((p, idx, arr) => {
      const pDate = new Date(p.date).getTime();
      // Find closest benchmark point before or at pDate
      const benchPoint = benchmarkHistory.reduce((prev, curr) => {
        const currDate = new Date(curr.date).getTime();
        if (currDate <= pDate) return curr;
        return prev;
      }, benchmarkHistory[0]);

      // Estimate real historical value
      let realValue = p.value;
      if (idx === arr.length - 1) {
         const totalInvested = portfolio.reduce((acc, curr) => acc + (curr.totalInvested || 0), 0);
         const currentTotalValue = portfolio.reduce((acc, curr) => acc + (curr.currentValue || curr.totalInvested), 0);
         if (totalInvested > 0) {
            realValue = ((currentTotalValue / totalInvested) - 1) * 100;
         }
      }

      return {
        ...p,
        value: realValue,
        month: new Date(p.date).toLocaleDateString('pt-BR', { month: 'short' }),
        benchmark: benchPoint?.close ? ((benchPoint.close / firstBench) - 1) * 100 : 0
      };
    });
  }, [quotaHistory, benchmarkHistory, portfolio]);

  const monthlyTableData = useMemo(() => {
    if (!quotaHistory || quotaHistory.length === 0) return [];
    
    // Agrupa quotas por Mês/Ano
    const monthlyGroups: Record<string, { year: number, month: number, lastQuota: number }> = {};
    
    quotaHistory.forEach(q => {
       const d = new Date(q.date);
       const key = `${d.getFullYear()}-${d.getMonth()}`;
       monthlyGroups[key] = {
           year: d.getFullYear(),
           month: d.getMonth(),
           lastQuota: q.quotaValue
       }; // Como a array original está em ordem cronológica, isso sobrescreve sempre com a última do mês
    });

    const years = Array.from(new Set(Object.values(monthlyGroups).map(g => g.year))).sort((a,b) => b - a);
    
    const table: any[] = [];
    
    years.forEach(year => {
        const row: any = { year };
        let yearStartQuota = 0;
        
        // Determinar a quota inicial do ano (última do ano anterior)
        const prevYearKeys = Object.keys(monthlyGroups).filter(k => monthlyGroups[k].year < year);
        if (prevYearKeys.length > 0) {
           const lastIdx = prevYearKeys.length - 1;
           yearStartQuota = monthlyGroups[prevYearKeys[lastIdx]].lastQuota;
        } else {
           // Se for o primeiro ano da carteira, pega a cota 0
           yearStartQuota = quotaHistory[0]?.quotaValue || 1;
        }

        let currentPrevQuota = yearStartQuota;

        for (let m = 0; m < 12; m++) {
            const key = `${year}-${m}`;
            if (monthlyGroups[key]) {
               const quota = monthlyGroups[key].lastQuota;
               const ret = currentPrevQuota > 0 ? ((quota / currentPrevQuota) - 1) * 100 : 0;
               row[m] = ret;
               currentPrevQuota = quota;
            } else {
               const now = new Date();
               if (year > now.getFullYear() || (year === now.getFullYear() && m > now.getMonth())) {
                 row[m] = null; // Futuro
               } else {
                 row[m] = 0; // Mês sem movimentação considerável
               }
            }
        }
        
        // Year YTD
        const lastMonthQuota = currentPrevQuota;
        row['ytd'] = yearStartQuota > 0 ? ((lastMonthQuota / yearStartQuota) - 1) * 100 : 0;
        
        table.push(row);
    });
    
    return table;
  }, [quotaHistory]);

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

  if (loadingPortfolio || loadingBenchmark) {
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
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                <div className="w-2 h-2 rounded-full bg-primary" /> Carteira
              </span>
              <div className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                <div className="w-2 h-2 rounded-full border border-muted-foreground/50" /> 
                <select 
                  value={selectedBenchmark.id}
                  onChange={(e) => setSelectedBenchmark(BENCHMARKS.find(b => b.id === e.target.value) || BENCHMARKS[0])}
                  className="bg-transparent text-[9px] font-bold text-muted-foreground uppercase tracking-widest outline-none cursor-pointer border-none p-0 focus:ring-0"
                >
                  {BENCHMARKS.map(b => (
                    <option key={b.id} value={b.id} className="bg-popover text-foreground">{b.label}</option>
                  ))}
                </select>
              </div>
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
                    name="Carteira"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="benchmark" 
                    stroke="#64748b" 
                    strokeWidth={2} 
                    fill="transparent" 
                    strokeDasharray="5 5" 
                    activeDot={{ r: 4, strokeWidth: 0, fill: '#64748b' }}
                    name={selectedBenchmark.label}
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

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="nexus-card p-0 overflow-hidden"
          >
            <div className="p-4 md:p-6 border-b border-border flex items-center justify-between bg-secondary/30">
               <div className="flex items-center gap-3">
                 <Calendar className="w-4 h-4 text-emerald-500" />
                 <h3 className="text-xs font-black text-foreground uppercase tracking-widest">Rentabilidade Mensal</h3>
               </div>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse min-w-[800px]">
                 <thead>
                    <tr>
                      <th className="p-4 bg-secondary/10 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b border-border border-r border-border/50">Ano</th>
                      {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map((m) => (
                         <th key={m} className="p-4 bg-secondary/10 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b border-border border-r border-border/50 text-center">{m}</th>
                      ))}
                      <th className="p-4 bg-primary/5 text-[10px] font-black text-primary uppercase tracking-widest border-b border-border text-center">YTD</th>
                    </tr>
                 </thead>
                 <tbody>
                    {monthlyTableData.map((row, i) => (
                       <tr key={row.year} className="border-b border-border last:border-0 hover:bg-secondary/40 transition-colors">
                          <td className="p-4 text-xs font-bold text-foreground border-r border-border/50 bg-secondary/5">{row.year}</td>
                          {[0,1,2,3,4,5,6,7,8,9,10,11].map(m => (
                             <td key={m} className={`p-4 text-xs font-semibold text-center border-r border-border/50 ${row[m] === null ? 'text-muted-foreground opacity-30 cursor-not-allowed' : row[m] > 0 ? 'text-emerald-500' : row[m] < 0 ? 'text-red-500' : 'text-slate-500'}`}>
                                {row[m] === null ? '-' : `${row[m] > 0 ? '+' : ''}${row[m].toFixed(2)}%`}
                             </td>
                          ))}
                          <td className={`p-4 text-xs font-bold text-center bg-primary/5 ${row.ytd > 0 ? 'text-primary' : row.ytd < 0 ? 'text-red-500' : 'text-slate-500'}`}>
                             {row.ytd === null ? '-' : `${row.ytd > 0 ? '+' : ''}${row.ytd.toFixed(2)}%`}
                          </td>
                       </tr>
                    ))}
                 </tbody>
               </table>
               {monthlyTableData.length === 0 && (
                   <div className="p-8 text-center text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-50">
                       Sem histórico de transações suficiente
                   </div>
               )}
            </div>
          </motion.div>
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
