'use client';

import { useState, useCallback } from 'react';

export default function CopyButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);
  const handle = useCallback(async () => {
    try { await navigator.clipboard.writeText(content); } catch {
      const ta = document.createElement('textarea'); ta.value = content; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    }
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }, [content]);

  return (
    <button onClick={handle} className="flex items-center gap-2 px-4 py-2 rounded-lg text-[14px] leading-[1.6] font-mono hover-lift" style={{ border: '1px solid var(--glass-border)', background: 'var(--surface-elevated)', color: copied ? 'var(--secondary)' : 'var(--text-muted)' }}>
      {copied ? (
        <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5" /></svg> Copied!</>
      ) : (
        <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" /></svg>Copy</>
      )}
    </button>
  );
}
