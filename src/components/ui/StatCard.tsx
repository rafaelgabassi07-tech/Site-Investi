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
    blue: 'text-primary bg-primary/5 border-primary/10',
    emerald: 'text-emerald-600 bg-emerald-500/5 border-emerald-500/10',
    indigo: 'text-indigo-600 bg-indigo-500/5 border-indigo-500/10',
    orange: 'text-orange-600 bg-orange-500/5 border-orange-500/10',
    purple: 'text-purple-600 bg-purple-500/5 border-purple-500/10',
    slate: 'text-slate-600 bg-slate-500/5 border-slate-500/10',
    red: 'text-red-600 bg-red-500/5 border-red-500/10'
  };

  const styleClass = colorMap[color] || colorMap.blue;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">{label}</p>
          <h3 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
            {value}
          </h3>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${styleClass}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {trend && (
        <div className={`flex items-center gap-1 text-xs font-bold ${color === 'emerald' ? 'text-emerald-600' : color === 'red' ? 'text-red-600' : 'text-muted-foreground'}`}>
          {TrendIcon && <TrendIcon className="w-3.5 h-3.5" />}
          <span className="uppercase tracking-widest">{trend}</span>
        </div>
      )}
    </motion.div>
  );
}
