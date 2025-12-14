import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import { useAuthStore } from './store/authStore';
import Login from './pages/login';
import type { ReactNode } from 'react';

// Protected Route Component
function ProtectedRoute({ children }: { children: ReactNode }) {
  const token = useAuthStore((state) => state.token);
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
