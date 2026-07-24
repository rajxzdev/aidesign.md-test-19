'use client';

import { useAuth } from './AuthProvider';
import Link from 'next/link';
import { useState } from 'react';
import ThemeToggle from './theme/ThemeToggle';

export default function Navbar() {
  const { user, role, loading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b backdrop-blur-xl" style={{ background: 'color-mix(in srgb, var(--bg) 80%, transparent)', borderColor: 'var(--glass-border)' }}>
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold" style={{ color: 'var(--text)' }}>
          <svg className="w-6 h-6" fill="none" stroke="var(--primary-container)" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
          </svg>
          <span className="hidden sm:inline text-lg" style={{ fontFamily: 'Geist, sans-serif' }}>aidesign.md</span>
        </Link>

        <div className="hidden sm:flex items-center gap-2">
          <ThemeToggle />
          {loading ? (
            <div className="w-20 h-8 rounded-lg animate-pulse" style={{ background: 'var(--surface-elevated)', border: '1px solid var(--glass-border)' }} />
          ) : user ? (
            <>
              {role === 'admin' && (
                <Link href="/admin" className="text-[14px] px-3 py-1.5 rounded-lg hover-lift" style={{ border: '1px solid var(--glass-border)', background: 'var(--surface-elevated)', color: 'var(--text-muted)' }}>
                  Admin
                </Link>
              )}
              <div className="flex items-center gap-2 text-[14px]" style={{ color: 'var(--text-muted)' }}>
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full" style={{ boxShadow: '0 0 0 2px var(--glass-border)' }} />
                ) : (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium text-white" style={{ background: 'var(--primary-container)' }}>
                    {user.email?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
                <span className="max-w-[120px] truncate">{user.displayName || user.email?.split('@')[0]}</span>
              </div>
              <button onClick={logout} className="text-[14px] px-2.5 py-1.5 rounded-lg transition-all" style={{ color: 'var(--text-muted)' }}>
                Logout
              </button>
            </>
          ) : (
            <Link href="/login" className="text-[14px] px-4 py-1.5 rounded-lg shine-btn font-medium">
              Login
            </Link>
          )}
        </div>

        <div className="sm:hidden flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <>
              {role === 'admin' && <Link href="/admin" className="text-xs px-2 py-1 rounded" style={{ border: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>Admin</Link>}
              <button onClick={() => setMenuOpen(!menuOpen)} className="p-1">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full" style={{ boxShadow: '0 0 0 2px var(--glass-border)' }} />
                ) : (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium text-white" style={{ background: 'var(--primary-container)' }}>
                    {user.email?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
              </button>
            </>
          ) : (
            <Link href="/login" className="text-sm px-3 py-1.5 rounded-lg shine-btn font-medium">Login</Link>
          )}
        </div>
      </div>

      {menuOpen && user && (
        <div className="sm:hidden border-t backdrop-blur-xl" style={{ borderColor: 'var(--glass-border)', background: 'color-mix(in srgb, var(--bg) 95%, transparent)' }}>
          <div className="px-4 py-3 space-y-2">
            <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{user.displayName || user.email?.split('@')[0]}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
            <div className="pt-2 flex gap-2">
              {role === 'admin' && <Link href="/admin" onClick={() => setMenuOpen(false)} className="text-sm px-3 py-1.5 rounded-lg" style={{ border: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>Admin</Link>}
              <button onClick={() => { logout(); setMenuOpen(false); }} className="text-sm px-3 py-1.5 rounded-lg" style={{ background: 'color-mix(in srgb, var(--error) 15%, transparent)', color: 'var(--error)' }}>Logout</button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
