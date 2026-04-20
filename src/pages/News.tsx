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
          className="p-4 md:p-8 bg-slate-900/40 backdrop-blur-3xl border border-white/5 rounded-2xl flex flex-col md:flex-row items-center gap-6 shadow-2xl relative overflow-hidden group mb-6"
        >
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-600/[0.02] blur-[100px] -z-10" />
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shrink-0 shadow-lg border border-blue-400/30">
            <Zap className="w-8 h-8 text-white animate-pulse" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center md:items-start md:justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-black text-blue-500 uppercase tracking-[0.3em] italic">Nexus Intelligence</span>
                <div className="w-1 h-1 rounded-full bg-blue-500/30" />
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] italic">AI Radar</span>
              </div>
              <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border shadow-lg backdrop-blur-md italic ${
                analysis.sentiment === 'Bullish' || analysis.sentiment === 'Otimista' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                analysis.sentiment === 'Bearish' || analysis.sentiment === 'Pessimista' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                'bg-slate-500/10 text-slate-400 border-slate-500/20'
              }`}>
                {analysis.sentiment} • {analysis.score}%
              </span>
            </div>
            <p className="text-display-tiny md:text-display-xs text-slate-100 leading-tight uppercase italic tracking-tight">
              "{analysis.summary}"
            </p>
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-6 pt-2 no-scrollbar px-4 md:px-0 -mx-4 md:mx-0">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-900/60 backdrop-blur-2xl rounded-xl border border-white/10 text-slate-600 shrink-0 shadow-md italic group">
          <Filter className="w-3.5 h-3.5 group-hover:text-blue-500 transition-colors" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em]">Filtros</span>
        </div>
        {THEMES.map(theme => (
          <button
            key={theme}
            onClick={() => setActiveTheme(theme)}
            className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all duration-300 border italic ${
              activeTheme === theme 
                ? 'bg-blue-600 text-white shadow-lg border-blue-500/50' 
                : 'bg-white/5 text-slate-500 border-white/5 hover:bg-white/10 hover:text-slate-300'
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
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: Math.min(index * 0.03, 0.3) }}
              className="card group flex flex-col hover:border-blue-500/30 overflow-hidden !rounded-2xl bg-slate-900/40"
            >
              <div className="h-32 overflow-hidden relative border-b border-white/5 bg-slate-800/50 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent z-10" />
                {item.thumbnail ? (
                  <img
                    src={item.thumbnail.resolutions[0]?.url}
                    alt={displayTitle}
                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700 opacity-60 group-hover:opacity-100"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <Newspaper className="w-8 h-8 text-slate-800 opacity-30" />
                )}
                <div className="absolute top-3 left-3 z-20">
                  <span className="px-2 py-1 bg-blue-600/90 text-white text-[7px] font-black uppercase tracking-widest rounded-lg shadow-xl border border-blue-400/20 backdrop-blur-xl">
                    {displaySource}
                  </span>
                </div>
              </div>
              
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-center gap-2 text-slate-500 text-[8px] font-black uppercase tracking-widest mb-2 opacity-60">
                  <Clock className="w-2.5 h-2.5" />
                  {formatDistanceToNow(displayDate, { addSuffix: true, locale: ptBR })}
                </div>
                
                <h3 className="text-xs font-bold text-slate-100 mb-4 line-clamp-2 leading-tight group-hover:text-blue-400 transition-colors">
                  {displayTitle}
                </h3>
                
                <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between opacity-40 group-hover:opacity-100 transition-opacity">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest underline decoration-blue-500/30 underline-offset-4">Ler Reportagem</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-600 group-hover:text-blue-500 transition-colors" />
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

