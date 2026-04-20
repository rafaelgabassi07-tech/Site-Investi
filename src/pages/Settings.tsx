import { Settings as SettingsIcon, User, Bell, Shield, ChevronRight, Lock, EyeOff, Moon, RefreshCw, Trash2, Download, Code, Eye, Sun } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'motion/react';
import { PageHeader } from '../components/ui/PageHeader';
import { useTheme } from '../hooks/useTheme';
import { useState } from 'react';

import { usePrivacy } from '../contexts/PrivacyContext';

export default function Settings() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { hideValues, toggleHideValues } = usePrivacy();

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário';

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

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
              className={`flex-shrink-0 lg:w-full flex items-center justify-between px-5 py-4 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-500 group ${
                item.active 
                  ? 'bg-blue-600 text-white shadow-[0_10px_30px_rgba(37,99,235,0.3)]' 
                  : 'text-slate-500 bg-white/5 border border-white/5 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className={`w-4 h-4 ${item.active ? 'text-white' : 'group-hover:text-blue-500 transition-colors'}`} />
                {item.label}
              </div>
              <ChevronRight className={`hidden lg:block w-3.5 h-3.5 ${item.active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 transition-all'}`} />
            </button>
          ))}
        </motion.aside>

        <div className="lg:col-span-3 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="nexus-card"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] -z-10 group-hover:scale-125 transition-transform duration-700" />
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-lg">
                <User size={20} />
              </div>
              <h3 className="nexus-title text-base underline decoration-blue-500/30 decoration-2 underline-offset-4">Informações Pessoais</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="nexus-label pl-1">Nome de Exibição</label>
                <div className="relative group/input">
                  <input
                    type="text"
                    defaultValue={displayName}
                    className="w-full px-5 py-3 bg-secondary border border-border rounded-xl text-foreground nexus-title cursor-not-allowed outline-none shadow-inner"
                    disabled
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="nexus-label pl-1">E-mail de Acesso</label>
                <div className="relative group/input">
                  <input
                    type="email"
                    defaultValue={user?.email || ''}
                    className="w-full px-5 py-3 bg-secondary border border-border rounded-xl text-foreground nexus-title cursor-not-allowed outline-none shadow-inner"
                    disabled
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Lock className="w-3.5 h-3.5" />
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
            className="nexus-card"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] -z-10 group-hover:scale-125 transition-transform duration-700" />
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-lg">
                <SettingsIcon size={20} />
              </div>
              <h3 className="nexus-title text-base underline decoration-blue-500/30 decoration-2 underline-offset-4">Preferências Invest</h3>
            </div>

            <div className="space-y-4">
              {[
                { 
                  label: "Modo Privacidade", 
                  desc: "Oculta valores sensíveis em todo o aplicativo.", 
                  icon: hideValues ? EyeOff : Eye,
                  enabled: hideValues,
                  onClick: toggleHideValues
                },
                { 
                  label: theme === 'dark' ? "Invest Dark Mode" : "Invest Light Mode", 
                  desc: theme === 'dark' ? "Otimizado para telas OLED e baixa luminosidade." : "Modo padrão para ambientes iluminados.", 
                  icon: theme === 'dark' ? Moon : Sun,
                  enabled: theme === 'dark',
                  onClick: toggleTheme
                }
              ].map((pref, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 bg-secondary rounded-2xl border border-border group/pref hover:border-blue-500/20 transition-all duration-500 gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-card rounded-xl flex items-center justify-center text-muted-foreground group-hover/pref:text-blue-500 transition-colors flex-shrink-0 border border-border shadow-md">
                      <pref.icon size={18} />
                    </div>
                    <div>
                      <p className="nexus-title">{pref.label}</p>
                      <p className="nexus-description mt-1 opacity-70">{pref.desc}</p>
                    </div>
                  </div>
                  <div 
                    onClick={pref.onClick}
                    className={`w-14 h-7 rounded-full relative cursor-pointer border transition-all duration-500 flex-shrink-0 ${
                      pref.enabled ? 'bg-blue-600 border-blue-500/20 shadow-[0_0_20px_rgba(37,99,235,0.2)]' : 'bg-slate-300 dark:bg-slate-800 border-border'
                    }`}
                  >
                    <motion.div 
                      animate={{ x: pref.enabled ? 28 : 4 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-xl" 
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
            className="nexus-card"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] -z-10 group-hover:scale-125 transition-transform duration-700" />
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-lg">
                <Code size={20} />
              </div>
              <h3 className="nexus-title text-base underline decoration-blue-500/30 decoration-2 underline-offset-4">Desenvolvedor</h3>
            </div>

            <div className="p-6 bg-blue-500/5 rounded-2xl border border-blue-500/10 flex flex-col sm:flex-row items-center justify-between gap-6 group/card">
              <div className="space-y-2">
                <p className="nexus-title">Nexus Engine Scraper</p>
                <p className="nexus-description opacity-70 leading-relaxed">
                  Baixe o código-fonte atualizado do motor de busca e análise de ativos.
                </p>
              </div>
              <button 
                onClick={handleDownloadEngine}
                className="btn-primary px-6 py-3 text-[10px] md:text-tiny rounded-xl whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5 group-hover/card:translate-y-0.5 transition-transform" />
                Source Code
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="nexus-card border-red-500/20"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 blur-[100px] -z-10 group-hover:scale-125 transition-transform duration-700" />
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 bg-red-600/10 rounded-xl flex items-center justify-center text-red-500 border border-red-500/20 shadow-lg">
                <RefreshCw size={20} />
              </div>
              <h3 className="nexus-title text-base underline decoration-red-500/30 decoration-2 underline-offset-4">Manutenção</h3>
            </div>

            <div className="p-6 bg-red-500/5 rounded-2xl border border-red-500/10 flex flex-col sm:flex-row items-center justify-between gap-6 group/card">
              <div className="space-y-2">
                <p className="nexus-title text-red-500">Limpar Cache do App</p>
                <p className="nexus-description text-red-500/60 leading-relaxed">
                  Se o aplicativo estiver apresentando erros ou não atualizar, tente limpar o cache local.
                </p>
              </div>
              <button 
                onClick={handleClearCache}
                className="px-6 py-3 bg-red-600 border border-red-500/20 rounded-xl text-[10px] md:text-tiny font-black text-white hover:bg-red-500 transition-all uppercase tracking-widest shadow-lg shadow-red-600/20 whitespace-nowrap flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5 group-hover/card:scale-110 transition-transform" />
                Limpar Cache
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
