/**
 * Rate limiting is now handled per-user via Firestore (20 min cooldown).
 * This file is kept for the in-memory fallback when Firebase is not available.
 */

const inMemoryCounts = new Map<string, { lastTime: number }>();
const RATE_LIMIT_MS = 20 * 60 * 1000;

export function checkRateLimitFallback(uid: string): { allowed: boolean; retryAfter?: number; reason?: string } {
  const now = Date.now();
  const existing = inMemoryCounts.get(uid);

  if (existing) {
    const elapsed = now - existing.lastTime;
    if (elapsed < RATE_LIMIT_MS) {
      return {
        allowed: false,
        retryAfter: Math.ceil((RATE_LIMIT_MS - elapsed) / 1000),
        reason: `Please wait ${Math.ceil((RATE_LIMIT_MS - elapsed) / 60000)} minutes before your next analysis.`,
      };
    }
  }

  inMemoryCounts.set(uid, { lastTime: now });
  return { allowed: true };
}
