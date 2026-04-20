import { 
  TrendingUp, ArrowRight, Zap, Shield, BarChart3, Award, Calendar, Search, 
  Briefcase, Newspaper, ChevronRight, Loader2, GitCompare, Gauge, Info, 
  HelpCircle, Filter, Star, TrendingDown, Building2, DollarSign, 
  Globe, X, Eye, EyeOff, Wallet, PieChart, Activity, BookOpen, Calculator, Layers, Cpu
} from 'lucide-react';
import { NewsWidget } from '../components/NewsWidget';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useState, useEffect, useMemo } from 'react';
import { financeService } from '../services/financeService';
import { usePortfolio } from '../hooks/usePortfolio';

import { Logo } from '../components/ui/Logo';
import { parseFinanceValue, formatNumber } from '../lib/utils';
import { nexusAI } from '../services/nexusAIService';
import { usePrivacy } from '../hooks/usePrivacy';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { portfolio, loading: loadingPortfolio } = usePortfolio();
  const { hideValues, toggleHideValues } = usePrivacy();
  const showValues = !hideValues;

  const [topGainers, setTopGainers] = useState<any[]>([]);
  const [rankings, setRankings] = useState<Record<string, any[]>>({});
  const [loadingRankings, setLoadingRankings] = useState(true);
  const [loadingGainers, setLoadingGainers] = useState(true);
  const [aiInsight, setAiInsight] = useState('Nexus Engine sincronizando telemetria de mercado...');
  
  useEffect(() => {
    async function fetchAI() {
      const insight = await nexusAI.getMarketSentiment();
      setAiInsight(insight);
    }
    fetchAI();
  }, []);

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Investidor';
  
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }, []);

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
    <div className="bg-background min-h-screen text-foreground transition-colors duration-500">
      <div className="space-y-6 pb-20">
      {/* Header / Greeting */}
      <header className="px-2 pt-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="nexus-hero !text-foreground">
              {greeting},
            </h2>
            <h1 className="nexus-hero text-blue-500 truncate max-w-[280px]">
              {displayName}
            </h1>
            <div className="flex items-center gap-2 pt-1">
              <div className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                <p className="nexus-label text-emerald-500 opacity-100">Mercado Monitorado</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-secondary rounded-2xl border border-border backdrop-blur-md">
             <Logo size={24} showText={false} />
          </div>
        </div>

        {/* Branding Message - Geometric Design */}
        <div className="relative overflow-hidden bg-card border border-border rounded-2xl md:rounded-xl md:rounded-2xl p-5 text-center space-y-4 shadow-2xl backdrop-blur-xl group hover:border-blue-500/20 transition-all duration-700">
           {/* Geometric Accents */}
           <div className="absolute top-0 right-0 w-24 h-24 border-t-2 border-r-2 border-blue-500/10 rounded-tr-2xl md:rounded-tr-[2rem] group-hover:scale-110 transition-transform duration-700" />
           <div className="absolute bottom-0 left-0 w-24 h-24 border-b-2 border-l-2 border-blue-500/10 rounded-bl-2xl md:rounded-bl-[2rem] group-hover:scale-110 transition-transform duration-700" />

           <div className="mx-auto w-24 h-24 relative flex items-center justify-center">
             <div className="absolute inset-0 border-2 border-blue-500/10 rotate-45 group-hover:rotate-90 transition-transform duration-1000" />
             <div className="absolute inset-1 border border-blue-500/5 -rotate-12 group-hover:rotate-12 transition-transform duration-1000" />
             <Logo size={48} showText={false} className="relative z-10 drop-shadow-[0_0_15px_rgba(59,130,246,0.2)]" />
           </div>

           <div className="space-y-1">
             <h3 className="text-xl font-display font-black text-foreground tracking-widest uppercase italic">Terminal <span className="text-blue-500">Nexus</span></h3>
             <div className="w-8 h-0.5 bg-blue-500/50 mx-auto rounded-full" />
           </div>
           
           <p className="text-[8px] md:text-[9px] text-muted-foreground font-black max-w-[240px] mx-auto leading-tight uppercase tracking-widest italic">
             Arquitetura de dados para alta performance em investimentos.
           </p>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="px-3 md:px-0 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
        {/* Portfolio Summary Card - PREMIUM REDESIGN */}
        <section className="nexus-card">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/[0.03] via-transparent to-transparent pointer-events-none" />
          
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                <Wallet className="w-4 h-4" />
              </div>
              <h3 className="nexus-label">Patrimônio Total</h3>
            </div>
            <button 
              onClick={(e) => { e.preventDefault(); toggleHideValues(); }}
              className="p-2 text-muted-foreground hover:text-foreground transition-all bg-secondary rounded-xl border border-border shadow-sm active:scale-90"
            >
              {showValues ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
          </div>
          
          <div className="flex flex-col gap-1 relative z-10">
            <span className="nexus-hero leading-tight tracking-tighter">
              {showValues ? formatNumber(portfolioStats.total, { style: 'currency' }) : 'R$ ••••••'}
            </span>
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary rounded-xl border border-border shadow-sm">
                <Briefcase className="w-3.5 h-3.5 text-blue-500" />
                <span className="nexus-label text-foreground">{portfolioStats.count} Ativos em Custódia</span>
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border shadow-sm transition-all duration-500 font-bold ${ (portfolioStats.change || 0) >= 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                 <span className="text-xs uppercase tracking-widest italic">
                   {showValues ? `${(portfolioStats.change || 0) >= 0 ? '+' : ''}${formatNumber(portfolioStats.change || 0)}% Histórico` : '•••%'}
                 </span>
                 {(portfolioStats.change || 0) >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              </div>
            </div>
          </div>
          
          {portfolio && portfolio.length > 0 && showValues && (
            <div className="mt-8 pt-8 border-t border-border flex gap-3 overflow-x-auto pb-4 scrollbar-hide no-scrollbar relative z-10">
              {portfolio.slice(0, 4).map((item, idx) => (
                <div key={idx} className="flex-shrink-0 px-5 py-3 bg-secondary rounded-2xl border border-border flex items-center gap-4 hover:border-blue-500/20 transition-colors">
                  <div className="w-8 h-8 rounded-xl bg-background flex items-center justify-center border border-border">
                     <span className="text-[9px] font-black italic">{item.ticker.slice(0, 2)}</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-foreground italic uppercase">{item.ticker}</p>
                    <p className={`text-[9px] font-bold ${(item.profitPercentage || 0) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {(item.profitPercentage || 0) >= 0 ? '+' : ''}{formatNumber(item.profitPercentage || 0)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <Link to="/portfolio" className="absolute inset-0 z-0" />
        </section>

        {/* Search Bar */}
        <section className="relative px-2">
          <div className="relative flex items-center w-full bg-card border border-border rounded-3xl shadow-2xl focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-500/40 transition-all p-2.5 overflow-hidden group">
            <div className="absolute inset-0 bg-blue-500/[0.01] opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <div className="relative pl-3 text-muted-foreground group-focus-within:text-blue-500 transition-colors">
              <Search className="w-6 h-6" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse opacity-0 group-focus-within:opacity-100" />
            </div>
            <input 
              type="text" 
              placeholder="Nexus Search: Pesquisar ativos, BDRs, FIIs..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-none outline-none py-3 px-4 text-sm md:text-base text-foreground placeholder:text-muted-foreground/50 font-bold tracking-tight relative z-10"
            />
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-secondary border border-border rounded-xl text-[10px] font-black text-muted-foreground uppercase italic opacity-40 group-hover:opacity-100 transition-opacity">
              <span>⌘ K</span>
            </div>
          </div>
          
          {/* Suggestions */}
          <AnimatePresence>
            {suggestions.length > 0 && (
               <motion.div 
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.95 }}
                 className="absolute w-full mt-2 bg-popover border border-border rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-3xl"
               >
                 {suggestions.map((s, idx) => (
                   <Link 
                     key={s.ticker} 
                     to={`/asset/${s.ticker}`}
                     className={`flex items-center justify-between px-6 py-4 hover:bg-secondary transition-all ${selectedIndex === idx ? 'bg-secondary' : ''}`}
                   >
                     <div className="flex items-center gap-4">
                       <span className="font-display font-black text-foreground text-base italic uppercase">{s.ticker}</span>
                       <span className="text-[10px] text-muted-foreground font-bold uppercase truncate max-w-[200px]">{s.name}</span>
                     </div>
                     <ChevronRight className="icon-sm text-muted-foreground" />
                   </Link>
                 ))}
               </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Rankings Quick Card */}
        <section className="nexus-card !p-0 overflow-hidden">
           <div className="p-5 border-b border-border flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                 <Award className="w-4 h-4" />
               </div>
               <h3 className="nexus-label">Top Dividendos (Nexus Engine)</h3>
             </div>
             <Link to="/ranking" className="px-3 py-1 bg-secondary rounded-full border border-border">
                <p className="nexus-label opacity-60">Filtrar Rankings</p>
             </Link>
           </div>
           
           <div className="divide-y divide-border">
              {loadingRankings ? (
                <div className="p-8 flex justify-center">
                  <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                </div>
              ) : (
                [...(rankings['ACAO'] || []), ...(rankings['FII'] || [])]
                  .sort((a, b) => {
                    const dyA = parseFloat((a.raw?.dividendYield || a.value || '0').toString().replace('%', '').replace(',', '.')) || 0;
                    const dyB = parseFloat((b.raw?.dividendYield || b.value || '0').toString().replace('%', '').replace(',', '.')) || 0;
                    return dyB - dyA;
                  })
                  .slice(0, 4)
                  .map((item, idx) => {
                    const dyValue = parseFloat((item.raw?.dividendYield || item.value || '0').toString().replace('%', '').replace(',', '.')) || 0;
                    return (
                    <Link key={idx} to={`/asset/${item.ticker}`} className="flex items-center justify-between p-5 px-6 hover:bg-secondary transition-colors group/item relative">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                      <div className="flex items-center gap-4 relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center border border-border text-muted-foreground group-hover/item:text-blue-500 group-hover/item:border-blue-500/20 transition-all shadow-inner">
                          {item.type === 'ACAO' ? <TrendingUp className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                        </div>
                        <div>
                          <span className="nexus-title text-sm group-hover/item:text-blue-400 block transition-colors">{item.ticker}</span>
                          <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest block truncate max-w-[120px] sm:max-w-xs">{item.name}</span>
                        </div>
                      </div>
                      <div className="text-right relative z-10">
                        <p className="text-[12px] font-black text-emerald-500 italic uppercase">DY {formatNumber(dyValue)}%</p>
                        <ChevronRight className="w-4 h-4 text-muted-foreground float-right group-hover/item:text-foreground group-hover/item:translate-x-1 transition-all mt-1" />
                      </div>
                    </Link>
                  )})
              )}
           </div>
        </section>
        </div> {/* End of lg:col-span-2 */}

        <div className="space-y-6">
        {/* News Section */}
        <section className="nexus-card !p-0 overflow-hidden">
           <div className="p-5 border-b border-border flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                 <Newspaper className="w-4 h-4" />
               </div>
               <h3 className="nexus-label">Radar do Mercado</h3>
             </div>
             <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-all" />
           </div>
           
           <div className="p-1">
              <NewsWidget limit={4} compact />
           </div>
        </section>
        </div> {/* End of lg:col-span-1 */}
        </div> {/* End of grid grid-cols-1 lg:grid-cols-3 */}

        {/* Meus Recursos Section */}
        <section className="space-y-6 pt-4">
           <div className="flex items-center justify-between px-2">
             <h3 className="nexus-label tracking-[0.3em] italic uppercase">Ferramentas</h3>
             <div className="w-8 h-0.5 bg-blue-500/20 rounded-full" />
           </div>
           <div className="nexus-grid">
              {resourceItems.slice(0, 8).map((item, idx) => (
                <Link key={idx} to={item.to} className="nexus-card flex flex-col items-center justify-center gap-4 hover:border-blue-500/30 hover:bg-slate-900/40 text-center group shadow-md hover:shadow-xl hover:-translate-y-1 duration-300">
                  <div className="w-14 h-14 bg-secondary rounded-[1.25rem] flex items-center justify-center text-muted-foreground group-hover:text-blue-500 group-hover:scale-110 transition-all shadow-inner border border-border group-hover:border-blue-500/20">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <span className="nexus-title leading-tight transition-colors">{item.label}</span>
                </Link>
              ))}
           </div>
        </section>

      </main>
      </div>
    </div>
  );
}
