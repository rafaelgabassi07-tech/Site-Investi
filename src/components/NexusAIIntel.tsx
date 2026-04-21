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
      className="bg-card border border-border rounded-xl md:rounded-2xl overflow-hidden relative group shadow-2xl mt-6"
    >
      <div className="p-6 md:p-8 space-y-6 relative z-10 text-center">
        <h3 className="text-[11px] font-black text-foreground uppercase italic tracking-[0.2em]">Nexus AI Intelligence: {ticker}</h3>
        <p className="text-tiny font-black text-muted-foreground uppercase italic tracking-widest">Aguardando Telemetria Alpha Brain...</p>
      </div>
    </motion.div>
  );
}
