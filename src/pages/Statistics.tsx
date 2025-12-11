import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { formatCurrency, getCategoryInfo, groupExpensesByMonth, formatMonthKey } from '../utils/helpers';
import { CATEGORIES } from '../types';
import type { Expense } from '../types';

type TimeRange = 'all' | '30' | '90' | '365';

export function Statistics() {
  const { expenses, couple } = useApp();
  const [timeRange, setTimeRange] = useState<TimeRange>('all');

  // Filter expenses by time range
  const filteredExpenses = useMemo(() => {
    if (timeRange === 'all') return expenses;
    
    const now = new Date();
    const daysAgo = parseInt(timeRange);
    const cutoff = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    
    return expenses.filter(exp => new Date(exp.date) >= cutoff);
  }, [expenses, timeRange]);

  // Calculate totals
  const stats = useMemo(() => {
    const totalSpending = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const partner1Spending = filteredExpenses
      .filter(exp => exp.paidBy === 'partner1')
      .reduce((sum, exp) => sum + exp.amount, 0);
    const partner2Spending = filteredExpenses
      .filter(exp => exp.paidBy === 'partner2')
      .reduce((sum, exp) => sum + exp.amount, 0);
    
    // Category breakdown
    const byCategory = CATEGORIES.map(cat => {
      const catExpenses = filteredExpenses.filter(exp => exp.category === cat.id);
      const total = catExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      return {
        ...cat,
        total,
        count: catExpenses.length,
        percentage: totalSpending > 0 ? (total / totalSpending) * 100 : 0,
      };
    }).filter(cat => cat.total > 0).sort((a, b) => b.total - a.total);

    // Monthly breakdown
    const monthlyGroups = groupExpensesByMonth(filteredExpenses);
    const monthlyData = Array.from(monthlyGroups.entries())
      .map(([key, exps]) => ({
        key,
        label: formatMonthKey(key),
        total: exps.reduce((sum, exp) => sum + exp.amount, 0),
        count: exps.length,
      }))
      .sort((a, b) => a.key.localeCompare(b.key))
      .slice(-6); // Last 6 months

    // Average per expense
    const avgExpense = filteredExpenses.length > 0 
      ? totalSpending / filteredExpenses.length 
      : 0;

    // Top expenses
    const topExpenses = [...filteredExpenses]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return {
      totalSpending,
      partner1Spending,
      partner2Spending,
      expenseCount: filteredExpenses.length,
      avgExpense,
      byCategory,
      monthlyData,
      topExpenses,
    };
  }, [filteredExpenses]);

  const maxCategoryTotal = Math.max(...stats.byCategory.map(c => c.total), 1);
  const maxMonthlyTotal = Math.max(...stats.monthlyData.map(m => m.total), 1);

  if (expenses.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">📊 Statistics</h1>
        <Card className="text-center py-12">
          <div className="text-5xl mb-4">📈</div>
          <h3 className="font-bold text-lg mb-2">No data yet!</h3>
          <p className="font-mono text-sm text-[var(--color-plum)]/70">
            Start adding expenses to see your spending insights
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">📊 Statistics</h1>
        
        {/* Time Range Selector */}
        <div className="flex gap-1 bg-white border-3 border-[var(--color-plum)] p-1">
          {[
            { value: '30' as TimeRange, label: '30D' },
            { value: '90' as TimeRange, label: '90D' },
            { value: '365' as TimeRange, label: '1Y' },
            { value: 'all' as TimeRange, label: 'All' },
          ].map(option => (
            <button
              key={option.value}
              onClick={() => setTimeRange(option.value)}
              className={`
                px-3 py-1 font-mono text-xs uppercase tracking-wider transition-colors
                ${timeRange === option.value
                  ? 'bg-[var(--color-plum)] text-white'
                  : 'hover:bg-[var(--color-cream)]'
                }
              `}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card padding="sm" className="text-center">
          <p className="font-mono text-xs uppercase tracking-wider text-[var(--color-plum)]/60 mb-1">
            Total Spent
          </p>
          <p className="text-xl font-bold text-[var(--color-coral)]">
            {formatCurrency(stats.totalSpending)}
          </p>
        </Card>
        
        <Card padding="sm" className="text-center">
          <p className="font-mono text-xs uppercase tracking-wider text-[var(--color-plum)]/60 mb-1">
            Expenses
          </p>
          <p className="text-xl font-bold">
            {stats.expenseCount}
          </p>
        </Card>
        
        <Card padding="sm" className="text-center">
          <p className="font-mono text-xs uppercase tracking-wider text-[var(--color-plum)]/60 mb-1">
            Average
          </p>
          <p className="text-xl font-bold">
            {formatCurrency(stats.avgExpense)}
          </p>
        </Card>
        
        <Card padding="sm" className="text-center">
          <p className="font-mono text-xs uppercase tracking-wider text-[var(--color-plum)]/60 mb-1">
            Categories
          </p>
          <p className="text-xl font-bold">
            {stats.byCategory.length}
          </p>
        </Card>
      </div>

      {/* Partner Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>👥 Who's Paying?</CardTitle>
        </CardHeader>
        
        <div className="space-y-4">
          {/* Partner 1 */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="font-mono text-sm font-bold">
                {couple?.partner1Name || 'Partner 1'}
              </span>
              <span className="font-mono text-sm">
                {formatCurrency(stats.partner1Spending)}
                <span className="text-[var(--color-plum)]/50 ml-2">
                  ({stats.totalSpending > 0 
                    ? Math.round((stats.partner1Spending / stats.totalSpending) * 100) 
                    : 0}%)
                </span>
              </span>
            </div>
            <div className="h-6 bg-[var(--color-cream)] border-2 border-[var(--color-plum)] overflow-hidden">
              <div 
                className="h-full bg-[var(--color-coral)] transition-all duration-500"
                style={{ 
                  width: `${stats.totalSpending > 0 
                    ? (stats.partner1Spending / stats.totalSpending) * 100 
                    : 0}%` 
                }}
              />
            </div>
          </div>

          {/* Partner 2 */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="font-mono text-sm font-bold">
                {couple?.partner2Name || 'Partner 2'}
              </span>
              <span className="font-mono text-sm">
                {formatCurrency(stats.partner2Spending)}
                <span className="text-[var(--color-plum)]/50 ml-2">
                  ({stats.totalSpending > 0 
                    ? Math.round((stats.partner2Spending / stats.totalSpending) * 100) 
                    : 0}%)
                </span>
              </span>
            </div>
            <div className="h-6 bg-[var(--color-cream)] border-2 border-[var(--color-plum)] overflow-hidden">
              <div 
                className="h-full bg-[var(--color-sky)] transition-all duration-500"
                style={{ 
                  width: `${stats.totalSpending > 0 
                    ? (stats.partner2Spending / stats.totalSpending) * 100 
                    : 0}%` 
                }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>📂 By Category</CardTitle>
        </CardHeader>
        
        <div className="space-y-3">
          {stats.byCategory.map((cat, index) => (
            <div 
              key={cat.id} 
              className="animate-slide-up"
              style={{ animationDelay: `${index * 0.05}s`, opacity: 0, animationFillMode: 'forwards' }}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="flex items-center gap-2">
                  <span className="text-lg">{cat.emoji}</span>
                  <span className="font-mono text-sm">{cat.label}</span>
                </span>
                <span className="font-mono text-sm font-bold">
                  {formatCurrency(cat.total)}
                </span>
              </div>
              <div className="h-4 bg-[var(--color-cream)] border-2 border-[var(--color-plum)] overflow-hidden">
                <div 
                  className="h-full transition-all duration-500"
                  style={{ 
                    width: `${(cat.total / maxCategoryTotal) * 100}%`,
                    backgroundColor: cat.color,
                  }}
                />
              </div>
              <p className="font-mono text-xs text-[var(--color-plum)]/50 mt-1">
                {cat.count} expense{cat.count !== 1 ? 's' : ''} · {cat.percentage.toFixed(1)}% of total
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Monthly Trend */}
      {stats.monthlyData.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>📅 Monthly Trend</CardTitle>
          </CardHeader>
          
          <div className="flex items-end gap-2 h-40">
            {stats.monthlyData.map((month, index) => (
              <div 
                key={month.key} 
                className="flex-1 flex flex-col items-center justify-end h-full"
              >
                <div 
                  className="w-full bg-[var(--color-sage)] border-2 border-[var(--color-plum)] transition-all duration-500 min-h-[8px]"
                  style={{ 
                    height: `${(month.total / maxMonthlyTotal) * 100}%`,
                  }}
                  title={`${month.label}: ${formatCurrency(month.total)}`}
                />
                <p className="font-mono text-[10px] mt-2 text-[var(--color-plum)]/70 text-center">
                  {month.label.split(' ')[0].slice(0, 3)}
                </p>
                <p className="font-mono text-[9px] text-[var(--color-plum)]/50">
                  {formatCurrency(month.total).replace('.00', '')}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Top Expenses */}
      <Card>
        <CardHeader>
          <CardTitle>💸 Biggest Expenses</CardTitle>
        </CardHeader>
        
        <div className="space-y-2">
          {stats.topExpenses.map((expense, index) => {
            const catInfo = getCategoryInfo(expense.category);
            return (
              <div 
                key={expense.id}
                className="flex items-center gap-3 p-2 bg-[var(--color-cream)] border-2 border-[var(--color-plum)]"
              >
                <span className="font-mono text-sm font-bold text-[var(--color-plum)]/50 w-5">
                  #{index + 1}
                </span>
                <span className="text-xl">{catInfo.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{expense.description}</p>
                  <p className="font-mono text-xs text-[var(--color-plum)]/60">
                    {new Date(expense.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                    {' · '}
                    {expense.paidBy === 'partner1' 
                      ? couple?.partner1Name 
                      : couple?.partner2Name}
                  </p>
                </div>
                <span className="font-mono font-bold text-[var(--color-coral)]">
                  {formatCurrency(expense.amount)}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Fun Stats */}
      <Card className="bg-[var(--color-lavender)]/20">
        <CardHeader>
          <CardTitle>✨ Fun Facts</CardTitle>
        </CardHeader>
        
        <div className="grid grid-cols-2 gap-4 font-mono text-sm">
          <div className="text-center p-3 bg-white border-2 border-[var(--color-plum)]">
            <p className="text-2xl mb-1">
              {stats.byCategory[0]?.emoji || '🤷'}
            </p>
            <p className="text-xs text-[var(--color-plum)]/60">Top Category</p>
            <p className="font-bold">{stats.byCategory[0]?.label || 'N/A'}</p>
          </div>
          
          <div className="text-center p-3 bg-white border-2 border-[var(--color-plum)]">
            <p className="text-2xl mb-1">📊</p>
            <p className="text-xs text-[var(--color-plum)]/60">Avg per Day</p>
            <p className="font-bold">
              {formatCurrency(
                timeRange === 'all' 
                  ? stats.totalSpending / Math.max(1, Math.ceil((Date.now() - new Date(expenses[expenses.length - 1]?.date || Date.now()).getTime()) / (1000 * 60 * 60 * 24)))
                  : stats.totalSpending / parseInt(timeRange === 'all' ? '30' : timeRange)
              )}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

