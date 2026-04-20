import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Terminal, 
  Cpu, 
  Activity, 
  ShieldAlert, 
  Database,
  Network,
  CheckCircle2,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { nexusAI } from '../services/nexusAIService';

export default function NexusIAPanel() {
  const [healthData, setHealthData] = useState<any>(null);

  useEffect(() => {
    // Polling simulated to keep the "live" feeling
    const fetchHealth = () => {
      setHealthData(nexusAI.getSystemHealth());
    };
    
    fetchHealth();
    const interval = setInterval(fetchHealth, 3000);
    return () => clearInterval(interval);
  }, []);

  if (!healthData) return null;

  return (
    <div className="space-y-6 pb-24">
      <PageHeader 
        title="Nexus IA Terminal"
        description="Centro de Controle e Telemetria Neural do Sistema"
        icon={Terminal}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Core Status */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:col-span-1 border border-blue-500/20 bg-blue-950/20 rounded-3xl p-6 relative overflow-hidden"
        >
          <div className="absolute -top-10 -right-10 text-blue-500/5">
            <Cpu size={120} />
          </div>
          <h3 className="text-display-xs text-blue-400 mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 animate-pulse" />
            Core Status
          </h3>
          <div className="space-y-4">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">State</div>
              <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-widest">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                {healthData.status}
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Engine Mode</div>
              <div className="text-sm text-slate-300 font-mono">{healthData.mode}</div>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Compute Alloc</div>
              <div className="text-sm text-slate-300 font-mono">{healthData.ramUsage}</div>
            </div>
          </div>
        </motion.div>

        {/* Fallback Protocols */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-2 border border-emerald-500/20 bg-emerald-950/10 rounded-3xl p-6"
        >
          <h3 className="text-display-xs text-emerald-400 mb-6 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5" />
            Protocolos de Defesa & Fallback Ativos
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {healthData.activeProtocols.map((protocol: any, idx: number) => (
              <div key={idx} className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl relative overflow-hidden group">
                <div className="absolute -right-2 -top-2 w-12 h-12 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-colors" />
                <h4 className="text-sm font-bold text-slate-200 mb-2 font-mono flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  {protocol.name}
                </h4>
                <p className="text-xs text-slate-400">{protocol.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Action Logs */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="md:col-span-3 border border-slate-800 bg-[#020617]/50 rounded-3xl p-6"
        >
          <h3 className="text-display-xs text-slate-200 mb-6 flex items-center gap-2">
            <Network className="w-5 h-5" />
            Terminal de Decisões & System Logs
          </h3>
          <div className="h-[400px] overflow-y-auto pr-4 space-y-3 font-mono text-[11px] sm:text-xs">
            {healthData.recentLogs.map((log: any, idx: number) => (
              <div 
                key={idx} 
                className={`p-3 rounded-lg border ${
                  log.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-200' :
                  log.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-200' :
                  'bg-blue-500/5 border-blue-500/10 text-blue-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    {log.type === 'error' && <XCircle className="w-4 h-4 text-red-500" />}
                    {log.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                    {log.type === 'info' && <Database className="w-4 h-4 text-blue-500" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1 opacity-60 text-[10px]">
                      <span>[{new Date(log.time).toLocaleTimeString('pt-BR')}]</span>
                      <span className="uppercase tracking-widest">{log.type}</span>
                    </div>
                    <div className="font-bold">{log.message}</div>
                    {log.payload && (
                      <div className="mt-1 opacity-70 break-all">
                        {typeof log.payload === 'object' ? JSON.stringify(log.payload) : log.payload}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {healthData.recentLogs.length === 0 && (
              <div className="text-slate-500 text-center py-10">
                Nenhum log registrado na sessão atual.
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
