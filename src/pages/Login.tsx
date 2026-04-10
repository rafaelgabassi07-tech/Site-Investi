import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { TrendingUp, ShieldCheck, Globe, Zap, Mail, Lock } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isConfigured = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!isConfigured) {
      setError('Supabase não configurado! Verifique as variáveis de ambiente.');
      return;
    }

    setLoading(true);
    setError(null);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) setError(error.message);
      else setError('Conta criada com sucesso! Por favor, verifique sua caixa de entrada e clique no link de confirmação enviado para o seu e-mail.');
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setError(error.message);
    }
    setLoading(false);
  };

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
          className="text-5xl font-black text-white tracking-tighter uppercase mb-8"
        >
          {isSignUp ? 'CRIAR CONTA' : 'INVEST <span className="text-blue-500">ULTRA</span>'}
        </motion.h1>
        
        <form onSubmit={handleAuth} className="space-y-4 mb-8">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-mail"
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Processando...' : (isSignUp ? 'Criar Conta' : 'Entrar')}
          </button>
        </form>
        
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-slate-400 text-sm hover:text-white transition-colors"
        >
          {isSignUp ? 'Já tem uma conta? Entre aqui.' : 'Não tem uma conta? Crie uma agora.'}
        </button>
        
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
