"use server"

import { revalidatePath } from "next/cache"
import { getSession } from "@/auth"
import { supabase } from "@/lib/supabase"

interface EmojiVoteCount {
  emoji: string
  count: number
  percentage: number
  accent_color: string
  filename: string
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

export async function getVotingResults() {
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

    // Get unique emojis that have votes
    const uniqueEmojis = Object.keys(voteCounts)

    // Fetch emoji data from database to get accent colors
    const { data: emojiData, error: emojiError } = await supabase
      .from("emojis")
      .select("emoji, accent_color, filename")
      .in("emoji", uniqueEmojis)

    if (emojiError) {
      console.error("Error fetching emoji data:", emojiError)
      throw new Error("Failed to fetch emoji data")
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

    // Convert to array with percentages and emoji data
    const results: EmojiVoteCount[] = Object.entries(voteCounts)
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
      .sort((a, b) => b.count - a.count)

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

export async function getLiveVotingResults() {
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

    // Get live results for today
    const { data: liveResult, error: liveResultError } = await supabase
      .from("live_results")
      .select("emoji_counts, total_votes, last_updated_at")
      .eq("vote_date", today)
      .single()

    if (liveResultError) {
      console.error("Error fetching live results:", liveResultError)
      // Fall back to the original method if live_results doesn't exist
      const fallbackResult = await getVotingResults()
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

    // Get unique emojis that have votes
    const uniqueEmojis = Object.keys(voteCounts)

    // Fetch emoji data from database to get accent colors
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
      throw new Error("Failed to fetch emoji data")
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

    // Convert to array with percentages and emoji data
    const results: EmojiVoteCount[] = Object.entries(voteCounts)
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
      .sort((a, b) => b.count - a.count)

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
