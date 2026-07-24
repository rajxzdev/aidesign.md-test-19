'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const { user, signInWithGoogle, signInWithGoogleRedirect, loading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (user && !loading) router.push('/'); }, [user, loading, router]);

  const handleLogin = async () => {
    setError(''); setSubmitting(true);
    try { await signInWithGoogle(); }
    catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('popup')) {
        setError('Popup blocked. Redirecting...');
        setTimeout(async () => {
          try { await signInWithGoogleRedirect(); } catch { setError('Login failed.'); setSubmitting(false); }
        }, 1000);
      } else { setError(msg); setSubmitting(false); }
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--primary-container)', borderTopColor: 'transparent' }} />
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden font-sans antialiased" style={{ background: 'var(--bg)' }}>
      <div className="fixed inset-0 noise-bg opacity-50 pointer-events-none z-0" />
      
      <main className="w-full max-w-[420px] px-4 relative z-10">
        <div className="glass-card rounded-xl p-6 flex flex-col items-center text-center relative overflow-hidden">
          {/* Logo */}
          <div className="mb-6 pt-2">
            <h1 className="text-[32px] leading-[1.2] tracking-[-0.02em] font-bold flex items-center gap-2" style={{ color: 'var(--text)', fontFamily: 'Geist, sans-serif' }}>
              <svg className="w-8 h-8" fill="none" stroke="var(--primary-container)" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
              </svg>
              aidesign.md
            </h1>
          </div>

          {/* Subtitle */}
          <p className="text-[16px] leading-[1.5] mb-8 max-w-[280px]" style={{ color: 'var(--text-muted)' }}>
            The automated bridge between code and design.
          </p>

          {error && (
            <div className="w-full mb-4 p-3 rounded-lg text-sm text-center" style={{ background: 'color-mix(in srgb, var(--error) 15%, transparent)', border: '1px solid color-mix(in srgb, var(--error) 30%, transparent)', color: 'var(--error)' }}>
              {error}
            </div>
          )}

          <div className="w-full flex flex-col gap-4">
            <button
              onClick={handleLogin}
              disabled={submitting}
              className="auth-button w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg text-[14px] leading-[1.6] font-mono disabled:opacity-40 focus:outline-none focus:ring-2"
              style={{ '--focus-ring': 'var(--primary-container)' } as React.CSSProperties}
            >
              {submitting ? (
                <span className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--primary-container)', borderTopColor: 'transparent' }} />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </>
              )}
            </button>
          </div>

          <div className="mt-6 pt-4 border-t w-full flex items-center justify-center gap-2" style={{ borderColor: 'var(--glass-border)', color: 'var(--text-muted)' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ opacity: 0.8 }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            <span className="text-[12px] leading-[1.0] tracking-[0.05em] font-semibold uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>Secure Authentication</span>
          </div>
        </div>

        <p className="text-center text-[14px] leading-[1.5] mt-6" style={{ color: 'var(--text-muted)' }}>
          By continuing, you agree to our{' '}
          <a href="#" className="hover:underline transition-colors" style={{ color: 'var(--text-muted)' }}>Terms</a> &amp;{' '}
          <a href="#" className="hover:underline transition-colors" style={{ color: 'var(--text-muted)' }}>Privacy Policy</a>
        </p>
      </main>
    </div>
  );
}
