"use server"

import { revalidatePath } from "next/cache"
import { getSession } from "@/auth"
import { supabase } from "@/lib/supabase"
import { createClient } from "@supabase/supabase-js"
import { updateChyronOnVoteChange } from "@/actions/race-commentary"
import { getCurrentVotingDateString } from "@/lib/date-utils"

export interface EmojiVoteCount {
  emoji: string
  count: number
  percentage: number
  accent_color: string
  filename: string
  rank?: number
}

// Function to upsert user with username tracking
async function upsertUserWithUsername(
  fid: number,
  username?: string,
  displayName?: string
) {
  try {
    // Get existing user
    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("id, username, previous_usernames")
      .eq("fid", fid)
      .single()

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116 = no rows returned
      console.error(
        `[upsertUserWithUsername] Error fetching user for FID ${fid}:`,
        fetchError
      )
      throw new Error(`Failed to fetch user: ${fetchError.message}`)
    }

    if (existingUser) {
      // User exists - check if username changed
      const needsUpdate = username && username !== existingUser.username

      if (needsUpdate) {
        let previousUsernames = existingUser.previous_usernames || []

        // Add old username to previous_usernames if it exists and isn't already there
        if (
          existingUser.username &&
          !previousUsernames.includes(existingUser.username)
        ) {
          previousUsernames = [...previousUsernames, existingUser.username]
        }

        // Update user with new username and previous usernames
        const { data: updatedUser, error: updateError } = await supabase
          .from("users")
          .update({
            username,
            previous_usernames: previousUsernames,
            last_updated: new Date().toISOString(),
          })
          .eq("fid", fid)
          .select("id")
          .single()

        if (updateError) {
          console.error(
            `[upsertUserWithUsername] Error updating user for FID ${fid}:`,
            updateError
          )
          throw new Error(`Failed to update user: ${updateError.message}`)
        }

        return updatedUser.id
      }

      return existingUser.id
    } else {
      // Create new user
      const { data: newUser, error: userError } = await supabase
        .from("users")
        .insert({
          fid,
          username: username || null,
          previous_usernames: [],
          last_updated: new Date().toISOString(),
        })
        .select("id")
        .single()

      if (userError) {
        console.error(
          `[upsertUserWithUsername] Error creating user for FID ${fid}:`,
          userError
        )
        throw new Error(`Failed to create user: ${userError.message}`)
      }

      return newUser.id
    }
  } catch (error) {
    console.error(`[upsertUserWithUsername] Error for FID ${fid}:`, error)
    throw error
  }
}

// Service role version of upsertUserWithUsername
async function upsertUserWithUsernameServiceRole(
  fid: number,
  serviceSupabase: any,
  username?: string,
  displayName?: string
) {
  try {
    // Get existing user
    const { data: existingUser, error: fetchError } = await serviceSupabase
      .from("users")
      .select("id, username, previous_usernames")
      .eq("fid", fid)
      .single()

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116 = no rows returned
      console.error(
        `[upsertUserWithUsernameServiceRole] Error fetching user for FID ${fid}:`,
        fetchError
      )
      throw new Error(`Failed to fetch user: ${fetchError.message}`)
    }

    if (existingUser) {
      // User exists - check if username changed
      const needsUpdate = username && username !== existingUser.username

      if (needsUpdate) {
        let previousUsernames = existingUser.previous_usernames || []

        // Add old username to previous_usernames if it exists and isn't already there
        if (
          existingUser.username &&
          !previousUsernames.includes(existingUser.username)
        ) {
          previousUsernames = [...previousUsernames, existingUser.username]
        }

        // Update user with new username and previous usernames
        const { data: updatedUser, error: updateError } = await serviceSupabase
          .from("users")
          .update({
            username,
            previous_usernames: previousUsernames,
            last_updated: new Date().toISOString(),
          })
          .eq("fid", fid)
          .select("id")
          .single()

        if (updateError) {
          console.error(
            `[upsertUserWithUsernameServiceRole] Error updating user for FID ${fid}:`,
            updateError
          )
          throw new Error(`Failed to update user: ${updateError.message}`)
        }

        return updatedUser.id
      }

      return existingUser.id
    } else {
      // Create new user
      const { data: newUser, error: userError } = await serviceSupabase
        .from("users")
        .insert({
          fid,
          username: username || null,
          previous_usernames: [],
          last_updated: new Date().toISOString(),
        })
        .select("id")
        .single()

      if (userError) {
        console.error(
          `[upsertUserWithUsernameServiceRole] Error creating user for FID ${fid}:`,
          userError
        )
        throw new Error(`Failed to create user: ${userError.message}`)
      }

      return newUser.id
    }
  } catch (error) {
    console.error(
      `[upsertUserWithUsernameServiceRole] Error for FID ${fid}:`,
      error
    )
    throw error
  }
}

