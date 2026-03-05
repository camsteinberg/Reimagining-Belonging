'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/public/layout/Navbar';
import Footer from '@/components/public/layout/Footer';
import ScrollProgress from '@/components/public/shared/ScrollProgress';
import CustomCursor from '@/components/public/shared/CustomCursor';
import useAnalytics from '@/hooks/useAnalytics';

export default function PublicLayout({ children }: { children: ReactNode }) {
  useAnalytics();
  const pathname = usePathname();
  const isHomepage = pathname === '/';

  return (
    <>
      <CustomCursor />
      <ScrollProgress />
      <Navbar isHomepage={isHomepage} />
      <main id="main-content">{children}</main>
      {!isHomepage && <Footer />}
    </>
  );
}
