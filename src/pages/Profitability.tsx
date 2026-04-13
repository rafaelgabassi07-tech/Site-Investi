import { PageHeader } from '../components/ui/PageHeader';
import { TrendingUp, Calendar, ArrowUpRight, ArrowDownRight, BarChart3, PieChart, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { usePortfolio } from '../hooks/usePortfolio';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function Profitability() {
  const { portfolio } = usePortfolio();
  
  // Mock performance data
  const performanceData = [
    { month: 'Jan', value: 100, benchmark: 100 },
    { month: 'Fev', value: 105, benchmark: 102 },
    { month: 'Mar', value: 103, benchmark: 101 },
    { month: 'Abr', value: 108, benchmark: 104 },
    { month: 'Mai', value: 112, benchmark: 106 },
    { month: 'Jun', value: 110, benchmark: 105 },
    { month: 'Jul', value: 115, benchmark: 108 },
  ];

  const stats = [
    { label: 'Rentabilidade Total', value: '+15.4%', icon: TrendingUp, color: 'emerald' },
    { label: 'Média Mensal', value: '+2.1%', icon: Calendar, color: 'blue' },
    { label: 'vs. IBOVESPA', value: '+4.2%', icon: Activity, color: 'purple' },
    { label: 'Melhor Mês', value: '+5.2%', icon: ArrowUpRight, color: 'emerald' },
  ];

  return (
    <div className="space-y-6 pb-12">
      <PageHeader 
        title="Rentabilidade"
        description="Acompanhe o desempenho histórico da sua carteira comparado aos principais índices."
        icon={BarChart3}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="card p-6 relative overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 bg-${stat.color}-500/5 blur-2xl -z-10`} />
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-8 h-8 rounded-lg bg-${stat.color}-500/10 flex items-center justify-center text-${stat.color}-500`}>
                <stat.icon size={16} />
              </div>
              <span className="text-xxs font-black text-slate-500 uppercase tracking-widest">{stat.label}</span>
            </div>
            <div className={`text-2xl font-black text-${stat.color}-400 tracking-tighter`}>{stat.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-2 card p-6 md:p-8"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-white uppercase tracking-tight flex items-center gap-3">
              <Activity className="text-blue-500" size={20} />
              Evolução Patrimonial
            </h3>
            <div className="flex gap-2">
              <span className="flex items-center gap-2 text-xxs font-bold text-slate-500">
                <div className="w-3 h-3 rounded-full bg-blue-500" /> Carteira
              </span>
              <span className="flex items-center gap-2 text-xxs font-bold text-slate-500">
                <div className="w-3 h-3 rounded-full bg-slate-700" /> IBOVESPA
              </span>
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                <Area type="monotone" dataKey="benchmark" stroke="#475569" strokeWidth={2} fill="transparent" strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="card p-6 md:p-8"
        >
          <h3 className="text-xl font-bold text-white uppercase tracking-tight mb-8 flex items-center gap-3">
            <PieChart className="text-purple-500" size={20} />
            Atribuição de Performance
          </h3>
          <div className="space-y-6">
            {[
              { label: 'Ações', value: 65, color: 'bg-blue-500' },
              { label: 'FIIs', value: 25, color: 'bg-emerald-500' },
              { label: 'Renda Fixa', value: 10, color: 'bg-slate-500' },
            ].map((item, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                  <span className="text-slate-400">{item.label}</span>
                  <span className="text-white">{item.value}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${item.value}%` }}
                    className={`h-full ${item.color}`}
                  />
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-12 p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
            <p className="text-xs text-slate-400 leading-relaxed italic">
              "Sua carteira superou o IBOVESPA em 4.2% nos últimos 6 meses, impulsionada principalmente pelo setor de tecnologia."
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
