import { TrendingUp, ArrowRight, Zap, Shield, BarChart3, Award, Calendar, Search, Briefcase, Newspaper, ChevronRight, Loader2, GitCompare, Gauge, Info, HelpCircle, Filter, Star, TrendingDown, Bitcoin, Building2, DollarSign, Globe, X } from 'lucide-react';
import { NewsWidget } from '../components/NewsWidget';
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

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  useEffect(() => {
    if (searchQuery.length > 1) {
      const timer = setTimeout(async () => {
        try {
          const response = await fetch(`/api/search-suggestions?q=${encodeURIComponent(searchQuery)}`);
          const data = await response.json();
          setSuggestions(data);
          setSelectedIndex(-1);
        } catch (err) {
          console.error('Error fetching suggestions:', err);
        }
      }, 200);
      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
      setSelectedIndex(-1);
    }
  }, [searchQuery]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > -1 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        navigate(`/asset/${suggestions[selectedIndex].ticker}`);
        setSearchQuery('');
        setSuggestions([]);
      } else if (searchQuery) {
        navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
        setSuggestions([]);
      }
    } else if (e.key === 'Escape') {
      setSuggestions([]);
    }
  };

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
      {/* Hero Section */}
      <section className="pt-8 md:pt-12">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center mb-6"
          >
            <Logo size={64} showText className="flex-col gap-3" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-3"
          >
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter leading-none uppercase italic">
              Ajudamos você a <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400 drop-shadow-[0_0_15px_rgba(37,99,235,0.3)]">investir melhor</span>
            </h1>
            <p className="text-slate-400 text-base md:text-lg max-w-xl mx-auto font-bold tracking-tight opacity-80">
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
                placeholder="Busque ativos (ex: PETR4, VALE3, BTC)..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 min-w-0 bg-transparent border-none outline-none py-3 px-3 text-sm md:text-lg text-white placeholder:text-slate-600"
              />
              <button 
                onClick={() => {
                  if (searchQuery) navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
                }}
                className="flex-shrink-0 bg-blue-600 hover:bg-blue-500 text-white px-4 md:px-6 py-2 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 text-xs md:text-sm"
              >
                Pesquisar
              </button>
            </div>
            
            {/* Suggestions */}
            <AnimatePresence>
              {suggestions.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute w-full mt-2 bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl"
                >
                  <div className="p-2 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Sugestões Inteligentes</span>
                    <span className="text-[10px] text-slate-600 px-2">↑↓ para navegar</span>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto no-scrollbar">
                    {suggestions.map((s, idx) => (
                      <Link 
                        key={s.ticker} 
                        to={`/asset/${s.ticker}`}
                        onClick={() => {
                          setSearchQuery('');
                          setSuggestions([]);
                        }}
                        className={`flex items-center justify-between px-4 py-3 transition-all ${
                          selectedIndex === idx ? 'bg-blue-600/20 border-l-4 border-blue-500' : 'hover:bg-slate-800/50 border-l-4 border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-white border border-slate-700">
                            {s.ticker.substring(0, 2)}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm flex items-center gap-2">
                              {s.ticker}
                              {s.price && <span className="text-[10px] font-mono text-slate-400">R$ {s.price}</span>}
                            </div>
                            <div className="text-xs text-slate-500 truncate max-w-[200px]">{s.name}</div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div className="text-[10px] font-black text-slate-600 uppercase tracking-tighter bg-slate-800 px-1.5 py-0.5 rounded">{s.type}</div>
                          {s.change && (
                            <span className={`text-[10px] font-bold ${s.positive ? 'text-emerald-500' : 'text-red-500'}`}>
                              {s.change}
                            </span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                  {searchQuery && (
                    <Link 
                      to={`/search?q=${encodeURIComponent(searchQuery)}`}
                      className="block p-3 text-center text-xs font-bold text-blue-500 hover:bg-blue-500/10 transition-colors border-t border-slate-800"
                    >
                      Ver todos os resultados para "{searchQuery}"
                    </Link>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            
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
                      <stat.icon className="icon-sm" />
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
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden group shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 blur-[120px] -z-10 group-hover:bg-blue-600/10 transition-all duration-1000" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-blue-600/10 flex items-center justify-center border border-blue-500/20 shadow-lg shadow-blue-500/5">
                <Gauge className="icon-lg text-blue-500" />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-white tracking-tighter uppercase">Nexus Sentiment</h2>
                <p className="text-label">Análise de Medo & Ganância</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Atualizado agora</span>
              </div>
              <button 
                onClick={() => setShowSentimentInfo(true)}
                className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-all border border-white/10"
              >
                <HelpCircle className="icon-md" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="relative flex flex-col items-center">
              <div className="relative w-full max-w-[280px] aspect-[2/1]">
                <svg className="w-full h-full" viewBox="0 0 100 50">
                  <path 
                    d="M 10 50 A 40 40 0 0 1 90 50" 
                    fill="none" 
                    stroke="rgba(255,255,255,0.05)" 
                    strokeWidth="10" 
                    strokeLinecap="round"
                  />
                  
                  <defs>
                    <linearGradient id="nexusSentimentGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ef4444" />
                      <stop offset="40%" stopColor="#f59e0b" />
                      <stop offset="60%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>
                  
                  <path 
                    d="M 10 50 A 40 40 0 0 1 90 50" 
                    fill="none" 
                    stroke="url(#nexusSentimentGradient)" 
                    strokeWidth="10" 
                    strokeLinecap="round"
                    strokeDasharray="125.6"
                    strokeDashoffset={125.6 - (sentiment.score / 100) * 125.6}
                    className="transition-all duration-[2000ms] ease-out"
                  />
                </svg>
                
                <motion.div 
                  initial={{ rotate: -90 }}
                  animate={{ rotate: (sentiment.score / 100) * 180 - 90 }}
                  transition={{ duration: 2, ease: "easeOut" }}
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-32 origin-bottom z-10"
                >
                  <div className="w-full h-full bg-gradient-to-t from-white to-transparent rounded-full shadow-[0_0_20px_rgba(255,255,255,0.5)]" />
                </motion.div>
                
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-8 bg-slate-900 border-4 border-white/20 rounded-full z-20 shadow-2xl" />
              </div>
              
              <div className="mt-6 flex justify-between w-full max-w-[280px] px-2">
                <span className="text-[9px] font-black text-red-500/60 uppercase tracking-widest">Medo</span>
                <span className="text-[9px] font-black text-emerald-500/60 uppercase tracking-widest">Ganância</span>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                  sentiment.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400' : sentiment.color === 'red' ? 'bg-red-500/10 text-red-400' : 'bg-slate-500/10 text-slate-400'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                    sentiment.color === 'emerald' ? 'bg-emerald-500' : sentiment.color === 'red' ? 'bg-red-500' : 'bg-slate-500'
                  }`} />
                  {sentiment.label}
                </div>
                <h3 className="text-6xl font-display font-bold text-white tracking-tighter leading-none">
                  {sentiment.score}
                </h3>
              </div>
              
              <p className="text-slate-400 text-sm leading-relaxed font-medium italic">
                "{sentiment.desc}"
              </p>
              
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Ontem</p>
                  <p className="text-sm font-bold text-slate-300">42 <span className="text-[10px] font-medium opacity-60">Medo</span></p>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Semana Passada</p>
                  <p className="text-sm font-bold text-slate-300">58 <span className="text-[10px] font-medium opacity-60">Neutro</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="flex-1 bg-blue-600/10 border border-blue-500/20 rounded-[2.5rem] p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <Zap className="icon-3xl text-blue-500" />
            </div>
            <h4 className="text-xs font-black text-blue-400 uppercase tracking-[0.2em] mb-4">Nexus Insight</h4>
            <p className="text-slate-200 text-base font-bold leading-tight tracking-tight mb-4">
              "A diversificação inteligente é a única ferramenta gratuita no mercado financeiro."
            </p>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              O sentimento atual sugere cautela em ativos de alta volatilidade. Considere rebalancear sua exposição.
            </p>
          </div>

          <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 flex items-center justify-between group cursor-pointer hover:border-white/10 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-blue-400 transition-colors">
                <Newspaper className="icon-lg" />
              </div>
              <div>
                <p className="text-label">Market News</p>
                <p className="text-sm font-bold text-white">Últimas do Mercado</p>
              </div>
            </div>
            <ArrowRight className="icon-md text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </section>
      
      {/* Rankings Section - Enhanced with Tabs and Real Data */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
              <Award className="icon-md text-blue-500" />
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
          <div className="md:col-span-2 overflow-hidden">
            <div className="mb-4 flex items-center justify-between">
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
              className="relative w-full max-w-xl bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-8 md:p-12 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <button 
                onClick={() => setShowSentimentInfo(false)}
                className="absolute top-8 right-8 w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-full transition-all border border-white/10"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-6 mb-10">
                <div className="w-16 h-16 rounded-[1.5rem] bg-blue-600/10 flex items-center justify-center border border-blue-500/20 shadow-lg shadow-blue-500/5">
                  <Info size={32} className="text-blue-500" />
                </div>
                <div>
                  <h3 className="text-2xl font-display font-bold text-white tracking-tighter uppercase">Nexus Sentiment</h3>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Metodologia de Cálculo</p>
                </div>
              </div>

              <div className="space-y-8">
                <p className="text-slate-400 text-sm leading-relaxed font-medium">
                  Nosso índice de sentimento é uma métrica proprietária que analisa o comportamento do mercado em tempo real através de 4 pilares fundamentais, ponderados por relevância:
                </p>

                <div className="grid gap-4">
                  {[
                    { 
                      title: 'Momentum do Mercado (60%)', 
                      desc: 'Desempenho relativo do Ibovespa e S&P 500. Tendências de alta sinalizam apetite por risco elevado.',
                      icon: TrendingUp,
                      color: 'text-emerald-400',
                      bgColor: 'bg-emerald-500/5'
                    },
                    { 
                      title: 'Safe Haven Demand (20%)', 
                      desc: 'Fluxo de capital para o Dólar. Picos de valorização indicam busca por proteção e aversão ao risco.',
                      icon: Shield,
                      color: 'text-blue-400',
                      bgColor: 'bg-blue-500/5'
                    },
                    { 
                      title: 'Apetite por Risco (10%)', 
                      desc: 'Volatilidade e preço do Bitcoin. Ativos digitais servem como termômetro de liquidez global.',
                      icon: Zap,
                      color: 'text-amber-400',
                      bgColor: 'bg-amber-500/5'
                    },
                    { 
                      title: 'Estabilidade Real (10%)', 
                      desc: 'Comportamento do IFIX. Reflete a percepção de juros e estabilidade do mercado imobiliário interno.',
                      icon: Building2,
                      color: 'text-purple-400',
                      bgColor: 'bg-purple-500/5'
                    }
                  ].map((item, i) => (
                    <div key={i} className={`flex gap-5 p-6 ${item.bgColor} border border-white/5 rounded-[2rem] hover:border-white/10 transition-all group`}>
                      <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform`}>
                        <item.icon size={22} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-white mb-1 tracking-tight">{item.title}</h4>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => setShowSentimentInfo(false)}
                  className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-[2rem] font-bold transition-all shadow-xl shadow-blue-600/20 uppercase tracking-widest text-xs"
                >
                  Entendi, Nexus
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
            { icon: Calendar, label: 'Dividendos', to: '/portfolio/proventos', color: 'pink' },
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
