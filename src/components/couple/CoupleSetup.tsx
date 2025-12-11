import { useState } from 'react';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useApp } from '../../context/AppContext';

export function CoupleSetup() {
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose');
  const [coupleName, setCoupleName] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, createCouple, joinCouple, couple, logout } = useApp();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coupleName.trim() || !partnerName.trim()) return;
    
    setError('');
    setIsSubmitting(true);
    
    try {
      const result = await createCouple(coupleName, partnerName);
      if (!result.success) {
        setError(result.error || 'Failed to create couple');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Create couple error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim() || !partnerName.trim()) return;
    
    setError('');
    setIsSubmitting(true);
    
    try {
      const result = await joinCouple(inviteCode.toUpperCase(), partnerName);
      if (!result.success) {
        setError(result.error || 'Failed to join couple');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Join couple error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show invite code if couple exists but no partner2
  if (couple && !couple.partner2Id && couple.inviteCode) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full animate-bounce-in text-center">
          <CardHeader>
            <CardTitle>🎉 Couple Created!</CardTitle>
          </CardHeader>

          <div className="space-y-6">
            <p className="font-mono text-sm">
              Share this code with your partner so they can join:
            </p>

            <div className="bg-[var(--color-sunshine)] border-4 border-[var(--color-plum)] p-6">
              <p className="font-mono text-4xl font-bold tracking-[0.3em] text-[var(--color-plum)]">
                {couple.inviteCode}
              </p>
            </div>

            <p className="font-mono text-xs text-[var(--color-plum)]/60">
              They'll need to create an account and enter this code to join your couple.
            </p>

            <div className="bg-[var(--color-sage)]/20 border-2 border-[var(--color-sage)] p-4 font-mono text-sm">
              <p className="font-bold mb-2">💡 Tip:</p>
              <p>You can start adding expenses right away! Your partner can join later.</p>
            </div>

            <Button
              onClick={() => window.location.reload()}
              className="w-full"
            >
              Continue to Dashboard →
            </Button>

            <button
              onClick={logout}
              className="font-mono text-xs text-[var(--color-coral)] hover:underline cursor-pointer mt-4"
            >
              Sign out / Switch account
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8 animate-bounce-in">
          <div className="text-6xl mb-4">👫</div>
          <h2 className="text-2xl font-bold text-[var(--color-plum)]">
            Hey {user?.name}! 👋
          </h2>
          <p className="font-mono text-sm mt-2 text-[var(--color-plum)]/70">
            Let's set up your couple account
          </p>
          <div className="mt-4 pt-4 border-t-2 border-dashed border-[var(--color-plum)]/20">
            <p className="font-mono text-xs text-[var(--color-plum)]/50 mb-2">
              Signed in as {user?.email}
            </p>
            <button
              onClick={logout}
              className="font-mono text-xs text-[var(--color-coral)] hover:underline cursor-pointer"
            >
              Sign out / Switch account
            </button>
          </div>
        </div>

        {mode === 'choose' && (
          <div className="space-y-4 animate-slide-up">
            <Card
              hover
              className="cursor-pointer"
              onClick={() => setMode('create')}
            >
              <div className="flex items-center gap-4">
                <span className="text-4xl">🏠</span>
                <div>
                  <h3 className="font-bold text-lg">Create New Couple</h3>
                  <p className="font-mono text-xs text-[var(--color-plum)]/70">
                    Start fresh & invite your partner
                  </p>
                </div>
              </div>
            </Card>

            <Card
              hover
              className="cursor-pointer"
              onClick={() => setMode('join')}
            >
              <div className="flex items-center gap-4">
                <span className="text-4xl">🔗</span>
                <div>
                  <h3 className="font-bold text-lg">Join Existing Couple</h3>
                  <p className="font-mono text-xs text-[var(--color-plum)]/70">
                    Enter an invite code from your partner
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {mode === 'create' && (
          <Card className="animate-slide-up">
            <CardHeader>
              <CardTitle>🏠 Create Your Couple</CardTitle>
            </CardHeader>

            <form onSubmit={handleCreate} className="space-y-4">
              <Input
                label="Couple Name"
                placeholder="e.g., 'Team Awesome' or your last names"
                value={coupleName}
                onChange={(e) => setCoupleName(e.target.value)}
                icon="💕"
                required
              />

              <Input
                label="Your Name (in this couple)"
                placeholder="e.g., 'Rick' or a cute nickname"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                icon="👤"
                required
              />

              {error && (
                <div className="bg-[var(--color-coral)]/10 border-2 border-[var(--color-coral)] p-3 font-mono text-sm text-[var(--color-coral)]">
                  ⚠️ {error}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => { setMode('choose'); setError(''); }}
                >
                  ← Back
                </Button>
                <Button type="submit" className="flex-1" isLoading={isSubmitting}>
                  Create Couple
                </Button>
              </div>
            </form>
          </Card>
        )}

        {mode === 'join' && (
          <Card className="animate-slide-up">
            <CardHeader>
              <CardTitle>🔗 Join Your Partner</CardTitle>
            </CardHeader>

            <form onSubmit={handleJoin} className="space-y-4">
              <Input
                label="Invite Code"
                placeholder="XXXXXX"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                maxLength={6}
                icon="🎟️"
                required
                className="uppercase tracking-[0.2em] text-center text-xl"
              />

              <Input
                label="Your Name (in this couple)"
                placeholder="e.g., 'Morty' or a cute nickname"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                icon="👤"
                required
              />

              {error && (
                <div className="bg-[var(--color-coral)]/10 border-2 border-[var(--color-coral)] p-3 font-mono text-sm text-[var(--color-coral)]">
                  ⚠️ {error}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => { setMode('choose'); setError(''); }}
                >
                  ← Back
                </Button>
                <Button type="submit" className="flex-1" isLoading={isSubmitting}>
                  Join Couple
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}