export async function submitVote(
  emoji: string,
  username?: string,
  displayName?: string
) {
  try {
    // Check authentication
    const session = await getSession()

    if (!session) {
      throw new Error("No active session found. Please sign in again.")
    }

    if (!session.user) {
      throw new Error("Invalid session. Please sign in again.")
    }

    if (!session.user.fid) {
      throw new Error("Invalid user session. Please sign in again.")
    }

    if (!emoji) {
      throw new Error("Emoji is required")
    }

    const fid = session.user.fid
    const today = getCurrentVotingDateString()

    // Use service role for all database operations to avoid RLS issues with triggers
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if user already voted today (using fid directly for efficiency)
    const { data: existingVote, error: voteCheckError } = await serviceSupabase
      .from("votes")
      .select("id")
      .eq("fid", fid)
      .eq("vote_date", today)
      .single()

    if (voteCheckError && voteCheckError.code !== "PGRST116") {
      // PGRST116 = no rows returned
      console.error(
        `[submitVote] Error checking existing vote for FID ${fid}:`,
        voteCheckError
      )
      throw new Error(
        `Failed to check voting status: ${voteCheckError.message}`
      )
    }

    if (existingVote) {
      throw new Error("You have already voted today")
    }

    // Upsert user with username tracking (using service role)
    const userId = await upsertUserWithUsernameServiceRole(
      fid,
      serviceSupabase,
      username,
      displayName
    )

    // Insert the vote with both user_id and fid for redundancy and query efficiency
    const { error: voteError } = await serviceSupabase.from("votes").insert({
      user_id: userId,
      fid: fid,
      emoji,
      vote_date: today,
    })

    if (voteError) {
      console.error(
        `[submitVote] Error inserting vote for FID ${fid}:`,
        voteError
      )
      throw new Error(`Failed to submit vote: ${voteError.message}`)
    }

    // Update chyron text with new commentary reflecting the vote change
    try {
      await updateChyronOnVoteChange()
    } catch (chyronError) {
      // Don't fail the entire vote submission if chyron update fails
      console.error("Failed to update chyron after vote:", chyronError)
    }

    revalidatePath("/vote")
    return {
      success: true,
      message: "Vote submitted successfully",
      voteDate: today, // Add date for client-side cache invalidation
    }
  } catch (error) {
    console.error(`[submitVote] Final error:`, error)
    throw error
  }
}

