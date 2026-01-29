import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/layout/Layout';
import { AuthForms } from './components/auth/AuthForms';
import { GroupSetup } from './components/group/GroupSetup';
import { Dashboard } from './pages/Dashboard';
import { AddExpense } from './pages/AddExpense';
import { History } from './pages/History';
import { Statistics } from './pages/Statistics';
import { Settings } from './pages/Settings';
import { Migration } from './pages/Migration';

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useApp();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-cream)]">
        <div className="text-center animate-bounce-in">
          <div className="text-6xl mb-4">💕</div>
          <p className="font-mono text-sm text-[var(--color-plum)]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Require group setup
function RequireGroup({ children }: { children: React.ReactNode }) {
  const { group } = useApp();

  if (!group) {
    return <GroupSetup />;
  }

  return <>{children}</>;
}

// Auth route (redirect if already logged in)
function AuthRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useApp();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-cream)]">
        <div className="text-center animate-bounce-in">
          <div className="text-6xl mb-4">💕</div>
          <p className="font-mono text-sm text-[var(--color-plum)]">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// Theme wrapper that connects ThemeProvider to user state
function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useApp();
  return (
    <ThemeProvider userId={user?.id ?? null}>
      {children}
    </ThemeProvider>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* Auth routes */}
      <Route
        path="/login"
        element={
          <AuthRoute>
            <AuthForms />
          </AuthRoute>
        }
      />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <RequireGroup>
              <Layout>
                <Dashboard />
              </Layout>
            </RequireGroup>
          </ProtectedRoute>
        }
      />
      <Route
        path="/add"
        element={
          <ProtectedRoute>
            <RequireGroup>
              <Layout>
                <AddExpense />
              </Layout>
            </RequireGroup>
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <RequireGroup>
              <Layout>
                <History />
              </Layout>
            </RequireGroup>
          </ProtectedRoute>
        }
      />
      <Route
        path="/stats"
        element={
          <ProtectedRoute>
            <RequireGroup>
              <Layout>
                <Statistics />
              </Layout>
            </RequireGroup>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <RequireGroup>
              <Layout>
                <Settings />
              </Layout>
            </RequireGroup>
          </ProtectedRoute>
        }
      />

      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <ThemeWrapper>
          <AppRoutes />
        </ThemeWrapper>
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;
