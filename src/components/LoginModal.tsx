import { useEffect, useState } from 'react';
import Modal from './Modal';
import { useAuth } from '../providers/AuthContext';
import { LoginError, resendVerificationEmail } from '../lib/authApi';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

type View = 'login' | 'register' | 'forgot-password' | 'forgot-username' | 'reset-password';

const fieldClass =
  'w-full rounded-md border border-white/20 bg-[#151518] px-3 py-2 text-white placeholder:text-gray-500 focus:border-[#b7e9f7] focus:outline-none';
const btnPrimary =
  'w-full cursor-pointer rounded-md border-0 bg-[#b7e9f7] px-4 py-2.5 text-sm font-semibold text-[#151518] transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50';
const btnSecondary =
  'flex-1 cursor-pointer rounded-md border border-white/25 bg-transparent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: View;
  resetToken?: string | null;
}

export default function LoginModal({
  isOpen,
  onClose,
  initialView = 'login',
  resetToken: resetTokenProp,
}: LoginModalProps) {
  const { login } = useAuth();
  const [view, setView] = useState<View>(resetTokenProp ? 'reset-password' : initialView);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupName, setSignupName] = useState('');
  const [forgotPasswordUsername, setForgotPasswordUsername] = useState('');
  const [forgotUsernameEmail, setForgotUsernameEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

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
    if (isOpen && (view === 'login' || view === 'register')) {
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
      const data = (await response.json().catch(() => ({ error: 'Failed to create account' }))) as {
        error?: string;
        message?: string;
        emailSent?: boolean;
      };
      if (!response.ok) {
        throw new Error(typeof data.error === 'string' ? data.error : 'Failed to create account');
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
      setSignupUsername('');
      setSignupName('');
      setView('login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
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
        ? 'Create an account'
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
                  className="font-semibold text-[#b7e9f7] underline disabled:opacity-50"
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
              <label htmlFor="login-email" className="mb-1 block text-sm text-gray-300">
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
                className={fieldClass}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="login-password" className="mb-1 block text-sm text-gray-300">
                Password
              </label>
              <input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setNeedsVerification(false);
                }}
                className={fieldClass}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <button
                type="button"
                className="text-[#b7e9f7] hover:underline"
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
                className="text-[#b7e9f7] hover:underline"
                onClick={() => {
                  setView('forgot-username');
                  setError('');
                  setSuccessMessage('');
                }}
              >
                Forgot username?
              </button>
            </div>
            <button type="submit" disabled={isLoading} className={btnPrimary}>
              {isLoading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        )}

        {view === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label htmlFor="signup-username" className="mb-1 block text-sm text-gray-300">
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
                className={fieldClass}
                placeholder="3–30 characters, letters, numbers, . _ -"
              />
            </div>
            <div>
              <label htmlFor="signup-name" className="mb-1 block text-sm text-gray-300">
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
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="register-email" className="mb-1 block text-sm text-gray-300">
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
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="register-password" className="mb-1 block text-sm text-gray-300">
                Password
              </label>
              <input
                id="register-password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={fieldClass}
                placeholder="At least 6 characters"
              />
            </div>
            <button type="submit" disabled={isLoading} className={btnPrimary}>
              {isLoading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        )}

        {view === 'forgot-password' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <p className="text-sm text-gray-400">
              Enter your XoloDojo username. If an account exists, we&apos;ll email the address on
              file with a reset link.
            </p>
            <div>
              <label htmlFor="forgot-pw-user" className="mb-1 block text-sm text-gray-300">
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
                className={fieldClass}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className={btnSecondary}
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
                className={`${btnPrimary} flex-1`}
              >
                {isLoading ? 'Sending…' : 'Send link'}
              </button>
            </div>
          </form>
        )}

        {view === 'forgot-username' && (
          <form onSubmit={handleForgotUsername} className="space-y-4">
            <p className="text-sm text-gray-400">
              Enter the email you used for XoloDojo. If an account exists, we&apos;ll send your
              username there.
            </p>
            <div>
              <label htmlFor="forgot-user-email" className="mb-1 block text-sm text-gray-300">
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
                className={fieldClass}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className={btnSecondary}
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
                className={`${btnPrimary} flex-1`}
              >
                {isLoading ? 'Sending…' : 'Send'}
              </button>
            </div>
          </form>
        )}

        {view === 'reset-password' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <p className="text-sm text-gray-400">Choose a new password and confirm it below.</p>
            <div>
              <label htmlFor="new-password" className="mb-1 block text-sm text-gray-300">
                New password
              </label>
              <input
                id="new-password"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="mb-1 block text-sm text-gray-300">
                Confirm password
              </label>
              <input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={fieldClass}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className={btnSecondary}
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
              <button type="submit" disabled={isLoading} className={`${btnPrimary} flex-1`}>
                {isLoading ? 'Resetting…' : 'Reset password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
