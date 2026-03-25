import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import "./App.css";
import AppLoadingOverlay from "./components/AppLoadingOverlay";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { ToastProvider } from "./components/ToastProvider";
import ProtectedRoute from "./components/ProtectedRoute";
import { useUserSync } from "./hooks/useUserSync";
import Home from "./pages/Home";
import FAQ from "./pages/FAQ";
import Profile from "./pages/Profile";
import NotFound from "./pages/404";
import TermsAndConditions from "./pages/TermsAndConditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Xoloitzquintle from "./pages/Xoloitzquintle";
import Vision from "./pages/Vision";
import Team from "./pages/Team";
import XoloGlobe from "./pages/XoloGlobe";
import Mint from "./pages/Mint";
import { isAuth0SpaCallbackUrl } from "./utils/oauthCallbackGuards";

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

  // Redirect to profile ONLY after Auth0 login callback at `/` (redirect_uri = origin).
  // Do NOT strip query params for Xaman/Xumm OAuth returns — they also use code/state
  // (or authorization_code / scope=XummPkce) and land on /profile or other paths.
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const { pathname, search } = window.location;
      if (!isAuth0SpaCallbackUrl(pathname, search)) {
        return;
      }

      const appState = sessionStorage.getItem('auth0_app_state');
      let returnTo = '/profile';

      if (appState) {
        try {
          const parsed = JSON.parse(appState);
          returnTo = parsed.returnTo || '/profile';
          sessionStorage.removeItem('auth0_app_state');
        } catch {
          // Ignore parse errors
        }
      }

      window.history.replaceState({}, '', returnTo);

      window.setTimeout(() => {
        navigate(returnTo, { replace: true });
      }, 300);
    }
  }, [isAuthenticated, isLoading, navigate]);

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
          <Route path="/xologlobe" element={<XoloGlobe />} />
          <Route path="/mint" element={<Mint />} />
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
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;
