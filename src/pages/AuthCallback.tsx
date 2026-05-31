import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSupabaseClient } from '../lib/supabaseClient';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [message, setMessage] = useState('Completing sign-in…');

  useEffect(() => {
    let cancelled = false;

    async function finish() {
      try {
        const supabase = getSupabaseClient();
        const params = new URLSearchParams(window.location.search);
        const type = params.get('type');

        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
        } else {
          const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
          if (error) {
            // PKCE/code exchange may not apply to all link types; fall through to getSession.
            const { data } = await supabase.auth.getSession();
            if (!data.session) {
              throw error;
            }
          }
        }

        if (cancelled) return;

        if (type === 'recovery') {
          navigate('/?reset=1', { replace: true });
          return;
        }

        navigate('/?verified=1', { replace: true });
      } catch (err) {
        if (cancelled) return;
        console.error('Auth callback failed:', err);
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
