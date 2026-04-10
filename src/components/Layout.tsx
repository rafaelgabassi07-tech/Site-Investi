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
  Search
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

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
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'portfolio', icon: Briefcase, label: 'Carteira' },
    { id: 'transactions', icon: History, label: 'Lançamentos' },
    { id: 'news', icon: Newspaper, label: 'Notícias' },
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
      {/* Header Estilo Nexus Ultra */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${
        scrolled ? 'bg-[#020617]/80 backdrop-blur-2xl border-b border-white/10 py-3 shadow-2xl' : 'bg-transparent py-6'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo Nexus Style */}
            <Link to="/" className="flex items-center gap-3 group">
              <motion.div 
                whileHover={{ scale: 1.1, rotate: 0 }}
                initial={{ rotate: 3 }}
                className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-blue-500/40 transition-all duration-500"
              >
                <TrendingUp size={28} />
              </motion.div>
              <div className="flex flex-col">
                <span className="text-2xl font-black tracking-tighter text-white leading-none">INVEST</span>
                <span className="text-[10px] font-bold tracking-[0.2em] text-blue-400 uppercase">Ultra V2.5</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-md">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-slate-400 hover:text-white hover:bg-white/10 relative group"
                >
                  {item.label}
                  <motion.div 
                    className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-blue-500 rounded-full group-hover:w-4 transition-all"
                  />
                </button>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Search Bar */}
              <form onSubmit={handleSearch} className="hidden lg:flex items-center gap-3 px-6 py-2.5 bg-white/5 border border-white/10 rounded-2xl group focus-within:border-blue-500/50 transition-all duration-500">
                <Search size={14} className="text-slate-500 group-focus-within:text-blue-500" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="BUSCAR ATIVO..." 
                  className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest text-white placeholder:text-slate-700 w-32 xl:w-48"
                />
                <div className="px-1.5 py-0.5 bg-white/5 rounded-md text-[8px] font-black text-slate-600 border border-white/10">
                  ENTER
                </div>
              </form>

              <Link 
                to="/settings" 
                className="p-2.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all hidden sm:flex border border-transparent hover:border-white/10"
              >
                <SettingsIcon size={20} />
              </Link>
              <button
                onClick={handleLogout}
                className="hidden sm:flex items-center gap-2 px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-red-400 hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/20"
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

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="md:hidden fixed inset-0 z-[60] bg-[#020617] flex flex-col"
            >
              <div className="p-6 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                    <TrendingUp size={24} />
                  </div>
                  <span className="text-xl font-black tracking-tighter text-white">INVEST</span>
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
                  <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className="flex items-center justify-between px-6 py-5 w-full text-left rounded-2xl font-black uppercase tracking-widest text-xs text-slate-300 hover:bg-white/10 hover:text-white transition-all border border-transparent hover:border-white/10 group"
                  >
                    <div className="flex items-center gap-4">
                      <item.icon size={20} className="text-blue-500" />
                      {item.label}
                    </div>
                    <ChevronRight size={16} className="text-slate-600 group-hover:text-blue-500 transition-all group-hover:translate-x-1" />
                  </motion.button>
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
                <p className="text-slate-600 text-[9px] font-black uppercase tracking-[0.3em]">Invest Ultra Engine v2.5</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-24 md:pt-32 pb-32 md:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation Bar (Mobile) */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#020617]/80 backdrop-blur-2xl border-t border-white/5 z-50 md:hidden pb-safe">
        <div className="flex items-center justify-around px-2 py-2">
          <Link to="/" className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-colors ${location.pathname === '/' ? 'text-blue-500' : 'text-slate-500 hover:text-slate-300'}`}>
            <LayoutDashboard size={22} strokeWidth={location.pathname === '/' ? 2.5 : 2} />
            <span className="text-[10px] font-semibold tracking-wide">Home</span>
          </Link>
          <Link to="/portfolio" className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-colors ${location.pathname === '/portfolio' ? 'text-blue-500' : 'text-slate-500 hover:text-slate-300'}`}>
            <Briefcase size={22} strokeWidth={location.pathname === '/portfolio' ? 2.5 : 2} />
            <span className="text-[10px] font-semibold tracking-wide">Carteira</span>
          </Link>
          <Link to="/search" className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-colors ${location.pathname === '/search' ? 'text-blue-500' : 'text-slate-500 hover:text-slate-300'}`}>
            <Search size={22} strokeWidth={location.pathname === '/search' ? 2.5 : 2} />
            <span className="text-[10px] font-semibold tracking-wide">Busca</span>
          </Link>
          <Link to="/ranking" className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-colors ${location.pathname === '/ranking' ? 'text-blue-500' : 'text-slate-500 hover:text-slate-300'}`}>
            <TrendingUp size={22} strokeWidth={location.pathname === '/ranking' ? 2.5 : 2} />
            <span className="text-[10px] font-semibold tracking-wide">Ranking</span>
          </Link>
          <Link to="/menu" className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-colors ${location.pathname === '/menu' ? 'text-blue-500' : 'text-slate-500 hover:text-slate-300'}`}>
            <Menu size={22} strokeWidth={location.pathname === '/menu' ? 2.5 : 2} />
            <span className="text-[10px] font-semibold tracking-wide">Menu</span>
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
                  <span className="text-xl font-black tracking-tighter text-white leading-none">INVEST</span>
                  <span className="text-[8px] font-bold tracking-[0.2em] text-blue-400 uppercase">Ultra Engine</span>
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
            <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">© 2026 Invest Ultra. Todos os direitos reservados.</p>
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
