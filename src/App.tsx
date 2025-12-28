import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import PrivateRoute from "./components/PrivateRoute";
import AdminDashboard from "./pages/AdminDashboard";
import SupervisorDashboard from "./pages/SupervisorDashboard";
import { useAuth } from "./context/AuthContext";

// Component to redirect based on role
function RoleRedirect() {
  const { role } = useAuth();
  if (role === "ADMIN") {
    return <Navigate to="/admin" replace />;
  } else if (role === "SUPERVISOR") {
    return <Navigate to="/supervisor" replace />;
  }
  return <Navigate to="/login" replace />;
}

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
      {/* Redirect root to appropriate dashboard based on role */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <RoleRedirect />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}
