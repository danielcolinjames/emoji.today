"use client";

import { SessionProvider } from "next-auth/react"
import { FrameProvider } from "@/components/providers/FrameProvider"
import dynamic from "next/dynamic";
// import { ThirdwebProvider } from "@thirdweb-dev/react";
// import { getChain } from "@/lib/blockchain";
import type { Session } from "next-auth"

const WagmiProvider = dynamic(
  () => import("@/components/providers/WagmiProvider"),
  {
    ssr: false,
  }
);

export function Providers({ session, children }: { session: Session | null, children: React.ReactNode }) {
  // const activeChain = getChain();

  return (
    <SessionProvider session={session}>
      <WagmiProvider>
        {/* Temporarily disabled ThirdwebProvider due to ethers v6 compatibility issues */}
        {/* <ThirdwebProvider
          activeChain={activeChain}
          clientId={process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID}
        > */}
        <FrameProvider>
          {children}
        </FrameProvider>
        {/* </ThirdwebProvider> */}
      </WagmiProvider>
    </SessionProvider>
  );
} 