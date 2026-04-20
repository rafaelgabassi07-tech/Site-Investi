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
  ServerCrash
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
    <div className="space-y-8 pb-24">
      <PageHeader 
        title="Nexus Cérebro IA"
        description={<>Mente <span className="text-primary font-bold">autônoma</span> e rede de telemetria inteligente.</>}
        icon={BrainCircuit}
        actions={
          <button 
            onClick={handleRecovery}
            disabled={isRecovering}
            className="btn-primary"
          >
            {isRecovering ? <Activity className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {isRecovering ? 'Restaurando...' : 'Purga Autônoma'}
          </button>
        }
      />

      {/* Hero Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Estado do Núcleo', value: healthData.status, icon: Activity, color: 'text-emerald-500', glow: 'shadow-emerald-500/20' },
          { label: 'Modelo de Motor', value: healthData.mode, icon: Binary, color: 'text-primary', glow: 'shadow-blue-500/20' },
          { label: 'Carga Cognitiva', value: healthData.ramUsage, icon: Cpu, color: 'text-purple-500', glow: 'shadow-purple-500/20' },
          { label: 'Análise de Risco', value: healthData.riskLevel, icon: ShieldAlert, color: healthData.riskLevel === 'CRITICO' ? 'text-red-500' : 'text-amber-500', glow: 'shadow-amber-500/20' }
        ].map((stat, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`nexus-card border-t-2 overflow-hidden relative group`}
            style={{ borderTopColor: 'currentColor', color: stat.color === 'text-primary' ? 'var(--primary)' : undefined }}
          >
            <div className={`absolute -right-4 -top-4 w-16 h-16 ${stat.color} opacity-10 rounded-full blur-xl group-hover:opacity-30 transition-opacity duration-700`} />
            <div className="flex items-center gap-2 mb-2 w-full text-foreground relative z-10">
               <stat.icon className={`w-4 h-4 ${stat.color}`} />
               <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</span>
            </div>
            <div className={`text-lg md:text-xl font-bold font-mono tracking-tight transition-colors truncate ${stat.color}`}>
              {stat.value}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="nexus-card p-1">
        <div className="flex overflow-x-auto hide-scrollbar gap-1 border-b border-border bg-secondary/50 rounded-t-xl px-2 pt-2">
            {[
              { id: 'console', label: 'Terminal Neural', icon: Terminal },
              { id: 'capabilities', label: 'Capacidades Cognitivas', icon: BrainCircuit },
              { id: 'network', label: 'Topologia B3 & Dados', icon: Network },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-widest transition-all rounded-t-lg whitespace-nowrap
                  ${activeTab === tab.id 
                    ? 'bg-card text-foreground border-t-2 border-primary shadow-[0_-4px_15px_-5px_rgba(59,130,246,0.2)]' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  }
                `}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
        </div>

        <div className="p-4 md:p-6 min-h-[500px]">
          <AnimatePresence mode="wait">
            {activeTab === 'console' && (
              <motion.div
                key="console"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-[500px] bg-[#0a0a0a] rounded-xl border border-border/50 overflow-hidden flex flex-col font-mono relative shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]"
              >
                {/* Mac-like header */}
                <div className="flex items-center px-4 py-2 bg-[#171717] border-b border-white/5">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <div className="flex-1 text-center text-[10px] text-white/40 tracking-widest uppercase">
                    nexus-ai-core-tty1
                  </div>
                </div>

                {/* Blinking indicator */}
                <div className="absolute top-10 right-4 flex items-center gap-2">
                    <span className="text-[10px] text-emerald-500">LIVE FEED</span>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-1.5 text-[11px] sm:text-xs">
                  <div className="mb-6 opacity-70 text-blue-400">
{`N E X U S   A. I.   O S   v3.1.0-alpha
(c) 2026 Nexus Invest Systems. All rights reserved.
> Inicializando barramento de eventos... OK
> Conectando WebSocket B3 / Alpha Vantage... HELD
> Montando Tensores Financeiros na memória local... OK
> Escutando tráfego na porta 3000.`}
                  </div>
                  
                  {terminalLines.map((line, idx) => {
                    const isError = line.includes('ERROR');
                    const isWarning = line.includes('WARNING');
                    return (
                      <div 
                        key={idx} 
                        className={`flex items-start gap-2 ${
                            isError ? 'text-red-500' : isWarning ? 'text-amber-400' : 'text-emerald-400/90'
                        }`}
                      >
                        <span className="opacity-50 select-none">{'>'}</span>
                        <span className="break-all">{line}</span>
                      </div>
                    );
                  })}
                  
                  <div className="flex items-center gap-2 text-primary animate-pulse mt-2">
                    <span className="opacity-50 select-none">{'>'}</span>
                    <div className="w-2 h-4 bg-primary" />
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
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {[
                  { 
                    title: 'Processamento Natural Paralelo (NLP)', 
                    icon: BrainCircuit, 
                    color: 'text-primary',
                    desc: 'Lê dezenas de feeds de notícias ao vivo na página Inicial e extrai imediatamente o sentimento direcional sobre empresas e cenário macroeconômico, convertendo texto em vetores preditivos.' 
                  },
                  { 
                    title: 'Motor Autônomo Fiscal e de Custódia', 
                    icon: Database, 
                    color: 'text-emerald-500',
                    desc: 'Monitora silenciosamente todos os seus aportes. Ao detectar novas compras, recalcula preços médios e sincroniza toda a sua malha de cotas do primeiro ao último dia sem que o usuário sinta.' 
                  },
                  { 
                    title: 'Caçador B3 & Alpha (Crawlers)', 
                    icon: Binary, 
                    color: 'text-purple-500',
                    desc: 'O Cérebro sabe o ticker de tudo. Possui crawlers projetados para varrer a web (APIs e Scrapings defensivos) buscando cotações diárias ou recuperando dados quando o provedor primário falhar (Protocolo de Auto-Reparo).' 
                  },
                  { 
                    title: 'Sincronizador Cego de Dividendos', 
                    icon: Network, 
                    color: 'text-amber-500',
                    desc: 'Constantemente verifica sua carteira perante o tempo. Identifica o fluxo de capital passivo da empresa, descobre anomalias de cortes brutais em proventos e emite relatórios automáticos.' 
                  },
                  { 
                    title: 'Engenharia de Risco Direcional', 
                    icon: AlertTriangle, 
                    color: 'text-red-500',
                    desc: 'Emite o Alerta de Volatilidade e "Drawdown" de Perdas se percebe que o investidor está afundado e sobrecarregado num mercado ou ativo específico, operando como seu consultor hostil mas seguro.' 
                  },
                  { 
                    title: 'Integração em Camada Zero', 
                    icon: Zap, 
                    color: 'text-blue-400',
                    desc: 'Nexus IA não é um chatbot preguiçoso. Ele não tem janelas pop-up. Ele é o próprio sangue do aplicativo. Toda rentabilidade global e página que carrega obedece indiretamente os parâmetros dele.' 
                  }
                ].map((cap, i) => (
                    <div key={i} className="bg-secondary/30 border border-border p-5 rounded-2xl relative overflow-hidden group">
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`p-2 bg-card rounded-lg border border-border shadow-sm`}>
                                <cap.icon className={`w-5 h-5 ${cap.color}`} />
                            </div>
                            <h4 className="text-sm font-bold text-foreground">{cap.title}</h4>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed mt-3 relative z-10">
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
                  <p className="text-sm font-medium text-muted-foreground">
                    A Topologia Neural demonstra o alcance dos nós de extração atuais do Cérebro conectados à infraestrutura financeira global.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 h-[300px]">
                      {/* B3 Node */}
                      <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-center items-center text-center relative overflow-hidden group">
                           <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                           <Activity className="w-10 h-10 text-primary mb-3" />
                           <h5 className="font-bold text-sm mb-1">Malha B3 (Ações)</h5>
                           <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Status: Integrado / Live</span>
                      </div>
                      
                      {/* Scraper Fallbacks */}
                      <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-center items-center text-center relative overflow-hidden group">
                           <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                           <Search className="w-10 h-10 text-amber-500 mb-3" />
                           <h5 className="font-bold text-sm mb-1">Web Scraping Heurístico</h5>
                           <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Status: Intermitente / Fallback</span>
                      </div>

                      {/* Notícias */}
                      <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-center items-center text-center relative overflow-hidden group">
                           <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                           <Radio className="w-10 h-10 text-purple-500 mb-3" />
                           <h5 className="font-bold text-sm mb-1">Radar de Sentimentos</h5>
                           <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Status: Ativo O(1) / Fast</span>
                      </div>
                  </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
{/* Live Activity Matrix */}
      <div className="nexus-card p-6">
          <h3 className="text-display-xs text-foreground mb-4 font-mono flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              Tabela de Desempenho Algorítmico Diário
          </h3>
          <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest border-b border-border bg-secondary/30">
                      <tr>
                          <th className="px-4 py-3 rounded-tl-lg">Protocolo</th>
                          <th className="px-4 py-3">Execuções Hoje</th>
                          <th className="px-4 py-3">Taxa de Sucesso</th>
                          <th className="px-4 py-3 rounded-tr-lg">Prioridade Base</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-xs font-medium">
                      {matrixData.map((p: any, i: number) => (
                         <tr key={i} className="hover:bg-secondary/50 transition-colors">
                             <td className="px-4 py-3 text-foreground">{p.name}</td>
                             <td className="px-4 py-3 font-mono text-primary">{p.ops} ops</td>
                             <td className="px-4 py-3 font-mono text-emerald-500">{p.success}%</td>
                             <td className={`px-4 py-3 ${p.priority.includes('MÁXIMA') || p.priority === 'CRÍTICA' ? 'text-red-500 font-bold' : 'text-muted-foreground'}`}>{p.priority}</td>
                         </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
}
