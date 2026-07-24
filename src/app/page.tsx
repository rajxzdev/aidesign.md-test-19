'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import UrlForm from '@/components/UrlForm';
import LoadingState from '@/components/LoadingState';
import ResultPanel from '@/components/ResultPanel';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

interface ResultData { markdown: string; domain: string; model: string; cached: boolean }

function LinkIcon() { return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>; }
function AiIcon() { return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>; }
function DocIcon() { return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>; }

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<'fetching' | 'parsing' | 'ai'>('fetching');
  const [result, setResult] = useState<ResultData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (!authLoading && !user) router.push('/login'); }, [user, authLoading, router]);

  const handleSubmit = useCallback(async (url: string) => {
    if (!user) return;
    setIsLoading(true); setError(null); setResult(null); setLoadingStage('fetching');
    const ft = setTimeout(() => setLoadingStage('parsing'), 5000);
    const pt = setTimeout(() => setLoadingStage('ai'), 10000);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ url }),
      });
      clearTimeout(ft); clearTimeout(pt);
      const data = await res.json();
      if (!data.ok) { setError(data.error); toast.error(data.error); return; }
      setResult({ markdown: data.markdown, domain: data.domain, model: data.model, cached: data.cached });
      toast.success('DESIGN.md generated!');
    } catch (e) {
      clearTimeout(ft); clearTimeout(pt);
      const msg = e instanceof Error ? e.message : 'Network error.';
      setError(msg); toast.error(msg);
    } finally { setIsLoading(false); }
  }, [user]);

  if (authLoading) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}><div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--primary-container)', borderTopColor: 'transparent' }} /></div>;
  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col relative font-sans antialiased" style={{ background: 'var(--bg)' }}>
      <div className="fixed inset-0 noise-bg opacity-50 pointer-events-none z-0" />
      <Toaster position="top-center" />

      <section className="flex-1 flex flex-col items-center px-4 pt-20 sm:pt-28 pb-16 relative z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-8 hover-lift" style={{ border: '1px solid var(--glass-border)', background: 'var(--surface-elevated)', color: 'var(--text-muted)' }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--secondary)' }} />
          by rajxzdev
        </div>

        {/* Hero */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-tight" style={{ color: 'var(--text)', fontFamily: 'Geist, sans-serif' }}>
            Turn any website into{' '}
            <span className="gradient-text">DESIGN.md</span>
          </h1>
          <p className="text-lg max-w-lg mx-auto leading-relaxed" style={{ color: 'var(--text-muted)', fontFamily: 'Inter, sans-serif' }}>
            The automated bridge between code and design.
            Paste a URL, get a complete design system in seconds.
          </p>
        </div>

        {/* Form Card */}
        <div className="w-full max-w-2xl glass-card rounded-xl p-6 sm:p-8 relative overflow-hidden">
          <UrlForm onSubmit={handleSubmit} isLoading={isLoading} />
        </div>

        {isLoading && <div className="mt-10 w-full max-w-md"><LoadingState stage={loadingStage} /></div>}

        {error && !isLoading && (
          <div className="w-full max-w-lg mx-auto mt-8 p-5 rounded-xl glass-card">
            <div className="flex items-center justify-center gap-2 mb-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--error)' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
              <span className="font-medium text-sm" style={{ color: 'var(--error)' }}>Error</span>
            </div>
            <p className="text-sm text-center" style={{ color: 'var(--text-muted)' }}>{error}</p>
          </div>
        )}

        {result && !isLoading && (
          <div className="w-full mt-8">
            <ResultPanel markdown={result.markdown} domain={result.domain} model={result.model} cached={result.cached} />
          </div>
        )}

        {!result && !isLoading && !error && (
          <div className="mt-28 w-full max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold text-center mb-12" style={{ color: 'var(--text-muted)', fontFamily: 'Geist, sans-serif' }}>How it works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { step: '01', title: 'Paste URL', desc: 'Enter any public website — landing page, docs, or web app.', icon: <LinkIcon /> },
                { step: '02', title: 'AI Extracts', desc: 'We analyze HTML & CSS, extracting every design token.', icon: <AiIcon /> },
                { step: '03', title: 'Get DESIGN.md', desc: 'Copy or download a production-ready design document.', icon: <DocIcon /> },
              ].map((item) => (
                <div key={item.step} className="glass-card rounded-xl p-6 hover-lift">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `color-mix(in srgb, var(--primary-container) 15%, transparent)`, color: 'var(--primary-container)' }}>
                      {item.icon}
                    </div>
                    <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{item.step}</span>
                  </div>
                  <h3 className="font-semibold mb-1" style={{ color: 'var(--text)' }}>{item.title}</h3>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <footer className="py-6 border-t relative z-10" style={{ borderColor: 'var(--glass-border)' }}>
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between text-sm" style={{ color: 'var(--text-muted)' }}>
          <p>aidesign.md</p>
          <p>by rajxzdev</p>
        </div>
      </footer>
    </div>
  );
}
