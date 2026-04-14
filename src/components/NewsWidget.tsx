import { useState, useEffect } from 'react';
import { Newspaper, TrendingUp, TrendingDown, Minus, Brain } from 'lucide-react';
import { Link } from 'react-router-dom';
import { financeService, NewsItem } from '../services/financeService';

export function NewsWidget() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      financeService.getNews(),
      fetch('/api/news/analyze').then(res => res.json()).catch(() => null)
    ]).then(([newsData, analysisData]) => {
      setNews(newsData.slice(0, 3));
      setAnalysis(analysisData);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="card p-4 flex flex-col items-center justify-center min-h-[200px] bg-white/5 border border-white/10 rounded-2xl">
        <div className="w-6 h-6 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-2" />
        <p className="text-slate-500 font-black uppercase tracking-widest text-[8px]">IA Analisando Notícias...</p>
      </div>
    );
  }

  return (
    <div className="card p-4 bg-white/5 rounded-2xl border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
            <Newspaper size={16} className="text-amber-500" />
          </div>
          <h2 className="text-sm font-black text-white uppercase tracking-tight">Radar Nexus</h2>
        </div>
        {analysis && (
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${
            analysis.sentiment === 'Bullish' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
            analysis.sentiment === 'Bearish' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
            'bg-slate-500/10 border-slate-500/20 text-slate-400'
          }`}>
            <Brain size={12} className="animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-widest">{analysis.sentiment}</span>
          </div>
        )}
      </div>

      {analysis && (
        <div className="mb-4 p-3 bg-slate-900/50 border border-slate-800 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">Resumo IA</span>
          </div>
          <p className="text-[10px] font-bold text-slate-300 leading-relaxed italic">
            "{analysis.summary}"
          </p>
        </div>
      )}

      <div className="space-y-3">
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
              <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-slate-800 relative border border-white/5">
                {item.thumbnail ? (
                  <img 
                    src={item.thumbnail.resolutions[0]?.url} 
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-800">
                    <Newspaper size={16} className="text-slate-600" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest truncate">
                    {displaySource}
                  </span>
                </div>
                <h3 className="text-[11px] font-bold text-slate-200 leading-tight line-clamp-2 group-hover:text-blue-400 transition-colors">
                  {item.title}
                </h3>
              </div>
            </a>
          );
        })}
      </div>

      <Link 
        to="/news"
        className="mt-4 flex items-center justify-center w-full py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all"
      >
        Ver todas as notícias
      </Link>
    </div>
  );
}
