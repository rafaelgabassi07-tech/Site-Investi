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
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10"
    >
      <div className="flex items-center gap-5">
        {Icon && (
          <div className="w-14 h-14 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-sm">
            <Icon size={28} strokeWidth={2} />
          </div>
        )}
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-1">{title}</h2>
          <div className="text-slate-400 font-medium text-sm md:text-base">{description}</div>
        </div>
      </div>
      {actions && <div className="flex items-center gap-4">{actions}</div>}
    </motion.div>
  );
}
