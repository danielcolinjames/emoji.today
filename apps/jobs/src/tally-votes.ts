import { supabase } from "./lib/supabase"
import {
  getCurrentVotingDay,
  formatDateForDB,
  isVotingOpen,
  formatDateForDisplay,
  getVotingDayBounds,
} from "./lib/date-utils"

/**
 * Tally votes for a specific date
 */
export async function tallyVotes(votingDate?: Date) {
  const targetDate = votingDate || getCurrentVotingDay()
  const dateString = formatDateForDB(targetDate)

  console.log(`Tallying votes for ${formatDateForDisplay(targetDate)}`)

  try {
    // Get all votes for the target date with created_at timestamps
    const { data: votes, error: votesError } = await supabase
      .from("votes")
      .select("emoji, created_at")
      .eq("vote_date", dateString)

    if (votesError) {
      throw new Error(`Failed to fetch votes: ${votesError.message}`)
    }

    if (!votes || votes.length === 0) {
      console.log("No votes found for this date")
      await updateDailyResults(dateString, {}, null, 0)
      return
    }

    // Count votes by emoji and track timing
    const emojiData: Record<string, { count: number; timestamps: number[] }> =
      {}
    const dayStart = getVotingDayBounds(targetDate).start.getTime()

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

    // Get just the counts for the simple case
    const emojiCounts: Record<string, number> = {}
    Object.entries(emojiData).forEach(([emoji, data]) => {
      emojiCounts[emoji] = data.count
    })

    // Find the winning emoji(s)
    const maxVotes = Math.max(...Object.values(emojiCounts))
    const winners = Object.entries(emojiCounts)
      .filter(([_, count]) => count === maxVotes)
      .map(([emoji]) => emoji)

    let winningEmoji = winners[0]

    // Tie-breaking logic: pick the emoji with the highest average timestamp
    if (winners.length > 1) {
      console.log(`\n🤝 Tie detected between: ${winners.join(", ")}`)
      console.log("Breaking tie based on timing (latest average wins)...")

      let latestAverage = -1
      let tieBreakWinner = winners[0]

      winners.forEach((emoji) => {
        const timestamps = emojiData[emoji].timestamps
        const average =
          timestamps.reduce((sum, ts) => sum + ts, 0) / timestamps.length

        // Convert back to actual time for display
        const averageTime = new Date(dayStart + average * 1000)

        // Calculate hours and minutes since start of day for display
        const hours = Math.floor(average / 3600)
        const minutes = Math.floor((average % 3600) / 60)

        console.log(
          `  ${emoji}: avg time ${averageTime.toLocaleTimeString("en-US", {
            timeZone: "UTC",
          })} UTC (+${hours}h ${minutes}m from day start)`
        )

        if (average > latestAverage) {
          latestAverage = average
          tieBreakWinner = emoji
        }
      })

      winningEmoji = tieBreakWinner
      console.log(
        `🏆 Tie-breaker winner: ${winningEmoji} (latest average votes)`
      )
    }

    console.log(`\nVote tally complete:`)
    console.log(`- Total votes: ${votes.length}`)
    console.log(`- Unique emojis: ${Object.keys(emojiCounts).length}`)
    console.log(`- Winner: ${winningEmoji} with ${maxVotes} votes`)
    if (winners.length > 1) {
      console.log(`- Tie-breaking applied`)
    }

    // Update the daily results
    await updateDailyResults(
      dateString,
      emojiCounts,
      winningEmoji,
      votes.length,
      !isVotingOpen(targetDate)
    )

    // If voting is closed and we have a winner, trigger post-voting actions
    if (!isVotingOpen(targetDate) && winningEmoji) {
      await handleDayComplete(
        targetDate,
        winningEmoji,
        emojiCounts,
        votes.length
      )
    }
  } catch (error) {
    console.error("Error tallying votes:", error)
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
}

/**
 * Handle actions when a day's voting is complete
 */
async function handleDayComplete(
  votingDate: Date,
  winningEmoji: string,
  emojiCounts: Record<string, number>,
  totalVotes: number
) {
  console.log(`\n🎉 Day complete! Winner: ${winningEmoji}`)

  // TODO: Phase 2 - Mint NFT
  // await mintWinningEmojiNFT(votingDate, winningEmoji, emojiCounts);

  // TODO: Phase 2 - Start auction
  // await startEmojiAuction(votingDate, winningEmoji);

  // TODO: Auto-post to social media
  await postToSocialMedia(votingDate, winningEmoji, totalVotes)

  // TODO: Phase 2 - Notify winning voters
  // await notifyWinningVoters(votingDate, winningEmoji);
}

/**
 * Post results to social media (placeholder for now)
 */
async function postToSocialMedia(
  votingDate: Date,
  winningEmoji: string,
  totalVotes: number
) {
  const dateString = formatDateForDisplay(votingDate)
  const voteDate = formatDateForDB(votingDate)

  try {
    // Get emoji data for accent color
    const { data: emojiData } = await supabase
      .from("emojis")
      .select("accent_color")
      .eq("emoji", winningEmoji)
      .single()

    const accentColor = emojiData?.accent_color || "#FFFFFF"

    // Create the share URL for the winning emoji
    const shareUrl = `https://emoji.today/share?emoji=${encodeURIComponent(
      winningEmoji
    )}&date=${voteDate}&winner=true&totalVotes=${totalVotes}&accentColor=${encodeURIComponent(
      accentColor
    )}`

    // Post to Twitter/X
    await postToTwitter(winningEmoji, dateString, totalVotes, shareUrl)

    // Post to Farcaster
    await postToFarcaster(winningEmoji, dateString, totalVotes, shareUrl)

    console.log(`\n✅ Social media posts sent successfully`)
  } catch (error) {
    console.error(`\n❌ Error posting to social media:`, error)
    // Don't throw - social media posting failure shouldn't break vote tallying
  }
}

/**
 * Post to Twitter/X
 */
async function postToTwitter(
  winningEmoji: string,
  dateString: string,
  totalVotes: number,
  shareUrl: string
) {
  // Check if Twitter credentials are configured
  if (
    !process.env.TWITTER_API_KEY ||
    !process.env.TWITTER_API_SECRET ||
    !process.env.TWITTER_ACCESS_TOKEN ||
    !process.env.TWITTER_ACCESS_TOKEN_SECRET
  ) {
    console.log(`📱 Twitter posting skipped - credentials not configured`)
    return
  }

  try {
    const tweetText = `${winningEmoji} has won ${dateString}! ${totalVotes} people voted. What emoji will win tomorrow? Vote at emoji.today`

    // For now, log what would be posted
    // TODO: Implement actual Twitter API call when credentials are set up
    console.log(`📱 Twitter/X: "${tweetText}"`)
    console.log(`   Share URL: ${shareUrl}`)

    // Example implementation (uncomment when ready to use):
    /*
    const response = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: tweetText + ' ' + shareUrl,
      }),
    })

    if (!response.ok) {
      throw new Error(`Twitter API error: ${response.status} ${response.statusText}`)
    }

    console.log(`✅ Posted to Twitter/X successfully`)
    */
  } catch (error) {
    console.error(`❌ Failed to post to Twitter/X:`, error)
  }
}

/**
 * Post to Farcaster
 */
async function postToFarcaster(
  winningEmoji: string,
  dateString: string,
  totalVotes: number,
  shareUrl: string
) {
  // Check if Farcaster credentials are configured
  if (!process.env.FARCASTER_SIGNER_UUID || !process.env.NEYNAR_API_KEY) {
    console.log(`🟣 Farcaster posting skipped - credentials not configured`)
    return
  }

  try {
    const castText = `${winningEmoji} is the emoji of ${dateString}! ${totalVotes} people voted. What will win tomorrow?`

    // For now, log what would be posted
    // TODO: Implement actual Farcaster API call when credentials are set up
    console.log(`🟣 Farcaster: "${castText}"`)
    console.log(`   Embedded URL: ${shareUrl}`)

    // Example implementation using Neynar API (uncomment when ready to use):
    /*
    const response = await fetch('https://api.neynar.com/v2/farcaster/cast', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEYNAR_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        signer_uuid: process.env.FARCASTER_SIGNER_UUID,
        text: castText,
        embeds: [{ url: shareUrl }],
      }),
    })

    if (!response.ok) {
      throw new Error(`Farcaster API error: ${response.status} ${response.statusText}`)
    }

    console.log(`✅ Posted to Farcaster successfully`)
    */
  } catch (error) {
    console.error(`❌ Failed to post to Farcaster:`, error)
  }
}

// Run the script if called directly
if (require.main === module) {
  // Parse command line arguments
  const args = process.argv.slice(2)
  const dateArg = args[0]

  let targetDate: Date | undefined
  if (dateArg) {
    targetDate = new Date(dateArg)
    if (isNaN(targetDate.getTime())) {
      console.error("Invalid date format. Use YYYY-MM-DD")
      process.exit(1)
    }
  }

  tallyVotes(targetDate)
    .then(() => {
      console.log("\n✅ Vote tallying complete")
      process.exit(0)
    })
    .catch((error) => {
      console.error("\n❌ Vote tallying failed:", error)
      process.exit(1)
    })
}
