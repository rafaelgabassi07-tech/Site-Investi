import { PageHeader } from '../components/ui/PageHeader';
import { Award, Shield, Zap, TrendingUp, ChevronRight, DollarSign } from 'lucide-react';
import { motion } from 'motion/react';

export default function RecommendedPortfolios() {
  const portfolios = [
    {
      title: 'Carteira de Dividendos',
      description: 'Foco em empresas maduras e boas pagadoras de proventos com fluxo de caixa resiliente.',
      icon: DollarSign,
      color: 'emerald',
      yield: '8.5% a.a.',
      risk: 'Baixo',
      assets: ['PETR4', 'VALE3', 'BBAS3', 'ITUB4', 'VIVT3']
    },
    {
      title: 'Carteira Valorização',
      description: 'Empresas com alto potencial de crescimento e valorização de mercado a médio prazo.',
      icon: TrendingUp,
      color: 'blue',
      yield: 'N/A',
      risk: 'Alto',
      assets: ['WEGE3', 'PRIO3', 'RENT3', 'BTOW3', 'MGLU3']
    },
    {
      title: 'Carteira FIIs Renda',
      description: 'Fundos imobiliários selecionados para renda mensal recorrente e isenta de IR.',
      icon: Shield,
      color: 'purple',
      yield: '10.2% a.a.',
      risk: 'Médio',
      assets: ['MXRF11', 'HGLG11', 'KNIP11', 'XPLG11', 'VISC11']
    },
    {
      title: 'Carteira Internacional',
      description: 'Diversificação global com as melhores Stocks e REITs do mercado americano.',
      icon: Zap,
      color: 'amber',
      yield: '3.1% a.a. (US$)',
      risk: 'Médio',
      assets: ['AAPL', 'MSFT', 'GOOGL', 'O', 'AMT']
    }
  ];

  return (
    <div className="space-y-8 pb-24">
      <PageHeader 
        title="Carteiras Recomendadas"
        description="Estratégias prontas montadas por nossos especialistas para diferentes perfis."
        icon={Award}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {portfolios.map((portfolio, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-[#0f172a] border border-slate-800 rounded-3xl p-8 hover:border-slate-700 transition-all group cursor-pointer relative overflow-hidden shadow-lg"
          >
            <div className={`absolute top-0 right-0 w-48 h-48 bg-${portfolio.color}-500/5 blur-[80px] -z-10`} />
            
            <div className="flex items-start justify-between mb-8">
              <div className={`w-14 h-14 rounded-2xl bg-${portfolio.color}-500/10 flex items-center justify-center border border-${portfolio.color}-500/20`}>
                <portfolio.icon size={28} className={`text-${portfolio.color}-500`} />
              </div>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-slate-800 rounded-lg text-xxs font-bold text-slate-400 uppercase tracking-widest border border-slate-700">
                  Risco: {portfolio.risk}
                </span>
              </div>
            </div>

            <h3 className="text-2xl font-bold text-white mb-3 tracking-tight group-hover:text-blue-400 transition-colors">{portfolio.title}</h3>
            <p className="text-sm text-slate-400 mb-8 leading-relaxed font-medium">{portfolio.description}</p>

            <div className="space-y-4 mb-8">
              <p className="text-xxs font-bold text-slate-500 uppercase tracking-[0.2em]">Principais Ativos</p>
              <div className="flex flex-wrap gap-2">
                {portfolio.assets.map(asset => (
                  <span key={asset} className="px-2.5 py-1 bg-slate-800/50 border border-slate-800 rounded text-xxs font-bold text-slate-300">
                    {asset}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-8 border-t border-slate-800/50">
              <div>
                <div className="text-xxs font-bold text-slate-500 uppercase tracking-widest mb-1">Dividend Yield Esperado</div>
                <div className={`text-2xl font-black text-${portfolio.color}-400`}>{portfolio.yield}</div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-slate-800/50 flex items-center justify-center group-hover:bg-blue-600 transition-all border border-slate-800 group-hover:border-blue-500">
                <ChevronRight size={24} className="text-slate-500 group-hover:text-white transition-colors" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
