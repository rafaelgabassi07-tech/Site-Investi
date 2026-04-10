import { PageHeader } from '../components/ui/PageHeader';
import { Award, TrendingUp, DollarSign, PieChart, Heart, BarChart3, ArrowUpRight, ArrowDownRight, Briefcase, ChevronLeft, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { AssetIcon } from '../components/ui/AssetIcon';
import { Link } from 'react-router-dom';

export default function Ranking() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [rankingData, setRankingData] = useState<any[]>([]);

  const categories = [
    { title: 'Nunca Tiveram Prejuízo', icon: Briefcase, type: 'ACAO' },
    { title: 'Maior Capitalização', icon: TrendingUp, type: 'ACAO' },
    { title: 'Dividend Yield', icon: DollarSign, type: 'ACAO' },
    { title: 'Mais Baratas', subtitle: 'Graham', icon: PieChart, type: 'ACAO' },
    { title: 'Margem Líquida', icon: PieChart, type: 'ACAO' },
    { title: 'Melhores Para Buy And Hold', icon: BarChart3, type: 'ACAO' },
    { title: 'As mais queridas', icon: Heart, type: 'ACAO' },
    { title: 'Mais Baratas', subtitle: 'Bazin', icon: PieChart, type: 'ACAO' },
    { title: 'Maiores Receitas', icon: TrendingUp, type: 'ACAO' },
    { title: 'Maiores Lucros', icon: TrendingUp, type: 'ACAO' },
    { title: 'Maiores ROEs', icon: ArrowUpRight, type: 'ACAO' },
    { title: 'Menores PLs', icon: ArrowDownRight, type: 'ACAO' },
    { title: 'Maiores Altas em 30 dias', icon: ArrowUpRight, type: 'ACAO' },
    { title: 'Maiores altas Últ. 12 meses', icon: ArrowUpRight, type: 'ACAO' },
    { title: 'Maiores Caixas', icon: DollarSign, type: 'ACAO' },
    { title: 'Maiores Cresc. Lucro', icon: TrendingUp, type: 'ACAO' },
    { title: 'Maiores Cresc. Receitas', icon: TrendingUp, type: 'ACAO' },
  ];

  const handleCategoryClick = (cat: string) => {
    setSelectedCategory(cat);
    setLoading(true);
    // Simulating fetching ranking data
    setTimeout(() => {
      const mockData = [
        { ticker: 'PETR4', name: 'Petrobras', value: '12.4%', subValue: 'R$ 38,45' },
        { ticker: 'VALE3', name: 'Vale', value: '10.8%', subValue: 'R$ 62,10' },
        { ticker: 'ITUB4', name: 'Itaú Unibanco', value: '9.5%', subValue: 'R$ 34,20' },
        { ticker: 'BBAS3', name: 'Banco do Brasil', value: '8.7%', subValue: 'R$ 54,15' },
        { ticker: 'BBDC4', name: 'Bradesco', value: '7.2%', subValue: 'R$ 14,30' },
        { ticker: 'ABEV3', name: 'Ambev', value: '6.8%', subValue: 'R$ 12,50' },
        { ticker: 'WEGE3', name: 'Weg', value: '5.9%', subValue: 'R$ 38,90' },
        { ticker: 'RENT3', name: 'Localiza', value: '5.2%', subValue: 'R$ 52,10' },
      ];
      setRankingData(mockData);
      setLoading(false);
    }, 800);
  };

  return (
    <div className="space-y-8 pb-24">
      <AnimatePresence mode="wait">
        {!selectedCategory ? (
          <motion.div
            key="categories"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <PageHeader 
              title="Rankings"
              description="Descubra os melhores ativos do mercado."
              icon={Award}
            />

            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
              {['Ações', 'FIIs', 'Stocks', 'BDRs'].map((type, i) => (
                <button 
                  key={type} 
                  className={`px-6 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-colors ${
                    i === 0 
                      ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' 
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {categories.map((cat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.02 }}
                  onClick={() => handleCategoryClick(cat.title)}
                  className="p-6 bg-white/5 border border-white/10 rounded-3xl flex flex-col items-center justify-center text-center gap-4 hover:bg-white/10 transition-colors cursor-pointer group"
                >
                  <div className="w-14 h-14 rounded-full bg-slate-800/50 flex items-center justify-center group-hover:bg-slate-800 transition-colors">
                    <cat.icon size={24} className="text-slate-400 group-hover:text-blue-400 transition-colors" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-200 leading-snug">{cat.title}</h3>
                    {cat.subtitle && (
                      <span className="inline-block mt-2 px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase tracking-wider rounded">
                        {cat.subtitle}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="ranking-list"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSelectedCategory(null)}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <ChevronLeft size={20} className="text-slate-400" />
              </button>
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">{selectedCategory}</h2>
                <p className="text-sm text-slate-400 uppercase tracking-widest font-bold">Top 10 Ativos</p>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 gap-4">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Processando Ranking...</p>
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden divide-y divide-white/5">
                {rankingData.map((item, idx) => (
                  <Link 
                    to={`/asset/${item.ticker}`}
                    key={idx}
                    className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors group"
                  >
                    <div className="flex items-center gap-6">
                      <span className="text-2xl font-black text-slate-700 group-hover:text-blue-500/50 transition-colors w-8">#{idx + 1}</span>
                      <div className="flex items-center gap-4">
                        <AssetIcon assetType="ACAO" ticker={item.ticker} className="w-12 h-12" />
                        <div>
                          <div className="font-black text-white text-lg tracking-tighter group-hover:text-blue-400 transition-colors">{item.ticker}</div>
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.name}</div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black text-white tracking-tighter">{item.value}</div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.subValue}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
