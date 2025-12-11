import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, couple, logout } = useApp();
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', emoji: '🏠' },
    { path: '/add', label: 'Add', emoji: '➕' },
    { path: '/history', label: 'History', emoji: '📋' },
    { path: '/settings', label: 'Settings', emoji: '⚙️' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-[var(--color-plum)] text-white border-b-4 border-black">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-3xl">💕</span>
            <div>
              <h1 className="font-mono text-xl font-bold tracking-tight">
                {couple?.name || 'Rick & Share-ah'}
              </h1>
              {couple && (
                <p className="text-xs opacity-80 font-mono">
                  {couple.partner1Name} {couple.partner2Name ? `& ${couple.partner2Name}` : ''}
                </p>
              )}
            </div>
          </Link>

          {user && (
            <button
              onClick={logout}
              className="font-mono text-sm uppercase tracking-wider hover:text-[var(--color-sunshine)] transition-colors"
            >
              Logout
            </button>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        {children}
      </main>

      {/* Bottom navigation - mobile style */}
      {user && couple && (
        <nav className="bg-white border-t-4 border-[var(--color-plum)] sticky bottom-0">
          <div className="max-w-4xl mx-auto flex">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex-1 flex flex-col items-center py-3 px-2
                  font-mono text-xs uppercase tracking-wider
                  transition-colors
                  ${isActive(item.path)
                    ? 'bg-[var(--color-sunshine)] text-[var(--color-plum)] font-bold'
                    : 'text-[var(--color-plum)] hover:bg-[var(--color-cream)]'
                  }
                `}
              >
                <span className="text-xl mb-1">{item.emoji}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}

