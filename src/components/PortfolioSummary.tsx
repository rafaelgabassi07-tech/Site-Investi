import { usePortfolio } from '../hooks/usePortfolio';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, PieChart as PieIcon, Calendar, BarChart3, ArrowUpRight, ArrowDownRight, Target, Briefcase, Layers } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { financeService } from '../services/financeService';
import { getHistoricalQuantity } from '../lib/portfolioCalc';

export function PortfolioSummary() {
  const { portfolio, quotaHistory, transactions, dividends } = usePortfolio();
  
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
      {/* Top Cards - Investidor10 Style */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 bg-[#0f172a] border border-slate-800 rounded-3xl shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Briefcase size={64} />
          </div>
          <div className="flex items-center gap-2 mb-3 text-slate-500 font-bold uppercase tracking-widest text-[9px]">
            <Briefcase className="w-3 h-3" />
            <span>Patrimônio Total</span>
          </div>
          <p className="text-2xl md:text-3xl font-display font-bold text-white tracking-tighter mb-2">
            R$ {currentTotalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Custo: R$ {totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</span>
            <div className="w-1 h-1 bg-slate-800 rounded-full" />
            <span className="text-[10px] font-black text-blue-500/60 uppercase tracking-widest">{portfolio.length} ATIVOS</span>
          </div>
        </div>

        <div className="p-6 bg-[#0f172a] border border-slate-800 rounded-3xl shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp size={64} />
          </div>
          <div className="flex items-center gap-2 mb-3 text-slate-500 font-bold uppercase tracking-widest text-[9px]">
            <TrendingUp className="w-3 h-3" />
            <span>Rentabilidade</span>
          </div>
          <p className={`text-2xl md:text-3xl font-display font-bold tracking-tighter mb-2 ${totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {totalProfit >= 0 ? '+' : ''}{totalProfitPercentage.toFixed(2)}%
          </p>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-black uppercase tracking-widest ${totalProfit >= 0 ? 'text-emerald-500/60' : 'text-red-500/60'}`}>
              Lucro: R$ {totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        <div className="p-6 bg-[#0f172a] border border-slate-800 rounded-3xl shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Calendar size={64} />
          </div>
          <div className="flex items-center gap-2 mb-3 text-slate-500 font-bold uppercase tracking-widest text-[9px]">
            <Calendar className="w-3 h-3" />
            <span>Proventos Acumulados</span>
          </div>
          <p className="text-2xl md:text-3xl font-display font-bold text-white tracking-tighter mb-2">
            R$ {totalDividends.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Yield On Cost: {dividendYield.toFixed(2)}%</span>
          </div>
        </div>

        <div className="p-6 bg-[#0f172a] border border-slate-800 rounded-3xl shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Target size={64} />
          </div>
          <div className="flex items-center gap-2 mb-3 text-slate-500 font-bold uppercase tracking-widest text-[9px]">
            <Target className="w-3 h-3" />
            <span>Progresso da Meta</span>
          </div>
          <p className="text-2xl md:text-3xl font-display font-bold text-white tracking-tighter mb-2">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Allocation Chart */}
        <div id="composicao" className="p-5 bg-[#0f172a] border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-slate-400">
              <PieIcon className="icon-sm" />
              <span className="text-label">Composição</span>
            </div>
            <Link to="/portfolio" className="text-label text-blue-500 hover:underline">Detalhes</Link>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={allocationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {allocationData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {allocationData.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-slate-900/50 rounded-lg border border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-[10px] font-bold text-slate-400 truncate max-w-[60px]">{item.name}</span>
                </div>
                <span className="text-[10px] font-black text-white">{((item.value / currentTotalValue) * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Dividends Chart */}
        <div className="p-5 bg-[#0f172a] border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-slate-400">
              <Calendar className="icon-sm" />
              <span className="text-label">Proventos Mensais</span>
            </div>
            <Link to="/portfolio/proventos" className="text-label text-blue-500 hover:underline">Agenda</Link>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyDividends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#475569" fontSize={10} tickFormatter={(val) => (typeof val === 'string' ? val.split('-')[1] : '')} />
                <YAxis stroke="#475569" fontSize={10} hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 p-3 bg-blue-600/5 border border-blue-500/10 rounded-xl">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Média Mensal</span>
              <span className="text-xs font-black text-white">R$ {(totalDividends / 12).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Performance Evolution */}
        <div id="evolucao" className="p-5 bg-[#0f172a] border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-slate-400">
              <BarChart3 className="icon-sm" />
              <span className="text-label">Evolução</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-tiny font-bold text-slate-500 uppercase tracking-widest">Carteira</span>
              </div>
            </div>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={quotaHistory}>
                <defs>
                  <linearGradient id="colorPatrimony" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#475569" fontSize={10} tickFormatter={(val) => (typeof val === 'string' ? val.split('-')[1] : '')} />
                <YAxis stroke="#475569" fontSize={10} hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="totalPatrimony" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorPatrimony)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 p-3 bg-slate-900/50 border border-slate-800 rounded-xl">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Variação Período</span>
              <span className={`text-xs font-black ${totalProfitPercentage >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {totalProfitPercentage >= 0 ? '+' : ''}{totalProfitPercentage.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
