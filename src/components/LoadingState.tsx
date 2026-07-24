'use client';

interface Step { id: string; label: string; desc: string; icon: React.ReactNode }
const STEPS: Step[] = [
  { id: 'fetching', label: 'Fetching website', desc: 'Downloading HTML & CSS assets...', icon: <GlobeIcon /> },
  { id: 'parsing', label: 'Parsing tokens', desc: 'Extracting colors, typography, spacing...', icon: <PaletteIcon /> },
  { id: 'ai', label: 'AI analyzing', desc: 'Generating structured DESIGN.md...', icon: <BrainIcon /> },
];

function GlobeIcon() { return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>; }
function PaletteIcon() { return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072" /></svg>; }
function BrainIcon() { return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" /></svg>; }
function CheckIcon() { return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.5 12.75l6 6 9-13.5" /></svg>; }

export default function LoadingState({ stage }: { stage: 'fetching' | 'parsing' | 'ai' }) {
  const idx = STEPS.findIndex((s) => s.id === stage);
  const accentColor = 'var(--primary-container)';
  return (
    <div className="space-y-3">
      {STEPS.map((s, i) => {
        const active = i === idx;
        const done = i < idx;
        return (
          <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg glass-card" style={{ opacity: active ? 1 : done ? 0.7 : 0.4 }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ color: accentColor }}>
              {done ? (
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: `color-mix(in srgb, ${accentColor} 20%, transparent)` }}>
                  <CheckIcon />
                </div>
              ) : active ? (
                <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: accentColor, borderTopColor: 'transparent' }} />
              ) : (
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--surface-elevated)', border: '1px solid var(--glass-border)' }}>
                  {s.icon}
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: active ? 'var(--text)' : 'var(--text-muted)' }}>{s.label}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.desc}</p>
              {active && stage === 'ai' && (
                <p className="text-xs mt-1" style={{ color: accentColor }}>Free AI: ~30–60s</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
