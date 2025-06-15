"use server"

import { getSession } from "@/auth"
import { revalidatePath } from "next/cache"
import { getCurrentVotingDateString } from "@/lib/date-utils"
import { supabaseService } from "@/lib/supabase-service"

export async function submitVote(
  emoji: string,
  username?: string,
  displayName?: string
) {
  // NOTE: identical logic to old client-side submitVote but executed on server
  try {
    const session = await getSession()

    if (!session?.user?.fid) {
      throw new Error("Authentication required")
    }

    if (!emoji) {
      throw new Error("Emoji is required")
    }

    const fid = session.user.fid
    const today = getCurrentVotingDateString()

    console.log("[submitVote.server] Debug - Date calculation:", {
      today,
      currentTime: new Date().toISOString(),
      utcTime: new Date().toUTCString(),
      fid,
      emoji,
    })

    const serviceSupabase = supabaseService()

    // Early-exit if user already voted
    const { data: existingVote, error: voteCheckError } = await serviceSupabase
      .from("votes")
      .select("id")
      .eq("fid", fid)
      .eq("vote_date", today)
      .single()

    if (voteCheckError && voteCheckError.code !== "PGRST116") {
      throw new Error(
        `Failed to check voting status: ${voteCheckError.message}`
      )
    }

    if (existingVote) {
      throw new Error("You have already voted today")
    }

    // Upsert user row (tracks username history)
    const { data: existingUser } = await serviceSupabase
      .from("users")
      .select("id, username, previous_usernames")
      .eq("fid", fid)
      .single()

    let userId: string
    if (existingUser) {
      userId = existingUser.id
      if (username && username !== existingUser.username) {
        await serviceSupabase
          .from("users")
          .update({
            username,
            previous_usernames: [
              ...(existingUser.previous_usernames ?? []),
              existingUser.username,
            ].filter((v): v is string => Boolean(v)),
          })
          .eq("id", userId)
      }
    } else {
      const { data: insertedUser, error: insertUserError } =
        await serviceSupabase
          .from("users")
          .insert({ fid, username })
          .select()
          .single()

      if (insertUserError) {
        throw new Error(`Failed to upsert user: ${insertUserError.message}`)
      }
      userId = insertedUser!.id
    }

    // Insert vote
    const voteData = {
      user_id: userId,
      fid,
      emoji,
      vote_date: today,
    }

    console.log("[submitVote.server] Debug - About to insert vote:", voteData)

    const { error: voteError } = await serviceSupabase
      .from("votes")
      .insert(voteData)

    if (voteError) {
      throw new Error(`Failed to submit vote: ${voteError.message}`)
    }

    revalidatePath("/vote")

    // Invalidate client SWR caches (best-effort)
    try {
      const mod = await import("@/components/SWRCacheManager")
      if (typeof mod.triggerVoteCacheUpdate === "function") {
        mod.triggerVoteCacheUpdate(today)
      }
    } catch {
      /* no-op */
    }

    return { success: true, voteDate: today }
  } catch (error: any) {
    console.error("[submitVote.server] error", error)
    return { success: false, error: error?.message ?? "Unknown error" }
  }
}
