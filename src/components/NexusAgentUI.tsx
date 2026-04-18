import { useState, useEffect } from 'react';
import { Bot, Sparkles, Loader2, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { nexusAgentService, AgentStatus } from '../services/NexusAgent';
import { usePortfolio } from '../hooks/usePortfolio';

export function NexusAgentUI() {
  const [status, setStatus] = useState<AgentStatus>({ state: 'idle', currentTask: '', progress: 0 });
  const { portfolio } = usePortfolio();

  useEffect(() => {
    return nexusAgentService.subscribe(setStatus);
  }, []);

  const handleStart = () => {
    nexusAgentService.runSync(portfolio);
  };

  if (portfolio.length === 0) return null;

  return (
    <div className="bg-white/5 border border-white/5 rounded-[2rem] p-6 relative overflow-hidden group">
      {/* Background Glow */}
      <div className={`absolute -right-20 -top-20 w-64 h-64 rounded-full blur-[100px] transition-colors duration-1000 opacity-20 ${
        status.state === 'syncing' ? 'bg-blue-500' : 
        status.state === 'analyzing' ? 'bg-purple-500' : 
        status.state === 'complete' ? 'bg-emerald-500' : 
        'bg-slate-500'
      }`} />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-500 ${
            status.state === 'idle' ? 'bg-white/5 border-white/10 text-slate-400' :
            status.state === 'syncing' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400 animate-pulse' :
            status.state === 'analyzing' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' :
            status.state === 'complete' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
            'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            {status.state === 'idle' && <Bot className="w-7 h-7" />}
            {status.state === 'syncing' && <Loader2 className="w-7 h-7 animate-spin" />}
            {status.state === 'analyzing' && <Sparkles className="w-7 h-7" />}
            {status.state === 'complete' && <CheckCircle2 className="w-7 h-7" />}
            {status.state === 'error' && <AlertCircle className="w-7 h-7" />}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-label text-white uppercase italic tracking-tight">Nexus Agent Proventos</h3>
              {status.state !== 'idle' && (
                <span className="text-[10px] font-black bg-blue-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">Ativo</span>
              )}
            </div>
            <p className="text-tiny font-bold text-slate-500 uppercase tracking-widest leading-none">
              {status.currentTask || 'O robô inteligente da sua carteira está pronto.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <AnimatePresence mode="wait">
            {status.lastInsight && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="hidden xl:flex items-center gap-3 bg-white/5 border border-white/5 px-4 py-2.5 rounded-xl max-w-sm"
              >
                <TrendingUp className="w-4 h-4 text-purple-400 shrink-0" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide italic line-clamp-1">
                  {status.lastInsight}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {status.state === 'idle' ? (
            <button
              onClick={handleStart}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:scale-105"
            >
              Iniciar Sincronização AI
            </button>
          ) : (
            <div className="w-32 bg-white/5 rounded-full h-2 overflow-hidden border border-white/5">
              <motion.div
                className="h-full bg-blue-500"
                initial={{ width: 0 }}
                animate={{ width: `${status.progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
