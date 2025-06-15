"use server"

import { revalidatePath } from "next/cache"
import { getSession } from "@/auth"
import { supabase } from "@/lib/supabase"
import { createClient } from "@supabase/supabase-js"
import { getCurrentVotingDateString } from "@/lib/date-utils"

// Create service role client for admin operations
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

// Use specific FID for authorization (your FID or admin FID)
const AUTHORIZED_FIDS = [1090325] // Add your actual FID here

/**
 * Helper function to get a random emoji from a predefined set
 */
function getRandomEmoji(): string {
  const rainbowEmojis = [
    // Red
    "❤️",
    "🔥",
    "🌶️",
    "🍎",
    "🌹",
    "🚗",
    "👺",
    "🎈",
    // Orange
    "🧡",
    "🍊",
    "🥕",
    "🦊",
    "🍑",
    "🎃",
    "🧿",
    "🌅",
    // Yellow
    "💛",
    "⭐",
    "☀️",
    "🍌",
    "🌻",
    "⚡",
    "🐥",
    "🧀",
    // Green
    "💚",
    "🌱",
    "🍀",
    "🥬",
    "🐸",
    "🌲",
    "💸",
    "🍏",
    // Blue
    "💙",
    "🌊",
    "🧊",
    "🫐",
    "🐋",
    "💎",
    "🌀",
    "🦋",
    // Purple
    "💜",
    "🔮",
    "🍇",
    "🌂",
    "🦄",
    "👾",
    "🟣",
    "⚛️",
    // Pink
    "🩷",
    "🌸",
    "🦩",
    "💗",
    "🎀",
    "🌺",
    "🧠",
    "🍡",
  ]

  return rainbowEmojis[Math.floor(Math.random() * rainbowEmojis.length)]
}

/**
 * Manually update live_results table after dev votes are added
 * This ensures SWR gets fresh data across all browser sessions
 */
async function updateLiveResultsManually(today: string) {
  try {
    console.log("📊 Manually updating live_results table...")

    // Get all votes for today
    const { data: votes, error: votesError } = await adminSupabase
      .from("votes")
      .select("emoji")
      .eq("vote_date", today)

    if (votesError) {
      console.error("Error fetching votes for live_results update:", votesError)
      return
    }

    // Count votes by emoji
    const emojiCounts: { [key: string]: number } = {}
    votes?.forEach((vote) => {
      emojiCounts[vote.emoji] = (emojiCounts[vote.emoji] || 0) + 1
    })

    const totalVotes = votes?.length || 0

    // Update live_results table
    const { error: updateError } = await adminSupabase
      .from("live_results")
      .upsert(
        {
          vote_date: today,
          emoji_counts: emojiCounts,
          total_votes: totalVotes,
          last_updated_at: new Date().toISOString(),
        },
        {
          onConflict: "vote_date",
          ignoreDuplicates: false,
        }
      )

    if (updateError) {
      console.error("Error updating live_results:", updateError)
    } else {
      console.log(
        `📊 live_results updated: ${totalVotes} votes, ${
          Object.keys(emojiCounts).length
        } unique emojis`
      )
    }
  } catch (error) {
    console.error("Error in updateLiveResultsManually:", error)
  }
}

