import React, { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../../firebase';
import { Link, useNavigate } from 'react-router-dom';


export default function Signup() {
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [name, setName] = useState('');
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
console.log('[Auth] Attempting signup for', email);
const cred = await createUserWithEmailAndPassword(auth, email, password);
if (cred.user && name) {
await updateProfile(cred.user, { displayName: name });
}
console.log('[Auth] Signup success', cred.user?.uid);
nav('/dashboard');
} catch (err: any) {
console.error('[Auth] Signup error', err);
const message = err?.code ? formatAuthError(err.code) : (err.message || 'Failed to create account');
setError(message);
} finally {
setLoading(false);
}
}

function formatAuthError(code: string): string {
switch (code) {
case 'auth/email-already-in-use':
return 'This email is already in use.';
case 'auth/invalid-email':
return 'Invalid email format.';
case 'auth/operation-not-allowed':
return 'Email/password accounts are disabled.';
case 'auth/weak-password':
return 'Password is too weak.';
default:
return 'Failed to create account. Please try again.';
}
}


return (
<div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f5f7fb' }}>
<div style={{ width: 360, background: '#fff', padding: 24, borderRadius: 12, boxShadow: '0 10px 25px rgba(0,0,0,0.08)' }}>
<h2 style={{ marginTop: 0, marginBottom: 8 }}>Create your account</h2>
<p style={{ marginTop: 0, color: '#667085' }}>Join Ripple 24/7 Admin</p>
{error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: 8, borderRadius: 8, marginBottom: 12 }}>{error}</div>}
<form onSubmit={onSubmit}>
<div style={{ display: 'grid', gap: 12 }}>
<div>
<label style={{ display: 'block', fontSize: 12, color: '#475467', marginBottom: 6 }}>Full name</label>
<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" style={{ width: '100%', padding: '10px 12px', border: '1px solid #e4e7ec', borderRadius: 8 }} />
</div>
<div>
<label style={{ display: 'block', fontSize: 12, color: '#475467', marginBottom: 6 }}>Email</label>
<input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com" style={{ width: '100%', padding: '10px 12px', border: '1px solid #e4e7ec', borderRadius: 8 }} />
</div>
<div>
<label style={{ display: 'block', fontSize: 12, color: '#475467', marginBottom: 6 }}>Password</label>
<input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" style={{ width: '100%', padding: '10px 12px', border: '1px solid #e4e7ec', borderRadius: 8 }} />
</div>
<button type="submit" disabled={loading} style={{ background: '#1d4ed8', color: 'white', border: 0, borderRadius: 8, padding: '10px 12px', cursor: 'pointer' }}>{loading ? 'Creating…' : 'Create account'}</button>
<div style={{ display: 'flex', justifyContent: 'space-between' }}>
<Link to="/login" style={{ fontSize: 14, color: '#1d4ed8' }}>I already have an account</Link>
</div>
</div>
</form>
</div>
</div>
);
}


