// Fathom.tsx
'use client';

import { load, trackPageview } from 'fathom-client';
import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const FATHOM_ID = process.env.NEXT_PUBLIC_FATHOM_ID || '';

function TrackPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Load the Fathom script on mount
  useEffect(() => {
    load(FATHOM_ID, {
      auto: false
    });
  }, []);

  // Record a pageview when route changes
  useEffect(() => {
    if (!pathname) return;

    trackPageview({
      url: pathname + searchParams?.toString(),
      referrer: document.referrer
    });
  }, [pathname, searchParams]);

  return null;
}

export function FathomAnalytics() {
  return (
    <Suspense fallback={null}>
      <TrackPageView />
    </Suspense>
  );
}
