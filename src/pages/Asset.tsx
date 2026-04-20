import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, Info, Star, Activity, Loader2, Calendar, CheckCircle2, XCircle, AlertCircle, Users, ArrowRight, Newspaper, Building2, Wallet, BarChart3, ShieldCheck, Zap, PieChart, DollarSign } from 'lucide-react';
import { AssetIcon } from '../components/ui/AssetIcon';
import { financeService, AssetDetails, HistoryPoint } from '../services/financeService';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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
  const [error, setError] = useState<string | null>(null);
  const [activePeriod, setActivePeriod] = useState('1y');

  const [isFavorite, setIsFavorite] = useState(false);

  const handleGoBack = () => {
    if (window.history.length > 2 || (window.history.state && window.history.state.idx > 0)) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  useEffect(() => {
    if (!ticker) return;
    const favorites = JSON.parse(localStorage.getItem('nexus_favorites') || '[]');
    setIsFavorite(favorites.includes(ticker));

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [details, hist, divs, peerData] = await Promise.all([
          financeService.getAssetDetails(ticker),
          financeService.getAssetHistory(ticker, activePeriod),
          financeService.getAssetDividends(ticker),
          financeService.getPeers(ticker)
        ]);
        setAssetData(details);
        setHistory(hist);
        setDividends(divs);
        setPeers(peerData);
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
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8 max-w-5xl mx-auto">
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Zap className="icon-lg text-blue-500 animate-pulse" />
          </div>
        </div>
        <div className="text-center space-y-3">
          <h2 className="text-display-md text-foreground animate-pulse">Analisando {ticker}</h2>
          <p className="text-label text-muted-foreground uppercase tracking-widest animate-pulse">Processando dados em tempo real...</p>
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
  const isPositive = results.variacaoDay && typeof results.variacaoDay === 'string' 
    ? !results.variacaoDay.startsWith('-') 
    : true;

  const indicators = [
    { label: 'Dividend Yield', value: results.dividendYield || results.dy || 'N/A', icon: Wallet, color: 'emerald', desc: 'Rendimento de Dividendos' },
    { label: 'P/L', value: results.pl || results.p_l || 'N/A', icon: BarChart3, color: 'blue', desc: 'Preço sobre Lucro' },
    { label: 'P/VP', value: results.pvp || results.p_vp || 'N/A', icon: TrendingUp, color: 'indigo', desc: 'Preço sobre Valor Patr.' },
    { label: 'Valor de Merc.', value: formatCompactNumber(results.marketCap || results.valorMercado), icon: DollarSign, color: 'emerald', desc: 'Market Capitalization' },
    { label: 'Patr. Líquido', value: formatCompactNumber(results.equity || results.patrimonioLiquido), icon: Building2, color: 'blue', desc: 'Patrimônio da Empresa' },
    { label: 'ROE', value: results.roe || 'N/A', icon: Activity, color: 'purple', desc: 'Retorno sobre Patrimônio' },
    { label: 'ROA', value: results.roa || 'N/A', icon: Activity, color: 'cyan', desc: 'Retorno sobre Ativos' },
    { label: 'VPA', value: results.vpa || results.vpa_val || 'N/A', icon: Building2, color: 'cyan', desc: 'Valor Patr. por Ação' },
    { label: 'LPA', value: results.lpa || results.lpa_val || 'N/A', icon: TrendingUp, color: 'emerald', desc: 'Lucro por Ação' },
    { label: 'Margem Líq.', value: results.margemLiquida || results.margem_liquida || 'N/A', icon: ShieldCheck, color: 'blue', desc: 'Eficiência de Lucro' },
    { label: 'Margem EBIT', value: results.margemEbit || results.margem_ebit || 'N/A', icon: ShieldCheck, color: 'indigo', desc: 'Eficiência Operacional' },
    { label: 'Dívida/EBITDA', value: results.dividaLiquidaEbitda || results.divida_liquida_ebitda || 'N/A', icon: Zap, color: 'red', desc: 'Alavancagem' },
  ];

  if (results.liquidezMediaDiaria || results.liquidezDiaria) {
    indicators.push({ label: 'Liq. Diária', value: formatCompactNumber(results.liquidezMediaDiaria || results.liquidezDiaria), icon: Activity, color: 'cyan', desc: 'Liquidez Média Diária' });
  }
  if (results.tagAlong) {
    indicators.push({ label: 'Tag Along', value: results.tagAlong, icon: ShieldCheck, color: 'emerald', desc: 'Proteção ao Minoritário' });
  }
  if (results.freeFloat) {
    indicators.push({ label: 'Free Float', value: results.freeFloat, icon: PieChart, color: 'blue', desc: 'Ações em Circulação' });
  }
  if (results.payout) {
    indicators.push({ label: 'Payout', value: results.payout, icon: Wallet, color: 'purple', desc: 'Lucro Distribuído' });
  }
  if (results.vacanciaFisica) {
    indicators.push({ label: 'Vacância Fís.', value: results.vacanciaFisica, icon: Building2, color: 'red', desc: 'Imóveis Vagos' });
  }
  if (results.vacanciaFinanceira) {
    indicators.push({ label: 'Vacância Fin.', value: results.vacanciaFinanceira, icon: DollarSign, color: 'red', desc: 'Receita Não Realizada' });
  }
  if (results.quantidadeAtivos) {
    indicators.push({ label: 'Qtd. Ativos', value: results.quantidadeAtivos, icon: Building2, color: 'indigo', desc: 'Número de Imóveis' });
  }
  if (results.taxaAdmin) {
    indicators.push({ label: 'Taxa Admin.', value: results.taxaAdmin, icon: Zap, color: 'red', desc: 'Taxa de Administração' });
  }

  // Filter out N/A indicators to keep the UI clean
  const validIndicators = indicators.filter(ind => ind.value !== 'N/A' && ind.value != null);

  const checklistItems = [
    { label: 'P/L abaixo de 15', check: () => {
      const val = parseFinanceValue(results.pl || results.p_l);
      return val > 0 && val < 15;
    }},
    { label: 'P/VP abaixo de 2.0', check: () => {
      const val = parseFinanceValue(results.pvp || results.p_vp);
      return val > 0 && val < 2;
    }},
    { label: 'Dividend Yield > 6%', check: () => {
      const val = parseFinanceValue(results.dividendYield || results.dy);
      return val >= 6;
    }},
    { label: 'ROE acima de 10%', check: () => {
      const val = parseFinanceValue(results.roe);
      return val >= 10;
    }},
    { label: 'Margem Líquida > 10%', check: () => {
      const val = parseFinanceValue(results.margemLiquida || results.margem_liquida);
      return val >= 10;
    }},
    { label: 'Dívida Controlada', check: () => {
      const val = parseFinanceValue(results.dividaLiquidaEbitda || results.divida_liquida_ebitda);
      return val > 0 && val < 3;
    }},
    { label: 'Crescimento (CAGR) > 0', check: () => {
      const val = parseFinanceValue(results.cagrReceita5Anos);
      return val > 0;
    }},
    { label: 'Boa Liquidez (> 1M)', check: () => {
      const val = parseFinanceValue(results.liquidezMediaDiaria || results.liquidezDiaria);
      return val >= 1000000;
    }},
    { label: 'Multi-Ativo (FII)', check: () => {
      if (!results.quantidadeAtivos) return null;
      const val = parseFinanceValue(results.quantidadeAtivos);
      return val > 1;
    }},
    { label: 'Vacância Baixa (< 10%)', check: () => {
      if (!results.vacanciaFisica) return null;
      const val = parseFinanceValue(results.vacanciaFisica);
      return val < 10;
    }},
  ].filter(item => item.check() !== null);

  return (
    <div className="space-y-3 pb-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 pt-4 px-1 md:px-0">
        <button onClick={handleGoBack} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-muted transition-colors border border-border">
          <ArrowLeft className="text-muted-foreground icon-sm" />
        </button>
        <div className="flex-1 flex items-center justify-between">
              <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-card flex items-center justify-center p-2 shadow-sm border border-border shrink-0">
              <AssetIcon assetType={(assetData as any).type || "ACAO"} ticker={assetData.ticker} className="w-full h-full" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-display-md text-foreground">{assetData.ticker}</h1>
                <span className="px-2 py-0.5 bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-widest rounded border border-primary/10">
                  {(assetData as any).type || "Ativo"}
                </span>
              </div>
              <p className="text-label text-muted-foreground uppercase">{results.name || 'Empresa'}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link 
              to="/portfolio"
              className="btn-primary h-12 px-6"
            >
              + Carteira
            </Link>
            <button 
              onClick={toggleFavorite}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all border group ${isFavorite ? 'bg-amber-500/5 border-amber-500/20 text-amber-600' : 'bg-secondary border-border hover:bg-muted'}`}
            >
              <Star className={`icon-md ${isFavorite ? 'fill-amber-500' : 'text-muted-foreground group-hover:text-amber-500 transition-colors'}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="px-1 md:px-0 grid grid-cols-1 lg:grid-cols-3 gap-2 md:gap-3">
        {/* Left Column: Price & Chart */}
        <div className="lg:col-span-2 space-y-6">
          <div className="relative border-b border-border pb-6">
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
              <div>
                <div className="text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-widest">Cotação Atual</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-display-lg text-foreground tracking-tight">
                    {typeof results.precoAtual === 'number' ? formatNumber(results.precoAtual, { style: 'currency' }) : results.precoAtual || '0,00'}
                  </span>
                  <div className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                    {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {results.variacaoDay || '0.00%'}
                  </div>
                </div>
              </div>

              <div className="flex items-center p-1 bg-secondary border border-border rounded-xl">
                {['1mo', '3mo', '6mo', '1y', '5y'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setActivePeriod(p)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                      activePeriod === p 
                        ? 'bg-primary text-white shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Chart */}
            <div className="h-[250px] md:h-[350px] w-full -mx-4 md:mx-0 relative">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-blue-500/[0.02] to-transparent pointer-events-none rounded-xl md:rounded-2xl" />
              {history.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0.3}/>
                        <stop offset="60%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0.1}/>
                        <stop offset="100%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0}/>
                      </linearGradient>
                      <filter id="chartGlowPremium" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="8" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="0" vertical={false} stroke="rgba(0,0,0,0.05)" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'var(--muted-foreground)', fontSize: 10, fontWeight: 600 }} 
                      tickFormatter={(val) => new Date(val).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' })}
                      minTickGap={60}
                      dy={10}
                    />
                    <YAxis 
                      hide 
                      domain={['auto', 'auto']} 
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-popover border border-border p-3 rounded-lg shadow-xl">
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                                {new Date(payload[0].payload.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </p>
                              <p className="text-sm font-bold text-foreground">
                                {formatNumber(payload[0].value, { style: 'currency' })}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="close" 
                      stroke={isPositive ? "#10b981" : "#ef4444"} 
                      fillOpacity={1} 
                      fill="url(#colorPrice)" 
                      strokeWidth={3} 
                      filter="url(#chartGlowPremium)"
                      animationDuration={2000}
                      animationEasing="ease-in-out"
                      activeDot={{ 
                        r: 6, 
                        stroke: isPositive ? '#10b981' : '#ef4444', 
                        strokeWidth: 3, 
                        fill: '#fff',
                        className: 'animate-pulse' 
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center bg-white/[0.01] rounded-xl md:rounded-2xl border border-dashed border-white/5">
                  <p className="text-slate-700 text-[10px] font-black uppercase tracking-[0.3em] italic opacity-40">Motor Nexus aguardando telemetria...</p>
                </div>
              )}
            </div>
          </div>

          {/* AI Intelligence Section */}
          <NexusAIIntel ticker={ticker!} assetData={assetData} history={history} />

          {/* Indicators Grid - Cleaner, No Containers */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 border-t border-border mt-8">
            {validIndicators.map((ind, idx) => (
              <motion.div 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.02 }}
                key={idx} 
                className={`py-6 px-4 group border-b border-border relative hover:bg-secondary transition-colors ${idx % 2 === 0 ? 'border-r md:border-r' : 'md:border-r'} ${idx % 4 === 3 ? 'md:border-r-0' : ''}`}
              >
                <div className="flex items-center gap-2 mb-2 opacity-60 group-hover:opacity-100 transition-opacity">
                  <ind.icon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{ind.label}</span>
                </div>
                <div className="text-lg font-bold text-foreground tracking-tight">{ind.value}</div>
                <div className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">{ind.desc}</div>
              </motion.div>
            ))}
          </div>

          {/* About Section */}
          <div className="pb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10 shadow-sm">
                <Info className="w-5 h-5" />
              </div>
              <h2 className="text-xs font-bold text-foreground uppercase tracking-widest">Sobre a {results.name || ticker}</h2>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed font-medium">
              {results.about || `A ${results.name || ticker} é uma das principais empresas do seu setor, com forte presença no mercado brasileiro.`}
            </p>
          </div>
        </div>

        {/* Right Column: Checklist & News */}
        <div className="space-y-8 lg:border-l lg:border-border lg:pl-8">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
              <h2 className="text-[11px] font-bold text-foreground uppercase tracking-widest">Checklist Nexus</h2>
            </div>
            <div className="divide-y divide-border">
              {checklistItems.map((item, idx) => {
                const passed = item.check();
                return (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.03 }}
                    key={idx} 
                    className="flex items-center justify-between py-4 hover:bg-secondary transition-all group px-2 -mx-2 rounded-lg"
                  >
                    <span className="text-[10px] font-bold text-muted-foreground group-hover:text-foreground uppercase tracking-widest transition-colors">{item.label}</span>
                    <div className="flex items-center gap-3">
                      <span className={`text-[8px] font-bold tracking-widest uppercase transition-opacity ${passed ? 'text-emerald-600' : 'text-muted-foreground opacity-50 group-hover:opacity-100'}`}>
                        {passed ? 'APROVADO' : 'REVISAR'}
                      </span>
                      {passed ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-muted-foreground border border-border">
                          <AlertCircle className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Dividends Summary */}
          {dividends.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-primary rounded-full" />
                  <h2 className="text-[11px] font-bold text-foreground uppercase tracking-widest">Proventos</h2>
                </div>
              </div>
              <div className="divide-y divide-border">
                {dividends.slice(0, 5).map((div, idx) => (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.03 }}
                    key={idx} 
                    className="flex items-center justify-between py-5 hover:bg-secondary transition-all group px-2 -mx-2 rounded-lg"
                  >
                    <div>
                      <div className="text-base font-bold text-foreground group-hover:text-primary transition-colors uppercase tracking-tight leading-none mb-1.5">R$ {div.amount.toFixed(3)}</div>
                      <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{new Date(div.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                    </div>
                    <span className="px-2.5 py-1 bg-secondary text-muted-foreground text-[9px] font-bold uppercase rounded-md border border-border group-hover:border-emerald-500/20 group-hover:text-emerald-600 transition-all">EFETIVADO</span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
