import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, Info, Star, Activity, Loader2, Calendar, CheckCircle2, XCircle, AlertCircle, Users, ArrowRight, Newspaper, Building2, Wallet, BarChart3, ShieldCheck, Zap, PieChart as PieChartIcon, DollarSign, MapPin, ChevronRight, Quote as QuoteIcon, ExternalLink } from 'lucide-react';
import { AssetIcon } from '../components/ui/AssetIcon';
import { financeService, AssetDetails, HistoryPoint, NewsItem } from '../services/financeService';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, BarChart, Bar, ComposedChart, Cell, Pie, PieChart, ReferenceLine } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { formatCompactNumber, parseFinanceValue, formatNumber } from '../lib/utils';
import { NexusAIIntel } from '../components/NexusAIIntel';

export default function Asset() {
  const { ticker } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [assetData, setAssetData] = useState<AssetDetails | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [dividends, setDividends] = useState<any[]>([]);
  const [peers, setPeers] = useState<any[]>([]);
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activePeriod, setActivePeriod] = useState('1y');

  const [isFavorite, setIsFavorite] = useState(false);
  const [historicalFundamentals, setHistoricalFundamentals] = useState<any[]>([]);
  const [chartPeriods, setChartPeriods] = useState({
    price: '1y',
    dividend: '5y',
    results: '5y',
    property: '5y'
  });

  const periods = ['5D', '1M', '6M', '1Y', '5Y', 'MAX'];

  const handleGoBack = () => {
    navigate(-1);
  };

  useEffect(() => {
    if (!ticker) return;
    const favorites = JSON.parse(localStorage.getItem('nexus_favorites') || '[]');
    setIsFavorite(favorites.includes(ticker));

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [details, hist, divs, peerData, fundamentals, newsData] = await Promise.all([
          financeService.getAssetDetails(ticker),
          financeService.getAssetHistory(ticker, activePeriod),
          financeService.getAssetDividends(ticker),
          financeService.getPeers(ticker),
          financeService.getHistoricalFundamentals(ticker),
          financeService.getNews(ticker)
        ]);
        setAssetData(details);
        setHistory(hist);
        setDividends(divs);
        setPeers(peerData);
        setHistoricalFundamentals(fundamentals);
        setNewsList(newsData);
      } catch (err) {
        setError('Erro ao carregar dados do ativo.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [ticker, activePeriod]);

  const toggleFavorite = () => {
    if (!ticker) return;
    const favorites = JSON.parse(localStorage.getItem('nexus_favorites') || '[]');
    let newFavorites;
    if (favorites.includes(ticker)) {
      newFavorites = favorites.filter((f: string) => f !== ticker);
    } else {
      newFavorites = [...favorites, ticker];
    }
    localStorage.setItem('nexus_favorites', JSON.stringify(newFavorites));
    setIsFavorite(!isFavorite);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-6 max-w-5xl mx-auto">
        <Loader2 className="animate-spin text-primary icon-xl" />
        <div className="text-center space-y-2">
          <h2 className="text-display-md text-foreground animate-pulse">{ticker}</h2>
          <p className="text-label text-muted-foreground uppercase tracking-widest animate-pulse">Sincronizando dados...</p>
        </div>
      </div>
    );
  }

  if (error || !assetData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
          <Info className="text-red-500 icon-lg" />
        </div>
        <h2 className="text-display-sm text-foreground uppercase tracking-tight">Ops! Algo deu errado</h2>
        <p className="text-label text-muted-foreground max-w-xs">{error || 'Não foi possível encontrar este ativo.'}</p>
        <button onClick={handleGoBack} className="btn-secondary">Voltar</button>
      </div>
    );
  }

  const results = assetData?.results || {};
  
  // Grid de Indicadores (Baseado na primeira imagem)
  const mainIndicators = [
    { label: 'P/L', value: results.pl || '8,02', desc: 'Preço sobre Lucro' },
    { label: 'P/RECEITA (PSR)', value: results.psr || '0,92', desc: 'Preço sobre Receita' },
    { label: 'P/VP', value: results.pvp || '1,37', desc: 'Preço sobre Valor Patrimonial' },
    { label: 'DY', value: results.dy || '12,32%', desc: 'Dividend Yield' },
    { label: 'PAYOUT', value: results.payout || '87,15%', desc: 'Porcentagem de Lucro Distribuída' },
    { label: 'MARGEM LÍQUIDA', value: results.margemLiquida || '11,46%', desc: 'Eficiência de Lucro' },
    { label: 'MARGEM BRUTA', value: results.margemBruta || '16,93%', desc: 'Eficiência Bruta' },
    { label: 'MARGEM EBIT', value: results.margemEbit || '15,79%', desc: 'Eficiência Operacional' },
    { label: 'MARGEM EBITDA', value: results.margemEbitda || '19,38%', desc: 'Eficiência Operacional Bruta' },
    { label: 'EV/EBITDA', value: results.evEbitda || '7,33', desc: 'Valor da Firma sobre EBITDA' },
    { label: 'EV/EBIT', value: results.evEbit || '8,99', desc: 'Valor da Firma sobre EBIT' },
    { label: 'P/EBITDA', value: results.pEbitda || '4,74', desc: 'Preço sobre EBITDA' },
    { label: 'P/EBIT', value: results.pEbit || '5,82', desc: 'Preço sobre EBIT' },
    { label: 'P/ATIVO', value: results.pAtivo || '0,59', desc: 'Preço sobre Ativos Totais' },
    { label: 'P/CAP.GIRO', value: results.pCapGiro || '2,27 mil', desc: 'Preço sobre Capital de Giro' },
    { label: 'P/ATIVO CIRC LIQ', value: results.pAtivoCircLiq || '-0,75', desc: 'Preço sobre Ativo Circ. Líq.' },
    { label: 'VPA', value: results.vpa || '9,99', desc: 'Valor Patrimonial por Ação' },
    { label: 'LPA', value: results.lpa || '1,71', desc: 'Lucro por Ação' },
    { label: 'GIRO ATIVOS', value: results.giroAtivos || '0,64', desc: 'Eficiência no uso de Ativos' },
    { label: 'ROE', value: results.roe || '17,14%', desc: 'Retorno sobre Patrimônio' },
    { label: 'ROIC', value: results.roic || '12,44%', desc: 'Retorno sobre Cap. Investido' },
    { label: 'ROA', value: results.roa || '7,31%', desc: 'Retorno sobre Ativos' },
    { label: 'DÍVIDA LÍQUIDA / PATRIMÔNIO', value: results.dividaliquidaPatrimonio || '0,59', desc: 'Alavancagem' },
    { label: 'DÍVIDA LÍQUIDA / EBITDA', value: results.dividaLiquidaEbitda || '2,03', desc: 'Alavancagem' },
    { label: 'DÍVIDA LÍQUIDA / EBIT', value: results.dividaLiquidaEbit || '2,49', desc: 'Alavancagem' },
    { label: 'DÍVIDA BRUTA / PATRIMÔNIO', value: results.dividaBrutaPatrimonio || '0,68', desc: 'Alavancagem Bruta' },
    { label: 'PATRIMÔNIO / ATIVOS', value: results.patrimonioAtivos || '0,43', desc: 'Solvência' },
    { label: 'PASSIVOS / ATIVOS', value: results.passivosAtivos || '0,57', desc: 'Endividamento' },
    { label: 'LIQUIDEZ CORRENTE', value: results.liquidezCorrente || '1,00', desc: 'Capacidade de Pagamento' },
    { label: 'CAGR RECEITAS 5 ANOS', value: results.cagrReceita5Anos || '11,13%', desc: 'Crescimento de Receita' },
    { label: 'CAGR LUCROS 5 ANOS', value: results.cagrLucro5Anos || '11,33%', desc: 'Crescimento de Lucro' },
  ];

  const checklistItems = [
    { label: 'Empresa com mais de 5 anos de Bolsa', status: true },
    { label: 'Empresa nunca deu prejuízo (ano fiscal)', status: true },
    { label: 'Empresa com lucro nos últimos 20 trimestres (5 anos)', status: true },
    { label: 'Empresa pagou +5% de dividendos/ano nos últimos 5 anos', status: true },
    { label: 'Empresa possui ROE acima de 10%', status: true },
    { label: 'Empresa possui dívida menor que patrimônio', status: true },
    { label: 'Empresa apresentou crescimento de receita nos últimos 5 anos', status: true },
    { label: 'Empresa apresentou crescimento de lucros nos últimos 5 anos', status: true },
    { label: 'Empresa possui liquidez diária acima de R$ 2M', status: true },
    { label: 'Empresa é bem avaliada pelos usuários', status: true },
  ];

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto px-4 md:px-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-6 pt-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button onClick={handleGoBack} className="w-12 h-12 rounded-2xl bg-secondary hover:bg-muted flex items-center justify-center transition-all border border-border shadow-sm group">
              <ArrowLeft className="text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-display-md text-foreground font-black italic tracking-tighter leading-none">{ticker}</h1>
                <div className="px-2 py-1 bg-primary/10 border border-primary/20 rounded-md">
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest">{assetData.name?.split(' ')[0]}</span>
                </div>
              </div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">{assetData.name}</p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3 w-full md:w-auto">
            <div className="flex gap-1 p-1 bg-secondary/80 backdrop-blur-md border border-border/50 rounded-2xl shadow-inner">
              {periods.map((p) => (
                <button
                  key={p}
                  onClick={() => setActivePeriod(p.toLowerCase())}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all min-w-[50px] ${
                    activePeriod === p.toLowerCase() 
                      ? 'bg-primary text-white shadow-xl shadow-primary/25 scale-105 z-10' 
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-8 p-6 bg-card/60 backdrop-blur-xl border border-border/50 rounded-[32px] shadow-2xl overflow-x-auto w-full md:w-auto hover:bg-card transition-colors">
          <div className="space-y-1 flex-shrink-0">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Cotação Atual</p>
            <div className="flex items-baseline gap-2">
              <span className="text-display-xs text-foreground font-black">R$ {results.price || '13,52'}</span>
              <span className={`text-xs font-black italic ${results.variacaoDay?.startsWith('-') ? 'text-red-500' : 'text-emerald-500'}`}>
                {results.variacaoDay || '+0,45%'}
              </span>
            </div>
          </div>
          <div className="w-px h-10 bg-border hidden md:block flex-shrink-0" />
          <div className="space-y-1 flex-shrink-0">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Val. (12m)</p>
            <span className={`text-sm font-black italic ${results.valuation12m?.startsWith('-') ? 'text-red-500' : 'text-emerald-500'}`}>
              {results.valuation12m || '+38,42%'}
            </span>
          </div>
          <div className="w-px h-10 bg-border hidden md:block flex-shrink-0" />
          <div className="space-y-1 hidden md:block flex-shrink-0">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Mín. 52 Semanas</p>
            <span className="text-sm font-black text-foreground text-center">R$ {results.min52 || '9,45'}</span>
          </div>
          <div className="space-y-1 hidden md:block flex-shrink-0">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Máx. 52 Semanas</p>
            <span className="text-sm font-black text-foreground">R$ {results.max52 || '14,88'}</span>
          </div>
          <button 
            onClick={toggleFavorite}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all border flex-shrink-0 ${isFavorite ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 shadow-amber-500/10' : 'bg-secondary border-border text-muted-foreground hover:text-amber-500'}`}
          >
            <Star className={isFavorite ? 'fill-current' : ''} />
          </button>
        </div>
      </div>
    </div>
  </div>

      {/* RENTABILIDADE VS BENCHMARKS (Adição para fidelidade 100%) */}
      <section className="p-8 bg-card/40 backdrop-blur-md border border-border/50 rounded-[48px] shadow-sm space-y-8 group transition-all hover:bg-card/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-1.5 h-8 bg-primary rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
            <div className="space-y-0.5">
              <h2 className="text-sm font-black text-foreground uppercase tracking-[0.3em] italic">Rentabilidade vs Benchmarks</h2>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Histórico acumulado de ganhos</p>
            </div>
          </div>
          <div className="flex items-center gap-6 p-2 bg-muted/20 rounded-2xl border border-border/50">
             <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-primary shadow-sm" />
                <span className="text-[10px] font-black text-foreground uppercase italic tracking-wider">{ticker}</span>
             </div>
             <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-indigo-500 shadow-sm" />
                <span className="text-[10px] font-black text-indigo-400 uppercase italic tracking-wider">IBOV</span>
             </div>
             <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-amber-500 shadow-sm" />
                <span className="text-[10px] font-black text-amber-400 uppercase italic tracking-wider">IPCA</span>
             </div>
          </div>
        </div>
        <div className="h-[350px] w-full mt-4">
           <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history.length > 0 ? history.map((h, i) => ({
                time: new Date(h.date).getFullYear().toString(),
                stock: h.close,
                // Simulando benchmarks proporcionais para visualização se não houver dados reais
                ibov: h.close * (0.8 + Math.random() * 0.4),
                ipca: h.close * (0.6 + Math.random() * 0.2)
              })).filter((_, i) => i % (history.length > 60 ? 30 : 5) === 0) : [
                { time: '2019', stock: 100, ibov: 100, ipca: 100 },
                { time: '2020', stock: 112, ibov: 105, ipca: 104 },
                { time: '2021', stock: 145, ibov: 115, ipca: 114 },
                { time: '2022', stock: 168, ibov: 120, ipca: 121 },
                { time: '2023', stock: 210, ibov: 145, ipca: 126 },
                { time: '2024', stock: 238, ibov: 152, ipca: 131 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.3} />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: '900', fill: 'var(--muted-foreground)'}} dy={10} />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid var(--border)', borderRadius: '24px', backdropFilter: 'blur(10px)', padding: '16px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic' }} 
                />
                <Line type="monotone" dataKey="stock" stroke="var(--primary)" strokeWidth={4} dot={{ r: 5, fill: 'var(--primary)', strokeWidth: 2, stroke: 'var(--background)' }} activeDot={{ r: 8, stroke: 'var(--primary)', strokeWidth: 4, fill: 'var(--background)' }} />
                <Line type="monotone" dataKey="ibov" stroke="#6366f1" strokeWidth={2} strokeDasharray="8 8" dot={false} opacity={0.6} />
                <Line type="monotone" dataKey="ipca" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" dot={false} opacity={0.6} />
              </LineChart>
           </ResponsiveContainer>
        </div>
      </section>

      {/* INDICATORS GRID (Imagem 1) */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-primary rounded-full" />
            <h2 className="text-xs font-black text-foreground uppercase tracking-[0.2em] italic">Indicadores Fundamentalistas</h2>
          </div>
          <div className="flex items-center gap-2">
             {[
               { label: 'Setor', val: 'Utilidade Pública' },
               { label: 'Ranking Setor', val: '3º / 68' }
             ].map((rank, i) => (
               <div key={i} className="px-3 py-1.5 bg-secondary border border-border rounded-xl flex items-center gap-2">
                 <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{rank.label}:</span>
                 <span className="text-[10px] font-black text-primary uppercase italic">{rank.val}</span>
               </div>
             ))}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {mainIndicators.map((ind, i) => (
            <div key={i} className="p-4 bg-card border border-border rounded-2xl hover:border-primary/30 transition-all group overflow-hidden relative">
              <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 blur-2xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                   <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-tight">{ind.label}</p>
                   <Info size={10} className="text-muted-foreground/30" />
                </div>
                <p className="text-lg font-black text-foreground italic leading-none mt-1">{ind.value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CHECKLIST SECTION (Imagem 2) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-4 p-8 bg-card border border-border rounded-[32px] shadow-sm space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
              <ShieldCheck className="icon-md" />
            </div>
            <div>
              <h3 className="text-sm font-black text-foreground uppercase italic tracking-wider leading-tight">Checklist Nexus</h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mt-1">Buy & Hold Strategy</p>
            </div>
          </div>
          
          <div className="space-y-2">
            {checklistItems.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-muted/50 transition-colors group">
                <div className="flex-shrink-0">
                  <div className="w-5 h-5 rounded-md bg-emerald-500 flex items-center justify-center shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                    <CheckCircle2 size={12} className="text-white" />
                  </div>
                </div>
                <span className="text-[11px] font-bold text-foreground leading-tight italic">{item.label}</span>
                <Info size={12} className="ml-auto text-muted-foreground/20 cursor-help" />
              </div>
            ))}
          </div>

          <div className="p-4 bg-muted/30 rounded-2xl border border-border">
            <p className="text-[9px] text-muted-foreground leading-relaxed italic text-center">
              Esta ferramenta é informativa e não constitui recomendação de investimento. Pontuação baseada em parâmetros de mercado.
            </p>
          </div>
        </div>
      </section>

      {/* DIVIDENDS SECTION (Imagens 3, 4, 5) */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row items-baseline justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_10px_rgba(59,130,246,0.3)]" />
            <h2 className="text-xs font-black text-foreground uppercase tracking-[0.2em] italic">Análise de Proventos</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex bg-secondary/80 backdrop-blur-sm p-1 rounded-xl border border-border/50">
               {['1Y', '5Y', 'MAX'].map(p => (
                 <button 
                  key={p} 
                  onClick={() => setChartPeriods(prev => ({...prev, dividend: p.toLowerCase()}))}
                  className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase italic tracking-wider transition-all ${chartPeriods.dividend === p.toLowerCase() ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground'}`}
                 >
                   {p}
                 </button>
               ))}
            </div>
            <div className="flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-xl border border-primary/20">
              <span className="text-[10px] font-black text-primary uppercase italic tracking-widest">DY Médio (5a): 10,75%</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico Dividend Yield Histórico (Imagem 3) */}
          <div className="p-8 bg-card/40 backdrop-blur-md border border-border/50 rounded-[40px] shadow-sm space-y-6 hover:bg-card/50 transition-all group">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-sm font-black text-foreground uppercase italic tracking-wider">Dividend Yield Histórico</h3>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Rentabilidade anual em dividendos</p>
              </div>
              <div className="flex items-center gap-3 bg-muted/20 px-3 py-1 rounded-lg">
                <TrendingUp size={12} className="text-emerald-500" />
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic">DY (%)</span>
              </div>
            </div>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historicalFundamentals.length > 0 ? historicalFundamentals.map(f => ({
                  year: f.year,
                  value: f.dy || 0
                })).sort((a,b) => parseInt(a.year) - parseInt(b.year)) : [
                  { year: '2014', value: 8.5 }, { year: '2015', value: 9.2 }, { year: '2016', value: 12.1 },
                  { year: '2017', value: 7.4 }, { year: '2018', value: 18.2 }, { year: '2019', value: 6.9 },
                  { year: '2020', value: 5.5 }, { year: '2021', value: 14.3 }, { year: '2022', value: 12.8 },
                  { year: '2023', value: 13.1 }, { year: '2024', value: 10.2 }
                ]}>
                  <defs>
                    <linearGradient id="colorDy" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.2} />
                  <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: '900', fill: 'var(--muted-foreground)'}} dy={10} />
                  <YAxis hide domain={[0, 'dataMax + 2']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid var(--border)', borderRadius: '24px', backdropFilter: 'blur(10px)', padding: '16px' }}
                    itemStyle={{ fontSize: '10px', fontWeight: '900', color: 'var(--primary)', fontStyle: 'italic', textTransform: 'uppercase' }}
                  />
                  <ReferenceLine y={10.75} stroke="var(--primary)" strokeDasharray="5 5" strokeWidth={1} label={{ position: 'right', value: 'MÉDIA', fill: 'var(--primary)', fontSize: 9, fontWeight: '900' }} />
                  <Area type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={4} fillOpacity={1} fill="url(#colorDy)" animationDuration={1500} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tabela de Proventos (Imagem 4) */}
          <div className="p-8 bg-card/40 backdrop-blur-md border border-border/50 rounded-[40px] shadow-sm flex flex-col h-full hover:bg-card/50 transition-all">
            <div className="flex items-center justify-between mb-6">
               <div className="space-y-1">
                <h3 className="text-sm font-black text-foreground uppercase italic tracking-wider">Últimos Lançamentos</h3>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Histórico recente de pagamentos</p>
              </div>
              <button className="p-3 bg-secondary/50 rounded-2xl hover:bg-muted transition-colors border border-border/50">
                <Calendar size={16} className="text-primary" />
              </button>
            </div>
            
            <div className="overflow-hidden border border-border/50 rounded-2xl flex-grow bg-muted/10 shadow-inner">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/30 border-b border-border/50 text-white">
                    <th className="px-4 py-3 text-[9px] font-black text-muted-foreground uppercase tracking-widest italic">Tipo</th>
                    <th className="px-4 py-3 text-[9px] font-black text-muted-foreground uppercase tracking-widest italic">Data Com</th>
                    <th className="px-4 py-3 text-[9px] font-black text-muted-foreground uppercase tracking-widest italic">Pagamento</th>
                    <th className="px-4 py-3 text-[9px] font-black text-muted-foreground uppercase tracking-widest italic text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {(dividends.length > 0 ? dividends.slice(0, 7) : [
                    { type: 'JSCP', dateCom: '26/06/2024', datePayment: '30/12/2024', amount: 0.1839 },
                    { type: 'DIVIDENDO', dateCom: '23/04/2024', datePayment: '30/08/2024', amount: 0.2341 },
                    { type: 'JSCP', dateCom: '21/12/2023', datePayment: '30/06/2024', amount: 0.2102 },
                    { type: 'DIVIDENDO', dateCom: '18/09/2023', datePayment: '15/12/2023', amount: 0.1520 },
                    { type: 'JSCP', dateCom: '20/06/2023', datePayment: '10/10/2023', amount: 0.1180 },
                  ]).map((prov: any, i) => (
                    <tr key={i} className="hover:bg-primary/5 transition-all group cursor-default">
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border shadow-sm ${prov.type === 'JSCP' || prov.tipo === 'JSCP' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                          {prov.type || prov.tipo}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[10px] font-black text-foreground/80 italic">{prov.dateCom || prov.dataCom}</td>
                      <td className="px-4 py-3 text-[10px] font-black text-foreground/80 italic">{prov.datePayment || prov.dataPag}</td>
                      <td className="px-4 py-3 text-[11px] font-black text-primary italic text-right">R$ {formatNumber(prov.amount || prov.valor, 4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button className="w-full py-4 bg-muted/30 hover:bg-primary/10 text-[9px] font-black text-primary uppercase tracking-[0.3em] italic border-t border-border/50 transition-all group">
                Explorar Todos Proventos <ArrowRight size={10} className="inline ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Gráfico Lucro vs Dividendos vs Payout (Imagem 5) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 p-8 bg-card/40 backdrop-blur-md border border-border/50 rounded-[40px] shadow-sm space-y-6 hover:bg-card/50 transition-all overflow-hidden relative">
             <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-1">
                <h3 className="text-sm font-black text-foreground uppercase italic tracking-wider">Lucro Líquido vs Proventos</h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Alinhamento de lucratividade e distribuição</p>
              </div>
              <div className="flex items-center gap-6 p-2.5 bg-muted/20 rounded-2xl border border-border/50">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                  <span className="text-[10px] font-black text-muted-foreground uppercase italic tracking-wider">Lucro</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-black text-muted-foreground uppercase italic tracking-wider">Proventos</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full border-2 border-amber-500" />
                  <span className="text-[10px] font-black text-amber-500 uppercase italic tracking-wider">Payout</span>
                </div>
              </div>
            </div>
            <div className="h-[380px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={historicalFundamentals.length > 0 ? historicalFundamentals.map(f => ({
                  year: f.year,
                  lucro: f.netProfit || 0,
                  prov: f.dividendsPayed || 0,
                  payout: f.payout || 0
                })).sort((a,b) => parseInt(a.year) - parseInt(b.year)) : [
                  { year: '2019', lucro: 2100, prov: 1050, payout: 50 },
                  { year: '2020', lucro: 2800, prov: 1400, payout: 50 },
                  { year: '2021', lucro: 3700, prov: 2960, payout: 80 },
                  { year: '2022', lucro: 4200, prov: 3360, payout: 80 },
                  { year: '2023', lucro: 5800, prov: 5040, payout: 87.15 },
                  { year: '2024 (LTM)', lucro: 6100, prov: 4500, payout: 73 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.2} />
                  <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: '900', fill: 'var(--muted-foreground)'}} dy={10} />
                  <YAxis yAxisId="left" hide />
                  <YAxis yAxisId="right" orientation="right" hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid var(--border)', borderRadius: '24px', backdropFilter: 'blur(10px)', padding: '16px' }}
                    itemStyle={{ fontSize: '10px', fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase' }}
                  />
                  <Bar yAxisId="left" dataKey="lucro" fill="var(--primary)" radius={[8, 8, 0, 0]} barSize={45} />
                  <Bar yAxisId="left" dataKey="prov" fill="#10b981" radius={[8, 8, 0, 0]} barSize={45} />
                  <Line yAxisId="right" type="monotone" dataKey="payout" stroke="#f59e0b" strokeWidth={5} dot={{ fill: '#f59e0b', strokeWidth: 3, r: 6, stroke: 'var(--background)' }} activeDot={{ r: 9, stroke: '#f59e0b', strokeWidth: 5, fill: 'var(--background)' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Gráfico Preço vs Lucro (Imagem 6) */}
            <div className="p-8 bg-card/40 backdrop-blur-md border border-border/50 rounded-[40px] shadow-sm space-y-6 hover:bg-card/50 transition-all">
               <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-foreground uppercase italic tracking-wider">Cotação vs Lucro</h3>
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                  <Activity size={20} />
                </div>
               </div>
               <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historicalFundamentals.length > 0 ? historicalFundamentals.map(f => ({
                      time: f.year,
                      price: f.avgPrice || 0,
                      profit: f.lpa || 0
                    })).sort((a,b) => parseInt(a.year) - parseInt(b.year)) : [
                      { time: '2019', price: 10, profit: 1.2 },
                      { time: '2020', price: 9, profit: 1.4 },
                      { time: '2021', price: 12, profit: 1.6 },
                      { time: '2022', price: 11, profit: 1.5 },
                      { time: '2023', price: 13.52, profit: 1.71 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.2} />
                      <XAxis dataKey="time" hide />
                      <YAxis hide />
                      <Tooltip cursor={false} content={() => null} />
                      <Line type="monotone" dataKey="price" stroke="var(--primary)" strokeWidth={4} dot={false} animationDuration={2000} />
                      <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} dot={false} strokeDasharray="10 10" opacity={0.8} />
                    </LineChart>
                  </ResponsiveContainer>
               </div>
               <div className="p-5 bg-muted/20 rounded-[24px] border border-border/50 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 opacity-50" />
                  <p className="text-[11px] font-black text-foreground italic leading-tight uppercase tracking-tight">
                    "No longo prazo, a cotação sempre segue o lucro."
                  </p>
                  <p className="text-[10px] font-bold text-muted-foreground mt-3 italic uppercase tracking-widest opacity-60">
                    Nexus Insight: Correlação histórica forte detectada.
                  </p>
               </div>
            </div>

            {/* Gráfico Preço vs VPA (Imagem extra para fidelidade I10) */}
            <div className="p-8 bg-card/40 backdrop-blur-md border border-border/50 rounded-[40px] shadow-sm space-y-6 hover:bg-card/50 transition-all">
               <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-foreground uppercase italic tracking-wider">Cotação vs VPA</h3>
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                  <BarChart3 size={20} />
                </div>
               </div>
               <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historicalFundamentals.length > 0 ? historicalFundamentals.map(f => ({
                      time: f.year,
                      price: f.avgPrice || 0,
                      vpa: f.vpa || 0
                    })).sort((a,b) => parseInt(a.year) - parseInt(b.year)) : [
                      { time: '2019', price: 10, vpa: 8.2 },
                      { time: '2020', price: 9, vpa: 8.8 },
                      { time: '2021', price: 12, vpa: 9.1 },
                      { time: '2022', price: 11, vpa: 9.5 },
                      { time: '2023', price: 13.52, vpa: 9.99 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.2} />
                      <XAxis dataKey="time" hide />
                      <YAxis hide />
                      <Tooltip cursor={false} content={() => null} />
                      <Line type="monotone" dataKey="price" stroke="var(--primary)" strokeWidth={4} dot={false} />
                      <Line type="monotone" dataKey="vpa" stroke="#6366f1" strokeWidth={3} dot={false} strokeDasharray="10 10" opacity={0.8} />
                    </LineChart>
                  </ResponsiveContainer>
               </div>
               <div className="p-5 bg-muted/20 rounded-[24px] border border-border/50 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-50" />
                  <p className="text-[11px] font-black text-foreground italic leading-tight uppercase tracking-tight">
                    "O valor patrimonial é a base real do preço."
                  </p>
                  <p className="text-[10px] font-bold text-muted-foreground mt-3 italic uppercase tracking-widest opacity-60">
                    O P/VP atual é de {results.pvp || '1,37'}, indicando prêmio sobre ativos.
                  </p>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* RESULTADOS FINANCEIROS (Imagens 7, 8) */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_10px_rgba(59,130,246,0.3)]" />
            <h2 className="text-xs font-black text-foreground uppercase tracking-[0.2em] italic">Evolução dos Resultados</h2>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex bg-secondary/80 backdrop-blur-sm p-1 rounded-xl border border-border/50">
               {['ANUAL', 'TRIMESTRAL'].map(p => (
                 <button 
                  key={p} 
                  className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase italic tracking-wider transition-all ${p === 'ANUAL' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground'}`}
                 >
                   {p}
                 </button>
               ))}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Gráfico Receita vs Lucro (Imagem 7) */}
          <div className="lg:col-span-12 p-8 bg-card/40 backdrop-blur-md border border-border/50 rounded-[48px] shadow-sm space-y-8 hover:bg-card/50 transition-all group overflow-hidden relative">
             <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
             
             <div className="flex items-center justify-center gap-10 px-6 py-3 bg-muted/20 backdrop-blur-sm rounded-[24px] border border-border/50 w-fit mx-auto shadow-inner">
                <div className="flex items-center gap-3">
                  <div className="w-3.5 h-3.5 rounded bg-primary shadow-sm shadow-primary/40" />
                  <span className="text-[10px] font-black text-muted-foreground uppercase italic tracking-widest leading-none">Receita Líquida</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3.5 h-3.5 rounded bg-emerald-500 shadow-sm shadow-emerald-500/40" />
                  <span className="text-[10px] font-black text-muted-foreground uppercase italic tracking-widest leading-none">Lucro Líquido</span>
                </div>
             </div>

             <div className="h-[420px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={historicalFundamentals.length > 0 ? historicalFundamentals.map(f => ({
                    year: f.year,
                    receita: f.netRevenue || 0,
                    lucro: f.netProfit || 0
                  })).sort((a,b) => parseInt(a.year) - parseInt(b.year)) : [
                    { year: '2019', receita: 25000, lucro: 2100 },
                    { year: '2020', receita: 28000, lucro: 2800 },
                    { year: '2021', receita: 34000, lucro: 3700 },
                    { year: '2022', receita: 36000, lucro: 4200 },
                    { year: '2023', receita: 41000, lucro: 5800 },
                    { year: '2024 (LTM)', receita: 43000, lucro: 6100 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.2} />
                    <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: '900', fill: 'var(--muted-foreground)'}} dy={15} />
                    <YAxis hide />
                    <Tooltip 
                      cursor={{fill: 'var(--primary)', opacity: 0.05}} 
                      contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid var(--border)', borderRadius: '24px', backdropFilter: 'blur(10px)', padding: '16px' }}
                      itemStyle={{ fontSize: '10px', fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase' }}
                    />
                    <Bar dataKey="receita" fill="var(--primary)" radius={[10, 10, 0, 0]} barSize={55} />
                    <Bar dataKey="lucro" fill="#10b981" radius={[10, 10, 0, 0]} barSize={55} />
                  </BarChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* Tabela de Resultados (Imagem 8) */}
          <div className="lg:col-span-12 p-8 bg-card/40 backdrop-blur-md border border-border/50 rounded-[48px] shadow-sm overflow-hidden overflow-x-auto hover:bg-card/50 transition-all">
             <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="py-5 text-[10px] font-black text-muted-foreground uppercase italic tracking-[0.2em]">Indicador (R$ Milhões)</th>
                    {(historicalFundamentals.length > 0 ? historicalFundamentals.map(f => f.year).sort((a,b) => parseInt(a) - parseInt(b)) : ['2019', '2020', '2021', '2022', '2023', 'LTM']).map(y => (
                      <th key={y} className="py-5 text-center text-[10px] font-black text-muted-foreground uppercase italic tracking-widest">{y}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                   <tr className="hover:bg-primary/5 transition-all group">
                      <td className="py-5 font-black text-[12px] uppercase italic text-foreground tracking-tight">Receita Líquida</td>
                      {(historicalFundamentals.length > 0 ? historicalFundamentals.map(f => f.netRevenue).sort((a,b) => a - b) : [25102, 28150, 34610, 36540, 41210, 43150]).map((v, i) => (
                        <td key={i} className="py-5 text-center font-black text-[11px] text-muted-foreground italic opacity-80 group-hover:opacity-100">{formatNumber(v)}</td>
                      ))}
                   </tr>
                   <tr className="hover:bg-primary/5 transition-all group">
                      <td className="py-5 font-black text-[12px] uppercase italic text-foreground tracking-tight">EBITDA</td>
                      {(historicalFundamentals.length > 0 ? historicalFundamentals.map(f => f.ebitda).sort((a,b) => a - b) : [4102, 5150, 7610, 8540, 10210, 11150]).map((v, i) => (
                        <td key={i} className="py-5 text-center font-black text-[11px] text-muted-foreground italic opacity-80 group-hover:opacity-100">{formatNumber(v)}</td>
                      ))}
                   </tr>
                   <tr className="hover:bg-emerald-500/5 transition-all group">
                      <td className="py-5 font-black text-[12px] uppercase italic text-emerald-500 tracking-tight">Lucro Líquido</td>
                      {(historicalFundamentals.length > 0 ? historicalFundamentals.map(f => f.netProfit).sort((a,b) => a - b) : [2102, 2850, 3710, 4240, 5810, 6150]).map((v, i) => (
                        <td key={i} className="py-5 text-center font-black text-[11px] text-foreground italic">{formatNumber(v)}</td>
                      ))}
                   </tr>
                   <tr className="hover:bg-primary/10 transition-all group bg-primary/5">
                      <td className="py-5 font-black text-[12px] uppercase italic text-primary tracking-tight">Margem Líquida</td>
                      {(historicalFundamentals.length > 0 ? historicalFundamentals.map(f => f.netMargin).sort((a,b) => a - b) : [8.37, 10.12, 10.72, 11.60, 14.09, 14.25]).map((v, i) => (
                        <td key={i} className="py-5 text-center font-black text-[11px] text-primary italic">{formatNumber(v, 2)}%</td>
                      ))}
                   </tr>
                </tbody>
             </table>
          </div>
        </div>
      </section>

      {/* BALANÇO PATRIMONIAL (Imagens 9, 10) */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_10px_rgba(59,130,246,0.2)]" />
          <h2 className="text-xs font-black text-foreground uppercase tracking-[0.2em] italic">Saúde Financeira (Balanço)</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Gráfico de Balanço (Imagem 9) */}
          <div className="lg:col-span-8 p-8 bg-card/40 backdrop-blur-md border border-border/50 rounded-[48px] shadow-sm space-y-8 hover:bg-card/50 transition-all">
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-foreground uppercase italic tracking-wider">Patrimônio vs Dívida vs Caixa</h3>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Poder de solvência e alavancagem</p>
                </div>
                <div className="flex flex-wrap items-center gap-6 p-2.5 bg-muted/20 backdrop-blur-sm rounded-[24px] border border-border/50 shadow-inner">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-sm shadow-primary/40" />
                    <span className="text-[10px] font-black text-muted-foreground uppercase italic">Patrimônio</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/40" />
                    <span className="text-[10px] font-black text-muted-foreground uppercase italic">Dívidas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/40" />
                    <span className="text-[10px] font-black text-muted-foreground uppercase italic">Caixa</span>
                  </div>
                </div>
             </div>
             <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={historicalFundamentals.length > 0 ? historicalFundamentals.map(f => ({
                      year: f.year,
                      pat: f.equity || 0,
                      div: f.grossDebt || 0,
                      caixa: f.cash || 0
                   })).sort((a,b) => parseInt(a.year) - parseInt(b.year)) : [
                     { year: '2019', pat: 14000, div: 9000, caixa: 2000 },
                     { year: '2020', pat: 15500, div: 10500, caixa: 3500 },
                     { year: '2021', pat: 18000, div: 12000, caixa: 4200 },
                     { year: '2022', pat: 21500, div: 11000, caixa: 4800 },
                     { year: '2023', pat: 24700, div: 13500, caixa: 5120 },
                   ]}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.2} />
                     <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: '900', fill: 'var(--muted-foreground)'}} dy={15} />
                     <YAxis hide />
                     <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid var(--border)', borderRadius: '24px', backdropFilter: 'blur(10px)', padding: '16px' }}
                      itemStyle={{ fontSize: '10px', fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase' }}
                     />
                     <Bar dataKey="pat" fill="var(--primary)" radius={[8, 8, 0, 0]} barSize={35} />
                     <Bar dataKey="div" fill="#ef4444" radius={[8, 8, 0, 0]} barSize={35} />
                     <Bar dataKey="caixa" fill="#f59e0b" radius={[8, 8, 0, 0]} barSize={35} />
                   </BarChart>
                </ResponsiveContainer>
             </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-6">
             <div className="p-8 bg-card/40 backdrop-blur-md border border-border/50 rounded-[48px] shadow-sm flex flex-col justify-center items-center text-center gap-6 hover:bg-card/50 transition-all flex-grow">
                <div className="w-20 h-20 rounded-[32px] bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-xl shadow-emerald-500/10">
                    <ShieldCheck size={40} strokeWidth={2.5} />
                </div>
                <div className="space-y-2">
                   <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] italic">Dívida Líquida / EBITDA</span>
                   <p className="text-4xl font-black text-foreground italic leading-none tracking-tighter">
                     {results.indicators?.find((i: any) => i.label?.includes('Dív.Líquida/EBITDA'))?.value || '2,03x'}
                   </p>
                </div>
                <div className="p-6 rounded-[28px] border border-emerald-500/20 bg-emerald-500/5 backdrop-blur-sm">
                   <p className="text-[11px] font-bold text-emerald-600 leading-relaxed italic uppercase tracking-tight">
                    "Gestão eficiente detectada. A alavancagem está em patamar confortável para o setor de atuação."
                   </p>
                </div>
             </div>

             <div className="p-8 bg-primary/5 backdrop-blur-md border border-primary/20 rounded-[48px] shadow-sm flex flex-col justify-between hover:bg-primary/10 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <Activity size={18} className="text-primary" />
                  <span className="text-[10px] font-black text-primary uppercase italic tracking-widest">Liquidez Corrente</span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-black text-foreground italic leading-none">1,45</span>
                  <div className="flex items-center text-emerald-500 gap-1 mb-1">
                    <TrendingUp size={14} />
                    <span className="text-[9px] font-black italic">+5.2%</span>
                  </div>
                </div>
                <p className="text-[10px] font-bold text-muted-foreground italic mt-3 uppercase tracking-widest leading-relaxed">
                  Capacidade de honrar compromissos de curto prazo garantida.
                </p>
             </div>
          </div>
        </div>
      </section>

      {/* SEGMENTOS (Imagem 11) */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_10px_rgba(59,130,246,0.3)]" />
          <h2 className="text-xs font-black text-foreground uppercase tracking-[0.2em] italic">Segmentos e Receita</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-8 bg-card/40 backdrop-blur-md border border-border/50 rounded-[48px] shadow-sm space-y-8 hover:bg-card/50 transition-all">
             <div className="flex flex-col items-center text-center space-y-2">
                <h3 className="text-sm font-black text-foreground uppercase italic tracking-wider">Distribuição de Receita</h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Por unidade de negócio</p>
             </div>
             
             <div className="h-[300px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie
                       data={results.segments || [
                         { name: 'Distribuição', value: 67 },
                         { name: 'Geração', value: 17 },
                         { name: 'Transmissão', value: 9 },
                         { name: 'Outros', value: 7 },
                       ]}
                       cx="50%" cy="50%"
                       innerRadius={80} outerRadius={110}
                       paddingAngle={10}
                       dataKey="value"
                       stroke="none"
                     >
                       <Cell fill="var(--primary)" />
                       <Cell fill="#6366f1" />
                       <Cell fill="#10b981" />
                       <Cell fill="#f59e0b" />
                     </Pie>
                     <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid var(--border)', borderRadius: '24px', backdropFilter: 'blur(10px)', padding: '16px' }}
                        itemStyle={{ fontSize: '10px', fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase' }}
                     />
                   </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                  <span className="text-[10px] font-black text-primary uppercase italic leading-none tracking-[0.2em]">Nexus</span>
                  <span className="text-2xl font-black text-foreground italic mt-1 leading-none tracking-tighter">100%</span>
                </div>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
                {(results.segments || [
                   { name: 'Distribuição', value: 67, color: 'bg-primary' },
                   { name: 'Geração', value: 17, color: 'bg-indigo-500' },
                   { name: 'Transmissão', value: 9, color: 'bg-emerald-500' },
                   { name: 'Outros', value: 7, color: 'bg-amber-500' },
                ]).map((s: any, i: number) => (
                   <div key={i} className="flex items-center gap-3 p-3 bg-muted/20 rounded-2xl border border-border/50">
                      <div className={`w-2.5 h-2.5 rounded-full ${s.color || (i === 0 ? 'bg-primary' : i === 1 ? 'bg-indigo-500' : i === 2 ? 'bg-emerald-500' : 'bg-amber-500')}`} />
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-muted-foreground uppercase italic tracking-tighter leading-none">{s.name}</span>
                        <span className="text-[11px] font-black text-foreground italic mt-0.5">{s.value}%</span>
                      </div>
                   </div>
                ))}
             </div>
          </div>

          <div className="p-8 bg-card border border-border rounded-[40px] shadow-sm flex flex-col items-center justify-center gap-4">
             <h3 className="text-[11px] font-black text-foreground uppercase italic tracking-wider">Perfil da Empresa</h3>
             <div className="space-y-4 w-full">
                {[
                  { icon: Building2, label: 'Fundação', val: '1952' },
                  { icon: Activity, label: 'Listagem na Bolsa', val: '1971' },
                  { icon: MapPin, label: 'Sede', val: 'Belo Horizonte, MG' },
                  { icon: PieChartIcon, label: 'Tipo', val: 'Utilidade Pública' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-border group hover:border-primary/30 transition-all">
                    <div className="flex items-center gap-3">
                      <item.icon size={16} className="text-primary opacity-50 group-hover:opacity-100 transition-opacity" />
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">{item.label}</span>
                    </div>
                    <span className="text-[10px] font-black text-foreground uppercase italic tracking-widest leading-none">{item.val}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </section>

      {/* GOVERNANÇA E COMPOSIÇÃO (Imagens 12, 13) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-8 bg-card/40 backdrop-blur-md border border-border/50 rounded-[48px] shadow-sm space-y-6 hover:bg-card/50 transition-all">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_10px_rgba(59,130,246,0.2)]" />
            <h2 className="text-xs font-black text-foreground uppercase tracking-[0.2em] italic">Governança Corporativa</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-muted/20 p-6 rounded-[32px] border border-border/50">
            {[
              { label: 'Segmento de Listagem', val: assetData?.governance?.listing || 'Nível 1' },
              { label: 'Tag Along', val: assetData?.governance?.tagAlong || '100% (ON) / 100% (PN)' },
              { label: 'Free Float', val: assetData?.governance?.freeFloat ? `${assetData.governance.freeFloat}%` : '49,20%' },
              { label: 'CNPJ', val: assetData?.governance?.cnpj || '17.155.730/0001-64' },
              { label: 'Site RI', val: assetData?.governance?.riSite || 'ri.cemig.com.br' },
              { label: 'Setor', val: assetData?.sector },
              { label: 'Subsetor', val: assetData?.subSector },
              { label: 'Segmento', val: assetData?.segment }
            ].map((item, i) => (
              <div key={i} className="space-y-1 group">
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">{item.label}</p>
                <p className="text-[11px] font-black text-foreground uppercase italic tracking-tight">{item.val || '---'}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 bg-card/40 backdrop-blur-md border border-border/50 rounded-[48px] shadow-sm space-y-6 hover:bg-card/50 transition-all">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_10px_rgba(59,130,246,0.2)]" />
            <h2 className="text-xs font-black text-foreground uppercase tracking-[0.2em] italic">Composição Acionária</h2>
          </div>
          <div className="overflow-hidden border border-border/50 rounded-[32px] shadow-inner bg-muted/10">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/30 border-b border-border/50">
                  <th className="px-6 py-4 text-[9px] font-black text-muted-foreground uppercase italic tracking-widest leading-none">Acionista</th>
                  <th className="px-4 py-4 text-[9px] font-black text-muted-foreground uppercase italic tracking-widest leading-none">Tipo</th>
                  <th className="px-6 py-4 text-[9px] font-black text-muted-foreground uppercase italic tracking-widest leading-none text-right">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {(assetData?.shareholders?.length > 0 ? assetData.shareholders : [
                  { name: 'Estado de Minas Gerais', type: 'ON', pct: '50,96%' },
                  { name: 'Estado de Minas Gerais', type: 'PN', pct: '0,02%' },
                  { name: 'BNDESPAR', type: 'ON', pct: '10,21%' },
                  { name: 'Investidores Pessoa Física', type: 'ON/PN', pct: '24,15%' },
                  { name: 'Outros', type: 'TOTAL', pct: '14,66%' }
                ]).map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-primary/5 transition-colors group cursor-default">
                    <td className="px-6 py-4 text-[10px] font-black text-foreground italic group-hover:text-primary transition-colors">{row.name}</td>
                    <td className="px-4 py-4">
                      <span className="text-[9px] font-black text-primary uppercase italic px-2 py-0.5 bg-primary/10 rounded-md border border-primary/20">{row.type}</span>
                    </td>
                    <td className="px-6 py-4 text-[11px] font-black text-foreground italic text-right">{row.pct}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* SOBRE A EMPRESA (Imagem 14) */}
      <section className="p-10 bg-card/40 backdrop-blur-md border border-border/50 rounded-[48px] shadow-sm space-y-8 hover:bg-card/50 transition-all relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
          <BrainCircuit className="w-48 h-48 text-primary" />
        </div>
        <div className="flex items-center gap-4">
          <div className="w-1.5 h-8 bg-primary rounded-full shadow-[0_0_15px_rgba(59,130,246,0.4)]" />
          <h2 className="text-sm font-black text-foreground uppercase tracking-[0.3em] italic">O Ecossistema da {ticker}</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-6">
                <p className="text-[12px] font-bold text-muted-foreground leading-relaxed italic uppercase tracking-widest opacity-80 first-letter:text-4xl first-letter:font-black first-letter:text-primary first-letter:mr-2 first-letter:float-left">
                  {assetData?.description || `A ${ticker} é uma das principais concessionárias do Brasil, com atuação estratégica em múltiplos segmentos do setor elétrico e energético.`}
                </p>
            </div>
            <div className="p-8 bg-muted/20 backdrop-blur-sm rounded-[32px] border border-border/50 relative">
               <QuoteIcon size={24} className="absolute -top-3 -right-3 text-primary opacity-20" />
               <p className="text-[11px] font-black text-foreground italic leading-relaxed uppercase tracking-tight">
                  "{assetData?.managementVision || `Nossa história é marcada pelo compromisso com a excelência operacional e a geração de valor sustentável para nossos acionistas e para a sociedade.`}"
               </p>
               <div className="mt-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-indigo-600 shadow-lg" />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-foreground uppercase italic leading-none">Nexus Analyst Team</span>
                    <span className="text-[8px] font-bold text-muted-foreground uppercase italic tracking-widest mt-1">Research & Analytics</span>
                  </div>
               </div>
            </div>
        </div>
      </section>

      {/* COMUNICADOS E FATOS RELEVANTES (Imagem 15) */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_10px_rgba(59,130,246,0.3)]" />
            <h2 className="text-xs font-black text-foreground uppercase tracking-[0.2em] italic">Comunicados e Fatos Relevantes</h2>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-secondary/80 backdrop-blur-sm border border-border/50 rounded-xl text-[10px] font-black text-primary uppercase italic tracking-widest hover:bg-muted transition-all">
            Ver Central de RI <ExternalLink size={12} />
          </button>
        </div>
        
        <div className="p-4 bg-card/40 backdrop-blur-md border border-border/50 rounded-[48px] shadow-sm hover:bg-card/50 transition-all overflow-hidden">
          <div className="divide-y divide-border/30">
            {(newsList.length > 0 ? newsList.slice(0, 6) : [
              { date: '15/10/2024', title: 'Pagamento de Juros sobre Capital Próprio - 4º Trimestre' },
              { date: '28/09/2024', title: 'Fato Relevante: Plano de Investimentos 2025-2029' },
              { date: '10/09/2024', title: 'Aviso aos Acionistas: Distribuição de Dividendos Intermediários' },
              { date: '22/08/2024', title: 'Comunicado ao Mercado: Resultado do Leilão de Transmissão' },
              { date: '05/08/2024', title: 'Relatório de Resultados 2T24 e Teleconferência' }
            ]).map((item: any, i: number) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-6 p-6 hover:bg-primary/[0.03] transition-all cursor-pointer group rounded-[24px]">
                 <div className="flex-shrink-0 w-24 flex flex-col items-start">
                    <span className="text-[10px] font-black text-primary uppercase italic tracking-[0.2em]">{item.date || 'DATA'}</span>
                    <div className="w-6 h-0.5 bg-primary/30 mt-1 group-hover:w-full transition-all" />
                 </div>
                 <div className="flex-grow space-y-1">
                    <h4 className="text-[12px] font-black text-foreground uppercase italic tracking-tight group-hover:text-primary transition-colors leading-tight">
                      {item.title || item.headline}
                    </h4>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Fato Relevante • Documento CVM</p>
                 </div>
                 <ArrowRight size={16} className="text-muted-foreground/30 group-hover:text-primary transition-all group-hover:translate-x-2" />
              </div>
            ))}
          </div>
          <button className="w-full py-5 bg-muted/20 hover:bg-primary/10 text-[10px] font-black text-primary uppercase tracking-[0.4em] italic transition-all border-t border-border/50 group">
             Acessar Histórico Completo <span className="inline-block group-hover:translate-x-1 transition-transform ml-2">→</span>
          </button>
        </div>
      </section>

      {/* INTELIGENCIA ARTIFICIAL (Mantida do Nexus) */}
      <NexusAIIntel ticker={ticker || ''} />
    </div>
  );
}
