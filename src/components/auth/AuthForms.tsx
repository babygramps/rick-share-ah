import { useState } from 'react';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useApp } from '../../context/AppContext';

export function AuthForms() {
  const [mode, setMode] = useState<'login' | 'signup' | 'confirm' | 'forgot' | 'resetConfirm'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  
  const { login, signup, confirmAccount, isLoading, needsConfirmation, pendingEmail, requestPasswordReset, confirmPasswordReset } = useApp();

  // Switch to confirm mode if needed
  if (needsConfirmation && mode !== 'confirm') {
    setMode('confirm');
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const result = await login(email, password);
    if (!result.success) {
      setError(result.error || 'Login failed');
      if (result.error?.includes('verify')) {
        setMode('confirm');
      }
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    const result = await signup(email, password, name);
    if (result.success) {
      if (result.needsConfirmation) {
        setMessage('Check your email for a verification code!');
        setMode('confirm');
      }
    } else {
      setError(result.error || 'Signup failed');
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const result = await confirmAccount(confirmCode);
    if (result.success) {
      setMessage('Email verified! You can now log in.');
      setMode('login');
      setConfirmCode('');
    } else {
      setError(result.error || 'Verification failed');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    console.log('[auth-forms] handleForgotPassword.start', { email });
    setIsResetting(true);
    try {
      const result = await requestPasswordReset(email);
      console.log('[auth-forms] handleForgotPassword.result', result);
      if (result.success) {
        setMessage('Check your email for a password reset code!');
        console.log('[auth-forms] handleForgotPassword.success - switching to resetConfirm mode');
        setMode('resetConfirm');
      } else {
        console.log('[auth-forms] handleForgotPassword.error', { error: result.error });
        setError(result.error || 'Failed to send reset code');
      }
    } catch (err) {
      console.error('[auth-forms] handleForgotPassword.exception', err);
      setError('An unexpected error occurred');
    } finally {
      setIsResetting(false);
    }
  };

  const handleResetConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!resetCode.trim()) {
      setError('Please enter the reset code');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    console.log('[auth-forms] handleResetConfirm.start');
    setIsResetting(true);
    try {
      const result = await confirmPasswordReset(resetCode, newPassword);
      if (result.success) {
        setMessage('Password reset successfully! You can now log in with your new password.');
        setMode('login');
        setResetCode('');
        setNewPassword('');
        console.log('[auth-forms] handleResetConfirm.success');
      } else {
        console.log('[auth-forms] handleResetConfirm.error', { error: result.error });
        setError(result.error || 'Failed to reset password');
      }
    } catch (err) {
      console.error('[auth-forms] handleResetConfirm.exception', err);
      setError('An unexpected error occurred');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-cream)]">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 animate-bounce-in">
          <div className="text-7xl mb-4">💕</div>
          <h1 className="text-4xl font-bold text-[var(--color-plum)]">
            Rick & Share-ah
          </h1>
          <p className="font-mono text-sm mt-2 text-[var(--color-plum)]/70">
            Split expenses with your boo 💖
          </p>
        </div>

        {/* Confirmation Form */}
        {mode === 'confirm' && (
          <Card className="animate-slide-up">
            <CardHeader>
              <CardTitle>📧 Verify Your Email</CardTitle>
            </CardHeader>

            <form onSubmit={handleConfirm} className="space-y-4">
              <p className="font-mono text-sm text-[var(--color-plum)]/70">
                We sent a verification code to <strong>{pendingEmail || email}</strong>
              </p>

              <Input
                label="Verification Code"
                type="text"
                placeholder="123456"
                value={confirmCode}
                onChange={(e) => setConfirmCode(e.target.value)}
                required
                icon="🔑"
                className="text-center text-2xl tracking-[0.3em]"
              />

              {error && (
                <div className="bg-[var(--color-coral)]/10 border-2 border-[var(--color-coral)] p-3 font-mono text-sm text-[var(--color-coral)]">
                  {error}
                </div>
              )}

              {message && (
                <div className="bg-[var(--color-sage)]/20 border-2 border-[var(--color-sage)] p-3 font-mono text-sm text-[var(--color-plum)]">
                  {message}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                size="lg"
                isLoading={isLoading}
              >
                Verify Email
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                  setMessage('');
                }}
                className="font-mono text-sm text-[var(--color-plum)] hover:text-[var(--color-coral)] transition-colors underline underline-offset-4"
              >
                Back to login
              </button>
            </div>
          </Card>
        )}

        {/* Forgot Password Form */}
        {mode === 'forgot' && (
          <Card className="animate-slide-up">
            <CardHeader>
              <CardTitle>🔐 Reset Password</CardTitle>
            </CardHeader>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <p className="font-mono text-sm text-[var(--color-plum)]/70">
                Enter your email and we'll send you a code to reset your password.
              </p>

              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                icon="📧"
              />

              {error && (
                <div className="bg-[var(--color-coral)]/10 border-2 border-[var(--color-coral)] p-3 font-mono text-sm text-[var(--color-coral)]">
                  {error}
                </div>
              )}

              {message && (
                <div className="bg-[var(--color-sage)]/20 border-2 border-[var(--color-sage)] p-3 font-mono text-sm text-[var(--color-plum)]">
                  {message}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                size="lg"
                isLoading={isResetting}
              >
                Send Reset Code
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                  setMessage('');
                }}
                className="font-mono text-sm text-[var(--color-plum)] hover:text-[var(--color-coral)] transition-colors underline underline-offset-4"
              >
                Back to login
              </button>
            </div>
          </Card>
        )}

        {/* Reset Password Confirmation Form */}
        {mode === 'resetConfirm' && (
          <Card className="animate-slide-up">
            <CardHeader>
              <CardTitle>🔑 Enter New Password</CardTitle>
            </CardHeader>

            <form onSubmit={handleResetConfirm} className="space-y-4">
              <p className="font-mono text-sm text-[var(--color-plum)]/70">
                We sent a reset code to <strong>{email}</strong>
              </p>

              <Input
                label="Reset Code"
                type="text"
                placeholder="123456"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                required
                icon="🔑"
                className="text-center text-2xl tracking-[0.3em]"
              />

              <Input
                label="New Password"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                icon="🔒"
              />

              <p className="font-mono text-xs text-[var(--color-plum)]/60">
                Password must be at least 8 characters
              </p>

              {error && (
                <div className="bg-[var(--color-coral)]/10 border-2 border-[var(--color-coral)] p-3 font-mono text-sm text-[var(--color-coral)]">
                  {error}
                </div>
              )}

              {message && (
                <div className="bg-[var(--color-sage)]/20 border-2 border-[var(--color-sage)] p-3 font-mono text-sm text-[var(--color-plum)]">
                  {message}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                size="lg"
                isLoading={isResetting}
              >
                Reset Password
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                  setMessage('');
                  setResetCode('');
                  setNewPassword('');
                }}
                className="font-mono text-sm text-[var(--color-plum)] hover:text-[var(--color-coral)] transition-colors underline underline-offset-4"
              >
                Back to login
              </button>
            </div>
          </Card>
        )}

        {/* Login/Signup Form */}
        {(mode === 'login' || mode === 'signup') && (
          <Card className="animate-slide-up">
            <CardHeader>
              <CardTitle>
                {mode === 'login' ? '👋 Welcome Back!' : '✨ Create Account'}
              </CardTitle>
            </CardHeader>

            <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="space-y-4">
              {mode === 'signup' && (
                <Input
                  label="Your Name"
                  type="text"
                  placeholder="What should we call you?"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  icon="👤"
                />
              )}

              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                icon="📧"
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                icon="🔒"
              />

              {mode === 'signup' && (
                <p className="font-mono text-xs text-[var(--color-plum)]/60">
                  Password must be at least 8 characters
                </p>
              )}

              {error && (
                <div className="bg-[var(--color-coral)]/10 border-2 border-[var(--color-coral)] p-3 font-mono text-sm text-[var(--color-coral)]">
                  {error}
                </div>
              )}

              {message && (
                <div className="bg-[var(--color-sage)]/20 border-2 border-[var(--color-sage)] p-3 font-mono text-sm text-[var(--color-plum)]">
                  {message}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                size="lg"
                isLoading={isLoading}
              >
                {mode === 'login' ? 'Log In' : 'Sign Up'}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-3">
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    setError('');
                    setMessage('');
                  }}
                  className="font-mono text-sm text-[var(--color-plum)]/70 hover:text-[var(--color-coral)] transition-colors underline underline-offset-4"
                >
                  Forgot password?
                </button>
              )}
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === 'login' ? 'signup' : 'login');
                    setError('');
                    setMessage('');
                  }}
                  className="font-mono text-sm text-[var(--color-plum)] hover:text-[var(--color-coral)] transition-colors underline underline-offset-4"
                >
                  {mode === 'login'
                    ? "Don't have an account? Sign up"
                    : 'Already have an account? Log in'}
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* Fun footer */}
        <p className="text-center mt-6 font-mono text-xs text-[var(--color-plum)]/50">
          Made with 💕 for couples who share everything
        </p>
      </div>
    </div>
  );
}
