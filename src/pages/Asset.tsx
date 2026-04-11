import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, Info, Star, Activity, Loader2, Calendar, CheckCircle2, XCircle, AlertCircle, Users, ArrowRight, Newspaper } from 'lucide-react';
import { AssetIcon } from '../components/ui/AssetIcon';
import { financeService, AssetDetails, HistoryPoint } from '../services/financeService';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Asset() {
  const { ticker } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [assetData, setAssetData] = useState<AssetDetails | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [dividends, setDividends] = useState<any[]>([]);
  const [peers, setPeers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticker) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [details, hist, divs, peerData] = await Promise.all([
          financeService.getAssetDetails(ticker),
          financeService.getAssetHistory(ticker),
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
  }, [ticker]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        <p className="text-slate-400 font-medium">Carregando dados de {ticker}...</p>
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

  const results = assetData.results;
  const isPositive = results.variacaoDay ? !results.variacaoDay.startsWith('-') : true;

  const indicators = [
    { label: 'D.Y', value: results.dividendYield || 'N/A' },
    { label: 'P/L', value: results.pl || 'N/A' },
    { label: 'P/VP', value: results.pvp || 'N/A' },
    { label: 'ROE', value: results.roe || 'N/A' },
    { label: 'VPA', value: results.vpa || 'N/A' },
    { label: 'LPA', value: results.lpa || 'N/A' },
    { label: 'P/EBIT', value: results.pEbit || 'N/A' },
    { label: 'PSR', value: results.psr || 'N/A' },
    { label: 'P/Ativo', value: results.pAtivo || 'N/A' },
    { label: 'P/Cap. Giro', value: results.pCapGiro || 'N/A' },
    { label: 'Margem Líq.', value: results.margemLiquida || 'N/A' },
    { label: 'EV/EBITDA', value: results.evEbitda || 'N/A' },
    { label: 'Dív. Líq./EBITDA', value: results.dividaLiquidaEbitda || 'N/A' },
  ];

  const safeParse = (v: any) => {
    if (typeof v === 'number') return v;
    if (typeof v === 'string') return parseFloat(v.replace('%', '').replace(',', '.')) || 0;
    return 0;
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-4 pt-4 px-4 md:px-0">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
          <ArrowLeft size={20} className="text-slate-300" />
        </button>
        <div className="flex-1 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AssetIcon assetType="ACAO" ticker={assetData.ticker} className="w-12 h-12" />
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">{assetData.ticker}</h1>
              <p className="text-sm text-slate-400">{results.name || 'Empresa'}</p>
            </div>
          </div>
          <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
            <Star size={20} className="text-slate-400 hover:text-amber-400 transition-colors" />
          </button>
        </div>
      </div>

      <div className="px-4 md:px-0 space-y-6">
        {/* Price Card */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="text-sm font-medium text-slate-400 mb-2">Cotação Atual</div>
          <div className="flex items-end gap-4">
            <div className="text-4xl font-bold text-white tracking-tight">
              R$ {typeof results.precoAtual === 'number' ? results.precoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : results.precoAtual || '0,00'}
            </div>
            <div className={`flex items-center gap-1 text-lg font-semibold mb-1 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              {isPositive ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
              {results.variacaoDay || '0.00%'}
            </div>
          </div>
          
          {/* Chart */}
          <div className="h-64 mt-8 rounded-xl overflow-hidden">
            {history.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                  <XAxis 
                    dataKey="date" 
                    hide 
                  />
                  <YAxis 
                    hide 
                    domain={['auto', 'auto']}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                    itemStyle={{ color: '#3b82f6' }}
                    labelFormatter={(label) => new Date(label).toLocaleDateString('pt-BR')}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="close" 
                    stroke="#3b82f6" 
                    fillOpacity={1} 
                    fill="url(#colorPrice)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center bg-slate-800/30 rounded-xl border border-dashed border-slate-800">
                <p className="text-slate-500 text-sm font-medium">Dados históricos indisponíveis</p>
              </div>
            )}
          </div>
        </div>

        {/* Indicators */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4">Indicadores Fundamentalistas</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {indicators.map((ind, idx) => (
              <div key={idx} className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 flex flex-col justify-center shadow-sm">
                <span className="text-xs font-medium text-slate-400 mb-1">{ind.label}</span>
                <span className="text-lg font-semibold text-white">{ind.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Checklist Section */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <CheckCircle2 size={20} className="text-emerald-500" />
            <h2 className="text-lg font-bold text-white">Checklist do Investidor</h2>
          </div>
          
          <div className="space-y-2">
            {[
              { label: 'P/L abaixo de 15', check: () => {
                const val = safeParse(results.pl);
                return val > 0 && val < 15;
              }},
              { label: 'P/VP abaixo de 2.0', check: () => {
                const val = safeParse(results.pvp);
                return val > 0 && val < 2;
              }},
              { label: 'Dividend Yield acima de 6%', check: () => {
                const val = safeParse(results.dividendYield);
                return val >= 6;
              }},
              { label: 'ROE acima de 10%', check: () => {
                const val = safeParse(results.roe);
                return val >= 10;
              }},
              { label: 'Margem Líquida acima de 10%', check: () => {
                const val = safeParse(results.margemLiquida);
                return val >= 10;
              }},
              { label: 'Dív. Líq. / EBITDA abaixo de 3', check: () => {
                const val = safeParse(results.dividaLiquidaEbitda);
                return val > 0 && val < 3;
              }},
            ].map((item, idx) => {
              const passed = item.check();
              return (
                <div key={idx} className="flex items-center justify-between py-3 border-b border-slate-800/50 last:border-0">
                  <span className="text-sm text-slate-300 font-medium">{item.label}</span>
                  {passed ? (
                    <div className="flex items-center gap-2 text-emerald-400">
                      <span className="text-xs font-semibold">Aprovado</span>
                      <CheckCircle2 size={16} />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-500">
                      <span className="text-xs font-semibold">Não atende</span>
                      <XCircle size={16} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="mt-6 p-4 bg-blue-500/5 rounded-xl border border-blue-500/10 flex items-start gap-3">
            <AlertCircle size={18} className="text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              Nota: Este checklist é baseado em critérios fundamentalistas clássicos e não deve ser considerado como recomendação de compra ou venda.
            </p>
          </div>
        </div>

        {/* About */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Info size={20} className="text-blue-500" />
            <h2 className="text-lg font-bold text-white">Sobre a Empresa</h2>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed font-medium">
            {results.about || `Informações detalhadas sobre ${assetData.ticker} estarão disponíveis em breve.`}
          </p>
        </div>

        {/* Asset News */}
        {assetData.news && assetData.news.length > 0 && (
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Newspaper size={20} className="text-blue-500" />
              <h2 className="text-lg font-bold text-white">Últimas Notícias</h2>
            </div>
            <div className="space-y-4">
              {assetData.news.map((item: any, idx: number) => (
                <a 
                  key={idx} 
                  href={item.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block p-4 bg-slate-800/30 rounded-xl hover:bg-slate-800/50 transition-colors border border-slate-800 hover:border-blue-500/30 group"
                >
                  <h3 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors line-clamp-2">{item.title}</h3>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs font-semibold text-blue-400">{item.source || 'Nexus News'}</span>
                    {item.pubDate && (
                      <span className="text-xs text-slate-500 font-medium">
                        {new Date(item.pubDate).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Dividends */}
        {dividends.length > 0 && (
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Calendar size={20} className="text-emerald-500" />
                <h2 className="text-lg font-bold text-white">Histórico de Proventos</h2>
              </div>
            </div>
            <div className="space-y-2">
              {dividends.slice(0, 5).map((div, idx) => (
                <div key={idx} className="flex items-center justify-between py-3 border-b border-slate-800/50 last:border-0">
                  <div>
                    <div className="text-sm font-semibold text-white">R$ {div.amount.toFixed(4)}</div>
                    <div className="text-xs text-slate-500 font-medium mt-0.5">Pagamento</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-slate-300 font-medium">{new Date(div.date).toLocaleDateString('pt-BR')}</div>
                    <div className="text-xs text-emerald-400 font-semibold mt-0.5">Dividendo</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Comparison with Sector */}
        <section className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 md:p-8 relative overflow-hidden mt-8 shadow-sm">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[80px] -z-10" />
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <Users size={20} className="text-blue-500" />
              </div>
              <h2 className="text-lg font-bold text-white">Comparação com o Setor</h2>
            </div>
            <button 
              onClick={() => navigate('/compare')}
              className="text-xs font-semibold text-blue-400 flex items-center gap-2 hover:text-blue-300 transition-colors"
            >
              Ver Comparativo <ArrowRight size={14} />
            </button>
          </div>

          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800/50">
                  <th className="pb-4 text-xs font-semibold text-slate-400">Ativo</th>
                  <th className="pb-4 text-xs font-semibold text-slate-400 text-right">P/L</th>
                  <th className="pb-4 text-xs font-semibold text-slate-400 text-right">P/VP</th>
                  <th className="pb-4 text-xs font-semibold text-slate-400 text-right">DY (%)</th>
                  <th className="pb-4 text-xs font-semibold text-slate-400 text-right">ROE (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {[
                  { ticker: assetData.ticker, pl: results.pl, pvp: results.pvp, dy: results.dividendYield?.replace('%', ''), roe: results.roe?.replace('%', ''), current: true },
                  ...peers
                ].map((peer, i) => (
                  <tr key={i} className={`group hover:bg-slate-800/30 transition-colors ${peer.current ? 'bg-blue-500/5' : ''}`}>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <AssetIcon assetType="ACAO" ticker={peer.ticker} className="w-8 h-8" />
                        <button 
                          onClick={() => !peer.current && navigate(`/asset/${peer.ticker}`)}
                          className={`font-semibold hover:text-blue-400 transition-colors ${peer.current ? 'text-blue-400' : 'text-white'}`}
                        >
                          {peer.ticker}
                        </button>
                        {peer.current && <span className="text-[10px] font-semibold bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">Atual</span>}
                      </div>
                    </td>
                    <td className="py-4 text-right text-sm text-slate-300 font-medium">{peer.pl}</td>
                    <td className="py-4 text-right text-sm text-slate-300 font-medium">{peer.pvp}</td>
                    <td className="py-4 text-right text-sm text-emerald-400 font-medium">{peer.dy}%</td>
                    <td className="py-4 text-right text-sm text-slate-300 font-medium">{peer.roe}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="mt-8 p-6 bg-slate-800/30 border border-slate-800 rounded-2xl">
          <div className="flex items-center gap-3 mb-3">
            <AlertCircle size={16} className="text-slate-500" />
            <h4 className="text-xs font-semibold text-slate-400">Aviso Legal</h4>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            As informações apresentadas são obtidas de fontes públicas e podem conter atrasos ou imprecisões. Este conteúdo tem caráter meramente informativo e não constitui recomendação de compra, venda ou manutenção de ativos. O investimento em renda variável envolve riscos e rentabilidade passada não é garantia de rentabilidade futura.
          </p>
        </div>
      </div>
    </div>
  );
}
