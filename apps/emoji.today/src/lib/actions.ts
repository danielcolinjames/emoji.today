"use server"

import { revalidatePath } from "next/cache"
import { getSession } from "@/auth"
import { supabase } from "@/lib/supabase"
import { supabaseService } from "@/lib/supabase-service"
import { updateChyronOnVoteChange } from "@/actions/race-commentary"
import {
  getCurrentVotingDateString,
  getCurrentVotingDay,
  formatDateForDB,
} from "@/lib/date-utils"
import { buildSimpleRankings } from "@/lib/simple-ranking"

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
    // Check authentication (either Warpcast fid or Base wallet)
    const session = await getSession()
    if (!session || !session.user) {
      throw new Error("Authentication required")
    }

    if (!emoji) {
      throw new Error("Emoji is required")
    }

    const fid = session.user.fid
    const today = getCurrentVotingDateString()

    // Use service role for all database operations to avoid RLS issues with triggers
    const serviceSupabase = supabaseService()

    // Check if user already voted today (by fid)
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

    // Resolve user_id by fid
    let userId: string
    userId = String(
      await upsertUserWithUsernameServiceRole(
        fid,
        serviceSupabase,
        username,
        displayName
      )
    )

    // Insert the vote with both user_id and fid for redundancy and query efficiency
    const { error: voteError } = await serviceSupabase
      .from("votes")
      .insert({ user_id: userId, fid, emoji, vote_date: today })

    if (voteError) {
      console.error(
        `[submitVote] Error inserting vote for FID ${fid}:`,
        voteError
      )
      throw new Error(`Failed to submit vote: ${voteError.message}`)
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

    // Get vote timing data for simple ranking (vote count + latest vote tiebreaker)
    const { data: voteTimingData, error: timingError } = await supabase
      .from("votes")
      .select("emoji, created_at")
      .eq("vote_date", today)

    if (timingError) {
      console.error("Error fetching vote timing data:", timingError)
    }

    // Use simple ranking that matches chyron service: vote count + latest vote tiebreaker
    const simpleRankings = buildSimpleRankings(
      voteCounts,
      totalVotes,
      voteTimingData || [],
      limit
    )

    // Convert to the format expected by the UI
    const results: EmojiVoteCount[] = simpleRankings.map((ranking) => {
      const emojiInfo = emojiDataMap.get(ranking.emoji)
      return {
        emoji: ranking.emoji,
        count: ranking.count,
        percentage: ranking.percentage,
        accent_color: emojiInfo?.accent_color || "#FFFFFF",
        filename: emojiInfo?.filename || "",
      }
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

    // Get vote timing data for simple ranking (vote count + latest vote tiebreaker)
    const { data: voteTimingData, error: timingError } = await supabase
      .from("votes")
      .select("emoji, created_at")
      .eq("vote_date", today)

    if (timingError) {
      console.error("Error fetching vote timing data:", timingError)
    }

    // Use simple ranking that matches chyron service: vote count + latest vote tiebreaker
    const simpleRankings = buildSimpleRankings(
      voteCounts,
      totalVotes,
      voteTimingData || [],
      limit
    )

    // Convert to the format expected by the UI
    const results: EmojiVoteCount[] = simpleRankings.map((ranking) => {
      const emojiInfo = emojiDataMap.get(ranking.emoji)
      return {
        emoji: ranking.emoji,
        count: ranking.count,
        percentage: ranking.percentage,
        accent_color: emojiInfo?.accent_color || "#FFFFFF",
        filename: emojiInfo?.filename || "",
      }
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
    const serviceSupabase = supabaseService()

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
  winning_emoji?: string
  is_winner?: boolean
  is_first_vote?: boolean
}

export interface UserProfile {
  fid: number
  username?: string
  currentStreak: number
  longestStreak: number
  totalVotes: number
  correctGuesses: number
  votingHistory: (UserVote | { vote_date: string; is_missed_day: true })[]
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

    // Get winning emoji data for all vote dates
    const voteDates = Array.from(
      new Set(userVotes.map((vote) => vote.vote_date))
    )
    const { data: dailySummaries } = await supabase
      .from("daily_summaries")
      .select("vote_date, winning_emoji")
      .in("vote_date", voteDates)

    const winnerMap = new Map(
      dailySummaries?.map((d) => [d.vote_date, d.winning_emoji]) || []
    )

    // Check if user was first to vote for each emoji on each day
    const firstVoteChecks = await Promise.all(
      userVotes.map(async (vote) => {
        const { data: earlierVotes } = await supabase
          .from("votes")
          .select("created_at")
          .eq("vote_date", vote.vote_date)
          .eq("emoji", vote.emoji)
          .lt("created_at", vote.created_at)
          .limit(1)

        return {
          vote_date: vote.vote_date,
          emoji: vote.emoji,
          created_at: vote.created_at,
          is_first_vote: !earlierVotes || earlierVotes.length === 0,
        }
      })
    )

    const firstVoteMap = new Map(
      firstVoteChecks.map((check) => [
        `${check.vote_date}-${check.emoji}-${check.created_at}`,
        check.is_first_vote,
      ])
    )

    // Combine vote data with emoji metadata and winning status
    return userVotes.map((vote) => {
      const emojiInfo = emojiDataMap.get(vote.emoji)
      const winningEmoji = winnerMap.get(vote.vote_date)

      // Check if this vote was a winner (handle emoji variation selector normalization)
      const normalizeEmoji = (emoji: string) => emoji.replace(/\uFE0F/g, "")
      const isWinner =
        winningEmoji &&
        (vote.emoji === winningEmoji ||
          normalizeEmoji(vote.emoji) === normalizeEmoji(winningEmoji))

      const isFirstVote =
        firstVoteMap.get(
          `${vote.vote_date}-${vote.emoji}-${vote.created_at}`
        ) || false

      return {
        vote_date: vote.vote_date,
        emoji: vote.emoji,
        created_at: vote.created_at,
        accent_color: emojiInfo?.accent_color,
        filename: emojiInfo?.filename,
        winning_emoji: winningEmoji,
        is_winner: !!isWinner,
        is_first_vote: isFirstVote,
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

    // Calculate correct guesses from already-calculated is_winner flags
    const correctGuesses = votingHistory.filter((vote) => vote.is_winner).length

    // Get all days that had votes (to identify gaps)
    const { data: allVoteDates } = await supabase
      .from("daily_summaries")
      .select("vote_date")
      .order("vote_date", { ascending: false })

    const userVoteDates = new Set(votingHistory.map((vote) => vote.vote_date))

    // Create combined timeline with missed days
    const timelineEntries: (
      | UserVote
      | { vote_date: string; is_missed_day: true }
    )[] = []

    if (allVoteDates && allVoteDates.length > 0 && votingHistory.length > 0) {
      // Find the earliest user vote date to limit how far back we show missed days
      const earliestUserVote = Math.min(
        ...votingHistory.map((vote) => new Date(vote.vote_date).getTime())
      )

      for (const { vote_date } of allVoteDates) {
        const voteDateTime = new Date(vote_date).getTime()

        // Only show missed days from when user started voting onwards
        if (voteDateTime >= earliestUserVote) {
          if (userVoteDates.has(vote_date)) {
            // User voted this day - add their vote
            const userVote = votingHistory.find(
              (vote) => vote.vote_date === vote_date
            )
            if (userVote) {
              timelineEntries.push(userVote)
            }
          } else {
            // User missed this day
            timelineEntries.push({ vote_date, is_missed_day: true })
          }
        }
      }
    } else {
      // No voting days data or no user votes, just show user's votes
      timelineEntries.push(...votingHistory)
    }

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
      correctGuesses,
      votingHistory: timelineEntries,
    }
  } catch (error) {
    console.error("Error in getUserProfile:", error)
    throw error
  }
}

export async function updateGlobalChyron(): Promise<{
  success: boolean
  chyron?: string
  error?: string
}> {
  try {
    const today = getCurrentVotingDay()
    const dateString = formatDateForDB(today)

    // Get current live results
    const { data: liveResult } = await supabase
      .from("live_results")
      .select("emoji_counts, total_votes")
      .eq("vote_date", dateString)
      .single()

    if (!liveResult?.emoji_counts || liveResult.total_votes === 0) {
      // No votes yet, use default chyron
      const defaultChyron =
        "THE POLLS ARE OPEN • CAST YOUR VOTE FOR TODAY'S EMOJI"
      await updateChyronInDatabase(defaultChyron, dateString)
      return { success: true, chyron: defaultChyron }
    }

    const voteCounts = liveResult.emoji_counts as { [key: string]: number }
    const totalVotes = liveResult.total_votes

    // Get top 3 emojis with their names and accent colors
    const topEmojis = Object.entries(voteCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)

    const emojiList = topEmojis.map(([emoji]) => emoji)
    const { data: emojiData } = await supabase
      .from("emojis")
      .select("emoji, name")
      .in("emoji", emojiList)

    const emojiNameMap = new Map(emojiData?.map((e) => [e.emoji, e.name]) || [])

    // Build standings for prompt
    const standings = topEmojis.map(([emoji, count], index) => ({
      emoji,
      count,
      name: emojiNameMap.get(emoji) || "unknown",
      rank: index + 1,
      percentage: Math.round((count / totalVotes) * 100),
    }))

    // Generate dramatic chyron
    const chyron = await generateDramaticChyron(standings, totalVotes)

    // Update in database
    await updateChyronInDatabase(chyron, dateString)

    return { success: true, chyron }
  } catch (error) {
    console.error("Error updating global chyron:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

async function generateDramaticChyron(
  standings: any[],
  totalVotes: number
): Promise<string> {
  const leader = standings[0]
  const second = standings[1]
  const third = standings[2]

  // Calculate gaps
  const gap1to2 = leader
    ? second
      ? leader.count - second.count
      : leader.count
    : 0
  const gap2to3 = second && third ? second.count - third.count : 0

  const prompt = `You are writing a dramatic, engaging news ticker for a live emoji election. Make it feel like exciting sports commentary with personality and intrigue.

Current standings:
${standings
  .map(
    (s) =>
      `${s.rank}. ${s.emoji} (${s.name}): ${s.count} votes (${s.percentage}%)`
  )
  .join("\n")}

Total votes: ${totalVotes}
Gap between 1st and 2nd: ${gap1to2} votes
${second && third ? `Gap between 2nd and 3rd: ${gap2to3} votes` : ""}

Write ONE dramatic ticker line (50-80 characters). Use the actual emoji characters. Create narrative tension and intrigue. Make it feel like a thrilling race with personality.

Examples of the style we want:
"💯 DOMINATES BUT 💖 SURGES • LOVE VS PERFECTION SHOWDOWN"
"🔥 LEADS BY A THREAD • 😴 RISING FAST • NAPTIME REBELLION?"
"⚡ STRIKES FIRST BUT 🌊 BUILDS MOMENTUM • STORM BREWING"

Focus on:
- The emotions/themes the leading emojis represent
- Creating dramatic tension about what might happen
- Making it feel like a real contest with stakes
- Being witty and engaging, not bland

Just return the ticker line, nothing else.`

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "X-Title": "emoji.today dramatic chyron",
        },
        body: JSON.stringify({
          model: "anthropic/claude-3.5-haiku",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 100,
          temperature: 0.9,
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`)
    }

    const data = (await response.json()) as any
    let chyron = data.choices[0].message.content.trim()

    // Clean up response
    chyron = chyron.replace(/^["']|["']$/g, "") // Remove quotes
    chyron = chyron.split("\n")[0] // Take first line only

    // Validate length
    if (chyron.length < 20 || chyron.length > 120) {
      throw new Error("Invalid chyron length")
    }

    return chyron.toUpperCase()
  } catch (error) {
    console.error("Error generating dramatic chyron:", error)

    // Fallback to creative manual chyrons based on the data
    if (leader && second) {
      const gap = gap1to2
      if (gap === 0) {
        return `${leader.emoji}${second.emoji} PERFECT TIE • DEMOCRACY IN SUSPENSE`
      } else if (gap === 1) {
        return `${leader.emoji} LEADS BY ONE • ${second.emoji} ONE VOTE FROM GLORY`
      } else if (gap <= 3) {
        return `${leader.emoji} BARELY AHEAD • ${second.emoji} CHARGING HARD`
      } else {
        return `${leader.emoji} PULLS AWAY • ${second.emoji} NEEDS MIRACLE`
      }
    } else if (leader) {
      return `${leader.emoji} STANDS ALONE • WAITING FOR CHALLENGERS`
    }

    return "THE BATTLE FOR TODAY'S EMOJI CONTINUES • EVERY VOTE COUNTS"
  }
}

async function updateChyronInDatabase(
  chyron: string,
  dateString: string
): Promise<void> {
  // First, try to update existing chyron for today
  const { data: existingChyron } = await supabase
    .from("chyrons")
    .select("id")
    .eq("vote_date", dateString)
    .single()

  if (existingChyron) {
    // Update existing
    await supabase
      .from("chyrons")
      .update({ text: chyron })
      .eq("id", existingChyron.id)
  } else {
    // Insert new
    await supabase
      .from("chyrons")
      .insert({ text: chyron, vote_date: dateString })
  }
}

export async function getCurrentChyron(): Promise<string | null> {
  try {
    const today = getCurrentVotingDay()
    const dateString = formatDateForDB(today)

    const { data: chyron } = await supabase
      .from("chyrons")
      .select("text")
      .eq("vote_date", dateString)
      .order("updated_at", { ascending: false })
      .limit(1)
      .single()

    return chyron?.text || null
  } catch (error) {
    console.error("Error getting current chyron:", error)
    return null
  }
}

// Leaderboard interfaces and functions
export interface LeaderboardUser {
  fid: number
  username?: string
  displayName?: string
  pfpUrl?: string
  value: number // The main metric (streak, accuracy %, etc.)
  secondaryValue?: number // Additional context (total votes, etc.)
}

export async function getLongestStreakLeaderboard(
  limit: number = 20
): Promise<LeaderboardUser[]> {
  try {
    // Use service client with updated types that include leaderboards table
    const serviceSupabase = supabaseService()

    // Try to get cached data first
    const { data: leaderboardData, error } = await (serviceSupabase as any)
      .from("leaderboards")
      .select("*")
      .eq("category", "streak")
      .order("rank", { ascending: true })
      .limit(limit)

    if (error) {
      console.error("Error fetching cached streak leaderboard:", error)
      throw error
    }

    if (!leaderboardData || leaderboardData.length === 0) {
      console.warn("No cached streak leaderboard data found")
      return []
    }

    return leaderboardData.map((entry: any) => ({
      fid: entry.fid,
      username: entry.username || undefined,
      displayName: entry.display_name || undefined,
      pfpUrl: entry.pfp_url || undefined,
      value: entry.value,
      secondaryValue: entry.secondary_value || undefined,
    }))
  } catch (error) {
    console.error("Error getting longest streak leaderboard:", error)
    throw error
  }
}

export async function getBestAccuracyLeaderboard(
  limit: number = 20
): Promise<LeaderboardUser[]> {
  try {
    // Use service client with updated types
    const serviceSupabase = supabaseService()

    // Try to get cached data first
    const { data: leaderboardData, error } = await (serviceSupabase as any)
      .from("leaderboards")
      .select("*")
      .eq("category", "accuracy")
      .order("rank", { ascending: true })
      .limit(limit)

    if (error) {
      console.error("Error fetching cached accuracy leaderboard:", error)
      throw error
    }

    if (!leaderboardData || leaderboardData.length === 0) {
      console.warn("No cached accuracy leaderboard data found")
      return []
    }

    return leaderboardData.map((entry: any) => ({
      fid: entry.fid,
      username: entry.username || undefined,
      displayName: entry.display_name || undefined,
      pfpUrl: entry.pfp_url || undefined,
      value: entry.value,
      secondaryValue: entry.secondary_value || undefined,
    }))
  } catch (error) {
    console.error("Error getting best accuracy leaderboard:", error)
    throw error
  }
}

export async function getBiggestOGsLeaderboard(
  limit: number = 20
): Promise<LeaderboardUser[]> {
  try {
    // Use service client with updated types
    const serviceSupabase = supabaseService()

    // Try to get cached data first
    const { data: leaderboardData, error } = await (serviceSupabase as any)
      .from("leaderboards")
      .select("*")
      .eq("category", "ogs")
      .order("rank", { ascending: true })
      .limit(limit)

    if (error) {
      console.error("Error fetching cached OGs leaderboard:", error)
      throw error
    }

    if (!leaderboardData || leaderboardData.length === 0) {
      console.warn("No cached OGs leaderboard data found")
      return []
    }

    return leaderboardData.map((entry: any) => ({
      fid: entry.fid,
      username: entry.username || undefined,
      displayName: entry.display_name || undefined,
      pfpUrl: entry.pfp_url || undefined,
      value: entry.value,
      secondaryValue: entry.secondary_value || undefined,
    }))
  } catch (error) {
    console.error("Error getting biggest OGs leaderboard:", error)
    throw error
  }
}
