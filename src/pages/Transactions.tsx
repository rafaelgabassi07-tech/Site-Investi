import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Loader2, History, ArrowUpRight, ArrowDownRight, Calendar, Tag, DollarSign, Layers, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PageHeader } from '../components/ui/PageHeader';
import { usePortfolio } from '../hooks/usePortfolio';
import { AssetIcon } from '../components/ui/AssetIcon';

export default function Transactions() {
  const { transactions } = usePortfolio();
  const [ticker, setTicker] = useState('');
  const [type, setType] = useState<'BUY' | 'SELL'>('BUY');
  const [assetType, setAssetType] = useState('ACAO');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      const isConfigured = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const newTransaction = {
        id: crypto.randomUUID(),
        ticker: ticker.toUpperCase(),
        type,
        assetType,
        quantity: parseFloat(quantity),
        price: parseFloat(price),
        date: new Date(date).toISOString(),
      };

      if (isConfigured) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        const { error } = await supabase
          .from('transactions')
          .insert({
            ...newTransaction,
            user_id: user.id,
            id: undefined // Let Supabase generate the ID
          });
        
        if (error) throw error;
      } else {
        // Fallback to localStorage
        const existingTxs = JSON.parse(localStorage.getItem('invest_transactions') || '[]');
        existingTxs.push(newTransaction);
        localStorage.setItem('invest_transactions', JSON.stringify(existingTxs));
        window.dispatchEvent(new Event('invest_transactions_updated'));
      }
      
      setTicker('');
      setQuantity('');
      setPrice('');
      setMessage('Lançamento realizado com sucesso!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Erro detalhado ao salvar transação:', error);
      setMessage(`Erro ao realizar lançamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Lançamentos"
        description={<>Registre suas operações e mantenha seu histórico atualizado no <span className="text-blue-500 font-bold">Invest Engine</span>.</>}
        icon={History}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-lg"
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/5 blur-[100px] -z-10" />
          
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500 border border-blue-500/20">
              <Plus size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">Nova Operação</h3>
              <p className="text-slate-400 text-xs font-medium mt-0.5">Invest Transaction Engine v2.0</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-400 mb-3">Tipo de Operação</label>
                <div className="flex p-1.5 bg-slate-800/50 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setType('BUY')}
                    className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                      type === 'BUY' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <ArrowUpRight size={16} />
                    Compra
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('SELL')}
                    className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                      type === 'SELL' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <ArrowDownRight size={16} />
                    Venda
                  </button>
                </div>
              </div>

              <div className="space-y-2 group">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-400 group-focus-within:text-blue-400 transition-colors">
                  <Tag size={14} />
                  Ativo (Ticker)
                </label>
                <input
                  type="text"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value)}
                  placeholder="EX: PETR4"
                  required
                  className="w-full px-4 py-3 bg-slate-800/30 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white font-semibold uppercase placeholder:text-slate-600 transition-all duration-300 hover:border-slate-700"
                />
              </div>

              <div className="space-y-2 group">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-400 group-focus-within:text-blue-400 transition-colors">
                  <Layers size={14} />
                  Tipo de Ativo
                </label>
                <div className="relative">
                  <select
                    value={assetType}
                    onChange={(e) => setAssetType(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800/30 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white font-semibold appearance-none transition-all duration-300 hover:border-slate-700"
                  >
                    <option value="ACAO" className="bg-slate-900">Ação</option>
                    <option value="FII" className="bg-slate-900">FII</option>
                    <option value="ETF" className="bg-slate-900">ETF</option>
                    <option value="BDR" className="bg-slate-900">BDR</option>
                    <option value="CRIPT" className="bg-slate-900">Cripto</option>
                    <option value="RF" className="bg-slate-900">Renda Fixa</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                    <Plus size={16} className="rotate-45" />
                  </div>
                </div>
              </div>

              <div className="space-y-2 group">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-400 group-focus-within:text-blue-400 transition-colors">
                  <Plus size={14} />
                  Quantidade
                </label>
                <input
                  type="number"
                  step="any"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0.00"
                  required
                  className="w-full px-4 py-3 bg-slate-800/30 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white font-medium placeholder:text-slate-600 transition-all duration-300 hover:border-slate-700"
                />
              </div>

              <div className="space-y-2 group">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-400 group-focus-within:text-blue-400 transition-colors">
                  <DollarSign size={14} />
                  Preço Unitário
                </label>
                <input
                  type="number"
                  step="any"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="R$ 0,00"
                  required
                  className="w-full px-4 py-3 bg-slate-800/30 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white font-medium placeholder:text-slate-600 transition-all duration-300 hover:border-slate-700"
                />
              </div>

              <div className="md:col-span-2 space-y-2 group">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-400 group-focus-within:text-blue-400 transition-colors">
                  <Calendar size={14} />
                  Data da Operação
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-slate-800/30 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white font-medium transition-all duration-300 hover:border-slate-700 [color-scheme:dark]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 mt-4"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
              Confirmar Lançamento
            </button>

            <AnimatePresence>
              {message && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`p-4 rounded-xl text-center text-sm font-semibold border shadow-sm mt-4 ${
                    message.includes('sucesso') 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}
                >
                  {message}
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="space-y-8"
        >
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 relative overflow-hidden flex flex-col min-h-[600px] shadow-lg">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[80px] -z-10" />
            
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500 border border-blue-500/20">
                  <History size={20} />
                </div>
                Últimas Operações
              </h3>
            </div>

            <div className="space-y-4 overflow-y-auto max-h-[800px] pr-2 no-scrollbar">
              {transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((tx, idx) => (
                <motion.div 
                  key={tx.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-5 bg-slate-800/30 border border-slate-800 rounded-xl group hover:border-slate-700 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <AssetIcon assetType={tx.assetType} ticker={tx.ticker} className="w-10 h-10" />
                      <div>
                        <div className="font-bold text-white text-base">{tx.ticker}</div>
                        <div className="text-xs font-medium text-slate-500 mt-0.5">{tx.assetType}</div>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
                      tx.type === 'BUY' 
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {tx.type === 'BUY' ? 'Compra' : 'Venda'}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800/50">
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-1">Qtd</p>
                      <p className="font-medium text-sm text-white">{tx.quantity}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-1">Preço</p>
                      <p className="font-medium text-sm text-white">R$ {tx.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-slate-500 mb-1">Data</p>
                      <p className="font-medium text-xs text-slate-400">{new Date(tx.date).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                </motion.div>
              ))}

              {transactions.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-500 text-center">
                  <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4 border border-slate-800">
                    <History size={24} className="opacity-40" />
                  </div>
                  <p className="text-sm font-semibold text-slate-300">Nenhum lançamento</p>
                  <p className="text-xs font-medium text-slate-500 mt-1">Suas operações aparecerão aqui.</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

