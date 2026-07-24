import { NextRequest, NextResponse } from 'next/server';
import { isServerReady, verifyToken, getAllUsers, setUserRole } from '@/lib/firebase/server';

export const dynamic = 'force-dynamic';

const firebaseReady = isServerReady();

async function requireAdmin(request: NextRequest) {
  const auth = request.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  try {
    const user = await verifyToken(auth.slice(7));
    if (user.role !== 'admin') return null;
    return user;
  } catch { return null; }
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  if (!firebaseReady) return NextResponse.json({ ok: false, error: 'Firebase not configured' }, { status: 500 });
  const users = await getAllUsers();
  return NextResponse.json({ ok: true, users });
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  if (!firebaseReady) return NextResponse.json({ ok: false, error: 'Firebase not configured' }, { status: 500 });

  try {
    const body = await request.json();
    const { uid, role } = body;
    if (!uid || !['user', 'admin'].includes(role)) {
      return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
    }
    if (uid === admin.uid && role !== 'admin') {
      return NextResponse.json({ ok: false, error: 'Cannot demote yourself' }, { status: 400 });
    }
    await setUserRole(uid, role);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: 'Failed to update user' }, { status: 500 });
  }
}
