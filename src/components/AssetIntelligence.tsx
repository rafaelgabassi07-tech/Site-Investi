import { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { financeService } from '../services/financeService';
import { TrendingUp, Calendar, Globe, Building2, MapPin, Target } from 'lucide-react';
import { motion } from 'motion/react';

interface AssetIntelligenceProps {
  ticker: string;
  assetDetails: any;
}

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export function AssetIntelligence({ ticker, assetDetails }: AssetIntelligenceProps) {
  if (!assetDetails || !assetDetails.results) return null;

  const data = assetDetails.results;
  const isAcao = assetDetails.assetType === 'ACAO';
  const isFII = assetDetails.assetType === 'FII';

  const metrics = [
    { label: 'P/L', value: data.pl || '---', color: 'blue' },
    { label: 'P/VP', value: data.pvp || '---', color: 'indigo' },
    { label: 'DY', value: data.dividendYield || '---', color: 'emerald' },
    { label: 'ROE', value: data.roe || '---', color: 'purple' },
    { label: 'Margem Líq.', value: data.margemLiquida || '---', color: 'cyan' },
    { label: 'Dívida/EBITDA', value: data.dividaLiquidaEbitda || '---', color: 'red' },
  ].filter(m => m.value !== '---');

  return (
    <section className="space-y-6 pt-12 border-t border-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
          <h3 className="nexus-title text-base">Nexus Brain Intel</h3>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
          <Target size={12} className="text-blue-500" />
          <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Análise Fundamentalista</span>
        </div>
      </div>

      {metrics.length > 0 ? (
        <div className="nexus-grid md:!grid-cols-3">
          {metrics.map((m, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="nexus-card flex flex-col gap-1 group overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 blur-2xl group-hover:bg-blue-500/10 transition-colors" />
              <span className="nexus-label group-hover:text-foreground transition-colors">{m.label}</span>
              <span className={`nexus-title text-lg group-hover:text-blue-500 transition-colors`}>{m.value}</span>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="p-8 bg-secondary/30 border border-dashed border-border rounded-3xl text-center">
          <p className="nexus-label italic opacity-50">Dados fundamentalistas detalhados sendo processados pelo Nexus Engine...</p>
        </div>
      )}

      {data.about && (
        <div className="nexus-card flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Building2 size={14} className="text-muted-foreground" />
            <h4 className="nexus-label !text-foreground">Sobre a Empresa</h4>
          </div>
          <p className="nexus-description leading-relaxed line-clamp-4 hover:line-clamp-none transition-all cursor-pointer">
            {data.about}
          </p>
        </div>
      )}
    </section>
  );
}
