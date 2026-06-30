import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import LoginModal from '../components/LoginModal';
import ConnectChoiceModal from '../components/ConnectChoiceModal';
import ConnectWalletAuthModal from '../components/ConnectWalletAuthModal';
import { authClientDebugLog } from '../lib/authClientDebugLog';
import { getSupabaseClient } from '../lib/supabaseClient';
import { shouldResumeXamanPkceConnect } from '../utils/oauthCallbackGuards';
import {
  getXamanConnectIntent,
  isXamanDesktopHandoffSearch,
} from '../utils/xamanConnectIntent';
import { stripXamanDesktopHandoffParams } from '../utils/xamanOAuthLanding';

type AuthModalView = 'login' | 'register' | 'forgot-password' | 'forgot-username' | 'reset-password';

type LoginModalContextValue = {
  openConnect: () => void;
  openLogin: () => void;
  openRegister: () => void;
  close: () => void;
};

const LoginModalContext = createContext<LoginModalContextValue | undefined>(undefined);

export function LoginModalProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isConnectWalletAuthOpen, setIsConnectWalletAuthOpen] = useState(false);
  const [resumeXamanWalletAuth, setResumeXamanWalletAuth] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [initialView, setInitialView] = useState<AuthModalView>('login');
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [urlAuthNotice, setUrlAuthNotice] = useState<{
    variant: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    const { pathname, search } = window.location;
    if (isXamanDesktopHandoffSearch(search)) {
      stripXamanDesktopHandoffParams();
      return;
    }
    if (shouldResumeXamanPkceConnect(pathname, search)) {
      const intent = getXamanConnectIntent();
      if (intent === 'wallet_auth') {
        setIsConnectWalletAuthOpen(true);
        setResumeXamanWalletAuth(true);
      }
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const hashParams = new URLSearchParams(location.hash.replace(/^#/, ''));
    const isRecovery =
      params.get('reset') === '1' ||
      params.get('type') === 'recovery' ||
      hashParams.get('type') === 'recovery';

    authClientDebugLog('LoginModal', 'checking URL auth params', {
      pathname: location.pathname,
      search: location.search || null,
      hasHash: Boolean(location.hash),
      reset: params.get('reset'),
      typeSearch: params.get('type'),
      typeHash: hashParams.get('type'),
      isRecovery,
    });

    if (isRecovery) {
      authClientDebugLog('LoginModal', 'opening reset-password modal');
      setResetToken(null);
      setInitialView('reset-password');
      setIsOpen(true);
      params.delete('reset');
      params.delete('type');
      const q = params.toString();
      window.history.replaceState(
        {},
        '',
        q ? `${location.pathname}?${q}` : location.pathname
      );
      return;
    }

    const token = params.get('resetToken');
    if (token) {
      authClientDebugLog('LoginModal', 'opening reset-password modal from resetToken');
      setResetToken(token);
      setInitialView('reset-password');
      setIsOpen(true);
      return;
    }

    let shouldStrip = false;
    if (params.get('verified') === '1') {
      authClientDebugLog('LoginModal', 'opening login modal after email verification');
      setResetToken(null);
      setInitialView('login');
      setUrlAuthNotice({
        variant: 'success',
        message: 'Your email is verified. You can sign in below.',
      });
      setIsOpen(true);
      params.delete('verified');
      shouldStrip = true;
    }
    const authError = params.get('authError');
    if (authError === 'verify') {
      authClientDebugLog('LoginModal', 'opening login modal after auth verify error');
      setResetToken(null);
      setInitialView('login');
      setUrlAuthNotice({
        variant: 'error',
        message: 'Email verification failed. The link may be invalid or already used.',
      });
      setIsOpen(true);
      params.delete('authError');
      shouldStrip = true;
    } else if (authError === 'expired') {
      authClientDebugLog('LoginModal', 'opening login modal after expired verification link');
      setResetToken(null);
      setInitialView('login');
      setUrlAuthNotice({
        variant: 'error',
        message:
          'That verification link has expired. Sign in and use "Resend verification" if your email is not verified yet.',
      });
      setIsOpen(true);
      params.delete('authError');
      shouldStrip = true;
    }
    if (shouldStrip) {
      const q = params.toString();
      window.history.replaceState(
        {},
        '',
        q ? `${location.pathname}?${q}` : location.pathname
      );
    }
  }, [location.pathname, location.search, location.hash]);

  useEffect(() => {
    try {
      const supabase = getSupabaseClient();
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        authClientDebugLog('LoginModal', 'supabase auth state change', {
          event,
          hasSession: Boolean(session),
          userId: session?.user.id ?? null,
        });
        if (event === 'PASSWORD_RECOVERY') {
          authClientDebugLog('LoginModal', 'PASSWORD_RECOVERY event — opening reset modal');
          setResetToken(null);
          setInitialView('reset-password');
          setIsOpen(true);
        }
      });
      return () => {
        subscription.unsubscribe();
      };
    } catch {
      return undefined;
    }
  }, []);

  const consumeUrlAuthNotice = useCallback(() => {
    setUrlAuthNotice(null);
  }, []);

  const openLogin = useCallback(() => {
    setInitialView('login');
    setResetToken(null);
    setIsOpen(true);
  }, []);

  const openRegister = useCallback(() => {
    setInitialView('register');
    setResetToken(null);
    setIsOpen(true);
  }, []);

  const openConnect = useCallback(() => {
    setIsConnectModalOpen(true);
  }, []);

  const closeConnectModal = useCallback(() => {
    setIsConnectModalOpen(false);
  }, []);

  const chooseLoginFromConnect = useCallback(() => {
    setIsConnectModalOpen(false);
    openLogin();
  }, [openLogin]);

  const chooseConnectWalletFromPicker = useCallback(() => {
    setIsConnectModalOpen(false);
    setIsConnectWalletAuthOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setIsConnectModalOpen(false);
    setIsConnectWalletAuthOpen(false);
    setResetToken(null);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.has('resetToken')) {
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  const value = useMemo(
    () => ({
      openConnect,
      openLogin,
      openRegister,
      close,
    }),
    [openConnect, openLogin, openRegister, close]
  );

  return (
    <LoginModalContext.Provider value={value}>
      {children}
      <ConnectChoiceModal
        isOpen={isConnectModalOpen}
        onClose={closeConnectModal}
        onChooseLogin={chooseLoginFromConnect}
        onChooseConnectWallet={chooseConnectWalletFromPicker}
      />
      <ConnectWalletAuthModal
        isOpen={isConnectWalletAuthOpen}
        resumeXamanOnMount={resumeXamanWalletAuth}
        onClose={() => {
          setIsConnectWalletAuthOpen(false);
          setResumeXamanWalletAuth(false);
          setIsConnectModalOpen(false);
        }}
        onSuccess={() => {
          setIsConnectWalletAuthOpen(false);
          setResumeXamanWalletAuth(false);
          setIsConnectModalOpen(false);
          navigate('/profile');
        }}
      />
      <LoginModal
        isOpen={isOpen}
        onClose={close}
        initialView={initialView}
        resetToken={resetToken}
        urlAuthNotice={urlAuthNotice}
        onConsumeUrlAuthNotice={consumeUrlAuthNotice}
      />
    </LoginModalContext.Provider>
  );
}

export function useLoginModal(): LoginModalContextValue {
  const ctx = useContext(LoginModalContext);
  if (!ctx) {
    throw new Error('useLoginModal must be used within LoginModalProvider');
  }
  return ctx;
}
