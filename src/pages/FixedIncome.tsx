import { PageHeader } from '../components/ui/PageHeader';
import { ShieldCheck, TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { motion } from 'motion/react';

export default function FixedIncome() {
  const products = [
    { name: 'CDB Banco Master', type: 'CDB', rate: '130% CDI', min: 'R$ 1.000', maturity: '2 Anos', risk: 'Baixo' },
    { name: 'LCA Banco Inter', type: 'LCA', rate: 'IPCA + 6,5%', min: 'R$ 500', maturity: '3 Anos', risk: 'Baixo', taxFree: true },
    { name: 'Tesouro Selic 2029', type: 'Tesouro', rate: 'Selic + 0,15%', min: 'R$ 140', maturity: '2029', risk: 'Muito Baixo' },
    { name: 'Debênture Simpar', type: 'Debênture', rate: 'CDI + 2,5%', min: 'R$ 1.000', maturity: '5 Anos', risk: 'Médio', taxFree: true },
    { name: 'CDB XP Investimentos', type: 'CDB', rate: '115% CDI', min: 'R$ 100', maturity: '1 Ano', risk: 'Baixo' },
  ];

  return (
    <div className="space-y-8 pb-24">
      <PageHeader 
        title="Renda Fixa"
        description="Encontre as melhores taxas para investir com segurança."
        icon={ShieldCheck}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {['Todos', 'CDBs', 'LCI/LCA', 'Tesouro Direto', 'Debêntures'].map((type, i) => (
              <button 
                key={type} 
                className={`px-6 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-colors ${
                  i === 0 
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' 
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {products.map((product, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white/5 border border-white/10 rounded-3xl p-5 hover:bg-white/10 transition-colors group cursor-pointer"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-wider rounded">
                        {product.type}
                      </span>
                      {product.taxFree && (
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded">
                          Isento de IR
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{product.name}</h3>
                  </div>
                  
                  <div className="grid grid-cols-3 sm:flex sm:items-center gap-4 sm:gap-8 bg-[#020617]/50 p-4 rounded-2xl border border-white/5">
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1"><TrendingUp size={12}/> Rentabilidade</div>
                      <div className="text-sm font-bold text-emerald-400">{product.rate}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1"><DollarSign size={12}/> Mínimo</div>
                      <div className="text-sm font-bold text-white">{product.min}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1"><Calendar size={12}/> Vencimento</div>
                      <div className="text-sm font-bold text-white">{product.maturity}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-[60px] -z-10" />
            <h3 className="text-lg font-bold text-white mb-6">Taxas de Referência</h3>
            <div className="space-y-4">
              {[
                { label: 'Selic', value: '10,75%', trend: 'stable' },
                { label: 'CDI', value: '10,65%', trend: 'stable' },
                { label: 'IPCA (12m)', value: '4,50%', trend: 'up' },
                { label: 'IGP-M (12m)', value: '-3,20%', trend: 'down' },
              ].map((rate, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{rate.label}</span>
                  <span className="text-sm font-black text-white">{rate.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600/10 to-transparent border border-blue-500/20 rounded-[2rem] p-6">
            <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Simulador Rápido</h4>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Quanto quer investir?</label>
                <input type="text" placeholder="R$ 1.000,00" className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2 text-white text-sm outline-none focus:border-blue-500" />
              </div>
              <button className="w-full py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-colors">
                Simular Rendimento
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
