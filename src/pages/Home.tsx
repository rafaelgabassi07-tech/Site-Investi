import { TrendingUp, ArrowRight, Zap, Shield, BarChart3, Award, Calendar, Search, Briefcase, Newspaper, ChevronRight, Loader2, GitCompare, Gauge, Info, HelpCircle, Filter, Star, TrendingDown, Bitcoin, Building2, DollarSign, Globe } from 'lucide-react';
import Dashboard from './Dashboard';
import { NewsWidget } from '../components/NewsWidget';
import { MarketMarquee } from '../components/MarketMarquee';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useState, useEffect } from 'react';
import { financeService } from '../services/financeService';

import { Logo } from '../components/ui/Logo';
import { parseFinanceValue } from '../lib/utils';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [topGainers, setTopGainers] = useState<any[]>([]);
  const [rankings, setRankings] = useState<Record<string, any[]>>({});
  const [activeRankTab, setActiveRankTab] = useState('ACAO');
  const [loadingRankings, setLoadingRankings] = useState(true);
  const [loadingGainers, setLoadingGainers] = useState(true);

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Investidor';

  const [marketStats, setMarketStats] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [sentiment, setSentiment] = useState({ score: 50, label: 'Neutro', color: 'slate', desc: 'O mercado aguarda novas direções.' });
  const [showSentimentInfo, setShowSentimentInfo] = useState(false);

  useEffect(() => {
    financeService.getMarketStats()
      .then(data => {
        setMarketStats(data);
        setLoadingStats(false);
        
        const ibov = data.find((s: any) => s.ticker === '^BVSP');
        const sp500 = data.find((s: any) => s.ticker === '^GSPC');
        const dollar = data.find((s: any) => s.ticker === 'USDBRL=X');
        const btc = data.find((s: any) => s.ticker === 'BTC-USD');
        const ifix = data.find((s: any) => s.ticker === 'IFIX.SA');

        let weightedSum = 0;
        if (ibov) weightedSum += parseFinanceValue(ibov.change) * 0.35;
        if (sp500) weightedSum += parseFinanceValue(sp500.change) * 0.25;
        if (dollar) weightedSum -= parseFinanceValue(dollar.change) * 0.20; // Inverse correlation
        if (btc) weightedSum += parseFinanceValue(btc.change) * 0.10;
        if (ifix) weightedSum += parseFinanceValue(ifix.change) * 0.10;

        // Map weighted sum to 0-100 score (50 is neutral)
        // A 1.5% weighted move is considered extreme
        let score = 50 + (weightedSum * 30);
        score = Math.max(5, Math.min(95, Math.round(score)));
        
        if (score >= 80) {
          setSentiment({ score, label: 'Ganância Extrema', color: 'emerald', desc: 'Forte apetite por risco. Investidores estão muito otimistas com o cenário atual.' });
        } else if (score >= 60) {
          setSentiment({ score, label: 'Ganância', color: 'emerald', desc: 'O mercado demonstra otimismo e apetite por ativos de renda variável.' });
        } else if (score >= 40) {
          setSentiment({ score, label: 'Neutro', color: 'slate', desc: 'O mercado está equilibrado, aguardando novos gatilhos ou indicadores econômicos.' });
        } else if (score >= 20) {
          setSentiment({ score, label: 'Medo', color: 'red', desc: 'Investidores estão cautelosos. Há uma tendência clara de aversão ao risco.' });
        } else {
          setSentiment({ score, label: 'Medo Extremo', color: 'red', desc: 'Pânico ou forte pessimismo. O mercado está em modo de proteção total.' });
        }
      })
      .catch(() => setLoadingStats(false));
  }, []);

  const stats = [
    { label: 'Ibovespa', ticker: '^BVSP', icon: TrendingUp, color: 'text-emerald-400' },
    { label: 'Dólar', ticker: 'USDBRL=X', icon: DollarSign, color: 'text-red-400' },
    { label: 'S&P 500', ticker: '^GSPC', icon: Globe, color: 'text-emerald-400' },
    { label: 'Bitcoin', ticker: 'BTC-USD', icon: Zap, color: 'text-emerald-400' },
  ];

  useEffect(() => {
    const fetchRankings = async () => {
      setLoadingRankings(true);
      try {
        const [acoes, fiis, cryptos] = await Promise.all([
          financeService.getRanking('Dividend Yield', 'ACAO'),
          financeService.getRanking('Dividend Yield', 'FII'),
          financeService.getRanking('Market Cap', 'ACAO') // Using market cap for cryptos if needed or just general
        ]);
        setRankings({
          'ACAO': acoes.slice(0, 5),
          'FII': fiis.slice(0, 5),
          'CRYPTO': cryptos.slice(0, 5)
        });
      } catch (err) {
        console.error('Failed to fetch rankings', err);
      } finally {
        setLoadingRankings(false);
      }
    };

    const fetchGainers = async () => {
      try {
        const gainers = await financeService.getRanking('Maiores Altas');
        setTopGainers(gainers.slice(0, 3));
      } catch (err) {
        console.error('Failed to fetch top gainers', err);
      } finally {
        setLoadingGainers(false);
      }
    };

    fetchRankings();
    fetchGainers();
  }, []);

  const mostSearched = [
    { ticker: 'PETR4', name: 'Petrobras' },
    { ticker: 'VALE3', name: 'Vale' },
    { ticker: 'ITUB4', name: 'Itaú Unibanco' },
    { ticker: 'MXRF11', name: 'Maxi Renda' },
    { ticker: 'BTC-USD', name: 'Bitcoin' },
  ];

  return (
    <div className="space-y-6 pb-12 overflow-hidden">
      {/* Market Marquee */}
      <div className="fixed top-20 left-0 right-0 z-40">
        <MarketMarquee />
      </div>

      {/* Hero Section */}
      <section className="pt-20 md:pt-24">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center"
          >
            <Logo size={80} showText className="flex-col gap-4" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-4"
          >
            <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter leading-[0.9] uppercase italic">
              Ajudamos você a <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400 drop-shadow-[0_0_15px_rgba(37,99,235,0.3)]">
                investir melhor
              </span>
            </h1>
            <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-bold tracking-tight">
              Pesquise pelo ativo desejado para ter acesso a cotação, fundamentos e gráficos em tempo real.
            </p>
          </motion.div>

          {/* Search Hero */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="relative max-w-2xl mx-auto px-4 md:px-0"
          >
            <div className="absolute inset-0 bg-blue-500/20 blur-[100px] -z-10" />
            <div className="relative flex items-center w-full bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl focus-within:border-blue-500/50 transition-all p-1 overflow-hidden">
              <div className="pl-3 text-slate-500">
                <Search size={18} />
              </div>
              <input 
                type="text" 
                placeholder="Busque ativos..." 
                className="flex-1 min-w-0 bg-transparent border-none outline-none py-3 px-3 text-sm md:text-lg text-white placeholder:text-slate-600"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    navigate(`/search?q=${encodeURIComponent((e.target as HTMLInputElement).value)}`);
                  }
                }}
              />
              <button 
                onClick={() => {
                  const input = document.querySelector('input[placeholder="Busque ativos..."]') as HTMLInputElement;
                  if (input?.value) navigate(`/search?q=${encodeURIComponent(input.value)}`);
                }}
                className="flex-shrink-0 bg-blue-600 hover:bg-blue-500 text-white px-4 md:px-6 py-2 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 text-xs md:text-sm"
              >
                Pesquisar
              </button>
            </div>
            
            {/* Most Searched Tags */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
              <span className="text-xxs font-bold text-slate-500 uppercase tracking-widest mr-2">Mais buscados:</span>
              {mostSearched.map((asset) => (
                <Link 
                  key={asset.ticker} 
                  to={`/asset/${asset.ticker}`}
                  className="px-3 py-1.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-full text-xs font-medium text-slate-300 transition-all hover:text-blue-400"
                >
                  {asset.name}
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Quick Stats Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
            {stats.map((stat, idx) => {
              const data = marketStats.find(s => s.ticker === stat.ticker);
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                  className="p-5 bg-[#0f172a]/80 backdrop-blur-xl border border-slate-800 rounded-2xl hover:bg-slate-800/50 transition-all duration-300 group relative overflow-hidden shadow-2xl"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-blue-600/5 blur-2xl -z-10 group-hover:bg-blue-600/10 transition-all" />
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-800/50 flex items-center justify-center text-slate-400 group-hover:text-blue-400 transition-colors">
                      <stat.icon size={16} />
                    </div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    {loadingStats ? (
                      <div className="h-6 w-20 bg-slate-800 animate-pulse rounded" />
                    ) : (
                      <>
                        <span className="text-xl font-black text-white tracking-tighter">
                          {data?.price || '---'}
                        </span>
                        <span className={`text-xxs font-black ${data?.change?.includes('+') ? 'text-emerald-400' : 'text-red-400'} bg-white/5 px-2 py-0.5 rounded-md`}>
                          {data?.change || '0.00%'}
                        </span>
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Market Sentiment & Quick Stats */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 bg-[#0f172a] border border-slate-800 rounded-2xl p-6 md:p-8 relative overflow-hidden group shadow-lg">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[80px] -z-10 group-hover:bg-blue-600/10 transition-all duration-700" />
          
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <Gauge size={20} className="text-blue-500" />
              </div>
              <h2 className="text-lg font-bold text-white">Sentimento do Mercado</h2>
            </div>
            <button 
              onClick={() => setShowSentimentInfo(true)}
              className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-lg"
            >
              <HelpCircle size={18} />
            </button>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="relative w-48 h-24 overflow-hidden">
              {/* Gauge Background */}
              <svg className="w-48 h-24" viewBox="0 0 100 50">
                <path 
                  d="M 10 50 A 40 40 0 0 1 90 50" 
                  fill="none" 
                  stroke="#1e293b" 
                  strokeWidth="8" 
                  strokeLinecap="round"
                />
                {/* Active Path */}
                <path 
                  d="M 10 50 A 40 40 0 0 1 90 50" 
                  fill="none" 
                  stroke={sentiment.color === 'emerald' ? '#10b981' : sentiment.color === 'red' ? '#ef4444' : '#64748b'} 
                  strokeWidth="8" 
                  strokeLinecap="round"
                  strokeDasharray={`${(sentiment.score / 100) * 125.6} 125.6`}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              
              {/* Needle */}
              <div 
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-20 bg-white origin-bottom transition-transform duration-1000 shadow-[0_0_10px_rgba(255,255,255,0.5)] z-10" 
                style={{ transform: `translateX(-50%) rotate(${(sentiment.score / 100) * 180 - 90}deg)` }}
              />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full border-4 border-slate-900 z-20" />
              
              {/* Labels */}
              <div className="absolute bottom-0 left-2 text-[10px] font-bold text-red-500">MEDO</div>
              <div className="absolute bottom-0 right-2 text-[10px] font-bold text-emerald-500">GANÂNCIA</div>
            </div>
            
            <div className="flex-1 space-y-3 text-center md:text-left">
              <div className={`inline-block px-3 py-1 rounded-lg text-xs font-semibold ${
                sentiment.color === 'emerald' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' :
                sentiment.color === 'red' ? 'bg-red-500/10 border border-red-500/20 text-red-400' :
                'bg-slate-500/10 border border-slate-500/20 text-slate-400'
              }`}>
                {sentiment.label}
              </div>
              <h3 className="text-3xl font-black text-white tracking-tighter italic">Score: {sentiment.score}<span className="text-slate-600 text-xl">/100</span></h3>
              <p className="text-sm text-slate-400 leading-relaxed max-w-md">
                {sentiment.desc}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden group shadow-lg shadow-blue-500/10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -mr-16 -mt-16 group-hover:bg-white/20 transition-all" />
          <Zap size={48} className="text-white/20 absolute -bottom-4 -right-4 rotate-12 group-hover:scale-110 transition-transform" />
          
          <h3 className="text-lg font-bold mb-3 tracking-tight">Nexus PRO</h3>
          <p className="text-blue-100 text-sm leading-relaxed mb-6 font-medium">
            Desbloqueie o potencial máximo dos seus investimentos com ferramentas exclusivas de análise e gestão.
          </p>
          <button className="w-full py-3 bg-white text-blue-700 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors">
            Conhecer o PRO
          </button>
        </div>
      </section>

      <section id="dashboard" className="scroll-mt-32">
        <Dashboard />
      </section>
      
      {/* Rankings Section - Enhanced with Tabs and Real Data */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
              <Award size={20} className="text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Rankings de Ativos</h2>
          </div>
          
          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl">
            {[
              { id: 'ACAO', label: 'Ações', icon: TrendingUp },
              { id: 'FII', label: 'FIIs', icon: Building2 },
              { id: 'CRYPTO', label: 'Criptos', icon: Bitcoin },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveRankTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeRankTab === tab.id 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Main Ranking Card */}
          <div className="md:col-span-2 bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Star size={18} className="text-amber-500 fill-amber-500" />
                Maiores Dividend Yield
              </h3>
              <Link to="/ranking" className="text-xs font-bold text-blue-500 hover:underline uppercase tracking-widest">Ver Todos</Link>
            </div>
            
            <div className="divide-y divide-slate-800">
              {loadingRankings ? (
                Array(5).fill(0).map((_, i) => (
                  <div key={i} className="p-4 flex items-center gap-4 animate-pulse">
                    <div className="w-8 h-8 bg-slate-800 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-800 rounded w-1/4" />
                      <div className="h-3 bg-slate-800 rounded w-1/2" />
                    </div>
                    <div className="w-16 h-4 bg-slate-800 rounded" />
                  </div>
                ))
              ) : rankings[activeRankTab]?.map((asset, idx) => (
                <Link 
                  key={asset.ticker} 
                  to={`/asset/${asset.ticker}`}
                  className="p-4 flex items-center gap-4 hover:bg-slate-800/30 transition-colors group"
                >
                  <div className="w-8 text-sm font-black text-slate-600 group-hover:text-blue-500 transition-colors">#{idx + 1}</div>
                  <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700 text-xs font-bold text-white overflow-hidden">
                    {asset.raw.image ? (
                      <img src={asset.raw.image} alt={asset.ticker} className="w-full h-full object-contain p-1" />
                    ) : asset.ticker.substring(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white group-hover:text-blue-400 transition-colors truncate">{asset.ticker}</div>
                    <div className="text-xs text-slate-500 truncate">{asset.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm text-white font-bold">{asset.subValue}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-black tracking-tighter">Yield 12M</div>
                  </div>
                  <ChevronRight size={16} className="text-slate-700 group-hover:text-blue-500 transition-all group-hover:translate-x-1" />
                </Link>
              ))}
            </div>
          </div>

          {/* Side Ranking / Info */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-slate-900 to-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-lg">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp size={18} className="text-emerald-500" />
                Maiores Altas Hoje
              </h3>
              <div className="space-y-4">
                {loadingGainers ? (
                  Array(3).fill(0).map((_, i) => <div key={i} className="h-16 bg-slate-800/50 rounded-xl animate-pulse" />)
                ) : topGainers.map((asset) => (
                  <Link key={asset.ticker} to={`/asset/${asset.ticker}`} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-800/50 transition-all border border-transparent hover:border-slate-700 group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-xxs font-bold text-slate-400 group-hover:text-white transition-colors">
                        {asset.ticker.substring(0, 2)}
                      </div>
                      <span className="font-bold text-slate-200 group-hover:text-white">{asset.ticker}</span>
                    </div>
                    <span className="text-sm font-bold text-emerald-500">{asset.raw.variacaoDay}</span>
                  </Link>
                ))}
              </div>
              <Link to="/ranking" className="mt-6 block text-center py-3 border border-slate-800 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:border-slate-600 transition-all">
                Ver Ranking Completo
              </Link>
            </div>

            <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-6">
              <h4 className="text-blue-400 font-bold text-sm mb-2 uppercase tracking-widest">Dica do Nexus</h4>
              <p className="text-slate-300 text-sm leading-relaxed">
                Diversificar entre diferentes classes de ativos (Ações, FIIs e Renda Fixa) é a melhor forma de proteger seu patrimônio a longo prazo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sentiment Explanation Modal */}
      <AnimatePresence>
        {showSentimentInfo && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSentimentInfo(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-[#0f172a] border border-slate-800 rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                  <Info size={24} className="text-blue-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Como calculamos o Sentimento?</h3>
                  <p className="text-sm text-slate-500">Fear & Greed Index by Nexus</p>
                </div>
              </div>

              <div className="space-y-6">
                <p className="text-slate-300 leading-relaxed">
                  Nosso índice de sentimento é uma métrica proprietária que analisa o comportamento do mercado em tempo real através de 4 pilares fundamentais:
                </p>

                <div className="grid gap-4">
                  {[
                    { 
                      title: 'Momentum do Mercado (60%)', 
                      desc: 'Analisamos o desempenho do Ibovespa e S&P 500. Preços subindo indicam otimismo (Greed).',
                      icon: TrendingUp,
                      color: 'text-emerald-400'
                    },
                    { 
                      title: 'Safe Haven Demand (20%)', 
                      desc: 'Monitoramos o Dólar. Quando o dólar sobe bruscamente, indica busca por proteção (Fear).',
                      icon: Shield,
                      color: 'text-blue-400'
                    },
                    { 
                      title: 'Apetite por Risco (10%)', 
                      desc: 'O desempenho do Bitcoin serve como termômetro para o apetite por ativos de alta volatilidade.',
                      icon: Zap,
                      color: 'text-amber-400'
                    },
                    { 
                      title: 'Estabilidade Real (10%)', 
                      desc: 'O IFIX (Fundos Imobiliários) traz a visão sobre a estabilidade do mercado interno e juros.',
                      icon: Building2,
                      color: 'text-purple-400'
                    }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4 p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
                      <item.icon size={20} className={item.color} />
                      <div>
                        <h4 className="text-sm font-bold text-white mb-1">{item.title}</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => setShowSentimentInfo(false)}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-600/20"
                >
                  Entendi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      
      <section id="news" className="scroll-mt-32">
        <NewsWidget />
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />

      {/* Meus Recursos Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white tracking-tight mb-6">Ferramentas e Recursos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: Search, label: 'Busca de Ativos', to: '/search', color: 'blue' },
            { icon: GitCompare, label: 'Comparar Ativos', to: '/compare', color: 'cyan' },
            { icon: Filter, label: 'Busca Avançada', to: '/screener', color: 'blue' },
            { icon: Briefcase, label: 'Minha Carteira', to: '/portfolio', color: 'emerald' },
            { icon: Newspaper, label: 'Últimas Notícias', to: '/news', color: 'purple' },
            { icon: Award, label: 'Rankings', to: '/ranking', color: 'amber' },
            { icon: Calendar, label: 'Dividendos', to: '/dividends', color: 'pink' },
            { icon: Award, label: 'Recomendadas', to: '/recommended', color: 'indigo' },
            { icon: BarChart3, label: 'Calculadoras', to: '/calculators', color: 'cyan' },
            { icon: Shield, label: 'Renda Fixa', to: '/renda-fixa', color: 'orange' },
          ].map((item, idx) => (
            <Link key={idx} to={item.to} className="flex flex-col p-5 rounded-2xl bg-[#0f172a] hover:bg-slate-800/50 transition-all group border border-slate-800 hover:border-slate-700 gap-3 shadow-sm">
              <div className={`w-10 h-10 rounded-xl bg-slate-800/50 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <item.icon size={20} className="text-slate-400 group-hover:text-white transition-colors" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-medium text-sm">{item.label}</span>
                <ChevronRight size={16} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
