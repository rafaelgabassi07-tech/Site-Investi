import { useState, useEffect } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { GitCompare, Search, X, TrendingUp, TrendingDown, Info, Loader2 } from 'lucide-react';
import { financeService, AssetDetails } from '../services/financeService';
import { motion, AnimatePresence } from 'motion/react';
import { AssetIcon } from '../components/ui/AssetIcon';

export default function Compare() {
  const [ticker1, setTicker1] = useState('');
  const [ticker2, setTicker2] = useState('');
  const [asset1, setAsset1] = useState<AssetDetails | null>(null);
  const [asset2, setAsset2] = useState<AssetDetails | null>(null);
  const [loading1, setLoading1] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAsset = async (ticker: string, setAsset: (a: AssetDetails | null) => void, setLoading: (l: boolean) => void) => {
    if (!ticker) return;
    setLoading(true);
    setError(null);
    try {
      const data = await financeService.getAssetDetails(ticker.toUpperCase());
      setAsset(data);
    } catch (err) {
      setError(`Erro ao buscar ${ticker}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const indicators = [
    { label: 'Preço Atual', key: 'precoAtual' },
    { label: 'Variação (Dia)', key: 'variacaoDay' },
    { label: 'P/L', key: 'pl' },
    { label: 'P/VP', key: 'pvp' },
    { label: 'Dividend Yield', key: 'dividendYield' },
    { label: 'ROE', key: 'roe' },
    { label: 'VPA', key: 'vpa' },
    { label: 'LPA', key: 'lpa' },
    { label: 'Margem Líquida', key: 'margemLiquida' },
  ];

  const compareValues = (val1: any, val2: any, key: string) => {
    if (val1 === undefined || val2 === undefined) return null;
    
    const parse = (v: any) => {
      if (typeof v === 'number') return v;
      if (typeof v === 'string') {
        return parseFloat(v.replace('%', '').replace(',', '.'));
      }
      return 0;
    };

    const n1 = parse(val1);
    const n2 = parse(val2);

    // For some indicators, lower is better (P/L, P/VP)
    const lowerIsBetter = ['pl', 'pvp'].includes(key);

    if (n1 === n2) return null;
    if (lowerIsBetter) {
      return n1 < n2 ? 'asset1' : 'asset2';
    }
    return n1 > n2 ? 'asset1' : 'asset2';
  };

  return (
    <div className="space-y-8 pb-24">
      <PageHeader 
        title="Comparar Ativos"
        description="Compare indicadores fundamentalistas entre dois ativos lado a lado."
        icon={GitCompare}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input 1 */}
        <div className="relative">
          <input
            type="text"
            placeholder="Digite o ticker 1 (ex: PETR4)"
            value={ticker1}
            onChange={(e) => setTicker1(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && fetchAsset(ticker1, setAsset1, setLoading1)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-blue-500 transition-all uppercase font-bold tracking-widest"
          />
          <button 
            onClick={() => fetchAsset(ticker1, setAsset1, setLoading1)}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors"
          >
            {loading1 ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
          </button>
        </div>

        {/* Input 2 */}
        <div className="relative">
          <input
            type="text"
            placeholder="Digite o ticker 2 (ex: VALE3)"
            value={ticker2}
            onChange={(e) => setTicker2(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && fetchAsset(ticker2, setAsset2, setLoading2)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-blue-500 transition-all uppercase font-bold tracking-widest"
          />
          <button 
            onClick={() => fetchAsset(ticker2, setAsset2, setLoading2)}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors"
          >
            {loading2 ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm font-medium text-center">
          {error}
        </div>
      )}

      <div className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl">
        <div className="grid grid-cols-3 border-b border-white/10 bg-white/[0.02]">
          <div className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center">Indicador</div>
          <div className="p-6 text-center">
            {asset1 ? (
              <div className="flex flex-col items-center gap-2">
                <AssetIcon assetType="ACAO" ticker={asset1.ticker} className="w-10 h-10" />
                <span className="text-lg font-black text-white tracking-tighter">{asset1.ticker}</span>
              </div>
            ) : (
              <span className="text-slate-600 font-bold uppercase tracking-widest text-[10px]">Ativo 1</span>
            )}
          </div>
          <div className="p-6 text-center">
            {asset2 ? (
              <div className="flex flex-col items-center gap-2">
                <AssetIcon assetType="ACAO" ticker={asset2.ticker} className="w-10 h-10" />
                <span className="text-lg font-black text-white tracking-tighter">{asset2.ticker}</span>
              </div>
            ) : (
              <span className="text-slate-600 font-bold uppercase tracking-widest text-[10px]">Ativo 2</span>
            )}
          </div>
        </div>

        <div className="divide-y divide-white/5">
          {indicators.map((ind, idx) => {
            const val1 = asset1?.results?.[ind.key];
            const val2 = asset2?.results?.[ind.key];
            const winner = compareValues(val1, val2, ind.key);

            return (
              <div key={idx} className="grid grid-cols-3 hover:bg-white/[0.02] transition-colors">
                <div className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center">{ind.label}</div>
                <div className={`p-6 text-center font-mono text-sm flex flex-col items-center justify-center gap-1 ${winner === 'asset1' ? 'text-emerald-400 bg-emerald-500/5' : 'text-white'}`}>
                  {val1 || '-'}
                  {winner === 'asset1' && <TrendingUp size={12} className="text-emerald-500" />}
                </div>
                <div className={`p-6 text-center font-mono text-sm flex flex-col items-center justify-center gap-1 ${winner === 'asset2' ? 'text-emerald-400 bg-emerald-500/5' : 'text-white'}`}>
                  {val2 || '-'}
                  {winner === 'asset2' && <TrendingUp size={12} className="text-emerald-500" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {!asset1 && !asset2 && (
        <div className="py-20 text-center space-y-4">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10">
            <GitCompare size={32} className="text-slate-600" />
          </div>
          <h3 className="text-xl font-bold text-white">Pronto para comparar?</h3>
          <p className="text-slate-500 text-sm max-w-xs mx-auto">Insira dois tickers acima para ver uma comparação detalhada de seus indicadores.</p>
        </div>
      )}
    </div>
  );
}
