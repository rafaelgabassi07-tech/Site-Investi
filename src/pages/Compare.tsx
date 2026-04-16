import { useState, useEffect } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { GitCompare, Search, TrendingUp, TrendingDown, Info, Loader2 } from 'lucide-react';
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
    { label: 'ROA', key: 'roa' },
    { label: 'VPA', key: 'vpa' },
    { label: 'LPA', key: 'lpa' },
    { label: 'Margem Líquida', key: 'margemLiquida' },
    { label: 'Margem Bruta', key: 'margemBruta' },
    { label: 'Dívida/EBITDA', key: 'dividaLiquidaEbitda' },
    { label: 'PEG Ratio', key: 'pegRatio' },
    { label: 'Forward P/E', key: 'forwardPE' },
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
    <div className="space-y-4 pb-24">
      <PageHeader 
        title="Comparar Ativos"
        description="Compare indicadores fundamentalistas entre dois ativos lado a lado."
        icon={GitCompare}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Input 1 */}
        <div className="relative group">
          <input
            type="text"
            placeholder="Digite o ticker 1 (ex: PETR4)"
            value={ticker1}
            onChange={(e) => setTicker1(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && fetchAsset(ticker1, setAsset1, setLoading1)}
            className="w-full bg-white/5 border border-white/5 rounded-xl px-5 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all uppercase font-bold tracking-tight shadow-sm"
          />
          <button 
            onClick={() => fetchAsset(ticker1, setAsset1, setLoading1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20"
          >
            {loading1 ? <Loader2 className="animate-spin icon-sm" /> : <Search className="icon-sm" />}
          </button>
        </div>

        {/* Input 2 */}
        <div className="relative group">
          <input
            type="text"
            placeholder="Digite o ticker 2 (ex: VALE3)"
            value={ticker2}
            onChange={(e) => setTicker2(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && fetchAsset(ticker2, setAsset2, setLoading2)}
            className="w-full bg-white/5 border border-white/5 rounded-xl px-5 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all uppercase font-bold tracking-tight shadow-sm"
          />
          <button 
            onClick={() => fetchAsset(ticker2, setAsset2, setLoading2)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20"
          >
            {loading2 ? <Loader2 className="animate-spin icon-sm" /> : <Search className="icon-sm" />}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-medium text-center">
          {error}
        </div>
      )}

      <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden shadow-lg">
        <div className="grid grid-cols-3 border-b border-white/5 bg-white/5">
          <div className="p-4 text-label text-slate-400 flex items-center uppercase">Indicador</div>
          <div className="p-4 text-center">
            {asset1 ? (
              <div className="flex flex-col items-center gap-2">
                <AssetIcon assetType="ACAO" ticker={asset1.ticker} className="w-10 h-10 shadow-xl" />
                <span className="text-display-tiny text-white uppercase">{asset1.ticker}</span>
              </div>
            ) : (
              <span className="text-label text-slate-600 uppercase italic">Ativo 1</span>
            )}
          </div>
          <div className="p-4 text-center">
            {asset2 ? (
              <div className="flex flex-col items-center gap-2">
                <AssetIcon assetType="ACAO" ticker={asset2.ticker} className="w-10 h-10 shadow-xl" />
                <span className="text-display-tiny text-white uppercase">{asset2.ticker}</span>
              </div>
            ) : (
              <span className="text-label text-slate-600 uppercase italic">Ativo 2</span>
            )}
          </div>
        </div>

        <div className="divide-y divide-white/5">
          {indicators.map((ind, idx) => {
            const val1 = asset1?.results?.[ind.key];
            const val2 = asset2?.results?.[ind.key];
            const winner = compareValues(val1, val2, ind.key);

            return (
              <div key={idx} className="grid grid-cols-3 hover:bg-white/5 transition-colors group">
                <div className="p-4 text-label text-slate-400 flex items-center uppercase group-hover:text-slate-200 transition-colors">{ind.label}</div>
                <div className={`p-4 text-center text-display-tiny flex flex-col items-center justify-center gap-1 ${winner === 'asset1' ? 'text-emerald-400 bg-emerald-500/5' : 'text-white'}`}>
                  {val1 || '---'}
                  {winner === 'asset1' && <TrendingUp className="icon-xs text-emerald-500" />}
                </div>
                <div className={`p-4 text-center text-display-tiny flex flex-col items-center justify-center gap-1 ${winner === 'asset2' ? 'text-emerald-400 bg-emerald-500/5' : 'text-white'}`}>
                  {val2 || '---'}
                  {winner === 'asset2' && <TrendingUp className="icon-xs text-emerald-500" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {!asset1 && !asset2 && (
        <div className="py-20 text-center space-y-4">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto border border-white/5">
            <GitCompare className="icon-lg text-slate-500" />
          </div>
          <h3 className="text-display-tiny text-white uppercase italic">Pronto para comparar?</h3>
          <p className="text-tiny font-bold text-slate-500 text-sm max-w-xs mx-auto uppercase tracking-widest leading-relaxed">Insira dois tickers acima para ver uma comparação detalhada de seus indicadores.</p>
        </div>
      )}
    </div>
  );
}
