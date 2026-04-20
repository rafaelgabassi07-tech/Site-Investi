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
      className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6 mb-6 md:mb-10"
    >
      <div className="flex items-center gap-4 md:gap-6">
        {Icon && (
          <div className="w-10 h-10 md:w-16 md:h-16 bg-blue-500 rounded-2xl flex items-center justify-center text-white border border-blue-400 shadow-xl shadow-blue-500/10 relative group overflow-hidden shrink-0">
            <Icon className="w-5 h-5 md:w-8 md:h-8 group-hover:scale-110 transition-transform duration-500" strokeWidth={2.5} />
          </div>
        )}
        <div>
          <h2 className="nexus-hero mb-1 md:mb-2 !text-foreground">
            {title}
          </h2>
          <div className="nexus-label max-w-xl opacity-80 leading-tight">
            {description}
          </div>
        </div>
      </div>
      {actions && <div className="flex items-center gap-3 md:gap-4">{actions}</div>}
    </motion.div>
  );
}
