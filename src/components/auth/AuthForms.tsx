import { useState } from 'react';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useApp } from '../../context/AppContext';

export function AuthForms() {
  const [mode, setMode] = useState<'login' | 'signup' | 'confirm'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  const { login, signup, confirmAccount, isLoading, needsConfirmation, pendingEmail } = useApp();

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

        {/* Login/Signup Form */}
        {mode !== 'confirm' && (
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

            <div className="mt-6 text-center">
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
