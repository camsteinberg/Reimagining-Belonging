'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = sessionStorage.getItem('_a_sid');
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem('_a_sid', id);
  }
  return id;
}

export default function useAnalytics() {
  const pathname = usePathname();
  const startTime = useRef(Date.now());
  const lastPath = useRef('');

  useEffect(() => {
    const sessionId = getSessionId();
    if (!sessionId) return;

    // Send duration for previous page
    if (lastPath.current && lastPath.current !== pathname) {
      const duration = Date.now() - startTime.current;
      navigator.sendBeacon(
        '/api/analytics/event',
        JSON.stringify({
          sessionId,
          path: lastPath.current,
          eventType: 'session_end',
          durationMs: duration,
        })
      );
    }

    // Record new pageview
    startTime.current = Date.now();
    lastPath.current = pathname;

    fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        path: pathname,
        referrer: document.referrer || null,
        screenW: window.innerWidth,
        screenH: window.innerHeight,
        eventType: 'pageview',
      }),
    }).catch(() => {
      // Silently fail — analytics should never break the site
    });

    // Send duration on page unload
    const handleUnload = () => {
      const duration = Date.now() - startTime.current;
      navigator.sendBeacon(
        '/api/analytics/event',
        JSON.stringify({
          sessionId,
          path: pathname,
          eventType: 'session_end',
          durationMs: duration,
        })
      );
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [pathname]);
}
