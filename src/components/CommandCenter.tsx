import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, TrendingUp, History, Zap, ArrowRight, MessageSquare, Briefcase, Award, LifeBuoy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { financeService } from '../services/financeService';

export function CommandCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setIsOpen(prev => !prev);
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await financeService.search(query);
        setResults(data.slice(0, 5));
      } catch (err) {
        console.error('Command center search failed', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const navigateTo = (path: string) => {
    navigate(path);
    setIsOpen(false);
    setQuery('');
  };

  const quickActions = [
    { icon: Briefcase, label: 'Minha Carteira', path: '/portfolio', color: 'text-blue-500' },
    { icon: Award, label: 'Rankings Nexus', path: '/ranking', color: 'text-amber-500' },
    { icon: TrendingUp, label: 'Rentabilidade', path: '/portfolio/rentabilidade', color: 'text-emerald-500' },
    { icon: MessageSquare, label: 'Notícias IA', path: '/news', color: 'text-purple-500' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-background/80 backdrop-blur-xl z-[90] transition-colors duration-500"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-card border border-border/50 rounded-xl md:rounded-2xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] z-[100] overflow-hidden"
          >
            <div className="flex items-center p-6 border-b border-border shadow-inner">
              <Search className={`w-6 h-6 mr-4 transition-colors ${loading ? 'text-blue-500 animate-pulse' : 'text-muted-foreground'}`} />
              <input 
                autoFocus
                type="text" 
                placeholder="Busque ativos, comandos ou inteligência..." 
                className="flex-1 bg-transparent border-none outline-none text-xl font-display font-black text-foreground uppercase italic tracking-tight placeholder:text-muted-foreground/30"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <div className="flex items-center gap-3">
                 <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-secondary rounded-lg border border-border text-[9px] font-black text-muted-foreground uppercase italic group">
                   ESC
                 </div>
                 <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-secondary rounded-xl transition-colors">
                   <X size={20} className="text-muted-foreground" />
                 </button>
              </div>
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto scrollbar-hide no-scrollbar">
              {query.length < 2 ? (
                <div className="space-y-6 py-4">
                  <div>
                    <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] italic mb-4 ml-2">Ações Rápidas</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {quickActions.map((action, i) => (
                        <button 
                          key={i}
                          onClick={() => navigateTo(action.path)}
                          className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/50 border border-border/50 hover:bg-secondary hover:border-blue-500/30 transition-all text-left group"
                        >
                          <div className={`w-10 h-10 rounded-xl bg-background flex items-center justify-center border border-border group-hover:scale-110 transition-transform ${action.color}`}>
                            <action.icon size={18} />
                          </div>
                          <span className="text-[11px] font-black text-foreground uppercase italic tracking-tight group-hover:text-blue-500 transition-colors">{action.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] italic mb-4 ml-2">Explorar Terminal</h3>
                    <div className="space-y-1">
                      {[
                        { label: 'Calculadora de Independência', path: '/calculators' },
                        { label: 'Guia do Investidor Nexus', path: '/guide' },
                        { label: 'Comparador Profissional', path: '/compare' },
                      ].map((item, i) => (
                        <button 
                          key={i}
                          onClick={() => navigateTo(item.path)}
                          className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-secondary transition-all group"
                        >
                          <div className="flex items-center gap-4">
                             <Zap size={14} className="text-muted-foreground/30 group-hover:text-blue-500" />
                             <span className="text-[11px] font-bold text-muted-foreground group-hover:text-foreground uppercase italic tracking-widest">{item.label}</span>
                          </div>
                          <ArrowRight size={14} className="text-muted-foreground/30 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 py-2">
                  {results.map((asset, i) => (
                    <button 
                      key={i}
                      onClick={() => navigateTo(`/asset/${(asset.symbol || asset.ticker).replace('.SA', '')}`)}
                      className="w-full flex items-center justify-between p-4 rounded-2xl bg-secondary/30 border border-border/30 hover:bg-secondary hover:border-blue-500/30 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white p-2 shadow-lg border border-border group-hover:scale-110 transition-transform shrink-0 flex items-center justify-center">
                          <span className="text-[10px] font-black text-slate-800 italic">{(asset.symbol || asset.ticker).slice(0, 2)}</span>
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-display font-black text-foreground uppercase italic tracking-tighter truncate leading-none">{(asset.symbol || asset.ticker).replace('.SA', '')}</span>
                            <span className="text-[8px] px-1.5 py-0.5 bg-blue-500/10 text-blue-500 border border-blue-500/10 rounded font-black italic">{asset.type || asset.quoteType || 'ACAO'}</span>
                          </div>
                          <div className="text-[9px] font-black text-muted-foreground uppercase italic tracking-widest mt-1 opacity-60 truncate max-w-[200px]">{asset.shortname || asset.name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                         <div className="text-base font-display font-black text-foreground uppercase italic tracking-tighter leading-none group-hover:text-blue-500 transition-colors">ANALISAR ATIVO</div>
                         <div className="text-[9px] font-black text-muted-foreground uppercase italic tracking-widest mt-1 opacity-60">Nexus Engine Telemetry</div>
                      </div>
                    </button>
                  ))}
                  {results.length === 0 && !loading && (
                    <div className="py-20 text-center text-muted-foreground/30 font-black uppercase italic tracking-[0.3em]">
                      Nenhum resultado analítico encontrado
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="p-4 bg-secondary/50 border-t border-border flex items-center justify-between text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] italic">
               <div className="flex items-center gap-6">
                 <span className="flex items-center gap-2">
                   <div className="w-4 h-4 rounded bg-background border border-border flex items-center justify-center">?</div>
                   Ajuda
                 </span>
                 <span className="flex items-center gap-2">
                    <LifeBuoy className="w-3.5 h-3.5" />
                    Nexus Support
                 </span>
               </div>
               <span className="opacity-40 tracking-widest flex items-center gap-2">
                 TERMINAL NEXUS AUTO-PILOT <Zap size={10} className="text-blue-500 animate-pulse" />
               </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
