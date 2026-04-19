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
      setNews(newsData);
      setLoading(false);
      
      // Analyze news after loading
      if (newsData.length > 0) {
        const analysisData = await financeService.analyzeNews(newsData);
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
          className="p-5 md:p-12 bg-slate-900/40 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] md:rounded-[3rem] flex flex-col md:flex-row items-center gap-6 md:gap-10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] relative overflow-hidden group mb-8"
        >
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/[0.03] blur-[120px] -z-10 group-hover:scale-125 transition-transform duration-1000" />
          <div className="w-20 h-20 md:w-28 md:h-28 rounded-[2rem] bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shrink-0 shadow-[0_20px_50px_rgba(37,99,235,0.4)] border border-blue-400/30 group-hover:scale-105 transition-transform duration-700">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="bg-slate-900/20 border border-white/5 rounded-[2.5rem] md:rounded-[3rem] group hover:border-blue-500/30 transition-all duration-700 flex flex-col relative overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] hover:shadow-blue-500/10"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] -z-10 group-hover:bg-blue-600/10 transition-all duration-1000" />
              
              {item.thumbnail ? (
                <div className="h-64 overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent z-10" />
                  <img
                    src={item.thumbnail.resolutions[0]?.url}
                    alt={displayTitle}
                    className="w-full h-full object-cover group-hover:scale-110 transition-all duration-1000 grayscale-[20%] group-hover:grayscale-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-8 left-8 z-20">
                    <span className="px-6 py-2.5 bg-blue-600/90 text-white text-[9px] font-black uppercase tracking-[0.3em] rounded-2xl shadow-2xl border border-blue-400/30 backdrop-blur-xl italic">
                      {displaySource}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="h-64 bg-slate-900/40 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent" />
                  <Newspaper className="w-24 h-24 text-slate-800 opacity-30" />
                  <div className="absolute top-8 left-8 z-20">
                    <span className="px-6 py-2.5 bg-blue-600/90 text-white text-[9px] font-black uppercase tracking-[0.3em] rounded-2xl shadow-2xl border border-blue-400/30 backdrop-blur-xl italic">
                      {displaySource}
                    </span>
                  </div>
                </div>
              )}
              
              <div className="p-5 md:p-10 flex-1 flex flex-col pt-6 md:pt-6">
                <div className="flex items-center gap-4 text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-8 italic">
                  <Clock className="text-blue-500 w-4 h-4" />
                  {formatDistanceToNow(displayDate, { addSuffix: true, locale: ptBR })}
                </div>
                
                <h3 className="text-display-tiny text-slate-100 mb-8 line-clamp-3 uppercase italic tracking-tighter group-hover:text-white transition-colors duration-700 leading-[1.3] group-hover:underline decoration-blue-500/40 decoration-2 underline-offset-8">
                  {displayTitle}
                </h3>
                
                <div className="mt-auto pt-8 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-4 group/read">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-[0.3em] group-hover:text-slate-300 transition-colors duration-500 italic">Terminal Access</span>
                  </div>
                  <div className="w-14 h-14 bg-white/5 rounded-[1.25rem] flex items-center justify-center text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-700 group-hover:shadow-[0_15px_30px_rgba(37,99,235,0.4)] group-hover:scale-110 border border-white/5 group-hover:border-blue-400/40">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </motion.a>
          );
        }) : (
          <div className="col-span-full py-32 text-center group">
            <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-white/10 group-hover:scale-110 transition-transform duration-500">
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

