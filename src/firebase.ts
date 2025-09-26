import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';


const firebaseConfig = {
apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
console.error('[Firebase] Missing environment variables. Check your .env file with REACT_APP_ prefixes.', {
hasApiKey: !!firebaseConfig.apiKey,
hasAuthDomain: !!firebaseConfig.authDomain,
hasProjectId: !!firebaseConfig.projectId,
});
}


console.log('[Firebase] Initializing app...');
const app = initializeApp(firebaseConfig);
console.log('[Firebase] App initialized.');
export const auth = getAuth(app);
export const db = getFirestore(app);