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
    slate: 'slate'
  };

  const c = colorMap[color] || 'blue';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="card p-8 md:p-10 relative group overflow-hidden"
    >
      <div className={`absolute top-0 right-0 w-40 h-40 bg-${c}-600/5 blur-[80px] -z-10 group-hover:bg-${c}-600/10 transition-all duration-700`} />
      
      <div className="flex items-center gap-4 mb-8">
        <div className={`w-12 h-12 bg-${c}-600/10 rounded-2xl flex items-center justify-center text-${c}-500 border border-${c}-500/20`}>
          <Icon size={24} />
        </div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{label}</p>
      </div>

      <h3 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter mb-8 text-white">
        {value}
      </h3>

      {trend && (
        <div className={`flex items-center gap-2 text-sm font-bold ${c === 'emerald' ? 'text-emerald-400' : 'text-slate-400'}`}>
          {TrendIcon && <TrendIcon size={18} className={`text-${c}-500`} />}
          <span className="uppercase tracking-widest text-[10px] font-black">{trend}</span>
        </div>
      )}
    </motion.div>
  );
}
