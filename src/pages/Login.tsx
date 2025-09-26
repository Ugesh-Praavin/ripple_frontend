import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';


export default function Login() {
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [loading, setLoading] = useState(false);
const [err, setErr] = useState('');
const nav = useNavigate();


const submit = async (e: React.FormEvent) => {
e.preventDefault();
setLoading(true);
setErr('');
try {
await signInWithEmailAndPassword(auth, email, password);
nav('/');
} catch (error: any) {
setErr(error.message || 'Failed to sign in');
} finally {
setLoading(false);
}
};


return (
<div style={{ maxWidth: 420, margin: '40px auto' }}>
<h2>Admin Login</h2>
<form onSubmit={submit}>
<input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
<input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" />
<button type="submit" disabled={loading}>Sign in</button>
</form>
{err && <p style={{ color: 'red' }}>{err}</p>}
</div>
);
}