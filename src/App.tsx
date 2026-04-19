import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import Layout from './components/Layout';
import Portfolio from './pages/Portfolio';
import PortfolioSummaryPage from './pages/PortfolioSummaryPage';
import Transactions from './pages/Transactions';
import News from './pages/News';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Home from './pages/Home';
import Search from './pages/Search';
import Ranking from './pages/Ranking';
import Screener from './pages/Screener';
import Menu from './pages/Menu';
import Dividends from './pages/Dividends';
import Calculators from './pages/Calculators';
import RecommendedPortfolios from './pages/RecommendedPortfolios';
import Asset from './pages/Asset';
import AssetAnalysis from './pages/AssetAnalysis';
import FixedIncome from './pages/FixedIncome';
import Compare from './pages/Compare';
import Rebalance from './pages/Rebalance';
import Taxes from './pages/Taxes';
import About from './pages/About';
import Profitability from './pages/Profitability';
import Favorites from './pages/Favorites';
import BeginnersGuide from './pages/BeginnersGuide';

import { PortfolioProvider } from './contexts/PortfolioProvider';
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
      <div className="min-h-screen flex items-center justify-center bg-[#020617]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
      <ErrorBoundary>
        <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route path="/" element={user ? <PortfolioProvider><Layout /></PortfolioProvider> : <Navigate to="/login" />}>
            <Route index element={<Home />} />
            
            {/* Portfolio Section with Shared Layout */}
            <Route path="portfolio" element={<PortfolioLayout />}>
              <Route index element={<Portfolio />} />
              <Route path="resumo" element={<PortfolioSummaryPage />} />
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
          </Route>
          <Route 
            path="/portfolio/analise/:ticker" 
            element={user ? <PortfolioProvider><AssetAnalysis /></PortfolioProvider> : <Navigate to="/login" />} 
          />
        </Routes>
      </Router>
    </ErrorBoundary>
    </ThemeProvider>
  );
}
