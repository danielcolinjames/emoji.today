"use client";

import { SessionProvider } from "next-auth/react"
import { FrameProvider } from "@/components/providers/FrameProvider"
import dynamic from "next/dynamic";
import type { Session } from "next-auth"

const WagmiProvider = dynamic(
  () => import("@/components/providers/WagmiProvider"),
  {
    ssr: false,
  }
);

// Temporarily disable ThirdwebProvider due to WalletConnect conflicts
// TODO: Re-enable once WalletConnect dependencies are resolved
// import { ThirdwebProvider } from "thirdweb/react";
// import { thirdwebClient } from "@/lib/blockchain";

export function Providers({ session, children }: { session: Session | null, children: React.ReactNode }) {
  return (
    <SessionProvider session={session}>
      <WagmiProvider>
        {/* <ThirdwebProvider> */}
        <FrameProvider>
          {children}
        </FrameProvider>
        {/* </ThirdwebProvider> */}
      </WagmiProvider>
    </SessionProvider>
  );
} 