import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import FinanceHeader from './components/FinanceHeader';
import HomePage from './pages/HomePage';
import IncomePage from './pages/IncomePage';
import FixedExpensesPage from './pages/FixedExpensesPage';
import EKhataLedgerPage from './pages/EKhataLedgerPage';
import ProfilePage from './pages/ProfilePage';
import PredictionPage from './pages/PredictionPage';
import ScenarioSimulatorPage from './pages/ScenarioSimulatorPage';
import AuthPage from './pages/AuthPage';
import HowItWorksPage from './pages/HowItWorksPage';

import { useAuth } from './context/AuthContext';

/**
 * Route protection wrapper:
 * Redirects unauthenticated visitors to /login
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export default function App() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  const isProfilePage = location.pathname === '/profile';
  const isHowItWorksPage = location.pathname === '/how-it-works';
  const isFixedLayout = isLoginPage || isProfilePage;

  // Ensure body and documentElement never scroll when on sticky pages like /profile or /login
  React.useEffect(() => {
    if (isFixedLayout) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isFixedLayout]);

  return (
    <div className={`min-h-screen bg-white text-neutral-900 flex flex-col selection:bg-amber-300 selection:text-black ${isFixedLayout ? 'h-screen max-h-screen overflow-hidden' : ''}`}>
      {/* Sleek Navigation Bar */}
      {!isLoginPage && !isHowItWorksPage && <FinanceHeader />}

      {/* Routed Main Content */}
      <main className={`flex-1 w-full bg-white ${isLoginPage ? 'h-screen max-h-screen overflow-hidden pb-0' : isProfilePage ? 'h-[calc(100vh-64px)] max-h-[calc(100vh-64px)] overflow-hidden pb-0' : 'pb-20 lg:pb-0'}`}>
        <Routes>
          {/* Public Authentication Route */}
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/" replace /> : <AuthPage />}
          />

          {/* Standalone Story Page: How FinSafe Works */}
          <Route path="/how-it-works" element={<HowItWorksPage />} />

          {/* 1. Home Page: Runway, Payables & Receivables all together */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />

          {/* 2. Today's Live Income Page */}
          <Route
            path="/income"
            element={
              <ProtectedRoute>
                <IncomePage />
              </ProtectedRoute>
            }
          />

          {/* 3. Monthly Fixed Expenses Page */}
          <Route
            path="/fixed-expenses"
            element={
              <ProtectedRoute>
                <FixedExpensesPage />
              </ProtectedRoute>
            }
          />

          {/* 4. eKhata Smart Voice Ledger Page */}
          <Route
            path="/ekhata"
            element={
              <ProtectedRoute>
                <EKhataLedgerPage />
              </ProtectedRoute>
            }
          />

          {/* 5. Merchant Profile & Executive Financial Overview */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* 6. AI Financial Prediction Page (NVIDIA Nemotron 70B) */}
          <Route
            path="/prediction"
            element={
              <ProtectedRoute>
                <PredictionPage />
              </ProtectedRoute>
            }
          />

          {/* 7. Scenario Simulator Page */}
          <Route
            path="/simulator"
            element={
              <ProtectedRoute>
                <ScenarioSimulatorPage />
              </ProtectedRoute>
            }
          />

          {/* Direct redirects */}

          <Route path="/overview" element={<Navigate to="/profile" replace />} />
          <Route path="/runway" element={<Navigate to="/#runway" replace />} />
          <Route path="/upcoming-expenses" element={<Navigate to="/#payables" replace />} />
          <Route path="/receivables" element={<Navigate to="/#receivables" replace />} />

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
