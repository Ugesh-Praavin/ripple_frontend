import React from 'react';
import { Routes, Route } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';
import AdminDashboard from './pages/AdminDashboard';
import SupervisorDashboard from './pages/SupervisorDashboard';

export default function App() {
  return (
    <Routes>
      <Route
        path="/admin"
        element={
          <PrivateRoute requiredRole="ADMIN">
            <AdminDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/supervisor"
        element={
          <PrivateRoute requiredRole="SUPERVISOR">
            <SupervisorDashboard />
          </PrivateRoute>
        }
      />
      {/* Redirect root to appropriate dashboard */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <div>Redirecting...</div>
          </PrivateRoute>
        }
      />
    </Routes>
  );
}
