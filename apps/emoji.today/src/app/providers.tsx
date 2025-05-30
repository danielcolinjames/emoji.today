"use client";

import type { Session } from "next-auth"
import { SessionProvider } from "next-auth/react"
import { FrameProvider } from "@/components/providers/FrameProvider"

export function Providers({ session, children }: { session: Session | null, children: React.ReactNode }) {
  return (
    <SessionProvider session={session}>
      <FrameProvider>
        {children}
      </FrameProvider>
    </SessionProvider>
  );
} 