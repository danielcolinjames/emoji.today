"use client"

import { useEffect, useState } from "react"
import { useMiniKit } from "@coinbase/onchainkit/minikit"

export function useEnsureVerified() {
  const { context, isFrameReady } = useMiniKit()
  const [verified, setVerified] = useState(false)

  useEffect(() => {
    async function run() {
      if (!isFrameReady) return
      // If already have auth cookie, skip. We can attempt a lightweight check.
      const hasCookie = document.cookie.includes("et_auth=")
      if (hasCookie) {
        setVerified(true)
        return
      }
      // Require Mini App user to sign once to set cookie
      try {
        // Dynamically import to avoid SSR issues
        const sdk = (await import("@farcaster/miniapp-sdk")).default
        const nonce = Math.random().toString(36).slice(2)
        const { message, signature } = await sdk.actions.signIn({ nonce })
        const res = await fetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, signature, nonce }),
        })
        if (res.ok) setVerified(true)
      } catch (e) {
        // Swallow; UI can still read public data
        setVerified(false)
      }
    }
    run()
  }, [isFrameReady, context?.user?.fid])

  return verified
}
