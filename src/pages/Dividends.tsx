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
import { formatNumber } from '../lib/utils';
import { usePrivacy } from '../hooks/usePrivacy';

export default function Dividends() {
  const { portfolio, transactions, loading: contextLoading, dividends, fetchDividends, syncingDividends } = usePortfolio();
  const { hideValues } = usePrivacy();
  const showValues = !hideValues;
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
    // 1. Deduplicate
    const uniqueDivs: any[] = [];
    const seen = new Set();
    dividends.forEach(div => {
      const datePart = (div.date || '').split('T')[0];
      const key = `${div.ticker}-${datePart}-${div.amount}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueDivs.push(div);
      }
    });

    return uniqueDivs.map(div => {
      // qty calculation is based on Ex-Date (div.date in our schema)
      const dataCom = new Date(div.date); 
      const paymentDate = div.paymentDate ? new Date(div.paymentDate) : dataCom;
      
      const qtyAtDate = getHistoricalQuantity(div.ticker, div.date, portfolio);
      const isFuture = paymentDate > new Date() || div.is_future;
      const amount = Number(div.amount) || 0;
      
      const now = new Date();
      now.setHours(0,0,0,0);
      let status: 'recebido' | 'confirmado' | 'futuro' = 'recebido';
      
      if (div.is_future || dataCom > now) {
         status = 'futuro';
      } else if (paymentDate > now) {
         status = 'confirmado';
      }

      return {
        ...div,
        paymentDate: paymentDate.toISOString(),
        isFuture,
        status,
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
    const history: Record<string, { recebido: number, confirmado: number, futuro: number }> = {};
    const now = new Date();
    
    // Last 6 months (including current month) + next 6 months for future viewing
    for (let i = -6; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      history[key] = { recebido: 0, confirmado: 0, futuro: 0 };
    }

    processedDividends.forEach(div => {
      const d = new Date(div.paymentDate || div.date);
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      if (history[key] !== undefined) {
        history[key][div.status as 'recebido' | 'confirmado' | 'futuro'] += div.totalAmount;
      }
    });

    return Object.entries(history)
      .map(([key, data]) => ({
        month: new Date(key + '-01').toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase(),
        total: data.recebido + data.confirmado + data.futuro,
        ...data,
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

  const groupedDividends = useMemo(() => {
    const groups: Record<string, { items: typeof filteredDividends, total: number }> = {};
    
    [...filteredDividends]
      .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .forEach(div => {
      const dt = new Date(div.paymentDate || div.date);
      const m = dt.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
      const monthYear = m.charAt(0).toUpperCase() + m.slice(1);
      
      if (!groups[monthYear]) {
        groups[monthYear] = { items: [], total: 0 };
      }
      groups[monthYear].items.push(div);
      groups[monthYear].total += div.totalAmount;
    });
    
    return Object.entries(groups);
  }, [filteredDividends]);

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

      {/* Dividend Executive Summary - Single Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900 border border-white/5 rounded-xl overflow-hidden shadow-2xl relative"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px] -z-10" />
        <div className="p-6 md:p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-3 h-3 text-emerald-500" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total 12 Meses</span>
            </div>
            <div className="text-2xl font-display font-black text-white mask-value">
              {showValues ? formatNumber(stats.totalReceived, { style: 'currency' }) : 'R$ ••••••'}
            </div>
            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Dividendos Acumulados</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-3 h-3 text-blue-500" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Média Mensal</span>
            </div>
            <div className="text-2xl font-display font-black text-white mask-value">
              {showValues ? formatNumber(stats.avgMonthly, { style: 'currency' }) : 'R$ ••••••'}
            </div>
            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Renda Médica Passiva</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-3 h-3 text-purple-500" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Yield on Cost</span>
            </div>
            <div className="text-2xl font-display font-black text-white mask-value">
              {showValues ? `${formatNumber(stats.yieldOnCost)}%` : '•••%'}
            </div>
            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Retorno sobre Custo</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <PieChart className="w-3 h-3 text-amber-500" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Projetado</span>
            </div>
            <div className="text-2xl font-display font-black text-amber-500 mask-value">
              {showValues ? formatNumber(stats.totalFuture, { style: 'currency' }) : 'R$ ••••••'}
            </div>
            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Proventos Futuros</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        <div className="lg:col-span-2 space-y-6">
          {/* Chart Section - Glassmorphism Bento */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-3xl bg-slate-900/40 border border-white/5 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex flex-col items-center justify-center shrink-0">
                <BarChart3 className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h3 className="text-xl font-display font-black text-white italic tracking-tighter">
                  Evolução Mensal
                </h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Composição de Dividendos Recebidos e Projetados</p>
              </div>
            </div>
            
            <div className="h-[300px] w-full -mx-2 md:mx-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyHistory} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    stroke="#475569" 
                    fontSize={10} 
                    fontWeight="700"
                    tickLine={false} 
                    axisLine={false} 
                    dy={10}
                    tickFormatter={(val) => {
                      // Already formatted short month in processed logic, but ensuring uppercase
                      return val.toUpperCase();
                    }}
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
                  <Bar dataKey="recebido" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} name="Recebido" />
                  <Bar dataKey="confirmado" stackId="a" fill="#f59e0b" name="Confirmado" />
                  <Bar dataKey="futuro" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Futuro/Projetado" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* List Section - Clean */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-3xl bg-slate-900/40 border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <DollarSign className="w-5 h-5 text-emerald-500" />
                </div>
                <h3 className="text-lg font-black text-white italic tracking-tighter">
                  Histórico de Entradas
                </h3>
              </div>
              <div className="flex gap-1.5 p-1 bg-black/20 border border-white/5 rounded-xl">
                {['Todos', 'Ações', 'FIIs'].map((type) => (
                  <button 
                    key={type} 
                    onClick={() => setFilter(type)}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                      filter === type 
                        ? 'bg-blue-600 shadow-md text-white' 
                        : 'text-slate-500 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 bg-slate-900/20 rounded-3xl border border-white/5">
                <Loader2 className="animate-spin text-blue-500 icon-xl" />
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Buscando proventos...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {groupedDividends.length > 0 ? groupedDividends.slice(0, 12).map(([monthYear, group], groupIdx) => (
                  <motion.div 
                    key={monthYear}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: groupIdx * 0.1 }}
                    className="flex flex-col"
                  >
                    <div className="flex justify-between items-center mb-4 mt-2">
                       <div className="flex items-center gap-3">
                         <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">{monthYear}</h4>
                         <div className="h-px bg-white/5 w-12 sm:w-24"></div>
                       </div>
                       <div className="text-xs font-black text-blue-400 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full italic mask-value">
                        {showValues ? `+ ${formatNumber(group.total, { style: 'currency' })}` : 'R$ ••••••'}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                    {group.items.map((item, idx) => {
                      const date = new Date(item.paymentDate || item.date);
                      const day = date.getDate().toString().padStart(2, '0');
                      const month = date.toLocaleString('pt-BR', { month: 'short' }).toUpperCase();
                      
                      const statusColor = item.status === 'futuro' ? 'text-blue-500 border-blue-500/20 bg-blue-500/10' :
                                          item.status === 'confirmado' ? 'text-amber-500 border-amber-500/20 bg-amber-500/10' :
                                          'text-emerald-500 border-emerald-500/20 bg-emerald-500/10';
                      
                      const statusLabel = item.status === 'futuro' ? 'PROJETADO' :
                                          item.status === 'confirmado' ? 'CONFIRMADO' :
                                          'RECEBIDO';
                      
                      return (
                        <div 
                          key={idx}
                          className="flex items-center justify-between py-2 group border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors px-2 rounded-md"
                        >
                          <div className="flex items-center gap-3 w-1/2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-foreground uppercase tracking-wider w-14">{item.ticker}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest hidden sm:inline-block w-20">{day} {month}</span>
                            <span className={`text-[9px] font-bold uppercase tracking-widest ${
                              item.status === 'futuro' ? 'text-blue-500' :
                              item.status === 'confirmado' ? 'text-amber-500' :
                              'text-emerald-500'
                            }`}>
                              {statusLabel}
                            </span>
                          </div>
                          
                          <div className="flex flex-col items-end w-1/2">
                            <span className={`text-sm font-black mask-value ${
                              item.status === 'futuro' ? 'text-blue-500' :
                              item.status === 'confirmado' ? 'text-amber-500' :
                              'text-emerald-500'
                            }`}>
                              {showValues ? formatNumber(item.totalAmount, { style: 'currency' }) : 'R$ ••••••'}
                            </span>
                            <span className="text-[9px] text-muted-foreground uppercase tracking-widest mask-value">
                              {showValues ? `${item.quantityAtDate} cotas a ${formatNumber(item.amount, { style: 'currency' })}` : '••• cotas'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  </motion.div>
                )) : (
                  <div className="p-12 border border-dashed border-white/10 rounded-3xl bg-slate-900/20 text-center flex flex-col items-center justify-center">
                    <p className="font-black uppercase tracking-widest text-xs italic text-slate-400 mb-2">Nenhum provento recebido</p>
                    <p className="text-[10px] text-slate-500 font-medium">Seus registros de dividendos aparecerão aqui.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Projeção Section - Glassmorphism Bento */}
          <div className="p-6 rounded-3xl bg-slate-900/40 border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-purple-500/10 blur-[60px] rounded-full pointer-events-none" />
            <div className="flex items-center gap-3 mb-6 relative">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex flex-col items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-purple-500" />
              </div>
              <h3 className="text-lg font-black text-white italic tracking-tighter">
                Projeção
              </h3>
            </div>
            
            <div className="space-y-6 relative">
              <div className="py-6 border-b border-white/5">
                <p className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-widest">Renda Mensal Estimada</p>
                <div className="text-3xl font-display font-black text-white italic tracking-tighter">
                  {formatNumber(stats.avgMonthly, { style: 'currency' })}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Meta Mensal</span>
                  <span className="text-xs font-black text-blue-400 italic bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">R$ 5.000,00</span>
                </div>
                <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((stats.avgMonthly / 5000) * 100, 100)}%` }}
                    className="h-full bg-gradient-to-r from-blue-600 to-purple-600 blur-[0.5px]"
                  />
                </div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest text-right">
                  Alcance: {((stats.avgMonthly / 5000) * 100).toFixed(1)}% do objetivo
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-blue-950/20 border border-blue-500/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[50px] group-hover:bg-blue-500/20 transition-colors pointer-events-none" />
            <div className="flex items-center gap-3 mb-4 relative">
              <div className="bg-blue-500 sm p-1.5 rounded-lg text-white">
                 <ArrowUpRight className="w-4 h-4" />
              </div>
              <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Nexus Insight</h4>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed font-semibold uppercase tracking-wider relative z-10 hover:text-slate-300 transition-colors">
              O reinvestimento sistemático acelera a "bola de neve" financeira. Cada provento reaplicado é um novo trabalhador em sua fazenda de dividendos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
