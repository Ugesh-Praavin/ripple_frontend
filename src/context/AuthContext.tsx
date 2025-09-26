import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase';
import { fetchIsAdmin } from '../services/firestoreService';


export type AuthContextState = {
user: User | null;
isAdmin: boolean;
loading: boolean;
};


const AuthContext = createContext<AuthContextState>({ user: null, isAdmin: false, loading: true });


export function AuthProvider({ children }: { children: React.ReactElement }) {
const [user, setUser] = useState<User | null>(null);
const [isAdmin, setIsAdmin] = useState<boolean>(false);
const [loading, setLoading] = useState<boolean>(true);

useEffect(() => {
console.log('[AuthProvider] Mount: subscribe auth state');
const unsub = onAuthStateChanged(auth, async (u) => {
console.log('[AuthProvider] onAuthStateChanged', !!u, u?.uid);
setUser(u);
if (u) {
setLoading(true);
try {
const admin = await fetchIsAdmin(u.uid);
console.log('[AuthProvider] Role fetched, isAdmin =', admin);
setIsAdmin(!!admin);
} catch (e) {
console.error('[AuthProvider] Failed to fetch role', e);
setIsAdmin(false);
} finally {
setLoading(false);
}
} else {
setIsAdmin(false);
setLoading(false);
}
});
return unsub;
}, []);

const value = useMemo<AuthContextState>(() => ({ user, isAdmin, loading }), [user, isAdmin, loading]);
return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}


export function useAuth() {
return useContext(AuthContext);
}


