import { useMemo } from 'react';
import { usePortfolio } from '../hooks/usePortfolio';
import { PageHeader } from '../components/ui/PageHeader';
import { Calculator, ShieldCheck, AlertTriangle, Info, FileText, TrendingDown } from 'lucide-react';
import { motion } from 'motion/react';

export default function Taxes() {
  const { taxLedger, loading } = usePortfolio();

  const currentDate = new Date();
  const currentMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  const currentTaxData = taxLedger[currentMonthKey] || {
    month: currentMonthKey,
    salesAcoes: 0, profitAcoes: 0,
    salesFIIs: 0, profitFIIs: 0,
    lossCarryforwardAcoes: 0, lossCarryforwardFIIs: 0,
    taxDueAcoes: 0, taxDueFIIs: 0,
    isExemptAcoes: true
  };

  const limitAcoes = 20000;
  const progressPercentage = Math.min((currentTaxData.salesAcoes / limitAcoes) * 100, 100);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Calculando Impostos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Motor Fiscal & DARF"
        description={<>Controle de isenção e apuração exata de impostos para <span className="text-blue-500 font-bold">{monthNames[currentDate.getMonth()]} de {currentDate.getFullYear()}</span>.</>}
        icon={Calculator}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Isentômetro de Ações */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-8 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
            <ShieldCheck size={120} />
          </div>
          
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center text-blue-500">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Isentômetro (Ações)</h3>
              <p className="text-xs text-slate-400">Limite mensal de vendas: R$ 20.000,00</p>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex justify-between items-end mb-2">
              <div>
                <p className="text-sm text-slate-400 font-medium mb-1">Volume de Vendas no Mês</p>
                <p className="text-3xl font-bold text-white">
                  {currentTaxData.salesAcoes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
              <div className={`text-sm font-bold px-3 py-1 rounded-full ${currentTaxData.isExemptAcoes ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                {currentTaxData.isExemptAcoes ? 'ISENTO' : 'TRIBUTÁVEL'}
              </div>
            </div>

            <div className="h-4 bg-slate-800 rounded-full overflow-hidden mt-4 relative">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-full rounded-full ${currentTaxData.isExemptAcoes ? 'bg-emerald-500' : 'bg-red-500'}`}
              />
              {/* Marca de 20k */}
              <div className="absolute top-0 bottom-0 left-full w-0.5 bg-white/50 -ml-0.5" />
            </div>
            <div className="flex justify-between text-xs font-bold text-slate-500 mt-2">
              <span>R$ 0</span>
              <span>R$ 20.000</span>
            </div>
          </div>

          <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 flex gap-3">
            <Info className="text-blue-400 shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-slate-300 leading-relaxed">
              A isenção aplica-se apenas ao lucro de operações comuns com ações, desde que o <strong>volume total de vendas</strong> no mês não ultrapasse R$ 20.000,00. Day Trade, FIIs, BDRs e ETFs não possuem isenção.
            </p>
          </div>
        </div>

        {/* Resumo Tributável e DARF */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-8 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center text-indigo-500">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Apuração de DARF</h3>
              <p className="text-xs text-slate-400">Cálculo exato com compensação de prejuízos</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Ações */}
            <div className="p-4 bg-slate-800/20 border border-slate-800 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-bold text-white">Ações Comuns</p>
                  <p className="text-xs text-slate-400">Alíquota: 15%</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white">{currentTaxData.profitAcoes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                  <p className={`text-xs font-bold ${currentTaxData.profitAcoes >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {currentTaxData.profitAcoes >= 0 ? 'Lucro Bruto' : 'Prejuízo'}
                  </p>
                </div>
              </div>
              {currentTaxData.lossCarryforwardAcoes > 0 && (
                <div className="flex justify-between text-xs text-slate-400 border-t border-slate-700/50 pt-2 mt-2">
                  <span>Prejuízo Compensado:</span>
                  <span className="text-emerald-400">- {currentTaxData.lossCarryforwardAcoes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-white border-t border-slate-700/50 pt-2 mt-2">
                <span>Imposto Devido:</span>
                <span className={currentTaxData.taxDueAcoes > 0 ? 'text-red-400' : 'text-emerald-400'}>
                  {currentTaxData.taxDueAcoes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </div>

            {/* FIIs */}
            <div className="p-4 bg-slate-800/20 border border-slate-800 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-bold text-white">Fundos Imobiliários (FIIs)</p>
                  <p className="text-xs text-slate-400">Alíquota: 20%</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white">{currentTaxData.profitFIIs.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                  <p className={`text-xs font-bold ${currentTaxData.profitFIIs >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {currentTaxData.profitFIIs >= 0 ? 'Lucro Bruto' : 'Prejuízo'}
                  </p>
                </div>
              </div>
              {currentTaxData.lossCarryforwardFIIs > 0 && (
                <div className="flex justify-between text-xs text-slate-400 border-t border-slate-700/50 pt-2 mt-2">
                  <span>Prejuízo Compensado:</span>
                  <span className="text-emerald-400">- {currentTaxData.lossCarryforwardFIIs.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-white border-t border-slate-700/50 pt-2 mt-2">
                <span>Imposto Devido:</span>
                <span className={currentTaxData.taxDueFIIs > 0 ? 'text-red-400' : 'text-emerald-400'}>
                  {currentTaxData.taxDueFIIs.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </div>
            
            {/* Total DARF */}
            <div className="mt-6 p-4 bg-blue-600/10 border border-blue-500/20 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-400 font-bold mb-1">Total DARF a Pagar</p>
                <p className="text-xs text-slate-400">Vencimento: Último dia útil do mês seguinte</p>
              </div>
              <div className="text-2xl font-black text-white">
                {(currentTaxData.taxDueAcoes + currentTaxData.taxDueFIIs).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </div>
          </div>

          {!currentTaxData.isExemptAcoes && currentTaxData.taxDueAcoes > 0 && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
              <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={16} />
              <p className="text-xs text-red-300/80">Você ultrapassou o limite de R$ 20.000 em vendas de ações. O imposto acima já considera a alíquota de 15% sobre o lucro líquido.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
