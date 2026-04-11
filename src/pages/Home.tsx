import { TrendingUp, ArrowRight, Zap, Shield, BarChart3, Award, Calendar, Search, Briefcase, Newspaper, ChevronRight, Loader2, GitCompare, Gauge, Info, HelpCircle, Filter } from 'lucide-react';
import Dashboard from './Dashboard';
import { NewsWidget } from '../components/NewsWidget';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useState, useEffect } from 'react';
import { financeService } from '../services/financeService';

export default function Home() {
  const { user } = useAuth();
  const [marketStats, setMarketStats] = useState<any[]>([]);
  const [topGainers, setTopGainers] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingGainers, setLoadingGainers] = useState(true);

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Investidor';

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

    const fetchGainers = async () => {
      try {
        const gainers = await financeService.getRanking('Maiores Altas');
        setTopGainers(gainers.slice(0, 3));
      } catch (err) {
        console.error('Failed to fetch top gainers', err);
      } finally {
        setLoadingGainers(false);
      }
    };

    fetchStats();
    fetchGainers();
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
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            Boa tarde, <span className="text-blue-500">{displayName.split(' ')[0]}</span>!
          </h1>
          <p className="text-slate-400 mt-2 text-sm md:text-base max-w-2xl">
            Acompanhe o desempenho da sua carteira e as principais oportunidades do mercado financeiro hoje.
          </p>
        </motion.div>
      </section>

      {/* Market Sentiment & Quick Stats */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-4 md:px-0">
        <div className="lg:col-span-2 bg-[#0f172a] border border-slate-800 rounded-2xl p-6 md:p-8 relative overflow-hidden group shadow-lg">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[80px] -z-10 group-hover:bg-blue-600/10 transition-all duration-700" />
          
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <Gauge size={20} className="text-blue-500" />
              </div>
              <h2 className="text-lg font-bold text-white">Sentimento do Mercado</h2>
            </div>
            <button className="text-slate-500 hover:text-white transition-colors">
              <HelpCircle size={18} />
            </button>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="relative w-40 h-20 overflow-hidden">
              <div className="absolute inset-0 border-[10px] border-slate-800 rounded-t-full" />
              <div className="absolute inset-0 border-[10px] border-t-emerald-500 border-r-emerald-500/50 border-l-red-500/50 rounded-t-full rotate-[45deg]" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-16 bg-white origin-bottom rotate-[30deg] transition-transform duration-1000 shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full border-2 border-slate-900" />
            </div>
            
            <div className="flex-1 space-y-3 text-center md:text-left">
              <div className="inline-block px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-semibold">
                Otimismo Moderado
              </div>
              <h3 className="text-2xl font-bold text-white tracking-tight">Greed: 68/100</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                O mercado demonstra apetite por risco. Investidores estão otimistas com os últimos dados de inflação e resultados corporativos.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden group shadow-lg shadow-blue-500/10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -mr-16 -mt-16 group-hover:bg-white/20 transition-all" />
          <Zap size={48} className="text-white/20 absolute -bottom-4 -right-4 rotate-12 group-hover:scale-110 transition-transform" />
          
          <h3 className="text-lg font-bold mb-3 tracking-tight">100% Gratuito</h3>
          <p className="text-blue-100 text-sm leading-relaxed mb-6 font-medium">
            Aproveite análises avançadas, checklists exclusivos e monitoramento de carteira em tempo real sem pagar nada.
          </p>
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
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <TrendingUp size={20} className="text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Maiores Altas Hoje</h2>
          </div>
          <Link to="/ranking" className="text-blue-500 text-sm font-medium flex items-center gap-1 hover:underline">
            Ver ranking completo <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loadingGainers ? (
            Array(3).fill(0).map((_, idx) => (
              <div key={idx} className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 h-24 animate-pulse" />
            ))
          ) : topGainers.length > 0 ? (
            topGainers.map((asset, idx) => (
              <Link key={idx} to={`/asset/${asset.ticker}`} className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 flex items-center justify-between hover:bg-slate-800/50 transition-all hover:-translate-y-1 group shadow-sm">
                <div>
                  <div className="font-bold text-white text-lg group-hover:text-blue-400 transition-colors">{asset.ticker}</div>
                  <div className="text-xs text-slate-400 font-medium mt-0.5">{asset.name}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-white text-base">{asset.subValue}</div>
                  <div className="text-sm font-medium text-emerald-400 flex items-center justify-end gap-1 mt-0.5">
                    <TrendingUp size={14} />
                    {asset.raw.variacaoDay}
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full py-10 text-center text-slate-500 font-medium">
              Dados indisponíveis no momento.
            </div>
          )}
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />
      
      {/* Rankings Section */}
      <section className="space-y-6 px-4 md:px-0">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
            <Award size={20} className="text-blue-500" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Rankings</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Ações', icon: 'A', to: '/ranking' },
            { label: 'FIIs', icon: 'F', to: '/ranking' },
            { label: 'Stocks', icon: 'S', to: '/ranking' },
            { label: 'BDRs', icon: 'B', to: '/ranking' },
          ].map((rank, idx) => (
            <Link key={idx} to={rank.to} className="flex flex-col items-center justify-center p-6 rounded-2xl bg-[#0f172a] hover:bg-slate-800/50 transition-all border border-slate-800 group gap-3 hover:border-blue-500/30 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-slate-800/50 flex items-center justify-center text-slate-400 group-hover:text-blue-400 group-hover:bg-blue-500/10 transition-all">
                <span className="text-lg font-bold">{rank.icon}</span>
              </div>
              <span className="text-slate-300 font-medium text-sm">{rank.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />
      
      <section id="news" className="scroll-mt-32">
        <NewsWidget />
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />

      {/* Meus Recursos Section */}
      <section className="space-y-6 px-4 md:px-0">
        <h2 className="text-xl font-bold text-white tracking-tight mb-6">Meus recursos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Search, label: 'Busca de Ativos', to: '/search', color: 'blue' },
            { icon: GitCompare, label: 'Comparar Ativos', to: '/compare', color: 'cyan' },
            { icon: Filter, label: 'Busca Avançada', to: '/screener', color: 'blue' },
            { icon: Briefcase, label: 'Minha Carteira', to: '/portfolio', color: 'emerald' },
            { icon: Newspaper, label: 'Últimas Notícias', to: '/news', color: 'purple' },
            { icon: Award, label: 'Rankings', to: '/ranking', color: 'amber' },
            { icon: Calendar, label: 'Dividendos', to: '/dividends', color: 'pink' },
            { icon: Award, label: 'Recomendadas', to: '/recommended', color: 'indigo' },
            { icon: BarChart3, label: 'Calculadoras', to: '/calculators', color: 'cyan' },
            { icon: Shield, label: 'Renda Fixa', to: '/renda-fixa', color: 'orange' },
          ].map((item, idx) => (
            <Link key={idx} to={item.to} className="flex flex-col p-5 rounded-2xl bg-[#0f172a] hover:bg-slate-800/50 transition-all group border border-slate-800 hover:border-slate-700 gap-3 shadow-sm">
              <div className={`w-10 h-10 rounded-xl bg-slate-800/50 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <item.icon size={20} className="text-slate-400 group-hover:text-white transition-colors" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-medium text-sm">{item.label}</span>
                <ChevronRight size={16} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
