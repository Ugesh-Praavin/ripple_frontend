import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../firebase';
import { Link } from 'react-router-dom';


export default function ResetPassword() {
const [email, setEmail] = useState('');
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [sent, setSent] = useState(false);


async function onSubmit(e: React.FormEvent) {
e.preventDefault();
setError(null);
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
setError('Please enter a valid email.');
return;
}
setLoading(true);
try {
console.log('[Auth] Sending reset email to', email);
await sendPasswordResetEmail(auth, email);
console.log('[Auth] Reset email sent');
setSent(true);
} catch (err: any) {
console.error('[Auth] Reset error', err);
const message = err?.code ? formatAuthError(err.code) : (err.message || 'Failed to send reset email');
setError(message);
} finally {
setLoading(false);
}
}

function formatAuthError(code: string): string {
switch (code) {
case 'auth/invalid-email':
return 'Invalid email format.';
case 'auth/user-not-found':
return 'No user found with this email.';
default:
return 'Failed to send reset email.';
}
}


return (
<div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f5f7fb' }}>
<div style={{ width: 360, background: '#fff', padding: 24, borderRadius: 12, boxShadow: '0 10px 25px rgba(0,0,0,0.08)' }}>
<h2 style={{ marginTop: 0, marginBottom: 8 }}>Reset password</h2>
<p style={{ marginTop: 0, color: '#667085' }}>We'll email you a reset link</p>
{error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: 8, borderRadius: 8, marginBottom: 12 }}>{error}</div>}
{sent ? (
<div style={{ background: '#dcfce7', color: '#166534', padding: 8, borderRadius: 8, marginBottom: 12 }}>Check your inbox for the reset link.</div>
) : (
<form onSubmit={onSubmit}>
<div style={{ display: 'grid', gap: 12 }}>
<div>
<label style={{ display: 'block', fontSize: 12, color: '#475467', marginBottom: 6 }}>Email</label>
<input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com" style={{ width: '100%', padding: '10px 12px', border: '1px solid #e4e7ec', borderRadius: 8 }} />
</div>
<button type="submit" disabled={loading} style={{ background: '#1d4ed8', color: 'white', border: 0, borderRadius: 8, padding: '10px 12px', cursor: 'pointer' }}>{loading ? 'Sending…' : 'Send reset link'}</button>
<div style={{ display: 'flex', justifyContent: 'space-between' }}>
<Link to="/login" style={{ fontSize: 14, color: '#1d4ed8' }}>Back to login</Link>
</div>
</div>
</form>
)}
</div>
</div>
);
}


