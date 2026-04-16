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
      <div className="flex items-center gap-6">
        {Icon && (
          <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-blue-600/20 to-blue-400/5 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-2xl shadow-blue-500/10 relative group overflow-hidden">
            <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Icon className="w-6 h-6 md:w-8 md:h-8 group-hover:scale-110 transition-transform duration-500" strokeWidth={2.5} />
          </div>
        )}
        <div>
          <h2 className="text-display-sm text-white md:text-display-md mb-2 leading-none italic tracking-tighter">
            {title}
          </h2>
          <div className="text-xs md:text-tiny font-black text-slate-500 uppercase tracking-[0.2em] max-w-xl opacity-80">
            {description}
          </div>
        </div>
      </div>
      {actions && <div className="flex items-center gap-4">{actions}</div>}
    </motion.div>
  );
}
