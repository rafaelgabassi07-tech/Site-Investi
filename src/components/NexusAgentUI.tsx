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
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-black/80 backdrop-blur-md border border-white/10 p-3 pr-4 rounded-full shadow-2xl"
        >
          <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            {status.state === 'syncing' && <Loader2 className="w-4 h-4 animate-spin" />}
            {status.state === 'analyzing' && <Sparkles className="w-4 h-4 animate-pulse text-purple-400" />}
            {status.state === 'complete' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {status.state === 'syncing' ? 'Sincronizando' : status.state === 'analyzing' ? 'Analisando' : 'Completo'}
            </span>
            <span className="text-xs font-medium text-white line-clamp-1 max-w-[200px]">
              {status.currentTask || status.lastInsight || 'Atualizando dividendos'}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
