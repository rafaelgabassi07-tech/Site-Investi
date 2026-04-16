import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Info, 
  Globe, 
  BarChart2, 
  CheckCircle2, 
  XCircle, 
  Calendar,
  ShieldCheck,
  Zap,
  Building2,
  Wallet,
  Activity,
  PieChart,
  DollarSign
} from 'lucide-react';
import { motion } from 'motion/react';
import { financeService, AssetDetails, HistoryPoint } from '../services/financeService';
import { AssetIcon } from '../components/ui/AssetIcon';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const METRIC_LABELS: Record<string, string> = {
  precoAtual: 'Preço Atual',
  variacaoDay: 'Variação (Dia)',
  pl: 'P/L',
  pvp: 'P/VP',
  vpa: 'VPA',
  lpa: 'LPA',
  dy: 'Div. Yield',
  dividendYield: 'Div. Yield',
  marketCap: 'Valor de Mercado',
  valorMercado: 'Valor de Mercado',
  margemLiquida: 'Margem Líquida',
  margemBruta: 'Margem Bruta',
  roe: 'ROE',
  roa: 'ROA',
  dividaLiquidaEbitda: 'Dív. Líq / EBITDA',
  enterpriseValue: 'Enterprise Value',
  forwardPE: 'P/L Projetado',
  pegRatio: 'PEG Ratio',
  liquidezMediaDiaria: 'Liq. Média Diária',
  patrimonioLiquido: 'Patrimônio Líq.',
  valorPatrimonialCota: 'VPC',
  ultimoRendimento: 'Último Rend.',
  vacanciaFisica: 'Vacância Física',
  vacanciaFinanceira: 'Vacância Fin.',
  quantidadeAtivos: 'Qtd. Ativos',
  cagrReceita5Anos: 'CAGR Receita (5a)',
  cagrLucro5Anos: 'CAGR Lucro (5a)',
  numeroCotistas: 'Nº Cotistas',
  segmentoListagem: 'Segmento Listagem',
  tagAlong: 'Tag Along',
  freeFloat: 'Free Float',
  payout: 'Payout',
  tipoGestao: 'Tipo de Gestão',
  taxaAdmin: 'Taxa Admin.',
  receitaLiquida: 'Receita Líq.',
  ebitda: 'EBITDA',
  lucroLiquido: 'Lucro Líq.',
  p_vp: 'P/VP',
  p_l: 'P/L',
  vpa_val: 'VPA',
  lpa_val: 'LPA',
  margem_liquida: 'Margem Líq.',
  margem_ebit: 'Margem EBIT',
  divida_liquida_ebitda: 'Dív.Líq/EBITDA',
  divida_liquida_patrimonio: 'Dív.Líq/Patrimônio',
  psr: 'PSR',
  p_ativo: 'P/Ativo',
  p_cap_giro: 'P/Cap. Giro',
  p_ebit: 'P/EBIT',
  ev_ebitda: 'EV/EBITDA',
  ev_ebit: 'EV/EBIT',
  roic: 'ROIC',
  giro_ativos: 'Giro Ativos',
  liquidez_corrente: 'Liq. Corrente'
};

