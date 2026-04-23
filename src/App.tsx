import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import PipelinePage from './pages/PipelinePage';
import ViewerPage from './pages/ViewerPage';
import AdminPanel from './pages/AdminPanel';
import AdminAuth from './pages/AdminAuth';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import DesignerPage from './pages/DesignerPage';
import Navbar from './components/Navbar';

const ProtectedRoute: React.FC<{ children: React.ReactNode; role?: string }> = ({ children, role }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-56px)] bg-[#0A0B0E]">
      <div className="w-12 h-12 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
      <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold animate-pulse">Synchronizing Session...</div>
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role && user.role !== 'admin') return <Navigate to="/dashboard" />;
  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans">
          <Navbar />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/admin-access" element={<AdminAuth />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/designer" element={<ProtectedRoute><DesignerPage /></ProtectedRoute>} />
            <Route path="/pipeline/:projectId" element={<ProtectedRoute><PipelinePage /></ProtectedRoute>} />
            <Route path="/viewer/:projectId" element={<ProtectedRoute><ViewerPage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute role="admin"><AdminPanel /></ProtectedRoute>} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}
