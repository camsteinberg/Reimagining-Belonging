'use client';

import { useCallback, useEffect, useState } from 'react';
import SurfaceCard from '@/components/ui/SurfaceCard';

type User = {
  id: string;
  username: string | null;
  email: string | null;
  role: string | null;
  status: string | null;
  createdAt: string;
};

type StatusFilter = 'all' | 'pending' | 'active' | 'suspended';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-[var(--color-sage)] text-white',
  pending: 'bg-[var(--color-gold)] text-[var(--color-charcoal)]',
  suspended: 'bg-[var(--color-ember)] text-white',
};

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-[var(--color-navy)] text-white',
  fellow: 'bg-[var(--color-surface-subtle)] text-[var(--color-text)]',
};

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      setUsers(data.users ?? []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAction = async (
    userId: string,
    update: { status?: string; role?: string }
  ) => {
    setActionLoading(userId);
    try {
      await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...update }),
      });
      await fetchUsers();
    } catch (err) {
      console.error('Action failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const pendingCount = users.filter((u) => u.status === 'pending').length;

  const filteredUsers =
    filter === 'all' ? users : users.filter((u) => u.status === filter);

  const filterTabs: { key: StatusFilter; label: string; count?: number }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending', count: pendingCount },
    { key: 'active', label: 'Active' },
    { key: 'suspended', label: 'Suspended' },
  ];

  const emptyMessages: Record<StatusFilter, string> = {
    all: 'No users found.',
    pending: 'No pending approvals.',
    active: 'No active users.',
    suspended: 'No suspended users.',
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page heading */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-[var(--color-text)] sm:text-4xl">
          User Management
        </h1>
        <p className="mt-2 font-sans text-sm text-[var(--color-text-muted)]">
          Approve new registrations, manage roles, and review account status.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {filterTabs.map((tab) => {
          const active = filter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 font-sans text-sm font-medium
                transition-colors duration-200
                ${
                  active
                    ? 'bg-[var(--color-charcoal)] text-[var(--color-warm-white)]'
                    : 'bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)] hover:bg-[var(--color-border-soft)] hover:text-[var(--color-text)]'
                }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold
                    ${
                      active
                        ? 'bg-[var(--color-ember)] text-white'
                        : 'bg-[var(--color-gold)] text-[var(--color-charcoal)]'
                    }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* User list */}
      <SurfaceCard padding="sm" className="overflow-hidden">
        {loading ? (
          <div className="divide-y divide-[var(--color-border-soft)]">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-sans text-sm text-[var(--color-text-muted)]">
              {emptyMessages[filter]}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border-soft)]">
            {filteredUsers.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                busy={actionLoading === user.id}
                onAction={(update) => handleAction(user.id, update)}
              />
            ))}
          </div>
        )}
      </SurfaceCard>
    </div>
  );
}

/* ─── User Row ─── */

function UserRow({
  user,
  busy,
  onAction,
}: {
  user: User;
  busy: boolean;
  onAction: (update: { status?: string; role?: string }) => void;
}) {
  const statusClass = STATUS_COLORS[user.status ?? ''] ?? '';
  const roleClass = ROLE_COLORS[user.role ?? ''] ?? ROLE_COLORS.fellow;
  const createdDate = new Date(user.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      className={`flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between
        ${busy ? 'pointer-events-none opacity-50' : ''}`}
    >
      {/* Left: identity */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-sans text-sm font-semibold text-[var(--color-text)] truncate">
            {user.username ?? 'Unnamed'}
          </span>
          <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${roleClass}`}>
            {user.role ?? 'fellow'}
          </span>
          <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${statusClass}`}>
            {user.status ?? 'unknown'}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-3 font-sans text-xs text-[var(--color-text-muted)]">
          {user.email && <span className="truncate">{user.email}</span>}
          <span className="hidden sm:inline">&middot;</span>
          <span className="hidden sm:inline">Joined {createdDate}</span>
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex flex-shrink-0 items-center gap-2">
        {user.status === 'pending' && (
          <>
            <ActionButton
              label="Approve"
              variant="primary"
              onClick={() => onAction({ status: 'active' })}
            />
            <ActionButton
              label="Reject"
              variant="ghost"
              onClick={() => onAction({ status: 'suspended' })}
            />
          </>
        )}

        {user.status === 'active' && (
          <>
            <ActionButton
              label="Suspend"
              variant="ghost"
              onClick={() => onAction({ status: 'suspended' })}
            />
            <ActionButton
              label={user.role === 'admin' ? 'Make Fellow' : 'Make Admin'}
              variant="ghost"
              onClick={() =>
                onAction({ role: user.role === 'admin' ? 'fellow' : 'admin' })
              }
            />
          </>
        )}

        {user.status === 'suspended' && (
          <ActionButton
            label="Reactivate"
            variant="primary"
            onClick={() => onAction({ status: 'active' })}
          />
        )}
      </div>
    </div>
  );
}

/* ─── Action Button ─── */

function ActionButton({
  label,
  variant,
  onClick,
}: {
  label: string;
  variant: 'primary' | 'ghost';
  onClick: () => void;
}) {
  const base =
    'rounded-lg px-3 py-1.5 font-sans text-xs font-medium transition-colors duration-200 cursor-pointer';
  const styles =
    variant === 'primary'
      ? `${base} bg-[var(--color-sage)] text-white hover:bg-[var(--color-forest)]`
      : `${base} text-[var(--color-text-muted)] hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-text)]`;

  return (
    <button type="button" className={styles} onClick={onClick}>
      {label}
    </button>
  );
}

/* ─── Skeleton Row ─── */

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-4 w-28 animate-pulse rounded bg-[var(--color-border-soft)]" />
          <div className="h-4 w-14 animate-pulse rounded-full bg-[var(--color-border-soft)]" />
          <div className="h-4 w-14 animate-pulse rounded-full bg-[var(--color-border-soft)]" />
        </div>
        <div className="h-3 w-48 animate-pulse rounded bg-[var(--color-border-soft)]" />
      </div>
      <div className="flex gap-2">
        <div className="h-7 w-16 animate-pulse rounded-lg bg-[var(--color-border-soft)]" />
      </div>
    </div>
  );
}
