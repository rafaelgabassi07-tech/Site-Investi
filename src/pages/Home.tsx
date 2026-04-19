import { 
  TrendingUp, ArrowRight, Zap, Shield, BarChart3, Award, Calendar, Search, 
  Briefcase, Newspaper, ChevronRight, Loader2, GitCompare, Gauge, Info, 
  HelpCircle, Filter, Star, TrendingDown, Building2, DollarSign, 
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
        const [acoes, fiis] = await Promise.all([
          financeService.getRanking('Dividend Yield', 'ACAO'),
          financeService.getRanking('Dividend Yield', 'FII'),
        ]);
        setRankings({
          'ACAO': acoes.slice(0, 5),
          'FII': fiis.slice(0, 5),
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
    <div className="bg-slate-950 min-h-screen text-slate-100">
      <div className="max-w-lg mx-auto md:max-w-4xl lg:max-w-5xl space-y-6 pb-20">
      {/* Header / Greeting */}
      <header className="px-3 pt-8 space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl md:text-3xl font-display font-black text-white tracking-tight italic uppercase">
              Bem-vindo,
            </h2>
            <h1 className="text-3xl md:text-4xl font-display font-black text-blue-500 tracking-tight italic uppercase truncate max-w-[280px]">
              {displayName}
            </h1>
            <div className="flex items-center gap-2 pt-2">
              <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em] italic">Mercado Monitorado</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-white/5 rounded-3xl border border-white/5 backdrop-blur-md">
             <Logo size={24} showText={false} />
          </div>
        </div>

        {/* Branding Message - Geometric Design */}
        <div className="relative overflow-hidden bg-slate-900/50 border border-white/10 rounded-[2rem] p-8 text-center space-y-4 shadow-2xl backdrop-blur-xl">
           {/* Geometric Accents */}
           <div className="absolute top-0 right-0 w-24 h-24 border-t-2 border-r-2 border-blue-500/30 rounded-tr-[2rem]" />
           <div className="absolute bottom-0 left-0 w-24 h-24 border-b-2 border-l-2 border-blue-500/30 rounded-bl-[2rem]" />

           <div className="mx-auto w-32 h-32 relative flex items-center justify-center">
             <div className="absolute inset-0 border-2 border-blue-500/20 rotate-45" />
             <Logo size={64} showText={false} className="relative z-10" />
           </div>

           <div className="space-y-1">
             <h3 className="text-2xl font-display font-black text-white tracking-[0.05em] uppercase italic">Terminal <span className="text-blue-500">Nexus</span></h3>
             <div className="w-12 h-0.5 bg-blue-500/50 mx-auto" />
           </div>
           
           <p className="text-[11px] text-slate-400 font-bold max-w-[280px] mx-auto leading-relaxed uppercase tracking-[0.25em] italic">
             Arquitetura de dados para alta performance em investimentos.
           </p>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="px-1 space-y-4">
        
        {/* Portfolio Summary Card */}
        <section className="bg-slate-950/50 border border-white/10 rounded-[2rem] p-4 relative overflow-hidden group hover:border-blue-500/30 transition-all duration-300 shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-transparent pointer-events-none" />
          
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center gap-2">
              <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic tracking-wide">Patrimônio</h3>
            </div>
            <button 
              onClick={(e) => { e.preventDefault(); setShowValues(!showValues); }}
              className="p-1.5 text-slate-500 hover:text-white transition-all bg-white/5 rounded-full border border-white/10"
            >
              {showValues ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
          </div>
          
          <div className="flex flex-col gap-0.5 relative z-10">
            <span className="text-3xl md:text-4xl font-display font-black text-white leading-none tracking-tighter italic">
              {showValues ? `R$ ${portfolioStats.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ ••••••'}
            </span>
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                <Briefcase className="w-3 h-3 text-blue-500" />
                <span className="text-[10px] font-black text-slate-300 uppercase italic tracking-wider">{portfolioStats.count} Ativos</span>
              </div>
              <div className={`flex items-center gap-1 px-3 py-1 rounded-full border shadow-sm ${portfolioStats.change >= 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                 <span className="text-[9px] font-black italic">
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
        <section className="bg-slate-950/40 border border-white/10 rounded-[2rem] overflow-hidden shadow-sm hover:border-white/20 transition-all">
           <div className="p-6 border-b border-white/5 flex items-center justify-between">
             <div className="flex items-center gap-3">
               <Award className="w-5 h-5 text-amber-500" />
               <h3 className="text-[10px] font-black text-white uppercase tracking-widest italic">Rankings</h3>
             </div>
             <ChevronRight className="w-4 h-4 text-slate-600" />
           </div>
           
           <div className="divide-y divide-white/5">
              {[
                { label: 'Ações BR', icon: TrendingUp, to: '/ranking?type=ACAO' },
                { label: 'Fundos Imobiliários', icon: Building2, to: '/ranking?type=FII' },
                { label: 'Stocks (EUA)', icon: BarChart3, to: '/ranking?type=STOCK' },
              ].map((item, idx) => (
                <Link key={idx} to={item.to} className="flex items-center justify-between p-5 px-6 hover:bg-white/5 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 text-slate-400 group-hover:text-blue-500 transition-colors">
                      <item.icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold text-white transition-colors">{item.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
                </Link>
              ))}
           </div>
        </section>

        {/* News Section */}
        <section className="bg-slate-950/40 border border-white/10 rounded-[2rem] overflow-hidden shadow-sm hover:border-white/20 transition-all">
           <div className="p-6 border-b border-white/5 flex items-center justify-between">
             <div className="flex items-center gap-3">
               <Newspaper className="w-5 h-5 text-blue-500" />
               <h3 className="text-[10px] font-black text-white uppercase tracking-widest italic">Radar do Mercado</h3>
             </div>
             <ChevronRight className="w-4 h-4 text-slate-600" />
           </div>
           
           <div className="p-2">
              <NewsWidget limit={4} compact />
           </div>
        </section>

        {/* Meus Recursos Section */}
        <section className="space-y-6">
           <h3 className="text-[10px] font-black text-slate-500 tracking-[0.3em] italic uppercase px-2">Navegação Rápida</h3>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {resourceItems.slice(0, 8).map((item, idx) => (
                <Link key={idx} to={item.to} className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 hover:border-blue-500/30 hover:bg-slate-900/80 transition-all text-center group">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-blue-400 transition-colors shadow-inner">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-black text-white uppercase tracking-widest leading-tight">{item.label}</span>
                </Link>
              ))}
           </div>
        </section>

      </main>
      </div>
    </div>
  );
}
