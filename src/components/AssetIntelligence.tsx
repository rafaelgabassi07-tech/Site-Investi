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
      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-1.5 h-5 bg-indigo-500 rounded-full" />
          <h3 className="text-display-xs text-white uppercase italic flex items-center gap-2">
            <Target className="icon-sm text-indigo-500" />
            Comparação com Índices
          </h3>
        </div>
        <div className="p-6 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis dataKey="date" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} minTickGap={30} />
              <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v.toFixed(0)}%`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#ffffff10', borderRadius: '12px' }}
                formatter={(val: number) => `${val.toFixed(2)}%`}
              />
              <Legend iconType="circle" />
              <Line type="monotone" dataKey={ticker} stroke="#ef4444" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="IBOV" stroke="#3b82f6" strokeWidth={3} dot={false} />
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
      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-1.5 h-5 bg-emerald-500 rounded-full" />
          <h3 className="text-display-xs text-white uppercase italic flex items-center gap-2">
            <Calendar className="icon-sm text-emerald-500" />
            Radar de Dividendos Inteligente
          </h3>
        </div>
        
        <div className="p-6 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl">
          <p className="text-slate-400 text-sm mb-6 max-w-2xl">
            Com base no histórico de proventos, o Radar identifica os meses com maior probabilidade de pagamentos no futuro.
          </p>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {MONTHS.map((m, i) => {
              const isProbable = dividendMonths.includes(i);
              return (
                <div 
                  key={m} 
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border ${
                    isProbable 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                    : 'bg-slate-800/30 border-white/5 text-slate-500'
                  }`}
                >
                  <span className="font-bold text-sm uppercase tracking-widest">{m}</span>
                  {isProbable && <span className="text-[10px] uppercase font-black tracking-widest mt-1">Previsto</span>}
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
      <div className="space-y-8">
        {/* Receitas e Lucros */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-1.5 h-5 bg-blue-500 rounded-full" />
            <h3 className="text-display-xs text-white uppercase italic">Receitas e Lucros (Anual)</h3>
          </div>
          <div className="p-6 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formattedFunds} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="year" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}M`} />
                <Tooltip 
                  cursor={{ fill: '#ffffff05' }}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#ffffff10', borderRadius: '12px' }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="Receita" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Lucro" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Lucro X Cotação */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-1.5 h-5 bg-yellow-500 rounded-full" />
            <h3 className="text-display-xs text-white uppercase italic flex items-center gap-2">
              <TrendingUp className="icon-sm text-yellow-500" />
              Lucro x Cotação
            </h3>
          </div>
          <div className="p-6 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl h-[400px]">
             <p className="text-slate-400 text-sm mb-6 max-w-2xl">
               Análise das cotações (escala direita) comparado com o Lucro Líquido anual (escala esquerda).
             </p>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={formattedFunds.filter(f => f.Cotacao > 0 && f.Lucro !== 0)} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="year" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" stroke="#10b981" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}M`} />
                <YAxis yAxisId="right" orientation="right" stroke="#eab308" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `R$ ${v.toFixed(2)}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#ffffff10', borderRadius: '12px' }}
                />
                <Legend iconType="circle" />
                <Line yAxisId="left" type="monotone" dataKey="Lucro" stroke="#10b981" strokeWidth={3} activeDot={{ r: 8 }} />
                <Line yAxisId="right" type="monotone" dataKey="Cotacao" name="Cotação" stroke="#eab308" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Evolução do Patrimônio */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-1.5 h-5 bg-purple-500 rounded-full" />
            <h3 className="text-display-xs text-white uppercase italic">Evolução do Patrimônio</h3>
          </div>
          <div className="p-6 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={formattedFunds} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="patrimonio" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="year" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}M`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#ffffff10', borderRadius: '12px' }}
                />
                <Legend iconType="circle" />
                <Area type="monotone" dataKey="Patrimonio" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#patrimonio)" />
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
      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-1.5 h-5 bg-cyan-500 rounded-full" />
          <h3 className="text-display-xs text-white uppercase italic flex items-center gap-2">
            <Globe className="icon-sm text-cyan-500" />
            Regiões que Geram Receita
          </h3>
        </div>
        <div className="p-6 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl flex flex-col md:flex-row items-center gap-8">
          <div className="h-[250px] w-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#ffffff10', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-3 w-full">
            {data.map((d, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-sm font-bold text-white">{d.name}</span>
                </div>
                <span className="text-sm font-black text-slate-400">{d.value}%</span>
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
      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-1.5 h-5 bg-orange-500 rounded-full" />
          <h3 className="text-display-xs text-white uppercase italic flex items-center gap-2">
            <Building2 className="icon-sm text-orange-500" />
            Negócios que Geram Receita
          </h3>
        </div>
        <div className="p-6 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 space-y-3 w-full">
            {data.map((d, i) => (
              <div key={i} className="flex flex-col gap-2 p-4 bg-white/5 rounded-xl border border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">{d.name}</span>
                  <span className="text-sm font-black text-orange-400">{d.value}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: `${d.value}%` }} />
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
    <div className="space-y-12 mt-12 pt-12 border-t border-white/5">
      {renderRadar()}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderRegionsMock()}
        {renderSegmentsMock()}
      </div>
      {renderFundamentals()}
    </div>
  );
}
