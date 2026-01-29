import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { parseCurrencyInput, getTodayISO } from '../../utils/helpers';
import { Modal } from '../ui/Modal';
import { Input, TextArea } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';

interface SettleUpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettleUpModal({ isOpen, onClose }: SettleUpModalProps) {
  const { members, user, balance, addSettlement } = useApp();

  // Filter out current user from potential payees if current user is payer
  const otherMembers = members.filter(m => m.userId !== user?.id);

  // Default: You pay the first other person
  const [paidBy, setPaidBy] = useState<string>(user?.id || '');
  const [paidTo, setPaidTo] = useState<string>(otherMembers[0]?.userId || '');

  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(getTodayISO());
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  // Auto-fill suggested payment if involved
  useEffect(() => {
    if (isOpen && balance.suggestedPayments) {
      // Find a suggestion involving the current user
      const myPayment = balance.suggestedPayments.find(p => p.fromUserId === user?.id);
      const paymentToMe = balance.suggestedPayments.find(p => p.toUserId === user?.id);

      if (myPayment) {
        setPaidBy(myPayment.fromUserId);
        setPaidTo(myPayment.toUserId);
        setAmount((myPayment.amount / 100).toFixed(2));
      } else if (paymentToMe) {
        setPaidBy(paymentToMe.fromUserId);
        setPaidTo(paymentToMe.toUserId);
        setAmount((paymentToMe.amount / 100).toFixed(2));
      }
    }
  }, [isOpen, balance.suggestedPayments, user?.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const amountCents = parseCurrencyInput(amount);
    if (amountCents <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (paidBy === paidTo) {
      setError('Payer and Payee cannot be the same person');
      return;
    }

    addSettlement({
      amount: amountCents,
      paidBy,
      paidTo,
      date,
      note: note.trim() || undefined,
    });

    onClose();
    // Reset form partials (keep date?)
    setAmount('');
    setNote('');
    setError('');
  };

  const memberOptions = members.map(m => ({
    value: m.userId,
    label: m.userId === user?.id ? `${m.name} (You)` : m.name
  }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="💰 Settle Up">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Paid By"
            options={memberOptions}
            value={paidBy}
            onChange={(e) => setPaidBy(e.target.value)}
          />
          <Select
            label="Paid To"
            options={memberOptions}
            value={paidTo}
            onChange={(e) => setPaidTo(e.target.value)}
          />
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
    </Modal>
  );
}
