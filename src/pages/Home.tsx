import { 
  TrendingUp, ArrowRight, Zap, Shield, BarChart3, Award, Calendar, Search, 
  Briefcase, Newspaper, ChevronRight, Loader2, GitCompare, Gauge, Info, 
  HelpCircle, Filter, Star, TrendingDown, Bitcoin, Building2, DollarSign, 
  Globe, X, Eye, EyeOff, Wallet, PieChart, Activity, BookOpen, Calculator, Layers
} from 'lucide-react';
import { NewsWidget } from '../components/NewsWidget';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useState, useEffect, useMemo } from 'react';
import { financeService } from '../services/financeService';
import { usePortfolio } from '../hooks/usePortfolio';

import { Logo } from '../components/ui/Logo';
import { parseFinanceValue } from '../lib/utils';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { portfolio, loading: loadingPortfolio } = usePortfolio();

  // Removed hardcoded light theme

  const [topGainers, setTopGainers] = useState<any[]>([]);
  const [rankings, setRankings] = useState<Record<string, any[]>>({});
  const [loadingRankings, setLoadingRankings] = useState(true);
  const [loadingGainers, setLoadingGainers] = useState(true);
  const [showValues, setShowValues] = useState(true);

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Investidor';

  // Portfolio Stats
  const portfolioStats = useMemo(() => {
    if (!portfolio || portfolio.length === 0) return { total: 0, change: 0, count: 0 };
    
    const total = portfolio.reduce((acc, item) => acc + (item.currentValue || item.totalInvested), 0);
    const invested = portfolio.reduce((acc, item) => acc + item.totalInvested, 0);
    const change = invested > 0 ? ((total / invested) - 1) * 100 : 0;
    
    return {
      total,
      change,
      count: portfolio.length
    };
  }, [portfolio]);

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

  useEffect(() => {
    const fetchRankings = async () => {
      setLoadingRankings(true);
      try {
        const [acoes, fiis, cryptos] = await Promise.all([
          financeService.getRanking('Dividend Yield', 'ACAO'),
          financeService.getRanking('Dividend Yield', 'FII'),
          financeService.getRanking('Market Cap', 'ACAO')
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

  const resourceItems = [
    { icon: Search, label: 'Busca de Ativos', to: '/search' },
    { icon: Briefcase, label: 'Minha Carteira', to: '/portfolio' },
    { icon: Newspaper, label: 'Últimas Notícias', to: '/news' },
    { icon: Award, label: 'Rankings', to: '/ranking' },
    { icon: Calendar, label: 'Agenda de Dividendos', to: '/portfolio/proventos' },
    { icon: Star, label: 'Carteiras Recomendadas', to: '/recommended' },
    { icon: Calculator, label: 'Calculadoras', to: '/calculators' },
    { icon: BookOpen, label: 'Guia do Iniciante', to: '/beginners' },
  ];

  const dividendCategories = [
    { id: 'ACAO', label: 'Ações', icon: TrendingUp },
    { id: 'FII', label: 'FIIs', icon: Building2 },
    { id: 'STOCK', label: 'Stocks', icon: BarChart3 },
    { id: 'REIT', label: 'REITs', icon: Building2 },
    { id: 'BDR', label: 'BDRs', icon: Globe },
    { id: 'ETF', label: 'ETFs', icon: Layers },
  ];

  return (
    <div className="space-y-4 pb-12 max-w-lg mx-auto md:max-w-4xl lg:max-w-5xl">
      {/* Header / Greeting */}
      <header className="px-4 pt-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-display font-black text-slate-900 dark:text-white tracking-tight italic uppercase">
              Bem-vindo, <span className="text-blue-600">{displayName}</span>
            </h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Status da Carteira: <span className="text-emerald-500">Monitorado</span></p>
          </div>
          <div className="flex items-center gap-2">
             <Logo size={32} showText={false} />
          </div>
        </div>

        {/* Branding Message */}
        <div className="bg-blue-600/5 border border-blue-600/10 rounded-[2rem] p-8 text-center space-y-3 shadow-sm">
           <Logo size={40} showText={false} className="mx-auto mb-2" />
           <h3 className="text-xl font-display font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">O Futuro dos seus Investimentos</h3>
           <p className="text-xs text-slate-500 font-bold max-w-sm mx-auto leading-relaxed">
             Análise de fundamentos, proventos e cotações em tempo real com o motor de inteligência Nexus.
           </p>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="px-4 space-y-6">
        
        {/* Portfolio Summary Card (Liberdade Financeira) */}
        <section className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 shadow-xl shadow-slate-200/50 dark:shadow-blue-900/10 rounded-[2rem] p-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/5 to-transparent pointer-events-none" />
          
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center gap-2">
              <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest italic">Patrimônio Consolidado</h3>
              <ChevronRight className="icon-xs text-slate-300 dark:text-slate-700" />
            </div>
            <button 
              onClick={() => setShowValues(!showValues)}
              className="p-1 px-2 text-slate-400 hover:text-blue-600 transition-colors bg-slate-50 dark:bg-white/5 rounded-full"
            >
              {showValues ? <Eye className="icon-xs" /> : <EyeOff className="icon-xs" />}
            </button>
          </div>
          
          <div className="flex flex-col gap-1 relative z-10">
            <span className="text-display-lg text-slate-900 dark:text-white leading-none tracking-tighter">
              {showValues ? `R$ ${portfolioStats.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ ••••••'}
            </span>
            <div className="flex items-center gap-3 mt-4">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 dark:bg-white/10 rounded-full border border-slate-100 dark:border-white/5 shadow-sm">
                <Briefcase className="w-3 h-3 text-blue-500" />
                <span className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase italic">{portfolioStats.count} Ativos</span>
              </div>
              <div className={`flex items-center gap-1 px-3 py-1 rounded-full border shadow-sm transition-all duration-500 ${portfolioStats.change >= 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'}`}>
                 <span className="text-[10px] font-black italic">
                   {showValues ? `${portfolioStats.change >= 0 ? '+' : ''}${portfolioStats.change.toFixed(2)}%` : '•••%'}
                 </span>
                 {portfolioStats.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              </div>
            </div>
          </div>
          
          <Link to="/portfolio" className="absolute inset-0 z-0" />
        </section>

        {/* Search Bar */}
        <section className="relative">
          <div className="relative flex items-center w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm focus-within:bg-white dark:focus-within:bg-slate-900/60 focus-within:border-blue-500/30 transition-all p-2 overflow-hidden group">
            <div className="pl-3 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors">
              <Search className="w-5 h-5" />
            </div>
            <input 
              type="text" 
              placeholder="Pesquisar ativos na B3 ou Exterior..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-none outline-none py-2 px-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 font-bold tracking-tight"
            />
          </div>
          
          {/* Suggestions */}
          <AnimatePresence>
            {suggestions.length > 0 && (
               <motion.div 
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.95 }}
                 className="absolute w-full mt-2 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
               >
                 {suggestions.map((s, idx) => (
                   <Link 
                     key={s.ticker} 
                     to={`/asset/${s.ticker}`}
                     className={`flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:bg-white/5 transition-all ${selectedIndex === idx ? 'bg-slate-50 dark:bg-white/5' : ''}`}
                   >
                     <div className="flex items-center gap-4">
                       <span className="font-display font-black text-slate-900 dark:text-white text-base italic uppercase">{s.ticker}</span>
                       <span className="text-[10px] text-slate-500 font-bold uppercase truncate max-w-[200px]">{s.name}</span>
                     </div>
                     <ChevronRight className="icon-sm text-slate-200" />
                   </Link>
                 ))}
               </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Rankings Quick Card */}
        <section className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-[2rem] overflow-hidden shadow-sm">
           <div className="p-6 border-b border-slate-100 flex items-center gap-3">
             <Award className="w-5 h-5 text-amber-500" />
             <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest italic">Rankings de Performance</h3>
           </div>
           
           <div className="divide-y divide-slate-100">
              {[
                { label: 'Ações BR', icon: TrendingUp, to: '/ranking?type=ACAO' },
                { label: 'Fundos Imobiliários', icon: Building2, to: '/ranking?type=FII' },
                { label: 'Stocks (EUA)', icon: BarChart3, to: '/ranking?type=STOCK' },
                { label: 'Criptoativos', icon: Bitcoin, to: '/ranking?type=CRYPTO' },
              ].map((item, idx) => (
                <Link key={idx} to={item.to} className="flex items-center justify-between p-5 px-6 hover:bg-slate-50 dark:bg-white/5 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center border border-slate-100 text-slate-400 group-hover:text-blue-500 transition-colors">
                      <item.icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 dark:text-white transition-colors">{item.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-slate-400 transition-colors" />
                </Link>
              ))}
           </div>
           
           <Link to="/ranking" className="block p-4 text-center bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:bg-white/5 transition-colors border-t border-slate-100">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Explorar Rankings Completos</span>
           </Link>
        </section>

        {/* News Section */}
        <section className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-[2rem] overflow-hidden shadow-sm">
           <div className="p-6 border-b border-slate-100 flex items-center gap-3">
             <Newspaper className="w-5 h-5 text-blue-600" />
             <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest italic">Radar do Mercado</h3>
           </div>
           
           <div className="p-2">
              <NewsWidget limit={4} compact />
           </div>
           
           <Link to="/news" className="block p-4 text-center bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:bg-white/5 transition-colors border-t border-slate-100">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Últimas Notícias Financeiras</span>
           </Link>
        </section>

        {/* Meus Recursos Section */}
        <section className="space-y-4 pb-12">
           <h3 className="text-lg font-display font-black text-slate-900 dark:text-white tracking-tight italic uppercase px-2">Explorar Nexus</h3>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {resourceItems.slice(0, 8).map((item, idx) => (
                <Link key={idx} to={item.to} className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 hover:border-blue-500/20 hover:shadow-lg transition-all text-center group">
                  <div className="w-10 h-10 bg-slate-50 dark:bg-white/5 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest group-hover:text-slate-900 dark:text-white">{item.label}</span>
                </Link>
              ))}
           </div>
        </section>

      </main>
    </div>
  );
}
