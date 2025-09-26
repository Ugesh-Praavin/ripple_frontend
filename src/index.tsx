import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import ResetPassword from './pages/Auth/ResetPassword';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import './index.css';


createRoot(document.getElementById('root')!).render(
<React.StrictMode>
<BrowserRouter>
<AuthProvider>
<ToastProvider>
<Routes>
<Route path="/login" element={<Login />} />
<Route path="/signup" element={<Signup />} />
<Route path="/reset" element={<ResetPassword />} />
<Route path="/*" element={<App />} />
</Routes>
</ToastProvider>
</AuthProvider>
</BrowserRouter>
</React.StrictMode>
);