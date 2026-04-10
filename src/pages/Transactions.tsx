import { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
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
    if (!auth.currentUser) return;

    setLoading(true);
    try {
      await addDoc(collection(db, `users/${auth.currentUser.uid}/transactions`), {
        userId: auth.currentUser.uid,
        ticker: ticker.toUpperCase(),
        type,
        assetType,
        quantity: parseFloat(quantity),
        price: parseFloat(price),
        date: new Date(date).toISOString(),
        createdAt: serverTimestamp()
      });
      
      setTicker('');
      setQuantity('');
      setPrice('');
      setMessage('Lançamento realizado com sucesso!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error(error);
      setMessage('Erro ao realizar lançamento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-16">
      <PageHeader 
        title="Lançamentos"
        description={<>Registre suas operações e mantenha seu histórico atualizado no <span className="text-blue-500 font-bold">Invest Engine</span>.</>}
        icon={History}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="card p-6 md:p-12 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/5 blur-[120px] -z-10" />
          
          <div className="flex items-center gap-5 mb-12">
            <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-[0_0_20px_rgba(37,99,235,0.1)]">
              <Plus size={28} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">Nova Operação</h3>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">Invest Transaction Engine v2.0</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Tipo de Operação</label>
                <div className="flex p-2 bg-white/[0.03] rounded-3xl border border-white/5">
                  <button
                    type="button"
                    onClick={() => setType('BUY')}
                    className={`flex-1 py-4 text-xs font-black uppercase tracking-widest rounded-2xl transition-all duration-500 flex items-center justify-center gap-3 ${
                      type === 'BUY' ? 'bg-blue-600 text-white shadow-[0_10px_30px_rgba(37,99,235,0.3)] scale-[1.02]' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <ArrowUpRight size={18} />
                    COMPRA
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('SELL')}
                    className={`flex-1 py-4 text-xs font-black uppercase tracking-widest rounded-2xl transition-all duration-500 flex items-center justify-center gap-3 ${
                      type === 'SELL' ? 'bg-red-600 text-white shadow-[0_10px_30px_rgba(220,38,38,0.3)] scale-[1.02]' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <ArrowDownRight size={18} />
                    VENDA
                  </button>
                </div>
              </div>

              <div className="space-y-3 group">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] group-focus-within:text-blue-500 transition-colors">
                  <Tag size={12} />
                  Ativo (Ticker)
                </label>
                <input
                  type="text"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value)}
                  placeholder="EX: PETR4"
                  required
                  className="w-full px-6 py-5 bg-white/[0.03] border border-white/5 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white font-black uppercase tracking-widest placeholder:text-slate-700 transition-all duration-500 hover:border-white/10"
                />
              </div>

              <div className="space-y-3 group">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] group-focus-within:text-blue-500 transition-colors">
                  <Layers size={12} />
                  Tipo de Ativo
                </label>
                <div className="relative">
                  <select
                    value={assetType}
                    onChange={(e) => setAssetType(e.target.value)}
                    className="w-full px-6 py-5 bg-white/[0.03] border border-white/5 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white font-black uppercase tracking-widest appearance-none transition-all duration-500 hover:border-white/10"
                  >
                    <option value="ACAO" className="bg-slate-900">Ação</option>
                    <option value="FII" className="bg-slate-900">FII</option>
                    <option value="ETF" className="bg-slate-900">ETF</option>
                    <option value="BDR" className="bg-slate-900">BDR</option>
                    <option value="CRIPT" className="bg-slate-900">Cripto</option>
                    <option value="RF" className="bg-slate-900">Renda Fixa</option>
                  </select>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                    <Plus size={16} className="rotate-45" />
                  </div>
                </div>
              </div>

              <div className="space-y-3 group">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] group-focus-within:text-blue-500 transition-colors">
                  <Plus size={12} />
                  Quantidade
                </label>
                <input
                  type="number"
                  step="any"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0.00"
                  required
                  className="w-full px-6 py-5 bg-white/[0.03] border border-white/5 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white font-mono placeholder:text-slate-700 transition-all duration-500 hover:border-white/10"
                />
              </div>

              <div className="space-y-3 group">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] group-focus-within:text-blue-500 transition-colors">
                  <DollarSign size={12} />
                  Preço Unitário
                </label>
                <input
                  type="number"
                  step="any"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="R$ 0,00"
                  required
                  className="w-full px-6 py-5 bg-white/[0.03] border border-white/5 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white font-mono placeholder:text-slate-700 transition-all duration-500 hover:border-white/10"
                />
              </div>

              <div className="md:col-span-2 space-y-3 group">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] group-focus-within:text-blue-500 transition-colors">
                  <Calendar size={12} />
                  Data da Operação
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full px-6 py-5 bg-white/[0.03] border border-white/5 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white font-black uppercase tracking-widest transition-all duration-500 hover:border-white/10 [color-scheme:dark]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-6 text-base uppercase tracking-[0.3em] font-black group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              {loading ? <Loader2 className="animate-spin" size={24} /> : <Plus size={24} />}
              Confirmar Lançamento
            </button>

            <AnimatePresence>
              {message && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`p-6 rounded-3xl text-center text-xs font-black uppercase tracking-[0.2em] border shadow-2xl ${
                    message.includes('sucesso') 
                      ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/20 shadow-emerald-500/5' 
                      : 'bg-red-500/5 text-red-400 border-red-500/20 shadow-red-500/5'
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
          <div className="card p-6 md:p-10 relative overflow-hidden flex flex-col min-h-[600px]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] -z-10" />
            
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-500/20">
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
                  className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl group hover:border-white/10 transition-all duration-500"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <AssetIcon assetType={tx.assetType} ticker={tx.ticker} className="w-10 h-10" />
                      <div>
                        <div className="font-black text-white text-base tracking-tighter">{tx.ticker}</div>
                        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{tx.assetType}</div>
                      </div>
                    </div>
                    <div className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                      tx.type === 'BUY' 
                        ? 'bg-blue-500/5 text-blue-400 border-blue-500/20' 
                        : 'bg-red-500/5 text-red-400 border-red-500/20'
                    }`}>
                      {tx.type === 'BUY' ? 'Compra' : 'Venda'}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
                    <div>
                      <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Qtd</p>
                      <p className="font-mono text-xs text-white">{tx.quantity}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Preço</p>
                      <p className="font-mono text-xs text-white">R$ {tx.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Data</p>
                      <p className="font-mono text-[10px] text-slate-400">{new Date(tx.date).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                </motion.div>
              ))}

              {transactions.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-600 text-center">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/5">
                    <History size={32} className="opacity-20" />
                  </div>
                  <p className="text-sm font-black uppercase tracking-widest text-slate-400">Nenhum lançamento</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mt-2">Suas operações aparecerão aqui.</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