export async function getVotingResults(limit?: number) {
  try {
    // Check authentication
    const session = await getSession()
    if (!session?.user?.fid) {
      throw new Error("Authentication required")
    }

    const fid = session.user.fid
    const today = new Date().toISOString().split("T")[0]

    // Check if user has voted today (using fid directly for efficiency)
    const { data: userVote } = await supabase
      .from("votes")
      .select("emoji")
      .eq("fid", fid)
      .eq("vote_date", today)
      .single()

    if (!userVote) {
      return null // User hasn't voted yet
    }

    // Get all votes for today (using fid for efficiency)
    const { data: allVotes, error: votesError } = await supabase
      .from("votes")
      .select("emoji")
      .eq("vote_date", today)

    if (votesError) {
      console.error("Error fetching votes:", votesError)
      throw new Error("Failed to fetch results")
    }

    // Count votes by emoji
    const voteCounts: { [key: string]: number } = {}
    const totalVotes = allVotes.length

    allVotes.forEach((vote: { emoji: string }) => {
      voteCounts[vote.emoji] = (voteCounts[vote.emoji] || 0) + 1
    })

    // Sort emojis by vote count first, then optionally limit
    const sortedEmojiEntries = Object.entries(voteCounts).sort(
      ([, a], [, b]) => b - a
    )

    // Apply limit if specified (for initial load of top results)
    const emojiEntriesToProcess = limit
      ? sortedEmojiEntries.slice(0, limit)
      : sortedEmojiEntries
    const uniqueEmojis = emojiEntriesToProcess.map(([emoji]) => emoji)

    // Batch emoji metadata lookups to prevent 502 errors with large queries
    let emojiData: any[] = []
    const batchSize = 75 // Safe batch size to avoid SQL query limits

    for (let i = 0; i < uniqueEmojis.length; i += batchSize) {
      const batch = uniqueEmojis.slice(i, i + batchSize)

      // Handle variation selector normalization for this batch
      const emojiVariants = batch
        .flatMap((emoji) => [
          emoji,
          emoji + "\uFE0F", // Add variation selector
          emoji.replace(/\uFE0F/g, ""), // Remove variation selector
        ])
        .filter((v, i, arr) => arr.indexOf(v) === i) // Remove duplicates

      try {
        const { data: batchData, error: batchError } = await supabase
          .from("emojis")
          .select("emoji, accent_color, filename")
          .in("emoji", emojiVariants)

        if (batchError) {
          console.error(
            `Error fetching emoji batch ${i / batchSize + 1}:`,
            batchError
          )
          // Continue with other batches even if one fails
        } else {
          emojiData.push(...(batchData || []))
        }
      } catch (error) {
        console.error(
          `Failed to fetch emoji batch ${i / batchSize + 1}:`,
          error
        )
        // Continue with other batches
      }
    }

    // Create a map for quick emoji data lookup (handle variation selectors)
    const emojiDataMap = new Map()
    emojiData?.forEach((emoji) => {
      // Map both the original emoji and its variation selector variants
      const baseEmoji = emoji.emoji.replace(/\uFE0F/g, "") // Remove variation selector
      const withVariationSelector = baseEmoji + "\uFE0F" // Add variation selector

      emojiDataMap.set(emoji.emoji, emoji) // Original form
      emojiDataMap.set(baseEmoji, emoji) // Base form
      emojiDataMap.set(withVariationSelector, emoji) // With variation selector
    })

    // Fetch timing data for ranking - get all votes with timestamps for today
    // Initialize timing map first
    const emojiTimingMap = new Map()

    // Skip timing fetch if too many emojis (performance optimization)
    if (uniqueEmojis.length <= 200) {
      const { data: voteTimingData, error: timingError } = await supabase
        .from("votes")
        .select("emoji, created_at")
        .eq("vote_date", today)

      if (timingError) {
        console.error("Error fetching vote timing data:", timingError)
        // Fall back to count-based sorting if timing data fails
      }

      // Calculate average timestamps for each emoji (for ranking)
      if (voteTimingData) {
        // Calculate day start for relative timing (similar to tally-votes.ts approach)
        const dayStart = new Date(today + "T00:00:00.000Z").getTime()

        // Group votes by emoji and calculate timing stats
        const emojiTimings: { [key: string]: number[] } = {}
        voteTimingData.forEach((vote) => {
          if (!emojiTimings[vote.emoji]) {
            emojiTimings[vote.emoji] = []
          }
          const voteTime = new Date(vote.created_at).getTime()
          const secondsSinceStart = Math.floor((voteTime - dayStart) / 1000)
          emojiTimings[vote.emoji].push(secondsSinceStart)
        })

        // Calculate average timestamp for each emoji
        Object.entries(emojiTimings).forEach(([emoji, timestamps]) => {
          const averageTimestamp =
            timestamps.reduce((sum, ts) => sum + ts, 0) / timestamps.length
          emojiTimingMap.set(emoji, averageTimestamp)
        })
      }
    } else {
      // Skip timing data for performance when there are too many unique emojis
    }

    // Convert to array with percentages and emoji data
    const results: EmojiVoteCount[] = emojiEntriesToProcess
      .map(([emoji, count]) => {
        const emojiInfo = emojiDataMap.get(emoji)
        return {
          emoji,
          count,
          percentage: Math.round((count / totalVotes) * 100),
          accent_color: emojiInfo?.accent_color || "#FFFFFF",
          filename: emojiInfo?.filename || "",
        }
      })
      // Sort by average timing (later votes ranked higher), then by count as secondary
      .sort((a, b) => {
        const aAvgTiming = emojiTimingMap.get(a.emoji) || 0
        const bAvgTiming = emojiTimingMap.get(b.emoji) || 0

        // If timing data is available, sort by latest average first
        if (emojiTimingMap.size > 0) {
          const timingDiff = bAvgTiming - aAvgTiming
          if (Math.abs(timingDiff) > 1) {
            // Only use timing if there's a meaningful difference
            return timingDiff
          }
        }

        // Fall back to count-based sorting if timing is very close or unavailable
        return b.count - a.count
      })

    return {
      results,
      totalVotes,
      userVote: userVote.emoji,
      voteDate: today,
    }
  } catch (error) {
    console.error("Error in getVotingResults:", error)
    throw error
  }
}

