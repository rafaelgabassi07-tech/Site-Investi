import { usePortfolio } from '../hooks/usePortfolio';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar, ReferenceLine, ComposedChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, PieChart as PieIcon, Calendar, BarChart3, ArrowUpRight, ArrowDownRight, Target, Briefcase, Layers, Cpu, Activity } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { financeService } from '../services/financeService';
import { getHistoricalQuantity } from '../lib/portfolioCalc';

import { nexusAI } from '../services/nexusAIService';

import { formatNumber } from '../lib/utils';
import { usePrivacy } from '../hooks/usePrivacy';

export function PortfolioSummary() {
  const { portfolio, quotaHistory, transactions, dividends } = usePortfolio();
  const { hideValues } = usePrivacy();
  const showValues = !hideValues;
  const [portfolioInsight, setPortfolioInsight] = useState('Nexus Engine analisando sua alocação...');

  useEffect(() => {
    async function loadAnalysis() {
      const insight = await nexusAI.getPortfolioAnalysis(portfolio);
      setPortfolioInsight(insight);
    }
    if (portfolio.length > 0) loadAnalysis();
  }, [portfolio]);
  
  const totalInvested = portfolio.reduce((acc, item) => acc + item.totalInvested, 0);
  const currentTotalValue = portfolio.reduce((acc, item) => acc + (item.currentValue || item.totalInvested), 0);
  const totalProfit = currentTotalValue - totalInvested;
  const totalProfitPercentage = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

  // Calculate monthly dividends using historical quantity for accuracy
  const monthlyDividends = (() => {
    const months: Record<string, number> = {};
    dividends?.forEach(d => {
      const date = new Date(d.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const qty = getHistoricalQuantity(d.ticker, d.date, portfolio);
      months[key] = (months[key] || 0) + ((d.amount || 0) * qty);
    });
    return Object.entries(months)
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-6); // Last 6 months
  })();

  const totalDividends = (dividends || []).reduce((acc, curr) => {
    const qty = getHistoricalQuantity(curr.ticker, curr.date, portfolio);
    return acc + ((curr.amount || 0) * qty);
  }, 0);
  const dividendYield = currentTotalValue > 0 ? (totalDividends / currentTotalValue) * 100 : 0;

  const [timeFilter, setTimeFilter] = useState<'1M' | '6M' | '1Y' | 'ALL'>('ALL');

  const filteredQuotaHistory = useMemo(() => {
    if (!quotaHistory || !quotaHistory.length) return [];
    
    const sorted = [...quotaHistory].sort((a,b) => a.date.localeCompare(b.date));
    
    if (timeFilter === 'ALL') return sorted;
    
    // We compare strings like '2023-10-01'. Let's calculate the cutoff date string.
    const now = new Date();
    const months = timeFilter === '1M' ? 1 : timeFilter === '6M' ? 6 : 12;
    now.setMonth(now.getMonth() - months);
    
    const cutoffDateStr = now.toISOString().split('T')[0];
    
    let lastBeforeIndex = -1;
    for (let i = 0; i < sorted.length; i++) {
       if (sorted[i].date < cutoffDateStr) {
           lastBeforeIndex = i;
       } else {
           break;
       }
    }
    
    const filtered = sorted.filter(q => q.date >= cutoffDateStr);
    
    if (lastBeforeIndex >= 0 && (filtered.length === 0 || filtered[0].date !== cutoffDateStr)) {
       // Insert a dummy point exactly at cutoff with the previous known values, so the chart line continues seamlessly
       filtered.unshift({
           ...sorted[lastBeforeIndex],
           date: cutoffDateStr
       });
    }
    
    // Always ensure the current day is in the chart to show a flat line continuing up to today
    const todayStr = new Date().toISOString().split('T')[0];
    if (filtered.length > 0 && filtered[filtered.length - 1].date.split('T')[0] < todayStr) {
        filtered.push({
           ...filtered[filtered.length - 1],
           date: todayStr
        });
    }

    return filtered;
  }, [quotaHistory, timeFilter]);

  const allocationData = useMemo(() => {
    return portfolio.reduce((acc: any[], item) => {
      const existing = acc.find(a => a.name === item.assetType);
      if (existing) {
        existing.value += item.currentValue || item.totalInvested;
      } else {
        acc.push({ name: item.assetType, value: item.currentValue || item.totalInvested });
      }
      return acc;
    }, []).sort((a, b) => b.value - a.value);
  }, [portfolio]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

  return (
    <div className="space-y-4">
      {/* Nexus Intelligence Section */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-5 bg-card border border-border rounded-xl flex flex-col md:flex-row items-center justify-between gap-6 relative group shadow-sm transition-all hover:border-primary/20"
      >
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10 transition-colors group-hover:bg-primary group-hover:text-white shrink-0">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h4 className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-1">Nexus Portfolio Intel</h4>
            <p className="text-xs md:text-sm font-semibold text-muted-foreground leading-relaxed max-w-2xl">
              "{portfolioInsight}"
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
            <div className="px-3 py-1 bg-secondary border border-border rounded-lg text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
              Telemetria Viva
            </div>
            <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[9px] font-bold text-emerald-600 uppercase tracking-widest">
              Otimizado
            </div>
        </div>
      </motion.div>

      {/* Top Cards - Formal & Professional */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl overflow-hidden relative shadow-sm"
      >
        <div className="p-5 md:p-6 grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Briefcase className="w-3 h-3 text-primary" />
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Patrimônio Total</span>
            </div>
            <div className="text-xl font-bold text-foreground mask-value">
              {showValues ? formatNumber(currentTotalValue, { style: 'currency' }) : 'R$ ••••••'}
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 mb-1.5">
              <TrendingUp className={`w-3 h-3 ${totalProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Lucro Total</span>
            </div>
            <div className={`text-xl font-bold mask-value ${totalProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {showValues ? formatNumber(totalProfit, { style: 'currency' }) : 'R$ •••••'}
              <span className="text-xs ml-2">({totalProfit >= 0 ? '+' : ''}{formatNumber(totalProfitPercentage)}%)</span>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Calendar className="w-3 h-3 text-amber-600" />
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Dividendos</span>
            </div>
            <div className="text-xl font-bold text-foreground mask-value">
              {showValues ? formatNumber(totalDividends, { style: 'currency' }) : 'R$ ••••••'}
              <span className="text-xs text-amber-600 ml-2">(YOC {formatNumber(dividendYield)}%)</span>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Target className="w-3 h-3 text-purple-600" />
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Progresso (Meta 100k)</span>
            </div>
            <div className="flex flex-col gap-1.5 mt-1">
              <div className="text-lg font-bold text-foreground leading-none">
                {Math.min(100, (currentTotalValue / 100000) * 100).toFixed(1)}%
              </div>
              <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden border border-border mt-0.5">
                <div 
                  className="bg-purple-600 h-full transition-all duration-1000" 
                  style={{ width: `${Math.min(100, (currentTotalValue / 100000) * 100)}%` }} 
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4">
        {/* Allocation Chart */}
        <div id="composicao" className="nexus-card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0">
                <PieIcon className="w-4 h-4" />
              </div>
              <span className="nexus-label">Composição</span>
            </div>
            <Link to="/portfolio" className="nexus-label text-primary hover:text-primary/80">Análise Completa</Link>
          </div>
          <div className="h-56 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={allocationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                  animationDuration={1500}
                  animationEasing="ease-out"
                >
                  {allocationData.map((entry: any, index: number) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                      stroke="var(--color-card)"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-popover border border-border p-3 rounded-xl shadow-lg">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{payload[0].name}</p>
                          <p className="text-sm font-bold text-foreground">{formatNumber(payload[0].value, { style: 'currency' })}</p>
                          <p className="text-[9px] font-bold text-primary mt-1 uppercase tracking-widest">Nexus Verified</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Total</span>
              <span className="text-lg font-bold text-foreground tracking-tighter">100%</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-6">
            {allocationData.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-2.5 bg-secondary rounded-xl border border-border group/item hover:border-primary/20 transition-all">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="nexus-label group-hover/item:text-foreground">{item.name}</span>
                </div>
                <span className="nexus-title">{((item.value / currentTotalValue) * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Dividends Chart */}
        <div className="nexus-card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 border border-amber-500/20 shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <span className="nexus-label">Proventos</span>
            </div>
            <Link to="/portfolio/proventos" className="nexus-label text-amber-600 hover:text-amber-500">Calendário</Link>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyDividends} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDividends" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.3}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="0" stroke="var(--color-border)" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="var(--color-muted-foreground)" 
                  fontSize={8} 
                  fontWeight="700"
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => {
                    const [y, m] = (val || '').split('-');
                    if (!m) return '';
                    const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
                    return `${months[parseInt(m) - 1]}/${y.slice(2)}`;
                  }} 
                />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={9} hide />
                <Tooltip 
                  cursor={{ fill: 'var(--color-secondary)', radius: 8 }}
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-popover border border-border p-3 rounded-xl shadow-lg">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Mensal</p>
                          <p className="text-sm font-bold text-emerald-600">{formatNumber(payload[0].value, { style: 'currency' })}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine 
                  y={monthlyDividends.reduce((acc, curr) => acc + curr.value, 0) / monthlyDividends.length} 
                  stroke="#10b981" 
                  strokeDasharray="4 4" 
                  opacity={0.4} 
                  label={{ position: 'right', value: 'Média', fill: '#10b981', fontSize: 8, fontWeight: 'bold' }} 
                />
                <Bar 
                  dataKey="value" 
                  fill="#10b981" 
                  radius={[6, 6, 0, 0]} 
                  animationDuration={1500}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center justify-between">
            <div>
              <p className="nexus-label mb-1">Média Mensal</p>
              <p className="nexus-stat text-emerald-600">{formatNumber(totalDividends / 12, { style: 'currency' })}</p>
            </div>
            <TrendingUp size={24} className="text-emerald-500/20" />
          </div>
        </div>

        {/* Performance Evolution */}
        <div id="evolucao" className="nexus-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0">
                <BarChart3 className="w-4 h-4" />
              </div>
              <span className="nexus-label">Evolução</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(['1M', '6M', '1Y', 'ALL'] as const).map(tf => (
                <button
                  key={tf}
                  onClick={() => setTimeFilter(tf)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold tracking-widest transition-all ${
                    timeFilter === tf 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'bg-secondary text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {tf === 'ALL' ? 'TUDO' : tf}
                </button>
              ))}
              <div className="flex items-center gap-1.5 ml-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                <span className="text-[10px] uppercase font-bold tracking-widest text-foreground">Live</span>
              </div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={filteredQuotaHistory} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPatrimony" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="0" stroke="var(--color-border)" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="var(--color-muted-foreground)" 
                  fontSize={8} 
                  fontWeight="700"
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => {
                    const date = new Date(val);
                    if (isNaN(date.getTime())) return '';
                    const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
                    return `${months[date.getMonth()]}/${date.getFullYear().toString().slice(2)}`;
                  }}
                />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={9} hide />
                <Tooltip 
                  cursor={{ fill: 'var(--color-secondary)', radius: 8 }}
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-popover border border-border p-3 rounded-xl shadow-lg space-y-2">
                          <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Patrimônio</p>
                            <p className="text-sm font-bold text-primary">{formatNumber(payload.find((p: any) => p.dataKey === 'totalPatrimony')?.value || 0, { style: 'currency' })}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Custo Investido</p>
                            <p className="text-xs font-bold text-muted-foreground">{formatNumber(payload.find((p: any) => p.dataKey === 'totalInvested')?.value || 0, { style: 'currency' })}</p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="totalInvested" 
                  fill="var(--color-secondary)" 
                  radius={[6, 6, 0, 0]} 
                  animationDuration={1500}
                />
                <Line 
                  type="monotone" 
                  dataKey="totalPatrimony" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  dot={false}
                  activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                  filter="url(#evolutionGlow)"
                  animationDuration={2000}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 p-4 bg-secondary/50 border border-border rounded-2xl flex items-center justify-between group/perf">
              <div>
                <p className="nexus-label mb-1">Variação Total</p>
                <p className={`nexus-stat ${totalProfitPercentage >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {totalProfitPercentage >= 0 ? '+' : ''}{totalProfitPercentage.toFixed(2)}%
                </p>
              </div>
              <Activity size={24} className={`opacity-20 group-hover/perf:scale-125 transition-transform ${totalProfitPercentage >= 0 ? 'text-emerald-500' : 'text-red-500'}`} />
          </div>
        </div>
      </div>

      {/* Performance Highlights - Combined & Compact */}
      <div className="pb-12">
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-border bg-secondary/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-bold text-foreground uppercase tracking-widest">Movimentações de Performance</h3>
            </div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Os 3 Melhores e 3 Piores</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
            {/* Winners */}
            <div className="p-4 space-y-1">
              <div className="flex items-center gap-2 mb-3">
                <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.2em]">Líderes</span>
              </div>
              {portfolio.length > 0 ? (
                [...portfolio]
                  .sort((a, b) => (b.profitPercentage || 0) - (a.profitPercentage || 0))
                  .slice(0, 3)
                  .map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-secondary transition-colors group">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-foreground uppercase group-hover:text-primary transition-colors">{item.ticker}</span>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{item.assetType}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-bold text-emerald-600">+{formatNumber(item.profitPercentage || 0)}%</span>
                        <span className="text-[9px] font-medium text-muted-foreground mask-value">
                          {showValues ? `+${formatNumber(item.profit || 0, { style: 'currency' })}` : 'R$ •••••'}
                        </span>
                      </div>
                    </div>
                  ))
              ) : (
                <p className="text-[10px] text-muted-foreground opacity-60 uppercase italic p-3">Nenhum dado disponível</p>
              )}
            </div>

            {/* Losers */}
            <div className="p-4 space-y-1">
              <div className="flex items-center gap-2 mb-3">
                <ArrowDownRight className="w-4 h-4 text-red-600" />
                <span className="text-[10px] font-bold text-red-600 uppercase tracking-[0.2em]">Retardatários</span>
              </div>
              {portfolio.length > 0 ? (
                [...portfolio]
                  .sort((a, b) => (a.profitPercentage || 0) - (b.profitPercentage || 0))
                  .slice(0, 3)
                  .map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-secondary transition-colors group">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-foreground uppercase group-hover:text-primary transition-colors">{item.ticker}</span>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{item.assetType}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-bold text-red-600">{formatNumber(item.profitPercentage || 0)}%</span>
                        <span className="text-[9px] font-medium text-muted-foreground mask-value">
                          {showValues ? `${formatNumber(item.profit || 0, { style: 'currency' })}` : 'R$ •••••'}
                        </span>
                      </div>
                    </div>
                  ))
              ) : (
                <p className="text-[10px] text-muted-foreground opacity-60 uppercase italic p-3">Nenhum dado disponível</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
