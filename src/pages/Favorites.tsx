import { PageHeader } from '../components/ui/PageHeader';
import { Heart, Search, TrendingUp, TrendingDown, ChevronRight, Star, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { financeService } from '../services/financeService';

export default function Favorites() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchFavorites() {
      const stored = JSON.parse(localStorage.getItem('nexus_favorites') || '[]');
      if (stored.length === 0) {
        setFavorites([]);
        setLoading(false);
        return;
      }

      try {
        const data = await Promise.all(
          stored.map(async (ticker: string) => {
            try {
              const details = await financeService.getAssetDetails(ticker);
              return {
                ticker,
                name: details.results.name || ticker,
                price: details.results.precoAtual,
                change: details.results.variacaoDay,
                type: (details as any).type || 'ACAO'
              };
            } catch (err) {
              return { ticker, name: ticker, price: 'N/A', change: '0%', type: 'ACAO' };
            }
          })
        );
        setFavorites(data);
      } catch (error) {
        console.error('Error fetching favorites:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchFavorites();
  }, []);

  const filteredFavorites = favorites.filter(f => 
    f.ticker.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      <PageHeader 
        title="Favoritos"
        description="Acompanhe de perto os ativos que você mais gosta."
        icon={Star}
      />

      <div className="relative max-w-md group">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-500 transition-colors">
          <Search className="icon-sm" />
        </div>
        <input 
          type="text" 
          placeholder="Filtrar favoritos..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-transparent outline-none text-white font-bold placeholder:text-slate-500 transition-all text-sm hover:border-white/20"
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-blue-500 icon-lg" />
          <p className="text-label">Carregando favoritos...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFavorites.length > 0 ? filteredFavorites.map((asset, idx) => {
            const isPositive = asset.change && !asset.change.startsWith('-');
            return (
              <motion.div
                key={asset.ticker}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Link 
                  to={`/asset/${asset.ticker}`}
                  className="bg-[#0f172a] border border-slate-800 p-5 rounded-3xl flex items-center justify-between hover:border-blue-500/30 transition-all group shadow-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500 border border-blue-500/20 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                      <span className="text-label group-hover:text-white">{asset.ticker.substring(0, 2)}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors tracking-tight text-base uppercase">{asset.ticker}</h3>
                      <p className="text-label line-clamp-1">{asset.name}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-display-sm text-white">
                      {typeof asset.price === 'number' ? `R$ ${asset.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : asset.price}
                    </div>
                    <div className={`flex items-center justify-end gap-1 text-[10px] font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isPositive ? <TrendingUp className="icon-xs" /> : <TrendingDown className="icon-xs" />}
                      {asset.change}
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          }) : (
            <div className="col-span-full py-20 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-500 mx-auto">
                <Star className="icon-xl" />
              </div>
              <div>
                <p className="text-label text-slate-400">Nenhum favorito encontrado</p>
                <p className="text-xs text-slate-600 mt-1">Busque por ativos e clique na estrela para favoritá-los.</p>
              </div>
              <Link to="/search" className="btn-primary inline-flex">
                Buscar Ativos
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