export async function getLiveVotingResults(limit?: number) {
  try {
    // Check authentication
    const session = await getSession()

    if (!session?.user?.fid) {
      throw new Error("Authentication required")
    }

    const fid = session.user.fid
    const today = new Date().toISOString().split("T")[0]

    // Check if user has voted today (using fid directly for efficiency)
    const { data: userVote, error: userVoteError } = await supabase
      .from("votes")
      .select("emoji")
      .eq("fid", fid)
      .eq("vote_date", today)
      .single()

    if (!userVote) {
      return null // User hasn't voted yet
    }

    // Get live results for today
    const { data: liveResult, error: liveResultError } = await supabase
      .from("live_results")
      .select("emoji_counts, total_votes, last_updated_at")
      .eq("vote_date", today)
      .single()

    if (liveResultError) {
      console.error("Error fetching live results:", liveResultError)
      // Fall back to the original method if live_results doesn't exist
      const fallbackResult = await getVotingResults(limit)
      if (fallbackResult) {
        return {
          ...fallbackResult,
          lastUpdated: new Date().toISOString(),
        }
      }
      return null
    }

    if (!liveResult || !liveResult.emoji_counts) {
      return {
        results: [],
        totalVotes: 0,
        userVote: userVote.emoji,
        voteDate: today,
        lastUpdated: new Date().toISOString(),
      }
    }

    const voteCounts = liveResult.emoji_counts as { [key: string]: number }
    const totalVotes = liveResult.total_votes

    // Sort emojis by vote count first, then optionally limit
    const sortedEmojiEntries = Object.entries(voteCounts).sort(
      ([, a], [, b]) => b - a
    )

    // Apply limit if specified (for initial load of top results)
    const emojiEntriesToProcess = limit
      ? sortedEmojiEntries.slice(0, limit)
      : sortedEmojiEntries
    const uniqueEmojis = emojiEntriesToProcess.map(([emoji]) => emoji)

    // Batch emoji metadata lookups - much smaller now!
    let emojiData: any[] = []
    const batchSize = 75 // Safe batch size to avoid SQL query limits

    for (let i = 0; i < uniqueEmojis.length; i += batchSize) {
      const batch = uniqueEmojis.slice(i, i + batchSize)

      // Handle variation selector normalization for this batch
      const emojiVariants = batch
        .flatMap((emoji) => [
          emoji,
          emoji + "\uFE0F", // Add variation selector
          emoji.replace(/\uFE0F/g, ""), // Remove variation selector
        ])
        .filter((v, i, arr) => arr.indexOf(v) === i) // Remove duplicates

      try {
        const { data: batchData, error: batchError } = await supabase
          .from("emojis")
          .select("emoji, accent_color, filename")
          .in("emoji", emojiVariants)

        if (batchError) {
          console.error(
            `Error fetching emoji batch ${i / batchSize + 1}:`,
            batchError
          )
          // Continue with other batches even if one fails
        } else {
          emojiData.push(...(batchData || []))
        }
      } catch (error) {
        console.error(
          `Failed to fetch emoji batch ${i / batchSize + 1}:`,
          error
        )
        // Continue with other batches
      }
    }

    // Create a map for quick emoji data lookup (handle variation selectors)
    const emojiDataMap = new Map()
    emojiData?.forEach((emoji) => {
      // Map both the original emoji and its variation selector variants
      const baseEmoji = emoji.emoji.replace(/\uFE0F/g, "") // Remove variation selector
      const withVariationSelector = baseEmoji + "\uFE0F" // Add variation selector

      emojiDataMap.set(emoji.emoji, emoji) // Original form
      emojiDataMap.set(baseEmoji, emoji) // Base form
      emojiDataMap.set(withVariationSelector, emoji) // With variation selector
    })

    // Skip timing data when we have a limit (initial load) for better performance
    const emojiTimingMap = new Map()
    if (!limit && uniqueEmojis.length <= 200) {
      const { data: voteTimingData, error: timingError } = await supabase
        .from("votes")
        .select("emoji, created_at")
        .eq("vote_date", today)

      if (timingError) {
        console.error("Error fetching vote timing data:", timingError)
      }

      if (voteTimingData) {
        const dayStart = new Date(today + "T00:00:00.000Z").getTime()
        const emojiTimings: { [key: string]: number[] } = {}

        voteTimingData.forEach((vote) => {
          if (!emojiTimings[vote.emoji]) {
            emojiTimings[vote.emoji] = []
          }
          const voteTime = new Date(vote.created_at).getTime()
          const secondsSinceStart = Math.floor((voteTime - dayStart) / 1000)
          emojiTimings[vote.emoji].push(secondsSinceStart)
        })

        Object.entries(emojiTimings).forEach(([emoji, timestamps]) => {
          const averageTimestamp =
            timestamps.reduce((sum, ts) => sum + ts, 0) / timestamps.length
          emojiTimingMap.set(emoji, averageTimestamp)
        })
      }
    }

    // Convert to array with percentages and emoji data
    const results: EmojiVoteCount[] = emojiEntriesToProcess
      .map(([emoji, count]) => {
        const emojiInfo = emojiDataMap.get(emoji)
        return {
          emoji,
          count,
          percentage: Math.round((count / totalVotes) * 100),
          accent_color: emojiInfo?.accent_color || "#FFFFFF",
          filename: emojiInfo?.filename || "",
        }
      })
      // Apply timing-based sorting only for full results
      .sort((a, b) => {
        if (!limit && emojiTimingMap.size > 0) {
          const aAvgTiming = emojiTimingMap.get(a.emoji) || 0
          const bAvgTiming = emojiTimingMap.get(b.emoji) || 0
          const timingDiff = bAvgTiming - aAvgTiming
          if (Math.abs(timingDiff) > 1) {
            return timingDiff
          }
        }
        // Already sorted by count, so maintain that order
        return 0
      })

    return {
      results,
      totalVotes,
      userVote: userVote.emoji,
      voteDate: today,
      lastUpdated: liveResult.last_updated_at || new Date().toISOString(),
    }
  } catch (error) {
    console.error("Error in getLiveVotingResults:", error)
    throw error
  }
}

