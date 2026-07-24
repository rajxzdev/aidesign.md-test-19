import { NextRequest, NextResponse } from 'next/server';
import { isServerReady, verifyToken, getUserAnalyses } from '@/lib/firebase/server';

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

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
  const analyses = await getUserAnalyses(limit);
  return NextResponse.json({ ok: true, analyses });
}
