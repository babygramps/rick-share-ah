import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { BalanceDisplay } from '../components/dashboard/BalanceDisplay';
import { ExpenseCard } from '../components/expenses/ExpenseCard';
import { SettlementCard } from '../components/settlements/SettlementCard';
import { SettleUpModal } from '../components/settlements/SettleUpModal';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import type { Expense, Settlement } from '../types';

// Union type for activity items
type ActivityItem = 
  | { type: 'expense'; data: Expense; date: string }
  | { type: 'settlement'; data: Settlement; date: string };

export function Dashboard() {
  const { expenses, settlements, balance } = useApp();
  const [showSettleModal, setShowSettleModal] = useState(false);

  // Combine and sort expenses and settlements for recent activity
  const recentActivity = useMemo<ActivityItem[]>(() => {
    const items: ActivityItem[] = [];
    
    // Add expenses
    for (const expense of expenses) {
      items.push({ type: 'expense', data: expense, date: expense.date });
    }
    
    // Add settlements
    for (const settlement of settlements) {
      items.push({ type: 'settlement', data: settlement, date: settlement.date });
    }
    
    // Sort by date descending, then by createdAt descending (most recent first)
    items.sort((a, b) => {
      const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateCompare !== 0) return dateCompare;
      
      // Same date - use createdAt for secondary sort (most recently created first)
      const aCreatedAt = a.data.createdAt ? new Date(a.data.createdAt).getTime() : 0;
      const bCreatedAt = b.data.createdAt ? new Date(b.data.createdAt).getTime() : 0;
      return bCreatedAt - aCreatedAt;
    });
    
    // Return only the 5 most recent items
    return items.slice(0, 5);
  }, [expenses, settlements]);

  const totalActivityCount = expenses.length + settlements.length;

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

      {/* Recent activity */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Recent Activity</h2>
          {totalActivityCount > 5 && (
            <Link 
              to="/history" 
              className="font-mono text-sm text-[var(--color-coral)] hover:underline"
            >
              View All →
            </Link>
          )}
        </div>

        {recentActivity.length === 0 ? (
          <Card className="text-center py-12">
            <div className="text-5xl mb-4">🌱</div>
            <h3 className="font-bold text-lg mb-2">No activity yet!</h3>
            <p className="font-mono text-sm text-[var(--color-plum)]/70 mb-6">
              Start tracking your shared expenses
            </p>
            <Link to="/add">
              <Button>Add Your First Expense</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((item, index) => (
              <div 
                key={`${item.type}-${item.data.id}`}
                className={`animate-slide-up stagger-${Math.min(index + 1, 5)}`}
                style={{ opacity: 0, animationFillMode: 'forwards' }}
              >
                {item.type === 'expense' ? (
                  <ExpenseCard expense={item.data} showActions={false} />
                ) : (
                  <SettlementCard settlement={item.data} showActions={false} />
                )}
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
