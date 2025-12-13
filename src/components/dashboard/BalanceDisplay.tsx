import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/helpers';
import { Card } from '../ui/Card';

export function BalanceDisplay() {
  const { couple, balance } = useApp();

  const partner1Name = couple?.partner1Name || 'Partner 1';
  const partner2Name = couple?.partner2Name || 'Partner 2';

  const isSettled = Math.abs(balance.amount) < 100; // Less than $1
  const partner1Owes = balance.amount < 0;
  const owingPartner = partner1Owes ? partner1Name : partner2Name;
  const owedPartner = partner1Owes ? partner2Name : partner1Name;

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
              You're all square 💚
            </p>
          </>
        ) : (
          <>
            <div className="text-6xl mb-3">💸</div>
            <p className="font-mono text-sm uppercase tracking-wider text-[var(--color-plum)]/70 mb-2">
              {owingPartner} owes {owedPartner}
            </p>
            <h2 
              className="text-5xl font-mono font-bold"
              style={{ color: partner1Owes ? 'var(--color-coral)' : 'var(--color-sage)' }}
            >
              {formatCurrency(Math.abs(balance.amount))}
            </h2>
          </>
        )}
      </div>
    </Card>
  );
}


