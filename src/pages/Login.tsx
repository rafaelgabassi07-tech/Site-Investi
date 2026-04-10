import { signInWithGoogle } from '../firebase';
import { TrendingUp, ShieldCheck, Globe, Zap } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] p-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-96 bg-blue-600/10 blur-[150px] -z-10 rounded-full" />
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: 'linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }} />

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-md w-full card p-8 md:p-12 text-center relative border-white/5 shadow-[0_0_100px_rgba(0,0,0,0.5)]"
      >
        <motion.div 
          initial={{ rotate: -10, scale: 0.8 }}
          animate={{ rotate: 3, scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          className="w-24 h-24 bg-blue-600 rounded-[2.5rem] flex items-center justify-center text-white mx-auto mb-10 shadow-[0_20px_50px_rgba(37,99,235,0.4)] relative group"
        >
          <div className="absolute inset-0 bg-blue-400 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500" />
          <TrendingUp size={48} className="relative z-10" />
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-5xl font-black text-white tracking-tighter uppercase mb-4"
        >
          INVEST <span className="text-blue-500">ULTRA</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-slate-400 font-medium mb-12 leading-relaxed text-lg"
        >
          Acesse a engine de extração definitiva e gerencie seu patrimônio com <span className="text-white font-bold">precisão milimétrica</span>.
        </motion.p>
        
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          onClick={() => signInWithGoogle()}
          className="w-full flex items-center justify-center gap-4 px-8 py-6 bg-white text-black rounded-3xl font-black uppercase tracking-[0.2em] text-xs hover:bg-blue-50 transition-all shadow-2xl active:scale-95 group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 group-hover:scale-110 transition-transform" />
          Autenticar com Google
        </motion.button>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-16 flex flex-col items-center gap-6"
        >
          <div className="flex items-center justify-center gap-4 w-full">
            <div className="h-px flex-1 bg-white/5" />
            <p className="text-[9px] text-slate-600 uppercase tracking-[0.4em] font-black whitespace-nowrap">
              Invest Security Protocol
            </p>
            <div className="h-px flex-1 bg-white/5" />
          </div>

          <div className="flex items-center gap-6 text-slate-600">
            <div className="flex items-center gap-2">
              <ShieldCheck size={14} />
              <span className="text-[8px] font-black uppercase tracking-widest">AES-256</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe size={14} />
              <span className="text-[8px] font-black uppercase tracking-widest">Global Node</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap size={14} />
              <span className="text-[8px] font-black uppercase tracking-widest">Ultra Fast</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
