'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';

interface Stats {
  totalUsers: number;
  adminCount: number;
  totalAnalyses: number;
  recentAnalyses: number;
}

export default function AdminDashboard() {
  const { getIdToken } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await getIdToken();

        // Fetch users
        const usersRes = await fetch('/api/admin/users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const usersData = await usersRes.json();

        // Fetch analyses
        const analysesRes = await fetch('/api/admin/analyses?limit=100', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const analysesData = await analysesRes.json();

        if (usersData.ok && analysesData.ok) {
          const users = usersData.users || [];
          const analyses = analysesData.analyses || [];
          const last24h = analyses.filter((a: any) =>
            a.createdAt && Date.now() - a.createdAt < 86400000
          );

          setStats({
            totalUsers: users.length,
            adminCount: users.filter((u: any) => u.role === 'admin').length,
            totalAnalyses: analyses.length,
            recentAnalyses: last24h.length,
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [getIdToken]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-xl border border-border bg-card animate-pulse" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: 'Total Users',
      value: stats?.totalUsers ?? 0,
      icon: '👥',
      desc: `${stats?.adminCount ?? 0} admins`,
    },
    {
      label: 'Analyses Total',
      value: stats?.totalAnalyses ?? 0,
      icon: '📊',
      desc: 'All time',
    },
    {
      label: 'Analyses (24h)',
      value: stats?.recentAnalyses ?? 0,
      icon: '⚡',
      desc: 'Last 24 hours',
    },
    {
      label: 'Free Tier Status',
      value: 'OK',
      icon: '✅',
      desc: 'Spark plan active',
    },
  ];

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{card.icon}</span>
            </div>
            <p className="text-2xl font-bold">{card.value}</p>
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className="text-xs text-muted-foreground/60 mt-1">{card.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 rounded-xl border border-border bg-card">
        <h3 className="font-semibold mb-2">Quick actions</h3>
        <div className="flex flex-wrap gap-3">
          <a
            href="/admin/users"
            className="text-sm px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            Manage Users
          </a>
          <a
            href="/admin/analyses"
            className="text-sm px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            View Analyses
          </a>
        </div>
      </div>
    </div>
  );
}
