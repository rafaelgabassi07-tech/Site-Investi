import { PageHeader } from '../components/ui/PageHeader';
import { Award, Shield, Zap, TrendingUp, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function RecommendedPortfolios() {
  const portfolios = [
    {
      title: 'Carteira de Dividendos',
      description: 'Foco em empresas maduras e boas pagadoras de proventos.',
      icon: DollarSign,
      color: 'emerald',
      yield: '8.5% a.a.',
      risk: 'Baixo',
    },
    {
      title: 'Carteira Valorização',
      description: 'Empresas com alto potencial de crescimento e valorização.',
      icon: TrendingUp,
      color: 'blue',
      yield: 'N/A',
      risk: 'Alto',
    },
    {
      title: 'Carteira FIIs Renda',
      description: 'Fundos imobiliários selecionados para renda mensal recorrente.',
      icon: Shield,
      color: 'purple',
      yield: '10.2% a.a.',
      risk: 'Médio',
    },
    {
      title: 'Carteira Internacional',
      description: 'Diversificação global com as melhores Stocks e REITs.',
      icon: Zap,
      color: 'amber',
      yield: '3.1% a.a. (US$)',
      risk: 'Médio',
    }
  ];

  return (
    <div className="space-y-8 pb-24">
      <PageHeader 
        title="Carteiras Recomendadas"
        description="Estratégias prontas montadas por nossos especialistas."
        icon={Award}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {portfolios.map((portfolio, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-colors group cursor-pointer relative overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-${portfolio.color}-500/10 blur-[50px] -z-10`} />
            
            <div className="flex items-start justify-between mb-6">
              <div className={`w-12 h-12 rounded-2xl bg-${portfolio.color}-500/20 flex items-center justify-center`}>
                <portfolio.icon size={24} className={`text-${portfolio.color}-500`} />
              </div>
              <div className="flex gap-2">
                <span className="px-2 py-1 bg-white/5 rounded text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Risco: {portfolio.risk}
                </span>
              </div>
            </div>

            <h3 className="text-xl font-bold text-white mb-2">{portfolio.title}</h3>
            <p className="text-sm text-slate-400 mb-6">{portfolio.description}</p>

            <div className="flex items-center justify-between pt-6 border-t border-white/10">
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Dividend Yield Esperado</div>
                <div className={`text-lg font-bold text-${portfolio.color}-400`}>{portfolio.yield}</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                <ChevronRight size={20} className="text-slate-400 group-hover:text-white transition-colors" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 p-6 bg-gradient-to-r from-amber-500/10 to-amber-600/10 border border-amber-500/20 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-lg font-bold text-amber-500 mb-2">Acesso Exclusivo PRO</h3>
          <p className="text-sm text-amber-500/80">Assine o Invest Ultra PRO para ver a composição completa das carteiras e receber atualizações mensais.</p>
        </div>
        <button className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold rounded-xl whitespace-nowrap shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 transition-colors">
          Assinar Agora
        </button>
      </div>
    </div>
  );
}

// Helper for the missing icon
function DollarSign(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>;
}
