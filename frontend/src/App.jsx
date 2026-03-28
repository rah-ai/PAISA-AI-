import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { PortfolioProvider } from './context/PortfolioContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import './index.css';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const DashboardLayout = lazy(() => import('./pages/DashboardLayout'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const XRayPage = lazy(() => import('./pages/XRayPage'));
const RadarPage = lazy(() => import('./pages/RadarPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const ImpactPage = lazy(() => import('./pages/ImpactPage'));
const RiskScorePage = lazy(() => import('./pages/RiskScorePage'));
const TaxPage = lazy(() => import('./pages/TaxPage'));
const PredictorPage = lazy(() => import('./pages/PredictorPage'));

function LoadingFallback() {
  return (
    <div style={{
      width: '100vw', height: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-void)',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div className="font-serif-display" style={{ fontSize: 24, color: 'var(--gold-mid)', marginBottom: 12 }}>
          PAISA
        </div>
        <div className="scan-line-loader" style={{ width: 200, height: 2, background: 'var(--bg-border)', borderRadius: 1 }} />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PortfolioProvider>
          <BrowserRouter>
            <Suspense fallback={<LoadingFallback />}>
              <AnimatePresence mode="wait">
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }>
                    <Route index element={<Dashboard />} />
                    <Route path="xray" element={<XRayPage />} />
                    <Route path="radar" element={<RadarPage />} />
                    <Route path="chat" element={<ChatPage />} />
                    <Route path="impact" element={<ImpactPage />} />
                    <Route path="risk" element={<RiskScorePage />} />
                    <Route path="tax" element={<TaxPage />} />
                    <Route path="predict" element={<PredictorPage />} />
                  </Route>
                </Routes>
              </AnimatePresence>
            </Suspense>
          </BrowserRouter>
        </PortfolioProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
