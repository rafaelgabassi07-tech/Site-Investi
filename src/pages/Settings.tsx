import { Settings as SettingsIcon, User, Bell, Shield, ChevronRight, Lock, EyeOff, Moon } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'motion/react';
import { PageHeader } from '../components/ui/PageHeader';

export default function Settings() {
  const { user } = useAuth();
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário';
  return (
    <div className="space-y-16">
      <PageHeader 
        title="Configurações"
        description={<>Gerencie sua conta e preferências do <span className="text-blue-500 font-bold">Nexus Invest</span>.</>}
        icon={SettingsIcon}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        <motion.aside 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible pb-4 lg:pb-0 gap-3 no-scrollbar"
        >
          {[
            { label: "Perfil", icon: User, active: true },
            { label: "Notificações", icon: Bell, active: false },
            { label: "Segurança", icon: Shield, active: false },
          ].map((item, idx) => (
            <button 
              key={idx}
              className={`flex-shrink-0 lg:w-full flex items-center justify-between px-6 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xxs transition-all duration-500 group ${
                item.active 
                  ? 'bg-blue-600 text-white shadow-[0_10px_30px_rgba(37,99,235,0.3)]' 
                  : 'text-slate-500 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-4">
                <item.icon size={18} className={item.active ? 'text-white' : 'group-hover:text-blue-500 transition-colors'} />
                {item.label}
              </div>
              <ChevronRight size={14} className={`hidden lg:block ${item.active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 transition-all'}`} />
            </button>
          ))}
        </motion.aside>

        <div className="lg:col-span-3 space-y-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="card p-6 md:p-12 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] -z-10" />
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-500/20">
                <User size={24} />
              </div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">Informações Pessoais</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-3">
                <label className="block text-xxs font-black text-slate-500 uppercase tracking-[0.2em]">Nome de Exibição</label>
                <div className="relative group">
                  <input
                    type="text"
                    defaultValue={displayName}
                    className="w-full px-6 py-5 bg-white/[0.03] border border-white/5 rounded-2xl text-slate-400 font-black uppercase tracking-widest cursor-not-allowed outline-none"
                    disabled
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-700">
                    <Lock size={16} />
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <label className="block text-xxs font-black text-slate-500 uppercase tracking-[0.2em]">E-mail de Acesso</label>
                <div className="relative group">
                  <input
                    type="email"
                    defaultValue={user?.email || ''}
                    className="w-full px-6 py-5 bg-white/[0.03] border border-white/5 rounded-2xl text-slate-400 font-black uppercase tracking-widest cursor-not-allowed outline-none"
                    disabled
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-700">
                    <Lock size={16} />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="card p-6 md:p-12 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] -z-10" />
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-500/20">
                <SettingsIcon size={24} />
              </div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">Preferências Invest</h3>
            </div>

            <div className="space-y-6">
              {[
                { 
                  label: "Ocultar Valores Sensitive", 
                  desc: "Modo de privacidade para apresentações e screenshots.", 
                  icon: EyeOff,
                  enabled: false 
                },
                { 
                  label: "Invest Dark Mode", 
                  desc: "Otimizado para telas OLED e baixa luminosidade.", 
                  icon: Moon,
                  enabled: true 
                }
              ].map((pref, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 sm:p-8 bg-white/[0.02] rounded-3xl border border-white/5 group hover:border-white/10 transition-all duration-500 gap-6">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-500 group-hover:text-blue-500 transition-colors flex-shrink-0">
                      <pref.icon size={20} />
                    </div>
                    <div>
                      <p className="text-sm md:text-base font-black text-white uppercase tracking-tight">{pref.label}</p>
                      <p className="text-[9px] md:text-tiny text-slate-500 font-bold uppercase tracking-widest mt-2">{pref.desc}</p>
                    </div>
                  </div>
                  <div className={`w-14 h-7 md:w-16 md:h-8 rounded-full relative cursor-pointer border transition-all duration-500 flex-shrink-0 ${
                    pref.enabled ? 'bg-blue-600 border-blue-500/20 shadow-[0_0_20px_rgba(37,99,235,0.3)]' : 'bg-slate-800 border-white/10'
                  }`}>
                    <motion.div 
                      animate={{ x: pref.enabled ? 28 : 4 }}
                      className="absolute top-0.5 w-5 h-5 md:top-1 md:w-6 md:h-6 bg-white rounded-full shadow-xl" 
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
