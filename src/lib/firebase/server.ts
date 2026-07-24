/**
 * Server-side Firebase using Client SDK (no Admin SDK needed).
 * Token verification via Firebase Auth REST API (uses API key, not service account).
 */
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, addDoc, query, orderBy, limit, getDocs, Timestamp, increment, deleteDoc, where } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

const isConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
let app: any = null;
let db: any = null;

if (isConfigured) {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  db = getFirestore(app);
}

export function isServerReady(): boolean {
  return db !== null && isConfigured;
}

// ─── Auth Token Verification via REST API ─────────────────

export interface VerifiedUser {
  uid: string;
  email: string;
  role: 'user' | 'admin';
}

/** Verify Firebase ID token using Auth REST API (no Admin SDK needed) */
export async function verifyToken(idToken: string): Promise<VerifiedUser> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) throw new Error('Firebase API key not configured');

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Invalid or expired token');
  }

  const data = await res.json();
  const userInfo = data.users?.[0];
  if (!userInfo) throw new Error('User not found');

  const uid = userInfo.localId;
  const email = userInfo.email || 'unknown@email.com';

  // Admin emails dari env (comma-separated)
  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const emailIsAdmin = adminEmails.includes(email.toLowerCase());

  // Get or create user doc in Firestore
  let role: 'user' | 'admin' = 'user';
  if (db) {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) {
        role = snap.data().role || 'user';
        // Upgrade ke admin kalo email cocok (antisipasi env berubah)
        if (emailIsAdmin && role !== 'admin') {
          await updateDoc(doc(db, 'users', uid), { role: 'admin' });
          role = 'admin';
        }
      } else {
        role = emailIsAdmin ? 'admin' : 'user';
        await setDoc(doc(db, 'users', uid), {
          email,
          displayName: userInfo.displayName || email.split('@')[0],
          photoURL: userInfo.photoUrl || '',
          role,
          createdAt: Timestamp.now(),
          lastActive: Timestamp.now(),
          totalAnalyses: 0,
        });
      }
    } catch {}
  }

  return { uid, email, role };
}

// ─── Rate Limit (20 minutes per user, admin unlimited) ────

const RATE_LIMIT_MS = 20 * 60 * 1000;

export interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number;
  reason?: string;
}

export async function checkUserRateLimit(uid: string, role: string): Promise<RateLimitResult> {
  if (role === 'admin') return { allowed: true };
  if (!db) return { allowed: true };

  try {
    const ref = doc(db, 'userRatelimits', uid);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const lastTime = snap.data()?.lastAnalysisAt?.toMillis?.() || snap.data()?.lastAnalysisAt || 0;
      const elapsed = Date.now() - lastTime;
      if (elapsed < RATE_LIMIT_MS) {
        const remaining = Math.ceil((RATE_LIMIT_MS - elapsed) / 1000);
        return {
          allowed: false,
          retryAfter: remaining,
          reason: `Please wait ${Math.ceil(remaining / 60)} minutes before your next analysis.`,
        };
      }
    }

    await setDoc(ref, { lastAnalysisAt: Timestamp.now() }, { merge: true });
    return { allowed: true };
  } catch {
    return { allowed: true };
  }
}

/** Update user's lastActive + totalAnalyses */
export async function touchUser(uid: string): Promise<void> {
  if (!db) return;
  try {
    await updateDoc(doc(db, 'users', uid), {
      lastActive: Timestamp.now(),
      totalAnalyses: increment(1),
    });
  } catch {
    try {
      await setDoc(doc(db, 'users', uid), {
        lastActive: Timestamp.now(),
        totalAnalyses: 1,
      }, { merge: true });
    } catch {}
  }
}

// ─── Cache ────────────────────────────────────────────────

export function urlHash(url: string, version = 'v1'): string {
  let hash = 0;
  const str = `${version}:${url.toLowerCase().trim()}`;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export interface CacheEntry {
  markdown: string;
  domain: string;
  model: string;
  createdAt: number;
}

export async function getCache(url: string): Promise<CacheEntry | null> {
  if (!db) return null;
  try {
    const ref = doc(db, 'cache', urlHash(url));
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = snap.data() as any;
    if (!data?.createdAt) return null;
    // Convert Firestore timestamp to milliseconds
    const createdAt = data.createdAt?.toMillis?.() || data.createdAt;
    if (Date.now() - createdAt > CACHE_TTL_MS) {
      await deleteDoc(ref).catch(() => {});
      return null;
    }
    return { markdown: data.markdown, domain: data.domain, model: data.model, createdAt };
  } catch { return null; }
}

export async function setCache(url: string, entry: CacheEntry): Promise<void> {
  if (!db) return;
  try {
    await setDoc(doc(db, 'cache', urlHash(url)), entry);
  } catch {}
}

// ─── Log Analysis ─────────────────────────────────────────

export async function logAnalysis(data: {
  uid: string; email: string; url: string; domain: string;
  model: string; ok: boolean; ms: number; cached: boolean;
}): Promise<void> {
  if (!db) return;
  try {
    if (Math.random() > 0.33) return; // sample 33%
    await addDoc(collection(db, 'analyses'), { ...data, createdAt: Timestamp.now() });
  } catch {}
}

// ─── Admin: User Management ───────────────────────────────

export interface UserRecord {
  uid: string;
  email: string;
  displayName?: string;
  role: 'user' | 'admin';
  createdAt?: any;
  lastActive?: any;
  totalAnalyses?: number;
}

export async function getAllUsers(): Promise<UserRecord[]> {
  if (!db) return [];
  try {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(100));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserRecord));
  } catch { return []; }
}

export async function setUserRole(uid: string, role: 'user' | 'admin'): Promise<void> {
  if (!db) throw new Error('Firebase not ready');
  await updateDoc(doc(db, 'users', uid), { role });
}

export async function getUserAnalyses(limitCount = 50): Promise<any[]> {
  if (!db) return [];
  try {
    const q = query(collection(db, 'analyses'), orderBy('createdAt', 'desc'), limit(limitCount));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch { return []; }
}
