"use client"

import { useMemo } from "react"
import { useSession } from "next-auth/react"
import { useMiniKit } from "@coinbase/onchainkit/minikit"

export type UnifiedUserSource = "miniapp" | "session" | "none"

export interface UnifiedUser {
  fid: number | null
  username: string | null
  source: UnifiedUserSource
  isFrameReady: boolean
}

export function useUnifiedUser(): UnifiedUser {
  const { data: session } = useSession()
  const { context, isFrameReady } = useMiniKit()

  const unified = useMemo<UnifiedUser>(() => {
    // Coerce fid from Mini App context to a number when possible
    const rawMiniFid = (context?.user as any)?.fid
    const coercedMiniFid =
      typeof rawMiniFid === "number"
        ? rawMiniFid
        : typeof rawMiniFid === "string" && rawMiniFid.trim() !== ""
        ? Number(rawMiniFid)
        : null
    const miniAppFid = Number.isFinite(coercedMiniFid as number)
      ? (coercedMiniFid as number)
      : null
    const miniAppUsername = context?.user?.username ?? null

    const sessionFid =
      typeof session?.user?.fid === "number" ? session.user.fid : null

    if (isFrameReady && (miniAppFid || miniAppUsername)) {
      return {
        fid: miniAppFid,
        username: miniAppUsername,
        source: "miniapp",
        isFrameReady,
      }
    }

    if (sessionFid) {
      return {
        fid: sessionFid,
        username: null,
        source: "session",
        isFrameReady,
      }
    }

    return { fid: null, username: null, source: "none", isFrameReady }
  }, [
    context?.user?.fid,
    context?.user?.username,
    isFrameReady,
    session?.user?.fid,
  ])

  return unified
}
