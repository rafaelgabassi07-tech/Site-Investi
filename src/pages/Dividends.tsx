import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Calendar, DollarSign, ArrowUpRight, Loader2, TrendingUp, PieChart, BarChart3, RefreshCw, Plus, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { financeService } from '../services/financeService';
import { usePortfolio } from '../hooks/usePortfolio';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { PortfolioNav } from '../components/PortfolioNav';

export default function Dividends() {
  const { portfolio, loading: loadingPortfolio, dividends, fetchDividends } = usePortfolio();
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('Todos');

  const [syncing, setSyncing] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [ticker, setTicker] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleAddDividend = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsedAmount = parseFloat(amount.toString().replace(/\./g, '').replace(',', '.'));
      if (isNaN(parsedAmount)) throw new Error('Valor inválido');

      const newDiv = { 
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
        ticker: ticker.toUpperCase(), 
        type: ticker.toUpperCase().endsWith('11') ? 'FII' : 'ACAO',
        date: new Date(date).toISOString(), 
        amount: parsedAmount, 
        is_future: new Date(date) > new Date()
      };

      const isConfigured = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (isConfigured) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { error } = await supabase.from('dividends').insert({ ...newDiv, user_id: user.id });
          if (error) throw error;
        }
      } else {
        const local = JSON.parse(localStorage.getItem('invest_dividends') || '[]');
        local.push(newDiv);
        localStorage.setItem('invest_dividends', JSON.stringify(local));
      }
      setTicker('');
      setAmount('');
      setIsFormOpen(false);
      fetchDividends();
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar dividendo.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const isConfigured = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (isConfigured) {
        await supabase.from('dividends').delete().eq('id', id);
      } else {
        const local = JSON.parse(localStorage.getItem('invest_dividends') || '[]');
        localStorage.setItem('invest_dividends', JSON.stringify(local.filter((d: any) => d.id !== id)));
      }
      fetchDividends();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSyncDividends = async () => {
    if (portfolio.length === 0) return;
    setSyncing(true);
    try {
      const tickers = portfolio.map(p => p.ticker);
      const results = await Promise.all(
        tickers.slice(0, 20).map(async (ticker) => {
          try {
            const divs = await financeService.getAssetDividends(ticker);
            if (!divs || !Array.isArray(divs)) return [];
            return divs.map(d => ({
              ticker,
              type: ticker.endsWith('11') ? 'FII' : 'ACAO',
              date: d.date,
              amount: d.amount,
              is_future: new Date(d.date) > new Date()
            }));
          } catch (err) {
            return [];
          }
        })
      );

      const flatDividends = results.flat()
        .filter(d => d && d.date && d.amount)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Future extrapolations
      const futureDividends: any[] = [];
      const now = new Date();
      const byTicker = flatDividends.reduce((acc, curr) => {
        if (!acc[curr.ticker]) acc[curr.ticker] = [];
        acc[curr.ticker].push(curr);
        return acc;
      }, {} as Record<string, any[]>);

      for (const ticker in byTicker) {
        const history = byTicker[ticker];
        if (history.length > 0) {
          const lastDiv = history[0];
          let nextDate = new Date(lastDiv.date);
          if (ticker.endsWith('11')) {
            nextDate.setMonth(nextDate.getMonth() + 1);
          } else {
            nextDate.setMonth(nextDate.getMonth() + 3);
          }
          if (nextDate > now) {
            futureDividends.push({ ...lastDiv, date: nextDate.toISOString(), is_future: true });
          }
        }
      }

      const allDividends = [...futureDividends, ...flatDividends];
      
      const isConfigured = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (isConfigured) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Delete old syncs (optional) or just upsert. We'll simply insert and rely on manual cleanup for now to avoid losing history.
          for (const div of allDividends) {
            // Check if exists
            const { data: existing } = await supabase.from('dividends')
              .select('id')
              .eq('user_id', user.id)
              .eq('ticker', div.ticker)
              .eq('date', div.date)
              .single();
              
            if (!existing) {
              await supabase.from('dividends').insert({ ...div, user_id: user.id });
            }
          }
        }
      } else {
        const local = JSON.parse(localStorage.getItem('invest_dividends') || '[]');
        // Add only non-existing
        for (const div of allDividends) {
          if (!local.find((l: any) => l.ticker === div.ticker && l.date === div.date)) {
            local.push({ ...div, id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() });
          }
        }
        localStorage.setItem('invest_dividends', JSON.stringify(local));
      }
      
      fetchDividends();
    } catch (e) {
      console.error(e);
    } finally {
      setSyncing(false);
    }
  };

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
    <div className="space-y-6 pb-24">
      <PageHeader 
        title="Agenda de Dividendos"
        description="Acompanhe os pagamentos de proventos e a evolução da sua renda passiva."
        icon={Calendar}
        actions={
          <div className="flex gap-2">
            <button 
              onClick={handleSyncDividends} 
              disabled={syncing}
              className="px-4 py-2 bg-blue-600/10 text-blue-500 rounded-xl hover:bg-blue-600/20 transition-all font-bold text-sm flex items-center gap-2 border border-blue-500/20"
            >
              {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {syncing ? 'Sincronizando...' : 'Auto Sync'}
            </button>
            <button 
              onClick={() => setIsFormOpen(!isFormOpen)}
              className="px-4 py-2 bg-blue-600 font-bold text-sm text-white rounded-xl shadow-lg border border-blue-500 hover:bg-blue-500 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Adicionar
            </button>
          </div>
        }
      />

      {isFormOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden mb-6"
        >
          <div className="p-6">
            <h3 className="text-display-xs text-white mb-4">Adicionar Provento</h3>
            <form onSubmit={handleAddDividend} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input 
                type="text" 
                placeholder="Ativo (ex: PETR4)" 
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold"
              />
              <input 
                type="number" 
                step="0.0001"
                placeholder="Valor por Cota (R$)" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold"
              />
              <input 
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold [color-scheme:dark]"
              />
              <button type="submit" className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition-all">
                Salvar Provento
              </button>
            </form>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total 12m', value: `R$ ${stats.totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: DollarSign, color: 'emerald' },
          { label: 'Média Mensal', value: `R$ ${stats.avgMonthly.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: TrendingUp, color: 'blue' },
          { label: 'Yield on Cost', value: `${stats.yieldOnCost.toFixed(2)}%`, icon: BarChart3, color: 'purple' },
          { label: 'Proventos Anuais', value: `R$ ${stats.annualDividends.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: PieChart, color: 'amber' },
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white/5 border border-white/5 p-6 rounded-3xl relative overflow-hidden shadow-lg group hover:border-blue-500/30 transition-all"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-blue-500 border border-white/5 group-hover:bg-blue-600 group-hover:text-white transition-all">
                <stat.icon className="icon-xs" />
              </div>
              <span className="text-label text-slate-500 uppercase">{stat.label}</span>
            </div>
            <div className="text-display-sm text-white group-hover:text-blue-400 transition-colors">{stat.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Chart Section */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/5 border border-white/5 p-6 md:p-8 rounded-[2.5rem] shadow-xl"
          >
            <h3 className="text-label text-white mb-8 flex items-center gap-3 uppercase italic">
              <BarChart3 className="icon-md text-blue-500" />
              Evolução Mensal de Proventos
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    stroke="#475569" 
                    fontSize={10} 
                    fontWeight="bold"
                    tickLine={false} 
                    axisLine={false} 
                    dy={10}
                    tickFormatter={(val) => val.toUpperCase()}
                  />
                  <YAxis 
                    stroke="#475569" 
                    fontSize={10} 
                    fontWeight="bold"
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(v) => `R$ ${v}`} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
                    itemStyle={{ color: '#fff', fontWeight: 'bold', fontSize: '14px' }}
                    labelStyle={{ color: '#94a3b8', fontSize: '10px', fontWeight: '900', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                    formatter={(v: any) => [`R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`]}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {monthlyHistory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === monthlyHistory.length - 1 ? '#3b82f6' : '#ffffff10'} />
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
                <Loader2 className="animate-spin text-blue-500 icon-xl" />
                <p className="text-label text-slate-500 uppercase">Buscando proventos...</p>
              </div>
            ) : (
              <div className="bg-white/5 border border-white/5 rounded-[2rem] overflow-hidden shadow-xl">
                <div className="divide-y divide-white/5">
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
                      className="p-6 flex items-center justify-between group hover:bg-white/5 transition-all"
                    >
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-white/5 rounded-2xl flex flex-col items-center justify-center border border-white/5 group-hover:border-blue-500/30 transition-colors shadow-inner">
                          <span className="text-tiny font-black text-slate-500">{month}</span>
                          <span className="text-xl font-black text-white">{day}</span>
                        </div>
                        <div>
                          <div className="text-display-tiny text-white group-hover:text-blue-400 transition-colors uppercase italic">
                            {item.ticker}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 mt-1">
                            <span className={`px-2 py-0.5 ${item.type === 'FII' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'} text-tiny font-black rounded border uppercase tracking-tighter`}>
                              {item.type === 'FII' ? 'Fundo Imob.' : 'Ação'}
                            </span>
                            {item.is_future && (
                              <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border-amber-500/20 text-tiny font-black rounded border uppercase tracking-tighter">
                                Previsto
                              </span>
                            )}
                            <span className="text-tiny font-bold text-slate-500 uppercase tracking-widest italic group-hover:text-slate-400">Data Ex: {date.toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <div className="text-display-tiny text-white">R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                          <div className="text-tiny font-black text-slate-500 uppercase tracking-widest mt-1">Por Cota</div>
                        </div>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                          title="Remover Provento"
                        >
                          <Trash2 className="icon-sm" />
                        </button>
                      </div>
                    </motion.div>
                  );
                }) : (
                  <div className="p-20 text-center text-slate-500">
                    <p className="font-black uppercase tracking-widest text-xs italic opacity-40">Nenhum provento encontrado.</p>
                  </div>
                )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white/5 border border-white/5 rounded-[2rem] p-8 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-[60px] -z-10" />
            <h3 className="text-label text-white mb-8 flex items-center gap-3 uppercase italic">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <TrendingUp className="icon-sm text-blue-500" />
              </div>
              Projeção de Renda
            </h3>
            
            <div className="space-y-8">
              <div className="p-5 bg-white/5 rounded-3xl border border-white/5 shadow-inner">
                <p className="text-label text-slate-500 mb-2 uppercase">Renda Mensal Estimada</p>
                <h4 className="text-display-md text-white">
                  R$ {stats.avgMonthly.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h4>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <span className="text-label text-slate-500 uppercase">Meta de Renda</span>
                  <span className="text-label text-blue-400 uppercase">R$ 5.000,00</span>
                </div>
                <div className="h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/10">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((stats.avgMonthly / 5000) * 100, 100)}%` }}
                    className="h-full bg-blue-600 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                  />
                </div>
                <p className="text-tiny text-slate-500 font-bold uppercase tracking-widest text-center italic">
                  Você já atingiu {((stats.avgMonthly / 5000) * 100).toFixed(1)}% da sua meta mensal.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-500/5 border border-blue-500/10 rounded-[2rem] p-8 shadow-lg group">
            <div className="flex items-center gap-3 mb-4">
              <ArrowUpRight className="icon-md text-blue-500 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              <h4 className="text-label text-blue-400 uppercase italic">Dica Nexus</h4>
            </div>
            <p className="text-tiny text-slate-400 leading-relaxed font-bold uppercase tracking-widest italic">
              Reinvestir seus dividendos pode acelerar drasticamente o efeito dos juros compostos em sua carteira a longo prazo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
