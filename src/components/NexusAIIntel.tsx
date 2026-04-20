import { motion } from 'motion/react';
import { Cpu, AlertCircle } from 'lucide-react';

interface Props {
  ticker: string;
  assetData: any;
  history: any[];
}

export function NexusAIIntel({ ticker }: Props) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl md:rounded-2xl overflow-hidden relative group shadow-2xl"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.02] to-transparent pointer-events-none" />
      <div className="p-6 md:p-8 space-y-6 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-xl shadow-blue-500/5">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[11px] font-black text-foreground uppercase italic tracking-[0.2em]">Nexus AI Intelligence</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest italic">Análise desativada</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-sm md:text-base text-foreground font-medium leading-relaxed italic">
            "A análise de IA está temporariamente indisponível."
          </p>
        </div>

        <div className="flex items-center gap-2 pt-2 text-[9px] font-black text-muted-foreground uppercase tracking-widest italic opacity-50 group-hover:opacity-100 transition-opacity">
          <AlertCircle size={10} />
          <span>Serviço de inteligência artificial desativado por limite de quota.</span>
        </div>
      </div>
    </motion.div>
  );
}
