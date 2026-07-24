'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase/client';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export type UserRole = 'user' | 'admin';

interface AuthContextValue {
  user: User | null;
  role: UserRole | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithGoogleRedirect: () => Promise<void>;
  logout: () => Promise<void>;
  getIdToken: () => Promise<string>;
}

const AuthContext = createContext<AuthContextValue>({} as AuthContextValue);

export function useAuth() {
  return useContext(AuthContext);
}

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  const ensureUserDoc = async (firebaseUser: User) => {
    if (!db) return;
    const userEmail = firebaseUser.email?.toLowerCase() || '';
    const isAdmin = ADMIN_EMAILS.includes(userEmail);
    const newRole: UserRole = isAdmin ? 'admin' : 'user';

    try {
      const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (!snap.exists()) {
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          photoURL: firebaseUser.photoURL || '',
          role: newRole,
          createdAt: serverTimestamp(),
          lastActive: serverTimestamp(),
          totalAnalyses: 0,
        });
      } else {
        if (isAdmin && snap.data().role !== 'admin') {
          await setDoc(doc(db, 'users', firebaseUser.uid), { role: 'admin' }, { merge: true });
        }
      }
      setRole(newRole);
    } catch {
      setRole('user');
    }
  };

  // Handle redirect result (when user comes back from Google)
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    // Check if returning from redirect sign-in
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          // Redirect login successful, onAuthStateChanged will handle it
          console.log('Redirect sign-in successful');
        }
      })
      .catch((error) => {
        // Redirect error - will be caught by signInWithGoogleRedirect
        console.error('Redirect result error:', error.code);
      });

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await ensureUserDoc(firebaseUser);
      } else {
        setRole(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Popup-based (fast, but can be blocked)
  const signInWithGoogle = async () => {
    if (!auth) throw new Error('Firebase Auth not configured');
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    await signInWithPopup(auth, provider);
  };

  // Redirect-based (no popup blocker issues, reliable)
  const signInWithGoogleRedirect = async () => {
    if (!auth) throw new Error('Firebase Auth not configured');
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    await signInWithRedirect(auth, provider);
    // Page will redirect to Google, then come back
  };

  const logout = async () => {
    if (!auth) return;
    await signOut(auth);
    setRole(null);
  };

  const getIdToken = async (): Promise<string> => {
    if (!user) throw new Error('Not authenticated');
    return user.getIdToken();
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, signInWithGoogle, signInWithGoogleRedirect, logout, getIdToken }}>
      {children}
    </AuthContext.Provider>
  );
}
