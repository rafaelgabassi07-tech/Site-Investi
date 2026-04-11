import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  trend?: string;
  trendIcon?: LucideIcon;
  delay?: number;
}

export function StatCard({ label, value, icon: Icon, color, trend, trendIcon: TrendIcon, delay = 0 }: StatCardProps) {
  const colorMap: Record<string, string> = {
    blue: 'blue',
    emerald: 'emerald',
    indigo: 'indigo',
    orange: 'orange',
    purple: 'purple',
    slate: 'slate',
    red: 'red'
  };

  const c = colorMap[color] || 'blue';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 relative group overflow-hidden shadow-lg"
    >
      <div className={`absolute top-0 right-0 w-32 h-32 bg-${c}-600/5 blur-[50px] -z-10 group-hover:bg-${c}-600/10 transition-all duration-500`} />
      
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-slate-400">{label}</p>
        <div className={`w-10 h-10 bg-${c}-500/10 rounded-xl flex items-center justify-center text-${c}-400`}>
          <Icon size={20} />
        </div>
      </div>

      <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">
        {value}
      </h3>

      {trend && (
        <div className={`flex items-center gap-1.5 text-sm font-medium ${c === 'emerald' ? 'text-emerald-400' : c === 'red' ? 'text-red-400' : 'text-slate-400'}`}>
          {TrendIcon && <TrendIcon size={16} />}
          <span>{trend}</span>
        </div>
      )}
    </motion.div>
  );
}
