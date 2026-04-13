import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, Info, Star, Activity, Loader2, Calendar, CheckCircle2, XCircle, AlertCircle, Users, ArrowRight, Newspaper, Building2, Wallet, BarChart3, ShieldCheck, Zap } from 'lucide-react';
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

  useEffect(() => {
    if (!ticker) return;

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
          <p className="text-slate-400 font-medium max-w-xs mx-auto">Estamos processando indicadores fundamentalistas e dados históricos em tempo real.</p>
        </div>
        
        {/* Skeleton Preview */}
        <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 opacity-20">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-32 bg-slate-800 rounded-2xl animate-pulse" />
          ))}
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
        <button 
          onClick={() => navigate(-1)}
          className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-full transition-colors"
        >
          Voltar
        </button>
      </div>
    );
  }

  const results = assetData?.results || {};
  const isPositive = results.variacaoDay && typeof results.variacaoDay === 'string' 
    ? !results.variacaoDay.startsWith('-') 
    : true;

  const indicators = [
    { label: 'Dividend Yield', value: results.dividendYield || 'N/A', icon: Wallet, color: 'emerald', desc: 'Rendimento de Dividendos' },
    { label: 'P/L', value: results.pl || 'N/A', icon: BarChart3, color: 'blue', desc: 'Preço sobre Lucro' },
    { label: 'P/VP', value: results.pvp || 'N/A', icon: TrendingUp, color: 'indigo', desc: 'Preço sobre Valor Patr.' },
    { label: 'ROE', value: results.roe || 'N/A', icon: Activity, color: 'purple', desc: 'Retorno sobre Patrimônio' },
    { label: 'ROA', value: results.roa || 'N/A', icon: Activity, color: 'cyan', desc: 'Retorno sobre Ativos' },
    { label: 'VPA', value: results.vpa || 'N/A', icon: Building2, color: 'cyan', desc: 'Valor Patr. por Ação' },
    { label: 'LPA', value: results.lpa || 'N/A', icon: TrendingUp, color: 'emerald', desc: 'Lucro por Ação' },
    { label: 'Margem Líq.', value: results.margemLiquida || 'N/A', icon: ShieldCheck, color: 'blue', desc: 'Eficiência de Lucro' },
    { label: 'Margem Bruta', value: results.margemBruta || 'N/A', icon: ShieldCheck, color: 'indigo', desc: 'Lucro Bruto' },
    { label: 'Dívida/EBITDA', value: results.dividaLiquidaEbitda || 'N/A', icon: Zap, color: 'red', desc: 'Alavancagem' },
    { label: 'PEG Ratio', value: results.pegRatio || 'N/A', icon: BarChart3, color: 'purple', desc: 'Preço/Lucro ao Crescimento' },
    { label: 'Forward P/E', value: results.forwardPE || 'N/A', icon: TrendingUp, color: 'blue', desc: 'P/L Projetado' },
  ];

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
                <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-xxs font-black uppercase tracking-widest rounded border border-blue-500/20">
                  {(assetData as any).type || "Ativo"}
                </span>
              </div>
              <p className="text-sm text-slate-400 font-medium">{results.name || 'Empresa'}</p>
            </div>
          </div>
          <button className="w-12 h-12 rounded-xl bg-slate-800/50 flex items-center justify-center hover:bg-slate-800 transition-all border border-slate-700 group">
            <Star size={24} className="text-slate-500 group-hover:text-amber-400 transition-colors" />
          </button>
        </div>
      </div>

      <div className="px-1 md:px-0 grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Left Column: Price & Chart */}
        <div className="lg:col-span-2 space-y-3">
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[80px] -z-10" />
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
              <div>
                <div className="text-xxs font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Cotação Atual</div>
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
                    <XAxis 
                      dataKey="date" 
                      hide 
                    />
                    <YAxis 
                      hide 
                      domain={['auto', 'auto']}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', color: '#fff', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
                      labelFormatter={(label) => new Date(label).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="close" 
                      stroke="#3b82f6" 
                      fillOpacity={1} 
                      fill="url(#colorPrice)" 
                      strokeWidth={3}
                      animationDuration={1500}
                    />
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {indicators.map((ind, idx) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={idx} 
                className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all group shadow-sm relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-600/5 blur-2xl -z-10 group-hover:bg-blue-600/10 transition-all" />
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-8 h-8 rounded-lg bg-slate-800/50 flex items-center justify-center text-slate-400 group-hover:text-blue-400 transition-colors`}>
                    <ind.icon size={16} />
                  </div>
                  <span className="text-xxs font-black text-slate-500 uppercase tracking-widest">{ind.label}</span>
                </div>
                <div className="text-xl font-bold text-white tracking-tight mb-1">{ind.value}</div>
                <div className="text-tiny font-medium text-slate-600 group-hover:text-slate-400 transition-colors">{ind.desc}</div>
              </motion.div>
            ))}
          </div>

          {/* About Section */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                <Info size={20} />
              </div>
              <h2 className="text-xl font-bold text-white">Sobre a {results.name || assetData.ticker}</h2>
            </div>
            <p className="text-slate-400 leading-relaxed font-medium">
              {results.about || `A ${results.name || assetData.ticker} é uma das principais empresas do seu setor, com forte presença no mercado brasileiro. Suas operações abrangem diversas áreas estratégicas, focando em eficiência e retorno para o acionista.`}
            </p>
            
            <div className="grid grid-cols-2 gap-8 mt-8 pt-8 border-t border-slate-800">
              <div>
                <div className="text-xxs font-black text-slate-500 uppercase tracking-widest mb-1">Setor</div>
                <div className="text-sm font-bold text-white">{results.sector || 'N/A'}</div>
              </div>
              <div>
                <div className="text-xxs font-black text-slate-500 uppercase tracking-widest mb-1">Subsetor</div>
                <div className="text-sm font-bold text-white">{results.subSector || 'N/A'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Checklist & News */}
        <div className="space-y-3">
          {/* Checklist Card */}
          <div className="bg-gradient-to-br from-slate-900 to-[#0f172a] border border-slate-800 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                <ShieldCheck size={20} />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">Checklist Nexus</h2>
            </div>
            
            <div className="space-y-4">
              {[
                { label: 'P/L abaixo de 15', check: () => {
                  const val = parseFinanceValue(results.pl);
                  return val > 0 && val < 15;
                }},
                { label: 'P/VP abaixo de 2.0', check: () => {
                  const val = parseFinanceValue(results.pvp);
                  return val > 0 && val < 2;
                }},
                { label: 'Dividend Yield > 6%', check: () => {
                  const val = parseFinanceValue(results.dividendYield);
                  return val >= 6;
                }},
                { label: 'ROE acima de 10%', check: () => {
                  const val = parseFinanceValue(results.roe);
                  return val >= 10;
                }},
                { label: 'Margem Líquida > 10%', check: () => {
                  const val = parseFinanceValue(results.margemLiquida);
                  return val >= 10;
                }},
                { label: 'Dívida Controlada', check: () => {
                  const val = parseFinanceValue(results.dividaLiquidaEbitda);
                  return val > 0 && val < 3;
                }},
              ].map((item, idx) => {
                const passed = item.check();
                return (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/30 border border-slate-800/50">
                    <span className="text-xs text-slate-300 font-bold uppercase tracking-wide">{item.label}</span>
                    {passed ? (
                      <CheckCircle2 size={18} className="text-emerald-500" />
                    ) : (
                      <XCircle size={18} className="text-slate-600" />
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="mt-8 p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10">
              <p className="text-xxs text-slate-500 font-bold leading-relaxed text-center uppercase tracking-wider">
                Análise baseada em fundamentos clássicos de Buy & Hold.
              </p>
            </div>
          </div>

          {/* Dividends Summary */}
          {dividends.length > 0 && (
            <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 shadow-sm">
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
                      <div className="text-xxs text-slate-500 font-black uppercase mt-0.5">{new Date(div.date).toLocaleDateString('pt-BR')}</div>
                    </div>
                    <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-tiny font-black uppercase rounded">Pago</span>
                  </div>
                ))}
              </div>
              <Link to="/dividends" className="mt-6 block text-center py-3 text-xs font-bold text-blue-500 hover:text-blue-400 transition-colors uppercase tracking-widest">Ver Agenda Completa</Link>
            </div>
          )}

          {/* News Feed */}
          {assetData.news && assetData.news.length > 0 && (
            <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                  <Newspaper size={20} />
                </div>
                <h2 className="text-lg font-bold text-white">Notícias</h2>
              </div>
              <div className="space-y-4">
                {assetData.news.slice(0, 3).map((item: any, idx: number) => (
                  <a 
                    key={idx} 
                    href={item.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block group"
                  >
                    <h3 className="text-xs font-bold text-slate-300 group-hover:text-blue-400 transition-colors line-clamp-2 leading-relaxed">{item.title}</h3>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-tiny font-black text-blue-500 uppercase tracking-widest">{item.source || 'Nexus'}</span>
                      <span className="text-tiny font-bold text-slate-600">{new Date(item.pubDate).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Comparison Section */}
      <div className="px-1 md:px-0">
        <section className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 blur-[120px] -z-10" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-inner">
                <Users size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Comparação com o Setor</h2>
                <p className="text-sm text-slate-500 font-medium mt-1">Como este ativo se comporta em relação aos seus pares.</p>
              </div>
            </div>
            <button 
              onClick={() => navigate('/compare')}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2"
            >
              Comparador Completo <ArrowRight size={16} />
            </button>
          </div>

          <div className="overflow-x-auto no-scrollbar -mx-8 px-8">
            <table className="w-full text-left border-separate border-spacing-y-2">
              <thead>
                <tr className="text-xxs font-black text-slate-500 uppercase tracking-[0.2em]">
                  <th className="pb-4 pl-4">Ativo</th>
                  <th className="pb-4 text-right">P/L</th>
                  <th className="pb-4 text-right">P/VP</th>
                  <th className="pb-4 text-right">DY (%)</th>
                  <th className="pb-4 text-right pr-4">ROE (%)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { ticker: assetData.ticker, pl: results.pl, pvp: results.pvp, dy: results.dividendYield?.toString().replace('%', ''), roe: results.roe?.toString().replace('%', ''), current: true },
                  ...peers
                ].map((peer, i) => (
                  <tr 
                    key={i} 
                    onClick={() => !peer.current && navigate(`/asset/${peer.ticker}`)}
                    className={`group cursor-pointer transition-all ${peer.current ? 'bg-blue-600/10' : 'bg-slate-900/30 hover:bg-slate-800/50'}`}
                  >
                    <td className="py-4 pl-4 rounded-l-2xl border-y border-l border-transparent group-hover:border-slate-700">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center p-1 border border-slate-800 shadow-sm">
                          <AssetIcon assetType="ACAO" ticker={peer.ticker} className="w-full h-full" />
                        </div>
                        <span className={`font-bold ${peer.current ? 'text-blue-400' : 'text-white'}`}>{peer.ticker}</span>
                        {peer.current && <span className="text-tiny font-black bg-blue-500 text-white px-1.5 py-0.5 rounded uppercase tracking-widest">Atual</span>}
                      </div>
                    </td>
                    <td className="py-4 text-right text-sm text-slate-300 font-mono font-bold border-y border-transparent group-hover:border-slate-700">{peer.pl}</td>
                    <td className="py-4 text-right text-sm text-slate-300 font-mono font-bold border-y border-transparent group-hover:border-slate-700">{peer.pvp}</td>
                    <td className="py-4 text-right text-sm text-emerald-400 font-mono font-bold border-y border-transparent group-hover:border-slate-700">{peer.dy}%</td>
                    <td className="py-4 text-right text-sm text-slate-300 font-mono font-bold pr-4 rounded-r-2xl border-y border-r border-transparent group-hover:border-slate-700">{peer.roe}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div className="px-1 md:px-0">
        <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-3xl flex items-start gap-4">
          <AlertCircle size={20} className="text-slate-600 shrink-0 mt-1" />
          <div>
            <h4 className="text-xxs font-black text-slate-500 uppercase tracking-widest mb-2">Aviso Legal</h4>
            <p className="text-tiny text-slate-500 leading-relaxed font-medium">
              As informações apresentadas são obtidas de fontes públicas e podem conter atrasos ou imprecisões. Este conteúdo tem caráter meramente informativo e não constitui recomendação de compra, venda ou manutenção de ativos. O investimento em renda variável envolve riscos e rentabilidade passada não é garantia de rentabilidade futura.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
