import { useState, useEffect } from 'react';
import { Newspaper } from 'lucide-react';
import { Link } from 'react-router-dom';
import { financeService, NewsItem } from '../services/financeService';

export function NewsWidget() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    financeService.getNews()
      .then(data => {
        setNews(data.slice(0, 4)); // Get only top 4 for the widget
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="card p-8 flex flex-col items-center justify-center min-h-[400px] bg-white/5 border border-white/10 rounded-3xl">
        <div className="w-8 h-8 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4" />
        <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Carregando Notícias...</p>
      </div>
    );
  }

  return (
    <div className="card p-6 md:p-8 bg-white/5 rounded-3xl border border-white/10">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
          <Newspaper size={20} className="text-amber-500" />
        </div>
        <h2 className="text-2xl font-medium text-white">Notícias de hoje</h2>
      </div>

      <div className="space-y-6">
        {news.map((item, index) => {
          const displayTitle = item.title;
          const displayLink = item.link;
          const displaySource = item.source || item.publisher || 'MERCADO';
          
          return (
            <a 
              key={item.uuid || `news-widget-${index}`}
              href={displayLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 group"
            >
              <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 bg-slate-800 relative">
                {item.thumbnail ? (
                  <img 
                    src={item.thumbnail.resolutions[0]?.url} 
                    alt={displayTitle}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-800">
                    <Newspaper size={24} className="text-slate-600" />
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <span className="inline-block px-3 py-1 bg-slate-800 text-slate-300 text-[10px] font-bold uppercase tracking-wider rounded-lg mb-2">
                  {displaySource}
                </span>
                <h3 className="text-base font-medium text-slate-200 leading-snug line-clamp-2 group-hover:text-blue-400 transition-colors">
                  {displayTitle}
                </h3>
              </div>
            </a>
          );
        })}
      </div>

      <div className="mt-8 pt-6 flex justify-center">
        <Link 
          to="/news"
          className="px-8 py-3 rounded-2xl border border-white/10 text-white font-medium hover:bg-white/5 transition-colors"
        >
          Ver todas as notícias
        </Link>
      </div>
    </div>
  );
}
