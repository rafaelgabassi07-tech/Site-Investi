import { Briefcase, Plus } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { useNavigate } from 'react-router-dom';
import { AssetList } from '../components/AssetList';
import { motion } from 'motion/react';

export default function Portfolio() {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <PageHeader 
        title="Patrimônio"
        description={<>Gestão estratégica de ativos e alocação via <span className="text-blue-500 font-bold">Invest Engine</span>.</>}
        icon={Briefcase}
        actions={
          <button 
            onClick={() => navigate('/portfolio/lancamentos')}
            className="btn-primary py-2 px-4 shadow-blue-500/20"
          >
            <Plus className="icon-sm" />
            Nova Operação
          </button>
        }
      />

      <div className="space-y-6">
        <AssetList />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="flex flex-col md:flex-row items-center gap-4 py-8 border-t border-white/5"
      >
        <div className="flex items-center gap-4">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(37,99,235,0.6)]" />
          <span className="text-tiny font-bold text-slate-500 uppercase tracking-[0.2em]">Nexus Neural Engine: Link em Tempo Real Estabelecido</span>
        </div>
        <div className="md:ml-auto flex items-center gap-5 opacity-40 text-[10px] font-black uppercase tracking-widest text-slate-600">
          <span>Version v2.9.2</span>
          <div className="w-px h-4 bg-white/10" />
          <span className="text-emerald-500">Status: Optimal</span>
        </div>
      </motion.div>
    </div>
  );
}
