import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Info, 
  Globe, 
  BarChart2, 
  CheckCircle2, 
  XCircle, 
  Calendar,
  ShieldCheck,
  Zap,
  Building2,
  Wallet,
  Activity,
  PieChart,
  DollarSign
} from 'lucide-react';
import { motion } from 'motion/react';
import { financeService, AssetDetails, HistoryPoint } from '../services/financeService';
import { AssetIcon } from '../components/ui/AssetIcon';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AssetIntelligence } from '../components/AssetIntelligence';

const METRIC_LABELS: Record<string, string> = {
  precoAtual: 'Preço Atual',
  variacaoDay: 'Variação (Dia)',
  pl: 'P/L',
  pvp: 'P/VP',
  vpa: 'VPA',
  lpa: 'LPA',
  dy: 'Div. Yield',
  dividendYield: 'Div. Yield',
  marketCap: 'Valor de Mercado',
  valorMercado: 'Valor de Mercado',
  margemLiquida: 'Margem Líquida',
  margemBruta: 'Margem Bruta',
  roe: 'ROE',
  roa: 'ROA',
  dividaLiquidaEbitda: 'Dív. Líq / EBITDA',
  enterpriseValue: 'Enterprise Value',
  forwardPE: 'P/L Projetado',
  pegRatio: 'PEG Ratio',
  liquidezMediaDiaria: 'Liq. Média Diária',
  patrimonioLiquido: 'Patrimônio Líq.',
  valorPatrimonialCota: 'VPC',
  ultimoRendimento: 'Último Rend.',
  vacanciaFisica: 'Vacância Física',
  vacanciaFinanceira: 'Vacância Fin.',
  quantidadeAtivos: 'Qtd. Ativos',
  cagrReceita5Anos: 'CAGR Receita (5a)',
  cagrLucro5Anos: 'CAGR Lucro (5a)',
  numeroCotistas: 'Nº Cotistas',
  segmentoListagem: 'Segmento Listagem',
  tagAlong: 'Tag Along',
  freeFloat: 'Free Float',
  payout: 'Payout',
  tipoGestao: 'Tipo de Gestão',
  taxaAdmin: 'Taxa Admin.',
  receitaLiquida: 'Receita Líq.',
  ebitda: 'EBITDA',
  lucroLiquido: 'Lucro Líq.',
  p_vp: 'P/VP',
  p_l: 'P/L',
  vpa_val: 'VPA',
  lpa_val: 'LPA',
  margem_liquida: 'Margem Líq.',
  margem_ebit: 'Margem EBIT',
  divida_liquida_ebitda: 'Dív.Líq/EBITDA',
  divida_liquida_patrimonio: 'Dív.Líq/Patrimônio',
  psr: 'PSR',
  p_ativo: 'P/Ativo',
  p_cap_giro: 'P/Cap. Giro',
  p_ebit: 'P/EBIT',
  ev_ebitda: 'EV/EBITDA',
  ev_ebit: 'EV/EBIT',
  roic: 'ROIC',
  giro_ativos: 'Giro Ativos',
  liquidez_corrente: 'Liq. Corrente'
};

