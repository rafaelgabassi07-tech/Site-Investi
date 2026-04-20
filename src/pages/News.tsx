import { useState, useEffect } from 'react';
import { Newspaper, Clock, Globe, Zap, ArrowUpRight, Filter, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'motion/react';
import { PageHeader } from '../components/ui/PageHeader';
import { financeService, NewsItem } from '../services/financeService';

const THEMES = ['Todos', 'Mercado', 'Negócios', 'Política', 'Economia'];

export default function News() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTheme, setActiveTheme] = useState('Todos');

  useEffect(() => {
    financeService.getNews().then(async (newsData) => {
      // Filter news from the last 15 days
      const fifteenDaysAgo = new Date();
      fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
      
      const filteredByDate = newsData.filter(item => {
        const displayDate = item.pubDate ? new Date(item.pubDate) : (item.providerPublishTime ? new Date(item.providerPublishTime * 1000) : new Date());
        return displayDate >= fifteenDaysAgo;
      });

      // Sort newest to oldest
      const sortedByDate = filteredByDate.sort((a, b) => {
        const dateA = a.pubDate ? new Date(a.pubDate).getTime() : (a.providerPublishTime ? a.providerPublishTime * 1000 : 0);
        const dateB = b.pubDate ? new Date(b.pubDate).getTime() : (b.providerPublishTime ? b.providerPublishTime * 1000 : 0);
        return dateB - dateA;
      });

      setNews(sortedByDate);
      setLoading(false);
      
      // Analyze news after loading
      if (sortedByDate.length > 0) {
        const analysisData = await financeService.analyzeNews(sortedByDate);
        setAnalysis(analysisData);
      }
    }).catch(err => {
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
      case 'Política': return searchStr.includes('política') || searchStr.includes('governo') || searchStr.includes('presidente') || searchStr.includes('ministro');
      case 'Economia': return searchStr.includes('economia') || searchStr.includes('inflação') || searchStr.includes('selic') || searchStr.includes('pib');
      default: return true;
    }
  });

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-6">
      <Loader2 className="animate-spin text-blue-500 icon-xl border-blue-500/20" />
      <p className="text-label text-slate-500 uppercase tracking-widest animate-pulse">Sincronizando Feed Nexus...</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <PageHeader 
        title="Market Intelligence"
        description={<>Insights e notícias em tempo real via <span className="text-blue-500 font-bold">Invest News Engine</span>.</>}
        icon={Newspaper}
        actions={
          <div className="px-5 py-2.5 rounded-[1.25rem] bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 shadow-lg shadow-blue-500/5">
            <Globe className="icon-xs animate-pulse" />
            Global Feed Active
          </div>
        }
      />

      {analysis && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 md:p-12 bg-slate-900/40 backdrop-blur-3xl border border-white/5 rounded-xl md:rounded-2xl md:rounded-2xl flex flex-col md:flex-row items-center gap-6 md:gap-10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] relative overflow-hidden group mb-8"
        >
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/[0.03] blur-[120px] -z-10 group-hover:scale-125 transition-transform duration-1000" />
          <div className="w-20 h-20 md:w-28 md:h-28 rounded-xl md:rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shrink-0 shadow-[0_20px_50px_rgba(37,99,235,0.4)] border border-blue-400/30 group-hover:scale-105 transition-transform duration-700">
            <Zap className="w-10 h-10 text-white animate-pulse" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center md:items-start md:justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] italic">Nexus Intelligence Report</span>
                <div className="w-1 h-1 rounded-full bg-blue-500/50" />
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] italic">Real-time Analysis</span>
              </div>
              <span className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border shadow-2xl backdrop-blur-md italic ${
                analysis.sentiment === 'Bullish' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/10' :
                analysis.sentiment === 'Bearish' ? 'bg-red-500/10 text-red-400 border-red-500/20 shadow-red-500/10' :
                'bg-slate-500/10 text-slate-400 border-slate-500/20 shadow-slate-500/10'
              }`}>
                {analysis.sentiment} • {analysis.score}% STR
              </span>
            </div>
            <p className="text-display-tiny md:text-display-sm text-slate-100 leading-[1.4] uppercase italic tracking-tighter">
              "{analysis.summary}"
            </p>
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 overflow-x-auto pb-10 pt-4 no-scrollbar snap-x snap-mandatory px-4 md:px-0 -mx-4 md:mx-0">
        <div className="flex items-center gap-3 px-6 py-3 bg-slate-900/60 backdrop-blur-2xl rounded-xl border border-white/10 text-slate-600 shrink-0 shadow-2xl italic group snap-start">
          <Filter className="w-4 h-4 group-hover:text-blue-500 transition-colors" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Filtros</span>
        </div>
        {THEMES.map(theme => (
          <button
            key={theme}
            onClick={() => setActiveTheme(theme)}
            className={`snap-start px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all duration-300 border italic ${
              activeTheme === theme 
                ? 'bg-blue-600 text-white shadow-[0_8px_16px_rgba(37,99,235,0.3)] border-blue-500/50' 
                : 'bg-white/5 text-slate-500 border-white/5 hover:bg-white/10 hover:text-slate-300 hover:border-white/10'
            }`}
          >
            {theme}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
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
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: Math.min(index * 0.05, 0.5) }}
              className="card group flex flex-col hover:border-blue-500/30 overflow-hidden !rounded-2xl"
            >
              {item.thumbnail ? (
                <div className="h-40 overflow-hidden relative border-b border-white/5">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent z-10" />
                  <img
                    src={item.thumbnail.resolutions[0]?.url}
                    alt={displayTitle}
                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 left-4 z-20">
                    <span className="px-3 py-1 bg-blue-600/90 text-white text-[8px] font-black uppercase tracking-widest rounded-lg shadow-xl border border-blue-400/30 backdrop-blur-xl">
                      {displaySource}
                    </span>
                  </div>
                </div>
              ) : (
                 <div className="h-40 bg-slate-900/40 flex items-center justify-center relative overflow-hidden border-b border-white/5">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent" />
                  <Newspaper className="w-12 h-12 text-slate-800 opacity-50" />
                  <div className="absolute top-4 left-4 z-20">
                    <span className="px-3 py-1 bg-blue-600/90 text-white text-[8px] font-black uppercase tracking-widest rounded-lg shadow-xl border border-blue-400/30 backdrop-blur-xl">
                      {displaySource}
                    </span>
                  </div>
                </div>
              )}
              
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-center gap-2 text-slate-500 text-[9px] font-black uppercase tracking-widest mb-3">
                  <Clock className="text-blue-500 w-3 h-3" />
                  {formatDistanceToNow(displayDate, { addSuffix: true, locale: ptBR })}
                </div>
                
                <h3 className="text-sm font-bold text-slate-100 mb-4 line-clamp-3 group-hover:text-blue-400 transition-colors leading-snug">
                  {displayTitle}
                </h3>
                
                <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2 group/read">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest group-hover:text-slate-400 transition-colors">Acessar</span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-blue-500 transition-colors" />
                </div>
              </div>
            </motion.a>
          );
        }) : (
          <div className="col-span-full py-32 text-center group">
            <div className="w-24 h-24 bg-white/5 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-8 border border-white/10 group-hover:scale-110 transition-transform duration-500">
              <Newspaper className="w-10 h-10 text-slate-600" />
            </div>
            <h3 className="text-display-tiny text-white uppercase italic mb-3">Selo de Silêncio Nexus</h3>
            <p className="text-tiny font-bold text-slate-500 uppercase tracking-widest max-w-[300px] mx-auto leading-relaxed">Não encontramos relatórios para o filtro "{activeTheme}" neste momento.</p>
            <button 
              onClick={() => setActiveTheme('Todos')}
              className="mt-8 px-10 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-blue-600 hover:border-blue-500 transition-all shadow-xl hover:shadow-blue-500/20"
            >
              Resetar Terminal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

