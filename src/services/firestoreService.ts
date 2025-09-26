import {
    collection,
    doc,
    onSnapshot,
    query,
    orderBy,
    updateDoc,
    getDoc,
    } from 'firebase/firestore';
import { db } from '../firebase';
    import { Report } from '../types';
    
    
    const reportsRef = collection(db, 'reports');
    
    
    export function subscribeReports(callback: (reports: Report[]) => void) {
    const q = query(reportsRef, orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
    const arr: Report[] = [];
    snap.forEach((d) => arr.push({ id: d.id, ...(d.data() as any) }));
    callback(arr);
    });
    return unsub;
    }
    
    
    export async function updateReportStatus(reportId: string, status: string, resolvedPhotoUrl?: string) {
    const r = doc(db, 'reports', reportId);
    const data: any = { status };
    if (resolvedPhotoUrl) {
    data.resolvedPhotoUrl = resolvedPhotoUrl;
    data.resolvedAt = new Date();
    }
    await updateDoc(r, data);
    }
    
    
export async function isAdmin(uid: string) {
    // Backward-compat: check admins collection for uid
    const adminDoc = doc(db, 'admins', uid);
    const snap = await getDoc(adminDoc);
    return snap.exists();
    }

    // Preferred helper: resolve admin via either users role or admins collection
    export async function fetchIsAdmin(uid: string): Promise<boolean> {
    try {
    // Option b) users/<uid> with role field
    const userDoc = doc(db, 'users', uid);
    const userSnap = await getDoc(userDoc);
    if (userSnap.exists()) {
    const data = userSnap.data() as any;
    const admin = data?.role === 'admin' || data?.isAdmin === true;
    console.log('[Role] users doc found, role =', data?.role, 'isAdmin =', admin);
    if (admin) return true;
    }
    // Fallback to admins collection
    const adminDoc = doc(db, 'admins', uid);
    const adminSnap = await getDoc(adminDoc);
    const exists = adminSnap.exists();
    console.log('[Role] admins collection exists =', exists);
    return exists;
    } catch (e) {
    console.error('[Role] fetchIsAdmin error', e);
    return false;
    }
    }