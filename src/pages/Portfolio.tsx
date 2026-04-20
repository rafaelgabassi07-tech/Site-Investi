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
      <div className="bg-slate-900/95 border border-white/10 p-3 rounded-xl shadow-xl backdrop-blur-sm">
        <p className="text-white font-bold text-xs mb-1">{data.name || data.date}</p>
        <p className="text-blue-400 font-black text-sm">
          {formatNumber(data.value, { style: 'currency' })}
        </p>
        {data.name && <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-1">{percentage}% do Patrimônio</p>}
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
      color: 'blue',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      text: 'text-blue-500',
      glow: 'group-hover:bg-blue-500/10'
    },
    { 
      title: 'Agenda de Proventos', 
      icon: TrendingUp, 
      to: '/portfolio/proventos',
      description: 'Acompanhe seus dividendos recebidos e projeções futuras.',
      color: 'emerald',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      text: 'text-emerald-500',
      glow: 'group-hover:bg-emerald-500/10'
    },
    { 
      title: 'Rentabilidade', 
      icon: BarChart3, 
      to: '/portfolio/rentabilidade',
      description: 'Desempenho da sua carteira contra o IBOVESPA e benchmarks.',
      color: 'purple',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
      text: 'text-purple-500',
      glow: 'group-hover:bg-purple-500/10'
    },
    { 
      title: 'Detalhes do Patrimônio', 
      icon: Briefcase, 
      to: '/portfolio/patrimonio', 
      description: 'Análise aprofundada da sua evolução patrimonial e alocação.',
      color: 'amber',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      text: 'text-amber-500',
      glow: 'group-hover:bg-amber-500/10'
    },
    { 
      title: 'Lançamentos', 
      icon: Activity, 
      to: '/portfolio/lancamentos',
      description: 'Gerencie suas movimentações, compras e vendas de ativos.',
      color: 'rose',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
      text: 'text-rose-500',
      glow: 'group-hover:bg-rose-500/10'
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Carregando Terminal Nexus...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Minha Carteira"
        description={<><span className="text-blue-500 font-bold">Arquitetura</span> Estratégica.</>}
        icon={Briefcase}
        actions={
          <button 
            onClick={() => navigate('/portfolio/lancamentos')}
            className="btn-primary py-2 px-4 shadow-blue-500/20"
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.03 }}
            onClick={() => !item.isComingSoon && navigate(item.to)}
            className={`group nexus-card flex flex-col gap-3 cursor-pointer shadow-sm hover:shadow-2xl active:scale-[0.98] ${
              item.isComingSoon ? 'opacity-40 grayscale pointer-events-none' : 'hover:bg-slate-900/40 hover:border-blue-500/20 hover:shadow-2xl hover:shadow-blue-500/5'
            }`}
          >
            {/* Animated Glow Backdrop */}
            <div className={`absolute top-0 right-0 w-24 h-24 ${item.bg} blur-[40px] -z-10 ${item.glow} transition-all duration-1000 group-hover:scale-150`} />
            
            <div className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center border ${item.border} group-hover:scale-105 transition-transform duration-500 shadow-xl relative shrink-0`}>
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
              <item.icon className={`w-5 h-5 ${item.text}`} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="nexus-title mb-1 group-hover:text-blue-400 transition-colors truncate">{item.title}</h3>
                {item.isComingSoon && (
                  <span className="text-[8px] px-2 py-0.5 bg-slate-100 dark:bg-white/5 rounded-full text-slate-400 font-black">EM BREVE</span>
                )}
              </div>
              <p className="nexus-description opacity-70 group-hover:opacity-100 transition-opacity line-clamp-2">{item.description}</p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/5 group-hover:border-blue-500/10 transition-colors mt-auto">
              <span className="nexus-label group-hover:text-slate-400">
                {item.isComingSoon ? 'BLOQUEADO' : 'EXPLORAR'}
              </span>
              <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-blue-600 transition-colors shadow-inner">
                <ArrowUpRight className="w-3 h-3 text-slate-600 group-hover:text-white transition-colors" />
              </div>
            </div>
          </motion.div>
        ))}

        {/* Empty placeholder to complete 2x2 grid if needed or just to maintain balance */}
        <div className="hidden lg:flex p-6 border-2 border-dashed border-white/5 rounded-xl md:rounded-2xl flex-col items-center justify-center text-center opacity-20">
          <Layers className="icon-xl mb-4 text-slate-600" />
          <p className="text-tiny font-black uppercase tracking-widest italic text-slate-600">Espaço Reservado</p>
        </div>
      </div>
    </div>
  );
}
