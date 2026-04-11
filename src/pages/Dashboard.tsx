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
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { TrendingUp, Info, Wallet, PieChart as PieChartIcon, ArrowUpRight, LayoutDashboard } from 'lucide-react';
import { motion } from 'motion/react';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';

export default function Dashboard() {
  const { portfolio, quotaHistory, loading } = usePortfolio();

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

  // Format quota history for chart
  const chartData = quotaHistory.length > 0 ? quotaHistory.map(q => {
    const d = new Date(q.date);
    return {
      name: `${d.getDate()}/${d.getMonth()+1}`,
      cota: q.quotaValue,
      patrimonio: q.totalPatrimony
    };
  }) : [
    { name: 'Início', cota: 1.0, patrimonio: 0 }
  ];

  // Calculate allocation by asset type
  const allocationMap = portfolio.reduce((acc, item) => {
    const type = item.assetType || 'OUTROS';
    acc[type] = (acc[type] || 0) + (item.currentValue || item.totalInvested);
    return acc;
  }, {} as Record<string, number>);

  const allocationData = Object.entries(allocationMap).map(([name, value]) => ({
    name,
    value
  })).sort((a, b) => b.value - a.value);

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'];

  return (
    <div className="space-y-10">
      <PageHeader 
        title="Visão Geral"
        description={<>Performance consolidada da sua carteira <span className="text-blue-500 font-semibold">Nexus Invest</span>.</>}
        icon={LayoutDashboard}
        actions={
          <div className="px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Mercado Aberto
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 md:p-8 shadow-lg lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Rentabilidade (Cota)</h3>
              <p className="text-xs text-slate-400 mt-1">Método Time-Weighted Return (TWR)</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span className="text-xs font-medium text-slate-400">Valor da Cota</span>
            </div>
          </div>
          <div className="h-[300px] md:h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCota" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  dy={10}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  dx={-10}
                  domain={['auto', 'auto']}
                  tickFormatter={(val) => val.toFixed(2)}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <Tooltip 
                  cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '4 4' }}
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    border: '1px solid #1e293b',
                    borderRadius: '12px',
                    padding: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
                  }}
                  itemStyle={{ color: '#fff', fontWeight: '600', fontSize: '13px' }}
                  labelStyle={{ color: '#94a3b8', marginBottom: '4px', fontWeight: '500', fontSize: '12px' }}
                  formatter={(value: number) => [value.toFixed(4), 'Valor da Cota']}
                />
                <Area 
                  type="stepAfter" 
                  dataKey="cota" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorCota)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 md:p-8 shadow-lg flex flex-col"
        >
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white tracking-tight">Alocação por Classe</h3>
            <p className="text-xs text-slate-400 mt-1">Distribuição do patrimônio</p>
          </div>
          
          {allocationData.length > 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={allocationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {allocationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 'Valor']}
                      contentStyle={{ 
                        backgroundColor: '#0f172a', 
                        border: '1px solid #1e293b',
                        borderRadius: '12px'
                      }}
                      itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="w-full mt-6 space-y-3">
                {allocationData.map((item, idx) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className="text-sm text-slate-300 font-medium">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-white block">
                        {((item.value / totalCurrentValue) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-slate-500 text-sm">Nenhum ativo na carteira</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
