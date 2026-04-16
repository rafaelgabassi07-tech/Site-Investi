import { Settings as SettingsIcon, User, Bell, Shield, ChevronRight, Lock, EyeOff, Moon, RefreshCw, Trash2, Download, Code } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'motion/react';
import { PageHeader } from '../components/ui/PageHeader';

export default function Settings() {
  const { user } = useAuth();
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário';

  const handleClearCache = async () => {
    if (window.confirm('Deseja limpar o cache e recarregar o aplicativo? Isso pode resolver problemas de carregamento.')) {
      try {
        // Clear all caches
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        
        // Unregister all service workers
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
        
        // Reload page
        window.location.reload();
      } catch (error) {
        console.error('Erro ao limpar cache:', error);
        alert('Ocorreu um erro ao tentar limpar o cache.');
      }
    }
  };

  const handleDownloadEngine = () => {
    window.open('/api/download-engine', '_blank');
  };

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Configurações"
        description={<>Gerencie sua conta e preferências do <span className="text-blue-500 font-bold">Nexus Invest</span>.</>}
        icon={SettingsIcon}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
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
              className={`flex-shrink-0 lg:w-full flex items-center justify-between px-6 py-5 rounded-[1.5rem] text-tiny font-black uppercase tracking-[0.2em] transition-all duration-500 group ${
                item.active 
                  ? 'bg-blue-600 text-white shadow-[0_10px_30px_rgba(37,99,235,0.3)]' 
                  : 'text-slate-500 bg-white/5 border border-white/5 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-4">
                <item.icon className={`icon-sm ${item.active ? 'text-white' : 'group-hover:text-blue-500 transition-colors'}`} />
                {item.label}
              </div>
              <ChevronRight className={`hidden lg:block icon-xs ${item.active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 transition-all'}`} />
            </button>
          ))}
        </motion.aside>

        <div className="lg:col-span-3 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden shadow-xl group"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] -z-10 group-hover:scale-125 transition-transform duration-700" />
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-blue-600/10 rounded-[1.25rem] flex items-center justify-center text-blue-500 border border-blue-500/20">
                <User size={24} />
              </div>
              <h3 className="text-display-tiny text-white uppercase italic tracking-tight underline decoration-blue-500/30 decoration-4 underline-offset-8">Informações Pessoais</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="block text-tiny font-black text-slate-500 uppercase tracking-[0.2em] pl-1">Nome de Exibição</label>
                <div className="relative group/input">
                  <input
                    type="text"
                    defaultValue={displayName}
                    className="w-full px-8 py-5 bg-white/5 border border-white/5 rounded-2xl text-slate-400 font-black uppercase tracking-widest cursor-not-allowed outline-none shadow-inner"
                    disabled
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-700">
                    <Lock className="icon-xs" />
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <label className="block text-tiny font-black text-slate-500 uppercase tracking-[0.2em] pl-1">E-mail de Acesso</label>
                <div className="relative group/input">
                  <input
                    type="email"
                    defaultValue={user?.email || ''}
                    className="w-full px-8 py-5 bg-white/5 border border-white/5 rounded-2xl text-slate-400 font-black uppercase tracking-widest cursor-not-allowed outline-none shadow-inner"
                    disabled
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-700">
                    <Lock className="icon-xs" />
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
            className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden shadow-xl group"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] -z-10 group-hover:scale-125 transition-transform duration-700" />
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-blue-600/10 rounded-[1.25rem] flex items-center justify-center text-blue-500 border border-blue-500/20">
                <SettingsIcon size={24} />
              </div>
              <h3 className="text-display-tiny text-white uppercase italic tracking-tight underline decoration-blue-500/30 decoration-4 underline-offset-8">Preferências Invest</h3>
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
                <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-8 bg-white/5 rounded-[2rem] border border-white/5 group/pref hover:border-white/10 transition-all duration-500 gap-8">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-white/5 rounded-[1.25rem] flex items-center justify-center text-slate-500 group-hover/pref:text-blue-500 transition-colors flex-shrink-0 border border-white/5">
                      <pref.icon size={20} />
                    </div>
                    <div>
                      <p className="text-display-tiny text-white uppercase italic tracking-tight">{pref.label}</p>
                      <p className="text-tiny font-bold text-slate-500 uppercase tracking-widest mt-2">{pref.desc}</p>
                    </div>
                  </div>
                  <div className={`w-16 h-8 rounded-full relative cursor-pointer border transition-all duration-500 flex-shrink-0 ${
                    pref.enabled ? 'bg-blue-600 border-blue-500/20 shadow-[0_0_20px_rgba(37,99,235,0.2)]' : 'bg-slate-800 border-white/10'
                  }`}>
                    <motion.div 
                      animate={{ x: pref.enabled ? 32 : 4 }}
                      className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-xl" 
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden shadow-xl group"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] -z-10 group-hover:scale-125 transition-transform duration-700" />
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-blue-600/10 rounded-[1.25rem] flex items-center justify-center text-blue-500 border border-blue-500/20">
                <Code size={24} />
              </div>
              <h3 className="text-display-tiny text-white uppercase italic tracking-tight underline decoration-blue-500/30 decoration-4 underline-offset-8">Desenvolvedor</h3>
            </div>

            <div className="p-8 bg-blue-500/5 rounded-[2rem] border border-blue-500/10 flex flex-col sm:flex-row items-center justify-between gap-8 group/card">
              <div className="space-y-3">
                <p className="text-display-tiny text-white uppercase italic">Nexus Engine Scraper</p>
                <p className="text-tiny font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                  Baixe o código-fonte atualizado do motor de busca e análise de ativos.
                </p>
              </div>
              <button 
                onClick={handleDownloadEngine}
                className="btn-primary whitespace-nowrap"
              >
                <Download className="icon-xs group-hover/card:translate-y-0.5 transition-transform" />
                Source Code
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden shadow-xl border-red-500/10 group"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 blur-[100px] -z-10 group-hover:scale-125 transition-transform duration-700" />
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-red-600/10 rounded-[1.25rem] flex items-center justify-center text-red-500 border border-red-500/20">
                <RefreshCw size={24} />
              </div>
              <h3 className="text-display-tiny text-white uppercase italic tracking-tight underline decoration-red-500/30 decoration-4 underline-offset-8">Manutenção</h3>
            </div>

            <div className="p-8 bg-red-500/5 rounded-[2rem] border border-red-500/10 flex flex-col sm:flex-row items-center justify-between gap-8 group/card">
              <div className="space-y-3">
                <p className="text-display-tiny text-white uppercase italic">Limpar Cache do App</p>
                <p className="text-tiny font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                  Se o aplicativo estiver apresentando erros ou não atualizar, tente limpar o cache local.
                </p>
              </div>
              <button 
                onClick={handleClearCache}
                className="px-8 py-4 bg-red-600 border border-red-500/20 rounded-2xl text-tiny font-black text-white hover:bg-red-500 transition-all uppercase tracking-widest shadow-lg shadow-red-600/20 whitespace-nowrap"
              >
                <Trash2 className="icon-xs group-hover/card:scale-110 transition-transform" />
                Limpar Cache
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
