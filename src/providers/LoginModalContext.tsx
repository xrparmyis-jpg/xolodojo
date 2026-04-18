import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import LoginModal from '../components/LoginModal';
import ConnectChoiceModal from '../components/ConnectChoiceModal';
import ConnectWalletAuthModal from '../components/ConnectWalletAuthModal';

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
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isConnectWalletAuthOpen, setIsConnectWalletAuthOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [initialView, setInitialView] = useState<AuthModalView>('login');
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [urlAuthNotice, setUrlAuthNotice] = useState<{
    variant: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('resetToken');
    if (token) {
      setResetToken(token);
      setInitialView('reset-password');
      setIsOpen(true);
      return;
    }

    let shouldStrip = false;
    if (params.get('verified') === '1') {
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
        q ? `${window.location.pathname}?${q}` : window.location.pathname
      );
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
        onClose={() => setIsConnectWalletAuthOpen(false)}
        onSuccess={() => {
          setIsConnectWalletAuthOpen(false);
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
