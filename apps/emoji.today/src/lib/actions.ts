"use server"

import { revalidatePath } from "next/cache"
import { getSession } from "@/auth"
import { supabase } from "@/lib/supabase"

interface EmojiVoteCount {
  emoji: string
  count: number
  percentage: number
}

export async function submitVote(emoji: string) {
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

    // First, ensure user exists in database
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("fid", fid)
      .single()

    let userId: string

    if (!existingUser) {
      // Create new user
      const { data: newUser, error: userError } = await supabase
        .from("users")
        .insert({
          fid,
          username: null,
        })
        .select("id")
        .single()

      if (userError || !newUser) {
        console.error("Error creating user:", userError)
        throw new Error("Failed to create user")
      }

      userId = newUser.id
    } else {
      userId = existingUser.id
    }

    // Check if user already voted today
    const { data: existingVote } = await supabase
      .from("votes")
      .select("id")
      .eq("user_id", userId)
      .eq("vote_date", today)
      .single()

    if (existingVote) {
      throw new Error("You have already voted today")
    }

    // Insert the vote
    const { error: voteError } = await supabase.from("votes").insert({
      user_id: userId,
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

    // Get user from database
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("fid", fid)
      .single()

    if (!user) {
      throw new Error("User not found")
    }

    // Check if user has voted today
    const { data: userVote } = await supabase
      .from("votes")
      .select("emoji")
      .eq("user_id", user.id)
      .eq("vote_date", today)
      .single()

    if (!userVote) {
      return null // User hasn't voted yet
    }

    // Get all votes for today
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

    // Convert to array with percentages
    const results: EmojiVoteCount[] = Object.entries(voteCounts)
      .map(([emoji, count]) => ({
        emoji,
        count,
        percentage: Math.round((count / totalVotes) * 100),
      }))
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
