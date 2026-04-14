import { Link, useLocation } from 'react-router-dom';
import { PieChart, DollarSign, TrendingUp, List, History } from 'lucide-react';

export function PortfolioNav() {
  const location = useLocation();
  
  const navItems = [
    { label: 'Resumo', to: '/portfolio/resumo', icon: PieChart },
    { label: 'Rentabilidade', to: '/portfolio/rentabilidade', icon: TrendingUp },
    { label: 'Proventos', to: '/portfolio/proventos', icon: DollarSign },
    { label: 'Meus Ativos', to: '/portfolio', icon: List },
    { label: 'Lançamentos', to: '/portfolio/lancamentos', icon: History },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 mb-6 border-b border-slate-800">
      {navItems.map(item => {
        const isActive = location.pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-bold transition-all whitespace-nowrap border-b-2 ${
              isActive 
                ? 'border-blue-500 text-blue-400 bg-blue-500/5' 
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <item.icon size={16} />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
