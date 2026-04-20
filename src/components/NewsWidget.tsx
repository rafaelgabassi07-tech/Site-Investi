import { useState, useEffect } from 'react';
import { Newspaper, TrendingUp, TrendingDown, Minus, Brain } from 'lucide-react';
import { Link } from 'react-router-dom';
import { financeService, NewsItem } from '../services/financeService';

interface NewsWidgetProps {
  limit?: number;
  compact?: boolean;
}

export function NewsWidget({ limit = 3, compact = false }: NewsWidgetProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const newsData = await financeService.getNews();
        if (!isMounted) return;
        
        // Final cleaning and sorting
        const sorted = (newsData || []).sort((a, b) => {
          const dateA = a.pubDate ? new Date(a.pubDate).getTime() : 0;
          const dateB = b.pubDate ? new Date(b.pubDate).getTime() : 0;
          return dateB - dateA;
        });

        setNews(sorted.slice(0, limit));
        
        // Mock analysis or local analysis can be done here
        // For now using the mock from service
        const mockAnalysis = await financeService.analyzeNews(sorted.slice(0, 5));
        setAnalysis(mockAnalysis);
      } catch (err) {
        console.error('Failed to load news in widget:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => { isMounted = false; };
  }, [limit]);
  if (loading) {
    return (
      <div className={`card ${compact ? 'p-2 min-h-[100px]' : 'p-4 min-h-[200px]'} flex flex-col items-center justify-center bg-secondary/30 border border-border rounded-2xl`}>
        <div className="w-6 h-6 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-2" />
        <p className="text-slate-500 font-black uppercase tracking-widest text-[8px]">{compact ? 'Nexus...' : 'IA Analisando Notícias...'}</p>
      </div>
    );
  }

  return (
    <div className={`card ${compact ? '!p-2' : 'p-4'} bg-secondary/20 rounded-2xl border border-border`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {!compact && (
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
              <Newspaper size={16} className="text-amber-500" />
            </div>
          )}
          <h2 className={`${compact ? 'text-[10px]' : 'text-sm'} font-black text-foreground uppercase tracking-tight`}>
            {compact ? 'NOTÍCIAS' : 'Radar Nexus'}
          </h2>
        </div>
        {analysis && !compact && (
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${
            ['Bullish', 'Otimista'].includes(analysis.sentiment) ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
            ['Bearish', 'Pessimista'].includes(analysis.sentiment) ? 'bg-red-500/10 border-red-500/20 text-red-500' :
            'bg-slate-500/10 border-slate-500/20 text-slate-400'
          }`}>
            <Brain size={12} className="animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-widest">
              {analysis.sentiment === 'Bullish' ? 'Otimista' : analysis.sentiment === 'Bearish' ? 'Pessimista' : analysis.sentiment}
            </span>
          </div>
        )}
      </div>

      {analysis && !compact && (
        <div className="mb-4 p-3 bg-secondary/40 border border-border rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">Resumo IA</span>
          </div>
          <p className="text-[10px] font-bold text-muted-foreground leading-relaxed italic">
            "{analysis.summary}"
          </p>
        </div>
      )}

      <div className={`space-y-${compact ? '2' : '3'}`}>
        {news.map((item, index) => {
          const displaySource = item.source || item.publisher || 'MERCADO';
          
          return (
            <a 
              key={item.uuid || `news-widget-${index}`}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 group"
            >
              <div className={`${compact ? 'w-10 h-10' : 'w-14 h-14'} rounded-xl overflow-hidden shrink-0 bg-secondary/80 relative border border-border`}>
                {item.thumbnail ? (
                  <img 
                    src={item.thumbnail.resolutions[0]?.url} 
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-secondary">
                    <Newspaper size={compact ? 12 : 16} className="text-muted-foreground" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                {!compact && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest truncate">
                      {displaySource}
                    </span>
                  </div>
                )}
                <h3 className={`${compact ? 'text-[10px]' : 'text-[11px]'} font-bold text-foreground leading-tight line-clamp-2 group-hover:text-blue-500 transition-colors`}>
                  {item.title}
                </h3>
              </div>
            </a>
          );
        })}
        
        {news.length === 0 && !loading && (
          <div className="py-4 text-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic">Nenhuma notícia encontrada</p>
          </div>
        )}
      </div>

      <Link 
        to="/news"
        className={`${compact ? 'mt-2 py-1.5' : 'mt-4 py-2'} flex items-center justify-center w-full rounded-xl bg-secondary/50 border border-border text-[10px] font-black text-muted-foreground uppercase tracking-widest hover:bg-secondary hover:text-foreground transition-all`}
      >
        Ver todas as notícias
      </Link>
    </div>
  );
}
