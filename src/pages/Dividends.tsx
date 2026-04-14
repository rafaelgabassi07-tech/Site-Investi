import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Calendar, DollarSign, ArrowUpRight, Loader2, TrendingUp, PieChart, BarChart3 } from 'lucide-react';
import { motion } from 'motion/react';
import { financeService } from '../services/financeService';
import { usePortfolio } from '../hooks/usePortfolio';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { PortfolioNav } from '../components/PortfolioNav';

export default function Dividends() {
  const { portfolio, loading: loadingPortfolio } = usePortfolio();
  const [dividends, setDividends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Todos');

  useEffect(() => {
    async function fetchAllDividends() {
      setLoading(true);
      try {
        const tickers = portfolio.length > 0 
          ? portfolio.map(p => p.ticker)
          : ['PETR4', 'VALE3', 'ITUB4', 'BBAS3', 'MXRF11', 'BBDC4', 'ABEV3', 'WEGE3', 'SANB11', 'TAEE11'];
        
        const results = await Promise.all(
          tickers.slice(0, 20).map(async (ticker) => {
            try {
              const divs = await financeService.getAssetDividends(ticker);
              if (!divs || !Array.isArray(divs)) return [];
              
              return divs.map(d => ({
                ...d,
                ticker,
                name: ticker,
                type: ticker.endsWith('11') ? 'FII' : 'ACAO'
              }));
            } catch (err) {
              return [];
            }
          })
        );

        const flatDividends = results.flat()
          .filter(d => d && d.date && d.amount)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          
        // Generate future dividends based on recent history
        const futureDividends = [];
        const now = new Date();
        
        // Group by ticker to find patterns
        const byTicker = flatDividends.reduce((acc, curr) => {
          if (!acc[curr.ticker]) acc[curr.ticker] = [];
          acc[curr.ticker].push(curr);
          return acc;
        }, {} as Record<string, any[]>);

        for (const ticker in byTicker) {
          const history = byTicker[ticker];
          if (history.length > 0) {
            const lastDiv = history[0]; // Most recent
            const lastDate = new Date(lastDiv.date);
            
            // If it's a FII (ends with 11), assume monthly
            // If it's ACAO, assume quarterly or yearly based on last 2
            let nextDate = new Date(lastDate);
            if (ticker.endsWith('11')) {
              nextDate.setMonth(nextDate.getMonth() + 1);
            } else {
              if (history.length > 1) {
                const prevDate = new Date(history[1].date);
                const diffMonths = (lastDate.getFullYear() - prevDate.getFullYear()) * 12 + (lastDate.getMonth() - prevDate.getMonth());
                nextDate.setMonth(nextDate.getMonth() + (diffMonths > 0 ? diffMonths : 3));
              } else {
                nextDate.setMonth(nextDate.getMonth() + 3);
              }
            }

            // Only add if it's in the future
            if (nextDate > now) {
              futureDividends.push({
                ...lastDiv,
                date: nextDate.toISOString(),
                isFuture: true
              });
            } else {
              // If the calculated next date is still in the past, project it to the next future date
              while (nextDate <= now) {
                 if (ticker.endsWith('11')) {
                   nextDate.setMonth(nextDate.getMonth() + 1);
                 } else {
                   nextDate.setMonth(nextDate.getMonth() + 3);
                 }
              }
              futureDividends.push({
                ...lastDiv,
                date: nextDate.toISOString(),
                isFuture: true
              });
            }
          }
        }

        const allDividends = [...futureDividends, ...flatDividends]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setDividends(allDividends);
      } catch (error) {
        console.error('Error fetching dividends:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAllDividends();
  }, [portfolio]);

  const monthlyHistory = useMemo(() => {
    const history: Record<string, number> = {};
    const now = new Date();
    
    // Last 12 months
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      history[key] = 0;
    }

    dividends.forEach(div => {
      const d = new Date(div.date);
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      if (history[key] !== undefined) {
        // Find quantity in portfolio
        const asset = portfolio.find(p => p.ticker === div.ticker);
        const qty = asset ? asset.quantity : 100; // Default 100 for demo if portfolio empty
        history[key] += div.amount * qty;
      }
    });

    return Object.entries(history)
      .map(([key, value]) => ({
        month: new Date(key + '-01').toLocaleDateString('pt-BR', { month: 'short' }),
        value,
        fullDate: key
      }))
      .reverse();
  }, [dividends, portfolio]);

  const stats = useMemo(() => {
    const totalReceived = monthlyHistory.reduce((acc, curr) => acc + curr.value, 0);
    const avgMonthly = totalReceived / 12;
    
    // Calculate Portfolio Yield
    const totalInvested = portfolio.reduce((acc, curr) => acc + (curr.totalInvested || 0), 0);
    const annualDividends = dividends.reduce((acc, div) => {
      const d = new Date(div.date);
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      
      if (d >= oneYearAgo) {
        const asset = portfolio.find(p => p.ticker === div.ticker);
        if (asset) {
          acc += div.amount * asset.quantity;
        }
      }
      return acc;
    }, 0);

    const yieldOnCost = totalInvested > 0 ? (annualDividends / totalInvested) * 100 : 0;

    return {
      totalReceived,
      avgMonthly,
      yieldOnCost,
      annualDividends
    };
  }, [monthlyHistory, dividends, portfolio]);

  const filteredDividends = dividends.filter(d => {
    if (filter === 'Todos') return true;
    if (filter === 'Ações') return d.type === 'ACAO';
    if (filter === 'FIIs') return d.type === 'FII';
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Agenda de Dividendos"
        description="Acompanhe os pagamentos de proventos e a evolução da sua renda passiva."
        icon={Calendar}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total 12m', value: `R$ ${stats.totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: DollarSign, color: 'emerald' },
          { label: 'Média Mensal', value: `R$ ${stats.avgMonthly.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: TrendingUp, color: 'blue' },
          { label: 'Yield on Cost', value: `${stats.yieldOnCost.toFixed(2)}%`, icon: BarChart3, color: 'purple' },
          { label: 'Proventos Anuais', value: `R$ ${stats.annualDividends.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: PieChart, color: 'amber' },
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-[#0f172a] border border-slate-800 p-6 rounded-3xl relative overflow-hidden shadow-lg"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-blue-500 border border-slate-700">
                <stat.icon size={16} />
              </div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</span>
            </div>
            <div className="text-2xl font-black text-white tracking-tighter">{stat.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Chart Section */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0f172a] border border-slate-800 p-6 md:p-8 rounded-[2.5rem] shadow-xl"
          >
            <h3 className="text-xl font-bold text-white uppercase tracking-tight mb-8 flex items-center gap-3">
              <BarChart3 className="text-blue-500" size={20} />
              Evolução Mensal de Proventos
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    stroke="#64748b" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    dy={10}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(v) => `R$ ${v}`} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px' }}
                    itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                    labelStyle={{ color: '#64748b' }}
                    formatter={(v: any) => [`R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`]}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {monthlyHistory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === monthlyHistory.length - 1 ? '#3b82f6' : '#1e293b'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* List Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex gap-3">
                {['Todos', 'Ações', 'FIIs'].map((type) => (
                  <button 
                    key={type} 
                    onClick={() => setFilter(type)}
                    className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${
                      filter === type 
                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20' 
                        : 'bg-slate-800/50 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="animate-spin text-blue-500" size={32} />
                <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Buscando proventos...</p>
              </div>
            ) : (
              <div className="bg-[#0f172a] border border-slate-800 rounded-[2rem] overflow-hidden divide-y divide-slate-800/50 shadow-xl">
                {filteredDividends.length > 0 ? filteredDividends.slice(0, 20).map((item, idx) => {
                  const date = new Date(item.date);
                  const day = date.getDate().toString().padStart(2, '0');
                  const month = date.toLocaleString('pt-BR', { month: 'short' }).toUpperCase();
                  
                  return (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-6 flex items-center justify-between group hover:bg-slate-800/30 transition-all"
                    >
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-slate-900 rounded-2xl flex flex-col items-center justify-center border border-slate-800 group-hover:border-blue-500/30 transition-colors shadow-inner">
                          <span className="text-[9px] font-black text-slate-500">{month}</span>
                          <span className="text-xl font-black text-white">{day}</span>
                        </div>
                        <div>
                          <div className="font-black text-white text-lg tracking-tighter group-hover:text-blue-400 transition-colors">
                            {item.ticker}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className={`px-2 py-0.5 ${item.type === 'FII' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'} text-[8px] font-black rounded border uppercase tracking-tighter`}>
                              {item.type === 'FII' ? 'Fundo Imob.' : 'Ação'}
                            </span>
                            {item.isFuture && (
                              <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border-amber-500/20 text-[8px] font-black rounded border uppercase tracking-tighter">
                                Previsto
                              </span>
                            )}
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Data Ex: {date.toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-white text-xl tracking-tighter">R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                        <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1">Por Cota</div>
                      </div>
                    </motion.div>
                  );
                }) : (
                  <div className="p-20 text-center text-slate-500">
                    <p className="font-black uppercase tracking-widest text-xs">Nenhum provento encontrado.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#0f172a] border border-slate-800 rounded-[2rem] p-8 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-[60px] -z-10" />
            <h3 className="text-lg font-bold text-white mb-8 flex items-center gap-3 uppercase tracking-tight">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <TrendingUp size={16} className="text-blue-500" />
              </div>
              Projeção de Renda
            </h3>
            
            <div className="space-y-8">
              <div className="p-5 bg-slate-900/50 rounded-3xl border border-slate-800">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Renda Mensal Estimada</p>
                <h4 className="text-3xl font-black text-white tracking-tighter">
                  R$ {stats.avgMonthly.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h4>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Meta de Renda</span>
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">R$ 5.000,00</span>
                </div>
                <div className="h-2.5 bg-slate-800/50 rounded-full overflow-hidden border border-slate-800">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((stats.avgMonthly / 5000) * 100, 100)}%` }}
                    className="h-full bg-blue-600 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                  />
                </div>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest text-center">
                  Você já atingiu {((stats.avgMonthly / 5000) * 100).toFixed(1)}% da sua meta mensal.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-500/5 border border-blue-500/10 rounded-[2rem] p-8 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <ArrowUpRight size={20} className="text-blue-500" />
              <h4 className="text-xs font-black text-blue-400 uppercase tracking-widest">Dica Nexus</h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-medium uppercase tracking-wide">
              Reinvestir seus dividendos pode acelerar drasticamente o efeito dos juros compostos em sua carteira a longo prazo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
