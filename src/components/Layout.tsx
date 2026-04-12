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
  BarChart3
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

import { ErrorBoundary } from './ErrorBoundary';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
        { label: 'Agenda de Dividendos', to: '/dividends', icon: Calendar },
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
        scrolled ? 'bg-[#020617]/80 backdrop-blur-2xl border-b border-white/10 py-3 shadow-2xl' : 'bg-transparent py-6'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo Professional Style */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 transition-all duration-300 group-hover:scale-105">
                <TrendingUp size={24} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-white leading-none">Nexus</span>
                <span className="text-[11px] font-medium text-blue-400 mt-0.5">Invest</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <div key={item.label} className="relative group">
                  {item.children ? (
                    <button className="px-4 py-2 rounded-lg text-sm font-bold transition-all text-slate-400 hover:text-white hover:bg-white/5 flex items-center gap-1.5">
                      {item.label}
                      <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-300" />
                    </button>
                  ) : (
                    <Link 
                      to={item.to!} 
                      className="px-4 py-2 rounded-lg text-sm font-bold transition-all text-slate-400 hover:text-white hover:bg-white/5"
                    >
                      {item.label}
                    </Link>
                  )}

                  {/* Dropdown Menu */}
                  {item.children && (
                    <div className="absolute top-full left-0 pt-2 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300 z-50">
                      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl p-2 min-w-[240px] backdrop-blur-xl">
                        {item.children.map((child) => (
                          <Link
                            key={child.label}
                            to={child.to}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all group/item"
                          >
                            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center group-hover/item:bg-blue-600/20 group-hover/item:text-blue-400 transition-all">
                              <child.icon size={16} />
                            </div>
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-4">
              {/* Search Bar */}
              <form onSubmit={handleSearch} className="hidden lg:flex items-center gap-2 px-4 py-2 bg-[#0f172a] border border-slate-800 rounded-xl focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all duration-300">
                <Search size={16} className="text-slate-500" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar ativo..." 
                  className="bg-transparent border-none outline-none text-sm font-medium text-white placeholder:text-slate-500 w-40 xl:w-56"
                />
              </form>

              <Link 
                to="/settings" 
                className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all hidden sm:flex"
              >
                <SettingsIcon size={20} />
              </Link>
              <button
                onClick={handleLogout}
                className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
              >
                <LogOut size={18} />
                Sair
              </button>
              
              {/* Mobile Menu Toggle */}
              <button 
                className="md:hidden p-2.5 text-slate-200 hover:bg-white/10 rounded-xl border border-white/10 transition-all active:scale-90"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

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
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                  <TrendingUp size={24} />
                </div>
                <span className="text-xl font-black tracking-tighter text-white">NEXUS</span>
              </div>
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
      <main className="flex-1 pt-24 md:pt-32 pb-32 md:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>

      {/* Bottom Navigation Bar (Mobile) */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#020617]/80 backdrop-blur-2xl border-t border-white/5 z-50 md:hidden pb-safe">
        <div className="flex items-center justify-around px-2 py-2">
          <Link to="/" className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-colors ${location.pathname === '/' ? 'text-blue-500' : 'text-slate-500 hover:text-slate-300'}`}>
            <LayoutDashboard size={22} strokeWidth={location.pathname === '/' ? 2.5 : 2} />
            <span className="text-xxs font-semibold tracking-wide">Home</span>
          </Link>
          <Link to="/portfolio" className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-colors ${location.pathname === '/portfolio' ? 'text-blue-500' : 'text-slate-500 hover:text-slate-300'}`}>
            <Briefcase size={22} strokeWidth={location.pathname === '/portfolio' ? 2.5 : 2} />
            <span className="text-xxs font-semibold tracking-wide">Carteira</span>
          </Link>
          <Link to="/search" className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-colors ${location.pathname === '/search' ? 'text-blue-500' : 'text-slate-500 hover:text-slate-300'}`}>
            <Search size={22} strokeWidth={location.pathname === '/search' ? 2.5 : 2} />
            <span className="text-xxs font-semibold tracking-wide">Busca</span>
          </Link>
          <Link to="/ranking" className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-colors ${location.pathname === '/ranking' ? 'text-blue-500' : 'text-slate-500 hover:text-slate-300'}`}>
            <TrendingUp size={22} strokeWidth={location.pathname === '/ranking' ? 2.5 : 2} />
            <span className="text-xxs font-semibold tracking-wide">Ranking</span>
          </Link>
          <Link to="/menu" className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-colors ${location.pathname === '/menu' ? 'text-blue-500' : 'text-slate-500 hover:text-slate-300'}`}>
            <Menu size={22} strokeWidth={location.pathname === '/menu' ? 2.5 : 2} />
            <span className="text-xxs font-semibold tracking-wide">Menu</span>
          </Link>
        </div>
      </div>

      {/* Footer Tecnológico */}
      <footer className="bg-[#020617] border-t border-white/5 py-16 relative overflow-hidden">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-blue-600/5 blur-[100px] -z-10 rounded-full" />
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex flex-col items-center md:items-start gap-4">
              <Link to="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center text-blue-500 border border-blue-500/20">
                  <TrendingUp size={24} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-black tracking-tighter text-white leading-none">NEXUS</span>
                  <span className="text-[8px] font-bold tracking-[0.2em] text-blue-400 uppercase">Invest Engine</span>
                </div>
              </Link>
              <p className="text-slate-500 text-xs font-medium max-w-xs text-center md:text-left">
                A plataforma definitiva para acompanhamento de dados financeiros e gestão de patrimônio de alta performance.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-8">
              <div className="flex flex-col gap-4">
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Plataforma</span>
                <button onClick={() => scrollToSection('dashboard')} className="text-xs text-slate-500 hover:text-blue-400 transition-colors text-left">Dashboard</button>
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
          
          <div className="h-px bg-white/5 my-12" />
          
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
