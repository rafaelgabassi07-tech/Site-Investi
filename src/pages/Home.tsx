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
    <div className="space-y-8 pb-20 max-w-lg mx-auto md:max-w-4xl lg:max-w-5xl">
      {/* Header / Greeting */}
      <header className="px-4 pt-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white tracking-tight">
            Boa tarde, <span className="text-blue-500">{displayName}</span>!
          </h2>
          <div className="flex items-center gap-3">
             <Logo size={32} showText={false} />
          </div>
        </div>

        {/* Branding Message */}
        <div className="bg-blue-600/5 border border-blue-500/10 rounded-2xl p-6 text-center space-y-2">
           <Logo size={40} showText={false} className="mx-auto mb-2" />
           <h3 className="text-display-xs text-white">Ajudamos você a investir melhor</h3>
           <p className="text-tiny text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
             Pesquise pelo ativo desejado para ter acesso a cotação, fundamentos e gráficos em tempo real.
           </p>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="px-4 space-y-6">
        
        {/* Portfolio Summary Card (Liberdade Financeira) */}
        <section className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-6 relative overflow-hidden group shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white/60 uppercase tracking-widest italic">Liberdade Financeira</h3>
              <ChevronRight className="icon-xs text-slate-700" />
            </div>
            <button 
              onClick={() => setShowValues(!showValues)}
              className="p-2 text-slate-600 hover:text-white transition-colors"
            >
              {showValues ? <Eye className="icon-sm" /> : <EyeOff className="icon-sm" />}
            </button>
          </div>
          
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">{portfolioStats.count} ativos</span>
            </div>
            <div className="w-px h-3 bg-white/5" />
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">
                {showValues ? `R$ ${portfolioStats.total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'R$ ••••••'}
              </span>
            </div>
            <div className="w-px h-3 bg-white/5" />
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${portfolioStats.change >= 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
               <span className="text-[10px] font-black italic">
                 {showValues ? `${portfolioStats.change >= 0 ? '+' : ''}${portfolioStats.change.toFixed(2)}%` : '•••%'}
               </span>
               <TrendingUp className="icon-xxs" />
            </div>
          </div>
          
          <Link to="/portfolio" className="absolute inset-0 z-0" />
        </section>

        {/* Search Bar (Re-integrated) */}
        <section className="relative">
          <div className="relative flex items-center w-full bg-[#0A0A0A] border border-white/5 rounded-2xl shadow-xl focus-within:border-blue-500/30 transition-all p-1.5 overflow-hidden group">
            <div className="pl-3 text-slate-600 group-focus-within:text-blue-500">
              <Search className="icon-sm" />
            </div>
            <input 
              type="text" 
              placeholder="Buscar ativos..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-none outline-none py-2 px-3 text-sm text-white placeholder:text-slate-700 font-bold tracking-tight"
            />
          </div>
          
          {/* Suggestions - Reuse current suggestions logic */}
          <AnimatePresence>
            {suggestions.length > 0 && (
               <motion.div 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: 10 }}
                 className="absolute w-full mt-2 bg-[#0A0A0A] border border-[#262626] rounded-2xl shadow-2xl z-50 overflow-hidden"
               >
                 {suggestions.map((s, idx) => (
                   <Link 
                     key={s.ticker} 
                     to={`/asset/${s.ticker}`}
                     className={`flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-all ${selectedIndex === idx ? 'bg-white/5' : ''}`}
                   >
                     <div className="flex items-center gap-3">
                       <span className="font-bold text-white text-sm">{s.ticker}</span>
                       <span className="text-xxs text-slate-500 font-bold uppercase">{s.name}</span>
                     </div>
                     <ChevronRight className="icon-xs text-slate-800" />
                   </Link>
                 ))}
               </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Rankings Quick Card */}
        <section className="bg-[#0A0A0A] border border-white/5 rounded-3xl overflow-hidden shadow-xl">
           <div className="p-5 border-b border-white/5 flex items-center gap-3">
             <Award className="icon-md text-amber-500" />
             <h3 className="text-sm font-bold text-white uppercase tracking-widest italic">Rankings</h3>
           </div>
           
           <div className="divide-y divide-white/5">
              {[
                { label: 'Ações', icon: TrendingUp, to: '/ranking?type=ACAO' },
                { label: 'FIIs', icon: Building2, to: '/ranking?type=FII' },
                { label: 'Stocks', icon: BarChart3, to: '/ranking?type=STOCK' },
                { label: 'Criptomoedas', icon: Bitcoin, to: '/ranking?type=CRYPTO' },
              ].map((item, idx) => (
                <Link key={idx} to={item.to} className="flex items-center justify-between p-5 hover:bg-white/5 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/5 text-slate-500 group-hover:text-white transition-colors">
                      <item.icon className="icon-sm" />
                    </div>
                    <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">{item.label}</span>
                  </div>
                  <ChevronRight className="icon-xs text-slate-700" />
                </Link>
              ))}
           </div>
           
           <Link to="/ranking" className="block p-4 text-center bg-white/5 hover:bg-white/10 transition-colors">
             <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] italic">Ver todos os rankings</span>
           </Link>
        </section>

        {/* Dividend Agenda Section */}
        <section className="space-y-4">
           <div className="flex items-center gap-3 px-2">
             <Calendar className="icon-md text-blue-500" />
             <h3 className="text-sm font-bold text-white uppercase tracking-widest italic">Agenda de Dividendos</h3>
           </div>
           
           <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 px-1">
             {dividendCategories.map((cat, idx) => (
               <button key={idx} className="flex-none px-6 py-2.5 bg-[#0A0A0A] border border-white/5 rounded-xl hover:border-blue-500/30 transition-all group flex items-center gap-2">
                 <span className="text-xs font-bold text-slate-400 group-hover:text-white transition-colors">{cat.label}</span>
               </button>
             ))}
           </div>
        </section>

        {/* News Section */}
        <section className="bg-[#0A0A0A] border border-white/5 rounded-3xl overflow-hidden shadow-xl">
           <div className="p-5 border-b border-white/5 flex items-center gap-3">
             <Newspaper className="icon-md text-emerald-500" />
             <h3 className="text-sm font-bold text-white uppercase tracking-widest italic">Notícias de hoje</h3>
           </div>
           
           <div className="p-2">
              <NewsWidget limit={4} compact />
           </div>
           
           <Link to="/news" className="block p-4 text-center border-t border-white/5 hover:bg-white/5 transition-colors">
             <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] italic">Ver todas as notícias</span>
           </Link>
        </section>

        {/* PRO Banner */}
        <button className="w-full relative overflow-hidden bg-gradient-to-r from-blue-900 via-indigo-900 to-black border border-blue-500/20 rounded-2xl p-4 md:p-6 flex items-center justify-between group">
           <div className="absolute inset-0 bg-blue-500/10 blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity" />
           <div className="flex items-center gap-4 relative z-10">
              <Star className="icon-md text-amber-400 fill-amber-400" />
              <div className="text-left">
                <span className="text-sm font-bold text-white">Liberar acesso aos benefícios PRO</span>
              </div>
           </div>
           <ChevronRight className="icon-sm text-white/40 group-hover:text-white relative z-10" />
        </button>

        {/* Meus Recursos Section */}
        <section className="space-y-4 pb-10">
           <h3 className="text-lg font-bold text-white tracking-tight px-2">Meus recursos</h3>
           <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl overflow-hidden">
              <div className="divide-y divide-white/5">
                {resourceItems.map((item, idx) => (
                  <Link key={idx} to={item.to} className="flex items-center justify-between p-5 hover:bg-white/5 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-blue-500 transition-colors">
                        <item.icon className="icon-sm" />
                      </div>
                      <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">{item.label}</span>
                    </div>
                    <ChevronRight className="icon-xs text-slate-700" />
                  </Link>
                ))}
              </div>
           </div>
        </section>

      </main>
    </div>
  );
}
