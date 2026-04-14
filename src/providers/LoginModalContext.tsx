import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import LoginModal from '../components/LoginModal';

type AuthModalView = 'login' | 'register' | 'forgot-password' | 'forgot-username' | 'reset-password';

type LoginModalContextValue = {
  openLogin: () => void;
  openRegister: () => void;
  close: () => void;
};

const LoginModalContext = createContext<LoginModalContextValue | undefined>(undefined);

export function LoginModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialView, setInitialView] = useState<AuthModalView>('login');
  const [resetToken, setResetToken] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('resetToken');
    if (token) {
      setResetToken(token);
      setInitialView('reset-password');
      setIsOpen(true);
    }
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

  const close = useCallback(() => {
    setIsOpen(false);
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
      openLogin,
      openRegister,
      close,
    }),
    [openLogin, openRegister, close]
  );

  return (
    <LoginModalContext.Provider value={value}>
      {children}
      <LoginModal
        isOpen={isOpen}
        onClose={close}
        initialView={initialView}
        resetToken={resetToken}
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
