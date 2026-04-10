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
      className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16"
    >
      <div className="flex items-start gap-6">
        {Icon && (
          <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-[0_0_30px_rgba(37,99,235,0.1)] mt-1">
            <Icon size={32} />
          </div>
        )}
        <div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-white uppercase mb-3">{title}</h2>
          <div className="text-slate-400 font-medium text-lg">{description}</div>
        </div>
      </div>
      {actions && <div className="flex items-center gap-4">{actions}</div>}
    </motion.div>
  );
}
