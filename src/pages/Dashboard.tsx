import { usePortfolio } from '../hooks/usePortfolio';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { TrendingUp, Info, Wallet, PieChart as PieChartIcon, ArrowUpRight, LayoutDashboard } from 'lucide-react';
import { motion } from 'motion/react';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';

export default function Dashboard() {
  const { portfolio, loading } = usePortfolio();

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
      <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Sincronizando Invest Dashboard...</p>
    </div>
  );

  const totalInvested = portfolio.reduce((acc, item) => acc + item.totalInvested, 0);
  const totalCurrentValue = portfolio.reduce((acc, item) => acc + (item.currentValue || item.totalInvested), 0);
  const totalProfit = totalCurrentValue - totalInvested;
  const profitPercentage = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

  // Mocking historical data for now, but using real current value as the last point
  const chartData = [
    { name: 'JAN', value: totalInvested * 0.8 },
    { name: 'FEV', value: totalInvested * 0.85 },
    { name: 'MAR', value: totalInvested * 0.9 },
    { name: 'ABR', value: totalInvested * 0.95 },
    { name: 'MAI', value: totalInvested },
    { name: 'JUN', value: totalCurrentValue },
  ];

  const COLORS = ['#2563eb', '#06b6d4', '#10b981', '#8b5cf6', '#f59e0b'];

  return (
    <div className="space-y-16">
      <PageHeader 
        title="Visão Geral"
        description={<>Performance consolidada da sua carteira <span className="text-blue-500 font-bold">Invest Ultra</span>.</>}
        icon={LayoutDashboard}
        actions={
          <div className="px-6 py-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Mercado Aberto
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatCard 
          label="Total Investido"
          value={`R$ ${totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={Wallet}
          color="blue"
          trend="Valor de custo"
          trendIcon={Info}
          delay={0.1}
        />
        <StatCard 
          label="Patrimônio Atual"
          value={`R$ ${totalCurrentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={TrendingUp}
          color="emerald"
          trend={`${profitPercentage >= 0 ? '+' : ''}${profitPercentage.toFixed(2)}% total`}
          trendIcon={ArrowUpRight}
          delay={0.2}
        />
        <StatCard 
          label="Lucro Total"
          value={`R$ ${totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={PieChartIcon}
          color={totalProfit >= 0 ? "indigo" : "red"}
          trend={totalProfit >= 0 ? "Em alta" : "Em baixa"}
          trendIcon={totalProfit >= 0 ? ArrowUpRight : Info}
          delay={0.3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="card p-6 md:p-10"
        >
          <div className="flex items-center justify-between mb-12">
            <h3 className="text-xl font-black text-white uppercase tracking-tight">Evolução Patrimonial</h3>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-600 rounded-full" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Patrimônio</span>
            </div>
          </div>
          <div className="h-[300px] md:h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  dy={20}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  dx={-20}
                  tickFormatter={(val) => `R$ ${val/1000}k`}
                />
                <Tooltip 
                  cursor={{ stroke: '#2563eb', strokeWidth: 2, strokeDasharray: '5 5' }}
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '16px',
                    padding: '16px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                  }}
                  itemStyle={{ color: '#fff', fontWeight: '900', textTransform: 'uppercase', fontSize: '12px' }}
                  labelStyle={{ color: '#64748b', marginBottom: '8px', fontWeight: '900', fontSize: '10px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#2563eb" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="card p-6 md:p-10"
        >
          <div className="flex items-center justify-between mb-12">
            <h3 className="text-xl font-black text-white uppercase tracking-tight">Alocação por Ativo</h3>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-600 rounded-full" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Investido</span>
            </div>
          </div>
          <div className="h-[300px] md:h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={portfolio}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="ticker" 
                  axisLine={false} 
                  tickLine={false} 
                  dy={20}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  dx={-20}
                  tickFormatter={(val) => `R$ ${val/1000}k`}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '16px',
                    padding: '16px'
                  }}
                  itemStyle={{ color: '#fff', fontWeight: '900', textTransform: 'uppercase', fontSize: '12px' }}
                  labelStyle={{ color: '#64748b', marginBottom: '8px', fontWeight: '900', fontSize: '10px' }}
                />
                <Bar 
                  dataKey="totalInvested" 
                  radius={[8, 8, 0, 0]} 
                  animationDuration={2000}
                >
                  {portfolio.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
