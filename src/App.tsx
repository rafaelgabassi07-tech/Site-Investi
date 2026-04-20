import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import React, { useEffect, useState, lazy, Suspense } from 'react';
import { supabase } from './lib/supabase';
import Layout from './components/Layout';

// Lazy loaded pages to optimize bundle size
const Portfolio = lazy(() => import('./pages/Portfolio'));
const PortfolioSummaryPage = lazy(() => import('./pages/PortfolioSummaryPage'));
const Patrimony = lazy(() => import('./pages/Patrimony'));
const Transactions = lazy(() => import('./pages/Transactions'));
const News = lazy(() => import('./pages/News'));
const Settings = lazy(() => import('./pages/Settings'));
const Login = lazy(() => import('./pages/Login'));
const Home = lazy(() => import('./pages/Home'));
const Search = lazy(() => import('./pages/Search'));
const Ranking = lazy(() => import('./pages/Ranking'));
const Screener = lazy(() => import('./pages/Screener'));
const Menu = lazy(() => import('./pages/Menu'));
const Dividends = lazy(() => import('./pages/Dividends'));
const Calculators = lazy(() => import('./pages/Calculators'));
const RecommendedPortfolios = lazy(() => import('./pages/RecommendedPortfolios'));
const Asset = lazy(() => import('./pages/Asset'));
const AssetAnalysis = lazy(() => import('./pages/AssetAnalysis'));
const FixedIncome = lazy(() => import('./pages/FixedIncome'));
const Compare = lazy(() => import('./pages/Compare'));
const Rebalance = lazy(() => import('./pages/Rebalance'));
const Taxes = lazy(() => import('./pages/Taxes'));
const About = lazy(() => import('./pages/About'));
const Profitability = lazy(() => import('./pages/Profitability'));
const Favorites = lazy(() => import('./pages/Favorites'));
const BeginnersGuide = lazy(() => import('./pages/BeginnersGuide'));
const NexusIAPanel = lazy(() => import('./pages/NexusIAPanel'));

import { PortfolioProvider } from './contexts/PortfolioProvider';
import { PrivacyProvider } from './contexts/PrivacyContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ScrollToTop } from './components/ScrollToTop';

import PortfolioLayout from './components/PortfolioLayout';

import { ThemeProvider } from './components/ThemeProvider';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    window.history.scrollRestoration = 'manual';
    const isConfigured = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!isConfigured) {
      setConfigError('Erro de Configuração: As variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não foram encontradas no painel de Settings.');
      setLoading(false);
      return;
    }

    const syncUser = async (user: any) => {
      if (!user) return;
      try {
        await supabase.from('users').upsert({
          id: user.id,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
      } catch (err) {
        console.error('Failed to sync user to public.users:', err);
      }
    };

    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) syncUser(currentUser);
      setLoading(false);
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) syncUser(currentUser);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#020617] space-y-4">
        <div className="w-16 h-16 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
        <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] animate-pulse italic">Protocolo Nexus: Iniciando Sistemas...</p>
      </div>
    );
  }

  if (configError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617] p-6 text-center">
        <div className="card p-8 border border-red-500/20 bg-red-950/10">
          <h2 className="text-xl font-bold text-red-500 mb-4">Erro de Configuração</h2>
          <p className="text-slate-300">{configError}</p>
          <p className="text-slate-400 mt-4 text-sm">Por favor, adicione as variáveis no menu Settings do AI Studio.</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider defaultTheme="dark" storageKey="nexus-theme">
      <PrivacyProvider>
        <ErrorBoundary>
          <PortfolioProvider>
            <Router>
              <ScrollToTop />
              <Routes>
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
            <Route path="/" element={user ? <Layout /> : <Navigate to="/login" />}>
              <Route index element={<Home />} />
              
              {/* Portfolio Section with Shared Layout */}
              <Route path="portfolio" element={<PortfolioLayout />}>
                <Route index element={<Portfolio />} />
                <Route path="resumo" element={<PortfolioSummaryPage />} />
                <Route path="patrimonio" element={<Patrimony />} />
                <Route path="lancamentos" element={<Transactions />} />
                <Route path="proventos" element={<Dividends />} />
                <Route path="rentabilidade" element={<Profitability />} />
              </Route>
  
              <Route path="search" element={<Search />} />
              <Route path="ranking" element={<Ranking />} />
              <Route path="screener" element={<Screener />} />
              <Route path="menu" element={<Menu />} />
              <Route path="settings" element={<Settings />} />
              <Route path="news" element={<News />} />
              <Route path="dividends" element={<Navigate to="/portfolio/proventos" replace />} />
              <Route path="profitability" element={<Navigate to="/portfolio/rentabilidade" replace />} />
              <Route path="calculators" element={<Calculators />} />
              <Route path="recommended" element={<RecommendedPortfolios />} />
              <Route path="asset/:ticker" element={<Asset />} />
              <Route path="renda-fixa" element={<FixedIncome />} />
              <Route path="compare" element={<Compare />} />
              <Route path="rebalance" element={<Rebalance />} />
              <Route path="taxes" element={<Taxes />} />
              <Route path="about" element={<About />} />
              <Route path="favorites" element={<Favorites />} />
              <Route path="guide" element={<BeginnersGuide />} />
              <Route path="nexus-ia" element={<NexusIAPanel />} />
            </Route>
            <Route 
              path="/portfolio/analise/:ticker" 
              element={user ? <Suspense fallback={
                <div className="flex flex-col items-center justify-center min-h-[100vh] bg-[#020617] gap-4">
                  <div className="w-12 h-12 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
                  <span className="text-xs font-black uppercase tracking-widest text-slate-500">
                    Analisando Ativo...
                  </span>
                </div>
              }><AssetAnalysis /></Suspense> : <Navigate to="/login" />} 
            />
          </Routes>
            </Router>
          </PortfolioProvider>
        </ErrorBoundary>
      </PrivacyProvider>
    </ThemeProvider>
  );
}
