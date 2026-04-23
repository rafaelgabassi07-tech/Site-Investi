import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Cpu, BrainCircuit, Sparkles, Loader2, Minimize2, Maximize2 } from 'lucide-react';
import { nexusAI } from '../services/nexusAIService';

export function NexusFloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([
    { role: 'ai', content: 'Iniciando link neural... Nexus Alpha Brain online. Como posso otimizar sua estratégia hoje?' }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const response = await nexusAI.askNexus(userMsg);
      setMessages(prev => [...prev, { role: 'ai', content: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', content: 'Falha na transmissão neural. Tente novamente.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-24 right-6 md:bottom-8 md:right-8 z-[200]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9, filter: 'blur(10px)' }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1, 
              filter: 'blur(0px)',
              height: isMinimized ? '60px' : '500px',
              width: isMinimized ? '200px' : '360px'
            }}
            exit={{ opacity: 0, y: 20, scale: 0.9, filter: 'blur(10px)' }}
            className={`bg-card border border-primary/20 rounded-[32px] shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl transition-all duration-300 ${isMinimized ? 'cursor-pointer' : ''}`}
            onClick={() => isMinimized && setIsMinimized(false)}
          >
            {/* Header */}
            <div className="p-4 bg-primary/5 border-b border-primary/10 flex items-center justify-between shrink-0">
               <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center relative">
                    <Cpu className={`w-4 h-4 text-primary ${loading ? 'animate-spin' : ''}`} />
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-foreground uppercase italic tracking-widest">Nexus Alpha Brain AI</h4>
                    <p className="text-[8px] font-bold text-emerald-500 uppercase tracking-tighter italic">Soberano v3.0</p>
                  </div>
               </div>
               <div className="flex items-center gap-1">
                  <button onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }} className="p-1.5 hover:bg-primary/10 rounded-lg transition-colors text-muted-foreground">
                    {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                  </button>
                  <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors text-muted-foreground hover:text-red-500">
                    <X size={14} />
                  </button>
               </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: msg.role === 'user' ? 10 : -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] p-3 rounded-2xl text-xs font-medium leading-relaxed ${
                        msg.role === 'user' 
                          ? 'bg-primary text-white ml-8 rounded-tr-none' 
                          : 'bg-secondary/80 border border-border mr-8 rounded-tl-none italic'
                      }`}>
                        {msg.role === 'ai' && <div className="text-[8px] font-black text-primary uppercase tracking-widest mb-1">Nexus Response</div>}
                        {msg.content}
                      </div>
                    </motion.div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-secondary/50 p-3 rounded-2xl animate-pulse flex gap-1">
                        <div className="w-1 h-1 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-1 h-1 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-1 h-1 rounded-full bg-primary animate-bounce" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="p-4 bg-primary/5 border-t border-primary/10 shrink-0">
                   <div className="relative">
                      <input 
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Injetar comando neural..."
                        className="w-full bg-secondary border border-border rounded-xl py-3 pl-4 pr-12 text-xs font-semibold placeholder:text-muted-foreground/40 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      />
                      <button 
                        onClick={handleSend}
                        disabled={!input.trim() || loading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-white rounded-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:scale-100"
                      >
                        <Send size={14} />
                      </button>
                   </div>
                   <div className="mt-3 flex items-center justify-center gap-2 opacity-30">
                      <Sparkles size={8} className="text-primary" />
                      <span className="text-[7px] font-black text-muted-foreground uppercase tracking-[0.3em]">AI-Powered by Gemini Node</span>
                   </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      {!isOpen && (
        <motion.button
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-primary text-white rounded-2xl shadow-2xl shadow-primary/30 flex items-center justify-center relative group overflow-hidden border border-white/20"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-primary to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          <BrainCircuit className="w-6 h-6 relative z-10" />
          <div className="absolute -inset-1 bg-white/20 blur-xl scale-0 group-hover:scale-100 transition-transform duration-500 rounded-full" />
        </motion.button>
      )}
    </div>
  );
}