export async function getDailyResultsData(
  offset: number = 0,
  limit: number = 10
) {
  try {
    // Check authentication
    const session = await getSession()
    if (!session?.user?.fid) {
      throw new Error("Authentication required")
    }

    const fid = session.user.fid
    const today = new Date().toISOString().split("T")[0]

    // Check if user has voted today
    const { data: userVote } = await supabase
      .from("votes")
      .select("emoji")
      .eq("fid", fid)
      .eq("vote_date", today)
      .single()

    if (!userVote) {
      return null // User hasn't voted yet
    }

    // Get results from daily_results table
    const { data: dailyResult, error: dailyError } = await supabase
      .from("daily_results")
      .select("emoji_votes, total_votes, winning_emoji, created_at")
      .eq("vote_date", today)
      .single()

    if (dailyError || !dailyResult || !dailyResult.emoji_votes) {
      console.error("Error fetching daily results:", dailyError)
      return null
    }

    const emojiVotes = dailyResult.emoji_votes as { [key: string]: number }
    const totalVotes = dailyResult.total_votes || 0

    // Sort emojis by vote count
    const sortedEmojis = Object.entries(emojiVotes)
      .sort(([, a], [, b]) => b - a)
      .slice(offset, offset + limit)

    if (sortedEmojis.length === 0) {
      return {
        results: [],
        totalVotes,
        userVote: userVote.emoji,
        voteDate: today,
        hasMore: false,
        totalUniqueEmojis: Object.keys(emojiVotes).length,
        lastUpdated: dailyResult.created_at,
      }
    }

    // Get emoji metadata for the requested page
    const emojisToFetch = sortedEmojis.map(([emoji]) => emoji)

    // Handle variation selector normalization
    const emojiVariants = emojisToFetch
      .flatMap((emoji) => [
        emoji,
        emoji + "\uFE0F", // Add variation selector
        emoji.replace(/\uFE0F/g, ""), // Remove variation selector
      ])
      .filter((v, i, arr) => arr.indexOf(v) === i) // Remove duplicates

    const { data: emojiData, error: emojiError } = await supabase
      .from("emojis")
      .select("emoji, accent_color, filename")
      .in("emoji", emojiVariants)

    if (emojiError) {
      console.error("Error fetching emoji data:", emojiError)
    }

    // Create a map for quick emoji data lookup
    const emojiDataMap = new Map()
    emojiData?.forEach((emoji) => {
      const baseEmoji = emoji.emoji.replace(/\uFE0F/g, "")
      const withVariationSelector = baseEmoji + "\uFE0F"

      emojiDataMap.set(emoji.emoji, emoji)
      emojiDataMap.set(baseEmoji, emoji)
      emojiDataMap.set(withVariationSelector, emoji)
    })

    // Build results array
    const results: EmojiVoteCount[] = sortedEmojis.map(
      ([emoji, count], index) => {
        const emojiInfo = emojiDataMap.get(emoji)
        return {
          emoji,
          count,
          percentage: Math.round((count / totalVotes) * 100),
          accent_color: emojiInfo?.accent_color || "#FFFFFF",
          filename: emojiInfo?.filename || "",
          rank: offset + index + 1,
        }
      }
    )

    return {
      results,
      totalVotes,
      userVote: userVote.emoji,
      voteDate: today,
      hasMore: offset + limit < Object.keys(emojiVotes).length,
      totalUniqueEmojis: Object.keys(emojiVotes).length,
      lastUpdated: dailyResult.created_at,
    }
  } catch (error) {
    console.error("Error in getDailyResultsData:", error)
    throw error
  }
}

