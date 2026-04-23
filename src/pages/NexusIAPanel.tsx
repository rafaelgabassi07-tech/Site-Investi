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
  Hash,
  Bot,
  Zap,
  Radio,
  Wifi,
  Search,
  ServerCrash,
  Loader2,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { PageHeader } from '../components/ui/PageHeader';
import { nexusAI } from '../services/nexusAIService';
import { formatNumber } from '../lib/utils';
import { usePortfolio } from '../hooks/usePortfolio';

export default function NexusIAPanel() {
  const { portfolio, quotaHistory, transactions } = usePortfolio();
  const [healthData, setHealthData] = useState<any>(null);
  const [isRecovering, setIsRecovering] = useState(false);
  const [activeTab, setActiveTab] = useState<'console' | 'capabilities' | 'network' | 'metrics'>('console');
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [neuralMetrics, setNeuralMetrics] = useState<any[]>([]);
  
  const handleRecovery = async () => {
    setIsRecovering(true);
    await nexusAI.triggerAutonomousRecovery();
    setIsRecovering(false);
  };

  useEffect(() => {
    let mounted = true;
    const fetchHealth = async () => {
      const metrics = await nexusAI.getNeuralMetrics();
      const engineHealth = await nexusAI.getEngineHealth();
      const health = nexusAI.getSystemHealth();
      
      if (mounted) {
         setHealthData({ ...health, ...engineHealth });
         setNeuralMetrics(metrics);
      }
    };
    
    fetchHealth();
    // Fetch system health every second for real-time feel
    const interval = setInterval(fetchHealth, 1000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
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
  const [answerHash, setAnswerHash] = useState('');
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
    setAnswerHash(Math.random().toString(16).slice(2, 10).toUpperCase());
    setIsAsking(false);
  };

  useEffect(() => {
    if (!healthData) return;
    
    // Create or update matrix values that fluctuate every second
    const protocols = (healthData.activeProtocols || []).map((p: any, i: number) => ({
        name: p.name,
        ops: Math.floor(Math.random() * 800) + 70,
        success: (98.0 + Math.random() * 1.9).toFixed(2),
        priority: ['CRÍTICA', 'ALTA', 'MODERADA'][i%3]
    }));
    
    protocols.push({
        name: 'Sincronizador B3 Cego',
        ops: Math.floor(Math.random() * 50) + 10,
        success: (97.0 + Math.random() * 2.9).toFixed(2),
        priority: 'PÚLSAR / MÁXIMA'
    });
    setMatrixData(protocols);
  }, [healthData]);

  const [processingData, setProcessingData] = useState<any[]>([
    { name: 'Sincronizador B3 Cego', progress: 85, speed: '420ms' },
    { name: 'NLP Sentiment Scan', progress: 42, speed: '1.2s' },
    { name: 'Web Crawler (Nexus)', progress: 68, speed: '850ms' },
    { name: 'Calculadora de Drawdown', progress: 95, speed: '15ms' }
  ]);

  useEffect(() => {
    if (!healthData) return;
    
    // Update processing progress randomly to simulate active work
    setProcessingData(prev => prev.map(p => {
      const delta = Math.floor(Math.random() * 5) - 2;
      const newProgress = Math.max(10, Math.min(100, p.progress + delta));
      const speedValue = parseFloat(p.speed);
      const speedUnit = p.speed.includes('ms') ? 'ms' : 's';
      const newSpeed = speedUnit === 'ms' 
        ? `${Math.max(10, Math.min(900, speedValue + (Math.random() * 40 - 20))).toFixed(0)}ms`
        : `${(Math.max(0.5, Math.min(2.5, speedValue + (Math.random() * 0.2 - 0.1)))).toFixed(1)}s`;
        
      return { ...p, progress: newProgress, speed: newSpeed };
    }));
  }, [healthData]);

  if (!healthData) return null;

  return (
    <div className="space-y-6 pb-24">
      <PageHeader 
        title="Nexus Alpha Brain"
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

      {/* Neural Interface State - Pulse Visual */}
      <div className="nexus-card !p-0 overflow-hidden bg-[#020617] border-primary/20 relative">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--primary)_0%,transparent_70%)]" />
          <svg className="w-full h-full" viewBox="0 0 400 200">
            <motion.path
              d="M 0 100 Q 100 50 200 100 T 400 100"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              animate={{
                d: [
                  "M 0 100 Q 100 50 200 100 T 400 100",
                  "M 0 100 Q 100 150 200 100 T 400 100",
                  "M 0 100 Q 100 50 200 100 T 400 100"
                ]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: Math.max(1.5, 5 - (healthData.rawCpu / 20)), 
                ease: "easeInOut" 
              }}
            />
          </svg>
        </div>
        <div className="p-6 relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="flex items-center gap-5">
             <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                <div className="w-16 h-16 rounded-full bg-slate-900 border border-primary/30 flex items-center justify-center relative">
                   <BrainCircuit className="w-8 h-8 text-primary" />
                </div>
             </div>
             <div className="space-y-1">
                <h3 className="text-lg font-display font-black text-white italic uppercase tracking-tight">Status Neural: Sincronizado</h3>
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">Alpha Brain v3.1.0-alpha / Latência: {healthData.latency}</p>
             </div>
           </div>
           
           <div className="flex gap-4">
              <div className="px-5 py-2 bg-slate-900/50 border border-white/5 rounded-xl text-center">
                 <p className="text-[9px] text-muted-foreground font-bold uppercase mb-1">Precisão</p>
                 <p className="text-lg font-mono font-bold text-emerald-500">{healthData.accuracy}</p>
              </div>
              <div className="px-5 py-2 bg-slate-900/50 border border-white/5 rounded-xl text-center">
                 <p className="text-[9px] text-muted-foreground font-bold uppercase mb-1">Uptime</p>
                 <p className="text-lg font-mono font-bold text-primary">{healthData.uptime}</p>
              </div>
           </div>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: 'Estado', value: healthData.status, icon: Activity, color: 'text-emerald-500' },
          { label: 'CPU', value: healthData.cpuUsage, icon: Binary, color: 'text-primary' },
          { label: 'RAM', value: healthData.ramUsage, icon: Cpu, color: 'text-purple-500' },
          { label: 'Vetores', value: `${portfolio.length + transactions.length} Nodes`, icon: Network, color: 'text-amber-500' }
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

      {/* Ask Nexus Section - Enhanced Neural Interface */}
      <section className="nexus-card !p-0 overflow-hidden bg-[#0a0f1e] border-primary/30 relative">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
             <Bot className="w-48 h-48" />
          </div>
          
          <div className="p-5 border-b border-white/5 flex items-center justify-between bg-primary/5">
             <h4 className="text-xs font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2 italic">
               <Bot className="w-4 h-4" /> Neural Terminal Interface
             </h4>
             <div className="flex gap-1">
                <div className="w-1 h-1 rounded-full bg-primary animate-ping" />
                <div className="w-1 h-1 rounded-full bg-primary/40" />
             </div>
          </div>

          <div className="p-6 space-y-6">
             <form onSubmit={handleAsk} className="relative group">
                <input 
                  type="text" 
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Injetar consulta técnica no Alpha Brain..."
                  className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-12 py-4 text-sm md:text-base text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none shadow-2xl transition-all placeholder:text-muted-foreground/30 font-mono italic"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors">
                   <Terminal className="w-5 h-5" />
                </div>
                <button 
                  type="submit" 
                  disabled={isAsking || !question.trim()}
                  className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-primary hover:bg-blue-600 text-white font-black text-[10px] uppercase italic rounded-lg transition-all disabled:opacity-50"
                >
                  {isAsking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'EXECUTAR'}
                </button>
             </form>

             <AnimatePresence>
               {answer && (
                 <motion.div 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="p-5 bg-card border border-primary/20 rounded-xl group relative shadow-lg"
                 >
                    <div className="flex items-center gap-2 mb-3">
                       <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
                       <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Resposta Alpha Brain</span>
                    </div>
                    <p className="text-sm md:text-base text-foreground leading-relaxed font-medium italic border-l-2 border-primary/40 pl-4">
                      {answer}
                    </p>
                    <div className="mt-4 flex justify-end">
                       <span className="text-[8px] font-mono text-muted-foreground/40">Hash: {answerHash}</span>
                    </div>
                 </motion.div>
               )}
             </AnimatePresence>
          </div>
      </section>

      <div className="nexus-card !p-0 overflow-hidden">
        <div className="flex overflow-x-auto hide-scrollbar gap-1 border-b border-border bg-secondary/50 px-2 pt-2">
            {[
              { id: 'console', label: 'Console', icon: Terminal },
              { id: 'capabilities', label: 'Cérebro', icon: BrainCircuit },
              { id: 'metrics', label: 'Métricas', icon: BarChart3 },
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
> Nexus Alpha Brain bridge active.`}
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
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(healthData.network || {}).map(([name, data]: [string, any], i) => (
                    <div key={i} className="bg-secondary/30 border border-border p-5 rounded-2xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-3xl group-hover:bg-primary/10 transition-colors" />
                      <div className="flex items-center justify-between mb-4 relative z-10">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${data.ok ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                            {data.ok ? <Wifi size={18} /> : <ServerCrash size={18} />}
                          </div>
                          <div>
                            <h5 className="text-[11px] font-black uppercase tracking-widest text-foreground">{name}</h5>
                            <p className="text-[9px] text-muted-foreground font-bold uppercase">Status: {data.status}</p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-mono font-bold ${data.ok ? 'text-emerald-500' : 'text-red-500'}`}>
                          {data.latency}
                        </span>
                      </div>

                      <div className="space-y-2 relative z-10">
                        <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                          <span>Estabilidade de Rota</span>
                          <span>{data.ok ? '99.8%' : 'OFFLINE'}</span>
                        </div>
                        <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                          <motion.div 
                            className={`h-full ${data.ok ? 'bg-emerald-500' : 'bg-red-500'}`}
                            initial={{ width: 0 }}
                            animate={{ width: data.ok ? '99.8%' : '0%' }}
                            transition={{ duration: 1 }}
                          />
                        </div>
                      </div>

                      {data.throttled && (
                        <div className="mt-4 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-2">
                          <AlertTriangle size={12} className="text-amber-500" />
                          <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">Rate Limit Ativo (429)</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <ShieldAlert className="w-4 h-4 text-primary" />
                    <h5 className="text-[10px] font-black text-primary uppercase tracking-widest">Análise de Stealth (True Preview)</h5>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                    O Nexus Engine está operando com headers de "Ultra Stealth" para evitar o fingerprinting dos servidores da Vercel/CloudRun. Se o status acima for <span className="text-red-500 font-bold">429</span> ou <span className="text-red-500 font-bold">FAIL</span>, o Yahoo bloqueou o IP do servidor e o engine ativará rotas de purga automaticamente.
                  </p>
                </div>
              </motion.div>
            )}

            {activeTab === 'metrics' && (
              <motion.div
                key="metrics"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                 <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={neuralMetrics}>
                        <defs>
                          <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis 
                          dataKey="time" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fill: '#64748b' }}
                        />
                        <YAxis hide domain={[0, 100]} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                          itemStyle={{ fontSize: 12, fontWeight: 'bold' }}
                          labelStyle={{ fontSize: 10, color: '#64748b', marginBottom: '4px' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="activity" 
                          stroke="var(--primary)" 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#colorActivity)" 
                          name="Atividade Neural"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="load" 
                          stroke="#8b5cf6" 
                          strokeWidth={2}
                          fillOpacity={0.1}
                          fill="#8b5cf6"
                          name="Carga do Sistema"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-secondary/20 p-4 rounded-xl border border-border">
                       <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Média de Precisão</p>
                       <p className="text-xl font-display font-black text-emerald-500 italic">
                         {neuralMetrics.length > 0 ? neuralMetrics[neuralMetrics.length - 1].accuracy : '0'}%
                       </p>
                    </div>
                    <div className="bg-secondary/20 p-4 rounded-xl border border-border">
                       <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Taxa de Inferência</p>
                       <p className="text-xl font-display font-black text-primary italic">1.2ms/op</p>
                    </div>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="nexus-card !p-6 bg-[#020617] border-primary/20">
          <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                  <Cpu className="w-5 h-5 text-primary animate-spin" />
                  <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] italic">Processamento Ativo</h3>
              </div>
              <span className="text-[9px] font-black text-primary uppercase tracking-[0.1em] px-2 py-0.5 bg-primary/10 rounded border border-primary/20">Telemetria Live</span>
          </div>

          <div className="space-y-5">
              {processingData.map((proc, i) => (
                  <div key={i} className="space-y-2">
                       <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{proc.name}</span>
                                <span className="text-[9px] font-mono text-primary font-bold">{proc.progress}%</span>
                            </div>
                            <span className="text-[9px] font-mono text-primary/60">{proc.speed}</span>
                       </div>
                       <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
                            <motion.div 
                              className="h-full bg-gradient-to-r from-primary/40 to-primary"
                              initial={{ width: 0 }}
                              animate={{ width: `${proc.progress}%` }}
                              transition={{ duration: 0.5, ease: "easeOut" }}
                            />
                       </div>
                  </div>
              ))}
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
