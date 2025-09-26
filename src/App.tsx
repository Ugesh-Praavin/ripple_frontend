import React from 'react';
import Reports from './pages/Reports';
import PrivateRoute from './components/PrivateRoute';
import AppLayout from './components/AppLayout';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import { Routes, Route } from 'react-router-dom';


export default function App() {
return (
<Routes>
<Route path="/" element={
<PrivateRoute>
<AppLayout><Dashboard /></AppLayout>
</PrivateRoute>
} />
<Route path="/dashboard" element={
<PrivateRoute>
<AppLayout><Dashboard /></AppLayout>
</PrivateRoute>
} />
<Route path="/reports" element={
<PrivateRoute>
<AppLayout><Reports /></AppLayout>
</PrivateRoute>
} />
<Route path="/settings" element={
<PrivateRoute>
<AppLayout><Settings /></AppLayout>
</PrivateRoute>
} />
</Routes>
);
}