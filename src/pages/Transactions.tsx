import { useState, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Loader2, History, ArrowUpRight, ArrowDownRight, Calendar, Tag, DollarSign, Layers, Trash2, Download, Upload, FileSpreadsheet, Edit2, X, AlertCircle, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PageHeader } from '../components/ui/PageHeader';
import { usePortfolio } from '../hooks/usePortfolio';
import { AssetIcon } from '../components/ui/AssetIcon';
import { PortfolioNav } from '../components/PortfolioNav';
import * as XLSX from 'xlsx';

export default function Transactions() {
  const { transactions } = usePortfolio();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [ticker, setTicker] = useState('');
  const [type, setType] = useState<'BUY' | 'SELL'>('BUY');
  const [assetType, setAssetType] = useState('ACAO');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return Date.now().toString() + Math.random().toString(36).substring(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('handleSubmit called');
    e.preventDefault();
    
    setLoading(true);
    try {
      const isConfigured = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const parseBRNumber = (val: string | number | undefined) => {
        if (typeof val === 'number') return val;
        if (!val) return 0;
        return parseFloat(val.toString().replace(/\./g, '').replace(',', '.'));
      };

      const qty = parseBRNumber(quantity);
      const prc = parseBRNumber(price);

      if (isNaN(qty) || isNaN(prc) || qty <= 0 || prc <= 0) {
        throw new Error('Quantidade ou preço inválidos. Verifique os valores.');
      }

      const txData = {
        ticker: (ticker || '').toUpperCase().trim(),
        type,
        asset_type: assetType,
        quantity: qty,
        price: prc,
        date: new Date(date).toISOString(),
      };

      if (isConfigured) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado.');

        if (editingId) {
          const { error } = await supabase
            .from('transactions')
            .update(txData)
            .eq('id', editingId)
            .eq('user_id', user.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('transactions')
            .insert({ ...txData, user_id: user.id });
          if (error) throw error;
        }
      } else {
        let existingTxs = JSON.parse(localStorage.getItem('invest_transactions') || '[]');
        if (editingId) {
          existingTxs = existingTxs.map((tx: any) => 
            tx.id === editingId ? { ...tx, ...txData, assetType: txData.asset_type } : tx
          );
        } else {
          existingTxs.push({ ...txData, id: generateId(), assetType: txData.asset_type });
        }
        localStorage.setItem('invest_transactions', JSON.stringify(existingTxs));
      }
      
      window.dispatchEvent(new Event('invest_transactions_updated'));
      
      setTicker('');
      setQuantity('');
      setPrice('');
      setEditingId(null);
      setMessage(editingId ? 'Lançamento atualizado!' : 'Lançamento realizado com sucesso!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      console.error('Erro ao salvar transação:', error);
      setMessage(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      const isConfigured = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (isConfigured) {
        const { error } = await supabase.from('transactions').delete().eq('id', id);
        if (error) throw error;
      } else {
        const existingTxs = JSON.parse(localStorage.getItem('invest_transactions') || '[]');
        const filtered = existingTxs.filter((tx: any) => tx.id !== id);
        localStorage.setItem('invest_transactions', JSON.stringify(filtered));
      }
      window.dispatchEvent(new Event('invest_transactions_updated'));
      setMessage('Lançamento excluído!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      setMessage(`Erro ao excluir: ${error.message}`);
    } finally {
      setLoading(false);
      setShowDeleteConfirm(null);
    }
  };

  const startEdit = (tx: any) => {
    setEditingId(tx.id);
    setTicker(tx.ticker);
    setType(tx.type);
    setAssetType(tx.assetType || tx.asset_type);
    setQuantity(tx.quantity.toString());
    setPrice(tx.price.toString());
    setDate(new Date(tx.date).toISOString().split('T')[0]);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setTicker('');
    setQuantity('');
    setPrice('');
    setDate(new Date().toISOString().split('T')[0]);
  };

  const handleExport = () => {
    const dataToExport = transactions.map(tx => ({
      Data: new Date(tx.date).toLocaleDateString('pt-BR'),
      Ticker: tx.ticker,
      Tipo: tx.type === 'BUY' ? 'Compra' : 'Venda',
      Quantidade: tx.quantity,
      Preço: tx.price,
      Total: tx.quantity * tx.price,
      'Tipo de Ativo': tx.assetType
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transações");
    XLSX.writeFile(wb, `Nexus_Invest_Backup_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('handleImport called');
    const file = e.target.files?.[0];
    if (!file) return;
    console.log('File selected:', file.name);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        console.log('FileReader loaded');
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        if (!wb.SheetNames || wb.SheetNames.length === 0) throw new Error('Arquivo Excel sem planilhas.');
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        if (!ws) throw new Error('Não foi possível ler a planilha.');
        const data = XLSX.utils.sheet_to_json(ws) as any[];
        console.log('Data parsed:', data);

        const isConfigured = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;
        const newTxs: any[] = [];

        // Helper para inferir tipo de ativo (AÇÃO vs FII) de forma mais inteligente
        const inferType = (ticker: string, row: any) => {
          const t = ticker.toUpperCase().trim();
          const mercado = String(row.Mercado || row['Tipo de Ativo'] || row['Tipo Ativo'] || row['Categoria'] || '').toUpperCase();
          const produto = String(row.Produto || row['Nome do Ativo'] || row['Ativo'] || '').toUpperCase();
          
          // 1. Palavras-chave explícitas (Alta prioridade)
          if (mercado.includes('FII') || mercado.includes('IMOBILIÁRIO') || produto.includes('FII ') || produto.includes('FUNDO DE INVESTIMENTO IMOBILIARIO')) return 'FII';
          if (mercado.includes('BDR') || produto.includes('BDR ')) return 'BDR';
          if (mercado.includes('ETF') || mercado.includes('ÍNDICE') || produto.includes('ETF ') || produto.includes('FUNDO DE INDICE')) return 'ETF';
          if (mercado.includes('CRIPTO') || mercado.includes('BITCOIN') || produto.includes('BITCOIN') || produto.includes('ETHEREUM')) return 'CRIPT';

          // 2. Lógica de sufixo de Ticker (Média prioridade)
          if (t.endsWith('11')) {
            // Lista expandida de ETFs conhecidos
            const etfs = [
              'BOVA11', 'IVVB11', 'SMAL11', 'DIVO11', 'HASH11', 'WRLD11', 'XINA11', 'NASD11', 
              'BOVV11', 'BRAX11', 'ECOO11', 'FIND11', 'GOVE11', 'MATB11', 'ISUS11', 'PIBB11', 
              'SPXI11', 'USTK11', 'ACWI11', 'GOLD11', 'QBTC11', 'QETH11', 'BITH11', 'ETHE11'
            ];
            if (etfs.includes(t)) return 'ETF';
            
            // Se for 4 letras + 11 e não for ETF conhecido, é quase certamente FII
            if (/^[A-Z]{4}11$/.test(t)) return 'FII';
            return 'ETF'; // Fallback para outros finais 11
          }
          
          if (t.endsWith('31') || t.endsWith('32') || t.endsWith('33') || t.endsWith('34') || t.endsWith('35')) return 'BDR';
          if (t.endsWith('3') || t.endsWith('4') || t.endsWith('5') || t.endsWith('6')) return 'ACAO';

          // 3. Palavras-chave para AÇÃO (Baixa prioridade)
          if (mercado.includes('AÇÃO') || mercado.includes('AÇÕES') || mercado.includes('VISTA')) return 'ACAO';
          
          return 'ACAO';
        };

        for (const row of data) {
          console.log('Processing row:', row);
          
          // Mapeamento robusto para B3 e outros formatos
          const tickerRaw = String(row.Ticker || row['Código de Negociação'] || row['Ativo'] || row['Código'] || row['Produto'] || '');
          if (!tickerRaw) continue;

          // Limpa ticker (ex: "PETR4 - PETROLEO BRASILEIRO" -> "PETR4")
          // Tenta encontrar um padrão de ticker (4 letras + 1 ou 2 dígitos)
          const tickerMatch = tickerRaw.match(/[A-Z]{4}[0-9]{1,2}/i);
          const ticker = tickerMatch ? tickerMatch[0].toUpperCase() : tickerRaw.split(' ')[0].split('-')[0].toUpperCase().trim();
          
          const mov = String(row.Tipo || row['Movimentação'] || row['Tipo de Movimentação'] || row['Entrada/Saída'] || row['Operação'] || '').toUpperCase();
          const type = (mov.includes('VENDA') || mov.includes('SAÍDA') || mov.includes('SAIDA') || mov.includes('V')) ? 'SELL' : 'BUY';
          
          const parseBRNumber = (val: any) => {
            if (typeof val === 'number') return val;
            if (typeof val !== 'string') return 0;
            // Remove R$ and spaces, then handle thousands separator
            const clean = val.replace(/R\$/g, '').replace(/\s/g, '');
            if (clean.includes(',') && clean.includes('.')) {
              return parseFloat(clean.replace(/\./g, '').replace(',', '.'));
            }
            return parseFloat(clean.replace(',', '.'));
          };

          const quantity = Math.abs(parseBRNumber(row.Quantidade || row['Qtd.'] || row['Quantidade'] || row['Qtd']));
          const price = parseBRNumber(row.Preço || row['Preço Unitário'] || row['Preço'] || row['Preço Médio']);
          const dateStr = row.Data || row['Data do Pregão'] || row['Data'] || row['Data da Operação'];
          
          let date;
          if (typeof dateStr === 'number') {
            // Excel date format (days since 1900-01-01)
            // XLSX handles this usually, but just in case:
            const excelEpoch = new Date(1899, 11, 30);
            date = new Date(excelEpoch.getTime() + dateStr * 86400 * 1000).toISOString();
          } else if (typeof dateStr === 'string') {
            const parts = dateStr.includes('/') ? dateStr.split('/') : dateStr.split('-');
            if (parts.length === 3) {
              if (parts[0].length === 4) { // YYYY-MM-DD
                date = new Date(`${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}T12:00:00Z`).toISOString();
              } else { // DD/MM/YYYY
                const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
                date = new Date(`${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}T12:00:00Z`).toISOString();
              }
            } else {
              date = new Date().toISOString();
            }
          } else if (dateStr instanceof Date) {
            date = dateStr.toISOString();
          } else {
            date = new Date().toISOString();
          }

          if (ticker && quantity > 0) {
            newTxs.push({
              id: crypto.randomUUID(),
              ticker,
              type,
              assetType: inferType(ticker, row),
              quantity,
              price,
              date
            });
          }
        }

        if (newTxs.length === 0) throw new Error('Nenhuma transação válida encontrada no arquivo.');

        if (isConfigured) {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('Usuário não autenticado');

          const { error } = await supabase.from('transactions').insert(
            newTxs.map(tx => ({
              ticker: tx.ticker,
              type: tx.type,
              asset_type: tx.assetType,
              quantity: tx.quantity,
              price: tx.price,
              date: tx.date,
              user_id: user.id
            }))
          );
          if (error) throw error;
        } else {
          const existingTxs = JSON.parse(localStorage.getItem('invest_transactions') || '[]');
          const combined = [...existingTxs, ...newTxs];
          localStorage.setItem('invest_transactions', JSON.stringify(combined));
        }

        window.dispatchEvent(new Event('invest_transactions_updated'));
        setMessage(`${newTxs.length} transações importadas com sucesso!`);
        setTimeout(() => setMessage(''), 3000);
      } catch (err: any) {
        console.error('Import failed', err);
        setMessage(`Erro na importação: ${err.message}`);
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Lançamentos"
        description={<>Registre suas operações e mantenha seu histórico atualizado no <span className="text-blue-500 font-bold">Invest Engine</span>.</>}
        icon={History}
        actions={
          <div className="flex items-center gap-2">
            <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".xlsx,.xls,.csv" />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
              title="Importar Excel B3"
            >
              <Upload size={16} />
              <span className="hidden md:inline">Importar</span>
            </button>
            <button 
              onClick={handleExport}
              className="p-2.5 bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
              title="Exportar Backup"
            >
              <Download size={16} />
              <span className="hidden md:inline">Exportar</span>
            </button>
          </div>
        }
      />

      <div className="space-y-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden"
        >
          <button 
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="w-full p-6 flex items-center justify-between hover:bg-slate-800/30 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500 border border-blue-500/20">
                {editingId ? <Edit2 size={24} /> : <Plus size={24} />}
              </div>
              <div className="text-left">
                <h3 className="text-xl font-bold text-white tracking-tight">
                  {editingId ? 'Editar Operação' : 'Nova Operação'}
                </h3>
                <p className="text-slate-400 text-xs font-medium mt-0.5">
                  {isFormOpen ? 'Preencha os dados abaixo' : 'Clique para expandir o formulário'}
                </p>
              </div>
            </div>
            <div className={`p-2 rounded-lg bg-slate-800 text-slate-400 transition-transform duration-300 ${isFormOpen ? 'rotate-180' : ''}`}>
              <ChevronRight size={20} className="rotate-90" />
            </div>
          </button>

          <AnimatePresence>
            {isFormOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                <div className="p-6 pt-0 border-t border-slate-800/50 relative">
                  <form onSubmit={handleSubmit} className="space-y-6 mt-6">
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

            <div className="flex gap-3 mt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : (editingId ? <Edit2 size={20} /> : <Plus size={20} />)}
                {editingId ? 'Salvar Alterações' : 'Confirmar Lançamento'}
              </button>
              
              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-6 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <X size={20} />
                  Cancelar
                </button>
              )}
            </div>

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
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-8"
        >
          <div className="relative flex flex-col min-h-[600px]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[80px] -z-10" />
            
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500 border border-blue-500/20">
                  <History size={20} />
                </div>
                Histórico de Operações
              </h3>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                {transactions.length} Lançamentos
              </div>
            </div>

            <div className="overflow-hidden bg-[#0f172a] border border-slate-800 rounded-2xl">
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900/50 border-b border-slate-800">
                      <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Data</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Ativo</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Tipo</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Qtd.</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Preço</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Total</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((tx, idx) => (
                      <motion.tr 
                        key={tx.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.02 }}
                        className="hover:bg-slate-800/20 transition-all group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
                            <Calendar size={12} className="text-slate-600" />
                            {new Date(tx.date).toLocaleDateString('pt-BR')}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <AssetIcon assetType={tx.assetType || tx.asset_type} ticker={tx.ticker} className="w-8 h-8" />
                            <div>
                              <div className="font-bold text-white text-sm">{tx.ticker}</div>
                              <div className="text-[10px] font-medium text-slate-600 uppercase">{tx.assetType || tx.asset_type}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter border ${
                            tx.type === 'BUY' 
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                              : 'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}>
                            {tx.type === 'BUY' ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                            {tx.type === 'BUY' ? 'Compra' : 'Venda'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-xs font-bold text-slate-300">{tx.quantity}</td>
                        <td className="px-6 py-4 text-right text-xs font-bold text-slate-300">
                          R$ {tx.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-right text-xs font-black text-white">
                          R$ {(tx.quantity * tx.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            <button 
                              onClick={() => startEdit(tx)}
                              className="p-1.5 bg-slate-800 hover:bg-blue-600 text-slate-400 hover:text-white rounded-md transition-all"
                              title="Editar"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              onClick={() => setShowDeleteConfirm(tx.id)}
                              className="p-1.5 bg-slate-800 hover:bg-red-600 text-slate-400 hover:text-white rounded-md transition-all"
                              title="Excluir"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile History Cards */}
              <div className="md:hidden divide-y divide-slate-800/50">
                {transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((tx, idx) => (
                  <motion.div 
                    key={tx.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className="p-4 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <AssetIcon assetType={tx.assetType || tx.asset_type} ticker={tx.ticker} className="w-10 h-10" />
                        <div>
                          <div className="font-bold text-white text-sm">{tx.ticker}</div>
                          <div className="text-[10px] font-medium text-slate-600 uppercase">{tx.assetType || tx.asset_type}</div>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter border ${
                        tx.type === 'BUY' 
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {tx.type === 'BUY' ? 'Compra' : 'Venda'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-bold text-slate-600 uppercase mb-0.5">Qtd / Preço</p>
                        <p className="text-xs font-bold text-slate-300">{tx.quantity} x R$ {tx.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-600 uppercase mb-0.5">Total</p>
                        <p className="text-sm font-black text-white">R$ {(tx.quantity * tx.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/30">
                      <div className="text-[10px] text-slate-500 font-medium">
                        {new Date(tx.date).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => startEdit(tx)}
                          className="p-2 bg-slate-800 text-slate-400 rounded-lg"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => setShowDeleteConfirm(tx.id)}
                          className="p-2 bg-slate-800 text-slate-400 rounded-lg"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {transactions.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500 text-center">
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

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#0f172a] border border-slate-800 p-6 rounded-2xl max-w-sm w-full shadow-2xl"
              >
                <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-4 mx-auto">
                  <AlertCircle size={24} />
                </div>
                <h3 className="text-lg font-bold text-white text-center mb-2">Excluir Lançamento?</h3>
                <p className="text-slate-400 text-sm text-center mb-6">Esta ação não pode ser desfeita. O lançamento será removido permanentemente da sua carteira.</p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowDeleteConfirm(null)}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-sm transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={() => handleDelete(showDeleteConfirm)}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-red-600/20"
                  >
                    Excluir
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

