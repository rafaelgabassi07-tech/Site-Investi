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
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        if (!wb.SheetNames || wb.SheetNames.length === 0) throw new Error('Arquivo Excel sem planilhas.');
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        if (!ws) throw new Error('Não foi possível ler a planilha.');
        const data = XLSX.utils.sheet_to_json(ws) as any[];

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
          
          // Mapeamento robusto para B3 e outros formatos (Normalização de chaves para facilitar busca)
          const normalizedRow: Record<string, string | number> = {};
          for (const key in row) {
            if (Object.prototype.hasOwnProperty.call(row, key)) {
              normalizedRow[key.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, "")] = row[key];
            }
          }

          const tickerRaw = String(
            normalizedRow['ticker'] || 
            normalizedRow['codigo de negociacao'] || 
            normalizedRow['ativo'] || 
            normalizedRow['codigo'] || 
            normalizedRow['produto'] || 
            row.Ticker || row['Código de Negociação'] || row['Ativo'] || row['Código'] || row['Produto'] || ''
          );
          if (!tickerRaw || tickerRaw.trim() === '' || tickerRaw.toUpperCase().includes('RENDIMENTO') || tickerRaw.toUpperCase().includes('JUROS')) continue;

          // Limpa ticker (ex: "PETR4 - PETROLEO BRASILEIRO" -> "PETR4")
          const tickerMatch = tickerRaw.match(/[A-Z]{4}[0-9]{1,2}/i);
          const ticker = tickerMatch ? tickerMatch[0].toUpperCase() : tickerRaw.split('-')[0].split(' ')[0].toUpperCase().trim();
          
          const mov = String(
            normalizedRow['tipo'] || 
            normalizedRow['movimentacao'] || 
            normalizedRow['tipo de movimentacao'] || 
            normalizedRow['entrada/saida'] || 
            normalizedRow['operacao'] || 
            row.Tipo || row['Movimentação'] || row['Tipo de Movimentação'] || row['Entrada/Saída'] || row['Operação'] || ''
          ).toUpperCase();
          
          // Se for uma movimentação de dividendos ou taxas, pula
          if (mov.includes('DESDOBRAMENTO') || mov.includes('AGRUPAMENTO') || mov.includes('RENDIMENTO') || mov.includes('AMORTIZACAO') || mov.includes('LEILAO')) continue;
          
          const type = (mov.includes('VENDA') || mov.includes('SAIDA') || mov === 'V' || mov.includes('DEBITO')) ? 'SELL' : 'BUY';
          
          const parseBRNumber = (val: any) => {
            if (val === undefined || val === null || val === '') return 0;
            if (typeof val === 'number') return Math.abs(val);
            if (typeof val !== 'string') return 0;
            const clean = String(val).replace(/R\$/g, '').replace(/\s/g, '');
            if (clean.includes(',') && clean.includes('.')) {
              return Math.abs(parseFloat(clean.replace(/\./g, '').replace(',', '.')));
            }
            return Math.abs(parseFloat(clean.replace(',', '.')));
          };

          const rawQuantity = normalizedRow['quantidade'] || normalizedRow['qtde'] || normalizedRow['qtd'] || normalizedRow['qnt'] || row.Quantidade || row.Qty || row.Qtde || row['Qtde.'];
          let quantity = parseBRNumber(rawQuantity);
          
          const rawPrice = normalizedRow['preco'] || normalizedRow['valor'] || normalizedRow['preco unitario'] || normalizedRow['preco medio'] || normalizedRow['preco de execucao'] || normalizedRow['valor unitario'] || row.Preço || row.Price || row.Valor || row['Preço Médio'] || row['Preço/Cota'] || row['Valor Operação'];
          let price = parseBRNumber(rawPrice);

          // Se a planilha não tem preço, mas tem Quantidade e Total
          if (price === 0 && (normalizedRow['total'] || normalizedRow['valor total'] || row['Valor Total'] || row.Total)) {
            const total = parseBRNumber(normalizedRow['total'] || normalizedRow['valor total'] || row['Valor Total'] || row.Total);
            if (quantity > 0) price = total / quantity;
          }

          if (price === 0 || quantity === 0) {
              console.warn("Ignorando linha por falta de quantia/preço válidos", row);
              continue;
          }

          const rawDate = normalizedRow['data'] || normalizedRow['data do pregao'] || normalizedRow['data do negocio'] || normalizedRow['data da operacao'] || normalizedRow['data liquidacao'] || row.Data || row['Data do Pregão'] || row.Date || row['Data do Negócio'];
          let date;
          if (typeof rawDate === 'number') {
            const excelEpoch = new Date(1899, 11, 30);
            date = new Date(excelEpoch.getTime() + rawDate * 86400 * 1000).toISOString();
          } else if (typeof rawDate === 'string') {
            const parts = rawDate.includes('/') ? rawDate.split('/') : rawDate.split('-');
            if (parts.length === 3) {
              if (parts[0].length === 4) { // YYYY-MM-DD
                date = new Date(`${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}T12:00:00Z`).toISOString();
              } else { // DD/MM/YYYY
                const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
                // sometimes time is included DD/MM/YYYY hh:mm -> safe split
                const cleanYear = year.split(' ')[0];
                date = new Date(`${cleanYear}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}T12:00:00Z`).toISOString();
              }
            } else {
              date = new Date().toISOString();
            }
          } else if (rawDate instanceof Date) {
            date = rawDate.toISOString();
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
        description="Gestão de ordens e histórico."
        icon={History}
        actions={
          <div className="flex items-center gap-2">
            <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".xlsx,.xls,.csv" />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl border border-white/10 transition-all flex items-center gap-2 text-label"
              title="Importar Excel B3"
            >
              <Upload className="icon-sm" />
              <span className="hidden md:inline">Importar</span>
            </button>
            <button 
              onClick={handleExport}
              className="p-2.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl border border-white/10 transition-all flex items-center gap-2 text-label"
              title="Exportar Backup"
            >
              <Download className="icon-sm" />
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
            className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500 border border-blue-500/20">
                {editingId ? <Edit2 className="icon-lg" /> : <Plus className="icon-lg" />}
              </div>
              <div className="text-left">
                <h3 className="text-display-sm text-white">
                  {editingId ? 'Editar Operação' : 'Nova Operação'}
                </h3>
                <p className="text-label mt-0.5">
                  {isFormOpen ? 'Preencha os dados abaixo' : 'Clique para expandir o formulário'}
                </p>
              </div>
            </div>
            <div className={`p-2 rounded-lg bg-white/5 text-slate-400 transition-transform duration-300 ${isFormOpen ? 'rotate-180' : ''}`}>
              <ChevronRight className="icon-md rotate-90" />
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
                <label className="block text-label mb-3">Tipo de Operação</label>
                <div className="flex p-1.5 bg-white/5 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => setType('BUY')}
                    className={`flex-1 py-3 text-label rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                      type === 'BUY' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-200'
                    }`}
                  >
                    <ArrowUpRight className="icon-xs" />
                    Compra
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('SELL')}
                    className={`flex-1 py-3 text-label rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                      type === 'SELL' ? 'bg-red-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-200'
                    }`}
                  >
                    <ArrowDownRight className="icon-xs" />
                    Venda
                  </button>
                </div>
              </div>

              <div className="space-y-2 group">
                <label className="flex items-center gap-2 text-label group-focus-within:text-blue-400 transition-colors">
                  <Tag className="icon-xs" />
                  Ativo (Ticker)
                </label>
                <input
                  type="text"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value)}
                  placeholder="EX: PETR4"
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white font-bold uppercase placeholder:text-slate-600 transition-all duration-300 hover:border-white/20 text-sm"
                />
              </div>

              <div className="space-y-2 group">
                <label className="flex items-center gap-2 text-label group-focus-within:text-blue-400 transition-colors">
                  <Layers className="icon-xs" />
                  Tipo de Ativo
                </label>
                <div className="relative">
                  <select
                    value={assetType}
                    onChange={(e) => setAssetType(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white font-bold appearance-none transition-all duration-300 hover:border-white/20 text-sm"
                  >
                    <option value="ACAO" className="bg-slate-900">Ação</option>
                    <option value="FII" className="bg-slate-900">FII</option>
                    <option value="ETF" className="bg-slate-900">ETF</option>
                    <option value="BDR" className="bg-slate-900">BDR</option>
                    <option value="CRIPT" className="bg-slate-900">Cripto</option>
                    <option value="RF" className="bg-slate-900">Renda Fixa</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                    <Plus className="icon-sm rotate-45" />
                  </div>
                </div>
              </div>

              <div className="space-y-2 group">
                <label className="flex items-center gap-2 text-label group-focus-within:text-blue-400 transition-colors">
                  <Plus className="icon-xs" />
                  Quantidade
                </label>
                <input
                  type="number"
                  step="any"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0.00"
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white font-bold placeholder:text-slate-600 transition-all duration-300 hover:border-white/20 text-sm"
                />
              </div>

              <div className="space-y-2 group">
                <label className="flex items-center gap-2 text-label group-focus-within:text-blue-400 transition-colors">
                  <DollarSign className="icon-xs" />
                  Preço Unitário
                </label>
                <input
                  type="number"
                  step="any"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="R$ 0,00"
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white font-bold placeholder:text-slate-600 transition-all duration-300 hover:border-white/20 text-sm"
                />
              </div>

              <div className="md:col-span-2 space-y-2 group">
                <label className="flex items-center gap-2 text-label group-focus-within:text-blue-400 transition-colors">
                  <Calendar className="icon-xs" />
                  Data da Operação
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white font-bold transition-all duration-300 hover:border-white/20 [color-scheme:dark] text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1"
              >
                {loading ? <Loader2 className="animate-spin icon-sm" /> : (editingId ? <Edit2 className="icon-sm" /> : <Plus className="icon-sm" />)}
                {editingId ? 'Salvar Alterações' : 'Confirmar Lançamento'}
              </button>
              
              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="btn-secondary px-6"
                >
                  <X className="icon-sm" />
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
              <h3 className="text-display-sm text-white flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500 border border-blue-500/20">
                  <History className="icon-md" />
                </div>
                Histórico de Operações
              </h3>
              <div className="text-label text-slate-500">
                {transactions.length} Lançamentos
              </div>
            </div>

            <div className="overflow-hidden">
              {/* Desktop List */}
              <div className="hidden md:block">
                <div className="flex items-center px-6 py-4 bg-white/[0.02] border-b border-white/5">
                  <div className="flex-1 text-[10px] font-black uppercase text-slate-500 tracking-widest">Ativo & Tipo</div>
                  <div className="w-32 text-center text-[10px] font-black uppercase text-slate-500 tracking-widest">Tipo</div>
                  <div className="w-40 text-right text-[10px] font-black uppercase text-slate-500 tracking-widest">Qtd & Preço</div>
                  <div className="w-48 text-right text-[10px] font-black uppercase text-slate-500 tracking-widest">Total Operação</div>
                  <div className="w-16 text-right"></div>
                </div>
                <div className="divide-y divide-white/5">
                  {transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((tx, idx) => (
                    <motion.div 
                      key={tx.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.01 }}
                      className="flex items-center px-6 py-5 hover:bg-white/[0.03] transition-all group"
                    >
                      <div className="flex-1 flex items-center gap-4">
                        <AssetIcon assetType={tx.assetType || tx.asset_type} ticker={tx.ticker} className="w-10 h-10 rounded-xl bg-white p-1" />
                        <div>
                          <div className="text-display-tiny text-white uppercase italic">{tx.ticker}</div>
                          <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">{new Date(tx.date).toLocaleDateString('pt-BR')}</div>
                        </div>
                      </div>
                      <div className="w-32 flex justify-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${
                          tx.type === 'BUY' 
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          {tx.type === 'BUY' ? 'Compra' : 'Venda'}
                        </span>
                      </div>
                      <div className="w-40 text-right">
                        <div className="text-[11px] font-black text-slate-300">{tx.quantity} <span className="opacity-40">UND</span></div>
                        <div className="text-[10px] font-black text-slate-600 italic">@ R$ {tx.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                      </div>
                      <div className="w-48 text-right">
                        <div className="text-display-tiny text-white uppercase italic">R$ {(tx.quantity * tx.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                      </div>
                      <div className="w-16 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => startEdit(tx)}
                          className="p-1.5 bg-white/5 hover:bg-blue-600 text-slate-400 hover:text-white rounded-lg transition-all border border-white/10"
                        >
                          <Edit2 className="icon-xs" />
                        </button>
                        <button 
                          onClick={() => setShowDeleteConfirm(tx.id)}
                          className="p-1.5 bg-white/5 hover:bg-red-600 text-slate-400 hover:text-white rounded-lg transition-all border border-white/10"
                        >
                          <Trash2 className="icon-xs" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

                <div className="md:hidden divide-y divide-white/5 border-t border-white/5">
                  {transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((tx, idx) => (
                    <motion.div 
                      key={tx.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.01 }}
                      className="p-5 space-y-4 hover:bg-white/[0.02] transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <AssetIcon assetType={tx.assetType || tx.asset_type} ticker={tx.ticker} className="w-10 h-10 rounded-xl bg-white p-1" />
                          <div>
                            <div className="text-display-tiny text-white uppercase italic">{tx.ticker}</div>
                            <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">{new Date(tx.date).toLocaleDateString('pt-BR')}</div>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${
                          tx.type === 'BUY' 
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          {tx.type === 'BUY' ? 'Compra' : 'Venda'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic mb-0.5">Qtd / Preço</p>
                          <p className="text-xs font-bold text-slate-300 italic">{tx.quantity} x R$ {tx.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic mb-0.5">Total</p>
                          <p className="text-display-tiny text-white italic tracking-tight">R$ {(tx.quantity * tx.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                        <button 
                          onClick={() => startEdit(tx)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-white/5 text-slate-500 rounded-lg border border-white/10 text-[10px] font-black uppercase tracking-widest"
                        >
                          <Edit2 className="w-3 h-3" />
                          Editar
                        </button>
                        <button 
                          onClick={() => setShowDeleteConfirm(tx.id)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-white/5 text-slate-500 rounded-lg border border-white/10 text-[10px] font-black uppercase tracking-widest"
                        >
                          <Trash2 className="w-3 h-3" />
                          Excluir
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>

              {transactions.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500 text-center">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10">
                    <History className="icon-lg opacity-40" />
                  </div>
                  <p className="text-label text-slate-300">Nenhum lançamento</p>
                  <p className="text-tiny font-bold text-slate-600 uppercase tracking-widest mt-1 italic">Suas operações aparecerão aqui.</p>
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
                  <AlertCircle className="icon-lg" />
                </div>
                <h3 className="text-display-sm text-center mb-2">Excluir Lançamento?</h3>
                <p className="text-label text-slate-400 text-center mb-6 normal-case">Esta ação não pode ser desfeita. O lançamento será removido permanentemente da sua carteira.</p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowDeleteConfirm(null)}
                    className="flex-1 py-2.5 btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={() => handleDelete(showDeleteConfirm)}
                    className="flex-1 py-2.5 btn-primary bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20"
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

