import { supabase } from "./lib/supabase"
import {
  getCurrentVotingDay,
  formatDateForDB,
  formatDateForDisplay,
  getVotingDayBounds,
} from "./lib/date-utils"

/**
 * Update live results for the current voting day
 * This job runs frequently (every 5 minutes) to keep the daily_results table fresh
 */
export async function updateLiveResults() {
  const currentDay = getCurrentVotingDay()
  const dateString = formatDateForDB(currentDay)

  console.log(
    `📊 Updating live results for ${formatDateForDisplay(currentDay)}`
  )

  try {
    // Get all votes for today with created_at timestamps
    const { data: votes, error: votesError } = await supabase
      .from("votes")
      .select("emoji, created_at")
      .eq("vote_date", dateString)

    if (votesError) {
      throw new Error(`Failed to fetch votes: ${votesError.message}`)
    }

    if (!votes || votes.length === 0) {
      console.log("No votes found for today")
      await updateDailyResults(dateString, {}, null, 0)
      return
    }

    // Count votes by emoji and track timing
    const emojiData: Record<string, { count: number; timestamps: number[] }> =
      {}
    const dayStart = getVotingDayBounds(currentDay).start.getTime()

    votes.forEach((vote) => {
      if (!emojiData[vote.emoji]) {
        emojiData[vote.emoji] = { count: 0, timestamps: [] }
      }
      emojiData[vote.emoji].count++

      // Calculate seconds since start of day
      const voteTime = new Date(vote.created_at).getTime()
      const secondsSinceStart = Math.floor((voteTime - dayStart) / 1000)
      emojiData[vote.emoji].timestamps.push(secondsSinceStart)
    })

    // Get just the counts for storage
    const emojiCounts: Record<string, number> = {}
    Object.entries(emojiData).forEach(([emoji, data]) => {
      emojiCounts[emoji] = data.count
    })

    // Find the winning emoji(s) using the same logic as tally-votes
    const maxVotes = Math.max(...Object.values(emojiCounts))
    const winners = Object.entries(emojiCounts)
      .filter(([_, count]) => count === maxVotes)
      .map(([emoji]) => emoji)

    let winningEmoji = winners[0]

    // Tie-breaking logic: pick the emoji with the highest average timestamp
    if (winners.length > 1) {
      console.log(`🤝 Tie detected between: ${winners.join(", ")}`)

      let latestAverage = -1
      let tieBreakWinner = winners[0]

      winners.forEach((emoji) => {
        const timestamps = emojiData[emoji].timestamps
        const average =
          timestamps.reduce((sum, ts) => sum + ts, 0) / timestamps.length

        if (average > latestAverage) {
          latestAverage = average
          tieBreakWinner = emoji
        }
      })

      winningEmoji = tieBreakWinner
    }

    console.log(`✅ Results updated:`)
    console.log(`  - Total votes: ${votes.length}`)
    console.log(`  - Unique emojis: ${Object.keys(emojiCounts).length}`)
    console.log(`  - Current leader: ${winningEmoji} with ${maxVotes} votes`)

    // Update the daily results (not finalized, just current state)
    await updateDailyResults(
      dateString,
      emojiCounts,
      winningEmoji,
      votes.length,
      false // Not finalized
    )
  } catch (error) {
    console.error("Error updating live results:", error)
    throw error
  }
}

/**
 * Update or create the daily results record
 */
async function updateDailyResults(
  voteDate: string,
  emojiVotes: Record<string, number>,
  winningEmoji: string | null,
  totalVotes: number,
  finalize: boolean = false
) {
  // Check if record exists
  const { data: existing, error: checkError } = await supabase
    .from("daily_results")
    .select("id")
    .eq("vote_date", voteDate)
    .single()

  if (checkError && checkError.code !== "PGRST116") {
    // PGRST116 = not found
    throw new Error(`Failed to check existing results: ${checkError.message}`)
  }

  const resultData = {
    emoji_votes: emojiVotes,
    winning_emoji: winningEmoji,
    total_votes: totalVotes,
    ...(finalize ? { finalized_at: new Date().toISOString() } : {}),
  }

  if (existing) {
    // Update existing record
    const { error: updateError } = await supabase
      .from("daily_results")
      .update(resultData)
      .eq("id", existing.id)

    if (updateError) {
      throw new Error(`Failed to update results: ${updateError.message}`)
    }
  } else {
    // Create new record
    const { error: insertError } = await supabase.from("daily_results").insert({
      vote_date: voteDate,
      ...resultData,
    })

    if (insertError) {
      throw new Error(`Failed to insert results: ${insertError.message}`)
    }
  }

  console.log(`📝 daily_results table updated for ${voteDate}`)
}

// Run the script if called directly
if (require.main === module) {
  updateLiveResults()
    .then(() => {
      console.log("\n✅ Live results update complete")
      process.exit(0)
    })
    .catch((error) => {
      console.error("\n❌ Live results update failed:", error)
      process.exit(1)
    })
}
