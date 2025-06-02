"use server"

import { revalidatePath } from "next/cache"
import { getSession } from "@/auth"
import { supabase } from "@/lib/supabase"

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
    const { data: existingUser } = await supabase
      .from("users")
      .select("id, username, previous_usernames")
      .eq("fid", fid)
      .single()

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
          console.error("Error updating user:", updateError)
          throw new Error("Failed to update user")
        }

        console.log(
          `Updated username for FID ${fid}: ${existingUser.username} -> ${username}`
        )
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
        console.error("Error creating user:", userError)
        throw new Error("Failed to create user")
      }

      console.log(`Created new user for FID ${fid} with username: ${username}`)
      return newUser.id
    }
  } catch (error) {
    console.error("Error in upsertUserWithUsername:", error)
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
    if (!session?.user?.fid) {
      throw new Error("Authentication required")
    }

    if (!emoji) {
      throw new Error("Emoji is required")
    }

    const fid = session.user.fid
    const today = new Date().toISOString().split("T")[0]

    // Upsert user with username tracking
    const userId = await upsertUserWithUsername(fid, username, displayName)

    // Check if user already voted today (using fid directly for efficiency)
    const { data: existingVote } = await supabase
      .from("votes")
      .select("id")
      .eq("fid", fid)
      .eq("vote_date", today)
      .single()

    if (existingVote) {
      throw new Error("You have already voted today")
    }

    // Insert the vote with both user_id and fid for redundancy and query efficiency
    const { error: voteError } = await supabase.from("votes").insert({
      user_id: userId,
      fid: fid,
      emoji,
      vote_date: today,
    })

    if (voteError) {
      console.error("Error inserting vote:", voteError)
      throw new Error("Failed to submit vote")
    }

    revalidatePath("/vote")
    return { success: true, message: "Vote submitted successfully" }
  } catch (error) {
    console.error("Error in submitVote:", error)
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
