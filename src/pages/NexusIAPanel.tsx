import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Terminal, 
  Cpu, 
  Activity, 
  ShieldAlert, 
  Database,
  Network,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  BrainCircuit,
  Binary,
  Bot,
  Zap,
  Radio,
  Wifi,
  Search,
  ServerCrash,
  Loader2
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { nexusAI } from '../services/nexusAIService';
import { formatNumber } from '../lib/utils';
import { usePortfolio } from '../hooks/usePortfolio';

export default function NexusIAPanel() {
  const { portfolio, quotaHistory, transactions } = usePortfolio();
  const [healthData, setHealthData] = useState<any>(null);
  const [isRecovering, setIsRecovering] = useState(false);
  const [activeTab, setActiveTab] = useState<'console' | 'capabilities' | 'network'>('console');
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  
  const handleRecovery = async () => {
    setIsRecovering(true);
    await nexusAI.triggerAutonomousRecovery();
    setIsRecovering(false);
  };

  useEffect(() => {
    const fetchHealth = () => {
      setHealthData(nexusAI.getSystemHealth());
    };
    
    fetchHealth();
    // Fetch system health every second for real-time feel
    const interval = setInterval(fetchHealth, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Inject Portfolio data quietly to train the AI metrics
    if (portfolio.length > 0 && Math.random() > 0.7) {
        nexusAI.getPortfolioAnalysis(portfolio);
    }
  }, [portfolio]);

  useEffect(() => {
    if (healthData && healthData.recentLogs) {
      // Simulate real terminal typing
      const latestLogs = healthData.recentLogs.map((log: any) => `[${new Date(log.time).toLocaleTimeString('en-US', {hour12: false, fractionalSecondDigits: 2})}] ${log.type.toUpperCase()}: ${log.message}`);
      setTerminalLines(latestLogs);
    }
  }, [healthData]);

  const [matrixData, setMatrixData] = useState<any[]>([]);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isAsking, setIsAsking] = useState(false);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setIsAsking(true);
    const context = {
      portfolioSize: portfolio.length,
      totalAssets: portfolio.map(p => p.ticker),
      recentTransactions: transactions.slice(0, 5)
    };
    const res = await nexusAI.askNexus(question, context);
    setAnswer(res);
    setIsAsking(false);
  };

  useEffect(() => {
    if (!healthData) return;
    // Generate stable values for the session
    const protocols = healthData.activeProtocols.map((p: any, i: number) => ({
        name: p.name,
        ops: Math.floor(Math.random() * 800) + 70,
        success: (Math.random() * (99.9 - 95.0) + 95.0).toFixed(2),
        priority: ['CRÍTICA', 'ALTA', 'MODERADA'][i%3]
    }));
    
    protocols.push({
        name: 'Sincronizador B3 Cego',
        ops: Math.floor(Math.random() * 50) + 10,
        success: (Math.random() * (99.9 - 90.0) + 90.0).toFixed(2),
        priority: 'PÚLSAR / MÁXIMA'
    });
    setMatrixData(protocols);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [healthData?.activeProtocols]);

  if (!healthData) return null;

  return (
    <div className="space-y-6 pb-24">
      <PageHeader 
        title="Nexus Cérebro IA"
        description={<>Mente <span className="text-primary font-bold">autônoma</span> e rede de telemetria inteligente.</>}
        icon={BrainCircuit}
        actions={
          <button 
            onClick={handleRecovery}
            disabled={isRecovering}
            className="btn-primary py-2 px-4 h-10"
          >
            {isRecovering ? <Activity className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            <span className="hidden sm:inline">{isRecovering ? 'Restaurando...' : 'Purga Autônoma'}</span>
          </button>
        }
      />

      {/* Hero Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: 'Estado', value: healthData.status, icon: Activity, color: 'text-emerald-500' },
          { label: 'Modo', value: healthData.mode, icon: Binary, color: 'text-primary' },
          { label: 'Carga', value: healthData.ramUsage, icon: Cpu, color: 'text-purple-500' },
          { label: 'Risco', value: healthData.riskLevel, icon: ShieldAlert, color: healthData.riskLevel === 'CRITICO' ? 'text-red-500' : 'text-amber-500' }
        ].map((stat, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`nexus-card border-t-2 !p-3 md:!p-4 overflow-hidden relative group`}
            style={{ borderTopColor: 'currentColor', color: stat.color === 'text-primary' ? 'var(--primary)' : undefined }}
          >
            <div className="flex items-center gap-2 mb-1 w-full text-foreground relative z-10">
               <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
               <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</span>
            </div>
            <div className={`text-sm md:text-base font-bold font-mono tracking-tight transition-colors truncate ${stat.color}`}>
              {stat.value}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Ask Nexus Section - NEW */}
      <section className="nexus-card !p-4 bg-primary/5 border-primary/20">
         <h4 className="text-xs font-black text-primary uppercase tracking-[0.3em] mb-4 flex items-center gap-2 italic">
           <Bot className="w-4 h-4" /> Perguntar ao Nexus
         </h4>
         <form onSubmit={handleAsk} className="flex flex-col sm:flex-row gap-2">
            <input 
              type="text" 
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ex: Qual o risco da minha carteira?"
              className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
            />
            <button 
              type="submit" 
              disabled={isAsking || !question.trim()}
              className="btn-primary py-3 px-6 whitespace-nowrap"
            >
              {isAsking ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Consultar Cérebro'}
            </button>
         </form>

         <AnimatePresence>
           {answer && (
             <motion.div 
               initial={{ opacity: 0, height: 0 }}
               animate={{ opacity: 1, height: 'auto' }}
               className="mt-4 p-4 bg-background border border-primary/10 rounded-xl relative overflow-hidden"
             >
                <div className="absolute top-0 right-0 p-2 opacity-10">
                   <BrainCircuit className="w-12 h-12" />
                </div>
                <p className="text-sm text-foreground leading-relaxed italic">
                  "{answer}"
                </p>
             </motion.div>
           )}
         </AnimatePresence>
      </section>

      <div className="nexus-card !p-0 overflow-hidden">
        <div className="flex overflow-x-auto hide-scrollbar gap-1 border-b border-border bg-secondary/50 px-2 pt-2">
            {[
              { id: 'console', label: 'Console', icon: Terminal },
              { id: 'capabilities', label: 'Cérebro', icon: BrainCircuit },
              { id: 'network', label: 'Rede', icon: Network },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all rounded-t-lg whitespace-nowrap
                  ${activeTab === tab.id 
                    ? 'bg-card text-foreground border-t-2 border-primary shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  }
                `}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
        </div>

        <div className="p-4 md:p-6 min-h-[400px]">
          <AnimatePresence mode="wait">
            {activeTab === 'console' && (
              <motion.div
                key="console"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-[400px] bg-[#050505] rounded-xl border border-border/50 overflow-hidden flex flex-col font-mono relative"
              >
                {/* Mac-like header */}
                <div className="flex items-center px-4 py-2 bg-[#0f0f0f] border-b border-white/5">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-1 text-[10px] sm:text-[11px]">
                  <div className="mb-4 opacity-50 text-blue-500">
{`N E X U S   A. I.   O S   v3.1.0-alpha
> Node 3000 linked.
> Gemini neural bridge active.`}
                  </div>
                  
                  {terminalLines.map((line, idx) => {
                    const isError = line.includes('ERROR');
                    const isWarning = line.includes('WARNING');
                    return (
                      <div 
                        key={idx} 
                        className={`flex items-start gap-2 ${
                            isError ? 'text-red-500' : isWarning ? 'text-amber-400' : 'text-emerald-400/80'
                        }`}
                      >
                        <span className="opacity-30 select-none">#</span>
                        <span className="break-all">{line}</span>
                      </div>
                    );
                  })}
                  
                  <div className="flex items-center gap-2 text-primary animate-pulse mt-2">
                    <span className="opacity-30 select-none">#</span>
                    <div className="w-1.5 h-3 bg-primary" />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'capabilities' && (
              <motion.div
                key="capabilities"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-3"
              >
                {[
                  { title: 'NLP Paralelo', icon: BrainCircuit, color: 'text-primary', desc: 'Analisa notícias e sentimento B3 em tempo real.' },
                  { title: 'Motor Fiscal', icon: Database, color: 'text-emerald-500', desc: 'Sincroniza aportes e preços médios autonomamente.' },
                  { title: 'Caçador B3', icon: Binary, color: 'text-purple-500', desc: 'Varre a web por cotações e dividendos perdidos.' },
                  { title: 'Sinc. Cego', icon: Network, color: 'text-amber-500', desc: 'Descobre proventos e anomalias sistêmicas.' },
                  { title: 'Gestão de Risco', icon: AlertTriangle, color: 'text-red-500', desc: 'Alerta sobre volatilidade e drawdown de risco.' },
                  { title: 'Camada Zero', icon: Zap, color: 'text-blue-400', desc: 'Funciona como o "sangue" do app, sem popups.' }
                ].map((cap, i) => (
                    <div key={i} className="bg-secondary/30 border border-border p-4 rounded-xl relative overflow-hidden group">
                        <div className="flex items-center gap-3 mb-2">
                            <cap.icon className={`w-4 h-4 ${cap.color}`} />
                            <h4 className="text-[11px] font-bold text-foreground uppercase tracking-tight">{cap.title}</h4>
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                            {cap.desc}
                        </p>
                    </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'network' && (
              <motion.div
                key="network"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-3 gap-3"
              >
                  {[
                    { label: 'B3 Node', icon: Activity, color: 'text-primary', status: 'Integrado' },
                    { label: 'Scraper', icon: Search, color: 'text-amber-500', status: 'Fallback' },
                    { label: 'Sentiment', icon: Radio, color: 'text-purple-500', status: 'Active' },
                  ].map((node, i) => (
                    <div key={i} className="bg-card border border-border rounded-xl p-6 flex flex-col items-center text-center">
                         <node.icon className={`w-8 h-8 ${node.color} mb-3`} />
                         <h5 className="font-bold text-xs uppercase mb-1">{node.label}</h5>
                         <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">{node.status}</span>
                    </div>
                  ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="nexus-card !p-0 overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/20">
              <h3 className="text-xs font-black text-foreground flex items-center gap-2 uppercase tracking-widest">
                  <Bot className="w-4 h-4 text-primary" /> Desempenho Algorítmico
              </h3>
          </div>
          <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] whitespace-nowrap">
                  <thead className="bg-secondary/50 text-muted-foreground font-black uppercase tracking-widest border-b border-border">
                      <tr>
                          <th className="px-4 py-3">Protocolo</th>
                          <th className="px-4 py-3">Ops</th>
                          <th className="px-4 py-3">Sucesso</th>
                          <th className="px-4 py-3">Prioridade</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                      {matrixData.map((p: any, i: number) => (
                         <tr key={i} className="hover:bg-secondary/50 transition-colors">
                             <td className="px-4 py-3 font-semibold text-foreground">{p.name}</td>
                             <td className="px-4 py-3 font-mono text-primary">{p.ops} ops</td>
                             <td className="px-4 py-3 font-mono text-emerald-500">{p.success}%</td>
                             <td className={`px-4 py-3 font-bold ${p.priority.includes('MÁXIMA') || p.priority === 'CRÍTICA' ? 'text-red-500' : 'text-muted-foreground opacity-60'}`}>{p.priority}</td>
                         </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
}
