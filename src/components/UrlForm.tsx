'use client';

import { useState, FormEvent } from 'react';

interface UrlFormProps { onSubmit: (url: string) => void; isLoading: boolean }

const EXAMPLES = [
  { label: 'stripe.com', url: 'https://stripe.com' },
  { label: 'linear.app', url: 'https://linear.app' },
  { label: 'vercel.com', url: 'https://vercel.com' },
];

export default function UrlForm({ onSubmit, isLoading }: UrlFormProps) {
  const [url, setUrl] = useState('');

  const handle = (e: FormEvent) => { e.preventDefault(); if (url.trim() && !isLoading) onSubmit(url.trim()); };

  return (
    <div className="w-full relative z-10">
      <form onSubmit={handle} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
            <span className="material-symbols-outlined text-[var(--text-muted)]" style={{ fontSize: '20px', fontVariationSettings: '"FILL" 0' }}>link</span>
          </div>
          <input
            type="text"
            placeholder="Paste website URL..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isLoading}
            className="ios-input w-full h-12 pl-11 pr-4 rounded-lg text-[14px] leading-[1.6] font-mono"
          />
        </div>
        <button
          type="submit"
          disabled={!url.trim() || isLoading}
          className="shine-btn h-12 px-7 rounded-lg font-semibold text-[14px] disabled:opacity-30"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Analyzing...
            </span>
          ) : 'Generate'}
        </button>
      </form>

      <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Try:</span>
        {EXAMPLES.map((s) => (
          <button
            key={s.url}
            onClick={() => { setUrl(s.url); onSubmit(s.url); }}
            disabled={isLoading}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border hover-lift disabled:opacity-30"
            style={{ borderColor: 'var(--glass-border)', background: 'var(--surface-elevated)', color: 'var(--text-muted)' }}
          >
            {s.label}
            <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>open_in_new</span>
          </button>
        ))}
      </div>
    </div>
  );
}
