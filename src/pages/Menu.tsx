import { PageHeader } from '../components/ui/PageHeader';
import { Menu as MenuIcon, Briefcase, Search, Heart, Newspaper, Calendar, Award, Calculator, HelpCircle, Bell, HeadphonesIcon, Info, ChevronRight, Crown, ShieldCheck, GitCompare, Filter, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { auth } from '../firebase';
import { useState, useEffect } from 'react';

export default function Menu() {
  const user = auth.currentUser;
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  const ferramentas = [
    { icon: Briefcase, label: 'Minha Carteira', to: '/portfolio' },
    { icon: Search, label: 'Buscar Ativos', to: '/search' },
    { icon: GitCompare, label: 'Comparar Ativos', to: '/compare' },
    { icon: Filter, label: 'Busca Avançada (Screener)', to: '/screener' },
    { icon: Heart, label: 'Favoritos', to: '#' },
    { icon: Newspaper, label: 'Últimas Notícias', to: '/news' },
    { icon: Calendar, label: 'Agenda de Dividendos', to: '/dividends' },
    { icon: Award, label: 'Carteiras Recomendadas', to: '/recommended' },
    { icon: Calculator, label: 'Calculadoras', to: '/calculators' },
    { icon: ShieldCheck, label: 'Renda Fixa', to: '/renda-fixa' },
    { icon: Award, label: 'Rankings', to: '/ranking' },
    { icon: HelpCircle, label: 'Guia do Iniciante', to: '#' },
  ];

  const maisOpcoes = [
    { icon: Bell, label: 'Notificações', to: '#', badge: '20' },
    { icon: Bell, label: 'Notificações via push', to: '#' },
    { icon: HeadphonesIcon, label: 'Suporte', to: '#' },
    { icon: Info, label: 'Sobre o Invest Ultra', to: '#' },
  ];

  return (
    <div className="space-y-8 pb-24">
      <div className="pt-6 px-4 md:px-0">
        <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 ml-2">Minha Conta</h2>
        
        <div className="flex items-center gap-4 mb-8 bg-white/5 p-4 rounded-3xl border border-white/10">
          <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-2xl font-black text-white shadow-lg shadow-blue-500/20">
            {user?.email?.[0].toUpperCase() || 'U'}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white">{user?.displayName || 'Usuário'}</h3>
            <p className="text-sm text-slate-400">{user?.email}</p>
            <button className="mt-3 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 transition-colors">
              <Crown size={14} />
              Quero ser investidor PRO
            </button>
          </div>
          <ChevronRight className="text-slate-600" />
        </div>
      </div>

      <div className="px-4 md:px-0">
        <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 ml-2">Ferramentas</h2>
        <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden divide-y divide-white/5">
          {ferramentas.map((item, idx) => (
            <Link key={idx} to={item.to} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-slate-800/50 flex items-center justify-center group-hover:bg-slate-800 transition-colors">
                  <item.icon size={16} className="text-slate-400 group-hover:text-blue-400 transition-colors" />
                </div>
                <span className="text-slate-200 font-medium text-sm">{item.label}</span>
              </div>
              <ChevronRight size={16} className="text-slate-600" />
            </Link>
          ))}
        </div>
      </div>

      <div className="px-4 md:px-0">
        <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 ml-2">App</h2>
        <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden divide-y divide-white/5">
          {isInstallable && (
            <button 
              onClick={handleInstallClick}
              className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                  <Download size={16} className="text-blue-400" />
                </div>
                <span className="text-slate-200 font-medium text-sm">Instalar Aplicativo</span>
              </div>
              <ChevronRight size={16} className="text-slate-600" />
            </button>
          )}
          {maisOpcoes.map((item, idx) => (
            <Link key={idx} to={item.to} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-slate-800/50 flex items-center justify-center group-hover:bg-slate-800 transition-colors">
                  <item.icon size={16} className="text-slate-400 group-hover:text-blue-400 transition-colors" />
                </div>
                <span className="text-slate-200 font-medium text-sm">{item.label}</span>
              </div>
              <div className="flex items-center gap-3">
                {item.badge && (
                  <span className="px-2 py-0.5 bg-pink-500 text-white text-[10px] font-bold rounded-full">
                    {item.badge}
                  </span>
                )}
                <ChevronRight size={16} className="text-slate-600" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
