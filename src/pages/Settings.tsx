import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { CSVUploader } from '../components/expenses/CSVUploader';
import { ThemeSelector } from '../components/settings/ThemeSelector';
import { formatCurrency } from '../utils/helpers';
import {
  downloadCsv,
  expensesToCsv,
  fetchAllExpenses,
  fetchAllSettlements,
  settlementsToCsv,
} from '../utils/csvExport';

export function Settings() {
  const { user, group, members, updateGroup, settlements, expenses, logout } = useApp();

  const [isEditingGroup, setIsEditingGroup] = useState(false);
  const [groupName, setGroupName] = useState(group?.name || '');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExport = async () => {
    if (!group) return;
    setIsExporting(true);
    setExportError(null);
    try {
      const [allExpenses, allSettlements] = await Promise.all([
        fetchAllExpenses(group.id),
        fetchAllSettlements(group.id),
      ]);
      const stamp = new Date().toISOString().slice(0, 10);
      const slug = (group.name || 'group').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      downloadCsv(`${slug}-expenses-${stamp}.csv`, expensesToCsv(allExpenses, members));
      downloadCsv(`${slug}-settlements-${stamp}.csv`, settlementsToCsv(allSettlements, members));
    } catch (e: any) {
      console.error('[export] error', e);
      setExportError(e?.message || 'Export failed.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveGroup = async () => {
    if (groupName.trim()) {
      await updateGroup({
        name: groupName.trim(),
      });
      setIsEditingGroup(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const _totalSettlements = settlements.reduce((sum, set) => sum + set.amount, 0);
  void _totalSettlements;

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

      {/* App Style / Theme */}
      <Card>
        <CardHeader>
          <CardTitle>🎨 App Style</CardTitle>
        </CardHeader>
        <ThemeSelector />
      </Card>

      {/* Group Info */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>{group?.type === 'COUPLE' ? '💕 Couple Info' : '🏘️ Group Info'}</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditingGroup(!isEditingGroup)}
          >
            {isEditingGroup ? 'Cancel' : 'Edit'}
          </Button>
        </CardHeader>

        {isEditingGroup ? (
          <div className="space-y-4">
            <Input
              label="Group Name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Our awesome space"
            />
            {/* Note: Editing member names is complex as they are separate GroupMember records. 
                For MVP, we just edit the Group Name. Users can update their own names in Account settings if implemented. */}
            <Button onClick={handleSaveGroup} className="w-full">
              Save Changes
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <p className="font-mono text-xs uppercase text-[var(--color-plum)]/60">Name</p>
              <p className="font-bold text-lg">{group?.name}</p>
            </div>

            {/* Members List */}
            <div>
              <p className="font-mono text-xs uppercase text-[var(--color-plum)]/60 mb-2">Members</p>
              <div className="grid grid-cols-2 gap-4">
                {members.map(m => (
                  <div key={m.userId} className={`border-2 p-3 ${m.userId === user?.id ? 'bg-[var(--color-coral)]/10 border-[var(--color-coral)]' : 'bg-[var(--color-sage)]/20 border-[var(--color-sage)]'}`}>
                    <p className="font-mono text-xs uppercase text-[var(--color-plum)]/60">
                      {m.userId === user?.id ? 'You' : 'Member'}
                    </p>
                    <p className="font-bold">{m.name}</p>
                  </div>
                ))}
              </div>
            </div>

            {group?.inviteCode && (
              <div className="bg-[var(--color-sunshine)]/30 border-2 border-[var(--color-sunshine)] p-3 text-center mt-4">
                <p className="font-mono text-xs uppercase mb-1">Invite Code</p>
                <p className="font-mono text-2xl font-bold tracking-[0.2em]">
                  {group.inviteCode}
                </p>
                <p className="font-mono text-xs text-[var(--color-plum)]/60 mt-1" onClick={() => {
                  navigator.clipboard.writeText(group.inviteCode || '');
                  // toast or something
                }}>
                  (Tap to copy)
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

      {/* Import / Export Data */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>📦 Import / Export Data</CardTitle>
        </CardHeader>
        <div className="space-y-4">
          <div>
            <p className="font-bold">Import expenses from CSV</p>
            <p className="font-mono text-xs text-[var(--color-plum)]/60">
              Upload a CSV, map columns, preview rows, then import in one batch.
            </p>
          </div>
          <Button variant="secondary" className="w-full" onClick={() => setShowCsvImport(true)}>
            Import CSV
          </Button>

          <div className="pt-4 border-t-2 border-dashed border-[var(--color-plum)]/20">
            <p className="font-bold">Export all data as CSV</p>
            <p className="font-mono text-xs text-[var(--color-plum)]/60">
              Downloads two files: all expenses and all settlements for this group.
            </p>
          </div>
          <Button
            variant="secondary"
            className="w-full"
            onClick={handleExport}
            isLoading={isExporting}
            disabled={!group || isExporting}
          >
            Export CSV
          </Button>
          {exportError && (
            <p className="font-mono text-sm text-[var(--color-coral)]">{exportError}</p>
          )}
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
                // Not implemented
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

      <CSVUploader
        isOpen={showCsvImport}
        onClose={() => setShowCsvImport(false)}
      />

      {/* Footer */}
      <p className="text-center font-mono text-xs text-[var(--color-plum)]/40 pb-4">
        Rick & Share-ah v1.0 💕<br />
        Made with love for groups & couples
      </p>
    </div>
  );
}
