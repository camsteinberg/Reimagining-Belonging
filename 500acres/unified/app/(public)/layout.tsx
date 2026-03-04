'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/public/layout/Navbar';
import Footer from '@/components/public/layout/Footer';
import ScrollProgress from '@/components/public/shared/ScrollProgress';
import CustomCursor from '@/components/public/shared/CustomCursor';

export default function PublicLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isHomepage = pathname === '/';

  return (
    <>
      <CustomCursor />
      <ScrollProgress />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-1/2 focus:-translate-x-1/2 focus:z-[300] focus:bg-charcoal focus:text-cream focus:px-6 focus:py-3 focus:rounded-full focus:font-sans focus:text-sm"
      >
        Skip to content
      </a>
      <Navbar isHomepage={isHomepage} />
      <main id="main-content">{children}</main>
      {!isHomepage && <Footer />}
    </>
  );
}
