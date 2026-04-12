import { usePortfolio } from '../hooks/usePortfolio';
import { Search, Loader2, Briefcase, ChevronRight, Globe, BarChart2, PieChart as PieIcon, DollarSign, TrendingUp, BarChart3, List, HelpCircle, TrendingDown, Plus } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PageHeader } from '../components/ui/PageHeader';
import { AssetIcon } from '../components/ui/AssetIcon';
import { financeService, AssetDetails } from '../services/financeService';
import Transactions from './Transactions';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

export default function Portfolio() {
  const { portfolio, loading } = usePortfolio();
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [assetDetails, setAssetDetails] = useState<AssetDetails | null>(null);
  const [fetchingDetails, setFetchingDetails] = useState(false);

  const handleFetchDetails = async (ticker: string, assetType: string) => {
    setSelectedTicker(ticker);
    setFetchingDetails(true);
    try {
      const data = await financeService.getAssetDetails(ticker, assetType);
      setAssetDetails(data);
    } catch (error) {
      console.error(error);
    } finally {
      setFetchingDetails(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
      <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Sincronizando Invest Portfolio...</p>
    </div>
  );

  const totalInvested = portfolio.reduce((acc, item) => acc + item.totalInvested, 0);
  const currentTotalValue = portfolio.reduce((acc, item) => acc + (item.currentValue || item.totalInvested), 0);
  const totalProfit = currentTotalValue - totalInvested;
  const totalProfitPercentage = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;
  const totalAssets = portfolio.length;

  // Pie Chart Data
  const allocationData = portfolio.reduce((acc: any[], item) => {
    const existing = acc.find(a => a.name === item.assetType);
    if (existing) {
      existing.value += item.currentValue || item.totalInvested;
    } else {
      acc.push({ name: item.assetType, value: item.currentValue || item.totalInvested });
    }
    return acc;
  }, []).sort((a, b) => b.value - a.value);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

  const menuItems = [
    { icon: PieIcon, label: 'Resumo', to: '/portfolio' },
    { icon: DollarSign, label: 'Proventos', to: '/dividends' },
    { icon: TrendingUp, label: 'Rentabilidade', to: '#' },
    { icon: BarChart3, label: 'Evolução do Patrimônio', to: '#' },
    { icon: Briefcase, label: 'Ativos na carteira', to: '#' },
    { icon: List, label: 'Meus ativos', to: '#' },
    { icon: HelpCircle, label: 'Dúvidas comuns', to: '#' },
  ];

  return (
    <div className="section-spacing space-y-4">
      <PageHeader 
        title="Minha Carteira"
        description={<>Gestão estratégica de ativos e alocação via <span className="text-blue-500 font-bold">Invest Engine</span>.</>}
        icon={Briefcase}
        actions={
          <button 
            onClick={() => {
              const el = document.getElementById('transactions-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20"
          >
            <Plus size={16} />
            Nova Operação
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 element-spacing">
        {menuItems.map((item, idx) => (
          <Link key={idx} to={item.to} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors group border border-white/5 hover:border-white/10">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center group-hover:bg-slate-800 transition-colors">
                <item.icon size={18} className="text-slate-400 group-hover:text-blue-400 transition-colors" />
              </div>
              <span className="text-slate-200 font-medium text-sm">{item.label}</span>
            </div>
            <ChevronRight size={16} className="text-slate-600" />
          </Link>
        ))}
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent element-spacing" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 element-spacing">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-lg"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-[60px] -z-10" />
          <p className="text-sm font-medium text-slate-400 mb-2">Patrimônio Atual</p>
          <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            R$ {currentTotalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
          <div className={`flex items-center gap-1 mt-3 text-sm font-semibold ${totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {totalProfit >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            R$ {Math.abs(totalProfit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({totalProfitPercentage.toFixed(2)}%)
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-lg"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/5 blur-[60px] -z-10" />
          <p className="text-sm font-medium text-slate-400 mb-2">Total Investido</p>
          <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            R$ {totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-sm text-slate-500 font-medium mt-3">Baseado em {totalAssets} ativos</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 relative overflow-hidden hidden lg:block shadow-lg"
        >
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={allocationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {allocationData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className="text-sm font-medium text-slate-400 mb-4">Alocação de Ativos</p>
          <div className="space-y-3 relative z-10 max-h-[120px] overflow-y-auto no-scrollbar">
            {allocationData.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-xs font-medium text-slate-300">{item.name}</span>
                </div>
                <span className="text-xs font-semibold text-white">{((item.value / currentTotalValue) * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="lg:col-span-2 space-y-4"
        >
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-full">
                <thead>
                  <tr className="bg-slate-800/30 border-b border-slate-800">
                    <th className="px-8 py-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Ativo</th>
                    <th className="px-8 py-5 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Qtd.</th>
                    <th className="px-8 py-5 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Preço Médio</th>
                    <th className="px-8 py-5 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Valor Atual</th>
                    <th className="px-8 py-5 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Resultado</th>
                    <th className="px-8 py-5 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {portfolio.map((item, idx) => {
                    const profit = item.profit || 0;
                    const isPositive = profit >= 0;
                    
                    return (
                      <motion.tr 
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.05 }}
                        key={item.ticker} 
                        className={`hover:bg-slate-800/30 transition-all group cursor-pointer ${selectedTicker === item.ticker ? 'bg-blue-500/10' : ''}`}
                        onClick={() => handleFetchDetails(item.ticker, item.assetType)}
                      >
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <AssetIcon assetType={item.assetType} ticker={item.ticker} />
                            <div>
                              <div className="font-bold text-white text-base group-hover:text-blue-400 transition-colors">{item.ticker}</div>
                              <div className="text-xs font-medium text-slate-500 mt-0.5">{item.assetType}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right font-medium text-sm text-slate-300">{item.totalQuantity}</td>
                        <td className="px-8 py-6 text-right font-medium text-sm text-slate-300">
                          R$ {item.averagePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-8 py-6 text-right font-semibold text-base text-white">
                          R$ {(item.currentValue || item.totalInvested).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className={`px-8 py-6 text-right font-semibold text-sm ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                          <div className="flex flex-col items-end">
                            <span>R$ {Math.abs(profit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            <span className="text-xs mt-0.5">{isPositive ? '+' : '-'}{Math.abs(item.profitPercentage || 0).toFixed(2)}%</span>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex justify-end">
                            <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                              <ChevronRight size={16} />
                            </div>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-slate-800/50">
              {portfolio.map((item, idx) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                  key={item.ticker}
                  onClick={() => handleFetchDetails(item.ticker, item.assetType)}
                  className={`p-5 space-y-4 active:bg-slate-800/50 transition-all ${selectedTicker === item.ticker ? 'bg-blue-500/10' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AssetIcon assetType={item.assetType} ticker={item.ticker} className="w-10 h-10" />
                      <div>
                        <div className="font-bold text-white text-base">{item.ticker}</div>
                        <div className="text-xs font-medium text-slate-500 mt-0.5">{item.assetType}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-medium text-slate-500 mb-1">Total</div>
                      <div className="font-bold text-white text-lg">
                        R$ {item.totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <div className="text-xs font-medium text-slate-500 mb-1">Qtd.</div>
                      <div className="font-medium text-sm text-slate-300">{item.totalQuantity}</div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-slate-500 mb-1">Preço Médio</div>
                      <div className="font-medium text-sm text-slate-300">R$ {item.averagePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="space-y-4"
        >
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 min-h-[500px] md:min-h-[600px] relative overflow-hidden flex flex-col shadow-lg">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[80px] -z-10" />
            
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500 border border-blue-500/20">
                  <BarChart2 size={20} />
                </div>
                Análise Invest
              </h3>
              {assetDetails && (
                <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg text-xs font-semibold">
                  Live Data
                </div>
              )}
            </div>

            <AnimatePresence mode="wait">
              {fetchingDetails ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center text-slate-500"
                >
                  <div className="relative mb-6">
                    <div className="w-16 h-16 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Globe size={24} className="text-blue-500 animate-pulse" />
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-white">Sincronizando Dados...</p>
                  <p className="text-xs mt-2 font-medium text-slate-400">Buscando cotações em tempo real</p>
                </motion.div>
              ) : assetDetails ? (
                <motion.div 
                  key="details"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6 flex-1"
                >
                  <div className="flex items-center justify-between p-5 bg-slate-800/30 rounded-xl border border-slate-800 group hover:border-blue-500/30 transition-all duration-300">
                    <span className="text-sm font-medium text-slate-400">Ticker Ativo</span>
                    <span className="text-2xl font-bold text-white tracking-tight group-hover:text-blue-400 transition-colors">{assetDetails.ticker}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(assetDetails.results || {}).slice(0, 8).map(([key, value], idx) => (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        key={key} 
                        className="p-4 bg-slate-800/30 border border-slate-800 rounded-xl hover:border-slate-700 transition-all duration-300 group"
                      >
                        <p className="text-xs font-medium text-slate-400 mb-2 group-hover:text-blue-400 transition-colors">{key}</p>
                        <p className="text-sm font-semibold text-white">{value as string}</p>
                      </motion.div>
                    ))}
                  </div>

                  <div className="mt-auto pt-6 border-t border-slate-800">
                    <div className="p-5 bg-blue-500/5 rounded-xl border border-blue-500/10 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-2xl -z-10 group-hover:bg-blue-500/20 transition-all" />
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                        <p className="text-xs font-semibold text-blue-400">Fonte de Inteligência</p>
                      </div>
                      <p className="text-xs font-medium text-slate-400 leading-relaxed">{assetDetails.metrics?.source}</p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex-1 flex flex-col items-center justify-center text-slate-500 text-center"
                >
                  <div className="w-20 h-20 bg-blue-600/5 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/10 shadow-sm group hover:border-blue-500/30 transition-all duration-500">
                    <Search size={32} className="text-blue-500/50 group-hover:text-blue-400 transition-all group-hover:scale-110" />
                  </div>
                  <p className="text-base font-semibold text-slate-300 mb-2">Aguardando Seleção</p>
                  <p className="text-sm font-medium text-slate-500 max-w-[240px] leading-relaxed">
                    Selecione um ativo na sua carteira para iniciar a <span className="text-blue-400">análise profunda</span> via Invest Engine.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="flex items-center gap-3 p-5 bg-[#0f172a] rounded-2xl border border-slate-800 text-slate-400 text-sm font-medium shadow-sm"
      >
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.6)]" />
        <span>Invest Engine: Sincronização em Tempo Real Ativa</span>
        <div className="ml-auto flex items-center gap-3 opacity-60 text-xs">
          <span>v2.5.0</span>
          <div className="w-px h-3 bg-slate-700" />
          <span>Status: Optimal</span>
        </div>
      </motion.div>

      <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent my-12" />
      <div id="transactions-section">
        <Transactions />
      </div>
    </div>
  );
}
