'use client';

import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  to?: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center gap-2 font-sans text-xs uppercase tracking-[0.3em] text-charcoal/50">
        <li>
          <Link href="/" className="hover:text-charcoal transition-colors">
            Home
          </Link>
        </li>
        {items.map((item, i) => (
          <li key={item.label} className="flex items-center gap-2">
            <span aria-hidden="true">&gt;</span>
            {i === items.length - 1 ? (
              <span aria-current="page" className="text-charcoal/80">
                {item.label}
              </span>
            ) : (
              <Link href={item.to || item.href || "/"} className="hover:text-charcoal transition-colors">
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