export async function getDailySummaries() {
  try {
    const { data, error } = await supabase
      .from("daily_summaries")
      .select("id, vote_date, winning_emoji, winning_count, total_votes")
      .order("vote_date", { ascending: false })

    if (error) {
      console.error("Error fetching daily summaries:", error)
      throw new Error("Failed to fetch daily summaries")
    }

    return data || []
  } catch (error) {
    console.error("Error in getDailySummaries:", error)
    throw error
  }
}

export async function clearUserVote() {
  try {
    // Check authentication
    const session = await getSession()

    if (!session) {
      throw new Error("No active session found. Please sign in again.")
    }

    if (!session.user) {
      throw new Error("Invalid session. Please sign in again.")
    }

    if (!session.user.fid) {
      throw new Error("Invalid user session. Please sign in again.")
    }

    const fid = session.user.fid
    const today = new Date().toISOString().split("T")[0]

    // Use service role for the deletion to avoid RLS issues with triggers
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await serviceSupabase
      .from("votes")
      .delete()
      .eq("fid", fid)
      .eq("vote_date", today)
      .select()

    if (error) {
      console.error(`[clearUserVote] Database error:`, error)
      throw new Error(`Failed to clear vote: ${error.message}`)
    }

    revalidatePath("/vote")
    return {
      success: true,
      message:
        data?.length === 0
          ? "No vote found to clear for today"
          : `Vote cleared successfully (${data.length} vote(s) removed)`,
    }
  } catch (error) {
    console.error(`[clearUserVote] Final error:`, error)
    throw error
  }
}

