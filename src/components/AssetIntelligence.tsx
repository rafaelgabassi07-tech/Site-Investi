import { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { financeService } from '../services/financeService';
import { TrendingUp, Calendar, Globe, Building2, MapPin, Target } from 'lucide-react';
import { motion } from 'motion/react';

interface AssetIntelligenceProps {
  ticker: string;
  assetDetails: any;
}

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export function AssetIntelligence({ ticker, assetDetails }: AssetIntelligenceProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [ibov, setIbov] = useState<any[]>([]);
  const [fundamentals, setFundamentals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [histData, ibovData, fundData] = await Promise.all([
          financeService.getAssetHistory(ticker, '5y').catch(() => []),
          financeService.getAssetHistory('^BVSP', '5y').catch(() => []),
          financeService.getHistoricalFundamentals(ticker).catch(() => [])
        ]);

        if (mounted) {
          setHistory(histData || []);
          setIbov(ibovData || []);
          setFundamentals(fundData || []);
        }
      } catch (err) {
        console.error('Failed to fetch intelligence data', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchData();
    return () => { mounted = false; };
  }, [ticker]);

  const renderComparison = () => {
    if (!history.length || !ibov.length) return null;

    const startAsset = history[0]?.close || 1;
    const startIbov = ibov[0]?.close || 1;

    // Normalizar para Base 100 ao vivo
    const comparisonData = history.map((h, i) => {
      const ibovPoint = ibov[i] || ibov[ibov.length - 1]; // fallback se desalinhado
      const dateStr = new Date(h.date).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      return {
        date: dateStr,
        [ticker]: ((h.close / startAsset) - 1) * 100,
        IBOV: ibovPoint ? ((ibovPoint.close / startIbov) - 1) * 100 : 0
      };
    });

    return (
      <section className="space-y-8 pt-12 border-t border-white/5">
        <div className="flex items-center gap-3 px-2">
          <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
          <h3 className="text-display-xs text-white uppercase italic tracking-tighter">
            Comparação com Índices
          </h3>
        </div>
        <div className="h-[240px] md:h-[400px] w-full -mx-4 md:mx-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={comparisonData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#475569" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                minTickGap={40}
                tick={{ fill: '#64748b', fontWeight: 600 }}
              />
              <YAxis 
                stroke="#475569" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(v) => `${v.toFixed(0)}%`}
                tick={{ fill: '#64748b', fontWeight: 600 }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
                itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                labelStyle={{ fontSize: '10px', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                formatter={(val: number) => [`${val.toFixed(2)}%`, undefined]}
              />
              <Legend iconType="circle" verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
              <Line type="monotone" dataKey={ticker} stroke="#ef4444" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
              <Line type="monotone" dataKey="IBOV" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    );
  };


  // Radar de Dividendos
  const dividendMonths = useMemo(() => {
    const monthsSet = new Set<number>();
    const divs = assetDetails?.results?.dividendos || [];
    divs.forEach((d: any) => {
      if (d.pagamento && d.pagamento !== '-') {
        const parts = d.pagamento.split('/');
        if (parts.length >= 2) {
          monthsSet.add(parseInt(parts[1], 10) - 1);
        }
      }
    });
    return Array.from(monthsSet);
  }, [assetDetails]);

  const renderRadar = () => {
    return (
      <section className="space-y-8">
        <div className="flex items-center gap-3 px-2">
          <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
          <h3 className="text-display-xs text-white uppercase italic tracking-tighter">
            Radar de Proventos
          </h3>
        </div>
        
        <div className="space-y-8">
          <p className="text-slate-500 text-xs md:text-sm max-w-2xl px-2 font-medium leading-relaxed italic">
            Mapeamento dos meses com maior probabilidade histórica de pagamentos baseados nos ciclos de proventos do ativo.
          </p>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 border-t border-white/5">
            {MONTHS.map((monthName, i) => {
              const isProbable = dividendMonths.includes(i);
              return (
                <div 
                  key={monthName} 
                  className={`flex flex-col items-center justify-center py-8 group relative overflow-hidden transition-colors border-b border-white/5 hover:bg-white/[0.01] ${i % 3 < 2 ? 'border-r md:border-r' : 'md:border-r'} ${i % 6 === 5 ? 'lg:border-r-0' : ''}`}
                >
                  <span className={`font-black text-sm uppercase tracking-[0.2em] italic ${isProbable ? 'text-emerald-500' : 'text-slate-600'}`}>{monthName}</span>
                  {isProbable && (
                    <motion.span 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-[8px] uppercase font-black tracking-widest mt-2 bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full border border-emerald-500/20"
                    >
                      Provável
                    </motion.span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  };

  const renderFundamentals = () => {
    if (!fundamentals || fundamentals.length === 0) return null;

    const formattedFunds = fundamentals.map(f => ({
      ...f,
      Receita: (f.revenue || 0) / 1e6,
      Lucro: (f.netIncome || 0) / 1e6,
      Patrimonio: (f.patrimony || 0) / 1e6,
      Cotacao: 0, // This would require merging end of year prices
    }));

    // Merge Cotação based on history end of year
    if (history.length > 0) {
      formattedFunds.forEach(f => {
        const histYear = history.filter(h => new Date(h.date).getFullYear() === f.year);
        if (histYear.length > 0) {
          f.Cotacao = histYear[histYear.length - 1].close; // Last price of the year
        }
      });
    }

    return (
      <div className="space-y-20">
        {/* Receitas e Lucros */}
        <section className="space-y-8">
          <div className="flex items-center gap-3 px-2">
            <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
            <h3 className="text-display-xs text-white uppercase italic tracking-tighter">Receitas e Lucros (Anual)</h3>
          </div>
          <div className="h-[240px] md:h-[400px] w-full -mx-4 md:mx-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formattedFunds} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="year" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontWeight: 600 }} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}M`} tick={{ fill: '#64748b', fontWeight: 600 }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px' }}
                  labelStyle={{ fontSize: '10px', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}
                />
                <Legend iconType="circle" verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                <Bar dataKey="Receita" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Lucro" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Lucro X Cotação */}
        <section className="space-y-8">
          <div className="flex items-center gap-3 px-2">
            <div className="w-1.5 h-6 bg-yellow-500 rounded-full" />
            <h3 className="text-display-xs text-white uppercase italic tracking-tighter flex items-center gap-2">
              Lucro x Cotação
            </h3>
          </div>
          <div className="space-y-8">
             <p className="text-slate-500 text-xs md:text-sm max-w-2xl px-2 font-medium leading-relaxed italic">
               Acompanhe a correlação histórica entre o lucro líquido e o preço das ações.
             </p>
            <div className="h-[240px] md:h-[400px] w-full -mx-4 md:mx-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formattedFunds.filter(f => f.Cotacao > 0 && f.Lucro !== 0)} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="year" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontWeight: 600 }} />
                  <YAxis yAxisId="left" stroke="#10b981" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}M`} tick={{ fill: '#64748b', fontWeight: 600 }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#eab308" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `R$ ${v.toFixed(0)}`} tick={{ fill: '#64748b', fontWeight: 600 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px' }}
                  />
                  <Legend iconType="circle" verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                  <Line yAxisId="left" type="monotone" dataKey="Lucro" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
                  <Line yAxisId="right" type="monotone" dataKey="Cotacao" name="Cotação" stroke="#eab308" strokeWidth={3} dot={{ r: 4, fill: '#eab308' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Evolução do Patrimônio */}
        <section className="space-y-8">
          <div className="flex items-center gap-3 px-2">
            <div className="w-1.5 h-6 bg-purple-500 rounded-full" />
            <h3 className="text-display-xs text-white uppercase italic tracking-tighter">Evolução do Patrimônio</h3>
          </div>
          <div className="h-[240px] md:h-[400px] w-full -mx-4 md:mx-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={formattedFunds} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="patrimonio" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="year" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontWeight: 600 }} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}M`} tick={{ fill: '#64748b', fontWeight: 600 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px' }}
                />
                <Legend iconType="circle" verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                <Area type="monotone" dataKey="Patrimonio" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#patrimonio)" activeDot={{ r: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    );
  };

  const renderRegionsMock = () => {
    const data = [
      { name: 'Brasil', value: 85 },
      { name: 'América do Norte', value: 10 },
      { name: 'Europa', value: 5 },
    ];
    
    return (
      <section className="space-y-8">
        <div className="flex items-center gap-3 px-2">
          <div className="w-1.5 h-6 bg-cyan-500 rounded-full" />
          <h3 className="text-display-xs text-white uppercase italic tracking-tighter flex items-center gap-2">
            Regiões do Negócio
          </h3>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-12 px-6">
          <div className="h-[220px] w-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} innerRadius={60} outerRadius={85} paddingAngle={8} dataKey="value" stroke="none">
                  {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-4 w-full">
            {data.map((d, i) => (
              <div key={i} className="flex items-center justify-between py-4 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-sm font-bold text-white uppercase italic tracking-tight">{d.name}</span>
                </div>
                <span className="text-sm font-black text-slate-400 italic">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  const renderSegmentsMock = () => {
    const data = [
      { name: 'Core Business', value: 70 },
      { name: 'Serviços Financeiros', value: 20 },
      { name: 'Outros', value: 10 },
    ];
    return (
      <section className="space-y-8">
        <div className="flex items-center gap-3 px-2">
          <div className="w-1.5 h-6 bg-orange-500 rounded-full" />
          <h3 className="text-display-xs text-white uppercase italic tracking-tighter flex items-center gap-2">
            Segmentos de Receita
          </h3>
        </div>
        <div className="px-6 w-full">
          <div className="space-y-6">
            {data.map((d, i) => (
              <div key={i} className="space-y-3 pb-6 border-b border-white/5 last:border-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white uppercase italic tracking-tight">{d.name}</span>
                  <span className="text-sm font-black text-orange-400 italic">{d.value}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${d.value}%` }}
                    transition={{ duration: 1, delay: 0.5 + (i * 0.1) }}
                    className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.3)]" 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <div className="w-8 h-8 border-t-2 border-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-12 mt-12 pt-12 border-t border-white/10">
      <div className="px-2">
        {renderRadar()}
      </div>
      
      <div className="h-px bg-white/5 mx-2" />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8">
          {renderRegionsMock()}
        </div>
        <div className="space-y-8">
          {renderSegmentsMock()}
        </div>
      </div>

      <div className="h-px bg-white/5 mx-2" />
      
      <div className="pt-4">
        {renderFundamentals()}
      </div>
    </div>
  );
}
