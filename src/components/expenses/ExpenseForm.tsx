import { useState, useEffect } from 'react';
import type { Expense } from '../../types';
import { CATEGORIES } from '../../types';
import { useApp } from '../../context/AppContext';
import { parseCurrencyInput, getTodayISO, formatDateForInput } from '../../utils/helpers';
import { normalizeDateToISO } from '../../utils/receiptParser';
import { suggestCategoryFromMerchant } from '../../utils/categoryMatcher';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import { Input, TextArea } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { ReceiptScanner } from './ReceiptScanner';

interface ExpenseFormProps {
  expense?: Expense;
  onSubmit: () => void;
  onCancel?: () => void;
}

export function ExpenseForm({ expense, onSubmit, onCancel }: ExpenseFormProps) {
  const { group, members, addExpense, updateExpense, user } = useApp();
  const isEditing = !!expense;

  const [description, setDescription] = useState(expense?.description || '');
  const [amount, setAmount] = useState(expense ? (expense.amount / 100).toFixed(2) : '');
  const [paidBy, setPaidBy] = useState(expense?.paidBy || user?.id || members[0]?.userId || '');
  const [category, setCategory] = useState(expense?.category || 'food');
  const [date, setDate] = useState(expense ? formatDateForInput(expense.date) : getTodayISO());
  const [note, setNote] = useState(expense?.note || '');

  // Split Logic
  const [splitType, setSplitType] = useState<'equal' | 'exact' | 'percentage'>(
    (expense?.splitType as any) || 'equal'
  );

  // Map of userId -> share value (amount or percentage)
  const [memberShares, setMemberShares] = useState<Record<string, string>>({});

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [aiFilled, setAiFilled] = useState<Record<string, boolean>>({});

  // Initialize shares if editing
  useEffect(() => {
    if (expense && expense.shares) {
      try {
        const parsed = JSON.parse(expense.shares);
        // Convert values to string inputs
        const shares: Record<string, string> = {};
        Object.keys(parsed).forEach(uid => {
          shares[uid] = expense.splitType === 'percentage'
            ? parsed[uid].toString()
            : (parsed[uid] / 100).toFixed(2);
        });
        setMemberShares(shares);
      } catch (e) {
        console.error("Failed to parse existing shares", e);
      }
    }
  }, [expense]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!description.trim()) {
      newErrors.description = 'What did you spend on?';
    }

    const amountCents = parseCurrencyInput(amount);
    if (!amountCents || amountCents <= 0) {
      newErrors.amount = 'Enter a valid amount';
    }

    if (splitType === 'percentage') {
      let total = 0;
      members.forEach(m => {
        const val = parseFloat(memberShares[m.userId] || '0');
        if (val < 0) newErrors[`share_${m.userId}`] = 'Cannot be negative';
        total += val;
      });
      if (Math.abs(total - 100) > 0.1) {
        newErrors.split = `Percentages must total 100% (currently ${total.toFixed(1)}%)`;
      }
    }

    if (splitType === 'exact') {
      let total = 0;
      members.forEach(m => {
        const val = parseCurrencyInput(memberShares[m.userId] || '0');
        if (val < 0) newErrors[`share_${m.userId}`] = 'Cannot be negative';
        total += val;
      });
      if (total !== amountCents) {
        newErrors.split = `Amounts must equal total (diff: ${(total - amountCents) / 100})`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const amountCents = parseCurrencyInput(amount);

    // Construct shares map
    const finalShares: Record<string, number> = {};

    if (splitType === 'equal') {
      const splitCount = members.length;
      const baseShare = Math.floor(amountCents / splitCount);
      const remainder = amountCents % splitCount;

      members.forEach((m, idx) => {
        finalShares[m.userId] = baseShare + (idx < remainder ? 1 : 0);
      });
    } else if (splitType === 'percentage') {
      let allocated = 0;
      members.forEach((m, idx) => {
        const pct = parseFloat(memberShares[m.userId] || '0');
        const share = Math.round(amountCents * (pct / 100));
        finalShares[m.userId] = share;
        allocated += share;
      });

      // Adjust for rounding errors on the last person
      const diff = amountCents - allocated;
      if (diff !== 0 && members.length > 0) {
        finalShares[members[0].userId] += diff;
      }
    } else {
      // Exact
      members.forEach(m => {
        finalShares[m.userId] = parseCurrencyInput(memberShares[m.userId] || '0');
      });
    }

    const expenseData = {
      description: description.trim(),
      amount: amountCents,
      paidBy,
      splitType,
      shares: JSON.stringify(finalShares),
      category,
      date,
      note: note.trim() || undefined,
    };

    if (isEditing && expense) {
      updateExpense(expense.id, expenseData);
    } else {
      addExpense(expenseData);
    }

    onSubmit();
  };

  const categoryOptions = CATEGORIES.map(c => ({
    value: c.id,
    label: c.label,
    emoji: c.emoji,
  }));

  const payerOptions = members.map(m => ({
    value: m.userId,
    label: m.userId === user?.id ? `${m.name} (You)` : m.name
  }));

  const splitOptions = [
    { value: 'equal', label: 'Split Equally', emoji: '⚖️' },
    { value: 'percentage', label: 'By Percentage', emoji: '📊' },
    { value: 'exact', label: 'Exact Amounts', emoji: '💵' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isEditing ? '✏️ Edit Expense' : '➕ Add Expense'}
        </CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit} className="space-y-5">
        {!isEditing && (
          <div className="flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsScannerOpen(true)}>
              🧾 Scan Receipt
            </Button>
          </div>
        )}

        <ReceiptScanner
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onApply={(payload) => {
            console.log('[receipt-scan] apply.to.form', payload);
            if (payload.description) setDescription(payload.description);
            if (payload.amountCents) setAmount((payload.amountCents / 100).toFixed(2));
            const iso = normalizeDateToISO(payload.date || null);
            if (iso) setDate(iso);
            // Basic fill only for now
          }}
        />

        {/* Description */}
        <Input
          label="What was it for?"
          placeholder="e.g., Dinner"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          error={errors.description}
          icon="📝"
        />

        {/* Amount */}
        <Input
          label="Amount"
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          error={errors.amount}
          icon="💵"
        />

        {/* Who Paid */}
        <Select
          label="Who paid?"
          options={payerOptions}
          value={paidBy}
          onChange={(e) => setPaidBy(e.target.value)}
        />

        {/* Category */}
        <Select
          label="Category"
          options={categoryOptions}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />

        {/* Date */}
        <Input
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          icon="📅"
        />

        {/* Split Type */}
        <Select
          label="How to split?"
          options={splitOptions}
          value={splitType}
          onChange={(e) => setSplitType(e.target.value as any)}
        />

        {errors.split && (
          <div className="text-[var(--color-coral)] text-sm font-bold animate-pulse">
            ⚠️ {errors.split}
          </div>
        )}

        {/* Custom split fields */}
        {splitType !== 'equal' && (
          <div className="bg-[var(--color-cream)] p-4 border-2 border-dashed border-[var(--color-plum)]/30 rounded">
            <h4 className="font-bold mb-3 text-sm uppercase text-[var(--color-plum)]/70">Split Breakdown</h4>
            <div className="space-y-3">
              {members.map(m => (
                <Input
                  key={m.userId}
                  label={m.userId === user?.id ? `${m.name} (You)` : m.name}
                  type="text"
                  inputMode="decimal"
                  placeholder={splitType === 'percentage' ? '0' : '0.00'}
                  value={memberShares[m.userId] || ''}
                  onChange={(e) => setMemberShares(prev => ({ ...prev, [m.userId]: e.target.value }))}
                  error={errors[`share_${m.userId}`]}
                  icon={splitType === 'percentage' ? '%' : '💵'}
                />
              ))}
            </div>

            {/* Helper totals */}
            {splitType === 'percentage' && (
              <div className="mt-2 text-right">
                Total: {members.reduce((acc, m) => acc + parseFloat(memberShares[m.userId] || '0'), 0).toFixed(1)}%
              </div>
            )}
            {splitType === 'exact' && (
              <div className="mt-2 text-right">
                Total: {(members.reduce((acc, m) => acc + parseCurrencyInput(memberShares[m.userId] || '0'), 0) / 100).toFixed(2)}
              </div>
            )}
          </div>
        )}

        {/* Note */}
        <TextArea
          label="Note (optional)"
          placeholder="Any extra details..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" className="flex-1">
            {isEditing ? 'Save Changes' : 'Add Expense'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
