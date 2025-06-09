"use server"

import { supabaseService } from "@/lib/supabase-service"
import { getCurrentVotingDateString } from "@/lib/date-utils"

interface LeaderboardEntry {
  category: string
  rank: number
  fid: number
  username?: string
  display_name?: string
  pfp_url?: string
  value: number
  secondary_value?: number
}

export async function updateLeaderboards(): Promise<{
  success: boolean
  message?: string
  error?: string
}> {
  try {
    console.log("🏆 Starting leaderboard calculation...")

    const serviceSupabase = supabaseService()

    // Calculate all three leaderboards
    const [streakData, accuracyData, ogData] = await Promise.all([
      calculateStreakLeaderboard(),
      calculateAccuracyLeaderboard(),
      calculateOGLeaderboard(),
    ])

    // Clear existing data
    const { error: deleteError } = await (serviceSupabase as any)
      .from("leaderboards")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000")

    if (deleteError) {
      console.error("Delete error:", deleteError)
      throw new Error(
        `Failed to clear existing leaderboards: ${
          deleteError.message || JSON.stringify(deleteError)
        }`
      )
    }

    // Insert new data
    const allEntries: LeaderboardEntry[] = [
      ...streakData.map((user, index) => ({
        category: "streak",
        rank: index + 1,
        fid: user.fid,
        username: user.username,
        display_name: user.displayName,
        pfp_url: user.pfpUrl,
        value: user.value,
        secondary_value: user.secondaryValue,
      })),
      ...accuracyData.map((user, index) => ({
        category: "accuracy",
        rank: index + 1,
        fid: user.fid,
        username: user.username,
        display_name: user.displayName,
        pfp_url: user.pfpUrl,
        value: user.value,
        secondary_value: user.secondaryValue,
      })),
      ...ogData.map((user, index) => ({
        category: "ogs",
        rank: index + 1,
        fid: user.fid,
        username: user.username,
        display_name: user.displayName,
        pfp_url: user.pfpUrl,
        value: user.value,
        secondary_value: user.secondaryValue,
      })),
    ]

    console.log(`📊 Inserting ${allEntries.length} leaderboard entries`)

    const { error: insertError } = await (serviceSupabase as any)
      .from("leaderboards")
      .insert(allEntries)

    if (insertError) {
      console.error("Insert error:", insertError)
      throw new Error(
        `Failed to insert leaderboards: ${
          insertError.message ||
          insertError.details ||
          JSON.stringify(insertError)
        }`
      )
    }

    console.log(`✅ Updated leaderboards with ${allEntries.length} entries`)

    return {
      success: true,
      message: `Successfully updated leaderboards with ${allEntries.length} entries`,
    }
  } catch (error) {
    console.error("❌ Error updating leaderboards:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Helper functions that contain the existing calculation logic
async function calculateStreakLeaderboard(limit: number = 20) {
  const serviceSupabase = supabaseService()

  // Get all users with votes
  const { data: usersWithVotes } = await serviceSupabase
    .from("votes")
    .select("fid")
    .order("fid")

  const uniqueFids = Array.from(
    new Set(usersWithVotes?.map((v) => v.fid) || [])
  )

  // Calculate streaks for each user
  const streakPromises = uniqueFids.map(async (fid) => {
    const { data: userVotes } = await serviceSupabase
      .from("votes")
      .select("vote_date, created_at")
      .eq("fid", fid)
      .order("vote_date", { ascending: false })

    if (!userVotes || userVotes.length === 0) {
      return { fid, longestStreak: 0, totalVotes: 0, earliestVote: null }
    }

    // Calculate longest streak
    const voteDates = Array.from(
      new Set(userVotes.map((v) => v.vote_date))
    ).sort((a, b) => b.localeCompare(a))
    let longestStreak = 0

    for (let i = 0; i < voteDates.length; i++) {
      let consecutiveCount = 1
      let currentDate = new Date(voteDates[i])

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

    const earliestVote = userVotes.reduce(
      (earliest, vote) =>
        !earliest || vote.created_at < earliest ? vote.created_at : earliest,
      null as string | null
    )

    return { fid, longestStreak, totalVotes: userVotes.length, earliestVote }
  })

  const streakResults = await Promise.all(streakPromises)

  // Sort by longest streak, then by earliest vote
  const sortedResults = streakResults
    .filter((result) => result.longestStreak > 0)
    .sort((a, b) => {
      if (b.longestStreak !== a.longestStreak) {
        return b.longestStreak - a.longestStreak
      }
      if (a.earliestVote && b.earliestVote) {
        const earliestComparison = a.earliestVote.localeCompare(b.earliestVote)
        if (earliestComparison !== 0) return earliestComparison
      }
      return b.totalVotes - a.totalVotes
    })
    .slice(0, limit)

  // Get user data and Neynar data
  return await enrichWithUserData(
    sortedResults.map((r) => ({
      fid: r.fid,
      value: r.longestStreak,
      secondaryValue: r.totalVotes,
    }))
  )
}

async function calculateAccuracyLeaderboard(limit: number = 20) {
  const serviceSupabase = supabaseService()

  // Get all votes and daily winners
  const [{ data: userVotes }, { data: dailySummaries }] = await Promise.all([
    serviceSupabase.from("votes").select("fid, vote_date, emoji, created_at"),
    serviceSupabase.from("daily_summaries").select("vote_date, winning_emoji"),
  ])

  const winnerMap = new Map(
    dailySummaries?.map((d) => [d.vote_date, d.winning_emoji]) || []
  )

  // Calculate accuracy for each user
  const userStats = new Map<
    number,
    { correctVotes: number; totalVotes: number; earliestVote: string | null }
  >()

  userVotes?.forEach((vote) => {
    const winningEmoji = winnerMap.get(vote.vote_date)
    if (!winningEmoji) return

    const stats = userStats.get(vote.fid) || {
      correctVotes: 0,
      totalVotes: 0,
      earliestVote: null,
    }

    const normalizeEmoji = (emoji: string) => emoji.replace(/\uFE0F/g, "")
    const isCorrect =
      vote.emoji === winningEmoji ||
      normalizeEmoji(vote.emoji) === normalizeEmoji(winningEmoji)

    stats.totalVotes++
    if (isCorrect) stats.correctVotes++

    if (!stats.earliestVote || vote.created_at < stats.earliestVote) {
      stats.earliestVote = vote.created_at
    }

    userStats.set(vote.fid, stats)
  })

  // Sort by accuracy
  const accuracyResults = Array.from(userStats.entries())
    .filter(([_, stats]) => stats.totalVotes >= 3)
    .map(([fid, stats]) => ({
      fid,
      accuracy: Math.round((stats.correctVotes / stats.totalVotes) * 100),
      totalVotes: stats.totalVotes,
      earliestVote: stats.earliestVote,
    }))
    .sort((a, b) => {
      if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy
      if (a.earliestVote && b.earliestVote) {
        const comp = a.earliestVote.localeCompare(b.earliestVote)
        if (comp !== 0) return comp
      }
      return b.totalVotes - a.totalVotes
    })
    .slice(0, limit)

  return await enrichWithUserData(
    accuracyResults.map((r) => ({
      fid: r.fid,
      value: r.accuracy,
      secondaryValue: r.totalVotes,
    }))
  )
}

async function calculateOGLeaderboard(limit: number = 20) {
  const serviceSupabase = supabaseService()

  const { data: ogUsers } = await serviceSupabase
    .from("votes")
    .select("fid")
    .order("fid", { ascending: true })

  // Get vote counts per FID
  const fidCounts = new Map<number, number>()
  ogUsers?.forEach((vote) => {
    fidCounts.set(vote.fid, (fidCounts.get(vote.fid) || 0) + 1)
  })

  // Sort by FID (ascending for biggest OGs)
  const sortedOGs = Array.from(fidCounts.entries())
    .sort((a, b) => a[0] - b[0])
    .slice(0, limit)

  return await enrichWithUserData(
    sortedOGs.map(([fid, voteCount]) => ({
      fid,
      value: fid,
      secondaryValue: voteCount,
    }))
  )
}

async function enrichWithUserData(
  users: Array<{ fid: number; value: number; secondaryValue?: number }>
) {
  const serviceSupabase = supabaseService()

  // Get user data from database
  const fids = users.map((u) => u.fid)
  const { data: usersData } = await serviceSupabase
    .from("users")
    .select("fid, username")
    .in("fid", fids)

  const usersMap = new Map(usersData?.map((u) => [u.fid, u]) || [])

  // Batch Neynar API call
  let neynarUsersMap = new Map()
  try {
    const { getNeynarClient } = await import("@/lib/neynar")
    const client = getNeynarClient()
    const neynarResponse = await client.fetchBulkUsers({ fids })
    neynarUsersMap = new Map(neynarResponse.users?.map((u) => [u.fid, u]) || [])
  } catch (error) {
    console.error("Error fetching bulk Neynar data:", error)
  }

  // Combine data
  return users.map((user) => {
    const userData = usersMap.get(user.fid)
    const neynarData = neynarUsersMap.get(user.fid)

    return {
      fid: user.fid,
      username: userData?.username || neynarData?.username,
      displayName: neynarData?.display_name,
      pfpUrl: neynarData?.pfp_url,
      value: user.value,
      secondaryValue: user.secondaryValue,
    }
  })
}
