import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, parseCurrencyInput, getTodayISO } from '../../utils/helpers';
import { Modal } from '../ui/Modal';
import { Input, TextArea } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';

interface SettleUpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettleUpModal({ isOpen, onClose }: SettleUpModalProps) {
  const { couple, balance, addSettlement } = useApp();

  const partner1Name = couple?.partner1Name || 'Partner 1';
  const partner2Name = couple?.partner2Name || 'Partner 2';

  // Determine who owes whom
  const partner1Owes = balance.amount < 0;
  const suggestedAmount = Math.abs(balance.amount);
  const defaultPayer = partner1Owes ? 'partner1' : 'partner2';

  const [amount, setAmount] = useState((suggestedAmount / 100).toFixed(2));
  const [paidBy, setPaidBy] = useState<'partner1' | 'partner2'>(defaultPayer);
  const [date, setDate] = useState(getTodayISO());
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const amountCents = parseCurrencyInput(amount);
    if (amountCents <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    addSettlement({
      amount: amountCents,
      paidBy,
      paidTo: paidBy === 'partner1' ? 'partner2' : 'partner1',
      date,
      note: note.trim() || undefined,
    });

    onClose();
    // Reset form
    setAmount('');
    setNote('');
    setError('');
  };

  const partnerOptions = [
    { value: 'partner1', label: partner1Name },
    { value: 'partner2', label: partner2Name },
  ];

  const receivingPartner = paidBy === 'partner1' ? partner2Name : partner1Name;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="💰 Settle Up">
      {Math.abs(balance.amount) < 100 ? (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-xl font-bold mb-2">You're All Square!</h3>
          <p className="font-mono text-sm text-[var(--color-plum)]/70">
            No balance to settle right now.
          </p>
          <Button onClick={onClose} className="mt-6">
            Nice!
          </Button>
        </div>
      ) : (
        <>
          {/* Current balance display */}
          <div className="bg-[var(--color-sunshine)]/30 border-2 border-[var(--color-sunshine)] p-4 mb-6 text-center">
            <p className="font-mono text-xs uppercase mb-1">Current Balance</p>
            <p className="font-mono text-lg font-bold">
              {partner1Owes ? partner1Name : partner2Name} owes{' '}
              {partner1Owes ? partner2Name : partner1Name}{' '}
              <span className="text-[var(--color-coral)]">
                {formatCurrency(suggestedAmount)}
              </span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Select
              label="Who's paying?"
              options={partnerOptions}
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value as 'partner1' | 'partner2')}
            />

            <div className="bg-[var(--color-cream)] p-3 text-center font-mono text-sm border-2 border-dashed border-[var(--color-plum)]/20">
              → Paying to <strong>{receivingPartner}</strong>
            </div>

            <Input
              label="Amount"
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              icon="💵"
              error={error}
            />

            <Input
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              icon="📅"
            />

            <TextArea
              label="Note (optional)"
              placeholder="e.g., Venmo'd you!"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Record Payment
              </Button>
            </div>
          </form>
        </>
      )}
    </Modal>
  );
}

