import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase';
import { Link, useNavigate } from 'react-router-dom';


export default function Login() {
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const nav = useNavigate();


async function onSubmit(e: React.FormEvent) {
e.preventDefault();
setError(null);
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
setError('Please enter a valid email.');
return;
}
if (password.length < 6) {
setError('Password must be at least 6 characters.');
return;
}
setLoading(true);
try {
console.log('[Auth] Attempting login for', email);
const cred = await signInWithEmailAndPassword(auth, email, password);
console.log('[Auth] Login success', cred.user?.uid);
nav('/dashboard');
} catch (err: any) {
console.error('[Auth] Login error', err);
const message = err?.code ? formatAuthError(err.code) : (err.message || 'Failed to sign in');
setError(message);
} finally {
setLoading(false);
}
}

function formatAuthError(code: string): string {
switch (code) {
case 'auth/invalid-email':
return 'Invalid email format.';
case 'auth/user-disabled':
return 'User account has been disabled.';
case 'auth/user-not-found':
return 'No user found with this email.';
case 'auth/wrong-password':
return 'Incorrect password.';
case 'auth/too-many-requests':
return 'Too many attempts. Please try again later.';
default:
return 'Authentication failed. Please check your credentials.';
}
}


return (
<div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f5f7fb' }}>
<div style={{ width: 360, background: '#fff', padding: 24, borderRadius: 12, boxShadow: '0 10px 25px rgba(0,0,0,0.08)' }}>
<h2 style={{ marginTop: 0, marginBottom: 8 }}>Welcome back</h2>
<p style={{ marginTop: 0, color: '#667085' }}>Sign in to Ripple 24/7 Admin</p>
{error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: 8, borderRadius: 8, marginBottom: 12 }}>{error}</div>}
<form onSubmit={onSubmit}>
<div style={{ display: 'grid', gap: 12 }}>
<div>
<label style={{ display: 'block', fontSize: 12, color: '#475467', marginBottom: 6 }}>Email</label>
<input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com" style={{ width: '100%', padding: '10px 12px', border: '1px solid #e4e7ec', borderRadius: 8 }} />
</div>
<div>
<label style={{ display: 'block', fontSize: 12, color: '#475467', marginBottom: 6 }}>Password</label>
<input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" style={{ width: '100%', padding: '10px 12px', border: '1px solid #e4e7ec', borderRadius: 8 }} />
</div>
<button type="submit" disabled={loading} style={{ background: '#1d4ed8', color: 'white', border: 0, borderRadius: 8, padding: '10px 12px', cursor: 'pointer' }}>{loading ? 'Signing in…' : 'Sign in'}</button>
<div style={{ display: 'flex', justifyContent: 'space-between' }}>
<Link to="/signup" style={{ fontSize: 14, color: '#1d4ed8' }}>Create account</Link>
<Link to="/reset" style={{ fontSize: 14, color: '#1d4ed8' }}>Forgot password?</Link>
</div>
</div>
</form>
</div>
</div>
);
}


