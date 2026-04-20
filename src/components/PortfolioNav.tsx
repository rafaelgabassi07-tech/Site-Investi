import { Link, useLocation } from 'react-router-dom';
import { PieChart, DollarSign, TrendingUp, List, History } from 'lucide-react';

export function PortfolioNav() {
  const location = useLocation();
  
  const navItems = [
    { label: 'Resumo', to: '/portfolio/resumo', icon: PieChart },
    { label: 'Proventos', to: '/portfolio/proventos', icon: DollarSign },
    { label: 'Rentabilidade', to: '/portfolio/rentabilidade', icon: TrendingUp },
    { label: 'Patrimônio', to: '/portfolio/patrimonio', icon: List },
    { label: 'Gerenciar', to: '/portfolio', icon: List },
    { label: 'Lançamentos', to: '/portfolio/lancamentos', icon: History },
  ];

  return (
    <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-6 mb-2 snap-x snap-mandatory px-4 md:px-0 -mx-4 md:mx-0">
      {navItems.map(item => {
        const isActive = location.pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            className={`snap-start flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap border italic first:ml-4 md:first:ml-0 last:mr-4 md:last:mr-0 ${
              isActive 
                ? 'bg-blue-600 text-white shadow-[0_8px_16px_rgba(37,99,235,0.3)] border-blue-500/50' 
                : 'bg-white/5 text-slate-500 border-white/5 hover:bg-white/10 hover:text-slate-300 hover:border-white/10'
            }`}
          >
            <item.icon className="icon-xs" />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
