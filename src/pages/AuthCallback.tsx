import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  authClientDebugError,
  authClientDebugLog,
  authClientDebugWarn,
} from '../lib/authClientDebugLog';
import { getSupabaseClient } from '../lib/supabaseClient';

function getCallbackType(): string | null {
  const searchParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  return searchParams.get('type') || hashParams.get('type');
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const [message, setMessage] = useState('Completing sign-in…');

  useEffect(() => {
    let cancelled = false;

    async function finish() {
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const type = getCallbackType();
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const code = searchParams.get('code');

      authClientDebugLog('AuthCallback', 'processing redirect', {
        pathname: window.location.pathname,
        type,
        typeSource: searchParams.get('type')
          ? 'search'
          : hashParams.get('type')
            ? 'hash'
            : null,
        hasAccessToken: Boolean(accessToken),
        hasRefreshToken: Boolean(refreshToken),
        hasCode: Boolean(code),
      });

      try {
        const supabase = getSupabaseClient();

        if (accessToken && refreshToken) {
          authClientDebugLog('AuthCallback', 'establishing session from hash tokens');
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
        } else {
          authClientDebugLog('AuthCallback', 'attempting PKCE code exchange');
          const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
          if (error) {
            const { data } = await supabase.auth.getSession();
            if (!data.session) {
              throw error;
            }
            authClientDebugWarn('AuthCallback', 'code exchange failed; using existing session', {
              exchangeError: error.message,
            });
          }
        }

        if (cancelled) return;

        const { data: sessionData } = await supabase.auth.getSession();
        authClientDebugLog('AuthCallback', 'session ready', {
          type,
          hasSession: Boolean(sessionData.session),
          userId: sessionData.session?.user.id ?? null,
        });

        if (type === 'recovery') {
          authClientDebugLog('AuthCallback', 'recovery link — redirecting to reset modal', {
            next: '/?reset=1',
            note: 'User will already have a recovery session; reset form uses supabase.auth.updateUser.',
          });
          navigate('/?reset=1', { replace: true });
          return;
        }

        authClientDebugLog('AuthCallback', 'non-recovery link — redirecting to verified notice', {
          next: '/?verified=1',
        });
        navigate('/?verified=1', { replace: true });
      } catch (err) {
        if (cancelled) return;
        authClientDebugError('AuthCallback', 'callback failed', {
          type,
          error: err instanceof Error ? err.message : String(err),
        });
        setMessage('Authentication link failed or expired.');
        navigate('/?authError=verify', { replace: true });
      }
    }

    void finish();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center px-4">
      <p className="text-foreground-muted">{message}</p>
    </div>
  );
}
