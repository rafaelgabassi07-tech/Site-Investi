import React from 'react';
import { motion } from 'motion/react';
import { Logo } from '../components/ui/Logo';
import { Shield, Zap, Globe, BarChart3, Users, Award, TrendingUp, ShieldCheck } from 'lucide-react';

export default function About() {
  const features = [
    {
      icon: Zap,
      title: "Alta Performance",
      description: "Motor de análise Nexus Engine v2.5 processando dados em tempo real com latência mínima."
    },
    {
      icon: ShieldCheck,
      title: "Segurança de Dados",
      description: "Arquitetura robusta com criptografia de ponta a ponta e integração segura com Supabase."
    },
    {
      icon: Globe,
      title: "Mercado Global",
      description: "Acompanhamento completo de Ações, FIIs e Stocks em uma única interface."
    },
    {
      icon: BarChart3,
      title: "Análise Profunda",
      description: "Indicadores fundamentalistas, dividendos e métricas de valuation para decisões inteligentes."
    }
  ];

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative pt-12 md:pt-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-blue-600/10 blur-[120px] -z-10 rounded-full" />
        
        <div className="flex flex-col items-center text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Logo size={120} showText className="flex-col gap-6" />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-3xl space-y-6"
          >
            <h1 className="text-display-lg text-white">
              A Nova Era da <span className="text-blue-500">Inteligência Financeira</span>
            </h1>
            <p className="text-slate-400 text-lg md:text-xl font-medium leading-relaxed">
              O Nexus Invest nasceu com a missão de democratizar o acesso a dados financeiros de alta qualidade, 
              unindo tecnologia de ponta e análise estratégica para investidores que buscam a excelência.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Ativos Monitorados", value: "10k+" },
          { label: "Atualização", value: "Real-time" },
          { label: "Precisão", value: "99.9%" },
          { label: "Nexus Engine", value: "v2.5" }
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className="p-6 bg-[#0f172a] border border-slate-800 rounded-2xl text-center"
          >
            <div className="text-display-md text-white mb-1">{stat.value}</div>
            <div className="text-label">{stat.label}</div>
          </motion.div>
        ))}
      </section>

      {/* Features Grid */}
      <section className="space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-display-md text-white">Por que escolher o Nexus?</h2>
          <div className="w-20 h-1 bg-blue-600 mx-auto rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-8 bg-[#0f172a] border border-slate-800 rounded-3xl group hover:border-blue-500/30 transition-all duration-500"
            >
              <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 mb-6 group-hover:scale-110 transition-transform">
                <feature.icon className="icon-lg" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{feature.title}</h3>
              <p className="text-slate-400 leading-relaxed text-sm font-medium">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Vision Section */}
      <section className="bg-blue-600 rounded-[2rem] p-8 md:p-16 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 blur-[100px] -mr-48 -mt-48 rounded-full" />
        <div className="relative z-10 max-w-2xl space-y-8">
          <h2 className="text-display-lg text-white">
            Nossa Visão de Futuro
          </h2>
          <p className="text-blue-100 text-lg md:text-xl font-medium leading-relaxed">
            Acreditamos que a informação é o ativo mais valioso de um investidor. 
            Continuaremos evoluindo o Nexus Engine para ser o cérebro por trás de cada decisão vitoriosa no mercado financeiro.
          </p>
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-blue-600 bg-slate-800 overflow-hidden">
                  <img src={`https://picsum.photos/seed/user${i}/100/100`} alt="User" referrerPolicy="no-referrer" />
                </div>
              ))}
            </div>
            <span className="text-sm font-bold text-blue-50">Junte-se a milhares de investidores</span>
          </div>
        </div>
      </section>

      <footer className="text-center pt-12">
        <p className="text-label">
          Nexus Invest • Powered by Nexus Engine v2.5
        </p>
      </footer>
    </div>
  );
}
