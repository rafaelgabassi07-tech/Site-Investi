import { usePortfolio } from '../hooks/usePortfolio';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, PieChart as PieIcon, Calendar, BarChart3 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { financeService } from '../services/financeService';

export function PortfolioSummary() {
  const { portfolio, quotaHistory } = usePortfolio();
  const [dividends, setDividends] = useState<any[]>([]);
  const [loadingDivs, setLoadingDivs] = useState(true);
  
  const totalInvested = portfolio.reduce((acc, item) => acc + item.totalInvested, 0);
  const currentTotalValue = portfolio.reduce((acc, item) => acc + (item.currentValue || item.totalInvested), 0);
  const totalProfit = currentTotalValue - totalInvested;
  const totalProfitPercentage = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

  useEffect(() => {
    console.log('PortfolioSummary: portfolio', portfolio);
    console.log('PortfolioSummary: quotaHistory', quotaHistory);
    async function fetchDividends() {
      setLoadingDivs(true);
      try {
        const tickers = portfolio.map(p => p.ticker);
        const results = await Promise.all(
          tickers.slice(0, 10).map(async (ticker) => {
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
  }, [portfolio, quotaHistory]);

  const totalDividends = dividends.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const allocationData = portfolio.reduce((acc: any[], item) => {
    const existing = acc.find(a => a.name === item.assetType);
    if (existing) {
      existing.value += item.currentValue || item.totalInvested;
    } else {
      acc.push({ name: item.assetType, value: item.currentValue || item.totalInvested });
    }
    return acc;
  }, []).sort((a, b) => b.value - a.value);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

  return (
    <div className="space-y-6 mb-8">
      <Link to="/portfolio/resumo" className="block">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 hover:opacity-90 transition-opacity">
          {/* Main Stats */}
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-6 bg-[#0f172a] border border-slate-800 rounded-2xl">
              <div className="flex items-center gap-3 mb-2 text-slate-400">
                <DollarSign size={18} />
                <span className="text-xs font-bold uppercase tracking-widest">Patrimônio</span>
              </div>
              <p className="text-2xl font-black text-white tracking-tight">R$ {currentTotalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            
            <div className="p-6 bg-[#0f172a] border border-slate-800 rounded-2xl">
              <div className="flex items-center gap-3 mb-2 text-slate-400">
                {totalProfit >= 0 ? <TrendingUp size={18} className="text-emerald-500" /> : <TrendingDown size={18} className="text-red-500" />}
                <span className="text-xs font-bold uppercase tracking-widest">Lucro / Prejuízo</span>
              </div>
              <p className={`text-2xl font-black tracking-tight ${totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                R$ {Math.abs(totalProfit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className={`text-xs font-bold mt-1 ${totalProfit >= 0 ? 'text-emerald-500/80' : 'text-red-500/80'}`}>
                {totalProfit >= 0 ? '+' : ''}{totalProfitPercentage.toFixed(2)}%
              </p>
            </div>

            <div className="p-6 bg-[#0f172a] border border-slate-800 rounded-2xl">
              <div className="flex items-center gap-3 mb-2 text-slate-400">
                <Calendar size={18} />
                <span className="text-xs font-bold uppercase tracking-widest">Proventos</span>
              </div>
              <p className="text-2xl font-black text-white tracking-tight">
                {loadingDivs ? '...' : `R$ ${totalDividends.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              </p>
            </div>
          </div>
          
          {/* Allocation */}
          <div className="p-6 bg-[#0f172a] border border-slate-800 rounded-2xl flex items-center gap-6">
            <div className="h-24 w-24 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={allocationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={45}
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
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <PieIcon size={16} />
                <span className="text-xs font-bold uppercase tracking-widest">Alocação</span>
              </div>
              {allocationData.slice(0, 2).map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="text-[10px] font-medium text-slate-300">{item.name}</span>
                  </div>
                  <span className="text-[10px] font-bold text-white">{((item.value / currentTotalValue) * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Link>

      {/* Performance Chart */}
      <div className="p-6 bg-[#0f172a] border border-slate-800 rounded-2xl">
        <div className="flex items-center gap-3 mb-6 text-slate-400">
          <BarChart3 size={18} />
          <span className="text-xs font-bold uppercase tracking-widest">Evolução do Patrimônio</span>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={quotaHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#475569" fontSize={12} tickFormatter={(val) => val.split('-')[1]} />
              <YAxis stroke="#475569" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Area type="monotone" dataKey="totalPatrimony" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
