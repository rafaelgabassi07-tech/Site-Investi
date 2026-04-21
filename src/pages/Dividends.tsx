import { useState, useEffect, useMemo, useCallback } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Calendar, DollarSign, ArrowUpRight, Loader2, TrendingUp, PieChart, BarChart3, RefreshCw, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { financeService } from '../services/financeService';
import { usePortfolio } from '../hooks/usePortfolio';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
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
        is_future: new Date(date) > new Date(),
        is_manual: true
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
      const dataCom = div.date ? new Date(div.date) : new Date(); 
      const paymentDate = div.paymentDate ? new Date(div.paymentDate) : dataCom;
      
      const qtyAtDate = getHistoricalQuantity(div.ticker, div.date || '', portfolio);
      // Consistent future check: if payment is ahead or if explicitly marked future
      const isFuture = paymentDate.getTime() > Date.now() || div.is_future === true;
      const amount = typeof div.amount === 'string' ? parseFloat(div.amount.replace(',', '.')) : (Number(div.amount) || 0);
      
      const now = new Date();
      now.setHours(0,0,0,0);
      let status: 'recebido' | 'confirmado' | 'futuro' = 'recebido';
      
      if (div.is_future || dataCom > now) {
         status = 'futuro';
      } else if (paymentDate > now) {
         status = 'confirmado';
      }

      const isManual = div.is_manual === true;

      return {
        ...div,
        paymentDate: paymentDate.toISOString(),
        isFuture,
        status,
        quantityAtDate: isManual ? 1 : Math.max(0, qtyAtDate), // Ensure no negative quantities
        totalAmount: isManual ? amount : amount * Math.max(0, qtyAtDate)
      };
    }).filter(div => {
      // Show if it's manual, or if we actually held the asset at the EX date
      const isManual = div.is_manual === true;
      return isManual || div.quantityAtDate > 0;
    });
  }, [dividends, portfolio]);

  const filteredDividends = useMemo(() => processedDividends.filter(d => {
    if (filter === 'Todos') return true;
    const ticker = d.ticker || '';
    const isFII = ticker.toUpperCase().endsWith('11') || 
                  (d.type || '').toUpperCase().includes('FII') || 
                  (d.type || '').toUpperCase().includes('RENDIMENTO');
    if (filter === 'Ações') return !isFII;
    if (filter === 'FIIs') return isFII;
    return true;
  }), [processedDividends, filter]);

  const monthlyHistory = useMemo(() => {
    const history: Record<string, { recebido: number, confirmado: number, futuro: number }> = {};
    const now = new Date();
    
    // Last 6 months (including current month) + next 6 months for future viewing
    for (let i = -6; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      history[key] = { recebido: 0, confirmado: 0, futuro: 0 };
    }

    filteredDividends.forEach(div => {
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
  }, [filteredDividends]);

  const stats = useMemo(() => {
    const pastDividends = filteredDividends.filter(d => !d.isFuture);
    const futureDividends = filteredDividends.filter(d => d.isFuture);

    const totalReceived = pastDividends.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const totalFuture = futureDividends.reduce((acc, curr) => acc + curr.totalAmount, 0);
    
    // Better Avg Monthly Calculation
    const monthsWithData = new Set(filteredDividends.map(d => {
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
  }, [filteredDividends, portfolio]);

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

      {/* Dividend Executive Summary - Compact & Clean */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900 border border-white/5 rounded-xl overflow-hidden relative"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[60px] -z-10" />
        <div className="p-5 md:p-6 grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 mb-1.5">
              <DollarSign className="w-3 h-3 text-emerald-500" />
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total 12m</span>
            </div>
            <div className="text-xl font-display font-black text-white mask-value">
              {showValues ? formatNumber(stats.totalReceived, { style: 'currency' }) : 'R$ ••••••'}
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 mb-1.5">
              <TrendingUp className="w-3 h-3 text-blue-500" />
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Média Mensal</span>
            </div>
            <div className="text-xl font-display font-black text-white mask-value">
              {showValues ? formatNumber(stats.avgMonthly, { style: 'currency' }) : 'R$ ••••••'}
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 mb-1.5">
              <BarChart3 className="w-3 h-3 text-purple-500" />
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Yield On Cost</span>
            </div>
            <div className="text-xl font-display font-black text-white mask-value">
              {showValues ? `${formatNumber(stats.yieldOnCost)}%` : '•••%'}
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 mb-1.5">
              <PieChart className="w-3 h-3 text-amber-500" />
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Projetado</span>
            </div>
            <div className="text-xl font-display font-black text-amber-500 mask-value">
              {showValues ? formatNumber(stats.totalFuture, { style: 'currency' }) : 'R$ ••••••'}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        <div className="lg:col-span-2 space-y-6">
          {/* Chart Section - Glassmorphism Bento */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="nexus-card bg-card border border-border"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-display font-black text-foreground tracking-tighter uppercase">
                  Evolução Mensal
                </h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Geração de Renda Passiva</p>
              </div>
            </div>
            
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyHistory} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="0" stroke="rgba(0,0,0,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    fontSize={10} 
                    fontWeight="700"
                    tickLine={false} 
                    axisLine={false} 
                    dy={10}
                    tickFormatter={(val) => val.toUpperCase()}
                    tick={{ fill: 'var(--muted-foreground)' }}
                  />
                  <YAxis 
                    fontSize={10} 
                    fontWeight="bold"
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(v) => `R$ ${v}`} 
                    tick={{ fill: 'var(--muted-foreground)' }}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-popover border border-border p-3 rounded-lg shadow-xl">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                              {payload[0].payload.month}
                            </p>
                            {payload.map((entry: any, index: number) => (
                              <p key={index} className="text-sm font-bold text-foreground flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                {formatNumber(entry.value, { style: 'currency' })}
                              </p>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="recebido" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} name="Recebido" />
                  <Bar dataKey="confirmado" stackId="a" fill="#f59e0b" name="Confirmado" />
                  <Bar dataKey="futuro" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Futuro" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* List Section - Clean */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-secondary border border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center shrink-0">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-foreground tracking-tighter uppercase">
                  Histórico de Entradas
                </h3>
              </div>
              <div className="flex gap-1.5 p-1 bg-muted border border-border rounded-lg">
                {['Todos', 'Ações', 'FIIs'].map((type) => (
                  <button 
                    key={type} 
                    onClick={() => setFilter(type)}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                      filter === type 
                        ? 'bg-primary shadow-sm text-white' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-background'
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
                         <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{monthYear}</h4>
                         <div className="h-px bg-border w-12 sm:w-24"></div>
                       </div>
                       <div className="text-xs font-bold text-primary px-3 py-1 bg-primary/5 border border-primary/10 rounded-full">
                        {showValues ? `+ ${formatNumber(group.total, { style: 'currency' })}` : 'R$ ••••••'}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                    {group.items.map((item, idx) => {
                      const date = new Date(item.paymentDate || item.date);
                      const day = date.getDate().toString().padStart(2, '0');
                      const month = date.toLocaleString('pt-BR', { month: 'short' }).toUpperCase();
                      
                      const statusLabel = item.status === 'futuro' ? 'PROJETADO' :
                                          item.status === 'confirmado' ? 'CONFIRMADO' :
                                          'RECEBIDO';
                      
                      const statusColor = item.status === 'futuro' ? 'text-blue-600' :
                                          item.status === 'confirmado' ? 'text-amber-600' :
                                          'text-emerald-600';
                      
                      return (
                        <div 
                          key={idx}
                          className="flex items-center justify-between py-3 group border-b border-border last:border-0 hover:bg-secondary/50 transition-colors px-2 rounded-lg"
                        >
                          <div className="flex items-center gap-3 w-1/2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-foreground uppercase tracking-wider w-14">{item.ticker}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest hidden sm:inline-block w-20">{day} {month}</span>
                            <span className={`text-[9px] font-bold uppercase tracking-widest ${statusColor}`}>
                              {statusLabel}
                            </span>
                          </div>
                          
                          <div className="flex flex-col items-end w-1/2">
                            <span className={`text-sm font-bold ${statusColor}`}>
                              {showValues ? formatNumber(item.totalAmount, { style: 'currency' }) : 'R$ ••••••'}
                            </span>
                            <span className="text-[9px] text-muted-foreground uppercase tracking-widest">
                              {showValues ? `${item.quantityAtDate} cotas em ${day}/${month}` : '••• cotas'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  </motion.div>
                )) : (
                  <div className="p-12 border border-dashed border-border rounded-xl bg-secondary/20 text-center flex flex-col items-center justify-center">
                    <p className="font-bold uppercase tracking-widest text-xs text-muted-foreground mb-2">Nenhum provento cadastrado</p>
                    <p className="text-[10px] text-muted-foreground">Seus registros de dividendos aparecerão aqui.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="nexus-card bg-card border border-border">
            <div className="flex items-center gap-3 mb-6 relative">
              <div className="w-10 h-10 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground uppercase tracking-tighter">
                Projeção
              </h3>
            </div>
            
            <div className="space-y-6 relative">
              <div className="py-6 border-b border-border">
                <p className="text-[10px] font-bold text-muted-foreground mb-2 uppercase tracking-widest">Renda Mensal Estimada</p>
                <div className="text-3xl font-bold text-foreground tracking-tighter">
                  {formatNumber(stats.avgMonthly, { style: 'currency' })}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Meta Mensal</span>
                  <span className="text-xs font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-md border border-primary/10">R$ 5.000,00</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden border border-border">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((stats.avgMonthly / 5000) * 100, 100)}%` }}
                    className="h-full bg-primary"
                  />
                </div>
                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest text-right">
                  Alcance: {((stats.avgMonthly / 5000) * 100).toFixed(1)}% do objetivo
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-secondary border border-border relative overflow-hidden group">
            <div className="flex items-center gap-3 mb-4 relative">
              <div className="bg-primary p-1.5 rounded-lg text-white">
                 <ArrowUpRight className="w-4 h-4" />
              </div>
              <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest">Nexus Insight</h4>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed font-semibold uppercase tracking-wider relative z-10 transition-colors">
              O reinvestimento sistemático acelera a "bola de neve" financeira. Cada provento reaplicado é um novo trabalhador em sua fazenda de dividendos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
