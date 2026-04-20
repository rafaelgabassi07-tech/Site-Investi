import { useState, useMemo } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { ShieldCheck, TrendingUp, Calendar, DollarSign, Calculator, Info, ArrowRight, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function FixedIncome() {
  const [amount, setAmount] = useState('10000');
  const [monthly, setMonthly] = useState('1000');
  const [period, setPeriod] = useState('12'); // months
  const [simulationResult, setSimulationResult] = useState<any>(null);

  const products = [
    { name: 'Tesouro Selic 2029', type: 'Tesouro', rate: 'Selic + 0,15%', min: 'R$ 145,00', maturity: '2029', risk: 'Muito Baixo', liquidity: 'D+1' },
    { name: 'CDB Banco Master', type: 'CDB', rate: '125% CDI', min: 'R$ 1.000,00', maturity: '2 Anos', risk: 'Baixo', liquidity: 'Vencimento' },
    { name: 'LCA Banco Inter', type: 'LCA', rate: '92% CDI', min: 'R$ 500,00', maturity: '1 Ano', risk: 'Baixo', taxFree: true, liquidity: '90 dias' },
    { name: 'Tesouro IPCA+ 2029', type: 'Tesouro', rate: 'IPCA + 6,25%', min: 'R$ 40,00', maturity: '2029', risk: 'Baixo', liquidity: 'D+1' },
    { name: 'Debênture Incentivada Vale', type: 'Debênture', rate: 'IPCA + 7,5%', min: 'R$ 1.000,00', maturity: '2032', risk: 'Médio', taxFree: true, liquidity: 'Mercado Secundário' },
  ];

  const handleSimulate = () => {
    const p = parseFloat(amount.replace(/[^\d.]/g, '')) || 0;
    const pmt = parseFloat(monthly.replace(/[^\d.]/g, '')) || 0;
    const n = parseInt(period) || 12;
    
    const cdiAnual = 0.1065; // 10.65%
    const selicAnual = 0.1075; // 10.75%
    const ipcaAnual = 0.0450; // 4.5%
    const poupancaAnual = 0.0617; // 6.17%

    const calculateFV = (initial: number, monthly: number, rateAnual: number, months: number) => {
      const r = Math.pow(1 + rateAnual, 1/12) - 1;
      const fvInitial = initial * Math.pow(1 + r, months);
      const fvMonthly = r === 0 ? monthly * months : monthly * ((Math.pow(1 + r, months) - 1) / r);
      return fvInitial + fvMonthly;
    };

    const res = {
      poupanca: calculateFV(p, pmt, poupancaAnual, n),
      cdi100: calculateFV(p, pmt, cdiAnual, n),
      cdi120: calculateFV(p, pmt, cdiAnual * 1.2, n),
      tesouroIPCA: calculateFV(p, pmt, ipcaAnual + 0.06, n),
      totalInvested: p + (pmt * n)
    };
    
    setSimulationResult(res);
  };

  return (
    <div className="space-y-4 pb-12">
      <PageHeader 
        title="Renda Fixa"
        description="Encontre as melhores taxas para investir com segurança e previsibilidade."
        icon={ShieldCheck}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {/* Simulator Section */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl md:rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] -z-10" />
            
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-inner">
                <Calculator className="icon-lg text-blue-500" />
              </div>
              <div>
                <h3 className="text-display-sm text-white">Simulador de Investimentos</h3>
                <p className="text-label mt-0.5">Compare Renda Fixa vs. Poupança</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="space-y-2">
                <label className="text-label ml-1">Valor Inicial</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">R$</span>
                  <input 
                    type="number" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-900/50 border border-white/5 rounded-2xl pl-10 pr-4 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-label ml-1">Aporte Mensal</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">R$</span>
                  <input 
                    type="number" 
                    value={monthly}
                    onChange={(e) => setMonthly(e.target.value)}
                    className="w-full bg-slate-900/50 border border-white/5 rounded-2xl pl-10 pr-4 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-label ml-1">Prazo (Meses)</label>
                <input 
                  type="number" 
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold" 
                />
              </div>
            </div>

            <button 
              onClick={handleSimulate}
              className="btn-primary w-full py-5 text-label"
            >
              Calcular Rendimento
              <ArrowRight className="icon-sm" />
            </button>

            <AnimatePresence>
              {simulationResult && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-10 pt-10 border-t border-slate-800/50 space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl">
                      <p className="text-label text-emerald-500 mb-2">Resultado em Renda Fixa (120% CDI)</p>
                      <p className="text-display-md text-white tracking-tighter">
                        R$ {simulationResult.cdi120.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <div className="mt-4 flex items-center gap-2 text-emerald-400 text-tiny font-bold uppercase tracking-widest">
                        <TrendingUp className="icon-xs" />
                        Lucro de R$ {(simulationResult.cdi120 - simulationResult.totalInvested).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">
                      <p className="text-label text-slate-500 mb-2">Resultado na Poupança</p>
                      <p className="text-display-md text-slate-300 tracking-tighter">
                        R$ {simulationResult.poupanca.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <div className="mt-4 text-slate-500 text-tiny font-bold uppercase tracking-widest">
                        Diferença de R$ {(simulationResult.cdi120 - simulationResult.poupanca).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex items-center gap-4">
                    <Info className="icon-sm text-blue-500 shrink-0" />
                    <p className="text-tiny font-bold text-slate-400 leading-relaxed uppercase tracking-wider">
                      Investindo em Renda Fixa, você teria um patrimônio <span className="text-emerald-400">{( (simulationResult.cdi120 / simulationResult.poupanca - 1) * 100 ).toFixed(1)}% maior</span> do que na poupança no final do período.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Product List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-label text-slate-500">Oportunidades de Mercado</h3>
              <span className="text-tiny font-black text-blue-500 bg-blue-500/5 px-2 py-0.5 rounded border border-blue-500/10 uppercase tracking-widest">
                {products.length} ATIVOS
              </span>
            </div>
            
            {products.map((product, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-[#0f172a] border border-white/5 rounded-3xl p-6 hover:border-blue-500/30 transition-all group cursor-pointer shadow-lg"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center text-blue-500 group-hover:border-blue-500/50 transition-colors">
                      <Wallet className="icon-md" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-tiny font-black uppercase tracking-tighter rounded border border-blue-500/20">
                          {product.type}
                        </span>
                        {product.taxFree && (
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-tiny font-black uppercase tracking-tighter rounded border border-emerald-500/20">
                            Isento
                          </span>
                        )}
                      </div>
                      <h3 className="text-display-tiny text-white group-hover:text-blue-400 transition-colors uppercase">{product.name}</h3>
                      <p className="text-tiny font-bold text-slate-500 uppercase tracking-widest mt-0.5 italic">Liquidez: {product.liquidity}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 md:gap-10 bg-white/5 p-4 rounded-2xl border border-white/5">
                    <div>
                      <div className="text-label text-slate-500 mb-1 flex items-center gap-1.5">Retorno</div>
                      <div className="text-sm font-black text-emerald-400">{product.rate}</div>
                    </div>
                    <div>
                      <div className="text-label text-slate-500 mb-1 flex items-center gap-1.5">Mínimo</div>
                      <div className="text-sm font-black text-white">{product.min}</div>
                    </div>
                    <div>
                      <div className="text-label text-slate-500 mb-1 flex items-center gap-1.5">Venc.</div>
                      <div className="text-sm font-black text-white">{product.maturity}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-[#0f172a] border border-white/5 rounded-xl md:rounded-2xl p-6 shadow-xl">
            <h3 className="text-display-tiny text-white mb-6 flex items-center gap-3 uppercase">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <TrendingUp className="icon-xs text-blue-500" />
              </div>
              Taxas de Referência
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Selic', value: '10,75%', trend: 'Estável' },
                { label: 'CDI', value: '10,65%', trend: 'Estável' },
                { label: 'IPCA (12m)', value: '4,50%', trend: 'Alta' },
                { label: 'IGP-M (12m)', value: '-3,20%', trend: 'Baixa' },
              ].map((rate, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-white/10 transition-colors">
                  <div>
                    <span className="text-label text-slate-500 block">{rate.label}</span>
                    <span className="text-tiny font-bold text-slate-600 uppercase tracking-widest italic">{rate.trend}</span>
                  </div>
                  <span className="text-base font-black text-white">{rate.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl md:rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck className="icon-sm text-emerald-500" />
              <h4 className="text-label text-emerald-400">Garantia FGC</h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-bold italic normal-case">
              CDBs, LCIs e LCAs contam com a proteção do Fundo Garantidor de Créditos para valores de até R$ 250 mil por CPF e por instituição financeira.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
