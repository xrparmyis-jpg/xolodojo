import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Wallet } from '../services/walletService';
import { getUserWallets } from '../services/walletService';
import { useAuth } from './AuthContext';

export interface UserContextProfile {
  userId: string;
  socialHandles?: Record<string, string>;
}

interface UserContextType {
  profile: UserContextProfile | null;
  wallets: Wallet[];
  setProfile: (profile: UserContextProfile | null) => void;
  setWallets: (wallets: Wallet[]) => void;
  reloadWallets: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserContextProfile | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const walletsLoadedForUserId = useRef<string | null>(null);

  const reloadWallets = useCallback(async () => {
    const result = await getUserWallets();
    if (result.success) {
      setWallets(result.wallets || []);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.id) {
      setWallets([]);
      setProfile(null);
      walletsLoadedForUserId.current = null;
      return;
    }
    if (walletsLoadedForUserId.current === user.id) return;
    walletsLoadedForUserId.current = user.id;
    void reloadWallets();
  }, [authLoading, user?.id, reloadWallets]);

  return (
    <UserContext.Provider value={{ profile, wallets, setProfile, setWallets, reloadWallets }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUserContext must be used within a UserProvider');
  return context;
};
