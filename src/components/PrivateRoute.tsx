import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';


type Props = { children: React.ReactElement };


export default function PrivateRoute({ children }: Props) {
const { user, isAdmin, loading } = useAuth();
console.log('[RouteGuard] user', !!user, 'loading', loading, 'isAdmin', isAdmin);
if (loading) return <div style={{ padding: 20 }}>Checking permissions…</div>;
if (!user) return <Navigate to="/login" replace />;
if (!isAdmin) return <div style={{ padding: 20 }}>Access denied. You are not an admin.</div>;
console.log('[RouteGuard] access granted');
return children;
}