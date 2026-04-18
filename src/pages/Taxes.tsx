import { useMemo } from 'react';
import { usePortfolio } from '../hooks/usePortfolio';
import { PageHeader } from '../components/ui/PageHeader';
import { Calculator, ShieldCheck, AlertTriangle, Info, FileText, TrendingDown, Loader2 } from 'lucide-react';
import { NexusAgentUI } from '../components/NexusAgentUI';
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
        <Loader2 className="animate-spin text-blue-500 icon-xl" />
        <p className="text-label text-slate-500 uppercase tracking-widest animate-pulse">Calculando Impostos...</p>
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

      <NexusAgentUI />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Isentômetro de Ações */}
        <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
            <ShieldCheck className="w-32 h-32" />
          </div>
          
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-blue-600/10 rounded-[1.25rem] flex items-center justify-center text-blue-500 border border-blue-500/20">
              <ShieldCheck className="icon-sm" />
            </div>
            <div>
              <h3 className="text-display-tiny text-white uppercase italic">Isentômetro Nexus</h3>
              <p className="text-tiny font-bold text-slate-500 uppercase tracking-widest">Limite mensal de vendas: R$ 20.000,00</p>
            </div>
          </div>

          <div className="mb-10">
            <div className="flex justify-between items-end mb-4 pr-1">
              <div>
                <p className="text-tiny font-black text-slate-600 uppercase tracking-[0.2em] mb-2 italic">Volume de Vendas no Mês</p>
                <p className="text-display-sm text-white uppercase italic">
                  {currentTaxData.salesAcoes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
              <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-lg ${currentTaxData.isExemptAcoes ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/5' : 'bg-red-500/10 text-red-400 border-red-500/20 shadow-red-500/5'}`}>
                {currentTaxData.isExemptAcoes ? 'ISENTO' : 'TRIBUTÁVEL'}
              </div>
            </div>

            <div className="h-4 bg-white/5 rounded-full overflow-hidden mt-6 relative border border-white/5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1.5, ease: "circOut" }}
                className={`h-full rounded-full shadow-lg ${currentTaxData.isExemptAcoes ? 'bg-emerald-500' : 'bg-red-500'}`}
              />
            </div>
            <div className="flex justify-between text-[10px] font-black text-slate-700 mt-3 uppercase tracking-[0.2em] px-1">
              <span>Mínimo R$ 0</span>
              <span>Teto Isenção R$ 20.000</span>
            </div>
          </div>

          <div className="bg-white/5 border border-white/5 rounded-2xl p-5 flex gap-4 group/info hover:bg-white/10 transition-colors">
            <Info className="text-blue-400 shrink-0 mt-0.5 icon-sm" />
            <p className="text-tiny font-bold text-slate-400 leading-relaxed uppercase tracking-widest">
              A isenção aplica-se apenas ao lucro de operações comuns com ações, desde que o <strong className="text-white">volume total de vendas</strong> no mês não ultrapasse R$ 20.000,00. Day Trade, FIIs, BDRs e ETFs não possuem isenção.
            </p>
          </div>
        </div>

        {/* Resumo Tributável e DARF */}
        <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 shadow-xl group">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-indigo-600/10 rounded-[1.25rem] flex items-center justify-center text-indigo-500 border border-indigo-500/20">
              <FileText className="icon-sm" />
            </div>
            <div>
              <h3 className="text-display-tiny text-white uppercase italic">Apuração de DARF</h3>
              <p className="text-tiny font-bold text-slate-500 uppercase tracking-widest">Cálculo inteligente com compensação</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Ações */}
            <div className="p-6 bg-white/5 border border-white/5 rounded-3xl group/row hover:border-white/20 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-label text-white uppercase italic">Ações Comuns</p>
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Alíquota: 15%</p>
                </div>
                <div className="text-right">
                  <p className="text-display-tiny text-white uppercase italic">{currentTaxData.profitAcoes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                  <p className={`text-tiny font-black uppercase tracking-widest ${currentTaxData.profitAcoes >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {currentTaxData.profitAcoes >= 0 ? 'Lucro Bruto' : 'Prejuízo'}
                  </p>
                </div>
              </div>
              {currentTaxData.lossCarryforwardAcoes > 0 && (
                <div className="flex justify-between text-tiny font-bold text-slate-500 border-t border-white/5 pt-4 mt-4 uppercase tracking-widest">
                  <span>Prejuízo Compensado</span>
                  <span className="text-emerald-400">- {currentTaxData.lossCarryforwardAcoes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>
              )}
              <div className="flex justify-between text-tiny font-black text-white border-t border-white/5 pt-4 mt-4 uppercase tracking-[0.2em]">
                <span>Imposto Devido</span>
                <span className={currentTaxData.taxDueAcoes > 0 ? 'text-red-400' : 'text-emerald-400'}>
                  {currentTaxData.taxDueAcoes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </div>

            {/* FIIs */}
            <div className="p-6 bg-white/5 border border-white/5 rounded-3xl group/row hover:border-white/20 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-label text-white uppercase italic">Fundos Imobiliários</p>
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Alíquota: 20%</p>
                </div>
                <div className="text-right">
                  <p className="text-display-tiny text-white uppercase italic">{currentTaxData.profitFIIs.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                  <p className={`text-tiny font-black uppercase tracking-widest ${currentTaxData.profitFIIs >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {currentTaxData.profitFIIs >= 0 ? 'Lucro Bruto' : 'Prejuízo'}
                  </p>
                </div>
              </div>
              {currentTaxData.lossCarryforwardFIIs > 0 && (
                <div className="flex justify-between text-tiny font-bold text-slate-500 border-t border-white/5 pt-4 mt-4 uppercase tracking-widest">
                  <span>Prejuízo Compensado</span>
                  <span className="text-emerald-400">- {currentTaxData.lossCarryforwardFIIs.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>
              )}
              <div className="flex justify-between text-tiny font-black text-white border-t border-white/5 pt-4 mt-4 uppercase tracking-[0.2em]">
                <span>Imposto Devido</span>
                <span className={currentTaxData.taxDueFIIs > 0 ? 'text-red-400' : 'text-emerald-400'}>
                  {currentTaxData.taxDueFIIs.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </div>
            
            {/* Total DARF */}
            <div className="mt-8 p-6 bg-blue-600/5 border border-blue-500/20 rounded-[1.5rem] flex items-center justify-between shadow-lg shadow-blue-500/5 group/darf hover:bg-blue-600/10 transition-colors">
              <div>
                <p className="text-label text-blue-400 uppercase italic mb-1">Total DARF a Pagar</p>
                <p className="text-tiny font-bold text-slate-500 uppercase tracking-widest">Vencimento: Último dia útil</p>
              </div>
              <div className="text-display-sm text-white uppercase italic">
                {(currentTaxData.taxDueAcoes + currentTaxData.taxDueFIIs).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </div>
          </div>

          {!currentTaxData.isExemptAcoes && currentTaxData.taxDueAcoes > 0 && (
            <div className="mt-6 p-4 bg-red-500/5 border border-red-500/20 rounded-2xl flex items-start gap-4">
              <AlertTriangle className="text-red-400 shrink-0 mt-0.5 icon-sm" />
              <p className="text-tiny font-bold text-red-400/80 uppercase tracking-widest leading-relaxed">Você ultrapassou o limite de R$ 20.000 em vendas de ações. O imposto acima já considera a alíquota de 15% sobre o lucro líquido.</p>
            </div>
          )}
        </div>
      </div>

      {/* Histórico Fiscal */}
      <div className="space-y-6">
        <div className="flex items-center gap-6 px-1 md:px-4">
          <div className="w-2 h-10 bg-indigo-600 rounded-full" />
          <h2 className="text-display-sm text-white uppercase italic tracking-tighter">Histórico Fiscal</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(taxLedger)
            .sort((a, b) => b[0].localeCompare(a[0]))
            .filter(([key]) => key !== currentMonthKey)
            .map(([month, data]) => {
              const [year, m] = month.split('-');
              const monthName = monthNames[parseInt(m) - 1];
              const totalDue = data.taxDueAcoes + data.taxDueFIIs;

              return (
                <div key={month} className="bg-white/5 border border-white/5 rounded-[2rem] p-6 hover:bg-white/10 transition-all border-b-4 border-b-indigo-500/30">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-label text-white uppercase italic">{monthName}</h4>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{year}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${data.isExemptAcoes ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10' : 'bg-red-500/10 text-red-400 border-red-500/10'}`}>
                      {data.isExemptAcoes ? 'Isento' : 'Tributável'}
                    </div>
                  </div>

                  <div className="space-y-3 pb-4 border-b border-white/5 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Vendas Ações</span>
                      <span className="text-tiny font-black text-white">{data.salesAcoes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Lucro Total</span>
                      <span className={`text-tiny font-black ${(data.profitAcoes + data.profitFIIs) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {(data.profitAcoes + data.profitFIIs).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-tiny font-black text-white uppercase italic">DARF Devida</span>
                    <span className={`text-label font-black ${totalDue > 0 ? 'text-blue-400' : 'text-slate-600'}`}>
                      {totalDue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                </div>
              );
            })}
          
          {Object.keys(taxLedger).filter(k => k !== currentMonthKey).length === 0 && (
            <div className="col-span-full py-12 text-center bg-white/5 border border-dashed border-white/10 rounded-[2rem]">
              <TrendingDown className="mx-auto mb-4 text-slate-700 w-12 h-12" />
              <p className="text-label text-slate-500 uppercase italic">Nenhum histórico fiscal registrado até o momento.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
