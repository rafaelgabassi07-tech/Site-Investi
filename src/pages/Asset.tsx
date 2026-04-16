import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, Info, Star, Activity, Loader2, Calendar, CheckCircle2, XCircle, AlertCircle, Users, ArrowRight, Newspaper, Building2, Wallet, BarChart3, ShieldCheck, Zap, PieChart, DollarSign } from 'lucide-react';
import { AssetIcon } from '../components/ui/AssetIcon';
import { financeService, AssetDetails, HistoryPoint } from '../services/financeService';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { parseFinanceValue } from '../lib/utils';

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
            <Zap className="w-8 h-8 text-blue-500 animate-pulse" />
          </div>
        </div>
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter animate-pulse">Analisando {ticker}</h2>
          <p className="text-slate-400 font-medium max-w-xs mx-auto text-sm">Processando dados em tempo real...</p>
        </div>
      </div>
    );
  }

  if (error || !assetData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
          <Info className="text-red-500" size={32} />
        </div>
        <h2 className="text-xl font-bold text-white">Ops! Algo deu errado</h2>
        <p className="text-slate-400 max-w-xs">{error || 'Não foi possível encontrar este ativo.'}</p>
        <button onClick={() => navigate(-1)} className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-full transition-colors">Voltar</button>
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
    { label: 'ROE', value: results.roe || 'N/A', icon: Activity, color: 'purple', desc: 'Retorno sobre Patrimônio' },
    { label: 'ROA', value: results.roa || 'N/A', icon: Activity, color: 'cyan', desc: 'Retorno sobre Ativos' },
    { label: 'VPA', value: results.vpa || results.vpa_val || 'N/A', icon: Building2, color: 'cyan', desc: 'Valor Patr. por Ação' },
    { label: 'LPA', value: results.lpa || results.lpa_val || 'N/A', icon: TrendingUp, color: 'emerald', desc: 'Lucro por Ação' },
    { label: 'Margem Líq.', value: results.margemLiquida || results.margem_liquida || 'N/A', icon: ShieldCheck, color: 'blue', desc: 'Eficiência de Lucro' },
    { label: 'Margem EBIT', value: results.margemEbit || results.margem_ebit || 'N/A', icon: ShieldCheck, color: 'indigo', desc: 'Eficiência Operacional' },
    { label: 'Dívida/EBITDA', value: results.dividaLiquidaEbitda || results.divida_liquida_ebitda || 'N/A', icon: Zap, color: 'red', desc: 'Alavancagem' },
    { label: 'CAGR Receita', value: results.cagrReceita5Anos || 'N/A', icon: TrendingUp, color: 'purple', desc: 'Crescimento Receita (5a)' },
    { label: 'CAGR Lucro', value: results.cagrLucro5Anos || 'N/A', icon: TrendingUp, color: 'blue', desc: 'Crescimento Lucro (5a)' },
  ];

  if (results.liquidezMediaDiaria || results.liquidezDiaria) {
    indicators.push({ label: 'Liq. Diária', value: results.liquidezMediaDiaria || results.liquidezDiaria, icon: Activity, color: 'cyan', desc: 'Liquidez Média Diária' });
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
    <div className="space-y-3 pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 pt-4 px-1 md:px-0">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center hover:bg-slate-800 transition-colors border border-slate-700/50">
          <ArrowLeft size={20} className="text-slate-300" />
        </button>
        <div className="flex-1 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center p-2 shadow-xl border border-slate-800">
              <AssetIcon assetType={(assetData as any).type || "ACAO"} ticker={assetData.ticker} className="w-full h-full" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold text-white tracking-tight">{assetData.ticker}</h1>
                <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-widest rounded border border-blue-500/20">
                  {(assetData as any).type || "Ativo"}
                </span>
              </div>
              <p className="text-sm text-slate-400 font-medium">{results.name || 'Empresa'}</p>
            </div>
          </div>
          <button 
            onClick={toggleFavorite}
            className={`w-12 h-12 rounded-xl flex items-center justify-center hover:bg-slate-800 transition-all border group ${isFavorite ? 'bg-amber-500/10 border-amber-500/50' : 'bg-slate-800/50 border-slate-700'}`}
          >
            <Star size={24} className={isFavorite ? 'text-amber-400 fill-amber-400' : 'text-slate-500 group-hover:text-amber-400 transition-colors'} />
          </button>
        </div>
      </div>

      <div className="px-1 md:px-0 grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Left Column: Price & Chart */}
        <div className="lg:col-span-2 space-y-8">
          <div className="relative border-b border-slate-800/50 pb-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[80px] -z-10" />
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Cotação Atual</div>
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-bold text-white tracking-tighter">
                    R$ {typeof results.precoAtual === 'number' ? results.precoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : results.precoAtual || '0,00'}
                  </span>
                  <div className={`flex items-center gap-1 text-lg font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isPositive ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                    {results.variacaoDay || '0.00%'}
                  </div>
                </div>
              </div>

              <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl">
                {['1mo', '3mo', '6mo', '1y', '5y'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setActivePeriod(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activePeriod === p 
                        ? 'bg-blue-600 text-white shadow-lg' 
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {p.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Chart */}
            <div className="h-72 w-full">
              {history.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                    <XAxis dataKey="date" hide />
                    <YAxis hide domain={['auto', 'auto']} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', color: '#fff' }}
                      itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
                      labelFormatter={(label) => new Date(label).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    />
                    <Area type="monotone" dataKey="close" stroke="#3b82f6" fillOpacity={1} fill="url(#colorPrice)" strokeWidth={3} animationDuration={1500} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center bg-slate-900/50 rounded-2xl border border-dashed border-slate-800">
                  <p className="text-slate-600 text-sm font-bold uppercase tracking-widest">Dados históricos indisponíveis</p>
                </div>
              )}
            </div>
          </div>

          {/* Indicators Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-slate-800/50 pb-8">
            {validIndicators.map((ind, idx) => (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.03 }}
                key={idx} 
                className="p-4 hover:bg-slate-800/20 rounded-xl transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-600/5 blur-2xl -z-10 group-hover:bg-blue-600/10 transition-all" />
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-8 h-8 rounded-lg bg-slate-800/50 flex items-center justify-center text-slate-400 group-hover:text-blue-400 transition-colors`}>
                    <ind.icon size={16} />
                  </div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{ind.label}</span>
                </div>
                <div className="text-xl font-bold text-white tracking-tight mb-1">{ind.value}</div>
                <div className="text-tiny font-medium text-slate-600 group-hover:text-slate-400 transition-colors">{ind.desc}</div>
              </motion.div>
            ))}
          </div>

          {/* About Section */}
          <div className="border-b border-slate-800/50 pb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                <Info size={20} />
              </div>
              <h2 className="text-xl font-bold text-white">Sobre a {results.name || ticker}</h2>
            </div>
            <p className="text-slate-400 leading-relaxed font-medium">
              {results.about || `A ${results.name || ticker} é uma das principais empresas do seu setor, com forte presença no mercado brasileiro.`}
            </p>
          </div>
        </div>

        {/* Right Column: Checklist & News */}
        <div className="space-y-8">
          <div className="border-b border-slate-800/50 pb-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                <ShieldCheck size={20} />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">Checklist Nexus</h2>
            </div>
            <div className="space-y-4">
              {checklistItems.map((item, idx) => {
                const passed = item.check();
                return (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/30 border border-slate-800/50">
                    <span className="text-xs text-slate-300 font-bold uppercase tracking-wide">{item.label}</span>
                    {passed ? <CheckCircle2 size={18} className="text-emerald-500" /> : <XCircle size={18} className="text-slate-600" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dividends Summary */}
          {dividends.length > 0 && (
            <div className="border-b border-slate-800/50 pb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                    <Calendar size={20} />
                  </div>
                  <h2 className="text-lg font-bold text-white">Proventos</h2>
                </div>
              </div>
              <div className="space-y-3">
                {dividends.slice(0, 4).map((div, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/20 border border-slate-800/50">
                    <div>
                      <div className="text-sm font-bold text-white">R$ {div.amount.toFixed(3)}</div>
                      <div className="text-xs text-slate-500 font-bold uppercase mt-0.5">{new Date(div.date).toLocaleDateString('pt-BR')}</div>
                    </div>
                    <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-xs font-bold uppercase rounded">Pago</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
