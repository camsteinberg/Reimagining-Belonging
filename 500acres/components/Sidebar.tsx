// components/Sidebar.tsx (Client Component)
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  DollarSign,
  HelpCircle,
  Building,
  Menu,
  LogOut,
  Icon,
  GraduationCap,
  Users,
  X,
} from 'lucide-react';
import { bee } from '@lucide/lab';

export type SidebarProps = {
  username?: string;
  role?: string | null;
  hasPhone?: boolean;
  className?: string;
  isDrawer?: boolean;
  onClose?: () => void;
  defaultCollapsed?: boolean;
};

export default function Sidebar({
  username,
  role,
  hasPhone,
  className,
  isDrawer = false,
  onClose,
  defaultCollapsed = false,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const fellowshipItem =
    role === 'admin'
      ? { label: 'Fellowship Admin', path: '/fellowship-admin', icon: <GraduationCap className="h-5 w-5" /> }
      : { label: 'Fellowship', path: '/fellowship', icon: <GraduationCap className="h-5 w-5" /> };

  const items =
    role === 'admin'
      ? [
          fellowshipItem,
          {
            label: 'Acre Buzz',
            path: '/buzz',
            icon: (
              <Icon
                iconNode={bee}
                className="h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
              />
            ),
          },
          { label: 'The Till', path: '/till', icon: <DollarSign className="h-5 w-5" /> },
          { label: 'Real Estate', path: '/realestate', icon: <Building className="h-5 w-5" /> },
          { label: 'Governance', path: '/governance', icon: <HelpCircle className="h-5 w-5" /> },
          { label: 'Users', path: '/users', icon: <Users className="h-5 w-5" /> },
          { label: 'Analytics', path: '/analytics', icon: <BarChart3 className="h-5 w-5" /> },
        ]
      : [fellowshipItem];

  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + '/');

  async function handleLogout() {
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch {
      /* ignore logout errors, we still redirect */
    }
    router.push('/login');
    router.refresh();
  }

  const handleCollapseToggle = () => setCollapsed((s) => !s);
  const collapseLabel = isDrawer ? 'Close sidebar' : collapsed ? 'Expand sidebar' : 'Collapse sidebar';
  const collapseAction = isDrawer ? onClose ?? handleCollapseToggle : handleCollapseToggle;
  const collapseIcon = isDrawer ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />;

  const widthClass = collapsed ? 'w-20' : 'w-72';
  const rootClass = `relative ${widthClass} flex flex-col gap-4 overflow-hidden border-r
        border-[var(--sidebar-border)] bg-[var(--surface-sidebar)] px-4 py-5 text-[var(--sidebar-active-text)]
        shadow-[0_24px_48px_-36px_rgba(42,37,32,0.45)] transition-[width] duration-300 ${className ?? ''}`;

  return (
    <aside className={rootClass}>
      <div
        className="pointer-events-none absolute inset-0 opacity-60 mix-blend-screen"
        style={{
          background:
            'radial-gradient(circle at 18% -12%, rgba(196,93,62,0.15), transparent 55%), radial-gradient(circle at 80% 110%, rgba(196,93,62,0.10), transparent 60%)',
        }}
        aria-hidden
      />

      {/* Top header */}
      <div className="relative z-10 flex items-center gap-2">
        <button
          aria-label={collapseLabel}
          onClick={collapseAction}
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-transparent
            bg-[var(--color-surface-subtle)] text-[var(--sidebar-muted)] transition-colors duration-200
            hover:border-[var(--sidebar-border)] hover:bg-[var(--color-primary-soft)]"
        >
          {collapseIcon}
        </button>
        {!collapsed ? (
          <h1 className="font-serif text-2xl font-semibold leading-none tracking-tight text-[var(--sidebar-active-text)]">
            500 Acres
          </h1>
        ) : (
          <span className="font-serif text-xs font-semibold uppercase tracking-[0.35em] text-[var(--sidebar-muted)]">500A</span>
        )}
      </div>

      {/* Modules */}
      <nav className="relative z-10 space-y-2">
        {items.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`group relative flex min-w-0 items-center gap-3 rounded-2xl px-3 py-2.5 transition-all duration-200
                ${active
                  ? 'bg-[var(--sidebar-active)] text-[var(--sidebar-active-text)] shadow-[0_16px_36px_-20px_rgba(196,93,62,0.4)]'
                  : 'text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-hover)]'}
                ${collapsed ? 'justify-center' : 'justify-start'} backdrop-blur-[1px]`}
              title={collapsed ? item.label : undefined}
            >
              <span
                className={`absolute left-0 top-1/2 h-8 -translate-y-1/2 rounded-r-full transition-all duration-300
                  ${active ? 'w-1.5 bg-[var(--color-primary)]' : 'w-0 bg-[var(--color-primary)] group-hover:w-1.5'}`}
              />
              <span
                className={`flex-shrink-0 transition-transform duration-200 ${
                  active
                    ? 'scale-110 text-[var(--sidebar-active-text)]'
                    : 'text-[var(--sidebar-muted)] group-hover:translate-x-0.5 group-hover:scale-110 group-hover:text-[var(--sidebar-active-text)]'
                }`}
              >
                {item.icon}
              </span>
              {!collapsed && <span className="truncate text-sm font-medium tracking-wide">{item.label}</span>}
              <span
                className={`pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-300
                  ${active ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}
                  bg-[radial-gradient(ellipse_at_left,_rgba(196,93,62,0.10),_transparent_60%)]`}
              />
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="relative z-10 mt-auto space-y-3 pt-2">
        <div
          className={`${collapsed ? 'px-2 py-2' : 'px-3 py-3'} rounded-2xl border border-[var(--sidebar-border)]
            text-[var(--sidebar-muted)] backdrop-blur-sm`}
          style={{ background: 'color-mix(in srgb, var(--sidebar-active) 65%, transparent)' }}
        >
          {collapsed ? (
            <div className="mx-auto h-8 w-8 rounded-full bg-[color-mix(in_srgb,var(--color-primary)_30%,_transparent)]" />
          ) : (
            <div className="space-y-1">
              <div className="truncate text-sm font-semibold leading-tight text-[var(--sidebar-active-text)]">
                {username ?? 'Fellow'}
              </div>
              <div className="text-xs text-[var(--sidebar-muted)]">{role ?? 'Member'}</div>
            </div>
          )}
        </div>

        {!hasPhone && (
          <Link
            href="/account/add-phone"
            className="block rounded-xl px-3 py-2 text-center font-semibold
                 bg-[var(--sidebar-cta-bg)] text-[var(--sidebar-cta-text)] transition hover:brightness-95"
            title={collapsed ? 'Add phone number' : undefined}
          >
            {collapsed ? 'Add phone' : 'Add phone number'}
          </Link>
        )}

        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2
            bg-[var(--sidebar-logout-bg)] text-[var(--sidebar-active-text)] transition hover:bg-[var(--sidebar-logout-hover)]"
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
}
