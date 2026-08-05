import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import PatientDashboard from './pages/PatientDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ResponderDashboard from './pages/ResponderDashboard';

// Helper component to guard private routes and roles
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRole?: 'patient' | 'admin' | 'responder' }> = ({ 
  children, 
  allowedRole 
}) => {
  const { token, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold text-slate-500">Checking credentials...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user && user.role !== allowedRole) {
    // Redirect to their default role dashboard if they hit wrong path
    if (user.role === 'admin') return <Navigate to="/admin-dashboard" replace />;
    if (user.role === 'responder') return <Navigate to="/responder-dashboard" replace />;
    return <Navigate to="/patient-dashboard" replace />;
  }

  return <>{children}</>;
};

// Redirect logged-in users away from auth pages
const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user, loading } = useAuth();

  if (loading) return null;

  if (token && user) {
    if (user.role === 'admin') return <Navigate to="/admin-dashboard" replace />;
    if (user.role === 'responder') return <Navigate to="/responder-dashboard" replace />;
    return <Navigate to="/patient-dashboard" replace />;
  }

  return <>{children}</>;
};

// Handle root path index redirect based on role
const RootRedirect: React.FC = () => {
  const { token, user, loading } = useAuth();

  if (loading) return null;

  if (token && user) {
    if (user.role === 'admin') return <Navigate to="/admin-dashboard" replace />;
    if (user.role === 'responder') return <Navigate to="/responder-dashboard" replace />;
    return <Navigate to="/patient-dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Index Route */}
          <Route path="/" element={<RootRedirect />} />

          {/* Guest Auth Routes */}
          <Route
            path="/login"
            element={
              <GuestRoute>
                <Login />
              </GuestRoute>
            }
          />
          <Route
            path="/register"
            element={
              <GuestRoute>
                <Register />
              </GuestRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <GuestRoute>
                <ForgotPassword />
              </GuestRoute>
            }
          />

          {/* Protected Dashboard Routes based on User Roles */}
          <Route
            path="/patient-dashboard"
            element={
              <ProtectedRoute allowedRole="patient">
                <PatientDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/responder-dashboard"
            element={
              <ProtectedRoute allowedRole="responder">
                <ResponderDashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
