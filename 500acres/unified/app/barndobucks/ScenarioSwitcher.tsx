// app/barndobucks/ScenarioSwitcher.tsx
'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

const OPTIONS = [
  { value: 'acres', label: '500 Acres' },
  { value: 'camel', label: 'Camel' },
  { value: 'wander', label: 'Wander' },
] as const;

type Props = {
  currentWhich: 'acres' | 'camel' | 'wander';
};

export default function ScenarioSwitcher({ currentWhich }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChange = (next: string) => {
    const params = new URLSearchParams(searchParams?.toString() ?? '');

    if (next === 'acres') {
      // acres is our default – we can drop the param for a cleaner URL
      params.delete('which');
    } else {
      params.set('which', next);
    }

    const query = params.toString();
    const url = query ? `${pathname}?${query}` : pathname;
    router.push(url);
  };

  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-subtle)] px-3 py-2 text-xs">
      <span className="font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
        Scenario
      </span>
      <select
        value={currentWhich}
        onChange={(e) => handleChange(e.target.value)}
        className="rounded-lg border border-transparent bg-transparent px-2 py-1 text-xs font-medium text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
      >
        {OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