const formatMetricValue = (key: string, value: any) => {
  if (value == null || value === '' || value === '-') return '---';
  const strVal = String(value);
  
  if (strVal.includes('%') || strVal.includes('R$')) return strVal;

  if (['marketCap', 'valorMercado', 'patrimonioLiquido', 'enterpriseValue', 'liquidezMediaDiaria', 'receitaLiquida', 'ebitda', 'lucroLiquido'].includes(key)) {
    const num = Number(value);
    if (!isNaN(num)) {
      if (num >= 1e9) return `R$ ${(num / 1e9).toFixed(2)}B`;
      if (num >= 1e6) return `R$ ${(num / 1e6).toFixed(2)}M`;
      return `R$ ${num.toLocaleString('pt-BR')}`;
    }
  }

  if (['precoAtual', 'vpa', 'lpa', 'ultimoRendimento', 'valorPatrimonialCota', 'vpa_val', 'lpa_val'].includes(key)) {
    const num = Number(value);
    if (!isNaN(num)) return `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  }

  if (['pl', 'pvp', 'p_vp', 'p_l', 'roe', 'roa', 'roic', 'margemLiquida', 'margemBruta', 'dy', 'dividendYield', 'margem_liquida', 'divida_liquida_ebitda', 'margemEbit', 'cagrReceita5Anos', 'cagrLucro5Anos', 'vacanciaFisica', 'vacanciaFinanceira', 'tagAlong', 'freeFloat', 'payout'].includes(key)) {
    const num = Number(value);
    if (!isNaN(num)) {
      if (['roe', 'roa', 'roic', 'margemLiquida', 'margemBruta', 'dy', 'dividendYield', 'margem_liquida', 'margemEbit', 'cagrReceita5Anos', 'cagrLucro5Anos', 'vacanciaFisica', 'vacanciaFinanceira', 'tagAlong', 'freeFloat', 'payout'].includes(key)) {
        return `${num.toFixed(2)}%`;
      }
      return num.toFixed(2);
    }
  }

  return strVal;
};

export default function AssetAnalysis() {
  const { ticker } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const assetType = queryParams.get('type') || 'ACAO';

  const [assetDetails, setAssetDetails] = useState<AssetDetails | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const handleGoBack = () => {
    if (window.history.length > 2 || (window.history.state && window.history.state.idx > 0)) {
      navigate(-1);
    } else {
      navigate('/portfolio/resumo');
    }
  };

  useEffect(() => {
    if (!ticker) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [details, hist] = await Promise.all([
          financeService.getAssetDetails(ticker, assetType),
          financeService.getAssetHistory(ticker, '1y')
        ]);
        setAssetDetails(details);
        setHistory(hist);
      } catch (error) {
        console.error('Erro ao buscar detalhes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [ticker, assetType]);

  const checklist = useMemo(() => {
    if (!assetDetails) return [];
    const res = assetDetails.results || {};
    const items = [];
    
    const dy = parseFloat(String(res.dy || res.dividendYield || '0').replace('%', '').replace(',', '.'));
    const pvp = parseFloat(String(res.pvp || res.p_vp || '0').replace(',', '.'));
    const roe = parseFloat(String(res.roe || '0').replace('%', '').replace(',', '.'));
    const pl = parseFloat(String(res.pl || res.p_l || '0').replace(',', '.'));
    const cagr = parseFloat(String(res.cagrReceita5Anos || '0').replace('%', '').replace(',', '.'));
    const liqStr = String(res.liquidezMediaDiaria || res.liquidezDiaria || '0');
    let liq = 0;
    if (liqStr.toLowerCase().includes('m')) liq = parseFloat(liqStr.replace(/[^\d,.-]/g, '').replace(',', '.')) * 1000000;
    else if (liqStr.toLowerCase().includes('b')) liq = parseFloat(liqStr.replace(/[^\d,.-]/g, '').replace(',', '.')) * 1000000000;
    else if (liqStr.toLowerCase().includes('k')) liq = parseFloat(liqStr.replace(/[^\d,.-]/g, '').replace(',', '.')) * 1000;
    else liq = parseFloat(liqStr.replace(/[^\d,.-]/g, '').replace(',', '.'));
    
    const vacancia = parseFloat(String(res.vacanciaFisica || '0').replace('%', '').replace(',', '.'));
    const qtdAtivos = parseFloat(String(res.quantidadeAtivos || '0').replace(',', '.'));

    if (dy > 6) items.push({ label: 'Dividend Yield > 6%', ok: true });
    else if (dy > 0) items.push({ label: 'Dividend Yield > 6%', ok: false });

    if (pvp > 0 && pvp < 1.5) items.push({ label: 'P/VP < 1.5', ok: true });
    else if (pvp > 0) items.push({ label: 'P/VP < 1.5', ok: false });

    if (roe > 10) items.push({ label: 'ROE > 10%', ok: true });
    else if (roe > 0) items.push({ label: 'ROE > 10%', ok: false });

    if (pl > 0 && pl < 15) items.push({ label: 'P/L < 15', ok: true });
    else if (pl > 0) items.push({ label: 'P/L < 15', ok: false });

    if (cagr > 0) items.push({ label: 'Crescimento (CAGR) > 0', ok: true });
    else if (res.cagrReceita5Anos) items.push({ label: 'Crescimento (CAGR) > 0', ok: false });

    if (liq >= 1000000) items.push({ label: 'Boa Liquidez (> 1M)', ok: true });
    else if (res.liquidezMediaDiaria || res.liquidezDiaria) items.push({ label: 'Boa Liquidez (> 1M)', ok: false });

    if (res.quantidadeAtivos) {
      if (qtdAtivos > 1) items.push({ label: 'Multi-Ativo (FII)', ok: true });
      else items.push({ label: 'Multi-Ativo (FII)', ok: false });
    }

    if (res.vacanciaFisica) {
      if (vacancia < 10) items.push({ label: 'Vacância Baixa (< 10%)', ok: true });
      else items.push({ label: 'Vacância Baixa (< 10%)', ok: false });
    }

    return items;
  }, [assetDetails]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#020617] p-6">
        <div className="relative mb-8">
          <div className="w-24 h-24 border-[1px] border-blue-500/20 rounded-full animate-[spin_3s_linear_infinite]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 border-t-2 border-blue-500 rounded-full animate-spin" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Activity className="icon-2xl text-blue-500 animate-pulse" />
          </div>
        </div>
        <h2 className="text-display-md text-white">Nexus Intelligence</h2>
        <p className="text-label text-slate-500 mt-3 animate-pulse">Sincronizando Ativo: {ticker}</p>
      </div>
    );
  }

  if (!assetDetails) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#020617] p-6 text-center">
        <div className="w-20 h-20 bg-red-500/5 rounded-3xl flex items-center justify-center text-red-500 mb-8 border border-red-500/10">
          <Info className="icon-2xl" />
        </div>
        <h2 className="text-3xl font-display font-bold text-white mb-3 tracking-tighter uppercase">Ativo não encontrado</h2>
        <p className="text-slate-400 mb-10 max-w-md font-medium">Não conseguimos localizar os dados para <span className="text-white font-bold">{ticker}</span>. Verifique se o código está correto ou tente novamente mais tarde.</p>
        <button 
          onClick={handleGoBack}
          className="btn-primary"
        >
          <ArrowLeft className="icon-sm" />
          Voltar ao Portfolio
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] pb-32">
      <header className="sticky top-0 z-[100] bg-[#020617]/80 backdrop-blur-2xl border-b border-white/5">
        <div className="w-full px-4 md:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              onClick={handleGoBack}
              className="group flex items-center gap-3 text-slate-400 hover:text-white transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-white/20 transition-all">
                <ArrowLeft className="icon-md" />
              </div>
              <span className="text-label hidden sm:block">Voltar</span>
            </button>
            <div className="flex items-center gap-4">
              <h1 className="text-display-xl text-white uppercase italic">{ticker}</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-12 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-20 h-20 bg-blue-600/10 rounded-3xl flex items-center justify-center text-blue-500 border border-blue-500/20 mb-8 animate-pulse">
           <Activity className="icon-2xl" />
        </div>
        <h2 className="text-display-md text-white uppercase italic tracking-tighter">Aguardando Dados Investidor10</h2>
        <p className="text-slate-500 text-label mt-4 uppercase tracking-[0.2em] font-black">Nexus Intelligence Engine pronto para implementação</p>
      </main>
    </div>
  );
}
