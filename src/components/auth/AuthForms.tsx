import { useState } from 'react';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useApp } from '../../context/AppContext';

export function AuthForms() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const { login, signup, isLoading } = useApp();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (!name.trim()) {
          setError('Please enter your name');
          return;
        }
        await signup(email, password, name);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
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

        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle>
              {isLogin ? '👋 Welcome Back!' : '✨ Create Account'}
            </CardTitle>
          </CardHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
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
              minLength={6}
              icon="🔒"
            />

            {error && (
              <div className="bg-[var(--color-coral)]/10 border-2 border-[var(--color-coral)] p-3 font-mono text-sm text-[var(--color-coral)]">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isLoading}
            >
              {isLogin ? 'Log In' : 'Sign Up'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="font-mono text-sm text-[var(--color-plum)] hover:text-[var(--color-coral)] transition-colors underline underline-offset-4"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : 'Already have an account? Log in'}
            </button>
          </div>
        </Card>

        {/* Fun footer */}
        <p className="text-center mt-6 font-mono text-xs text-[var(--color-plum)]/50">
          Made with 💕 for couples who share everything
        </p>
      </div>
    </div>
  );
}

