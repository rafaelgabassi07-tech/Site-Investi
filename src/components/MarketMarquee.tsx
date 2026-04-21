import { useEffect, useState } from 'react';
import { financeService } from '../services/financeService';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'motion/react';

interface MarketStat {
  label: string;
  value: string;
  change: string;
  color: string;
}

export function MarketMarquee() {
  const [stats, setStats] = useState<MarketStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await financeService.getMarketStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to fetch market stats', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const defaultStats: MarketStat[] = [
    { label: 'IBOVESPA', value: '128.450', change: '+1.24%', color: 'emerald' },
    { label: 'S&P 500', value: '5.120', change: '+0.45%', color: 'emerald' },
    { label: 'DÓLAR', value: '4,95', change: '-0.12%', color: 'red' },
    { label: 'BITCOIN', value: '68.420', change: '+2.15%', color: 'emerald' },
    { label: 'IFIX', value: '3.420', change: '+0.15%', color: 'emerald' },
    { label: 'PETR4', value: '38,40', change: '+1.50%', color: 'emerald' },
    { label: 'VALE3', value: '62,10', change: '-0.80%', color: 'red' },
    { label: 'ITUB4', value: '34,15', change: '+0.40%', color: 'emerald' },
  ];

  const displayStats = stats.length > 0 ? stats : defaultStats;
  
  // Duplicate stats for seamless looping
  const doubledStats = [...displayStats, ...displayStats];

  // Check if market is open (B3: Mon-Fri, 10:00 - 17:00 BRT)
  const brtTime = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
  const day = brtTime.getDay();
  const hour = brtTime.getHours();
  const isMarketOpen = day >= 1 && day <= 5 && hour >= 10 && hour < 17;

  return (
    <div className="w-full bg-slate-100 dark:bg-[#020617] border-b border-border h-10 flex items-center overflow-hidden relative z-40 transition-colors">
      <motion.div 
        className="flex items-center gap-8 whitespace-nowrap px-4"
        animate={{ x: [0, -1000] }}
        transition={{ 
          duration: 30, 
          repeat: Infinity, 
          ease: "linear" 
        }}
      >
        {doubledStats.map((stat, idx) => (
          <div key={idx} className="flex items-center gap-2 group cursor-default">
            <span className="text-xxs font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</span>
            <span className="text-xs font-mono text-foreground font-medium">{stat.value}</span>
            <div className={`flex items-center gap-0.5 text-xxs font-bold ${stat.color === 'emerald' ? 'text-emerald-500' : 'text-red-500'}`}>
              {stat.color === 'emerald' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              {stat.change}
            </div>
          </div>
        ))}
      </motion.div>
      
      {/* Market Status Indicator Overlay */}
      <div className="absolute right-0 top-0 bottom-0 flex items-center pointer-events-none">
        <div className="w-12 h-full bg-gradient-to-l from-slate-100 dark:from-[#020617] to-transparent transition-colors" />
        <div className="bg-slate-100 dark:bg-[#020617] h-full pl-3 pr-4 flex items-center gap-2 border-l border-border transition-colors shadow-[-4px_0_12px_rgba(0,0,0,0.05)]">
          <div className={`w-1.5 h-1.5 rounded-full ${isMarketOpen ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
          <span className={`text-[8px] font-black uppercase tracking-widest text-muted-foreground`} title="Simulação baseada no horário de Brasília (B3)">
            {isMarketOpen ? 'Mercado Aberto' : 'Mercado Fechado'}
          </span>
        </div>
      </div>
    </div>
  );
}
