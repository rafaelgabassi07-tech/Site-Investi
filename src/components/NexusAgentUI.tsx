import { useState, useEffect } from 'react';
import { Bot, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { nexusAgentService, AgentStatus } from '../services/NexusAgent';

export function NexusAgentUI() {
  const [status, setStatus] = useState<AgentStatus>({ state: 'idle', currentTask: '', progress: 0 });

  useEffect(() => {
    return nexusAgentService.subscribe(setStatus);
  }, []);

  return (
    <AnimatePresence>
      {status.state !== 'idle' && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="fixed top-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-card border border-border p-3 pr-5 rounded-full shadow-xl"
        >
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
            {status.state === 'syncing' && <Loader2 className="w-4 h-4 animate-spin" />}
            {status.state === 'analyzing' && <Sparkles className="w-4 h-4 animate-pulse text-primary" />}
            {status.state === 'complete' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              {status.state === 'syncing' ? 'Nexus Sincronizando' : status.state === 'analyzing' ? 'Nexus Analisando' : 'Nexus Completo'}
            </span>
            <span className="text-xs font-semibold text-foreground line-clamp-1 max-w-[220px]">
              {status.currentTask || status.lastInsight || 'Atualizando ativos'}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
