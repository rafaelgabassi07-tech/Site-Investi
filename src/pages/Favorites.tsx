import { PageHeader } from '../components/ui/PageHeader';
import { Heart, Search, TrendingUp, TrendingDown, ChevronRight, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

export default function Favorites() {
  // Mock favorites
  const [favorites] = useState([
    { ticker: 'PETR4', name: 'Petrobras', price: '38.40', change: '+1.50%', type: 'ACAO' },
    { ticker: 'VALE3', name: 'Vale', price: '62.10', change: '-0.80%', type: 'ACAO' },
    { ticker: 'MXRF11', name: 'Maxi Renda', price: '10.50', change: '+0.20%', type: 'FII' },
    { ticker: 'AAPL', name: 'Apple Inc', price: '185.40', change: '+2.10%', type: 'STOCK' },
    { ticker: 'BTC-USD', name: 'Bitcoin', price: '68.420', change: '+1.20%', type: 'CRYPTO' },
  ]);

  return (
    <div className="space-y-6 pb-12">
      <PageHeader 
        title="Favoritos"
        description="Acompanhe de perto os ativos que você mais gosta."
        icon={Heart}
      />

      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-4 flex items-center text-slate-500">
          <Search size={18} />
        </div>
        <input 
          type="text" 
          placeholder="Filtrar favoritos..." 
          className="w-full pl-12 pr-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-all font-medium"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {favorites.map((asset, idx) => (
          <motion.div
            key={asset.ticker}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Link 
              to={`/asset/${asset.ticker}`}
              className="card p-5 flex items-center justify-between hover:border-blue-500/30 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500 border border-blue-500/20 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <span className="font-black text-xs">{asset.ticker.substring(0, 2)}</span>
                </div>
                <div>
                  <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors">{asset.ticker}</h3>
                  <p className="text-xxs font-black text-slate-500 uppercase tracking-widest">{asset.name}</p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm font-black text-white">R$ {asset.price}</div>
                <div className={`flex items-center justify-end gap-1 text-xxs font-bold ${asset.change.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                  {asset.change.startsWith('+') ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {asset.change}
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="card p-5 border-dashed border-slate-800 bg-transparent flex flex-col items-center justify-center gap-3 text-center min-h-[120px]"
        >
          <div className="w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-500">
            <Star size={20} />
          </div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Adicionar Novo Ativo</p>
        </motion.div>
      </div>
    </div>
  );
}
