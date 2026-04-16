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
    <div className="space-y-3 pb-12">
      <PageHeader 
        title="Carteiras Recomendadas"
        description="Estratégias prontas montadas por nossos especialistas para diferentes perfis."
        icon={Award}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {portfolios.map((portfolio, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 hover:border-white/20 transition-all group cursor-pointer relative overflow-hidden shadow-xl"
            onClick={() => window.location.href = `/search?q=${portfolio.assets.join(',')}`}
          >
            <div className={`absolute top-0 right-0 w-48 h-48 bg-${portfolio.color}-500/5 blur-[80px] -z-10`} />
            
            <div className="flex items-start justify-between mb-8">
              <div className={`w-14 h-14 rounded-2xl bg-${portfolio.color}-500/10 flex items-center justify-center border border-${portfolio.color}-500/20 group-hover:scale-110 transition-transform duration-500`}>
                <portfolio.icon className={`icon-md text-${portfolio.color}-500`} />
              </div>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-white/5 rounded-lg text-tiny font-black text-slate-500 uppercase tracking-widest border border-white/5">
                  Risco: {portfolio.risk}
                </span>
              </div>
            </div>

            <h3 className="text-display-tiny text-white mb-3 uppercase italic group-hover:text-blue-400 transition-colors">{portfolio.title}</h3>
            <p className="text-tiny font-bold text-slate-500 mb-8 leading-relaxed uppercase tracking-widest leading-relaxed">{portfolio.description}</p>

            <div className="space-y-4 mb-8">
              <p className="text-tiny font-black text-slate-600 uppercase tracking-[0.2em] italic">Principais Ativos</p>
              <div className="flex flex-wrap gap-2">
                {portfolio.assets.map(asset => (
                  <span key={asset} className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-xl text-tiny font-black text-slate-300 uppercase tracking-widest hover:border-blue-500/30 transition-colors">
                    {asset}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-white/5">
              <div>
                <div className="text-tiny font-black text-slate-600 uppercase tracking-[0.25em] mb-1 italic">Expected Yield</div>
                <div className={`text-display-tiny text-${portfolio.color}-400 uppercase italic`}>{portfolio.yield}</div>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.href = `/search?q=${portfolio.assets.join(',')}`;
                }}
                className="btn-primary"
              >
                Ver Detalhes
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
