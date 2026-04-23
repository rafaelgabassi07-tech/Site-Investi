import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cpu, AlertCircle, Loader2, Zap, BrainCircuit } from 'lucide-react';
import { nexusAI } from '../services/nexusAIService';
import { NexusEngine } from '../lib/nexus/engine';

interface Props {
  ticker: string;
}

export function NexusAIIntel({ ticker }: Props) {
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const context = await NexusEngine.getAIContextForAsset(ticker);
      const result = await nexusAI.analyzeAsset(ticker, context);
      setAnalysis(result);
    } catch (e: any) {
      setError(e.message || 'Falha na telemetria Alpha Brain');
    } finally {
      setLoading(false);
    }
  }, [ticker]);

  useEffect(() => {
    runAnalysis();
  }, [ticker, runAnalysis]);

  const parts = analysis.split('PONTO CRÍTICO:');
  const mainAnalysis = parts[0]?.replace('ANÁLISE NEXUS:', '').trim();
  const criticalPoint = parts[1]?.trim();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-primary/20 rounded-xl md:rounded-2xl overflow-hidden relative group shadow-2xl mt-6"
    >
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
        <BrainCircuit className="w-24 h-24" />
      </div>

      <div className="p-5 md:p-6 space-y-4 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Cpu className={`w-4 h-4 text-primary ${loading ? 'animate-spin' : ''}`} />
            </div>
            <h3 className="text-[11px] font-black text-foreground uppercase italic tracking-[0.2em]">Nexus AI Intelligence: {ticker}</h3>
          </div>
          <button 
            onClick={runAnalysis}
            disabled={loading}
            className="p-2 hover:bg-primary/10 rounded-full transition-colors text-primary disabled:opacity-30"
          >
            <Zap className={`w-3 h-3 ${loading ? 'animate-pulse' : ''}`} />
          </button>
        </div>

        <div className="min-h-[100px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-8 flex flex-col items-center gap-3"
              >
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <p className="text-[10px] font-black text-muted-foreground uppercase italic tracking-widest animate-pulse">Sintonizando frequências neurais...</p>
              </motion.div>
            ) : error ? (
              <motion.div 
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl flex items-center gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                <p className="text-xs font-bold text-red-400 uppercase tracking-widest">{error}</p>
              </motion.div>
            ) : (
              <motion.div 
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                   <span className="text-[9px] font-black text-primary uppercase tracking-widest opacity-60">Análise Proativa</span>
                   <p className="text-sm md:text-base text-foreground leading-relaxed font-medium italic border-l-2 border-primary/40 pl-4">
                     {mainAnalysis || 'Telemetria Alpha Brain iniciada. Aguardando conclusão dos tensores de dados...'}
                   </p>
                </div>

                {criticalPoint && (
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                       <AlertCircle className="w-3 h-3 text-primary" />
                       <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Ponto Crítico</span>
                    </div>
                    <p className="text-xs font-bold text-foreground/80 leading-relaxed italic">
                      {criticalPoint}
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/5">
           <div className="flex gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[8px] font-mono text-muted-foreground/50 uppercase tracking-tighter">Soberano Mode Active</span>
           </div>
           <span className="text-[8px] font-mono text-muted-foreground/30">Node ID: 0xFF-ALPHA-BRAIN</span>
        </div>
      </div>
    </motion.div>
  );
}
