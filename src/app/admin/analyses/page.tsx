'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';

interface AnalysisRecord {
  id: string;
  uid?: string;
  email?: string;
  url?: string;
  domain?: string;
  model?: string;
  ok?: boolean;
  ms?: number;
  cached?: boolean;
  createdAt?: number;
}

export default function AdminAnalysesPage() {
  const { getIdToken } = useAuth();
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalyses = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getIdToken();
      const res = await fetch('/api/admin/analyses?limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.ok) setAnalyses(data.analyses || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [getIdToken]);

  useEffect(() => {
    fetchAnalyses();
  }, [fetchAnalyses]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-14 rounded-lg border border-border bg-card animate-pulse" />
        ))}
      </div>
    );
  }

  const successCount = analyses.filter((a) => a.ok).length;
  const failCount = analyses.filter((a) => !a.ok).length;
  const avgMs =
    analyses.length > 0
      ? Math.round(analyses.filter((a) => a.ms).reduce((sum, a) => sum + (a.ms || 0), 0) / analyses.length)
      : 0;

  return (
    <div>
      {/* Mini stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold">{analyses.length}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{successCount}</p>
          <p className="text-xs text-muted-foreground">Success</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold">{avgMs}s</p>
          <p className="text-xs text-muted-foreground">Avg time</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Recent Analyses</h2>
        <button
          onClick={fetchAnalyses}
          className="text-sm px-3 py-1.5 rounded-md border border-border hover:bg-muted transition-colors"
        >
          Refresh
        </button>
      </div>

      {analyses.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No analyses recorded yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-3 font-medium text-muted-foreground">Time</th>
                <th className="text-left py-3 px-3 font-medium text-muted-foreground">User</th>
                <th className="text-left py-3 px-3 font-medium text-muted-foreground">Domain</th>
                <th className="text-left py-3 px-3 font-medium text-muted-foreground">Model</th>
                <th className="text-center py-3 px-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right py-3 px-3 font-medium text-muted-foreground">Time (s)</th>
              </tr>
            </thead>
            <tbody>
              {analyses.map((a) => (
                <tr key={a.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-3 text-muted-foreground whitespace-nowrap">
                    {a.createdAt
                      ? new Date(a.createdAt).toLocaleDateString() + ' ' + new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </td>
                  <td className="py-3 px-3 text-muted-foreground max-w-[150px] truncate">
                    {a.email || a.uid?.slice(0, 8) || '—'}
                  </td>
                  <td className="py-3 px-3 font-medium">{a.domain || '—'}</td>
                  <td className="py-3 px-3 text-muted-foreground font-mono text-xs">
                    {a.model || '—'}
                    {a.cached && (
                      <span className="ml-1 text-xs text-yellow-600">(cached)</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {a.ok ? (
                      <span className="inline-block w-2 h-2 rounded-full bg-green-500" title="Success" />
                    ) : (
                      <span className="inline-block w-2 h-2 rounded-full bg-red-500" title="Failed" />
                    )}
                  </td>
                  <td className="py-3 px-3 text-right text-muted-foreground">
                    {a.ms ? (a.ms / 1000).toFixed(1) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
