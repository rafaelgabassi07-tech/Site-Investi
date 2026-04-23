import { PageHeader } from '../components/ui/PageHeader';
import { Award, TrendingUp, DollarSign, PieChart, Heart, BarChart3, ArrowUpRight, ArrowDownRight, Briefcase, ChevronLeft, Loader2, Star, Zap, Shield, Target, Flame, Gem, Trophy, Info, Search, ShieldAlert } from 'lucide-react';
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
  const [error, setError] = useState<string | null>(null);

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
    setError(null);
    try {
      const data = await financeService.getRanking(cat, selectedType);
      setRankingData(data || []);
      if (!data || data.length === 0) {
        setError('O motor Nexus não encontrou dados para este ranking. Os servidores de dados podem estar temporariamente congestionados.');
      }
    } catch (error: any) {
      console.error('Failed to fetch ranking:', error);
      setError(error.message || 'Falha crítica na conexão com os servidores Nexus.');
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
    <div className="space-y-4 pb-12">
      <AnimatePresence mode="wait" initial={false}>
        {!selectedCategory ? (
          <motion.div
            key="categories"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 outline-none">
              <PageHeader 
                title="Rankings Nexus"
                description="Inteligência de mercado e filtros de performance."
                icon={Award}
              />

              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="relative w-full md:w-64 group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Search className="icon-sm text-muted-foreground group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type="text"
                    placeholder="Filtrar rankings..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 bg-secondary border border-border rounded-xl text-sm font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all hover:border-border/80"
                  />
                </div>

                  <div className="flex p-1 bg-secondary border border-border rounded-xl shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-blue-600/5 blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity" />
                    {[
                      { label: 'Ações', value: 'ACAO' },
                      { label: 'FIIs', value: 'FII' },
                      { label: 'Stocks', value: 'STOCK' }
                    ].map((type) => (
                      <button 
                        key={type.label} 
                        onClick={() => setSelectedType(type.value)}
                        className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all relative z-10 italic ${
                          selectedType === type.value 
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-1 ring-blue-500/50' 
                            : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
            </div>
          </div>

            <div className="nexus-grid">
              {filteredCategories.map((cat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  onClick={() => handleCategoryClick(cat.title)}
                  className="nexus-card flex flex-col gap-3 group cursor-pointer"
                >
                  <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity`}>
                    <cat.icon size={64} />
                  </div>
                  <div className={`w-12 h-12 rounded-2xl ${cat.bg} flex items-center justify-center border ${cat.border} transition-transform duration-500 shadow-xl relative shrink-0`}>
                    <cat.icon className={`w-6 h-6 ${cat.text}`} />
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <h3 className="nexus-title group-hover:text-blue-500 transition-colors">{cat.title}</h3>
                    <p className="nexus-description opacity-70 group-hover:opacity-100 transition-opacity line-clamp-2">{cat.description}</p>
                  </div>

                  <div className="mt-auto pt-3 border-t border-border group-hover:border-blue-500/20 transition-colors">
                    <span className="nexus-label group-hover:text-foreground">ANALISAR</span>
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
            className="space-y-4"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border">
              <div className="flex items-center gap-4 md:gap-6">
                <button 
                  onClick={() => {
                    setSelectedCategory(null);
                    setSearchQuery('');
                  }}
                  className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center hover:bg-accent transition-all border border-border shadow-sm group"
                >
                  <ChevronLeft className="icon-md text-muted-foreground group-hover:text-foreground transition-colors" />
                </button>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-lg md:text-display-md font-display font-black text-foreground uppercase italic tracking-tight">{selectedCategory}</h2>
                    <span className="px-3 py-1 bg-blue-500 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-blue-500/20">{selectedType}</span>
                  </div>
                  <p className="text-[9px] md:text-tiny font-black text-slate-500 uppercase italic tracking-wider leading-none">Top performance filtrada por {selectedCategory.toLowerCase()}.</p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="relative w-full md:w-64 group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Search className="icon-sm text-muted-foreground group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar no ranking..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 bg-secondary border border-border rounded-xl text-sm font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all hover:border-border/80"
                  />
                </div>

                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic">Ao Vivo</span>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 gap-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full border-4 border-blue-500/10 border-t-blue-500 animate-spin" />
                  <Award className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-500 icon-md" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-[11px] font-black text-foreground uppercase tracking-[0.3em] italic animate-pulse">Processando Dados</p>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest italic">Calculando métricas fundamentalistas...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-24 text-center space-y-6 bg-red-500/5 border border-dashed border-red-500/20 rounded-2xl">
                 <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                    <ShieldAlert className="w-8 h-8 text-red-500" />
                 </div>
                 <div className="space-y-2 max-w-sm">
                    <p className="text-xs font-black text-red-500 uppercase tracking-widest italic">Falha no Link de Dados</p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider leading-relaxed">{error}</p>
                 </div>
                 <button 
                  onClick={() => handleCategoryClick(selectedCategory!)}
                  className="px-6 py-2 bg-secondary border border-border rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-accent transition-all"
                 >
                   Tentar Novamente
                 </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="nexus-grid">
                  {filteredRankingData.map((item, idx) => (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      key={idx}
                    >
                      <Link 
                        to={`/asset/${item.ticker}`}
                        className="group card flex flex-col gap-6 h-full border border-white/5 hover:border-blue-500/30 transition-all p-5 md:p-6"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-slate-900/40 flex items-center justify-center border border-white/10 group-hover:bg-blue-600/20 group-hover:border-blue-500/50 transition-all">
                             <AssetIcon assetType={selectedType as any} ticker={item.ticker} className="w-8 h-8" />
                          </div>
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <h3 className="text-white text-lg md:text-xl font-display font-black tracking-tighter uppercase italic truncate">{item.ticker}</h3>
                            <p className="text-[10px] md:text-[11px] text-slate-400 font-bold uppercase tracking-widest truncate">{item.name}</p>
                          </div>
                        </div>

                        <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                           <div className="flex flex-col gap-1 min-w-0">
                              <span className="text-white text-base md:text-lg font-black italic truncate">{item.value}</span>
                              <span className="text-[9px] md:text-[10px] text-slate-500 uppercase tracking-widest italic truncate">{item.subValue || 'Métrica'}</span>
                           </div>
                           <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/10 group-hover:bg-blue-600 group-hover:border-blue-500 transition-all">
                             <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5 text-slate-400 group-hover:text-white transition-colors" />
                           </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
                
                {rankingData.length === 0 ? (
                  <div className="p-24 text-center space-y-6 bg-secondary/50 rounded-2xl border border-dashed border-border mt-8">
                    <div className="w-20 h-20 rounded-xl md:rounded-2xl bg-secondary flex items-center justify-center mx-auto border border-border shadow-inner">
                      <Search className="icon-lg text-muted-foreground" />
                    </div>
                    <p className="text-[11px] font-black text-muted-foreground uppercase italic tracking-[0.2em]">O motor Nexus não encontrou dados para este ranking.</p>
                  </div>
                ) : filteredRankingData.length === 0 ? (
                  <div className="p-24 text-center space-y-8 bg-secondary/50 rounded-2xl border border-dashed border-border mt-8">
                    <div className="w-20 h-20 rounded-xl md:rounded-2xl bg-secondary flex items-center justify-center mx-auto border border-border shadow-inner">
                      <Search className="icon-lg text-muted-foreground" />
                    </div>
                    <div className="space-y-3">
                      <p className="text-sm font-black text-foreground uppercase italic tracking-tight leading-tight">Nenhum ativo encontrado para "{searchQuery}"</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] italic max-w-[280px] mx-auto">Tente buscar por um ticker específico ou nome da empresa.</p>
                    </div>
                    <Link 
                      to={`/search?q=${encodeURIComponent(searchQuery)}`}
                      className="btn-primary"
                    >
                      Pesquisa Global <ArrowUpRight className="icon-xs" />
                    </Link>
                  </div>
                ) : null}
              </div>
            )}
            
            <div className="p-8 bg-blue-500/5 border border-blue-500/10 rounded-xl md:rounded-2xl flex items-start gap-5 mt-12 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[60px] -z-10 group-hover:scale-150 transition-transform duration-1000" />
              <Info className="icon-sm text-blue-500 shrink-0 mt-1" />
              <div className="space-y-3">
                <h4 className="text-[11px] font-black text-foreground uppercase italic tracking-[0.2em]">Metodologia de Análise Nexus</h4>
                <p className="text-[10px] text-muted-foreground leading-relaxed font-bold uppercase tracking-widest italic">
                  Os rankings Nexus são calculados diariamente através do processamento de dados de mercado em tempo real. Nossa engine utiliza filtros fundamentalistas avançados e algoritmos de scoring para classificar os melhores ativos de cada categoria, fornecendo uma visão técnica e imparcial para sua tomada de decisão.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
