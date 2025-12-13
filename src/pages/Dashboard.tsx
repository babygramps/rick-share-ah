import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { BalanceDisplay } from '../components/dashboard/BalanceDisplay';
import { ExpenseCard } from '../components/expenses/ExpenseCard';
import { SettleUpModal } from '../components/settlements/SettleUpModal';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export function Dashboard() {
  const { expenses, balance } = useApp();
  const [showSettleModal, setShowSettleModal] = useState(false);

  // Get recent expenses (last 5)
  const recentExpenses = expenses.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Balance card */}
      <BalanceDisplay />

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-4">
        <Link to="/add">
          <Button variant="primary" size="lg" className="w-full">
            ➕ Add Expense
          </Button>
        </Link>
        <Button 
          variant="secondary" 
          size="lg" 
          onClick={() => setShowSettleModal(true)}
          disabled={Math.abs(balance.amount) < 100}
        >
          💰 Settle Up
        </Button>
      </div>

      {/* Recent expenses */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Recent Activity</h2>
          {expenses.length > 5 && (
            <Link 
              to="/history" 
              className="font-mono text-sm text-[var(--color-coral)] hover:underline"
            >
              View All →
            </Link>
          )}
        </div>

        {recentExpenses.length === 0 ? (
          <Card className="text-center py-12">
            <div className="text-5xl mb-4">🌱</div>
            <h3 className="font-bold text-lg mb-2">No expenses yet!</h3>
            <p className="font-mono text-sm text-[var(--color-plum)]/70 mb-6">
              Start tracking your shared expenses
            </p>
            <Link to="/add">
              <Button>Add Your First Expense</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {recentExpenses.map((expense, index) => (
              <div 
                key={expense.id} 
                className={`animate-slide-up stagger-${Math.min(index + 1, 5)}`}
                style={{ opacity: 0, animationFillMode: 'forwards' }}
              >
                <ExpenseCard expense={expense} showActions={false} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Settle Up Modal */}
      <SettleUpModal 
        isOpen={showSettleModal} 
        onClose={() => setShowSettleModal(false)} 
      />
    </div>
  );
}


