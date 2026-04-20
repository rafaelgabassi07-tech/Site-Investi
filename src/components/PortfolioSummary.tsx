import { usePortfolio } from '../hooks/usePortfolio';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar, ReferenceLine } from 'recharts';
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
        className="p-5 bg-blue-600/[0.03] border border-blue-500/10 rounded-xl md:rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative group"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[50px] -z-10 group-hover:scale-150 transition-transform duration-1000" />
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.25em] italic mb-1">Nexus Portfolio Intel</h4>
            <p className="text-xs md:text-sm font-bold text-foreground leading-relaxed italic max-w-2xl">
              "{portfolioInsight}"
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
            <div className="px-3 py-1 bg-secondary border border-border rounded-lg text-[9px] font-bold text-muted-foreground uppercase italic tracking-widest">
              Live Telemetry
            </div>
            <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/10 rounded-lg text-[9px] font-bold text-emerald-500 uppercase italic tracking-widest">
              Optimized
            </div>
        </div>
      </motion.div>

      {/* Top Cards - Investidor10 Style */}
      <div className="nexus-grid">
        <div className="nexus-card">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity dark:text-white text-slate-900">
            <Briefcase size={64} />
          </div>
          <div className="flex items-center gap-2 mb-3">
            <Briefcase className="w-3 h-3 text-slate-500" />
            <span className="nexus-label">Patrimônio Total</span>
          </div>
          <p className="nexus-hero mb-2 tracking-tighter mask-value">
            {showValues ? formatNumber(currentTotalValue, { style: 'currency' }) : 'R$ ••••••'}
          </p>
          <div className="flex items-center gap-2 mask-value">
            <span className="nexus-label opacity-60">Custo: {showValues ? formatNumber(totalInvested, { style: 'currency' }) : '••••••'}</span>
            <div className="w-1 h-1 bg-slate-800 rounded-full" />
            <span className="nexus-label text-blue-500/60">{portfolio.length} ATIVOS</span>
          </div>
        </div>

        <div className="nexus-card group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity dark:text-white text-slate-900">
            <TrendingUp size={64} />
          </div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-3 h-3 text-slate-500" />
            <span className="nexus-label">Rentabilidade</span>
          </div>
          <p className={`nexus-hero mb-2 tracking-tighter mask-value ${totalProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {showValues ? `${totalProfit >= 0 ? '+' : ''}${formatNumber(totalProfitPercentage)}%` : '•••%'}
          </p>
          <div className="flex items-center gap-2 mask-value">
            <span className={`nexus-label ${totalProfit >= 0 ? 'text-emerald-500/60' : 'text-red-500/60'}`}>
              Lucro: {showValues ? formatNumber(totalProfit, { style: 'currency' }) : '••••••'}
            </span>
          </div>
        </div>

        <div className="nexus-card group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity dark:text-white text-slate-900">
            <Calendar size={64} />
          </div>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-3 h-3 text-slate-500" />
            <span className="nexus-label">Proventos Acumulados</span>
          </div>
          <p className="nexus-hero mb-2 tracking-tighter mask-value">
            {showValues ? formatNumber(totalDividends, { style: 'currency' }) : 'R$ ••••••'}
          </p>
          <div className="flex items-center gap-2 mask-value">
            <span className="nexus-label opacity-60">Yield On Cost: {showValues ? `${formatNumber(dividendYield)}%` : '•••%'}</span>
          </div>
        </div>

        <div className="nexus-card">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity dark:text-white text-slate-900">
            <Target size={64} />
          </div>
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-3 h-3 text-slate-500" />
            <span className="nexus-label">Progresso da Meta</span>
          </div>
          <p className="nexus-hero mb-2">
            {((currentTotalValue / 100000) * 100).toFixed(1)}%
          </p>
          <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
            <div 
              className="bg-blue-600 h-full transition-all duration-1000" 
              style={{ width: `${Math.min(100, (currentTotalValue / 100000) * 100)}%` }} 
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4">
        {/* Allocation Chart */}
        <div id="composicao" className="nexus-card">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[50px] -z-10 group-hover:scale-150 transition-transform duration-1000" />
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                <PieIcon className="w-4 h-4" />
              </div>
              <span className="nexus-label">Composição</span>
            </div>
            <Link to="/portfolio" className="nexus-label text-blue-500 hover:text-blue-400">Análise Completa</Link>
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
                      stroke="rgba(255,255,255,0.05)"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-popover/95 border border-border p-3 rounded-2xl shadow-2xl backdrop-blur-3xl">
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 italic">{payload[0].name}</p>
                          <p className="text-sm font-black text-foreground italic">{formatNumber(payload[0].value, { style: 'currency' })}</p>
                          <p className="text-[9px] font-bold text-blue-500 mt-1 uppercase tracking-widest">Nexus Verified</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] italic">Total</span>
              <span className="text-lg font-display font-black text-foreground italic tracking-tighter">100%</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-6">
            {allocationData.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-2.5 bg-secondary/50 rounded-xl border border-border group/item hover:border-blue-500/20 transition-all">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] transition-all group-hover/item:scale-125" style={{ color: COLORS[idx % COLORS.length], backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="nexus-label group-hover/item:text-foreground">{item.name}</span>
                </div>
                <span className="nexus-title">{((item.value / currentTotalValue) * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Dividends Chart */}
        <div className="nexus-card">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[50px] -z-10 group-hover:scale-150 transition-transform duration-1000" />
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                <Calendar className="w-4 h-4" />
              </div>
              <span className="nexus-label">Proventos</span>
            </div>
            <Link to="/portfolio/proventos" className="nexus-label text-emerald-500 hover:text-emerald-400">Calendário</Link>
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
                <CartesianGrid strokeDasharray="0" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#475569" 
                  fontSize={9} 
                  fontWeight="900"
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => (typeof val === 'string' ? val.split('-')[1] : '')} 
                  className="uppercase italic"
                />
                <YAxis stroke="#475569" fontSize={9} hide />
                <Tooltip 
                  cursor={{ fill: 'rgba(59, 130, 246, 0.05)', radius: 8 }}
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-popover/95 border border-border p-3 rounded-2xl shadow-2xl backdrop-blur-3xl">
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 italic">Mensal</p>
                          <p className="text-sm font-black text-emerald-500 italic">{formatNumber(payload[0].value, { style: 'currency' })}</p>
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
          <div className="mt-6 p-4 bg-emerald-500/[0.03] border border-emerald-500/10 rounded-2xl flex items-center justify-between">
            <div>
              <p className="nexus-label mb-1">Média Mensal</p>
              <p className="nexus-stat text-emerald-500">{formatNumber(totalDividends / 12, { style: 'currency' })}</p>
            </div>
            <TrendingUp size={24} className="text-emerald-500/20" />
          </div>
        </div>

        {/* Performance Evolution */}
        <div id="evolucao" className="nexus-card">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/5 blur-[60px] -z-10 group-hover:scale-150 transition-transform duration-1000" />
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-600 border border-blue-600/20">
                <BarChart3 className="w-4 h-4" />
              </div>
              <span className="nexus-label">Evolução</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                <span className="nexus-label text-foreground">Carteira</span>
              </div>
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={quotaHistory} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPatrimony" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <filter id="evolutionGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="6" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="0" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#475569" 
                  fontSize={9} 
                  fontWeight="900"
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => (typeof val === 'string' ? val.split('-')[1] : '')}
                  className="uppercase italic"
                />
                <YAxis stroke="#475569" fontSize={9} hide />
                <Tooltip 
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-popover/95 border border-border p-3 rounded-2xl shadow-2xl backdrop-blur-3xl">
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 italic">Patrimônio</p>
                          <p className="text-sm font-black text-blue-500 italic">{formatNumber(payload[0].value, { style: 'currency' })}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="totalPatrimony" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorPatrimony)" 
                  filter="url(#evolutionGlow)"
                  animationDuration={2000}
                />
              </AreaChart>
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

      {/* Top Assets Insight */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="nexus-card bg-emerald-500/[0.02] border-emerald-500/10">
          <div className="flex items-center gap-2 mb-4">
            <ArrowUpRight className="w-3 h-3 text-emerald-500" />
            <span className="nexus-label text-emerald-500 italic">Top 3 Performance</span>
          </div>
          <div className="space-y-3">
            {portfolio.length > 0 ? (
              [...portfolio]
                .sort((a, b) => (b.profitPercentage || 0) - (a.profitPercentage || 0))
                .slice(0, 3)
                .map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10 group hover:border-emerald-500/30 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center font-black text-[10px] text-emerald-500 italic">
                        {item.ticker.slice(0, 2)}
                      </div>
                      <span className="text-xs font-black text-foreground uppercase italic">{item.ticker}</span>
                    </div>
                    <span className="text-xs font-black text-emerald-500 italic">
                      +{formatNumber(item.profitPercentage || 0)}%
                    </span>
                  </div>
                ))
            ) : (
              <p className="text-[10px] text-slate-500 italic">Aguardando dados...</p>
            )}
          </div>
        </div>

        <div className="nexus-card bg-red-500/[0.02] border-red-500/10">
          <div className="flex items-center gap-2 mb-4">
            <ArrowDownRight className="w-3 h-3 text-red-500" />
            <span className="nexus-label text-red-500 italic">Menores Performances</span>
          </div>
          <div className="space-y-3">
            {portfolio.length > 0 ? (
              [...portfolio]
                .sort((a, b) => (a.profitPercentage || 0) - (b.profitPercentage || 0))
                .slice(0, 3)
                .map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-red-500/5 rounded-xl border border-red-500/10 group hover:border-red-500/30 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center font-black text-[10px] text-red-500 italic">
                        {item.ticker.slice(0, 2)}
                      </div>
                      <span className="text-xs font-black text-foreground uppercase italic">{item.ticker}</span>
                    </div>
                    <span className="text-xs font-black text-red-500 italic">
                      {formatNumber(item.profitPercentage || 0)}%
                    </span>
                  </div>
                ))
            ) : (
              <p className="text-[10px] text-slate-500 italic">Aguardando dados...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
