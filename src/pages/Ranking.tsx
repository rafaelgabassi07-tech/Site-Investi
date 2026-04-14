import { PageHeader } from '../components/ui/PageHeader';
import { Award, TrendingUp, DollarSign, PieChart, Heart, BarChart3, ArrowUpRight, ArrowDownRight, Briefcase, ChevronLeft, Loader2, Star, Zap, Shield, Target, Flame, Gem, Trophy, Info, Search } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { title: 'Dividend Yield', icon: DollarSign, color: 'emerald', description: 'Ativos que mais pagam dividendos.', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-500', glow: 'group-hover:bg-emerald-500/10' },
    { title: 'Menores PLs', icon: ArrowDownRight, color: 'blue', description: 'Ativos com menor relação Preço/Lucro.', bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-500', glow: 'group-hover:bg-blue-500/10' },
    { title: 'Nunca Tiveram Prejuízo', icon: Shield, color: 'indigo', description: 'Empresas com histórico sólido de lucros.', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', text: 'text-indigo-500', glow: 'group-hover:bg-indigo-500/10' },
    { title: 'Maior Capitalização', icon: TrendingUp, color: 'purple', description: 'As maiores empresas da bolsa.', bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-500', glow: 'group-hover:bg-purple-500/10' },
    { title: 'Mais Baratas (Graham)', icon: Gem, color: 'amber', description: 'Ativos descontados pelo método Graham.', bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-500', glow: 'group-hover:bg-amber-500/10' },
    { title: 'Margem Líquida', icon: PieChart, color: 'cyan', description: 'Empresas mais eficientes em transformar receita em lucro.', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-500', glow: 'group-hover:bg-cyan-500/10' },
    { title: 'Melhores Para Buy And Hold', icon: Target, color: 'rose', description: 'Seleção Nexus para longo prazo.', bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-500', glow: 'group-hover:bg-rose-500/10' },
    { title: 'As mais queridas', icon: Heart, color: 'pink', description: 'Ativos mais favoritados pelos usuários.', bg: 'bg-pink-500/10', border: 'border-pink-500/20', text: 'text-pink-500', glow: 'group-hover:bg-pink-500/10' },
    { title: 'Mais Baratas (Bazin)', icon: Zap, color: 'yellow', description: 'Oportunidades pelo método Décio Bazin.', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-500', glow: 'group-hover:bg-yellow-500/10' },
    { title: 'Maiores ROEs', icon: Trophy, color: 'orange', description: 'Maior retorno sobre o patrimônio líquido.', bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-500', glow: 'group-hover:bg-orange-500/10' },
    { title: 'Maiores Altas (30d)', icon: Flame, color: 'red', description: 'Ativos com melhor performance recente.', bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-500', glow: 'group-hover:bg-red-500/10' },
    { title: 'Crescimento de Lucro', icon: Zap, color: 'emerald', description: 'Empresas que mais cresceram seus lucros.', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-500', glow: 'group-hover:bg-emerald-500/10' },
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

  const filteredCategories = categories.filter(cat => 
    cat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRankingData = rankingData.filter(item =>
    item.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-3 pb-12 max-w-7xl mx-auto">
      <AnimatePresence mode="wait" initial={false}>
        {!selectedCategory ? (
          <motion.div
            key="categories"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <PageHeader 
                title="Rankings Nexus"
                description="Inteligência de mercado para encontrar as melhores oportunidades."
                icon={Award}
              />

              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="relative w-full md:w-64 group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={16} className="text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type="text"
                    placeholder="Filtrar rankings..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs font-medium text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  />
                </div>

                <div className="flex p-1 bg-slate-900 border border-slate-800 rounded-2xl shadow-inner">
                {[
                  { label: 'Ações', value: 'ACAO' },
                  { label: 'FIIs', value: 'FII' },
                  { label: 'Stocks', value: 'STOCK' },
                  { label: 'Cripto', value: 'CRYPTO' }
                ].map((type) => (
                  <button 
                    key={type.label} 
                    onClick={() => setSelectedType(type.value)}
                    className={`px-6 py-2.5 rounded-xl text-xxs font-black uppercase tracking-widest transition-all ${
                      selectedType === type.value 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredCategories.map((cat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => handleCategoryClick(cat.title)}
                  className="group relative p-4 flex flex-col gap-4 transition-all cursor-pointer hover:shadow-2xl hover:shadow-blue-500/5 overflow-hidden"
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 ${cat.bg} blur-[40px] -z-10 ${cat.glow} transition-all`} />
                  
                  <div className={`w-14 h-14 rounded-2xl ${cat.bg} flex items-center justify-center border ${cat.border} group-hover:scale-110 transition-transform duration-500`}>
                    <cat.icon size={24} className={cat.text} />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">{cat.title}</h3>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">{cat.description}</p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-800/50">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Ver Ranking</span>
                    <ArrowUpRight size={16} className="text-slate-700 group-hover:text-blue-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
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
            className="space-y-3"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => {
                    setSelectedCategory(null);
                    setSearchQuery('');
                  }}
                  className="w-12 h-12 rounded-2xl bg-slate-800/50 flex items-center justify-center hover:bg-slate-800 transition-all border border-slate-700 shadow-sm group"
                >
                  <ChevronLeft size={24} className="text-slate-400 group-hover:text-white transition-colors" />
                </button>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-3xl font-bold text-white tracking-tight">{selectedCategory}</h2>
                    <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-xxs font-black uppercase tracking-widest rounded border border-blue-500/20">{selectedType}</span>
                  </div>
                  <p className="text-sm text-slate-500 font-medium">Os 10 melhores ativos filtrados por {selectedCategory.toLowerCase()}.</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative w-full md:w-64 group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={16} className="text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar no ranking..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs font-medium text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  />
                </div>

                <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xxs font-black text-slate-400 uppercase tracking-widest">Dados em Tempo Real</span>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 gap-6">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
                  <Award className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-500" size={24} />
                </div>
                <p className="text-slate-500 font-black text-xs uppercase tracking-[0.2em] animate-pulse">Calculando Ranking...</p>
              </div>
            ) : (
              <div className="overflow-hidden">
                <div className="grid grid-cols-1 divide-y divide-slate-800/50">
                  {filteredRankingData.map((item, idx) => (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={idx}
                    >
                      <Link 
                        to={`/asset/${item.ticker}`}
                        className="p-6 flex items-center justify-between hover:bg-slate-800/30 transition-all group relative"
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 scale-y-0 group-hover:scale-y-100 transition-transform origin-top" />
                        
                        <div className="flex items-center gap-8">
                          <div className="flex flex-col items-center justify-center w-10">
                            <span className={`text-2xl font-black ${idx < 3 ? 'text-blue-500' : 'text-slate-700'} group-hover:text-blue-400 transition-colors`}>
                              {(idx + 1).toString().padStart(2, '0')}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-5">
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center p-1.5 shadow-lg border border-slate-800 group-hover:scale-110 transition-transform duration-500">
                              <AssetIcon assetType={selectedType as any} ticker={item.ticker} className="w-full h-full" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-black text-white text-base tracking-tight group-hover:text-blue-400 transition-colors">{item.ticker}</span>
                                {idx === 0 && <Trophy size={12} className="text-amber-400" />}
                              </div>
                              <div className="text-[10px] font-bold text-slate-500 mt-0.5 uppercase tracking-wider">{item.name}</div>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-lg font-black text-white tracking-tighter">{item.value}</div>
                          <div className="text-[9px] font-black text-slate-600 mt-0.5 uppercase tracking-[0.2em]">{item.subValue}</div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
                
                {rankingData.length === 0 ? (
                  <div className="p-20 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto border border-slate-800">
                      <Search className="text-slate-600" size={24} />
                    </div>
                    <p className="text-slate-500 font-bold text-sm">Nenhum dado encontrado para este ranking.</p>
                  </div>
                ) : filteredRankingData.length === 0 ? (
                  <div className="p-20 text-center space-y-6">
                    <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto border border-slate-800">
                      <Search className="text-slate-600" size={24} />
                    </div>
                    <div className="space-y-2">
                      <p className="text-slate-400 font-bold text-sm">Nenhum ativo encontrado no ranking para "{searchQuery}"</p>
                      <p className="text-slate-600 text-xs font-medium">Deseja buscar este ativo em todo o mercado?</p>
                    </div>
                    <Link 
                      to={`/search?q=${encodeURIComponent(searchQuery)}`}
                      className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-blue-600/20"
                    >
                      Buscar em Todo o Mercado <ArrowUpRight size={14} />
                    </Link>
                  </div>
                ) : null}
              </div>
            )}
            
            <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-[2rem] flex items-start gap-4">
              <Info size={20} className="text-slate-600 shrink-0 mt-1" />
              <div>
                <h4 className="text-xxs font-black text-slate-500 uppercase tracking-widest mb-2">Metodologia Nexus</h4>
                <p className="text-tiny text-slate-500 leading-relaxed font-medium">
                  Os rankings Nexus são atualizados diariamente com base no fechamento do mercado. Utilizamos algoritmos próprios para filtrar e classificar os ativos de acordo com cada indicador fundamentalista, garantindo a precisão dos dados apresentados.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