const formatMetricValue = (key: string, value: any) => {
  if (value == null || value === '' || value === '-') return '---';
  const strVal = String(value);
  
  if (strVal.includes('%') || strVal.includes('R$')) return strVal;

  if (['marketCap', 'valorMercado', 'patrimonioLiquido', 'enterpriseValue', 'liquidezMediaDiaria', 'receitaLiquida', 'ebitda', 'lucroLiquido'].includes(key)) {
    const num = Number(value);
    if (!isNaN(num)) {
      if (num >= 1e9) return `R$ ${(num / 1e9).toFixed(2)}B`;
      if (num >= 1e6) return `R$ ${(num / 1e6).toFixed(2)}M`;
      return `R$ ${num.toLocaleString('pt-BR')}`;
    }
  }

  if (['precoAtual', 'vpa', 'lpa', 'ultimoRendimento', 'valorPatrimonialCota', 'vpa_val', 'lpa_val'].includes(key)) {
    const num = Number(value);
    if (!isNaN(num)) return `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  }

  if (['pl', 'pvp', 'p_vp', 'p_l', 'roe', 'roa', 'roic', 'margemLiquida', 'margemBruta', 'dy', 'dividendYield', 'margem_liquida', 'divida_liquida_ebitda', 'margemEbit', 'cagrReceita5Anos', 'cagrLucro5Anos', 'vacanciaFisica', 'vacanciaFinanceira', 'tagAlong', 'freeFloat', 'payout'].includes(key)) {
    const num = Number(value);
    if (!isNaN(num)) {
      if (['roe', 'roa', 'roic', 'margemLiquida', 'margemBruta', 'dy', 'dividendYield', 'margem_liquida', 'margemEbit', 'cagrReceita5Anos', 'cagrLucro5Anos', 'vacanciaFisica', 'vacanciaFinanceira', 'tagAlong', 'freeFloat', 'payout'].includes(key)) {
        return `${num.toFixed(2)}%`;
      }
      return num.toFixed(2);
    }
  }

  return strVal;
};

export default function AssetAnalysis() {
  const { ticker } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const assetType = queryParams.get('type') || 'ACAO';

  const [assetDetails, setAssetDetails] = useState<AssetDetails | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ticker) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [details, hist] = await Promise.all([
          financeService.getAssetDetails(ticker, assetType),
          financeService.getAssetHistory(ticker, '1y')
        ]);
        setAssetDetails(details);
        setHistory(hist);
      } catch (error) {
        console.error('Erro ao buscar detalhes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [ticker, assetType]);

  const checklist = useMemo(() => {
    if (!assetDetails) return [];
    const res = assetDetails.results || {};
    const items = [];
    
    const dy = parseFloat(String(res.dy || res.dividendYield || '0').replace('%', '').replace(',', '.'));
    const pvp = parseFloat(String(res.pvp || res.p_vp || '0').replace(',', '.'));
    const roe = parseFloat(String(res.roe || '0').replace('%', '').replace(',', '.'));
    const pl = parseFloat(String(res.pl || res.p_l || '0').replace(',', '.'));
    const cagr = parseFloat(String(res.cagrReceita5Anos || '0').replace('%', '').replace(',', '.'));
    const liqStr = String(res.liquidezMediaDiaria || res.liquidezDiaria || '0');
    let liq = 0;
    if (liqStr.toLowerCase().includes('m')) liq = parseFloat(liqStr.replace(/[^\d,.-]/g, '').replace(',', '.')) * 1000000;
    else if (liqStr.toLowerCase().includes('b')) liq = parseFloat(liqStr.replace(/[^\d,.-]/g, '').replace(',', '.')) * 1000000000;
    else if (liqStr.toLowerCase().includes('k')) liq = parseFloat(liqStr.replace(/[^\d,.-]/g, '').replace(',', '.')) * 1000;
    else liq = parseFloat(liqStr.replace(/[^\d,.-]/g, '').replace(',', '.'));
    
    const vacancia = parseFloat(String(res.vacanciaFisica || '0').replace('%', '').replace(',', '.'));
    const qtdAtivos = parseFloat(String(res.quantidadeAtivos || '0').replace(',', '.'));

    if (dy > 6) items.push({ label: 'Dividend Yield > 6%', ok: true });
    else if (dy > 0) items.push({ label: 'Dividend Yield > 6%', ok: false });

    if (pvp > 0 && pvp < 1.5) items.push({ label: 'P/VP < 1.5', ok: true });
    else if (pvp > 0) items.push({ label: 'P/VP < 1.5', ok: false });

    if (roe > 10) items.push({ label: 'ROE > 10%', ok: true });
    else if (roe > 0) items.push({ label: 'ROE > 10%', ok: false });

    if (pl > 0 && pl < 15) items.push({ label: 'P/L < 15', ok: true });
    else if (pl > 0) items.push({ label: 'P/L < 15', ok: false });

    if (cagr > 0) items.push({ label: 'Crescimento (CAGR) > 0', ok: true });
    else if (res.cagrReceita5Anos) items.push({ label: 'Crescimento (CAGR) > 0', ok: false });

    if (liq >= 1000000) items.push({ label: 'Boa Liquidez (> 1M)', ok: true });
    else if (res.liquidezMediaDiaria || res.liquidezDiaria) items.push({ label: 'Boa Liquidez (> 1M)', ok: false });

    if (res.quantidadeAtivos) {
      if (qtdAtivos > 1) items.push({ label: 'Multi-Ativo (FII)', ok: true });
      else items.push({ label: 'Multi-Ativo (FII)', ok: false });
    }

    if (res.vacanciaFisica) {
      if (vacancia < 10) items.push({ label: 'Vacância Baixa (< 10%)', ok: true });
      else items.push({ label: 'Vacância Baixa (< 10%)', ok: false });
    }

    return items;
  }, [assetDetails]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#020617] p-6">
        <div className="relative mb-8">
          <div className="w-24 h-24 border-[1px] border-blue-500/20 rounded-full animate-[spin_3s_linear_infinite]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 border-t-2 border-blue-500 rounded-full animate-spin" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Activity className="icon-xl text-blue-500 animate-pulse" />
          </div>
        </div>
        <h2 className="text-2xl font-display font-bold text-white tracking-tighter uppercase">Nexus Intelligence</h2>
        <p className="text-slate-500 text-xs mt-3 font-black uppercase tracking-[0.3em] animate-pulse">Sincronizando Ativo: {ticker}</p>
      </div>
    );
  }

  if (!assetDetails) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#020617] p-6 text-center">
        <div className="w-20 h-20 bg-red-500/5 rounded-3xl flex items-center justify-center text-red-500 mb-8 border border-red-500/10">
          <Info className="icon-2xl" />
        </div>
        <h2 className="text-3xl font-display font-bold text-white mb-3 tracking-tighter uppercase">Ativo não encontrado</h2>
        <p className="text-slate-400 mb-10 max-w-md font-medium">Não conseguimos localizar os dados para <span className="text-white font-bold">{ticker}</span>. Verifique se o código está correto ou tente novamente mais tarde.</p>
        <button 
          onClick={() => navigate(-1)}
          className="btn-primary"
        >
          <ArrowLeft className="icon-sm" />
          Voltar ao Portfolio
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] pb-32">
      {/* Header Imersivo */}
      <header className="sticky top-0 z-[100] bg-[#020617]/80 backdrop-blur-2xl border-b border-white/5">
        <div className="w-full px-4 md:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate(-1)}
              className="group flex items-center gap-3 text-slate-400 hover:text-white transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-white/20 transition-all">
                <ArrowLeft className="icon-md" />
              </div>
              <span className="text-label hidden sm:block">Voltar</span>
            </button>
            
            <div className="h-8 w-px bg-white/10 hidden sm:block" />
            
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500 border border-blue-500/20">
                <BarChart2 className="icon-md" />
              </div>
              <div>
                <h1 className="text-sm font-black text-white uppercase tracking-widest">Análise Profunda</h1>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Nexus Engine v2.5.1</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[9px] font-black text-emerald-500/80 uppercase tracking-widest">Live Market Data</span>
            </div>
            
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 bg-white/5 hover:bg-red-500/10 text-slate-400 hover:text-red-500 rounded-xl transition-all border border-white/10 flex items-center justify-center"
              title="Fechar"
            >
              <XCircle className="icon-md" />
            </button>
          </div>
        </div>
      </header>

      <main className="w-full px-4 md:px-8 py-12 space-y-12">
        {/* Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-8 space-y-8"
          >
            {/* Asset Identity Card */}
            <div className="relative p-8 md:p-12 bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] border border-white/5 overflow-hidden group">
              <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 blur-[120px] -z-10 rounded-full" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-600/5 blur-[100px] -z-10 rounded-full" />
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex items-center gap-8">
                  <div className="relative">
                    <AssetIcon assetType={assetDetails.assetType || 'ACAO'} ticker={assetDetails.ticker} className="w-24 h-24 md:w-32 md:h-32 shadow-2xl rounded-3xl" />
                    <div className="absolute -bottom-2 -right-2 px-3 py-1 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-xl border border-blue-400/30">
                      {assetDetails.assetType || 'ATIVO'}
                    </div>
                  </div>
                  <div>
                    <h2 className="text-5xl md:text-7xl font-display font-bold text-white tracking-tighter leading-none mb-2">
                      {assetDetails.ticker}
                    </h2>
                    <p className="text-slate-400 font-medium text-lg md:text-xl tracking-tight max-w-md">
                      {assetDetails.results.name || 'Empresa Selecionada'}
                    </p>
                  </div>
                </div>

                <div className="text-left md:text-right space-y-1">
                  <p className="text-label">Cotação Atual</p>
                  <p className="text-5xl md:text-6xl font-display font-bold text-white tracking-tighter">
                    {formatMetricValue('precoAtual', assetDetails.results.precoAtual)}
                  </p>
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black tracking-widest uppercase ${String(assetDetails.results.variacaoDay).includes('-') ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    {String(assetDetails.results.variacaoDay).includes('-') ? <TrendingDown className="icon-sm" /> : <TrendingUp className="icon-sm" />}
                    {assetDetails.results.variacaoDay || '0,00%'}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Chart Card */}
            <div className="p-8 bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] border border-white/5">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500">
                    <Activity className="icon-md" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-widest">Performance Histórica</h4>
                    <p className="text-label">Janela de 12 Meses</p>
                  </div>
                </div>
                
                <div className="flex gap-1 bg-white/5 p-1 rounded-2xl border border-white/5">
                  {['1M', '6M', '1Y', 'MAX'].map(p => (
                    <button 
                      key={p} 
                      className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${p === '1Y' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-[400px] w-full">
                {history.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history}>
                      <defs>
                        <linearGradient id="nexusChartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        hide 
                      />
                      <YAxis 
                        domain={['auto', 'auto']} 
                        orientation="right"
                        tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `R$ ${v}`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                          backdropFilter: 'blur(16px)',
                          border: '1px solid rgba(255,255,255,0.1)', 
                          borderRadius: '20px', 
                          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' 
                        }}
                        itemStyle={{ color: '#fff', fontWeight: 'bold', fontSize: '14px' }}
                        labelStyle={{ color: '#94a3b8', fontSize: '10px', fontWeight: '900', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                        formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`, 'FECHAMENTO']}
                        labelFormatter={(label) => new Date(label).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="close" 
                        stroke="#3b82f6" 
                        strokeWidth={4}
                        fillOpacity={1} 
                        fill="url(#nexusChartGradient)" 
                        animationDuration={2500}
                        activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 border border-dashed border-white/5 rounded-3xl bg-white/[0.02]">
                    <BarChart2 size={48} className="mb-4 opacity-20" />
                    <p className="text-sm font-bold uppercase tracking-widest opacity-40 italic">Dados históricos indisponíveis</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Sidebar: Checklist & Quick Stats */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-4 space-y-8"
          >
            {/* Quality Score Card */}
            <div className="p-8 bg-blue-600/5 backdrop-blur-xl rounded-[2.5rem] border border-blue-500/10 shadow-2xl shadow-blue-900/10">
              <div className="flex items-center justify-between mb-8">
                <h4 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
                  <ShieldCheck className="icon-md text-blue-500" /> Nexus Score
                </h4>
                <div className="px-3 py-1 bg-blue-600 rounded-lg text-[10px] font-black text-white uppercase tracking-widest">
                  {Math.round((checklist.filter(i => i.ok).length / checklist.length) * 100)}%
                </div>
              </div>
              
              <div className="space-y-3">
                {checklist.map((item, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + (i * 0.05) }}
                    key={i} 
                    className="flex items-center justify-between p-4 bg-slate-900/60 rounded-2xl border border-white/5 group hover:border-blue-500/30 transition-all"
                  >
                    <span className="text-xs font-bold text-slate-400 group-hover:text-slate-200 transition-colors">{item.label}</span>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${item.ok ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                      {item.ok ? <CheckCircle2 className="icon-sm" /> : <XCircle className="icon-sm" />}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Sector & Segment Card */}
            <div className="p-8 bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] border border-white/5">
              <h4 className="text-label mb-8">Classificação de Mercado</h4>
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-400">
                    <Building2 className="icon-sm" />
                  </div>
                  <div>
                    <p className="text-label mb-1">Setor de Atuação</p>
                    <p className="text-base font-bold text-slate-200 tracking-tight">{assetDetails.results.sector || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-400">
                    <PieChart className="icon-sm" />
                  </div>
                  <div>
                    <p className="text-label mb-1">Subsetor / Segmento</p>
                    <p className="text-base font-bold text-slate-200 tracking-tight">{assetDetails.results.subSector || 'N/A'}</p>
                  </div>
                </div>
                {assetDetails.results.segmentoListagem && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-400">
                      <ShieldCheck className="icon-sm" />
                    </div>
                    <div>
                      <p className="text-label mb-1">Nível de Governança</p>
                      <p className="text-base font-bold text-slate-200 tracking-tight">{assetDetails.results.segmentoListagem}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* About Card */}
            {assetDetails.results.about && (
              <div className="p-8 bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] border border-white/5">
                <h4 className="text-label mb-6 flex items-center gap-2">
                  <Info className="icon-sm text-blue-500" /> Perfil Corporativo
                </h4>
                <p className="text-sm text-slate-400 leading-relaxed font-medium italic">
                  "{assetDetails.results.about}"
                </p>
              </div>
            )}
          </motion.div>
        </section>

        {/* Indicators Grid */}
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
            <h3 className="text-lg font-display font-bold text-white tracking-tighter uppercase">Indicadores Fundamentais</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {['pl', 'pvp', 'dy', 'vpa', 'lpa', 'roe', 'roic', 'margemLiquida', 'vacanciaFisica', 'vacanciaFinanceira', 'quantidadeAtivos', 'numeroCotistas'].map((key, idx) => {
              const val = assetDetails.results[key];
              if (val === undefined || val === null) return null;
              return (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + (idx * 0.05) }}
                  key={key} 
                  className="p-6 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl hover:border-blue-500/30 transition-all group"
                >
                  <p className="text-[9px] font-black text-slate-500 uppercase mb-3 tracking-widest group-hover:text-blue-400 transition-colors">{METRIC_LABELS[key] || key}</p>
                  <p className="text-2xl font-display font-bold text-white tracking-tighter">{formatMetricValue(key, val)}</p>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Financial Results */}
        {(assetDetails.results.receitaLiquida || assetDetails.results.ebitda || assetDetails.results.lucroLiquido) && (
          <section className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-6 bg-emerald-600 rounded-full" />
              <h3 className="text-lg font-display font-bold text-white tracking-tighter uppercase">Resultados Financeiros</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { key: 'receitaLiquida', icon: DollarSign, color: 'text-blue-500' },
                { key: 'ebitda', icon: Zap, color: 'text-amber-500' },
                { key: 'lucroLiquido', icon: Wallet, color: 'text-emerald-500' }
              ].map((item, idx) => {
                const val = assetDetails.results[item.key];
                if (!val) return null;
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + (idx * 0.1) }}
                    key={item.key} 
                    className="p-10 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] relative overflow-hidden group"
                  >
                    <div className={`absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity ${item.color}`}>
                      <item.icon className="icon-3xl" />
                    </div>
                    <p className="text-label mb-4">{METRIC_LABELS[item.key] || item.key}</p>
                    <p className="text-4xl font-display font-bold text-white tracking-tighter">{formatMetricValue(item.key, val)}</p>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}

        {/* Dividends */}
        {assetDetails.results.dividendos && assetDetails.results.dividendos.length > 0 && (
          <section className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
              <h3 className="text-lg font-display font-bold text-white tracking-tighter uppercase">Histórico de Proventos</h3>
            </div>
            
            <div className="overflow-hidden border border-white/5 rounded-[2.5rem] bg-slate-900/40 backdrop-blur-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 border-b border-white/5">
                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Data Com</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Pagamento</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Tipo</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {assetDetails.results.dividendos.map((div: any, i: number) => (
                    <tr key={i} className="hover:bg-white/[0.02] transition-all group">
                      <td className="px-8 py-6 text-sm font-bold text-slate-300 group-hover:text-white transition-colors">{div.dataCom}</td>
                      <td className="px-8 py-6 text-sm font-bold text-slate-300 group-hover:text-white transition-colors">{div.pagamento}</td>
                      <td className="px-8 py-6">
                        <span className="px-2 py-1 bg-white/5 rounded text-[9px] font-black text-slate-500 uppercase tracking-widest group-hover:text-blue-400 transition-colors">
                          {div.tipo}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-base font-black text-white text-right font-mono">{div.valor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
      
      {/* Footer Imersivo */}
      <footer className="w-full px-4 md:px-8 mt-12">
        <div className="p-12 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.8)]" />
            <div>
              <p className="text-xs font-black text-white uppercase tracking-widest mb-1">Nexus Intelligence Engine</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sincronização Ativa • v2.5.1 • {new Date().toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/portfolio/lancamentos')}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all shadow-xl shadow-blue-600/20 active:scale-95"
            >
              Nova Operação
            </button>
            <button 
              onClick={() => navigate(-1)}
              className="px-8 py-4 bg-white/5 border border-white/10 text-slate-400 hover:text-white font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all active:scale-95"
            >
              Fechar Análise
            </button>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.5em]">
            As informações apresentadas não constituem recomendação de investimento.
          </p>
        </div>
      </footer>
    </div>
  );
}
