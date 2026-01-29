import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/helpers';
import { Card } from '../ui/Card';

export function BalanceDisplay() {
  const { members, balance, user } = useApp();

  const isSettled = Math.abs(balance.amount) < 100 && (!balance.suggestedPayments || balance.suggestedPayments.length === 0);
  const isCoupleMode = members.length === 2;

  // User's net position
  const userNet = balance.amount;
  const isOwed = userNet > 0;
  const isOwing = userNet < 0;

  // Resolve names helper
  const getName = (userId: string) => {
    if (userId === user?.id) return 'You';
    return members.find(m => m.userId === userId)?.name || 'Unknown';
  };

  // Get the other person's name in couple mode
  const getPartnerName = () => {
    const partner = members.find(m => m.userId !== user?.id);
    return partner?.name || 'your partner';
  };

  // Build the main balance text
  const getBalanceText = () => {
    if (userNet === 0) return 'All Square';
    if (isCoupleMode) {
      // In couple mode, include the partner's name
      if (isOwing) {
        return `You owe ${getPartnerName()} ${formatCurrency(Math.abs(userNet))}`;
      } else {
        return `${getPartnerName()} owes you ${formatCurrency(userNet)}`;
      }
    } else {
      // In group mode, just show the amount
      if (isOwing) {
        return `You owe ${formatCurrency(Math.abs(userNet))}`;
      } else {
        return `You get ${formatCurrency(userNet)}`;
      }
    }
  };

  return (
    <Card className="text-center animate-bounce-in" padding="lg">
      {/* Balance status */}
      <div>
        {isSettled ? (
          <>
            <div className="text-6xl mb-3">✨</div>
            <h2 className="text-2xl font-bold text-[var(--color-sage)]">
              All Settled Up!
            </h2>
            <p className="font-mono text-sm text-[var(--color-plum)]/70 mt-1">
              Everyone is square 💚
            </p>
          </>
        ) : (
          <>
            <div className="text-6xl mb-3">
              {userNet === 0 ? '⚖️' : (isOwed ? '💰' : '💸')}
            </div>

            {/* Main User Status */}
            <div className="mb-6">
              <p className="font-mono text-sm uppercase tracking-wider text-[var(--color-plum)]/70 mb-2">
                Your Net Position
              </p>
              <h2
                className="text-5xl font-mono font-bold"
                style={{ color: isOwing ? 'var(--color-coral)' : (isOwed ? 'var(--color-sage)' : 'var(--color-plum)') }}
              >
                {getBalanceText()}
              </h2>
            </div>

            {/* Suggested Payments (Simplified Debts) - Only show in group mode */}
            {!isCoupleMode && balance.suggestedPayments && balance.suggestedPayments.length > 0 && (
              <div className="mt-6 pt-6 border-t-2 border-dashed border-[var(--color-plum)]/10 text-left">
                <p className="font-mono text-xs uppercase tracking-wider text-[var(--color-plum)]/50 mb-3 text-center">
                  Suggested Payments
                </p>
                <div className="space-y-2">
                  {balance.suggestedPayments.map((payment, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm font-mono bg-[var(--color-cream)] p-2 rounded border border-[var(--color-plum)]/10">
                      <span>
                        <span className="font-bold text-[var(--color-coral)]">{getName(payment.fromUserId)}</span>
                        <span className="mx-2 text-[var(--color-plum)]/50">→</span>
                        <span className="font-bold text-[var(--color-sage)]">{getName(payment.toUserId)}</span>
                      </span>
                      <span className="font-bold">{formatCurrency(payment.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
