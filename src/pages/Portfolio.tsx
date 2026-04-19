import { Briefcase, Plus, PieChart as PieIcon, BarChart3, TrendingUp, Layers, Globe, Activity, Loader2, ArrowUpRight } from 'lucide-react';
import { NexusAgentUI } from '../components/NexusAgentUI';
import { PageHeader } from '../components/ui/PageHeader';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { usePortfolio } from '../hooks/usePortfolio';
import { useMemo, useState } from 'react';
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
          R$ {data.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
      to: '#', 
      description: 'Explore gráficos e tabelas detalhadas da sua evolução.',
      color: 'amber',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      text: 'text-amber-500',
      glow: 'group-hover:bg-amber-500/10',
      isComingSoon: true
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
        description={<>Central de inteligência estratégica da sua <span className="text-blue-500 font-bold">Arquitetura de Ativos</span>.</>}
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

      <div className="grid grid-cols-2 gap-3 md:gap-6 pt-4">
        {menuItems.map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.03 }}
            onClick={() => !item.isComingSoon && navigate(item.to)}
            className={`group relative p-4 md:p-6 bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-[2.5rem] flex flex-col gap-4 transition-all duration-500 cursor-pointer overflow-hidden shadow-sm hover:shadow-2xl active:scale-[0.98] ${
              item.isComingSoon ? 'opacity-40 grayscale pointer-events-none' : 'hover:bg-white dark:hover:bg-slate-800/60 hover:border-blue-500/30'
            }`}
          >
            {/* Animated Glow Backdrop */}
            <div className={`absolute -top-10 -right-10 w-40 h-40 ${item.bg} blur-[60px] opacity-0 group-hover:opacity-40 transition-opacity duration-700`} />
            
            <div className={`w-14 h-14 rounded-2xl ${item.bg} flex items-center justify-center border ${item.border} group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg relative shrink-0`}>
              <div className="absolute inset-0 bg-white/10 dark:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
              <item.icon className={`w-7 h-7 ${item.text}`} />
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-base md:text-xl text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors uppercase italic tracking-tighter leading-tight font-black">{item.title}</h3>
                {item.isComingSoon && (
                  <span className="text-[8px] px-2 py-0.5 bg-slate-100 dark:bg-white/5 rounded-full text-slate-400 font-black">SOON</span>
                )}
              </div>
              <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-bold leading-relaxed uppercase tracking-widest italic opacity-70 group-hover:opacity-100 transition-opacity line-clamp-2">{item.description}</p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5 group-hover:border-blue-500/20 transition-colors mt-auto">
              <span className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase italic tracking-[0.2em] group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                {item.isComingSoon ? 'BLOQUEADO' : 'EXPLORAR MÓDULO'}
              </span>
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center group-hover:bg-blue-500 dark:group-hover:bg-blue-600 transition-colors shadow-inner">
                <ArrowUpRight className="w-4 h-4 text-slate-600 dark:text-slate-400 group-hover:text-white transition-colors" />
              </div>
            </div>
          </motion.div>
        ))}

        {/* Empty placeholder to complete 2x2 grid if needed or just to maintain balance */}
        <div className="hidden lg:flex p-6 border-2 border-dashed border-white/5 rounded-[2rem] flex-col items-center justify-center text-center opacity-20">
          <Layers className="icon-xl mb-4 text-slate-600" />
          <p className="text-tiny font-black uppercase tracking-widest italic text-slate-600">Espaço Reservado</p>
        </div>
      </div>
    </div>
  );
}
