import { useState, useEffect, useMemo, useCallback } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Calendar, DollarSign, ArrowUpRight, Loader2, TrendingUp, PieChart, BarChart3, RefreshCw, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { financeService } from '../services/financeService';
import { usePortfolio } from '../hooks/usePortfolio';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { PortfolioNav } from '../components/PortfolioNav';
import { getHistoricalQuantity } from '../lib/portfolioCalc';
import { NexusAgentUI } from '../components/NexusAgentUI';

export default function Dividends() {
  const { portfolio, transactions, loading: contextLoading, dividends, fetchDividends, syncingDividends } = usePortfolio();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [filter, setFilter] = useState('Todos');
  const [ticker, setTicker] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const loading = contextLoading && dividends.length === 0;

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
        window.dispatchEvent(new Event('invest_dividends_updated'));
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
    if (!confirm('Tem certeza que deseja remover este provento?')) return;
    try {
      const isConfigured = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (isConfigured) {
        await supabase.from('dividends').delete().eq('id', id);
      } else {
        const local = JSON.parse(localStorage.getItem('invest_dividends') || '[]');
        localStorage.setItem('invest_dividends', JSON.stringify(local.filter((d: any) => d.id !== id)));
        window.dispatchEvent(new Event('invest_dividends_updated'));
      }
      fetchDividends();
    } catch (e) {
      console.error(e);
    }
  };

  // Processed dividends includes the calculated total based on historical quantity
  const processedDividends = useMemo(() => {
    return dividends.map(div => {
      // qty calculation is based on Ex-Date (div.date in our schema)
      const dataCom = new Date(div.date); 
      const paymentDate = div.paymentDate ? new Date(div.paymentDate) : dataCom;
      
      const qtyAtDate = getHistoricalQuantity(div.ticker, div.date, portfolio);
      const isFuture = paymentDate > new Date() || div.is_future;
      const amount = Number(div.amount) || 0;

      return {
        ...div,
        paymentDate: paymentDate.toISOString(),
        isFuture,
        quantityAtDate: Math.max(0, qtyAtDate), // Ensure no negative quantities
        totalAmount: amount * Math.max(0, qtyAtDate)
      };
    }).filter(div => {
      // Relaxed filter: show if user ever had this asset or if it's manual
      const divTicker = (div.ticker || '').toUpperCase();
      const hasAssetInHistory = portfolio.some(p => p.ticker.toUpperCase() === divTicker);
      const isManual = div.is_manual === true;
      
      // We show it if they have the asset OR if it was accurately tracked (qty > 0) OR if it's future
      return isManual || hasAssetInHistory || div.quantityAtDate > 0 || div.isFuture;
    });
  }, [dividends, portfolio]);

  const monthlyHistory = useMemo(() => {
    const history: Record<string, number> = {};
    const now = new Date();
    
    // Last 12 months (including current month) + next 2 months for future viewing
    for (let i = -2; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      history[key] = 0;
    }

    processedDividends.forEach(div => {
      const d = new Date(div.paymentDate || div.date);
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      if (history[key] !== undefined) {
        history[key] += div.totalAmount;
      }
    });

    return Object.entries(history)
      .map(([key, value]) => ({
        month: new Date(key + '-01').toLocaleDateString('pt-BR', { month: 'short' }),
        value,
        fullDate: key
      }))
      .sort((a, b) => a.fullDate.localeCompare(b.fullDate));
  }, [processedDividends]);

  const stats = useMemo(() => {
    const pastDividends = processedDividends.filter(d => !d.isFuture);
    const futureDividends = processedDividends.filter(d => d.isFuture);

    const totalReceived = pastDividends.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const totalFuture = futureDividends.reduce((acc, curr) => acc + curr.totalAmount, 0);
    
    // Better Avg Monthly Calculation
    const monthsWithData = new Set(processedDividends.map(d => {
      const dt = new Date(d.paymentDate || d.date);
      return `${dt.getFullYear()}-${dt.getMonth()}`;
    })).size;
    
    const avgMonthly = monthsWithData > 0 ? totalReceived / Math.min(monthsWithData, 12) : 0;
    
    // Calculate Portfolio Yield
    const totalInvested = portfolio.reduce((acc, curr) => acc + (curr.totalInvested || 0), 0);
    
    const annualDividends = pastDividends.reduce((acc, div) => {
      const d = new Date(div.paymentDate || div.date);
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      
      if (d >= oneYearAgo) {
        acc += div.totalAmount;
      }
      return acc;
    }, 0);

    const yieldOnCost = totalInvested > 0 ? (annualDividends / totalInvested) * 100 : 0;

    return {
      totalReceived,
      totalFuture,
      avgMonthly,
      yieldOnCost,
      annualDividends
    };
  }, [processedDividends, portfolio]);

  const filteredDividends = processedDividends.filter(d => {
    if (filter === 'Todos') return true;
    const ticker = d.ticker || '';
    const isFII = ticker.toUpperCase().endsWith('11') || 
                  (d.type || '').toUpperCase().includes('FII') || 
                  (d.type || '').toUpperCase().includes('RENDIMENTO');
    if (filter === 'Ações') return !isFII;
    if (filter === 'FIIs') return isFII;
    return true;
  });

  return (
    <div className="space-y-6 pb-24">
      <PageHeader 
        title="Dividendos"
        description="Gestão de renda passiva."
        icon={Calendar}
        actions={
          <div className="flex items-center gap-4">
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

      <NexusAgentUI />

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
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-transparent outline-none text-white font-bold placeholder:text-slate-500 transition-all text-sm hover:border-white/20"
              />
              <input 
                type="number" 
                step="0.0001"
                placeholder="Valor por Cota (R$)" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-transparent outline-none text-white font-bold placeholder:text-slate-500 transition-all text-sm hover:border-white/20"
              />
              <input 
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-transparent outline-none text-white font-bold transition-all text-sm hover:border-white/20 [color-scheme:dark]"
              />
              <button type="submit" className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition-all">
                Salvar Provento
              </button>
            </form>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 border-t border-white/5">
        {[
          { label: 'Total 12m', value: `R$ ${stats.totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: DollarSign, color: 'emerald' },
          { label: 'Média Mensal', value: `R$ ${stats.avgMonthly.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: TrendingUp, color: 'blue' },
          { label: 'Yield on Cost', value: `${stats.yieldOnCost.toFixed(2)}%`, icon: BarChart3, color: 'purple' },
          { label: 'Proventos Futuros', value: `R$ ${stats.totalFuture.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: PieChart, color: 'amber' },
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: idx * 0.05 }}
            className={`py-8 px-6 group border-b border-white/5 hover:bg-white/[0.01] transition-colors relative ${idx % 2 === 0 ? 'border-r md:border-r' : 'md:border-r'} ${idx % 4 === 3 ? 'lg:border-r-0' : ''}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic group-hover:text-blue-400 transition-colors">{stat.label}</span>
            </div>
            <div className="text-xl md:text-2xl font-display font-black text-white italic tracking-tighter group-hover:text-blue-400 transition-colors">{stat.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-8">
        <div className="lg:col-span-2 space-y-12">
          {/* Chart Section - Clean */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            <div className="flex items-center gap-3 px-2">
              <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
              <h3 className="text-display-xs text-white uppercase italic tracking-tighter">
                Evolução Mensal de Proventos
              </h3>
            </div>
            <div className="h-[300px] w-full -mx-4 md:mx-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyHistory} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
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
                    tick={{ fill: '#64748b' }}
                  />
                  <YAxis 
                    stroke="#475569" 
                    fontSize={10} 
                    fontWeight="bold"
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(v) => `R$ ${v}`} 
                    tick={{ fill: '#64748b' }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
                    itemStyle={{ color: '#fff', fontWeight: 'bold', fontSize: '12px' }}
                    labelStyle={{ color: '#94a3b8', fontSize: '10px', fontWeight: '900', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                    formatter={(v: any) => [`R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`]}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {monthlyHistory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === monthlyHistory.length - 1 ? '#3b82f6' : 'rgba(255,255,255,0.05)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* List Section - Clean */}
          <div className="space-y-8 pt-8 border-t border-white/5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
              <h3 className="text-display-xs text-white uppercase italic tracking-tighter flex items-center gap-3">
                Histórico de Recebimentos
              </h3>
              <div className="flex gap-2">
                {['Todos', 'Ações', 'FIIs'].map((type) => (
                  <button 
                    key={type} 
                    onClick={() => setFilter(type)}
                    className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                      filter === type 
                        ? 'bg-blue-600 border-blue-500 text-white' 
                        : 'bg-white/5 border-white/5 text-slate-500 hover:text-white'
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
              <div className="border-t border-white/5">
                <div className="divide-y divide-white/5">
                {filteredDividends.length > 0 ? filteredDividends.slice(0, 20).map((item, idx) => {
                  const date = new Date(item.date);
                  const day = date.getDate().toString().padStart(2, '0');
                  const month = date.toLocaleString('pt-BR', { month: 'short' }).toUpperCase();
                  
                  return (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.02 }}
                      className="py-5 px-4 flex items-center justify-between group hover:bg-white/[0.01] transition-all"
                    >
                      <div className="flex items-center gap-6">
                        <div className="w-12 h-12 bg-white/5 rounded-xl flex flex-col items-center justify-center border border-white/5 group-hover:border-blue-500/30 transition-colors">
                          <span className="text-[10px] font-black text-slate-500 leading-none mb-1">{month}</span>
                          <span className="text-lg font-black text-white leading-none">{day}</span>
                        </div>
                        <div>
                          <div className="text-display-tiny text-white group-hover:text-blue-400 transition-colors uppercase italic tracking-tighter">
                            {item.ticker}
                          </div>
                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic group-hover:text-slate-400">Data Ex: {date.toLocaleDateString('pt-BR')}</span>
                            {item.type && !['ACAO', 'FII'].includes(item.type.toUpperCase()) && (
                              <span className="px-1.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[8px] font-black uppercase tracking-widest rounded-full italic">
                                {item.type}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-right">
                        <div>
                          <div className="text-lg font-display font-black text-white italic leading-none">R$ {item.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                          <div className="flex items-center gap-2 mt-1.5 justify-end">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">{item.quantityAtDate} cotas</span>
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">• R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/cota</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-slate-800 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="icon-sm" />
                        </button>
                      </div>
                    </motion.div>
                  );
                }) : (
                  <div className="p-20 text-center">
                    <p className="font-black uppercase tracking-[0.2em] text-xs italic opacity-20 text-white">Vazio</p>
                  </div>
                )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-12">
          {/* Projeção Section - Clean */}
          <div className="space-y-8">
            <div className="flex items-center gap-3 px-2">
              <div className="w-1.5 h-6 bg-purple-500 rounded-full" />
              <h3 className="text-display-xs text-white uppercase italic tracking-tighter flex items-center gap-3">
                Projeção de Renda
              </h3>
            </div>
            
            <div className="space-y-8 px-2">
              <div className="py-6 border-b border-white/5">
                <p className="text-[10px] font-black text-slate-500 mb-2 uppercase tracking-[0.2em] italic">Renda Mensal Estimada</p>
                <h4 className="text-4xl font-display font-black text-white italic tracking-tighter">
                  R$ {stats.avgMonthly.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h4>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Meta Mensal</span>
                  <span className="text-sm font-black text-blue-500 italic">R$ 5.000,00</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((stats.avgMonthly / 5000) * 100, 100)}%` }}
                    className="h-full bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                  />
                </div>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em] text-center italic">
                  Alcance: {((stats.avgMonthly / 5000) * 100).toFixed(1)}% do objetivo
                </p>
              </div>
            </div>
          </div>

          <div className="py-8 px-6 bg-white/[0.01] border-l-2 border-blue-600/30">
            <div className="flex items-center gap-3 mb-4">
              <ArrowUpRight className="icon-sm text-blue-500" />
              <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest italic">Nexus Insight</h4>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed font-semibold uppercase tracking-wider italic">
              O reinvestimento sistemático acelera a "bola de neve" financeira. Cada provento reaplicado é um novo trabalhador em sua fazenda de dividendos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
