import { useState } from 'react';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useApp } from '../../context/AppContext';
import type { GroupType } from '../../types';

export function GroupSetup() {
    const [mode, setMode] = useState<'choose' | 'create-couple' | 'create-group' | 'join'>('choose');
    const [groupName, setGroupName] = useState('');
    const [yourName, setYourName] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user, createGroup, joinGroup, group, logout } = useApp();

    const handleCreate = async (e: React.FormEvent, type: GroupType) => {
        e.preventDefault();
        if (!groupName.trim() || !yourName.trim()) return;

        setError('');
        setIsSubmitting(true);

        try {
            const result = await createGroup(groupName, type, yourName);
            if (!result.success) {
                setError(result.error || 'Failed to create group');
            }
        } catch (err) {
            setError('An unexpected error occurred');
            console.error('Create group error:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteCode.trim() || !yourName.trim()) return;

        setError('');
        setIsSubmitting(true);

        try {
            const result = await joinGroup(inviteCode.toUpperCase(), yourName);
            if (!result.success) {
                setError(result.error || 'Failed to join group');
            }
        } catch (err) {
            setError('An unexpected error occurred');
            console.error('Join group error:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Show invite code if group exists but user is alone (optional UX improvement)
    // For 'COUPLE' type, if count < 2, prompts invite.
    // For 'GROUP' type, always shows invite code? or maybe dashboard shows it.
    // Current logic in CoupleSetup was: if (couple && !partner2Id) -> show invite.
    // In generic group, we might rely on the Dashboard to show invite code.
    // However, for immediate feedback after creation, showing invite code is nice.
    // For now, let's assume if group is loaded, we redirect to dashboard (via parent component unmounting this).
    // But wait, RequireGroup renders GroupSetup if !group.
    // If group is set, RequireGroup renders children (Dashboard).
    // So we don't need the "Success" view *inside* GroupSetup unless createGroup doesn't set group immediately?
    // createGroup in AppContext DOES setGroup.
    // So this component will unmount immediately upon success.
    // EXCEPT: The user might want to see the invite code RIGHT AWAY.
    // In CoupleSetup, it had a check `if (couple && !couple.partner2Id)`.
    // If `createGroup` sets `group`, `RequireGroup` will see `group` and render `Dashboard`.
    // So the "Success View" instructions should simpler be part of the Dashboard for a new group?
    // OR `RequireGroup` logic needs to be "If group exists but is empty/new, show setup success?"
    // No, let's keep it simple: Once group is created, go to Dashboard. Dashboard will handle the "Empty State" / Invite Code display.

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                {/* Header */}
                <div className="text-center mb-8 animate-bounce-in">
                    <div className="text-6xl mb-4">✨</div>
                    <h2 className="text-2xl font-bold text-[var(--color-plum)]">
                        Welcome, {user?.name}! 👋
                    </h2>
                    <p className="font-mono text-sm mt-2 text-[var(--color-plum)]/70">
                        Let's get your space set up
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-up">
                        <Card
                            hover
                            className="cursor-pointer border-2 hover:border-[var(--color-plum)] transition-all"
                            onClick={() => setMode('create-couple')}
                        >
                            <div className="flex flex-col items-center text-center p-4 gap-4">
                                <span className="text-5xl">👫</span>
                                <div>
                                    <h3 className="font-bold text-lg mb-2">Couple Space</h3>
                                    <p className="font-mono text-xs text-[var(--color-plum)]/70">
                                        Perfect for just two people. Simple 50/50 splits and "You vs Partner" view.
                                    </p>
                                </div>
                            </div>
                        </Card>

                        <Card
                            hover
                            className="cursor-pointer border-2 hover:border-[var(--color-plum)] transition-all"
                            onClick={() => setMode('create-group')}
                        >
                            <div className="flex flex-col items-center text-center p-4 gap-4">
                                <span className="text-5xl">🏘️</span>
                                <div>
                                    <h3 className="font-bold text-lg mb-2">Group Space</h3>
                                    <p className="font-mono text-xs text-[var(--color-plum)]/70">
                                        For 3+ friends or roommates. Flexible splitting options and simplified debts.
                                    </p>
                                </div>
                            </div>
                        </Card>

                        <Card
                            hover
                            className="cursor-pointer md:col-span-2 border-dashed"
                            onClick={() => setMode('join')}
                        >
                            <div className="flex items-center justify-center gap-4 p-2">
                                <span className="text-2xl">🔗</span>
                                <div>
                                    <h3 className="font-bold text-base">Join Existing Space</h3>
                                    <p className="font-mono text-xs text-[var(--color-plum)]/70">
                                        Enter an invite code
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {mode === 'create-couple' && (
                    <Card className="animate-slide-up max-w-md mx-auto">
                        <CardHeader>
                            <CardTitle>👫 Create Couple Space</CardTitle>
                        </CardHeader>

                        <form onSubmit={(e) => handleCreate(e, 'COUPLE')} className="space-y-4">
                            <Input
                                label="Couple Name"
                                placeholder="e.g., 'Team Awesome'"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                icon="💕"
                                required
                            />

                            <Input
                                label="Your Name (in this couple)"
                                placeholder="e.g., 'Rick'"
                                value={yourName}
                                onChange={(e) => setYourName(e.target.value)}
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

                {mode === 'create-group' && (
                    <Card className="animate-slide-up max-w-md mx-auto">
                        <CardHeader>
                            <CardTitle>🏘️ Create Group Space</CardTitle>
                        </CardHeader>

                        <form onSubmit={(e) => handleCreate(e, 'GROUP')} className="space-y-4">
                            <Input
                                label="Group Name"
                                placeholder="e.g., 'Apartment 4B'"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                icon="🏠"
                                required
                            />

                            <Input
                                label="Your Name (in this group)"
                                placeholder="e.g., 'Morty'"
                                value={yourName}
                                onChange={(e) => setYourName(e.target.value)}
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
                                    Create Group
                                </Button>
                            </div>
                        </form>
                    </Card>
                )}

                {mode === 'join' && (
                    <Card className="animate-slide-up max-w-md mx-auto">
                        <CardHeader>
                            <CardTitle>🔗 Join Existing Space</CardTitle>
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
                                label="Your Name (in this space)"
                                placeholder="e.g., 'Summer'"
                                value={yourName}
                                onChange={(e) => setYourName(e.target.value)}
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
                                    Join Space
                                </Button>
                            </div>
                        </form>
                    </Card>
                )}
            </div>
        </div>
    );
}
