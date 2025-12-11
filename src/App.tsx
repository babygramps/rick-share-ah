import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/layout/Layout';
import { AuthForms } from './components/auth/AuthForms';
import { CoupleSetup } from './components/couple/CoupleSetup';
import { Dashboard } from './pages/Dashboard';
import { AddExpense } from './pages/AddExpense';
import { History } from './pages/History';
import { Statistics } from './pages/Statistics';
import { Settings } from './pages/Settings';

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

// Require couple setup
function RequireCouple({ children }: { children: React.ReactNode }) {
  const { couple } = useApp();

  if (!couple) {
    return <CoupleSetup />;
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
            <RequireCouple>
              <Layout>
                <Dashboard />
              </Layout>
            </RequireCouple>
          </ProtectedRoute>
        }
      />
      <Route
        path="/add"
        element={
          <ProtectedRoute>
            <RequireCouple>
              <Layout>
                <AddExpense />
              </Layout>
            </RequireCouple>
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <RequireCouple>
              <Layout>
                <History />
              </Layout>
            </RequireCouple>
          </ProtectedRoute>
        }
      />
      <Route
        path="/stats"
        element={
          <ProtectedRoute>
            <RequireCouple>
              <Layout>
                <Statistics />
              </Layout>
            </RequireCouple>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <RequireCouple>
              <Layout>
                <Settings />
              </Layout>
            </RequireCouple>
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
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;
