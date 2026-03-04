import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import "./App.css";
import AppLoadingOverlay from "./components/AppLoadingOverlay";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import { useUserSync } from "./hooks/useUserSync";
import Home from "./pages/Home";
import About from "./pages/About";
import FAQ from "./pages/FAQ";
import Profile from "./pages/Profile";
import NotFound from "./pages/404";
import Xoloitzquintle from "./pages/Xoloitzquintle";
import Vision from "./pages/Vision";
import Team from "./pages/Team";
import XoloGlobe from "./pages/XoloGlobe";
import Mint from "./pages/Mint";

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth0();
  const navigate = useNavigate();
  const location = useLocation();
  const [isInitialLoading, setIsInitialLoading] = useState(import.meta.env.DEV);

  useUserSync();

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

  // Redirect to profile ONLY after successful login (Auth0 callback)
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // Check if we're coming from Auth0 callback (URL has code/state params)
      const urlParams = new URLSearchParams(window.location.search);
      const hasAuthParams = urlParams.has('code') || urlParams.has('state');

      if (hasAuthParams) {
        const appState = sessionStorage.getItem('auth0_app_state');
        let returnTo = '/profile';

        if (appState) {
          try {
            const parsed = JSON.parse(appState);
            returnTo = parsed.returnTo || '/profile';
            sessionStorage.removeItem('auth0_app_state');
          } catch (e) {
            // Ignore parse errors
          }
        }

        window.history.replaceState({}, '', returnTo);

        setTimeout(() => {
          navigate(returnTo, { replace: true });
        }, 300);
      }
    }
  }, [isAuthenticated, isLoading, navigate]);

  return (
    <>
      <AppLoadingOverlay isVisible={isInitialLoading} />
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/xoloitzquintle" element={<Xoloitzquintle />} />
        <Route path="/vision" element={<Vision />} />
        <Route path="/team" element={<Team />} />
        <Route path="/xologlobe" element={<XoloGlobe />} />
        <Route path="/mint" element={<Mint />} />
        <Route path="/faq" element={<FAQ />} />
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
      <Footer />
    </>
  );
}

function App() {
  return <AppContent />;
}

export default App;
