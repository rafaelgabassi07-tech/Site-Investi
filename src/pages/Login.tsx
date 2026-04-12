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
      <div className="hidden md:flex md:w-1/2 lg:w-3/5 relative flex-col justify-between p-12 border-r border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-[#020617] to-[#020617] -z-10" />
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] -z-10" />
        
        <Logo size={48} showText />

        <div className="max-w-lg">
          <h2 className="text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight mb-6">
            A plataforma definitiva para gestão de patrimônio.
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed">
            Acompanhe seus investimentos, analise ativos com inteligência artificial e tome decisões baseadas em dados reais do mercado.
          </p>
          
          <div className="mt-12 flex items-center gap-6">
            <div className="flex -space-x-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`w-12 h-12 rounded-full border-2 border-[#020617] bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 z-[${10-i}]`}>
                  {i === 4 ? '+2k' : `U${i}`}
                </div>
              ))}
            </div>
            <div className="text-sm text-slate-400 font-medium">
              Junte-se a milhares de investidores inteligentes.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
          <ShieldCheck size={18} className="text-emerald-500" />
          Dados criptografados e seguros
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full md:w-1/2 lg:w-2/5 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] -z-10 rounded-full pointer-events-none" />

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-[400px]"
        >
          {/* Mobile Logo */}
          <div className="flex md:hidden items-center gap-3 mb-12 justify-center">
            <Logo size={40} showText />
          </div>

          <div className="mb-10">
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
              {isSignUp ? 'Criar conta' : 'Bem-vindo de volta'}
            </h1>
            <p className="text-slate-400 text-sm font-medium">
              {isSignUp ? 'Preencha os dados abaixo para começar.' : 'Insira suas credenciais para acessar sua carteira.'}
            </p>
          </div>
          
          <form onSubmit={handleAuth} className="space-y-5">
            <div className="space-y-2 group">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider group-focus-within:text-blue-400 transition-colors">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full bg-[#0f172a] border border-slate-800 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2 group">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider group-focus-within:text-blue-400 transition-colors">Senha</label>
                {!isSignUp && (
                  <a href="#" className="text-xs font-semibold text-blue-500 hover:text-blue-400 transition-colors">Esqueceu a senha?</a>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0f172a] border border-slate-800 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                  required
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 rounded-xl text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                    {error}
                  </div>
                </motion.div>
              )}
              {success && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 rounded-xl text-sm font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {success}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-4 shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  {isSignUp ? 'Criar Conta' : 'Entrar na Plataforma'}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-slate-500 text-sm font-medium">
              {isSignUp ? 'Já tem uma conta?' : 'Ainda não tem conta?'}
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                  setSuccess(null);
                }}
                className="ml-2 text-blue-500 hover:text-blue-400 font-bold transition-colors"
              >
                {isSignUp ? 'Faça login' : 'Cadastre-se grátis'}
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
