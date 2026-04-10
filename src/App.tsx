import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Portfolio from './pages/Portfolio';
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
import FixedIncome from './pages/FixedIncome';
import Compare from './pages/Compare';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    const isConfigured = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!isConfigured) {
      setConfigError('Erro de Configuração: As variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não foram encontradas no painel de Settings.');
      setLoading(false);
      return;
    }

    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
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
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/" element={user ? <Layout /> : <Navigate to="/login" />}>
          <Route index element={<Home />} />
          <Route path="portfolio" element={<Portfolio />} />
          <Route path="search" element={<Search />} />
          <Route path="ranking" element={<Ranking />} />
          <Route path="screener" element={<Screener />} />
          <Route path="menu" element={<Menu />} />
          <Route path="settings" element={<Settings />} />
          <Route path="news" element={<News />} />
          <Route path="dividends" element={<Dividends />} />
          <Route path="calculators" element={<Calculators />} />
          <Route path="recommended" element={<RecommendedPortfolios />} />
          <Route path="asset/:ticker" element={<Asset />} />
          <Route path="renda-fixa" element={<FixedIncome />} />
          <Route path="compare" element={<Compare />} />
        </Route>
      </Routes>
    </Router>
  );
}
