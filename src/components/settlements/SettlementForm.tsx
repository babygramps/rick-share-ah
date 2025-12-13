import { useState } from 'react';
import type { Settlement } from '../../types';
import { useApp } from '../../context/AppContext';
import { parseCurrencyInput, formatDateForInput } from '../../utils/helpers';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import { Input, TextArea } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';

interface SettlementFormProps {
  settlement: Settlement;
  onSubmit?: () => void;
  onCancel?: () => void;
}

export function SettlementForm({ settlement, onSubmit, onCancel }: SettlementFormProps) {
  const { couple, updateSettlement } = useApp();

  const [amount, setAmount] = useState((settlement.amount / 100).toFixed(2));
  const [paidBy, setPaidBy] = useState(settlement.paidBy);
  const [date, setDate] = useState(formatDateForInput(settlement.date));
  const [note, setNote] = useState(settlement.note || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const partner1Name = couple?.partner1Name || 'Partner 1';
  const partner2Name = couple?.partner2Name || 'Partner 2';

  const partnerOptions = [
    { value: 'partner1', label: partner1Name },
    { value: 'partner2', label: partner2Name },
  ];

  const receivingPartner = paidBy === 'partner1' ? partner2Name : partner1Name;

  const validate = () => {
    const newErrors: Record<string, string> = {};

    const amountCents = parseCurrencyInput(amount);
    if (amountCents <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }

    if (!date) {
      newErrors.date = 'Date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const amountCents = parseCurrencyInput(amount);
      const paidTo = paidBy === 'partner1' ? 'partner2' : 'partner1';

      await updateSettlement(settlement.id, {
        amount: amountCents,
        paidBy,
        paidTo,
        date,
        note: note.trim() || null,
      });

      onSubmit?.();
    } catch (error) {
      console.error('Error updating settlement:', error);
      setErrors({ submit: 'Failed to update settlement. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>💸 Edit Settlement</CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Who paid?"
          options={partnerOptions}
          value={paidBy}
          onChange={(e) => setPaidBy(e.target.value)}
        />

        <div className="bg-[var(--color-cream)] p-3 text-center font-mono text-sm border-2 border-dashed border-[var(--color-plum)]/20">
          → Paid to <strong>{receivingPartner}</strong>
        </div>

        <Input
          label="Amount"
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          icon="💵"
          error={errors.amount}
        />

        <Input
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          icon="📅"
          error={errors.date}
        />

        <TextArea
          label="Note (optional)"
          placeholder="e.g., Venmo'd you!"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        {errors.submit && (
          <p className="text-red-500 text-sm font-mono">{errors.submit}</p>
        )}

        <div className="flex gap-3 pt-2">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="flex-1"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Card>
  );
}

