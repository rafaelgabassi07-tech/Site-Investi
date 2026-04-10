import { TrendingUp, ArrowRight, Zap, Shield, BarChart3, Award, Calendar, Search, Briefcase, Newspaper, ChevronRight, Loader2, GitCompare, Gauge, Info, HelpCircle } from 'lucide-react';
import Dashboard from './Dashboard';
import { NewsWidget } from '../components/NewsWidget';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { auth } from '../firebase';
import { useState, useEffect } from 'react';
import { financeService } from '../services/financeService';

export default function Home() {
  const user = auth.currentUser;
  const [marketStats, setMarketStats] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await financeService.getMarketStats();
        setMarketStats(stats);
      } catch (err) {
        console.error('Failed to fetch market stats', err);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  const defaultStats = [
    { label: 'IBOVESPA', value: '128.450', change: '+1.24%', color: 'emerald' },
    { label: 'S&P 500', value: '5.120', change: '+0.45%', color: 'emerald' },
    { label: 'DÓLAR', value: '4,95', change: '-0.12%', color: 'red' },
    { label: 'BITCOIN', value: '68.420', change: '+2.15%', color: 'emerald' },
  ];

  const displayStats = marketStats.length > 0 ? marketStats : defaultStats;

  return (
    <div className="space-y-48 pb-32">
      {/* Market Ticker */}
      <div className="fixed top-24 left-0 right-0 z-40 bg-[#020617]/50 backdrop-blur-md border-b border-white/5 overflow-hidden hidden md:block">
        <div className="max-w-7xl mx-auto px-6 h-12 flex items-center gap-12 overflow-x-auto no-scrollbar">
          {displayStats.map((stat, idx) => (
            <div key={idx} className="flex items-center gap-3 whitespace-nowrap">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</span>
              <span className="text-xs font-mono text-white">{stat.value}</span>
              <span className={`text-[9px] font-black ${stat.color === 'emerald' ? 'text-emerald-500' : stat.color === 'red' ? 'text-red-500' : 'text-slate-500'}`}>
                {stat.change}
              </span>
            </div>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <div className={`w-1.5 h-1.5 bg-emerald-500 rounded-full ${loadingStats ? 'animate-pulse' : ''}`} />
            <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">
              {loadingStats ? 'Updating...' : 'Live Data'}
            </span>
          </div>
        </div>
      </div>

      {/* Greeting Section */}
      <section className="pt-24 md:pt-32 px-4 md:px-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
            Boa tarde, <span className="text-blue-500">{user?.displayName?.split(' ')[0] || 'Investidor'}</span>!
          </h1>
          <p className="text-slate-400 mt-2 text-sm md:text-lg max-w-2xl">
            Acompanhe o desempenho da sua carteira e as principais oportunidades do mercado financeiro hoje.
          </p>
        </motion.div>
      </section>

      {/* Market Sentiment & Quick Stats */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-4 md:px-0">
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] -z-10 group-hover:bg-blue-600/10 transition-all duration-700" />
          
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <Gauge size={20} className="text-blue-500" />
              </div>
              <h2 className="text-xl font-bold text-white">Sentimento do Mercado</h2>
            </div>
            <button className="text-slate-500 hover:text-white transition-colors">
              <HelpCircle size={18} />
            </button>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="relative w-48 h-24 overflow-hidden">
              <div className="absolute inset-0 border-[12px] border-slate-800 rounded-t-full" />
              <div className="absolute inset-0 border-[12px] border-t-emerald-500 border-r-emerald-500/50 border-l-red-500/50 rounded-t-full rotate-[45deg]" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-20 bg-white origin-bottom rotate-[30deg] transition-transform duration-1000 shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full border-4 border-slate-900" />
            </div>
            
            <div className="flex-1 space-y-4 text-center md:text-left">
              <div className="inline-block px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-[10px] font-black uppercase tracking-widest">
                Otimismo Moderado
              </div>
              <h3 className="text-3xl font-black text-white tracking-tighter">Greed: 68/100</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                O mercado demonstra apetite por risco. Investidores estão otimistas com os últimos dados de inflação e resultados corporativos.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-[2.5rem] p-8 text-white relative overflow-hidden group shadow-2xl shadow-blue-500/20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -mr-16 -mt-16 group-hover:bg-white/20 transition-all" />
          <Zap size={48} className="text-white/20 absolute -bottom-4 -right-4 rotate-12 group-hover:scale-110 transition-transform" />
          
          <h3 className="text-xl font-black mb-4 uppercase tracking-tight">Invest Ultra PRO</h3>
          <p className="text-blue-100 text-sm leading-relaxed mb-8 font-medium">
            Desbloqueie análises de IA, checklists exclusivos e monitoramento de carteira em tempo real.
          </p>
          
          <button className="w-full py-4 bg-white text-blue-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-all shadow-xl">
            Assinar Agora
          </button>
        </div>
      </section>

      <section id="dashboard" className="scroll-mt-32">
        <Dashboard />
      </section>
      
      <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      
      {/* Maiores Altas Section */}
      <section className="space-y-6 px-4 md:px-0">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <TrendingUp size={20} className="text-emerald-500" />
            </div>
            <h2 className="text-2xl font-semibold text-white tracking-tight">Maiores Altas Hoje</h2>
          </div>
          <Link to="/ranking" className="text-blue-500 text-sm font-bold flex items-center gap-1 hover:underline">
            Ver ranking completo <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { ticker: 'PETR4', name: 'Petrobras', price: '38,45', change: '+2.34%' },
            { ticker: 'VALE3', name: 'Vale', price: '62,10', change: '+1.85%' },
            { ticker: 'ITUB4', name: 'Itaú Unibanco', price: '34,20', change: '+1.12%' },
          ].map((asset, idx) => (
            <Link key={idx} to={`/asset/${asset.ticker}`} className="bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center justify-between hover:bg-white/10 transition-all hover:scale-[1.02] group">
              <div>
                <div className="font-bold text-white text-xl group-hover:text-blue-400 transition-colors">{asset.ticker}</div>
                <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">{asset.name}</div>
              </div>
              <div className="text-right">
                <div className="font-mono font-bold text-white text-lg">R$ {asset.price}</div>
                <div className="text-sm font-bold text-emerald-500 flex items-center justify-end gap-1">
                  <TrendingUp size={14} />
                  {asset.change}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      
      {/* Rankings Section */}
      <section className="space-y-6 px-4 md:px-0">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
            <Award size={20} className="text-blue-500" />
          </div>
          <h2 className="text-2xl font-semibold text-white tracking-tight">Rankings</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Ações', icon: 'A', to: '/ranking' },
            { label: 'FIIs', icon: 'F', to: '/ranking' },
            { label: 'Stocks', icon: 'S', to: '/ranking' },
            { label: 'BDRs', icon: 'B', to: '/ranking' },
          ].map((rank, idx) => (
            <Link key={idx} to={rank.to} className="flex flex-col items-center justify-center p-8 rounded-3xl bg-white/5 hover:bg-white/10 transition-all border border-white/10 group gap-4 hover:border-blue-500/30">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-blue-400 group-hover:bg-blue-500/10 transition-all">
                <span className="text-xl font-black">{rank.icon}</span>
              </div>
              <span className="text-slate-200 font-bold text-sm uppercase tracking-widest">{rank.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      
      <section id="news" className="scroll-mt-32">
        <NewsWidget />
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

      <section className="px-4 md:px-0">
        <button className="w-full flex items-center justify-between p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-transparent border border-amber-500/20 hover:border-amber-500/40 transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl -mr-16 -mt-16" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center">
              <Zap size={24} className="text-amber-500 fill-amber-500" />
            </div>
            <div className="text-left">
              <span className="text-amber-500 font-black text-lg block">Liberar acesso PRO</span>
              <span className="text-amber-500/60 text-xs font-bold uppercase tracking-widest">Tenha acesso a indicadores exclusivos</span>
            </div>
          </div>
          <ChevronRight size={24} className="text-amber-500/50 group-hover:text-amber-500 group-hover:translate-x-1 transition-all relative z-10" />
        </button>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

      {/* Meus Recursos Section */}
      <section className="space-y-6 px-4 md:px-0">
        <h2 className="text-2xl font-semibold text-white tracking-tight mb-8">Meus recursos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Search, label: 'Busca de Ativos', to: '/search', color: 'blue' },
            { icon: GitCompare, label: 'Comparar Ativos', to: '/compare', color: 'cyan' },
            { icon: Briefcase, label: 'Minha Carteira', to: '/portfolio', color: 'emerald' },
            { icon: Newspaper, label: 'Últimas Notícias', to: '/news', color: 'purple' },
            { icon: Award, label: 'Rankings', to: '/ranking', color: 'amber' },
            { icon: Calendar, label: 'Dividendos', to: '/dividends', color: 'pink' },
            { icon: Award, label: 'Recomendadas', to: '/recommended', color: 'indigo' },
            { icon: BarChart3, label: 'Calculadoras', to: '/calculators', color: 'cyan' },
            { icon: Shield, label: 'Renda Fixa', to: '/renda-fixa', color: 'orange' },
          ].map((item, idx) => (
            <Link key={idx} to={item.to} className="flex flex-col p-6 rounded-3xl bg-white/5 hover:bg-white/10 transition-all group border border-white/5 hover:border-white/10 gap-4">
              <div className={`w-12 h-12 rounded-2xl bg-slate-800/50 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <item.icon size={24} className="text-slate-400 group-hover:text-white transition-colors" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-200 font-bold text-sm">{item.label}</span>
                <ChevronRight size={16} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
