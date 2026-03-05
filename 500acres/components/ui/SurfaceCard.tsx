import type { ReactNode } from 'react';

type SurfaceCardProps = {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'muted' | 'inset';
  padding?: 'sm' | 'md' | 'lg';
};

export default function SurfaceCard({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
}: SurfaceCardProps) {
  const variantClass =
    variant === 'muted'
      ? 'bg-[var(--color-surface-subtle)]'
      : variant === 'inset'
      ? 'bg-[var(--color-surface-elevated)]'
      : 'bg-[var(--color-surface)]';

  const paddingClass = padding === 'lg' ? 'p-6 md:p-8' : padding === 'sm' ? 'p-4' : 'p-5 md:p-6';

  return (
    <div
      className={`rounded-3xl border border-[var(--color-border-soft)] shadow-[var(--surface-card-shadow)]
        transition-colors duration-300 ${variantClass} ${paddingClass} ${className}`.trim()}
    >
      {children}
    </div>
  );
}
