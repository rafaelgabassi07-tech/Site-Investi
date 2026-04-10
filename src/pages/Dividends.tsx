import { PageHeader } from '../components/ui/PageHeader';
import { Calendar, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion } from 'motion/react';
import { AssetIcon } from '../components/ui/AssetIcon';

export default function Dividends() {
  const upcomingDividends = [
    { ticker: 'PETR4', name: 'Petrobras', type: 'Dividendo', value: 'R$ 1,04', date: '15/05/2026', yield: '2.5%' },
    { ticker: 'VALE3', name: 'Vale', type: 'JCP', value: 'R$ 2,73', date: '22/05/2026', yield: '4.1%' },
    { ticker: 'ITUB4', name: 'Itaú Unibanco', type: 'Dividendo Mensal', value: 'R$ 0,017', date: '01/06/2026', yield: '0.05%' },
    { ticker: 'BBAS3', name: 'Banco do Brasil', type: 'Dividendo', value: 'R$ 0,45', date: '12/06/2026', yield: '1.6%' },
    { ticker: 'MXRF11', name: 'Maxi Renda', type: 'Rendimento', value: 'R$ 0,10', date: '14/05/2026', yield: '0.95%' },
  ];

  return (
    <div className="space-y-8 pb-24">
      <PageHeader 
        title="Agenda de Dividendos"
        description="Acompanhe os próximos pagamentos de proventos."
        icon={Calendar}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {['Todos', 'Ações', 'FIIs', 'BDRs'].map((type, i) => (
              <button 
                key={type} 
                className={`px-6 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-colors ${
                  i === 0 
                    ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden divide-y divide-white/5">
            {upcomingDividends.map((item, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-4 sm:p-6 flex items-center justify-between group hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-slate-900 rounded-2xl flex flex-col items-center justify-center border border-white/5 group-hover:border-emerald-500/30 transition-colors">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">{item.date.split('/')[1] === '05' ? 'MAIO' : 'JUN'}</span>
                    <span className="text-xl font-black text-white">{item.date.split('/')[0]}</span>
                  </div>
                  <div>
                    <div className="font-bold text-white text-lg tracking-tight group-hover:text-emerald-400 transition-colors">
                      {item.ticker} <span className="text-slate-500 font-medium text-sm hidden sm:inline-block">- {item.name}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-wider rounded">
                        {item.type}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">Data Com: {item.date}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-white text-lg">{item.value}</div>
                  <div className="text-[10px] text-emerald-500 font-black uppercase tracking-widest mt-1">Yield {item.yield}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/5 blur-[60px] -z-10" />
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <DollarSign size={20} className="text-emerald-500" />
              </div>
              <h3 className="text-lg font-bold text-white">Resumo Mensal</h3>
            </div>
            
            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Total Estimado (Maio)</p>
                <h4 className="text-3xl font-black text-white tracking-tighter">R$ 1.240,50</h4>
              </div>
              
              <div className="pt-6 border-t border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">Ações</span>
                  <span className="text-xs text-white font-bold">R$ 840,20</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">FIIs</span>
                  <span className="text-xs text-white font-bold">R$ 400,30</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-600/10 to-transparent border border-emerald-500/20 rounded-[2rem] p-6">
            <div className="flex items-center gap-3 mb-4">
              <ArrowUpRight size={18} className="text-emerald-500" />
              <h4 className="text-sm font-bold text-white uppercase tracking-widest">Dica Invest</h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Reinvestir seus dividendos pode acelerar drasticamente o efeito dos juros compostos em sua carteira a longo prazo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
