import { usePortfolio } from '../hooks/usePortfolio';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, PieChart as PieIcon, Calendar, BarChart3, ArrowUpRight, ArrowDownRight, Target, Briefcase, Layers } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { financeService } from '../services/financeService';

export function PortfolioSummary() {
  const { portfolio, quotaHistory, transactions } = usePortfolio();
  const [dividends, setDividends] = useState<any[]>([]);
  const [loadingDivs, setLoadingDivs] = useState(true);
  
  const totalInvested = portfolio.reduce((acc, item) => acc + item.totalInvested, 0);
  const currentTotalValue = portfolio.reduce((acc, item) => acc + (item.currentValue || item.totalInvested), 0);
  const totalProfit = currentTotalValue - totalInvested;
  const totalProfitPercentage = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

  // Calculate monthly dividends
  const monthlyDividends = useMemo(() => {
    const months: Record<string, number> = {};
    dividends.forEach(d => {
      const date = new Date(d.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months[key] = (months[key] || 0) + (d.amount || 0);
    });
    return Object.entries(months)
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-6); // Last 6 months
  }, [dividends]);

  useEffect(() => {
    async function fetchDividends() {
      setLoadingDivs(true);
      try {
        const tickers = portfolio.map(p => p.ticker);
        const results = await Promise.all(
          tickers.slice(0, 15).map(async (ticker) => {
            try {
              const divs = await financeService.getAssetDividends(ticker);
              return Array.isArray(divs) ? divs : [];
            } catch { return []; }
          })
        );
        setDividends(results.flat());
      } finally {
        setLoadingDivs(false);
      }
    }
    if (portfolio.length > 0) fetchDividends();
    else setLoadingDivs(false);
  }, [portfolio]);

  const totalDividends = dividends.reduce((acc, curr) => acc + (curr.amount || 0), 0);
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 bg-[#0f172a] border border-slate-800 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 mb-1 text-slate-500">
            <Briefcase size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Patrimônio Total</span>
          </div>
          <p className="text-lg md:text-xl font-black text-white tracking-tight">
            R$ {currentTotalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-[10px] font-bold text-slate-500">Investido: R$ {totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</span>
          </div>
        </div>

        <div className="p-4 bg-[#0f172a] border border-slate-800 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 mb-1 text-slate-500">
            <TrendingUp size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Rentabilidade</span>
          </div>
          <p className={`text-lg md:text-xl font-black tracking-tight ${totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {totalProfit >= 0 ? '+' : ''}{totalProfitPercentage.toFixed(2)}%
          </p>
          <div className="flex items-center gap-1 mt-1">
            <span className={`text-[10px] font-bold ${totalProfit >= 0 ? 'text-emerald-500/60' : 'text-red-500/60'}`}>
              R$ {totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        <div className="p-4 bg-[#0f172a] border border-slate-800 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 mb-1 text-slate-500">
            <Calendar size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Proventos (Total)</span>
          </div>
          <p className="text-lg md:text-xl font-black text-white tracking-tight">
            R$ {totalDividends.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-[10px] font-bold text-slate-500">Yield: {dividendYield.toFixed(2)}%</span>
          </div>
        </div>

        <div className="p-4 bg-[#0f172a] border border-slate-800 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 mb-1 text-slate-500">
            <Target size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Meta Alcançada</span>
          </div>
          <p className="text-lg md:text-xl font-black text-white tracking-tight">
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
              <PieIcon size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">Composição</span>
            </div>
            <Link to="/portfolio" className="text-[10px] font-bold text-blue-500 hover:underline uppercase">Detalhes</Link>
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
              <Calendar size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">Proventos Mensais</span>
            </div>
            <Link to="/portfolio/proventos" className="text-[10px] font-bold text-blue-500 hover:underline uppercase">Agenda</Link>
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
              <BarChart3 size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">Evolução</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-[8px] font-bold text-slate-500 uppercase">Carteira</span>
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
