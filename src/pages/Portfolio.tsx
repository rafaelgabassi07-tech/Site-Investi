import { Briefcase, Plus, PieChart as PieIcon, BarChart3, TrendingUp, Layers, Globe, Activity, Loader2 } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { usePortfolio } from '../hooks/usePortfolio';
import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#64748b', '#14b8a6'];

const TooltipContent = ({ active, payload, totalValue }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const percentage = totalValue > 0 ? ((data.value / totalValue) * 100).toFixed(1) : 0;
    return (
      <div className="bg-slate-900/95 border border-white/10 p-3 rounded-xl shadow-xl backdrop-blur-sm">
        <p className="text-white font-bold text-xs mb-1">{data.name || data.date}</p>
        <p className="text-blue-400 font-black text-sm">
          R$ {data.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
        {data.name && <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-1">{percentage}% do Patrimônio</p>}
      </div>
    );
  }
  return null;
};

export default function Portfolio() {
  const navigate = useNavigate();
  const { portfolio, quotaHistory, loading } = usePortfolio();

  const currentTotalValue = portfolio.reduce((acc, item) => acc + (item.currentValue || item.totalInvested), 0);

  // 1. Posição de ativos (All assets)
  const positionByAsset = useMemo(() => {
    return portfolio
      .map(item => ({
        name: item.ticker,
        value: item.currentValue || item.totalInvested,
      }))
      .sort((a, b) => b.value - a.value);
  }, [portfolio]);

  // 2. Posição atual por tipo de ativos (Ação vs FII vs BDR etc)
  const positionByType = useMemo(() => {
    const acc: Record<string, number> = {};
    portfolio.forEach(item => {
      const type = item.assetType || 'OUTROS';
      acc[type] = (acc[type] || 0) + (item.currentValue || item.totalInvested);
    });
    return Object.entries(acc).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [portfolio]);

  // 3. Exposição ao exterior (BDR vs Nacional)
  const exposureForeign = useMemo(() => {
    let foreign = 0;
    let national = 0;
    portfolio.forEach(item => {
      const value = item.currentValue || item.totalInvested;
      // Assume BDRs or tickers ending in 34/35 are foreign
      if (item.assetType === 'BDR' || item.ticker.endsWith('34') || item.ticker.endsWith('35')) {
        foreign += value;
      } else {
        national += value;
      }
    });
    return [
      { name: 'Nacional', value: national },
      { name: 'Exterior', value: foreign }
    ].filter(i => i.value > 0);
  }, [portfolio]);

  // 4. Posição atual das ações (Only Stocks)
  const acoesPortfolio = portfolio.filter(p => p.assetType === 'ACAO');
  
  // Posição atual das ações por Setor
  const acoesBySector = useMemo(() => {
    const acc: Record<string, number> = {};
    acoesPortfolio.forEach(item => {
      const sector = item.sector || 'Não Classificado';
      acc[sector] = (acc[sector] || 0) + (item.currentValue || item.totalInvested);
    });
    return Object.entries(acc).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [acoesPortfolio]);

  // Posição atual das ações por Segmento
  const acoesBySegment = useMemo(() => {
    const acc: Record<string, number> = {};
    acoesPortfolio.forEach(item => {
      const segment = item.segment || 'Não Classificado';
      acc[segment] = (acc[segment] || 0) + (item.currentValue || item.totalInvested);
    });
    return Object.entries(acc).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);
  }, [acoesPortfolio]);

  // 5. Posição atual de FIIs (Only FIIs)
  const fiisPortfolio = portfolio.filter(p => p.assetType === 'FII' || p.ticker.endsWith('11'));

  // Posição atual de FIIs por Tipo / Segmento
  const fiisBySegment = useMemo(() => {
    const acc: Record<string, number> = {};
    fiisPortfolio.forEach(item => {
      const segment = item.segment || 'Não Classificado';
      acc[segment] = (acc[segment] || 0) + (item.currentValue || item.totalInvested);
    });
    return Object.entries(acc).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [fiisPortfolio]);

  // Evolução de Patrimônio
  const portfolioEvolution = useMemo(() => {
    if (!quotaHistory || quotaHistory.length < 2) return [];
    return quotaHistory.map(q => ({
      date: new Date(q.date).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
      value: q.totalPatrimony
    }));
  }, [quotaHistory]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Carregando Patrimônio...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Patrimônio"
        description={<>Composição estratégica de ativos e alocação via <span className="text-blue-500 font-bold">Invest Engine</span>.</>}
        icon={Briefcase}
        actions={
          <button 
            onClick={() => navigate('/portfolio/lancamentos')}
            className="btn-primary py-2 px-4 shadow-blue-500/20"
          >
            <Plus className="icon-sm" />
            Nova Operação
          </button>
        }
      />

      {portfolio.length === 0 ? (
        <div className="py-32 text-center flex flex-col items-center justify-center">
          <Briefcase className="w-16 h-16 text-slate-800 mb-6" />
          <h2 className="text-xl font-display font-black text-white italic">Nenhum Ativo Encontrado</h2>
          <p className="text-slate-500 mt-2 max-w-md">Sua carteira está vazia. Adicione novas operações para visualizar seus gráficos de patrimônio.</p>
          <button 
            onClick={() => navigate('/portfolio/lancamentos')}
            className="mt-8 px-6 py-3 bg-blue-600 text-white font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-blue-500 transition-colors"
          >
            Adicionar Transação
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
          
          {/* Evolução de Patrimônio */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-1 md:col-span-2 lg:col-span-3 py-6">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="text-blue-500 icon-md" />
              <h3 className="text-white font-display font-black italic tracking-tighter text-lg uppercase">Evolução de Patrimônio</h3>
            </div>
            <div className="h-[300px] w-full">
              {portfolioEvolution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={portfolioEvolution}>
                    <defs>
                      <linearGradient id="colorPatrimonio" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="date" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `R$ ${(v/1000).toFixed(0)}k`} />
                    <Tooltip content={<TooltipContent totalValue={currentTotalValue} />} />
                    <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fill="url(#colorPatrimonio)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 uppercase tracking-widest text-[10px] font-black border border-white/5 rounded-2xl">
                  Dados insuficientes para evolução histórica
                </div>
              )}
            </div>
          </motion.div>

          {/* Posicao por Tipo */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="py-6 flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <PieIcon className="text-emerald-500 icon-md" />
              <h3 className="text-white font-display font-black italic tracking-tighter text-lg uppercase">Por Tipo de Ativo</h3>
            </div>
            <div className="h-[200px] w-full mb-6 relative flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={positionByType} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {positionByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<TooltipContent totalValue={currentTotalValue} />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 mt-auto">
              {positionByType.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="text-slate-400 font-bold uppercase tracking-widest">{item.name}</span>
                  </div>
                  <span className="text-white font-black">{((item.value / currentTotalValue) * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Posicao de Ativos (Geral) */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="py-6 flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <Layers className="text-purple-500 icon-md" />
              <h3 className="text-white font-display font-black italic tracking-tighter text-lg uppercase">Posição de Ativos</h3>
            </div>
            <div className="h-[200px] w-full mb-6 relative flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={positionByAsset.slice(0, 10)} cx="50%" cy="50%" innerRadius={0} outerRadius={80} paddingAngle={2} dataKey="value">
                    {positionByAsset.slice(0, 10).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<TooltipContent totalValue={currentTotalValue} />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 mt-auto overflow-y-auto max-h-[100px] pr-2 custom-scrollbar">
              {positionByAsset.slice(0, 10).map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[(idx + 3) % COLORS.length] }} />
                    <span className="text-slate-400 font-bold uppercase tracking-widest">{item.name}</span>
                  </div>
                  <span className="text-white font-black">{((item.value / currentTotalValue) * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Exposicao Exterior */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="py-6 flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <Globe className="text-amber-500 icon-md" />
              <h3 className="text-white font-display font-black italic tracking-tighter text-lg uppercase">Exposição ao Exterior</h3>
            </div>
            <div className="h-[200px] w-full mb-6 relative flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={exposureForeign} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {exposureForeign.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : '#f59e0b'} />
                    ))}
                  </Pie>
                  <Tooltip content={<TooltipContent totalValue={currentTotalValue} />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 mt-auto">
              {exposureForeign.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: idx === 0 ? '#3b82f6' : '#f59e0b' }} />
                    <span className="text-slate-400 font-bold uppercase tracking-widest">{item.name}</span>
                  </div>
                  <span className="text-white font-black">{((item.value / currentTotalValue) * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Acoes por Setor */}
          {acoesPortfolio.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="col-span-1 md:col-span-2 lg:col-span-3 py-6">
              <div className="flex items-center gap-3 mb-6">
                <BarChart3 className="text-cyan-500 icon-md" />
                <h3 className="text-white font-display font-black italic tracking-tighter text-lg uppercase">Ações por Setor</h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={acoesBySector} layout="vertical" margin={{ top: 0, right: 0, left: 40, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} width={120} tickFormatter={(val) => (val && typeof val === 'string' && val.length > 15) ? val.substring(0, 15) + '...' : val} />
                      <Tooltip content={<TooltipContent totalValue={currentTotalValue} />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                      <Bar dataKey="value" fill="#06b6d4" radius={[0, 4, 4, 0]}>
                        {acoesBySector.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col justify-center space-y-4">
                  {acoesBySector.map((item, idx) => {
                    const totalAcoes = acoesPortfolio.reduce((acc, a) => acc + (a.currentValue || a.totalInvested), 0);
                    return (
                      <div key={idx} className="flex justify-between items-center text-sm border-b border-white/5 pb-2 last:border-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-md" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                          <span className="text-slate-300 font-bold uppercase tracking-wider text-xs">{item.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-black">{((item.value / totalAcoes) * 100).toFixed(1)}%</p>
                          <p className="text-[10px] text-slate-500">R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* Acoes por Segmento */}
          {acoesPortfolio.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="col-span-1 md:col-span-2 lg:col-span-3 py-6">
              <div className="flex items-center gap-3 mb-6">
                <Activity className="text-blue-500 icon-md" />
                <h3 className="text-white font-display font-black italic tracking-tighter text-lg uppercase">Ações por Segmento (Top 10)</h3>
              </div>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={acoesBySegment} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => (val && typeof val === 'string' && val.length > 10) ? val.substring(0, 10) + '...' : val} angle={-45} textAnchor="end" dy={15} />
                    <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `R$ ${(v/1000).toFixed(0)}k`} />
                    <Tooltip content={<TooltipContent totalValue={currentTotalValue} />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                      {acoesBySegment.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[(index + 5) % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {/* FIIs por Segmento */}
          {fiisPortfolio.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="col-span-1 md:col-span-2 lg:col-span-3 py-6">
              <div className="flex items-center gap-3 mb-6">
                <PieIcon className="text-indigo-500 icon-md" />
                <h3 className="text-white font-display font-black italic tracking-tighter text-lg uppercase">FIIs por Segmento / Tipo</h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="h-[250px] w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={fiisBySegment} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
                        {fiisBySegment.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<TooltipContent totalValue={currentTotalValue} />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col justify-center space-y-4">
                  {fiisBySegment.map((item, idx) => {
                    const totalFiis = fiisPortfolio.reduce((acc, a) => acc + (a.currentValue || a.totalInvested), 0);
                    return (
                      <div key={idx} className="flex justify-between items-center text-sm border-b border-white/5 pb-2 last:border-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-md" style={{ backgroundColor: COLORS[(idx + 2) % COLORS.length] }} />
                          <span className="text-slate-300 font-bold uppercase tracking-wider text-xs">{item.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-black">{((item.value / totalFiis) * 100).toFixed(1)}%</p>
                          <p className="text-[10px] text-slate-500">R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

        </div>
      )}
    </div>
  );
}
