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
                description="Inteligência de mercado e filtros."
                icon={Award}
              />

              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="relative w-full md:w-64 group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Search className="icon-sm text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type="text"
                    placeholder="Filtrar rankings..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all hover:border-white/20"
                  />
                </div>

                  <div className="flex p-1 bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-blue-600/5 blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity" />
                    {[
                      { label: 'Ações', value: 'ACAO' },
                      { label: 'FIIs', value: 'FII' },
                      { label: 'Stocks', value: 'STOCK' },
                      { label: 'Cripto', value: 'CRYPTO' }
                    ].map((type) => (
                      <button 
                        key={type.label} 
                        onClick={() => setSelectedType(type.value)}
                        className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all relative z-10 italic ${
                          selectedType === type.value 
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-1 ring-blue-500/50' 
                            : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
            </div>
          </div>

            <div className="grid grid-cols-2 gap-3 md:gap-4">
              {filteredCategories.map((cat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  onClick={() => handleCategoryClick(cat.title)}
                  className="group relative p-3 md:p-5 bg-slate-900/20 border border-white/5 rounded-xl md:rounded-2xl flex flex-col gap-3 transition-all duration-500 cursor-pointer hover:bg-slate-900/40 hover:border-blue-500/20 hover:shadow-2xl hover:shadow-blue-500/5 overflow-hidden active:scale-[0.98]"
                >
                  <div className={`absolute top-0 right-0 w-24 h-24 ${cat.bg} blur-[40px] -z-10 ${cat.glow} transition-all duration-1000 group-hover:scale-150`} />
                  
                  <div className={`w-10 h-10 rounded-lg ${cat.bg} flex items-center justify-center border ${cat.border} group-hover:scale-105 transition-transform duration-500 shadow-xl relative shrink-0`}>
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
                    <cat.icon className={`w-5 h-5 ${cat.text}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[10px] md:text-sm text-white mb-1 group-hover:text-blue-400 transition-colors uppercase italic tracking-tighter leading-tight font-black truncate">{cat.title}</h3>
                    <p className="text-[8px] md:text-[9px] text-slate-500 font-black leading-tight uppercase tracking-widest italic opacity-70 group-hover:opacity-100 transition-opacity line-clamp-2">{cat.description}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5 group-hover:border-blue-500/10 transition-colors">
                    <span className="text-[8px] font-black text-slate-700 uppercase italic tracking-widest group-hover:text-slate-400">ANALISAR</span>
                    <ArrowUpRight className="w-3 h-3 text-slate-800 group-hover:text-blue-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />
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
              <div className="flex items-center gap-4 md:gap-6">
                <button 
                  onClick={() => {
                    setSelectedCategory(null);
                    setSearchQuery('');
                  }}
                  className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all border border-white/10 shadow-sm group"
                >
                  <ChevronLeft className="icon-md text-slate-400 group-hover:text-white transition-colors" />
                </button>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-display-md text-white uppercase italic">{selectedCategory}</h2>
                    <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-tiny font-black uppercase tracking-widest rounded border border-blue-500/20">{selectedType}</span>
                  </div>
                  <p className="text-label text-slate-500 uppercase italic">Os {rankingData.length} melhores ativos filtrados por {selectedCategory.toLowerCase()}.</p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="relative w-full md:w-64 group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Search className="icon-sm text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar no ranking..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all hover:border-white/20"
                  />
                </div>

                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <span className="text-tiny font-black text-emerald-500 uppercase tracking-widest">Live Market Data</span>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 gap-6">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
                  <Award className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-500 icon-md" />
                </div>
                <p className="text-label text-slate-500 uppercase tracking-[0.2em] animate-pulse">Calculando Ranking...</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-col gap-3">
                  {filteredRankingData.map((item, idx) => (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      key={idx}
                    >
                      <Link 
                        to={`/asset/${item.ticker}`}
                        className="p-3 md:p-4 bg-slate-900/30 backdrop-blur-2xl border border-white/5 rounded-2xl flex items-center justify-between group relative overflow-hidden hover:bg-slate-900/40 hover:border-blue-500/20 hover:shadow-2xl hover:shadow-blue-500/5 transition-all h-full"
                      >
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r-full scale-y-0 group-hover:scale-y-100 transition-transform origin-center duration-300 shadow-[0_0_15px_rgba(59,130,246,0.6)]" />
                        
                        <div className="flex items-center gap-3 md:gap-4 relative z-10 flex-1 min-w-0">
                          <div className="flex items-center justify-center w-5 shrink-0">
                            <span className={`text-[9px] font-black italic tracking-widest ${idx < 3 ? 'text-blue-500' : 'text-slate-600'} group-hover:text-blue-400 transition-colors`}>
                              {(idx + 1).toString().padStart(2, '0')}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center p-1.5 shadow-xl border border-white/10 group-hover:scale-105 transition-transform duration-500 shrink-0 relative">
                              <AssetIcon assetType={selectedType as any} ticker={item.ticker} className="w-full h-full relative z-10" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-display-tiny text-xs text-white group-hover:text-blue-400 transition-colors uppercase italic tracking-tighter leading-none truncate">{item.ticker}</span>
                                {idx === 0 && <Trophy className="w-2.5 h-2.5 text-amber-500 shrink-0" />}
                              </div>
                              <div className="text-[8px] font-black text-slate-500 mt-0.5 uppercase tracking-widest italic opacity-60 group-hover:opacity-100 transition-all truncate">{item.name}</div>
                            </div>
                          </div>
                        </div>

                        <div className="text-right relative z-10 ml-2 shrink-0">
                          <div className="flex flex-col items-end">
                            <div className="text-display-tiny text-xs text-white uppercase italic tracking-tighter group-hover:text-blue-400 transition-colors">{item.value}</div>
                            <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest opacity-60 italic group-hover:text-slate-400 group-hover:opacity-100 transition-all">{item.subValue}</div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
                
                {rankingData.length === 0 ? (
                  <div className="p-20 text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto border border-white/10">
                      <Search className="icon-lg text-slate-600" />
                    </div>
                    <p className="text-label text-slate-500 uppercase italic">Nenhum dado encontrado para este ranking.</p>
                  </div>
                ) : filteredRankingData.length === 0 ? (
                  <div className="p-20 text-center space-y-6">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto border border-white/10">
                      <Search className="icon-lg text-slate-600" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-label text-slate-400 uppercase italic">Nenhum ativo encontrado no ranking para "{searchQuery}"</p>
                      <p className="text-tiny font-bold text-slate-600 uppercase tracking-widest italic opacity-60">Deseja buscar este ativo em todo o mercado?</p>
                    </div>
                    <Link 
                      to={`/search?q=${encodeURIComponent(searchQuery)}`}
                      className="btn-primary"
                    >
                      Buscar em Todo o Mercado <ArrowUpRight className="icon-xs" />
                    </Link>
                  </div>
                ) : null}
              </div>
            )}
            
            <div className="p-6 bg-white/5 border border-white/5 rounded-[2rem] flex items-start gap-4">
              <Info className="icon-sm text-slate-600 shrink-0 mt-1" />
              <div>
                <h4 className="text-label text-slate-500 uppercase italic mb-2">Metodologia Nexus</h4>
                <p className="text-tiny text-slate-500 leading-relaxed font-bold uppercase tracking-widest italic">
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
