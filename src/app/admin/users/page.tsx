'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';

interface UserRecord {
  uid: string;
  email: string;
  displayName?: string;
  role: 'user' | 'admin';
  createdAt?: number;
  lastActive?: number;
  totalAnalyses?: number;
}

export default function AdminUsersPage() {
  const { getIdToken, user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      const token = await getIdToken();
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.ok) setUsers(data.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [getIdToken]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleRole = async (uid: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';

    // Can't demote yourself
    if (uid === currentUser?.uid && newRole !== 'admin') {
      setMessage('You cannot demote yourself.');
      return;
    }

    setUpdating(uid);
    setMessage('');

    try {
      const token = await getIdToken();
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uid, role: newRole }),
      });
      const data = await res.json();

      if (data.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.uid === uid ? { ...u, role: newRole as 'user' | 'admin' } : u))
        );
        setMessage(`User role updated to ${newRole}.`);
      } else {
        setMessage(data.error || 'Failed to update');
      }
    } catch {
      setMessage('Failed to update user role');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 rounded-lg border border-border bg-card animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Users ({users.length})</h2>
        <button
          onClick={fetchUsers}
          className="text-sm px-3 py-1.5 rounded-md border border-border hover:bg-muted transition-colors"
        >
          Refresh
        </button>
      </div>

      {message && (
        <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm">
          {message}
        </div>
      )}

      {users.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No users found yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-3 font-medium text-muted-foreground">User</th>
                <th className="text-left py-3 px-3 font-medium text-muted-foreground">Email</th>
                <th className="text-left py-3 px-3 font-medium text-muted-foreground">Role</th>
                <th className="text-left py-3 px-3 font-medium text-muted-foreground">Analyses</th>
                <th className="text-left py-3 px-3 font-medium text-muted-foreground">Last Active</th>
                <th className="text-right py-3 px-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.uid} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                        {(u.displayName || u.email).charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium">{u.displayName || '—'}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-muted-foreground">{u.email}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.role === 'admin'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-muted-foreground">{u.totalAnalyses ?? 0}</td>
                  <td className="py-3 px-3 text-muted-foreground">
                    {u.lastActive
                      ? new Date(u.lastActive).toLocaleDateString() + ' ' + new Date(u.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => toggleRole(u.uid, u.role)}
                      disabled={updating === u.uid}
                      className={`text-xs px-3 py-1.5 rounded-md transition-colors disabled:opacity-50 ${
                        u.role === 'admin'
                          ? 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                          : 'bg-primary/10 text-primary hover:bg-primary/20'
                      }`}
                    >
                      {updating === u.uid
                        ? '...'
                        : u.role === 'admin'
                          ? 'Remove Admin'
                          : 'Make Admin'}
                    </button>
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
