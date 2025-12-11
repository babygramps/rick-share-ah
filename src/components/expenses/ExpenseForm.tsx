import { useState } from 'react';
import type { Expense, ExpenseCategory } from '../../types';
import { CATEGORIES } from '../../types';
import { useApp } from '../../context/AppContext';
import { parseCurrencyInput, getTodayISO, formatDateForInput } from '../../utils/helpers';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import { Input, TextArea } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';

interface ExpenseFormProps {
  expense?: Expense;
  onSubmit: () => void;
  onCancel?: () => void;
}

export function ExpenseForm({ expense, onSubmit, onCancel }: ExpenseFormProps) {
  const { couple, addExpense, updateExpense } = useApp();
  const isEditing = !!expense;

  const [description, setDescription] = useState(expense?.description || '');
  const [amount, setAmount] = useState(expense ? (expense.amount / 100).toFixed(2) : '');
  const [paidBy, setPaidBy] = useState<'partner1' | 'partner2'>(expense?.paidBy || 'partner1');
  const [splitType, setSplitType] = useState<'equal' | 'percentage' | 'exact'>(expense?.splitType || 'equal');
  const [partner1Share, setPartner1Share] = useState(expense?.partner1Share?.toString() || '50');
  const [category, setCategory] = useState<ExpenseCategory>(expense?.category || 'food');
  const [date, setDate] = useState(expense ? formatDateForInput(expense.date) : getTodayISO());
  const [note, setNote] = useState(expense?.note || '');

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculate partner2Share based on splitType
  const partner2Share = splitType === 'percentage' 
    ? (100 - parseFloat(partner1Share || '0')).toString()
    : splitType === 'exact'
    ? (parseCurrencyInput(amount) - parseCurrencyInput(partner1Share)).toString()
    : '50';

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
      const p1 = parseFloat(partner1Share);
      if (isNaN(p1) || p1 < 0 || p1 > 100) {
        newErrors.partner1Share = 'Must be 0-100%';
      }
    }

    if (splitType === 'exact') {
      const p1 = parseCurrencyInput(partner1Share);
      if (p1 > amountCents) {
        newErrors.partner1Share = "Can't be more than total";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const amountCents = parseCurrencyInput(amount);
    const expenseData = {
      description: description.trim(),
      amount: amountCents,
      paidBy,
      splitType,
      partner1Share: splitType === 'percentage' 
        ? parseFloat(partner1Share) 
        : splitType === 'exact'
        ? parseCurrencyInput(partner1Share)
        : 50,
      partner2Share: splitType === 'percentage'
        ? 100 - parseFloat(partner1Share)
        : splitType === 'exact'
        ? amountCents - parseCurrencyInput(partner1Share)
        : 50,
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

  const partnerOptions = [
    { value: 'partner1', label: couple?.partner1Name || 'Partner 1' },
    { value: 'partner2', label: couple?.partner2Name || 'Partner 2' },
  ];

  const splitOptions = [
    { value: 'equal', label: '50/50 Split', emoji: '⚖️' },
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
        {/* Description */}
        <Input
          label="What was it for?"
          placeholder="e.g., Dinner at Luigi's"
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
          options={partnerOptions}
          value={paidBy}
          onChange={(e) => setPaidBy(e.target.value as 'partner1' | 'partner2')}
        />

        {/* Category */}
        <Select
          label="Category"
          options={categoryOptions}
          value={category}
          onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
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
          onChange={(e) => setSplitType(e.target.value as 'equal' | 'percentage' | 'exact')}
        />

        {/* Custom split fields */}
        {splitType !== 'equal' && (
          <div className="bg-[var(--color-cream)] p-4 border-2 border-dashed border-[var(--color-plum)]/30">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={`${couple?.partner1Name || 'Partner 1'}'s share`}
                type="text"
                inputMode="decimal"
                placeholder={splitType === 'percentage' ? '50' : '0.00'}
                value={partner1Share}
                onChange={(e) => setPartner1Share(e.target.value)}
                error={errors.partner1Share}
              />
              <div>
                <label className="block font-mono text-sm font-bold uppercase tracking-wider mb-2 text-[var(--color-plum)]">
                  {couple?.partner2Name || 'Partner 2'}'s share
                </label>
                <div className="input-brutal px-4 py-3 bg-[var(--color-plum)]/5">
                  {splitType === 'percentage' 
                    ? `${partner2Share}%` 
                    : `$${(parseFloat(partner2Share) / 100).toFixed(2)}`}
                </div>
              </div>
            </div>
            {splitType === 'percentage' && (
              <p className="mt-2 font-mono text-xs text-[var(--color-plum)]/60">
                Enter percentages that add up to 100%
              </p>
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

