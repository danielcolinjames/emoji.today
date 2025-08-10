"use client";

import type { Session } from "next-auth"
import { SessionProvider } from "next-auth/react"
import { MiniKitContextProvider } from "@/components/providers/MiniKitProvider";
import { useEffect } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";

function EnsureFrameReady({ children }: { children: React.ReactNode }) {
  const { setFrameReady, isFrameReady } = useMiniKit();
  useEffect(() => {
    if (!isFrameReady) setFrameReady();
  }, [isFrameReady, setFrameReady]);
  return <>{children}</>;
}

// Removed auto-signin; explicit sign-in flow handled via UI actions

export function Providers({ session, children }: { session: Session | null, children: React.ReactNode }) {
  return (
    <SessionProvider session={session}>
      <MiniKitContextProvider>
        <EnsureFrameReady>
          {children}
        </EnsureFrameReady>
      </MiniKitContextProvider>
    </SessionProvider>
  );
}