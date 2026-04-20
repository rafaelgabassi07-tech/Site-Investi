import { Briefcase, Plus, PieChart as PieIcon, BarChart3, TrendingUp, Layers, Globe, Activity, Loader2, ArrowUpRight } from 'lucide-react';
import { NexusAgentUI } from '../components/NexusAgentUI';
import { PageHeader } from '../components/ui/PageHeader';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { usePortfolio } from '../hooks/usePortfolio';
import { useMemo, useState } from 'react';
import { formatNumber } from '../lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#64748b', '#14b8a6'];

const TooltipContent = ({ active, payload, totalValue }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const percentage = totalValue > 0 ? ((data.value / totalValue) * 100).toFixed(1) : 0;
    return (
      <div className="bg-popover border border-border p-3 rounded-xl shadow-xl">
        <p className="text-foreground font-bold text-xs mb-1">{data.name || data.date}</p>
        <p className="text-primary font-bold text-sm">
          {formatNumber(data.value, { style: 'currency' })}
        </p>
        {data.name && <p className="text-muted-foreground font-semibold text-[10px] uppercase tracking-widest mt-1">{percentage}% do Patrimônio</p>}
      </div>
    );
  }
  return null;
};

export default function Portfolio() {
  const navigate = useNavigate();
  const { portfolio, loading } = usePortfolio();

  const menuItems = [
    { 
      title: 'Resumo da Carteira', 
      icon: PieIcon, 
      to: '/portfolio/resumo',
      description: 'Visão geral da sua alocação, lucros e composição atualizada.',
      color: 'blue'
    },
    { 
      title: 'Agenda de Proventos', 
      icon: TrendingUp, 
      to: '/portfolio/proventos',
      description: 'Acompanhe seus dividendos recebidos e projeções futuras.',
      color: 'emerald'
    },
    { 
      title: 'Rentabilidade', 
      icon: BarChart3, 
      to: '/portfolio/rentabilidade',
      description: 'Desempenho da sua carteira contra o IBOVESPA e benchmarks.',
      color: 'purple'
    },
    { 
      title: 'Detalhes do Patrimônio', 
      icon: Briefcase, 
      to: '/portfolio/patrimonio', 
      description: 'Análise aprofundada da sua evolução patrimonial e alocação.',
      color: 'amber'
    },
    { 
      title: 'Lançamentos', 
      icon: Activity, 
      to: '/portfolio/lancamentos',
      description: 'Gerencie suas movimentações, compras e vendas de ativos.',
      color: 'rose'
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Carregando Terminal Nexus...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Minha Carteira"
        description={<><span className="text-primary font-bold">Arquitetura</span> Estratégica.</>}
        icon={Briefcase}
        actions={
          <button 
            onClick={() => navigate('/portfolio/lancamentos')}
            className="btn-primary py-2 px-4 shadow-sm"
          >
            <Plus className="icon-sm" />
            Nova Operação
          </button>
        }
      />

      <NexusAgentUI />

      <div className="nexus-grid pt-4">
        {menuItems.map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => navigate(item.to)}
            className="nexus-card cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10 transition-colors group-hover:bg-primary group-hover:text-white">
                <item.icon className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all -translate-y-1 translate-x-1" />
            </div>
            
            <h3 className="nexus-title mb-2 group-hover:text-primary transition-colors">
              {item.title}
            </h3>
            <p className="nexus-description leading-relaxed">
              {item.description}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
