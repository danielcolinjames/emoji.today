"use server"

import { getSession } from "@/auth"
import { revalidatePath } from "next/cache"
import { supabaseService } from "@/lib/supabase-service"
import { getCurrentVotingDateString } from "@/lib/date-utils"

export async function clearUserVote() {
  try {
    const session = await getSession()
    if (!session?.user?.fid) {
      throw new Error("Authentication required")
    }
    const fid = session.user.fid
    const today = getCurrentVotingDateString()
    const service = supabaseService()

    // Find the most recent vote for this user
    const { data: latestVoteRow } = await service
      .from("votes")
      .select("id, vote_date")
      .eq("fid", fid)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (!latestVoteRow) {
      return { success: true, note: "No vote to clear" }
    }

    const { error: delErr } = await service
      .from("votes")
      .delete()
      .eq("id", latestVoteRow.id)

    const affectedDate = latestVoteRow.vote_date

    console.log("[clearUserVote] removed vote id", latestVoteRow.id)

    // Re-compute live_results from remaining votes
    const { data: remainingVotes } = await service
      .from("votes")
      .select("emoji")
      .eq("vote_date", affectedDate)

    const total = remainingVotes?.length ?? 0
    const counts: Record<string, number> = {}
    remainingVotes?.forEach((v) => {
      counts[v.emoji] = (counts[v.emoji] || 0) + 1
    })

    await service.from("live_results").upsert(
      {
        vote_date: affectedDate,
        emoji_counts: counts,
        total_votes: total,
        last_updated_at: new Date().toISOString(),
      },
      { onConflict: "vote_date" }
    )

    // Drop summary row if no votes remain
    if (total === 0) {
      await service
        .from("daily_summaries")
        .delete()
        .eq("vote_date", affectedDate)
    }

    // Invalidate client caches
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (typeof triggerVoteCacheUpdate === "function") {
      // dynamic import to avoid circular dep
      ;(await import("@/components/SWRCacheManager")).triggerVoteCacheUpdate(
        affectedDate
      )
    }

    revalidatePath("/vote")
    return { success: true }
  } catch (error: any) {
    console.error("[clearUserVote.server] error", error)
    return { success: false, error: error?.message ?? "Unknown error" }
  }
}