export interface UserVote {
  vote_date: string
  emoji: string
  created_at: string
  accent_color?: string
  filename?: string
}

export interface UserProfile {
  fid: number
  username?: string
  currentStreak: number
  longestStreak: number
  totalVotes: number
  votingHistory: UserVote[]
}

export async function getUserVotingHistory(): Promise<UserVote[]> {
  try {
    const session = await getSession()
    if (!session?.user?.fid) {
      throw new Error("Authentication required")
    }

    const fid = session.user.fid

    // Get all user's votes ordered by date (most recent first)
    const { data: userVotes, error: votesError } = await supabase
      .from("votes")
      .select("vote_date, emoji, created_at")
      .eq("fid", fid)
      .order("vote_date", { ascending: false })

    if (votesError) {
      console.error("Error fetching user votes:", votesError)
      throw new Error("Failed to fetch voting history")
    }

    if (!userVotes || userVotes.length === 0) {
      return []
    }

    // Get emoji metadata for all voted emojis
    const uniqueEmojis = Array.from(
      new Set(userVotes.map((vote) => vote.emoji))
    )

    // Handle variation selector normalization
    const emojiVariants = uniqueEmojis
      .flatMap((emoji) => [
        emoji,
        emoji + "\uFE0F", // Add variation selector
        emoji.replace(/\uFE0F/g, ""), // Remove variation selector
      ])
      .filter((v, i, arr) => arr.indexOf(v) === i) // Remove duplicates

    const { data: emojiData, error: emojiError } = await supabase
      .from("emojis")
      .select("emoji, accent_color, filename")
      .in("emoji", emojiVariants)

    if (emojiError) {
      console.error("Error fetching emoji data:", emojiError)
    }

    // Create a map for quick emoji data lookup
    const emojiDataMap = new Map()
    emojiData?.forEach((emoji) => {
      const baseEmoji = emoji.emoji.replace(/\uFE0F/g, "")
      const withVariationSelector = baseEmoji + "\uFE0F"

      emojiDataMap.set(emoji.emoji, emoji)
      emojiDataMap.set(baseEmoji, emoji)
      emojiDataMap.set(withVariationSelector, emoji)
    })

    // Combine vote data with emoji metadata
    return userVotes.map((vote) => {
      const emojiInfo = emojiDataMap.get(vote.emoji)
      return {
        vote_date: vote.vote_date,
        emoji: vote.emoji,
        created_at: vote.created_at,
        accent_color: emojiInfo?.accent_color,
        filename: emojiInfo?.filename,
      }
    })
  } catch (error) {
    console.error("Error in getUserVotingHistory:", error)
    throw error
  }
}