export async function addQuickVoteAction(emoji: string): Promise<{
  success: boolean
  message: string
}> {
  try {
    // Check if user is authenticated and authorized
    const session = await getSession()
    if (!session?.user?.fid || !AUTHORIZED_FIDS.includes(session.user.fid)) {
      throw new Error("Unauthorized")
    }

    const today = getCurrentVotingDateString()

    // Generate a higher FID to avoid conflicts with real users
    const fakeFid = Math.floor(Math.random() * 900000) + 100000

    // Create user first, then vote (matching real vote submission logic)
    const { data: userData, error: userError } = await adminSupabase
      .from("users")
      .upsert(
        {
          fid: fakeFid,
          username: `testuser${fakeFid}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "fid" }
      )
      .select("id")
      .single()

    if (userError || !userData) {
      throw new Error(`Failed to create test user: ${userError?.message}`)
    }

    // Now insert vote with proper user_id
    const { error: voteError } = await adminSupabase.from("votes").insert({
      user_id: userData.id,
      fid: fakeFid,
      emoji,
      vote_date: today,
    })

    if (voteError) {
      throw new Error(`Failed to insert vote: ${voteError.message}`)
    }

    // Manually update live_results table for real-time SWR updates
    await updateLiveResultsManually(today)

    // Revalidate paths
    revalidatePath("/vote")
    revalidatePath("/results")

    return {
      success: true,
      message: `Added vote for ${emoji}!`,
    }
  } catch (error) {
    console.error("Error adding quick vote:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function generateRandomVotesAction(count: number): Promise<{
  success: boolean
  message: string
}> {
  try {
    // Check if user is authenticated and authorized
    const session = await getSession()
    if (!session?.user?.fid || !AUTHORIZED_FIDS.includes(session.user.fid)) {
      throw new Error("Unauthorized")
    }

    const today = getCurrentVotingDateString()

    // Generate users first
    const userInserts = Array.from({ length: count }, (_, i) => {
      const fid = Math.floor(Math.random() * 900000) + 100000
      return {
        fid,
        username: `testuser${fid}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    })

    const { data: createdUsers, error: userError } = await adminSupabase
      .from("users")
      .upsert(userInserts, { onConflict: "fid" })
      .select("id, fid")

    if (userError || !createdUsers) {
      throw new Error(`Failed to create test users: ${userError?.message}`)
    }

    // Create FID to user_id mapping
    const fidToUserId = new Map(createdUsers.map((u) => [u.fid, u.id]))

    // Generate vote data with proper user_ids
    const baseTime = Date.now()
    const voteData = userInserts.map((user, idx) => ({
      user_id: fidToUserId.get(user.fid)!,
      fid: user.fid,
      emoji: getRandomEmoji(),
      vote_date: today,
      created_at: new Date(baseTime + idx * 250).toISOString(),
    }))

    // Use admin client for batch insert
    const { error: voteError } = await adminSupabase
      .from("votes")
      .insert(voteData)

    if (voteError) {
      throw new Error(`Failed to insert votes: ${voteError.message}`)
    }

    // Manually update live_results table for real-time SWR updates
    await updateLiveResultsManually(today)

    // Revalidate paths
    revalidatePath("/vote")
    revalidatePath("/results")

    return {
      success: true,
      message: `Added ${count} random votes!`,
    }
  } catch (error) {
    console.error("Error generating random votes:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function seedVotesForEmojiAction(
  emoji: string,
  count: number
): Promise<{
  success: boolean
  message: string
}> {
  try {
    // Check if user is authenticated and authorized
    const session = await getSession()
    if (!session?.user?.fid || !AUTHORIZED_FIDS.includes(session.user.fid)) {
      throw new Error("Unauthorized")
    }

    const today = getCurrentVotingDateString()

    // Generate users first
    const userInserts = Array.from({ length: count }, (_, i) => {
      const fid = Math.floor(Math.random() * 900000) + 100000
      return {
        fid,
        username: `testuser${fid}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    })

    const { data: createdUsers, error: userError } = await adminSupabase
      .from("users")
      .upsert(userInserts, { onConflict: "fid" })
      .select("id, fid")

    if (userError || !createdUsers) {
      throw new Error(`Failed to create test users: ${userError?.message}`)
    }

    // Create FID to user_id mapping
    const fidToUserId = new Map(createdUsers.map((u) => [u.fid, u.id]))

    // Generate vote data for specific emoji with proper user_ids
    const baseTime = Date.now()
    const voteData = userInserts.map((user, idx) => ({
      user_id: fidToUserId.get(user.fid)!,
      fid: user.fid,
      emoji,
      vote_date: today,
      created_at: new Date(baseTime + idx * 250).toISOString(),
    }))

    // Use admin client for batch insert
    const { error: voteError } = await adminSupabase
      .from("votes")
      .insert(voteData)

    if (voteError) {
      throw new Error(`Failed to insert votes: ${voteError.message}`)
    }

    // Manually update live_results table for real-time SWR updates
    await updateLiveResultsManually(today)

    // Revalidate paths
    revalidatePath("/vote")
    revalidatePath("/results")

    return {
      success: true,
      message: `Added ${voteData.length} votes for ${emoji}!`,
    }
  } catch (error) {
    console.error("Error seeding votes for emoji:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function clearAllVotesAction(): Promise<{
  success: boolean
  message: string
}> {
  try {
    // Check if user is authenticated and authorized
    const session = await getSession()
    if (!session?.user?.fid || !AUTHORIZED_FIDS.includes(session.user.fid)) {
      throw new Error("Unauthorized")
    }

    const today = getCurrentVotingDateString()

    // Delete all votes for today using service role
    const { error } = await adminSupabase
      .from("votes")
      .delete()
      .eq("vote_date", today)

    if (error) {
      throw new Error("Failed to clear votes")
    }

    // Manually update live_results table for real-time SWR updates
    await updateLiveResultsManually(today)

    // Revalidate paths
    revalidatePath("/vote")
    revalidatePath("/results")

    return {
      success: true,
      message: "All votes cleared!",
    }
  } catch (error) {
    console.error("Error clearing votes:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function changeMyVoteAction(emoji: string): Promise<{
  success: boolean
  message: string
}> {
  try {
    // Check if user is authenticated and authorized
    const session = await getSession()
    if (!session?.user?.fid || !AUTHORIZED_FIDS.includes(session.user.fid)) {
      throw new Error("Unauthorized")
    }

    const today = getCurrentVotingDateString()
    const fid = session.user.fid

    // Delete existing vote for today
    const { error: deleteError } = await adminSupabase
      .from("votes")
      .delete()
      .eq("fid", fid)
      .eq("vote_date", today)

    if (deleteError) {
      console.error("Error deleting existing vote:", deleteError)
    }

    // Get or create user
    const { data: userData, error: userError } = await adminSupabase
      .from("users")
      .upsert(
        {
          fid,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "fid" }
      )
      .select("id")
      .single()

    if (userError || !userData) {
      throw new Error(`Failed to get user: ${userError?.message}`)
    }

    // Insert new vote
    const { error: voteError } = await adminSupabase.from("votes").insert({
      user_id: userData.id,
      fid,
      emoji,
      vote_date: today,
    })

    if (voteError) {
      throw new Error(`Failed to insert vote: ${voteError.message}`)
    }

    // Manually update live_results table for real-time SWR updates
    await updateLiveResultsManually(today)

    // Revalidate paths
    revalidatePath("/vote")
    revalidatePath("/results")

    return {
      success: true,
      message: `Changed your vote to ${emoji}!`,
    }
  } catch (error) {
    console.error("Error changing vote:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function addVoteWithDateTimeAction(
  emoji: string,
  voteDate: string,
  voteTime: string
): Promise<{
  success: boolean
  message: string
}> {
  try {
    // Check if user is authenticated and authorized
    const session = await getSession()
    if (!session?.user?.fid || !AUTHORIZED_FIDS.includes(session.user.fid)) {
      throw new Error("Unauthorized")
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(voteDate)) {
      throw new Error("Invalid date format. Use YYYY-MM-DD")
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (!timeRegex.test(voteTime)) {
      throw new Error("Invalid time format. Use HH:MM (24-hour)")
    }

    // Create the exact timestamp
    const voteDateTime = new Date(`${voteDate}T${voteTime}:00.000Z`)
    if (isNaN(voteDateTime.getTime())) {
      throw new Error("Invalid date/time combination")
    }

    // Generate a higher FID to avoid conflicts with real users
    const fakeFid = Math.floor(Math.random() * 900000) + 100000

    // Create user first
    const { data: userData, error: userError } = await adminSupabase
      .from("users")
      .upsert(
        {
          fid: fakeFid,
          username: `testuser${fakeFid}`,
          created_at: voteDateTime.toISOString(),
          updated_at: voteDateTime.toISOString(),
        },
        { onConflict: "fid" }
      )
      .select("id")
      .single()

    if (userError || !userData) {
      throw new Error(`Failed to create test user: ${userError?.message}`)
    }

    // Insert vote with custom date and time
    const { error: voteError } = await adminSupabase.from("votes").insert({
      user_id: userData.id,
      fid: fakeFid,
      emoji,
      vote_date: voteDate,
      created_at: voteDateTime.toISOString(),
    })

    if (voteError) {
      throw new Error(`Failed to insert vote: ${voteError.message}`)
    }

    // If this is for today, update live_results
    const today = getCurrentVotingDateString()
    if (voteDate === today) {
      await updateLiveResultsManually(today)
    }

    // Revalidate paths
    revalidatePath("/vote")
    revalidatePath("/results")
    revalidatePath("/profile")

    return {
      success: true,
      message: `Added vote for ${emoji} on ${voteDate} at ${voteTime} UTC!`,
    }
  } catch (error) {
    console.error("Error adding vote with date/time:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Helper function to trigger cache invalidation on the client side
 * This ensures all open browser tabs see the updated vote data immediately
 */
async function triggerClientCacheInvalidation(date: string) {
  // We can't directly call client-side functions from server actions,
  // but we can set up a mechanism using database or other signals
  // For now, we rely on the revalidatePath calls and SWR's refresh intervals
  console.log(
    "📡 Server action completed, client will detect changes via SWR refresh"
  )
}
