import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  History, 
  Newspaper, 
  Settings as SettingsIcon, 
  LogOut,
  TrendingUp,
  Menu,
  X,
  ChevronRight,
  Search,
  Award,
  Calendar,
  Filter,
  GitCompare,
  Shield,
  Zap,
  ChevronDown,
  Lightbulb,
  Wrench,
  Star,
  Building2,
  Bitcoin,
  BarChart3,
  Info
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

import { ErrorBoundary } from './ErrorBoundary';

import { Logo } from './ui/Logo';
import { MarketMarquee } from './MarketMarquee';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (searchQuery.length > 1) {
      const timer = setTimeout(async () => {
        try {
          const response = await fetch(`/api/search-suggestions?q=${encodeURIComponent(searchQuery)}`);
          const data = await response.json();
          setSuggestions(data);
          setShowSuggestions(true);
        } catch (err) {
          console.error('Error fetching suggestions:', err);
        }
      }, 200);
      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const navItems = [
    { 
      label: 'Ideias', 
      icon: Lightbulb,
      children: [
        { label: 'Agenda de Dividendos', to: '/portfolio/proventos', icon: Calendar },
        { label: 'Rankings', to: '/ranking', icon: Award },
        { label: 'Carteiras Recomendadas', to: '/recommended', icon: Star },
        { label: 'Comparador de Ativos', to: '/compare', icon: GitCompare },
      ]
    },
    { 
      label: 'Ativos', 
      icon: TrendingUp,
      children: [
        { label: 'Ações', to: '/ranking?type=ACAO', icon: TrendingUp },
        { label: 'FIIs', to: '/ranking?type=FII', icon: Building2 },
        { label: 'Stocks', to: '/ranking?type=STOCK', icon: TrendingUp },
        { label: 'Criptomoedas', to: '/ranking?type=CRYPTO', icon: Bitcoin },
        { label: 'Renda Fixa', to: '/renda-fixa', icon: Shield },
      ]
    },
    { 
      label: 'Ferramentas', 
      icon: Wrench,
      children: [
        { label: 'Busca Avançada', to: '/screener', icon: Filter },
        { label: 'Minha Carteira', to: '/portfolio', icon: Briefcase },
        { label: 'Calculadoras', to: '/calculators', icon: BarChart3 },
        { label: 'Imposto de Renda', to: '/taxes', icon: Shield },
      ]
    },
    { label: 'Notícias', to: '/news', icon: Newspaper },
    { label: 'Sobre', to: '/about', icon: Info },
  ];

  const scrollToSection = (id: string) => {
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          const offset = 100;
          const bodyRect = document.body.getBoundingClientRect().top;
          const elementRect = element.getBoundingClientRect().top;
          const elementPosition = elementRect - bodyRect;
          const offsetPosition = elementPosition - offset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }, 100);
    } else {
      const element = document.getElementById(id);
      if (element) {
        const offset = 100;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = element.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }
    setIsMenuOpen(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col selection:bg-blue-500/30">
      {/* Header Estilo Nexus */}
      <header className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
        scrolled ? 'bg-[#020617] border-b border-white/10 shadow-2xl' : 'bg-[#020617]'
      }`}>
        <div className="py-2.5 md:py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              {/* Logo Professional Style */}
              <Link to="/" className="flex items-center gap-3 group">
                <Logo size={40} showText />
              </Link>

            {/* Actions */}
            <div className="flex items-center gap-2 md:gap-4 ml-auto">
              {/* Search Bar (Desktop) */}
              <div className="hidden lg:block relative">
                <form onSubmit={handleSearch} className="flex items-center gap-2 px-4 py-2 bg-[#0f172a] border border-slate-800 rounded-xl focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all duration-300">
                  <Search className="icon-sm text-slate-500" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    placeholder="Buscar ativo..." 
                    className="bg-transparent border-none outline-none text-sm font-medium text-white placeholder:text-slate-500 w-40 xl:w-56"
                  />
                </form>

                <AnimatePresence>
                  {showSuggestions && suggestions.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-[#0f172a] border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl"
                    >
                      <div className="max-h-[240px] overflow-y-auto no-scrollbar">
                        {suggestions.map((s) => (
                          <Link 
                            key={s.ticker} 
                            to={`/asset/${s.ticker}`}
                            onClick={() => {
                              setSearchQuery('');
                              setShowSuggestions(false);
                            }}
                            className="flex items-center justify-between px-4 py-3 hover:bg-slate-800/50 transition-colors border-b border-slate-800/50 last:border-none"
                          >
                            <div>
                              <div className="font-bold text-white text-xs">{s.ticker}</div>
                              <div className="text-[10px] text-slate-500 truncate max-w-[120px]">{s.name}</div>
                            </div>
                            <div className="text-[9px] font-black text-slate-600 uppercase bg-slate-800 px-1 py-0.5 rounded">{s.type}</div>
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Search Button (Mobile) */}
              <button 
                onClick={() => navigate('/search')}
                className="lg:hidden p-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl border border-white/10 transition-all"
              >
                <Search className="icon-md" />
              </button>

              <Link 
                to="/settings" 
                className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all hidden sm:flex"
              >
                <SettingsIcon className="icon-md" />
              </Link>
              <button
                onClick={handleLogout}
                className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
              >
                <LogOut className="icon-sm" />
                Sair
              </button>
            </div>
          </div>
        </div>
        </div>
        <MarketMarquee />
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="md:hidden fixed inset-0 z-[200] bg-[#020617] flex flex-col"
          >
            <div className="p-6 flex items-center justify-between border-b border-white/10">
              <Logo size={40} showText />
              <button 
                className="p-2.5 text-slate-200 hover:bg-white/10 rounded-xl border border-white/10"
                onClick={() => setIsMenuOpen(false)}
              >
                <X size={24} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-6 space-y-2">
              {navItems.map((item, idx) => (
                <div key={item.label} className="space-y-1">
                  {item.children ? (
                    <>
                      <div className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{item.label}</div>
                      {item.children.map((child) => (
                        <Link
                          key={child.label}
                          to={child.to}
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center justify-between px-6 py-4 w-full text-left rounded-2xl font-bold text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-all border border-transparent"
                        >
                          <div className="flex items-center gap-4">
                            <child.icon size={18} className="text-blue-500" />
                            {child.label}
                          </div>
                          <ChevronRight size={14} className="text-slate-700" />
                        </Link>
                      ))}
                    </>
                  ) : (
                    <Link
                      to={item.to!}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-between px-6 py-4 w-full text-left rounded-2xl font-bold text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-all border border-transparent"
                    >
                      <div className="flex items-center gap-4">
                        <item.icon size={18} className="text-blue-500" />
                        {item.label}
                      </div>
                      <ChevronRight size={14} className="text-slate-700" />
                    </Link>
                  )}
                </div>
              ))}
              <div className="h-px bg-white/10 my-4" />
              <Link 
                to="/settings" 
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-4 px-6 py-5 rounded-2xl font-black uppercase tracking-widest text-xs text-slate-300 hover:bg-white/10 transition-all"
              >
                <SettingsIcon size={20} className="text-slate-500" /> Configurações
              </Link>
              <button 
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
                className="flex items-center gap-4 px-6 py-5 w-full text-left rounded-2xl font-black uppercase tracking-widest text-xs text-red-400 hover:bg-red-500/10 transition-all"
              >
                <LogOut size={20} /> Sair
              </button>
            </nav>

            <div className="p-8 border-t border-white/5 text-center">
              <p className="text-slate-600 text-[9px] font-black uppercase tracking-[0.3em]">Nexus Invest Engine v2.5</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 pt-28 md:pt-32 pb-24 md:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname.startsWith('/portfolio') ? 'portfolio-section' : location.pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <ErrorBoundary>
                <Outlet />
              </ErrorBoundary>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom Navigation Bar (Mobile) */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#020617]/90 backdrop-blur-2xl border-t border-white/5 z-[100] md:hidden h-[72px] pb-safe flex items-center">
        <div className="flex items-center justify-around w-full px-2">
          <Link to="/" className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all active:scale-95 ${location.pathname === '/' ? 'text-blue-500' : 'text-slate-500 hover:text-slate-300'}`}>
            <LayoutDashboard className={`icon-md ${location.pathname === '/' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[9px] font-black uppercase tracking-widest">Home</span>
          </Link>
          <Link to="/portfolio" className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all active:scale-95 ${location.pathname === '/portfolio' ? 'text-blue-500' : 'text-slate-500 hover:text-slate-300'}`}>
            <Briefcase className={`icon-md ${location.pathname === '/portfolio' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[9px] font-black uppercase tracking-widest">Carteira</span>
          </Link>
          <Link to="/search" className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all active:scale-95 ${location.pathname === '/search' ? 'text-blue-500' : 'text-slate-500 hover:text-slate-300'}`}>
            <Search className={`icon-md ${location.pathname === '/search' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[9px] font-black uppercase tracking-widest">Busca</span>
          </Link>
          <Link to="/ranking" className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all active:scale-95 ${location.pathname === '/ranking' ? 'text-blue-500' : 'text-slate-500 hover:text-slate-300'}`}>
            <TrendingUp className={`icon-md ${location.pathname === '/ranking' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[9px] font-black uppercase tracking-widest">Ranking</span>
          </Link>
          <button 
            onClick={() => setIsMenuOpen(true)}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all active:scale-95 ${isMenuOpen ? 'text-blue-500' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Menu className={`icon-md ${isMenuOpen ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[9px] font-black uppercase tracking-widest">Menu</span>
          </button>
        </div>
      </div>

      {/* Footer Tecnológico */}
      <footer className="bg-[#020617] border-t border-white/5 py-12 md:py-16 relative overflow-hidden">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-blue-600/5 blur-[100px] -z-10 rounded-full" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
            <div className="flex flex-col items-center md:items-start gap-4">
              <Link to="/" className="flex items-center gap-3 group">
                <Logo size={40} showText />
              </Link>
              <p className="text-slate-500 text-xs font-medium max-w-xs text-center md:text-left">
                A plataforma definitiva para acompanhamento de dados financeiros e gestão de patrimônio de alta performance.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-8">
              <div className="flex flex-col gap-4">
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Plataforma</span>
                <button onClick={() => scrollToSection('portfolio')} className="text-xs text-slate-500 hover:text-blue-400 transition-colors text-left">Carteira</button>
                <button onClick={() => scrollToSection('news')} className="text-xs text-slate-500 hover:text-blue-400 transition-colors text-left">Market Intelligence</button>
              </div>
              <div className="flex flex-col gap-4">
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Suporte</span>
                <Link to="/settings" className="text-xs text-slate-500 hover:text-blue-400 transition-colors">Configurações</Link>
                <a href="#" className="text-xs text-slate-500 hover:text-blue-400 transition-colors">Documentação API</a>
                <a href="#" className="text-xs text-slate-500 hover:text-blue-400 transition-colors">Status do Invest</a>
              </div>
            </div>
          </div>
          
          <div className="h-px bg-white/5 my-8" />
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">© 2026 Nexus Invest. Todos os direitos reservados.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-slate-600 hover:text-white transition-colors"><X size={16} /></a>
              <a href="#" className="text-slate-600 hover:text-white transition-colors"><SettingsIcon size={16} /></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
