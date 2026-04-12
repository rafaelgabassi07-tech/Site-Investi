import { useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { ShieldCheck, TrendingUp, Calendar, DollarSign, Calculator } from 'lucide-react';
import { motion } from 'motion/react';

export default function FixedIncome() {
  const [amount, setAmount] = useState('1000');
  const [simulationResult, setSimulationResult] = useState<any>(null);

  const products = [
    { name: 'CDB Banco Master', type: 'CDB', rate: '130% CDI', min: 'R$ 1.000', maturity: '2 Anos', risk: 'Baixo' },
    { name: 'LCA Banco Inter', type: 'LCA', rate: 'IPCA + 6,5%', min: 'R$ 500', maturity: '3 Anos', risk: 'Baixo', taxFree: true },
    { name: 'Tesouro Selic 2029', type: 'Tesouro', rate: 'Selic + 0,15%', min: 'R$ 140', maturity: '2029', risk: 'Muito Baixo' },
    { name: 'Debênture Simpar', type: 'Debênture', rate: 'CDI + 2,5%', min: 'R$ 1.000', maturity: '5 Anos', risk: 'Médio', taxFree: true },
    { name: 'CDB XP Investimentos', type: 'CDB', rate: '115% CDI', min: 'R$ 100', maturity: '1 Ano', risk: 'Baixo' },
  ];

  const handleSimulate = () => {
    const val = parseFloat(amount.replace(/[^\d.]/g, '')) || 0;
    const cdi = 0.1065; // 10.65%
    const years = 1;
    
    const result = {
      cdi: val * (1 + cdi * 1.15 * years), // 115% CDI
      poupanca: val * (1 + 0.0617 * years), // ~6.17%
      profit: (val * cdi * 1.15 * years)
    };
    
    setSimulationResult(result);
  };

  return (
    <div className="space-y-3 pb-12">
      <PageHeader 
        title="Renda Fixa"
        description="Encontre as melhores taxas para investir com segurança e previsibilidade."
        icon={ShieldCheck}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {['Todos', 'CDBs', 'LCI/LCA', 'Tesouro Direto', 'Debêntures'].map((type, i) => (
              <button 
                key={type} 
                className={`px-6 py-2.5 rounded-xl border text-xxs font-bold uppercase tracking-widest whitespace-nowrap transition-colors ${
                  i === 0 
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' 
                    : 'bg-slate-800/30 border-slate-800 text-slate-300 hover:bg-slate-800/50'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {products.map((product, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 hover:border-blue-500/30 transition-all group cursor-pointer shadow-lg"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 text-xxs font-bold uppercase tracking-widest rounded-md border border-blue-500/20">
                        {product.type}
                      </span>
                      {product.taxFree && (
                        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-xxs font-bold uppercase tracking-widest rounded-md border border-emerald-500/20">
                          Isento de IR
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors tracking-tight">{product.name}</h3>
                  </div>
                  
                  <div className="grid grid-cols-3 sm:flex sm:items-center gap-4 sm:gap-10 bg-slate-900/50 p-5 rounded-2xl border border-slate-800">
                    <div>
                      <div className="text-xxs font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><TrendingUp size={14} className="text-emerald-500"/> Retorno</div>
                      <div className="text-sm font-black text-emerald-400">{product.rate}</div>
                    </div>
                    <div>
                      <div className="text-xxs font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><DollarSign size={14} className="text-blue-500"/> Mínimo</div>
                      <div className="text-sm font-black text-white">{product.min}</div>
                    </div>
                    <div>
                      <div className="text-xxs font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Calendar size={14} className="text-amber-500"/> Prazo</div>
                      <div className="text-sm font-black text-white">{product.maturity}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="bg-[#0f172a] border border-slate-800 rounded-[2rem] p-6 relative overflow-hidden shadow-lg">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-[60px] -z-10" />
            <h3 className="text-lg font-bold text-white mb-8 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <TrendingUp size={16} className="text-blue-500" />
              </div>
              Taxas de Referência
            </h3>
            <div className="space-y-4">
              {[
                { label: 'Selic', value: '10,75%', trend: 'stable' },
                { label: 'CDI', value: '10,65%', trend: 'stable' },
                { label: 'IPCA (12m)', value: '4,50%', trend: 'up' },
                { label: 'IGP-M (12m)', value: '-3,20%', trend: 'down' },
              ].map((rate, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
                  <span className="text-xxs font-bold text-slate-500 uppercase tracking-widest">{rate.label}</span>
                  <span className="text-sm font-black text-white">{rate.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600/10 to-transparent border border-blue-500/20 rounded-[2rem] p-6 shadow-lg">
            <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-3">
              <Calculator size={18} className="text-blue-400" />
              Simulador Rápido
            </h4>
            <div className="space-y-6">
              <div>
                <label className="text-xxs font-black text-slate-500 uppercase tracking-widest mb-3 block">Quanto quer investir?</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">R$</span>
                  <input 
                    type="text" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="1.000,00" 
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white text-sm outline-none focus:border-blue-500 transition-colors" 
                  />
                </div>
              </div>
              <button 
                onClick={handleSimulate}
                className="w-full py-4 bg-blue-600 text-white rounded-xl text-xxs font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]"
              >
                Simular Rendimento
              </button>

              {simulationResult && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="pt-6 border-t border-slate-800 space-y-4"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xxs font-bold text-slate-500 uppercase">Em 1 ano (115% CDI)</span>
                    <span className="text-sm font-black text-emerald-400">R$ {simulationResult.cdi.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xxs font-bold text-slate-500 uppercase">Na Poupança</span>
                    <span className="text-sm font-black text-slate-400">R$ {simulationResult.poupanca.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                    <p className="text-xxs text-emerald-400 font-bold text-center uppercase">
                      Você ganha R$ {(simulationResult.cdi - simulationResult.poupanca).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} a mais!
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
