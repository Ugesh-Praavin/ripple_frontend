import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type Props = {
  children: React.ReactElement;
  requiredRole?: 'ADMIN' | 'SUPERVISOR';
};

export default function PrivateRoute({ children, requiredRole }: Props) {
  const { user, role, loading } = useAuth();

  console.log('[PrivateRoute] user', !!user, 'role', role, 'loading', loading, 'requiredRole', requiredRole);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Checking permissions…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-2">Access denied.</p>
          <p className="text-gray-600">Unable to determine your role.</p>
        </div>
      </div>
    );
  }

  // Redirect to correct dashboard if wrong role
  if (requiredRole && role !== requiredRole) {
    if (role === 'ADMIN') {
      return <Navigate to="/admin" replace />;
    } else if (role === 'SUPERVISOR') {
      return <Navigate to="/supervisor" replace />;
    }
  }

  // If no required role specified, redirect based on user's role
  if (!requiredRole) {
    if (role === 'ADMIN') {
      return <Navigate to="/admin" replace />;
    } else if (role === 'SUPERVISOR') {
      return <Navigate to="/supervisor" replace />;
    }
  }

  console.log('[PrivateRoute] access granted');
  return children;
}
