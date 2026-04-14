import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description: string | React.ReactNode;
  icon?: LucideIcon;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, icon: Icon, actions }: PageHeaderProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10"
    >
      <div className="flex items-center gap-5">
        {Icon && (
          <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-600/20 to-cyan-500/20 rounded-xl flex items-center justify-center text-blue-500 border border-blue-500/30 shadow-xl shadow-blue-500/10">
            <Icon className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.5} />
          </div>
        )}
        <div>
          <h2 className="text-xl md:text-2xl font-black tracking-tighter text-white mb-1 uppercase italic leading-none">
            {title}
          </h2>
          <div className="text-slate-400 font-bold text-xs md:text-sm tracking-tight max-w-xl">
            {description}
          </div>
        </div>
      </div>
      {actions && <div className="flex items-center gap-4">{actions}</div>}
    </motion.div>
  );
}
