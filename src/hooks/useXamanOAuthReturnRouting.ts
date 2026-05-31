import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthContext';
import { shouldResumeXamanPkceConnect } from '../utils/oauthCallbackGuards';
import { getXamanConnectIntent } from '../utils/xamanConnectIntent';

/**
 * After mobile Xaman OAuth on localhost we redirect to `/?xaman_return=1` (not /profile).
 * Logged-in email users need to land on /profile so WalletConnection can resume the flow.
 */
export function useXamanOAuthReturnRouting() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.authMode === 'wallet') {
      return;
    }

    const { pathname, search } = window.location;
    if (!shouldResumeXamanPkceConnect(pathname, search)) {
      return;
    }
    if (getXamanConnectIntent() !== 'profile_wallets') {
      return;
    }
    if (pathname.toLowerCase().includes('profile')) {
      return;
    }

    navigate(`/profile${search}`, { replace: true });
  }, [user, navigate]);
}
