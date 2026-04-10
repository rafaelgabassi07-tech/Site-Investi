import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';
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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    // Timeout de segurança para o carregamento inicial
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
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
