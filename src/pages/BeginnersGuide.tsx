import { PageHeader } from '../components/ui/PageHeader';
import { HelpCircle, BookOpen, Target, Shield, Zap, ArrowRight, PlayCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function BeginnersGuide() {
  const steps = [
    {
      title: 'Defina seus Objetivos',
      desc: 'Antes de começar, entenda por que você quer investir. Aposentadoria? Comprar uma casa? Liberdade financeira?',
      icon: Target,
      color: 'blue'
    },
    {
      title: 'Reserva de Emergência',
      desc: 'Tenha guardado de 6 a 12 meses do seu custo de vida em um investimento de liquidez diária.',
      icon: Shield,
      color: 'emerald'
    },
    {
      title: 'Conheça seu Perfil',
      desc: 'Você é conservador, moderado ou arrojado? Descubra quanto risco você tolera.',
      icon: Zap,
      color: 'amber'
    },
    {
      title: 'Comece Pequeno',
      desc: 'Não espere ter muito dinheiro. Comece com o que tem hoje e crie o hábito de investir mensalmente.',
      icon: BookOpen,
      color: 'purple'
    }
  ];

  return (
    <div className="space-y-8 pb-12">
      <PageHeader 
        title="Guia do Iniciante"
        description="Tudo o que você precisa saber para começar sua jornada no mercado financeiro com segurança."
        icon={HelpCircle}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Primeiros Passos</h2>
          <div className="space-y-4">
            {steps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="card p-6 flex gap-6 hover:border-blue-500/30 transition-all group"
              >
                <div className={`w-14 h-14 rounded-2xl bg-${step.color}-500/10 flex items-center justify-center text-${step.color}-500 border border-${step.color}-500/20 shrink-0`}>
                  <step.icon size={28} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{step.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Conteúdo Recomendado</h2>
          <div className="card p-8 bg-gradient-to-br from-blue-600 to-blue-800 border-none relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] -z-10" />
            <PlayCircle size={64} className="text-white/20 absolute -bottom-4 -right-4 rotate-12 group-hover:scale-110 transition-transform" />
            
            <div className="relative z-10 space-y-6">
              <div className="inline-block px-3 py-1 bg-white/20 rounded-lg text-white text-xs font-bold uppercase tracking-widest">
                Masterclass Gratuita
              </div>
              <h3 className="text-3xl font-black text-white leading-tight">Como montar sua primeira carteira de ações</h3>
              <p className="text-blue-100 leading-relaxed font-medium">
                Um guia completo em vídeo ensinando a analisar empresas e diversificar seu patrimônio do zero.
              </p>
              <button className="flex items-center gap-3 px-8 py-4 bg-white text-blue-700 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-50 transition-all shadow-xl shadow-blue-900/20">
                Assistir Agora
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          <div className="card p-6 md:p-8 space-y-6">
            <h3 className="text-xl font-bold text-white uppercase tracking-tight">Checklist do Investidor</h3>
            <div className="space-y-4">
              {[
                'Abriu conta em uma corretora?',
                'Definiu o valor do aporte mensal?',
                'Estudou sobre os tipos de ativos?',
                'Montou sua reserva de emergência?',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="w-6 h-6 rounded-full border-2 border-slate-700 flex items-center justify-center">
                    <CheckCircle2 size={14} className="text-slate-700" />
                  </div>
                  <span className="text-slate-300 font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
