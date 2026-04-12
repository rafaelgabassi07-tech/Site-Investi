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

  return (
    <div className="w-full bg-[#0f172a]/80 backdrop-blur-md border-b border-white/5 h-10 flex items-center overflow-hidden relative z-40">
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
            <span className="text-xxs font-bold text-slate-500 uppercase tracking-wider">{stat.label}</span>
            <span className="text-xs font-mono text-white font-medium">{stat.value}</span>
            <div className={`flex items-center gap-0.5 text-xxs font-bold ${stat.color === 'emerald' ? 'text-emerald-500' : 'text-red-500'}`}>
              {stat.color === 'emerald' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              {stat.change}
            </div>
          </div>
        ))}
      </motion.div>
      
      {/* Live Indicator Overlay */}
      <div className="absolute right-0 top-0 bottom-0 bg-gradient-to-l from-[#0f172a] via-[#0f172a] to-transparent pl-12 pr-4 flex items-center gap-2 pointer-events-none">
        <div className={`w-1.5 h-1.5 rounded-full bg-emerald-500 ${loading ? 'animate-pulse' : ''}`} />
        <span className="text-tiny font-black text-emerald-500 uppercase tracking-widest">Live</span>
      </div>
    </div>
  );
}
