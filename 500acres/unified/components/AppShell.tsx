'use client';

import type { ReactNode } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { Menu } from 'lucide-react';

import Sidebar, { type SidebarProps } from '@/components/Sidebar';

type AppShellProps = {
  children: ReactNode;
  sidebarProps?: SidebarProps | null;
};

export default function AppShell({ children, sidebarProps }: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const hasSidebar = !!sidebarProps;

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const desktopSidebar = useMemo(() => {
    if (!hasSidebar || !sidebarProps) return null;
    return (
      <div className="hidden shrink-0 lg:flex">
        <Sidebar {...sidebarProps} />
      </div>
    );
  }, [hasSidebar, sidebarProps]);

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--color-canvas)] text-[var(--color-text)] transition-colors duration-300 lg:flex-row">
      {desktopSidebar}

      {hasSidebar && sidebarProps ? (
        <>
          {/* Mobile drawer */}
          <div
            onClick={closeDrawer}
            className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-200 lg:hidden ${
              drawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
          />
          <div
            className={`fixed inset-y-0 left-0 z-50 w-72 max-w-full transform transition-transform duration-200 lg:hidden ${
              drawerOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
            }`}
            aria-hidden={!drawerOpen}
          >
            <Sidebar
              {...sidebarProps}
              isDrawer
              onClose={closeDrawer}
              className="h-full border-r border-[var(--sidebar-border)] bg-[var(--surface-sidebar)] shadow-[0_28px_60px_-30px_rgba(12,43,30,0.6)]"
            />
          </div>
        </>
      ) : null}

      <div className="relative flex flex-1 flex-col">
        {hasSidebar ? (
          <header className="flex items-center justify-between border-b border-[var(--color-border-soft)] bg-[var(--color-canvas)] px-4 py-3 lg:hidden">
            <button
              type="button"
              onClick={openDrawer}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm transition hover:brightness-95"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="text-lg font-semibold">
              500Acres<span className="text-[var(--color-primary)]">OS</span>
            </span>
            <span className="block w-10" aria-hidden />
          </header>
        ) : null}

        <main className="flex-1 space-y-6 overflow-y-auto px-4 py-6 transition-colors duration-300 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
