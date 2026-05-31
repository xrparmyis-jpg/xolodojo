import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { useXamanOAuthReturnRouting } from './hooks/useXamanOAuthReturnRouting';
import './App.css';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import FAQ from './pages/FAQ';
import Profile from './pages/Profile';
import NotFound from './pages/404';
import TermsAndConditions from './pages/TermsAndConditions';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Xoloitzquintli from './pages/Xoloitzquintle';
import Vision from './pages/Vision';
import Team from './pages/Team';
import Xglobe from './pages/Xglobe';
import AuthCallback from './pages/AuthCallback';

function XologlobeRedirect() {
  const { search } = useLocation();
  return <Navigate to={`/xglobe${search}`} replace />;
}

function AppContent() {
  const location = useLocation();
  useXamanOAuthReturnRouting();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="min-w-0 flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/xoloitzquintli" element={<Xoloitzquintli />} />
          <Route
            path="/xoloitzquintle"
            element={<Navigate to="/xoloitzquintli" replace />}
          />
          <Route path="/vision" element={<Vision />} />
          <Route path="/team" element={<Team />} />
          <Route path="/xglobe" element={<Xglobe />} />
          <Route path="/xologlobe" element={<XologlobeRedirect />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/faq" element={<FAQ />} />
          <Route
            path="/terms-and-conditions"
            element={<TermsAndConditions />}
          />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      {import.meta.env.PROD ? <Analytics /> : <Analytics debug={false} />}
    </div>
  );
}

function App() {
  return <AppContent />;
}

export default App;
