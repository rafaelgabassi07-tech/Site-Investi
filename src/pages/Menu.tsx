import { PageHeader } from '../components/ui/PageHeader';
import { Menu as MenuIcon, Briefcase, Search, Heart, Newspaper, Calendar, Award, Calculator, HelpCircle, Bell, HeadphonesIcon, Info, ChevronRight, Crown, ShieldCheck, GitCompare, Filter, Download, Scale, FileText, TrendingUp, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { useState, useEffect } from 'react';

export default function Menu() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário';
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

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
    { icon: TrendingUp, label: 'Rentabilidade', to: '/portfolio/rentabilidade' },
    { icon: Search, label: 'Buscar Ativos', to: '/search' },
    { icon: GitCompare, label: 'Comparar Ativos', to: '/compare' },
    { icon: Filter, label: 'Busca Avançada (Screener)', to: '/screener' },
    { icon: Scale, label: 'Rebalanceamento', to: '/rebalance' },
    { icon: FileText, label: 'Motor Fiscal & DARF', to: '/taxes' },
    { icon: Heart, label: 'Favoritos', to: '/favorites' },
    { icon: Newspaper, label: 'Últimas Notícias', to: '/news' },
    { icon: Calendar, label: 'Agenda de Dividendos', to: '/portfolio/proventos' },
    { icon: Award, label: 'Carteiras Recomendadas', to: '/recommended' },
    { icon: Calculator, label: 'Calculadoras', to: '/calculators' },
    { icon: ShieldCheck, label: 'Renda Fixa', to: '/renda-fixa' },
    { icon: Award, label: 'Rankings', to: '/ranking' },
    { icon: HelpCircle, label: 'Guia do Iniciante', to: '/guide' },
  ];

  const maisOpcoes = [
    { icon: MenuIcon, label: 'Configurações', to: '/settings' },
    { icon: Info, label: 'Central de Ajuda', to: '/guide' },
    { icon: HeadphonesIcon, label: 'Suporte Nexus', to: 'mailto:suporte@nexusinvest.com' },
    { icon: Info, label: 'Sobre o Nexus Invest', to: '/about' },
  ];

  return (
    <div className="space-y-8 pb-32 bg-background transition-colors duration-500">
      <div className="pt-8 px-4 md:px-0">
        <h2 className="text-tiny font-black text-muted-foreground uppercase tracking-[0.2em] mb-4 ml-3">Minha Identidade</h2>
        
        <div className="flex items-center gap-6 bg-card p-6 rounded-xl md:rounded-2xl border border-border shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-[50px] -z-10 group-hover:scale-150 transition-transform duration-700" />
          <div className="w-16 h-16 rounded-[1.25rem] bg-blue-600 flex items-center justify-center text-display-tiny font-black text-white shadow-xl shadow-blue-500/20 border border-blue-400/20 uppercase italic">
            {displayName[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-display-tiny text-foreground uppercase italic tracking-tight truncate">{displayName}</h3>
            <p className="text-tiny font-bold text-muted-foreground uppercase tracking-widest truncate">{user?.email}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center border border-border">
            <ChevronRight className="text-muted-foreground icon-xs" />
          </div>
        </div>
      </div>

      <div className="px-4 md:px-0">
        <h2 className="text-tiny font-black text-muted-foreground uppercase tracking-[0.2em] mb-4 ml-3">Arsenall Ferramentas</h2>
        <div className="bg-card border border-border rounded-xl md:rounded-2xl overflow-hidden divide-y divide-border shadow-xl">
          {ferramentas.map((item, idx) => (
            <Link key={idx} to={item.to} className="flex items-center justify-between p-6 hover:bg-secondary transition-all group">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center group-hover:bg-blue-600/10 transition-colors border border-border group-hover:border-blue-500/20">
                  <item.icon className="icon-xs text-muted-foreground group-hover:text-blue-500 transition-colors" />
                </div>
                <span className="text-display-tiny text-foreground uppercase italic tracking-tight group-hover:text-blue-500 transition-colors">{item.label}</span>
              </div>
              <ChevronRight className="text-muted-foreground group-hover:text-foreground transition-colors icon-xs" />
            </Link>
          ))}
        </div>
      </div>

      <div className="px-4 md:px-0">
        <h2 className="text-tiny font-black text-muted-foreground uppercase tracking-[0.2em] mb-4 ml-3">Nexus Terminal</h2>
        <div className="bg-card border border-border rounded-xl md:rounded-2xl overflow-hidden divide-y divide-border shadow-xl">
          {isInstallable && (
            <button 
              onClick={handleInstallClick}
              className="w-full flex items-center justify-between p-6 hover:bg-secondary transition-all group text-left"
            >
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center group-hover:bg-blue-600/20 transition-colors border border-blue-500/20">
                  <Download className="icon-xs text-blue-500" />
                </div>
                <span className="text-display-tiny text-blue-500 uppercase italic tracking-tight">Instalar Aplicativo</span>
              </div>
              <ChevronRight className="text-muted-foreground group-hover:text-blue-500 transition-colors icon-xs" />
            </button>
          )}
          {maisOpcoes.map((item, idx) => {
            const isExternal = item.to.startsWith('mailto:') || item.to.startsWith('http');
            const Wrapper = isExternal ? 'a' : Link;
            return (
            <Wrapper key={idx} to={!isExternal ? item.to : undefined} href={isExternal ? item.to : undefined} className="flex items-center justify-between p-6 hover:bg-secondary transition-all group">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center group-hover:bg-blue-600/10 transition-colors border border-border group-hover:border-blue-500/20">
                  <item.icon className="icon-xs text-muted-foreground group-hover:text-blue-500 transition-colors" />
                </div>
                <span className="text-display-tiny text-foreground uppercase italic tracking-tight group-hover:text-blue-500 transition-colors">{item.label}</span>
              </div>
              <div className="flex items-center gap-4">
                {(item as any).badge && (
                  <span className="px-3 py-1 bg-blue-600/20 text-blue-500 text-[10px] font-black rounded-full border border-blue-500/20 shadow-lg shadow-blue-500/5 uppercase tracking-widest">
                    {(item as any).badge} New
                  </span>
                )}
                <ChevronRight className="text-muted-foreground group-hover:text-foreground transition-colors icon-xs" />
              </div>
            </Wrapper>
          )})}
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center justify-between p-6 hover:bg-red-500/5 transition-all group text-left"
          >
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors border border-red-500/20">
                <LogOut className="icon-xs text-red-500" />
              </div>
              <span className="text-display-tiny text-red-500 uppercase italic tracking-tight">Sair da Conta</span>
            </div>
            <ChevronRight className="text-muted-foreground group-hover:text-red-500 transition-colors icon-xs" />
          </button>
        </div>
      </div>
    </div>
  );
}
