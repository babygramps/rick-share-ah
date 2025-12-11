import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { formatCurrency } from '../utils/helpers';

export function Settings() {
  const { user, couple, updateCouple, settlements, expenses, logout } = useApp();
  
  const [isEditingCouple, setIsEditingCouple] = useState(false);
  const [coupleName, setCoupleName] = useState(couple?.name || '');
  const [partner1Name, setPartner1Name] = useState(couple?.partner1Name || '');
  const [partner2Name, setPartner2Name] = useState(couple?.partner2Name || '');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleSaveCouple = async () => {
    if (coupleName.trim() && partner1Name.trim()) {
      await updateCouple({
        name: coupleName.trim(),
        partner1Name: partner1Name.trim(),
        partner2Name: partner2Name.trim() || null,
      });
      setIsEditingCouple(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const _totalSettlements = settlements.reduce((sum, set) => sum + set.amount, 0);
  void _totalSettlements; // Used for future stats display

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold">⚙️ Settings</h1>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>👤 Your Account</CardTitle>
        </CardHeader>
        <div className="space-y-3">
          <div>
            <p className="font-mono text-xs uppercase text-[var(--color-plum)]/60">Name</p>
            <p className="font-bold">{user?.name || 'Not set'}</p>
          </div>
          <div>
            <p className="font-mono text-xs uppercase text-[var(--color-plum)]/60">Email</p>
            <p className="font-mono text-sm">{user?.email}</p>
          </div>
        </div>
      </Card>

      {/* Couple Info */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>💕 Couple Info</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsEditingCouple(!isEditingCouple)}
          >
            {isEditingCouple ? 'Cancel' : 'Edit'}
          </Button>
        </CardHeader>

        {isEditingCouple ? (
          <div className="space-y-4">
            <Input
              label="Couple Name"
              value={coupleName}
              onChange={(e) => setCoupleName(e.target.value)}
              placeholder="Our awesome name"
            />
            <Input
              label="Your Name"
              value={partner1Name}
              onChange={(e) => setPartner1Name(e.target.value)}
              placeholder="Your nickname"
            />
            <Input
              label="Partner's Name"
              value={partner2Name}
              onChange={(e) => setPartner2Name(e.target.value)}
              placeholder="Their nickname"
            />
            <Button onClick={handleSaveCouple} className="w-full">
              Save Changes
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <p className="font-mono text-xs uppercase text-[var(--color-plum)]/60">Couple Name</p>
              <p className="font-bold text-lg">{couple?.name}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[var(--color-coral)]/10 border-2 border-[var(--color-coral)] p-3">
                <p className="font-mono text-xs uppercase text-[var(--color-plum)]/60">Partner 1</p>
                <p className="font-bold">{couple?.partner1Name}</p>
              </div>
              <div className="bg-[var(--color-sage)]/20 border-2 border-[var(--color-sage)] p-3">
                <p className="font-mono text-xs uppercase text-[var(--color-plum)]/60">Partner 2</p>
                <p className="font-bold">{couple?.partner2Name || 'Not joined yet'}</p>
              </div>
            </div>
            {couple?.inviteCode && (
              <div className="bg-[var(--color-sunshine)]/30 border-2 border-[var(--color-sunshine)] p-3 text-center">
                <p className="font-mono text-xs uppercase mb-1">Invite Code</p>
                <p className="font-mono text-2xl font-bold tracking-[0.2em]">
                  {couple.inviteCode}
                </p>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Stats */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Stats</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-[var(--color-cream)] border-2 border-[var(--color-plum)]/20">
            <p className="font-mono text-3xl font-bold">{expenses.length}</p>
            <p className="font-mono text-xs uppercase text-[var(--color-plum)]/60">
              Expenses
            </p>
          </div>
          <div className="text-center p-4 bg-[var(--color-cream)] border-2 border-[var(--color-plum)]/20">
            <p className="font-mono text-3xl font-bold">{settlements.length}</p>
            <p className="font-mono text-xs uppercase text-[var(--color-plum)]/60">
              Settlements
            </p>
          </div>
          <div className="text-center p-4 bg-[var(--color-cream)] border-2 border-[var(--color-plum)]/20 col-span-2">
            <p className="font-mono text-3xl font-bold">
              {formatCurrency(totalExpenses)}
            </p>
            <p className="font-mono text-xs uppercase text-[var(--color-plum)]/60">
              Total Tracked
            </p>
          </div>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="border-[var(--color-coral)]">
        <CardHeader>
          <CardTitle>⚠️ Danger Zone</CardTitle>
        </CardHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-bold">Clear All Data</p>
              <p className="font-mono text-xs text-[var(--color-plum)]/60">
                Delete all expenses and settlements
              </p>
            </div>
            <Button 
              variant="danger" 
              size="sm"
              onClick={() => setShowClearConfirm(true)}
            >
              Clear
            </Button>
          </div>
          <div className="flex items-center justify-between gap-4 pt-4 border-t-2 border-dashed border-[var(--color-plum)]/20">
            <div>
              <p className="font-bold">Log Out</p>
              <p className="font-mono text-xs text-[var(--color-plum)]/60">
                Sign out of your account
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Log Out
            </Button>
          </div>
        </div>
      </Card>

      {/* Clear Data Confirmation Modal */}
      <Modal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        title="⚠️ Clear All Data?"
        size="sm"
      >
        <div className="text-center">
          <p className="font-mono text-sm mb-6">
            This will delete all {expenses.length} expenses and {settlements.length} settlements.
            <br />
            <span className="text-[var(--color-coral)] font-bold">
              This cannot be undone!
            </span>
          </p>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={() => setShowClearConfirm(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                // Note: In a real app, you'd delete all expenses/settlements from DynamoDB
                // For now, just close the modal
                setShowClearConfirm(false);
                alert('Clear data feature requires backend implementation. For now, please delete items individually.');
              }}
              className="flex-1"
            >
              Clear Everything
            </Button>
          </div>
        </div>
      </Modal>

      {/* Footer */}
      <p className="text-center font-mono text-xs text-[var(--color-plum)]/40 pb-4">
        Rick & Share-ah v1.0 💕<br />
        Made with love for couples
      </p>
    </div>
  );
}

