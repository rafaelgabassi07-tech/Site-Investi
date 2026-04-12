import { PageHeader } from '../components/ui/PageHeader';
import { Calculator, DollarSign, TrendingUp, ArrowRight, Target, Percent, Shield } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

type CalcType = 'COMPOUND' | 'BAZIN' | 'GRAHAM' | 'FIRE';

export default function Calculators() {
  const [activeCalc, setActiveCalc] = useState<CalcType>('COMPOUND');

  // Compound Interest State
  const [initialAmount, setInitialAmount] = useState('10000');
  const [monthlyContribution, setMonthlyContribution] = useState('1000');
  const [interestRate, setInterestRate] = useState('10');
  const [years, setYears] = useState('10');

  // Bazin State
  const [avgDividend, setAvgDividend] = useState('2.50');
  const [desiredYield, setDesiredYield] = useState('6');

  // Graham State
  const [vpa, setVpa] = useState('20.50');
  const [lpa, setLpa] = useState('3.20');

  // FIRE State
  const [monthlyExpenses, setMonthlyExpenses] = useState('5000');
  const [withdrawalRate, setWithdrawalRate] = useState('4');

  const calculateCompoundInterest = () => {
    const p = parseFloat(initialAmount) || 0;
    const pmt = parseFloat(monthlyContribution) || 0;
    const r = (parseFloat(interestRate) || 0) / 100 / 12;
    const n = (parseFloat(years) || 0) * 12;

    const futureValueP = p * Math.pow(1 + r, n);
    const futureValuePMT = r === 0 ? pmt * n : pmt * ((Math.pow(1 + r, n) - 1) / r);
    const total = futureValueP + futureValuePMT;
    const totalInvested = p + (pmt * n);
    const totalInterest = total - totalInvested;

    return { total, totalInvested, totalInterest };
  };

  const calculateBazin = () => {
    const div = parseFloat(avgDividend) || 0;
    const yield_target = (parseFloat(desiredYield) || 6) / 100;
    const ceilingPrice = yield_target === 0 ? 0 : div / yield_target;
    return { ceilingPrice };
  };

  const calculateGraham = () => {
    const v = parseFloat(vpa) || 0;
    const l = parseFloat(lpa) || 0;
    // Graham Formula: Preço Justo = sqrt(22.5 * LPA * VPA)
    const fairPrice = Math.sqrt(22.5 * l * v);
    return { fairPrice };
  };

  const calculateFIRE = () => {
    const expenses = parseFloat(monthlyExpenses) || 0;
    const rate = (parseFloat(withdrawalRate) || 4) / 100;
    const targetNetWorth = rate === 0 ? 0 : (expenses * 12) / rate;
    return { targetNetWorth };
  };

  const compoundResults = calculateCompoundInterest();
  const bazinResults = calculateBazin();
  const grahamResults = calculateGraham();
  const fireResults = calculateFIRE();

  return (
    <div className="space-y-3 pb-12">
      <PageHeader 
        title="Calculadoras"
        description="Simule seus investimentos e planeje seu futuro."
        icon={Calculator}
      />

      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
        {[
          { id: 'COMPOUND', label: 'Juros Compostos', icon: TrendingUp },
          { id: 'BAZIN', label: 'Preço Teto (Bazin)', icon: Percent },
          { id: 'GRAHAM', label: 'Preço Justo (Graham)', icon: Shield },
          { id: 'FIRE', label: 'Independência Financeira', icon: Target },
        ].map((calc) => (
          <button 
            key={calc.id} 
            onClick={() => setActiveCalc(calc.id as CalcType)}
            className={`px-6 py-3 rounded-2xl border text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all flex items-center gap-2 ${
              activeCalc === calc.id 
                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' 
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
            }`}
          >
            <calc.icon size={16} />
            {calc.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-1 space-y-3 bg-white/5 border border-white/10 p-6 rounded-3xl">
          <AnimatePresence mode="wait">
            {activeCalc === 'COMPOUND' && (
              <motion.div 
                key="compound"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-bold text-white mb-4">Parâmetros</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xxs font-black text-slate-500 uppercase tracking-widest mb-2">Valor Inicial (R$)</label>
                    <input type="number" value={initialAmount} onChange={(e) => setInitialAmount(e.target.value)} className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xxs font-black text-slate-500 uppercase tracking-widest mb-2">Aporte Mensal (R$)</label>
                    <input type="number" value={monthlyContribution} onChange={(e) => setMonthlyContribution(e.target.value)} className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xxs font-black text-slate-500 uppercase tracking-widest mb-2">Taxa Anual (%)</label>
                    <input type="number" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xxs font-black text-slate-500 uppercase tracking-widest mb-2">Período (Anos)</label>
                    <input type="number" value={years} onChange={(e) => setYears(e.target.value)} className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
              </motion.div>
            )}

            {activeCalc === 'BAZIN' && (
              <motion.div 
                key="bazin"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-bold text-white mb-4">Método de Bazin</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xxs font-black text-slate-500 uppercase tracking-widest mb-2">Dividendo Médio (5 anos)</label>
                    <input type="number" value={avgDividend} onChange={(e) => setAvgDividend(e.target.value)} className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xxs font-black text-slate-500 uppercase tracking-widest mb-2">Yield Desejado (%)</label>
                    <input type="number" value={desiredYield} onChange={(e) => setDesiredYield(e.target.value)} className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
              </motion.div>
            )}

            {activeCalc === 'GRAHAM' && (
              <motion.div 
                key="graham"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-bold text-white mb-4">Fórmula de Graham</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xxs font-black text-slate-500 uppercase tracking-widest mb-2">VPA (Valor Patrimonial por Ação)</label>
                    <input type="number" value={vpa} onChange={(e) => setVpa(e.target.value)} className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xxs font-black text-slate-500 uppercase tracking-widest mb-2">LPA (Lucro por Ação)</label>
                    <input type="number" value={lpa} onChange={(e) => setLpa(e.target.value)} className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
              </motion.div>
            )}

            {activeCalc === 'FIRE' && (
              <motion.div 
                key="fire"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-bold text-white mb-4">FIRE (Independência)</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xxs font-black text-slate-500 uppercase tracking-widest mb-2">Gasto Mensal Desejado (R$)</label>
                    <input type="number" value={monthlyExpenses} onChange={(e) => setMonthlyExpenses(e.target.value)} className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xxs font-black text-slate-500 uppercase tracking-widest mb-2">Taxa de Retirada Anual (%)</label>
                    <input type="number" value={withdrawalRate} onChange={(e) => setWithdrawalRate(e.target.value)} className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="lg:col-span-2 space-y-3">
          <AnimatePresence mode="wait">
            {activeCalc === 'COMPOUND' && (
              <motion.div 
                key="res-compound"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-blue-600/20 to-blue-900/20 border border-blue-500/30 p-6 rounded-3xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] -z-10" />
                <h3 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-2">Valor Total Final</h3>
                <div className="text-4xl md:text-6xl font-black text-white tracking-tighter">
                  R$ {compoundResults.total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                  <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign size={16} className="text-slate-400" />
                      <span className="text-xxs font-black text-slate-500 uppercase tracking-widest">Total Investido</span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                      R$ {compoundResults.totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="bg-emerald-500/10 p-6 rounded-2xl border border-emerald-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp size={16} className="text-emerald-500" />
                      <span className="text-xxs font-black text-emerald-500 uppercase tracking-widest">Total em Juros</span>
                    </div>
                    <div className="text-2xl font-bold text-emerald-400">
                      R$ {compoundResults.totalInterest.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeCalc === 'BAZIN' && (
              <motion.div 
                key="res-bazin"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-emerald-600/20 to-emerald-900/20 border border-emerald-500/30 p-6 rounded-3xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] -z-10" />
                <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-widest mb-2">Preço Teto Estimado</h3>
                <div className="text-4xl md:text-6xl font-black text-white tracking-tighter">
                  R$ {bazinResults.ceilingPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="mt-6 text-slate-400 text-sm leading-relaxed max-w-lg">
                  O Método de Bazin sugere que este é o valor máximo a ser pago por uma ação para garantir o yield desejado, baseado na média de dividendos.
                </p>
              </motion.div>
            )}

            {activeCalc === 'GRAHAM' && (
              <motion.div 
                key="res-graham"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-amber-600/20 to-amber-900/20 border border-amber-500/30 p-6 rounded-3xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[80px] -z-10" />
                <h3 className="text-sm font-bold text-amber-400 uppercase tracking-widest mb-2">Preço Justo (Graham)</h3>
                <div className="text-4xl md:text-6xl font-black text-white tracking-tighter">
                  R$ {grahamResults.fairPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="mt-6 text-slate-400 text-sm leading-relaxed max-w-lg">
                  A Fórmula de Graham calcula o preço intrínseco de uma ação considerando que o produto do P/L pelo P/VP não deve ultrapassar 22,5.
                </p>
              </motion.div>
            )}

            {activeCalc === 'FIRE' && (
              <motion.div 
                key="res-fire"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-purple-600/20 to-purple-900/20 border border-purple-500/30 p-6 rounded-3xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[80px] -z-10" />
                <h3 className="text-sm font-bold text-purple-400 uppercase tracking-widest mb-2">Patrimônio Necessário</h3>
                <div className="text-4xl md:text-6xl font-black text-white tracking-tighter">
                  R$ {fireResults.targetNetWorth.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
                <p className="mt-6 text-slate-400 text-sm leading-relaxed max-w-lg">
                  Este é o montante total necessário investido para que você possa retirar mensalmente o valor desejado indefinidamente, seguindo a regra dos 4% (ou sua taxa personalizada).
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
