"use client";

import type { Session } from "next-auth"
import { SessionProvider } from "next-auth/react"
import { MiniKitContextProvider } from "@/components/providers/MiniKitProvider";

export function Providers({ session, children }: { session: Session | null, children: React.ReactNode }) {
  return (
    <SessionProvider session={session}>
      <MiniKitContextProvider>
        {children}
      </MiniKitContextProvider>
    </SessionProvider>
  );
} 