export async function calculateVotingStreak(): Promise<{
  currentStreak: number
  longestStreak: number
}> {
  try {
    const session = await getSession()
    if (!session?.user?.fid) {
      throw new Error("Authentication required")
    }

    const fid = session.user.fid

    // Get all user's vote dates
    const { data: userVotes, error: votesError } = await supabase
      .from("votes")
      .select("vote_date")
      .eq("fid", fid)
      .order("vote_date", { ascending: false })

    if (votesError) {
      console.error("Error fetching user votes for streak:", votesError)
      throw new Error("Failed to calculate voting streak")
    }

    if (!userVotes || userVotes.length === 0) {
      return { currentStreak: 0, longestStreak: 0 }
    }

    // Get unique vote dates and sort them (most recent first)
    const voteDates = Array.from(
      new Set(userVotes.map((vote) => vote.vote_date))
    ).sort((a, b) => b.localeCompare(a))

    const today = new Date().toISOString().split("T")[0]
    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0

    // Check if user voted today or yesterday (current streak might continue)
    const mostRecentVote = voteDates[0]
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0]

    let streakStartDate = today
    if (mostRecentVote === today) {
      currentStreak = 1
      streakStartDate = today
    } else if (mostRecentVote === yesterday) {
      currentStreak = 1
      streakStartDate = yesterday
    } else {
      // No recent votes, current streak is 0
      currentStreak = 0
    }

    // Calculate current streak by working backwards from the most recent vote
    if (currentStreak > 0) {
      let checkDate = new Date(streakStartDate)
      let streakIndex = 0

      while (streakIndex < voteDates.length) {
        const checkDateString = checkDate.toISOString().split("T")[0]

        if (voteDates[streakIndex] === checkDateString) {
          currentStreak = streakIndex + 1
          streakIndex++
        } else {
          // Gap found, stop counting current streak
          break
        }

        // Move to previous day
        checkDate.setDate(checkDate.getDate() - 1)
      }
    }

    // Calculate longest streak by checking all possible consecutive sequences
    tempStreak = 0
    for (let i = 0; i < voteDates.length; i++) {
      let consecutiveCount = 1
      let currentDate = new Date(voteDates[i])

      // Look for consecutive days going backwards
      for (let j = i + 1; j < voteDates.length; j++) {
        const expectedPrevDate = new Date(currentDate)
        expectedPrevDate.setDate(expectedPrevDate.getDate() - 1)
        const expectedDateString = expectedPrevDate.toISOString().split("T")[0]

        if (voteDates[j] === expectedDateString) {
          consecutiveCount++
          currentDate = expectedPrevDate
        } else {
          break
        }
      }

      longestStreak = Math.max(longestStreak, consecutiveCount)
    }

    return { currentStreak, longestStreak }
  } catch (error) {
    console.error("Error calculating voting streak:", error)
    throw error
  }
}

export async function getUserProfile(): Promise<UserProfile> {
  try {
    const session = await getSession()
    if (!session?.user?.fid) {
      throw new Error("Authentication required")
    }

    const fid = session.user.fid

    // Get user data, voting history, and streak in parallel
    const [votingHistory, streakData] = await Promise.all([
      getUserVotingHistory(),
      calculateVotingStreak(),
    ])

    // Get username from session context or user table
    const { data: userData } = await supabase
      .from("users")
      .select("username")
      .eq("fid", fid)
      .single()

    return {
      fid,
      username: userData?.username || undefined,
      currentStreak: streakData.currentStreak,
      longestStreak: streakData.longestStreak,
      totalVotes: votingHistory.length,
      votingHistory,
    }
  } catch (error) {
    console.error("Error in getUserProfile:", error)
    throw error
  }
}
