import { PageHeader } from '../components/ui/PageHeader';
import { Award, TrendingUp, DollarSign, PieChart, Heart, BarChart3, ArrowUpRight, ArrowDownRight, Briefcase, ChevronLeft, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { AssetIcon } from '../components/ui/AssetIcon';
import { Link } from 'react-router-dom';
import { financeService } from '../services/financeService';

export default function Ranking() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState('ACAO');
  const [loading, setLoading] = useState(false);
  const [rankingData, setRankingData] = useState<any[]>([]);

  const categories = [
    { title: 'Dividend Yield', icon: DollarSign, type: 'ACAO' },
    { title: 'Menores PLs', icon: ArrowDownRight, type: 'ACAO' },
    { title: 'Nunca Tiveram Prejuízo', icon: Briefcase, type: 'ACAO' },
    { title: 'Maior Capitalização', icon: TrendingUp, type: 'ACAO' },
    { title: 'Mais Baratas (Graham)', icon: PieChart, type: 'ACAO' },
    { title: 'Margem Líquida', icon: PieChart, type: 'ACAO' },
    { title: 'Melhores Para Buy And Hold', icon: BarChart3, type: 'ACAO' },
    { title: 'As mais queridas', icon: Heart, type: 'ACAO' },
    { title: 'Mais Baratas (Bazin)', icon: PieChart, type: 'ACAO' },
    { title: 'Maiores Receitas', icon: TrendingUp, type: 'ACAO' },
    { title: 'Maiores Lucros', icon: TrendingUp, type: 'ACAO' },
    { title: 'Maiores ROEs', icon: ArrowUpRight, type: 'ACAO' },
    { title: 'Maiores Altas em 30 dias', icon: ArrowUpRight, type: 'ACAO' },
    { title: 'Maiores altas Últ. 12 meses', icon: ArrowUpRight, type: 'ACAO' },
    { title: 'Maiores Caixas', icon: DollarSign, type: 'ACAO' },
    { title: 'Maiores Cresc. Lucro', icon: TrendingUp, type: 'ACAO' },
    { title: 'Maiores Cresc. Receitas', icon: TrendingUp, type: 'ACAO' },
  ];

  const handleCategoryClick = async (cat: string) => {
    setSelectedCategory(cat);
    setLoading(true);
    try {
      const data = await financeService.getRanking(cat, selectedType);
      setRankingData(data);
    } catch (error) {
      console.error('Failed to fetch ranking:', error);
      setRankingData([]);
    } finally {
      setLoading(false);
    }
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
              {[
                { label: 'Ações', value: 'ACAO' },
                { label: 'FIIs', value: 'FII' },
                { label: 'Stocks', value: 'BDR' }, // Usando BDR como proxy para stocks por enquanto
                { label: 'BDRs', value: 'BDR' }
              ].map((type) => (
                <button 
                  key={type.label} 
                  onClick={() => setSelectedType(type.value)}
                  className={`px-5 py-2 rounded-xl border text-sm font-semibold transition-colors whitespace-nowrap ${
                    selectedType === type.value 
                      ? 'bg-blue-600 border-blue-500 text-white shadow-md' 
                      : 'bg-slate-800/30 border-slate-800 text-slate-300 hover:bg-slate-800/50'
                  }`}
                >
                  {type.label}
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
                  className="p-5 bg-[#0f172a] border border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center gap-4 hover:bg-slate-800/50 transition-colors cursor-pointer group shadow-sm"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-800/50 flex items-center justify-center group-hover:bg-slate-800 transition-colors border border-slate-800/50">
                    <cat.icon size={20} className="text-slate-400 group-hover:text-blue-400 transition-colors" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-300 leading-snug">{cat.title}</h3>
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
            className="space-y-6"
          >
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSelectedCategory(null)}
                className="w-10 h-10 rounded-xl bg-slate-800/30 flex items-center justify-center hover:bg-slate-800/50 transition-colors border border-slate-800"
              >
                <ChevronLeft size={20} className="text-slate-400" />
              </button>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">{selectedCategory}</h2>
                <p className="text-sm text-slate-400 font-medium">Top 10 {selectedType}</p>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 gap-4">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                <p className="text-slate-500 font-medium text-sm">Processando Ranking...</p>
              </div>
            ) : (
              <div className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800/50 shadow-lg">
                {rankingData.map((item, idx) => (
                  <Link 
                    to={`/asset/${item.ticker}`}
                    key={idx}
                    className="p-5 flex items-center justify-between hover:bg-slate-800/30 transition-colors group"
                  >
                    <div className="flex items-center gap-5">
                      <span className="text-xl font-bold text-slate-600 group-hover:text-blue-500/50 transition-colors w-8">#{idx + 1}</span>
                      <div className="flex items-center gap-4">
                        <AssetIcon assetType={selectedType as any} ticker={item.ticker} className="w-10 h-10" />
                        <div>
                          <div className="font-bold text-white text-base group-hover:text-blue-400 transition-colors">{item.ticker}</div>
                          <div className="text-xs font-medium text-slate-500 mt-0.5">{item.name}</div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-white">{item.value}</div>
                      <div className="text-xs font-medium text-slate-500 mt-0.5">{item.subValue}</div>
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
