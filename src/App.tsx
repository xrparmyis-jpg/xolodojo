import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./App.css";
import AppLoadingOverlay from "./components/AppLoadingOverlay";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import FAQ from "./pages/FAQ";
import Profile from "./pages/Profile";
import NotFound from "./pages/404";
import TermsAndConditions from "./pages/TermsAndConditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Xoloitzquintle from "./pages/Xoloitzquintle";
import Vision from "./pages/Vision";
import Team from "./pages/Team";
import Xglobe from "./pages/Xglobe";

function XologlobeRedirect() {
  const { search } = useLocation();
  return <Navigate to={`/xglobe${search}`} replace />;
}

function AppContent() {
  const location = useLocation();
  const [isInitialLoading, setIsInitialLoading] = useState(import.meta.env.DEV);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  }, [location.pathname]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    const timeoutId = window.setTimeout(() => {
      setIsInitialLoading(false);
    }, 780);

    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <AppLoadingOverlay isVisible={isInitialLoading} />
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/xoloitzquintle" element={<Xoloitzquintle />} />
          <Route path="/vision" element={<Vision />} />
          <Route path="/team" element={<Team />} />
          <Route path="/xglobe" element={<Xglobe />} />
          <Route path="/xologlobe" element={<XologlobeRedirect />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
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
    </div>
  );
}

function App() {
  return <AppContent />;
}

export default App;
