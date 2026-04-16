import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { TrendingUp, Mail, Lock, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { Logo } from '../components/ui/Logo';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isConfigured = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!isConfigured) {
      setError('Supabase não configurado! Verifique as variáveis de ambiente no painel.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      } else {
        setSuccess('Conta criada com sucesso! Verifique sua caixa de entrada para confirmar o e-mail.');
        setIsSignUp(false);
      }
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
    <div className="min-h-screen flex flex-col md:flex-row bg-[#020617] relative overflow-hidden">
      {/* Left Side - Branding (Hidden on Mobile) */}
      <div className="hidden md:flex md:w-1/2 lg:w-3/5 relative flex-col justify-between p-16 border-r border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-[#020617] to-[#020617] -z-10" />
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] -z-10" />
        
        <Logo size={56} showText />

        <div className="max-w-xl">
          <h2 className="text-display-lg text-white mb-8 leading-tight">
            A plataforma <span className="text-blue-500">definitiva</span> para gestão de patrimônio.
          </h2>
          <p className="text-base font-medium text-slate-400 leading-relaxed uppercase tracking-widest">
            Acompanhe seus investimentos, analise ativos com inteligência artificial e tome decisões baseadas em dados reais do mercado global.
          </p>
          
          <div className="mt-16 flex items-center gap-8">
            <div className="flex -space-x-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`w-14 h-14 rounded-full border-4 border-[#020617] bg-white/5 flex items-center justify-center text-tiny font-black text-slate-400 z-[${10-i}] shadow-2xl backdrop-blur-xl`}>
                  {i === 4 ? '+2k' : `U${i}`}
                </div>
              ))}
            </div>
            <div className="text-tiny font-black text-slate-500 uppercase tracking-[0.2em] max-w-[180px] leading-relaxed">
              Junte-se a milhares de investidores inteligentes.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-tiny font-black text-slate-600 uppercase tracking-widest">
          <ShieldCheck className="text-emerald-500 icon-sm" />
          Dados criptografados e seguros de ponta a ponta
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full md:w-1/2 lg:w-2/5 flex items-center justify-center p-8 sm:p-16 relative">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/10 blur-[150px] -z-10 rounded-full pointer-events-none animate-pulse" />

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-[420px]"
        >
          {/* Mobile Logo */}
          <div className="flex md:hidden items-center gap-4 mb-16 justify-center">
            <Logo size={48} showText />
          </div>

          <div className="mb-12">
            <h1 className="text-display-sm text-white uppercase italic tracking-tight mb-3">
              {isSignUp ? 'Criar conta' : 'Nexus Invest'}
            </h1>
            <p className="text-tiny font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
              {isSignUp ? 'Preencha os dados abaixo para começar sua jornada.' : 'Insira suas credenciais para acessar sua carteira exclusiva.'}
            </p>
          </div>
          
          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-3 group">
              <label className="text-tiny font-black text-slate-600 uppercase tracking-[0.2em] group-focus-within:text-blue-500 transition-colors pl-1">E-mail de acesso</label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-blue-500 transition-colors icon-xs" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full bg-white/5 border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-white text-tiny font-black uppercase tracking-widest placeholder:text-slate-800 focus:outline-none focus:border-blue-500/30 focus:bg-white/[0.08] transition-all shadow-inner"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-3 group">
              <div className="flex items-center justify-between pl-1 pr-1">
                <label className="text-tiny font-black text-slate-600 uppercase tracking-[0.2em] group-focus-within:text-blue-500 transition-colors">Senha segura</label>
                {!isSignUp && (
                  <button type="button" className="text-[10px] font-black text-blue-500 hover:text-blue-400 transition-colors uppercase tracking-widest">Esqueceu?</button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-blue-500 transition-colors icon-xs" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-white text-tiny font-black uppercase tracking-widest placeholder:text-slate-800 focus:outline-none focus:border-blue-500/30 focus:bg-white/[0.08] transition-all shadow-inner"
                  required
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-5 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-red-500/10 text-red-400 border border-red-500/20 shadow-lg shadow-red-500/5 leading-relaxed"
                >
                  {error}
                </motion.div>
              )}
              {success && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-5 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/5 leading-relaxed"
                >
                  {success}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-blue-600 text-white rounded-2xl text-tiny font-black uppercase tracking-[0.2em] hover:bg-blue-500 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-6 shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3 group/btn"
            >
              {loading ? (
                <Loader2 className="animate-spin icon-sm" />
              ) : (
                <>
                  {isSignUp ? 'Criar Minha Conta' : 'Acessar Terminal'}
                  <ArrowRight className="icon-xs group-hover/btn:translate-x-1.5 transition-transform" />
                </>
              )}
            </button>
          </form>
          
          <div className="mt-10 text-center">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
              {isSignUp ? 'Já tem uma conta Nexus?' : 'Ainda não é um membro?'}
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                  setSuccess(null);
                }}
                className="ml-3 text-blue-500 hover:text-blue-400 font-black transition-colors"
              >
                {isSignUp ? 'ENTRAR AGORA' : 'CADASTRE-SE GRÁTIS'}
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
