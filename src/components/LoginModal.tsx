import { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import Modal from './Modal';
import { useAuth } from '../providers/AuthContext';
import { LoginError, resendVerificationEmail } from '../lib/authApi';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

type View = 'login' | 'register' | 'forgot-password' | 'forgot-username' | 'reset-password';

function PasswordField({
  id,
  name,
  label,
  value,
  onChange,
  autoComplete,
  showPassword,
  onToggleShow,
  placeholder,
}: {
  id: string;
  name?: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  showPassword: boolean;
  onToggleShow: () => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm text-foreground-muted">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={showPassword ? 'text' : 'password'}
          autoComplete={autoComplete}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input-auth pr-10"
          placeholder={placeholder}
        />
        <button
          type="button"
          className={`btn-password-visibility absolute right-1.5 top-1/2 -translate-y-1/2 ${showPassword ? 'btn-password-visibility--on' : ''}`}
          onClick={onToggleShow}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} aria-hidden />
        </button>
      </div>
    </div>
  );
}

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: View;
  resetToken?: string | null;
  urlAuthNotice?: { variant: 'success' | 'error'; message: string } | null;
  onConsumeUrlAuthNotice?: () => void;
}

export default function LoginModal({
  isOpen,
  onClose,
  initialView = 'login',
  resetToken: resetTokenProp,
  urlAuthNotice = null,
  onConsumeUrlAuthNotice,
}: LoginModalProps) {
  const { login } = useAuth();
  const [view, setView] = useState<View>(resetTokenProp ? 'reset-password' : initialView);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [signupUsername, setSignupUsername] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupPasswordConfirm, setSignupPasswordConfirm] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterPasswordConfirm, setShowRegisterPasswordConfirm] = useState(false);
  const [forgotPasswordUsername, setForgotPasswordUsername] = useState('');
  const [forgotUsernameEmail, setForgotUsernameEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmResetPassword, setShowConfirmResetPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const skipLoginRegisterClearOnce = useRef(false);

  useEffect(() => {
    if (resetTokenProp) {
      setView('reset-password');
    }
  }, [resetTokenProp]);

  useEffect(() => {
    if (isOpen && !resetTokenProp) {
      setView(initialView);
    }
  }, [isOpen, initialView, resetTokenProp]);

  useEffect(() => {
    if (!isOpen || !urlAuthNotice) {
      return;
    }
    if (urlAuthNotice.variant === 'success') {
      setSuccessMessage(urlAuthNotice.message);
      setError('');
    } else {
      setError(urlAuthNotice.message);
      setSuccessMessage('');
    }
    skipLoginRegisterClearOnce.current = true;
    onConsumeUrlAuthNotice?.();
  }, [isOpen, urlAuthNotice, onConsumeUrlAuthNotice]);

  useEffect(() => {
    if (isOpen && (view === 'login' || view === 'register')) {
      if (skipLoginRegisterClearOnce.current) {
        skipLoginRegisterClearOnce.current = false;
        return;
      }
      setError('');
      setSuccessMessage('');
      setNeedsVerification(false);
    }
  }, [isOpen, view]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);
    try {
      await login(email, password);
      document.body.style.overflow = '';
      onClose();
    } catch (err) {
      if (err instanceof LoginError && err.code === 'EMAIL_NOT_VERIFIED') {
        setNeedsVerification(true);
        setError(err.message);
      } else {
        setNeedsVerification(false);
        setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setError('');
    setSuccessMessage('');
    setResendLoading(true);
    try {
      const { message, emailSent } = await resendVerificationEmail(email, password);
      if (emailSent) {
        setSuccessMessage(message);
        setNeedsVerification(false);
      } else {
        setError(message);
        setNeedsVerification(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend verification email.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    if (password !== signupPasswordConfirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          username: signupUsername.trim(),
          name: signupName.trim(),
        }),
      });
      const raw = await response.text();
      let data: { error?: string; message?: string; emailSent?: boolean; details?: string } = {};
      if (raw) {
        try {
          data = JSON.parse(raw) as typeof data;
        } catch {
          setError(
            `Could not read server response (HTTP ${response.status}). The API may be down: run "npm run dev:api" (port 3000) while using "npm run dev", or use "npm run dev:full".`
          );
          return;
        }
      } else if (!response.ok) {
        setError(
          `Request failed (HTTP ${response.status}). If you see this locally, start the API on port 3000 and ensure MySQL is running with DB_HOST / DB_NAME in .env.local.`
        );
        return;
      }
      if (!response.ok) {
        const errMsg = typeof data.error === 'string' ? data.error : null;
        const details = typeof data.details === 'string' ? data.details : '';
        throw new Error(
          errMsg && errMsg.length > 0
            ? (details ? `${errMsg} (${details})` : errMsg)
            : `Request failed (HTTP ${response.status})`
        );
      }
      const createdMsg =
        typeof data.message === 'string'
          ? data.message
          : 'Check your email for a verification link, then sign in below.';
      if (data.emailSent === false) {
        setError(createdMsg);
        setSuccessMessage('');
      } else {
        setSuccessMessage(createdMsg);
        setError('');
      }
      setPassword('');
      setSignupPasswordConfirm('');
      setSignupUsername('');
      setSignupName('');
      skipLoginRegisterClearOnce.current = true;
      setView('login');
    } catch (err) {
      if (err instanceof TypeError) {
        setError(
          'Network error (could not reach the server). For local dev, run the API: npm run dev:api (port 3000) with npm run dev, or npm run dev:full.'
        );
      } else {
        setError(err instanceof Error ? err.message : 'Failed to create account');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: forgotPasswordUsername.trim() }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to send reset email' }));
        throw new Error(errorData.error || 'Failed to send reset email');
      }
      const data = await response.json();
      setSuccessMessage(
        data.message ||
          'If an account exists for that username, check your inbox for a reset password link.'
      );
      setForgotPasswordUsername('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-username`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotUsernameEmail.trim().toLowerCase() }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to send email' }));
        throw new Error(errorData.error || 'Failed to send email');
      }
      const data = await response.json();
      setSuccessMessage(
        data.message ||
          'If an account exists for that email, you should receive a message with your username shortly.'
      );
      setForgotUsernameEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setIsLoading(true);
    try {
      const token =
        resetTokenProp ||
        new URLSearchParams(window.location.search).get('resetToken') ||
        '';
      if (!token) {
        throw new Error('Reset token is missing');
      }
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to reset password' }));
        throw new Error(errorData.error || 'Failed to reset password');
      }
      const data = await response.json();
      setSuccessMessage(
        data.message ||
          'Password has been reset successfully. You can now sign in with your new password.'
      );
      setView('login');
      setNewPassword('');
      setConfirmPassword('');
      window.history.replaceState({}, '', window.location.pathname);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  const title =
    view === 'login'
      ? 'Sign in'
      : view === 'register'
        ? 'Create XoloDojo Account'
        : view === 'forgot-password'
          ? 'Forgot password'
          : view === 'forgot-username'
            ? 'Forgot username'
            : 'Reset password';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidthClassName="max-w-md">
      <div className="space-y-4 text-left">
        {error && (
          <div className="rounded-md border border-red-500/40 bg-red-950/40 p-3 text-sm text-red-200">
            {error}
            {needsVerification && (
              <p className="mt-3 border-t border-red-500/30 pt-3">
                Need a new link?{' '}
                <button
                  type="button"
                  onClick={() => void handleResendVerification()}
                  disabled={resendLoading || !email.trim() || !password}
                  className="link-auth disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline"
                >
                  {resendLoading ? 'Sending…' : 'Resend verification email'}
                </button>
              </p>
            )}
          </div>
        )}
        {successMessage && (
          <div className="rounded-md border border-emerald-500/40 bg-emerald-950/30 p-3 text-sm text-emerald-100">
            {successMessage}
          </div>
        )}

        {view === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="mb-1 block text-sm text-foreground-muted">
                Email
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setNeedsVerification(false);
                }}
                className="input-auth"
                placeholder="you@example.com"
              />
            </div>
            <PasswordField
              id="login-password"
              name="password"
              label="Password"
              value={password}
              onChange={(v) => {
                setPassword(v);
                setNeedsVerification(false);
              }}
              autoComplete="current-password"
              showPassword={showLoginPassword}
              onToggleShow={() => setShowLoginPassword((s) => !s)}
            />
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <button
                type="button"
                className="link-auth"
                onClick={() => {
                  setView('forgot-password');
                  setError('');
                  setSuccessMessage('');
                }}
              >
                Forgot password?
              </button>
              <button
                type="button"
                className="link-auth"
                onClick={() => {
                  setView('forgot-username');
                  setError('');
                  setSuccessMessage('');
                }}
              >
                Forgot username?
              </button>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-cta-primary btn-cta-primary--block"
            >
              {isLoading ? 'Signing in…' : 'Sign in'}
            </button>
            <p className="text-center text-sm text-foreground-muted">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                className="link-auth"
                onClick={() => {
                  setView('register');
                  setError('');
                  setSuccessMessage('');
                }}
              >
                Create XoloDojo Account
              </button>
            </p>
          </form>
        )}

        {view === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label htmlFor="signup-username" className="mb-1 block text-sm text-foreground-muted">
                Username
              </label>
              <input
                id="signup-username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={signupUsername}
                onChange={(e) => setSignupUsername(e.target.value)}
                className="input-auth"
                placeholder="3–30 characters, letters, numbers, . _ -"
              />
            </div>
            <div>
              <label htmlFor="signup-name" className="mb-1 block text-sm text-foreground-muted">
                Name
              </label>
              <input
                id="signup-name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                className="input-auth"
              />
            </div>
            <div>
              <label htmlFor="register-email" className="mb-1 block text-sm text-foreground-muted">
                Email
              </label>
              <input
                id="register-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-auth"
              />
            </div>
            <PasswordField
              id="register-password"
              name="password"
              label="Password"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              showPassword={showRegisterPassword}
              onToggleShow={() => setShowRegisterPassword((s) => !s)}
              placeholder="At least 6 characters"
            />
            <PasswordField
              id="register-password-confirm"
              name="password_confirm"
              label="Confirm password"
              value={signupPasswordConfirm}
              onChange={setSignupPasswordConfirm}
              autoComplete="new-password"
              showPassword={showRegisterPasswordConfirm}
              onToggleShow={() => setShowRegisterPasswordConfirm((s) => !s)}
              placeholder="Re-enter your password"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="btn-cta-primary btn-cta-primary--block"
            >
              {isLoading ? 'Creating XoloDojo account…' : 'Create XoloDojo Account'}
            </button>
            <p className="text-center text-sm text-foreground-muted">
              Already have an account?{' '}
              <button
                type="button"
                className="link-auth"
                onClick={() => {
                  setView('login');
                  setError('');
                  setSuccessMessage('');
                }}
              >
                Sign in
              </button>
            </p>
          </form>
        )}

        {view === 'forgot-password' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <p className="text-sm text-foreground-muted">
              Enter your XoloDojo username. If an account exists, we&apos;ll email the address on
              file with a reset link.
            </p>
            <div>
              <label htmlFor="forgot-pw-user" className="mb-1 block text-sm text-foreground-muted">
                Username
              </label>
              <input
                id="forgot-pw-user"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={forgotPasswordUsername}
                onChange={(e) => setForgotPasswordUsername(e.target.value)}
                className="input-auth"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-cta-secondary flex-1"
                onClick={() => {
                  setView('login');
                  setError('');
                  setSuccessMessage('');
                }}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isLoading || !forgotPasswordUsername.trim()}
                className="btn-cta-primary min-w-0 flex-1"
              >
                {isLoading ? 'Sending…' : 'Send link'}
              </button>
            </div>
            <p className="text-center text-sm text-foreground-muted">
              <button
                type="button"
                className="link-auth"
                onClick={() => {
                  setView('login');
                  setError('');
                  setSuccessMessage('');
                }}
              >
                Back to sign in
              </button>
            </p>
          </form>
        )}

        {view === 'forgot-username' && (
          <form onSubmit={handleForgotUsername} className="space-y-4">
            <p className="text-sm text-foreground-muted">
              Enter the email you used for XoloDojo. If an account exists, we&apos;ll send your
              username there.
            </p>
            <div>
              <label htmlFor="forgot-user-email" className="mb-1 block text-sm text-foreground-muted">
                Email
              </label>
              <input
                id="forgot-user-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={forgotUsernameEmail}
                onChange={(e) => setForgotUsernameEmail(e.target.value)}
                className="input-auth"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-cta-secondary flex-1"
                onClick={() => {
                  setView('login');
                  setError('');
                  setSuccessMessage('');
                }}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isLoading || !forgotUsernameEmail.trim()}
                className="btn-cta-primary min-w-0 flex-1"
              >
                {isLoading ? 'Sending…' : 'Send'}
              </button>
            </div>
            <p className="text-center text-sm text-foreground-muted">
              <button
                type="button"
                className="link-auth"
                onClick={() => {
                  setView('login');
                  setError('');
                  setSuccessMessage('');
                }}
              >
                Back to sign in
              </button>
            </p>
          </form>
        )}

        {view === 'reset-password' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <p className="text-sm text-foreground-muted">Choose a new password and confirm it below.</p>
            <PasswordField
              id="new-password"
              name="newPassword"
              label="New password"
              value={newPassword}
              onChange={setNewPassword}
              autoComplete="new-password"
              showPassword={showNewPassword}
              onToggleShow={() => setShowNewPassword((s) => !s)}
            />
            <PasswordField
              id="confirm-password"
              name="confirmPassword"
              label="Confirm password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              autoComplete="new-password"
              showPassword={showConfirmResetPassword}
              onToggleShow={() => setShowConfirmResetPassword((s) => !s)}
            />
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-cta-secondary flex-1"
                onClick={() => {
                  setView('login');
                  setError('');
                  setSuccessMessage('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-cta-primary min-w-0 flex-1"
              >
                {isLoading ? 'Resetting…' : 'Reset password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
