import React, { useMemo } from 'react';
import { usePortfolio } from '../hooks/usePortfolio';
import { PageHeader } from '../components/ui/PageHeader';
import { Briefcase, ChevronDown } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { usePrivacy } from '../hooks/usePrivacy';
import { formatNumber } from '../lib/utils';
import { motion } from 'motion/react';

const COLORS = ['#4f46e5', '#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#64748b'];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover/95 border border-border p-3 rounded-2xl shadow-2xl backdrop-blur-3xl">
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 italic">
          {payload[0].name}
        </p>
        <p className="text-sm font-black text-foreground italic">
          {formatNumber(payload[0].value, { style: 'currency' })}
        </p>
      </div>
    );
  }
  return null;
};

export default function Patrimony() {
  const { portfolio } = usePortfolio();
  const { hideValues } = usePrivacy();

  const totalPatrimony = portfolio.reduce(
    (acc, item) => acc + (item.currentValue || item.totalInvested),
    0
  );

  // 1. Posição Atual (Ativos)
  const assetsData = useMemo(() => {
    return portfolio
      .map(item => ({
        name: item.ticker,
        value: item.currentValue || item.totalInvested
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [portfolio]);

  // 2. Posição Atual (Tipo de Ativos)
  const assetTypesData = useMemo(() => {
    const types: Record<string, number> = {};
    portfolio.forEach(item => {
      let typeLabel = item.assetType;
      // Normalizing the labels for the chart
      if (typeLabel === 'ACAO' || typeLabel === 'Ações') typeLabel = 'Ações';
      else if (typeLabel === 'FII' || typeLabel === 'FIIs') typeLabel = 'FIIs';
      else if (typeLabel === 'BDR') typeLabel = 'BDRs';
      else if (typeLabel === 'ETF') typeLabel = 'ETFs';
      
      types[typeLabel] = (types[typeLabel] || 0) + (item.currentValue || item.totalInvested);
    });
    return Object.keys(types)
      .map(key => ({ name: key, value: types[key] }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [portfolio]);

  // 3. Exposição ao Exterior
  const exposureData = useMemo(() => {
    let nacional = 0;
    let exterior = 0;
    portfolio.forEach(item => {
      const isForeign = ['BDR', 'BDRs', 'STOCK', 'REIT'].includes(item.assetType);
      if (isForeign) {
        exterior += item.currentValue || item.totalInvested;
      } else {
        nacional += item.currentValue || item.totalInvested;
      }
    });

    const data = [];
    if (nacional > 0) data.push({ name: 'Nacional', value: nacional });
    if (exterior > 0) data.push({ name: 'Exterior', value: exterior });
    return data.sort((a, b) => b.value - a.value);
  }, [portfolio]);

  const renderLegend = (data: any[]) => {
    return (
      <div className="flex flex-col gap-2 mt-6">
        {data.map((entry, index) => {
          const percentage = totalPatrimony > 0 ? (entry.value / totalPatrimony) * 100 : 0;
          return (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm font-medium text-foreground">{entry.name}</span>
              </div>
              <span className="text-sm font-bold text-foreground">
                {percentage.toFixed(2)}%
              </span>
            </div>
          );
        })}
        <div className="flex justify-center mt-4">
          <button className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-secondary/50 transition-colors">
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>
    );
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Avoid overlapping text tightly

    return (
      <text
        x={x}
        y={y}
        fill="#000"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-[10px] sm:text-xs font-bold"
      >
        <tspan x={x} dy="-0.5em">{name}</tspan>
        <tspan x={x} dy="1.2em">{(percent * 100).toFixed(2)}%</tspan>
      </text>
    );
  };

  return (
    <div className="space-y-8 pb-10">
      <PageHeader 
        title="Detalhes do Patrimônio"
        description={<>Análise <span className="text-blue-500 font-bold">estrutural</span> da carteira.</>}
        icon={Briefcase}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ativos Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="nexus-card"
        >
          <h3 className="text-sm font-black uppercase tracking-widest text-foreground mb-8">Posição Atual (Ativos)</h3>
          
          <div className="h-64 sm:h-80 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={assetsData}
                  cx="50%"
                  cy="50%"
                  innerRadius="40%"
                  outerRadius="80%"
                  paddingAngle={2}
                  dataKey="value"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  animationDuration={1500}
                >
                  {assetsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {renderLegend(assetsData)}
        </motion.div>

        {/* Tipo de Ativos Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="nexus-card"
        >
          <h3 className="text-sm font-black uppercase tracking-widest text-foreground mb-8">Posição Atual (Tipo de Ativos)</h3>
          
          <div className="h-64 sm:h-80 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={assetTypesData}
                  cx="50%"
                  cy="50%"
                  innerRadius="40%"
                  outerRadius="80%"
                  paddingAngle={2}
                  dataKey="value"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  animationDuration={1500}
                >
                  {assetTypesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index+2) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {renderLegend(assetTypesData)}
        </motion.div>

        {/* Exposição Exterior Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="nexus-card lg:col-span-2"
        >
          <h3 className="text-sm font-black uppercase tracking-widest text-foreground mb-8">Exposição ao Exterior</h3>
          
          <div className="h-64 sm:h-80 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={exposureData}
                  cx="50%"
                  cy="50%"
                  innerRadius="40%"
                  outerRadius="80%"
                  paddingAngle={2}
                  dataKey="value"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  animationDuration={1500}
                >
                  {exposureData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="max-w-md mx-auto">
            {renderLegend(exposureData)}
          </div>
        </motion.div>
      </div>

    </div>
  );
}
