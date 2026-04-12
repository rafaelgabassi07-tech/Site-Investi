import { useState, useEffect } from 'react';
import { Newspaper, Clock, Globe, Zap, ArrowUpRight, Filter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'motion/react';
import { PageHeader } from '../components/ui/PageHeader';
import { financeService, NewsItem } from '../services/financeService';

const THEMES = ['Todos', 'Mercado', 'Negócios', 'Criptomoedas', 'Política', 'Economia'];

export default function News() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTheme, setActiveTheme] = useState('Todos');

  useEffect(() => {
    financeService.getNews()
      .then(data => {
        setNews(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const filteredNews = news.filter(item => {
    if (activeTheme === 'Todos') return true;
    const searchStr = `${item.title} ${item.source || item.publisher || ''}`.toLowerCase();
    
    switch (activeTheme) {
      case 'Mercado': return searchStr.includes('mercado') || searchStr.includes('ibovespa') || searchStr.includes('ações') || searchStr.includes('bolsa');
      case 'Negócios': return searchStr.includes('negócios') || searchStr.includes('empresa') || searchStr.includes('banco') || searchStr.includes('lucro');
      case 'Criptomoedas': return searchStr.includes('cripto') || searchStr.includes('bitcoin') || searchStr.includes('ethereum');
      case 'Política': return searchStr.includes('política') || searchStr.includes('governo') || searchStr.includes('presidente') || searchStr.includes('ministro');
      case 'Economia': return searchStr.includes('economia') || searchStr.includes('inflação') || searchStr.includes('selic') || searchStr.includes('pib');
      default: return true;
    }
  });

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
      <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Sincronizando Feed Nexus...</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <PageHeader 
        title="Market Intelligence"
        description={<>Insights e notícias em tempo real via <span className="text-blue-500 font-bold">Invest News Engine</span>.</>}
        icon={Newspaper}
        actions={
          <div className="px-6 py-3 rounded-2xl bg-blue-500/5 border border-blue-500/20 text-blue-400 text-xxs font-black uppercase tracking-widest flex items-center gap-2">
            <Globe size={14} className="animate-pulse" />
            Global Feed Active
          </div>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-4 overflow-x-auto pb-4 no-scrollbar">
        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-slate-400 shrink-0">
          <Filter size={16} />
          <span className="text-xs font-bold uppercase tracking-widest">Filtros:</span>
        </div>
        {THEMES.map(theme => (
          <button
            key={theme}
            onClick={() => setActiveTheme(theme)}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${
              activeTheme === theme 
                ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] border border-blue-500' 
                : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 hover:text-slate-300'
            }`}
          >
            {theme}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.isArray(filteredNews) && filteredNews.length > 0 ? filteredNews.map((item, index) => {
          const displayTitle = item.title;
          const displayLink = item.link;
          const displaySource = item.source || item.publisher || 'Nexus News';
          const displayDate = item.pubDate ? new Date(item.pubDate) : (item.providerPublishTime ? new Date(item.providerPublishTime * 1000) : new Date());
          
          return (
            <motion.a
              key={item.uuid || `news-${index}`}
              href={displayLink}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="card group hover:border-blue-500/30 transition-all duration-700 flex flex-col relative overflow-hidden shadow-2xl"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/5 blur-[80px] -z-10 group-hover:bg-blue-600/10 transition-all duration-700" />
              
              {item.thumbnail ? (
                <div className="h-48 overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent z-10 opacity-80" />
                  <img
                    src={item.thumbnail.resolutions[0]?.url}
                    alt={displayTitle}
                    className="w-full h-full object-cover group-hover:scale-110 transition-all duration-1000"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-6 left-6 z-20">
                    <span className="px-4 py-1.5 bg-blue-600 text-white text-tiny font-black uppercase tracking-[0.2em] rounded-xl shadow-[0_10px_30px_rgba(37,99,235,0.4)]">
                      {displaySource}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="h-48 bg-slate-900 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent" />
                  <Newspaper size={64} className="text-slate-800" />
                  <div className="absolute top-6 left-6 z-20">
                    <span className="px-4 py-1.5 bg-blue-600 text-white text-tiny font-black uppercase tracking-[0.2em] rounded-xl shadow-[0_10px_30px_rgba(37,99,235,0.4)]">
                      {displaySource}
                    </span>
                  </div>
                </div>
              )}
              
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-center gap-3 text-slate-500 text-xxs font-black uppercase tracking-[0.2em] mb-3 md:mb-4">
                  <Clock size={14} className="text-blue-500" />
                  {formatDistanceToNow(displayDate, { addSuffix: true, locale: ptBR })}
                </div>
                
                <h3 className="text-lg md:text-xl font-black text-white mb-4 md:mb-6 line-clamp-3 leading-[1.1] tracking-tighter group-hover:text-blue-400 transition-colors duration-500">
                  {displayTitle}
                </h3>
                
                <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap size={14} className="text-blue-500" />
                    <span className="text-xxs font-black text-slate-500 uppercase tracking-[0.2em] group-hover:text-white transition-colors duration-500">Ler Reportagem</span>
                  </div>
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 group-hover:shadow-[0_10px_30px_rgba(37,99,235,0.3)] group-hover:scale-110">
                    <ArrowUpRight size={20} />
                  </div>
                </div>
              </div>
            </motion.a>
          );
        }) : (
          <div className="col-span-full py-20 text-center">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
              <Newspaper size={32} className="text-slate-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Nenhuma notícia encontrada</h3>
            <p className="text-slate-400 text-sm">Não encontramos notícias para o filtro "{activeTheme}" no momento.</p>
            <button 
              onClick={() => setActiveTheme('Todos')}
              className="mt-6 px-6 py-2 bg-blue-600 text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-blue-500 transition-colors"
            >
              Limpar Filtros
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

