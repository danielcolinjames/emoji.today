import { supabase } from "./lib/supabase"
import {
  getCurrentVotingDay,
  formatDateForDB,
  formatDateForDisplay,
  getVotingDayBounds,
} from "./lib/date-utils"

interface RaceContext {
  currentStandings: {
    emoji: string
    count: number
    percentage: number
    name?: string
  }[]
  totalVotes: number
  timeRemaining: {
    hours: number
    minutes: number
  }
  historicalWinners: {
    date: string
    emoji: string
    winningCount: number
  }[]
  momentum: {
    emoji: string
    recentVotes: number
    trend: "surging" | "steady" | "declining"
  }[]
  raceStats: {
    uniqueEmojis: number
    tightestRace: boolean
    frontrunnerLead: number
    isDramaticMoment: boolean
  }
}

// Import the working countdown function
function getRemainingTimeToMidnightUTC(): {
  hours: number
  minutes: number
  seconds: number
  totalMs: number
} {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  tomorrow.setUTCHours(0, 0, 0, 0)

  const totalMs = tomorrow.getTime() - now.getTime()

  const hours = Math.floor(totalMs / (1000 * 60 * 60))
  const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((totalMs % (1000 * 60)) / 1000)

  return { hours, minutes, seconds, totalMs }
}

/**
 * Generate race commentary and optionally post to Farcaster
 * This job can be run on schedules or triggered by events
 */
export async function runRaceCommentary(
  options: {
    forcePost?: boolean
    dramaticOnly?: boolean
    dryRun?: boolean
    chyronOnly?: boolean
  } = {}
) {
  const {
    forcePost = false,
    dramaticOnly = false,
    dryRun = false,
    chyronOnly = false,
  } = options
  const currentDay = getCurrentVotingDay()
  const dateString = formatDateForDB(currentDay)

  console.log(
    `🏁 Running race commentary for ${formatDateForDisplay(currentDay)}`
  )
  console.log(
    `   Options: force=${forcePost}, dramaticOnly=${dramaticOnly}, dryRun=${dryRun}, chyronOnly=${chyronOnly}`
  )

  try {
    // Build race context
    const context = await buildRaceContext(dateString)

    // If chyron only, just generate and return chyron text
    if (chyronOnly) {
      const chyronText =
        context.totalVotes === 0
          ? "POLLS OPEN • CAST YOUR VOTE AT EMOJI.TODAY"
          : await generateCommentaryWithOpenRouter(context, "chyron")

      console.log(`📺 Generated chyron: "${chyronText}"`)
      return {
        success: true,
        chyron: chyronText,
        commentary: null,
        posted: false,
        reason: "Chyron only",
      }
    }

    // Check if we should post based on criteria
    if (!forcePost) {
      if (context.totalVotes === 0) {
        console.log("❌ No votes yet today - skipping commentary")
        return { success: false, reason: "No votes" }
      }

      if (dramaticOnly && !context.raceStats.isDramaticMoment) {
        console.log("❌ Not a dramatic moment - skipping commentary")
        return { success: false, reason: "Not dramatic" }
      }

      // Rate limiting - don't post too frequently
      if (!(await shouldPost(dateString))) {
        console.log("❌ Rate limited - too soon since last post")
        return { success: false, reason: "Rate limited" }
      }
    }

    // Generate Farcaster-style commentary
    const commentary = await generateCommentaryWithOpenRouter(
      context,
      "farcaster"
    )
    console.log(`💬 Generated commentary: "${commentary}"`)

    if (dryRun) {
      console.log("🧪 Dry run mode - not posting to Farcaster")
      return { success: true, commentary, posted: false, reason: "Dry run" }
    }

    // Post to Farcaster
    const castText = `${commentary}\n\nVote now at emoji.today 🗳️`
    const posted = await postToFarcaster(castText)

    if (posted) {
      await logSuccessfulPost(dateString, commentary)
      console.log("✅ Race commentary posted successfully!")
    } else {
      console.log("❌ Failed to post to Farcaster")
    }

    return {
      success: true,
      commentary,
      posted,
      context: {
        totalVotes: context.totalVotes,
        frontrunner: context.currentStandings[0]?.emoji,
        isDramatic: context.raceStats.isDramaticMoment,
        timeRemaining: context.timeRemaining,
      },
    }
  } catch (error) {
    console.error("❌ Error in race commentary job:", error)
    throw error
  }
}

async function buildRaceContext(dateString: string): Promise<RaceContext> {
  // Get current standings from live results
  const { data: liveResult } = await supabase
    .from("live_results")
    .select("emoji_counts, total_votes")
    .eq("vote_date", dateString)
    .single()

  const voteCounts =
    (liveResult?.emoji_counts as { [key: string]: number }) || {}
  const totalVotes = liveResult?.total_votes || 0

  // Get timing data for proper ranking (where later votes = better ranking)
  const { data: voteTimingData } = await supabase
    .from("votes")
    .select("emoji, created_at")
    .eq("vote_date", dateString)

  // Calculate timing-based rankings (same logic as main voting results)
  const emojiTimingMap = new Map()
  if (voteTimingData && voteTimingData.length > 0) {
    const dayStart = new Date(dateString + "T00:00:00.000Z").getTime()
    const emojiTimings: { [key: string]: number[] } = {}

    // Group votes by emoji and calculate timing stats
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

  // Sort by timing-based ranking (later votes = higher rank), then by count
  const currentStandings = Object.entries(voteCounts)
    .map(([emoji, count]) => ({
      emoji,
      count,
      percentage: Math.round((count / totalVotes) * 100),
      name: undefined as string | undefined,
      avgTiming: emojiTimingMap.get(emoji) || 0,
    }))
    .sort((a, b) => {
      // If timing data is available, sort by latest average first (later votes = better rank)
      if (emojiTimingMap.size > 0) {
        const timingDiff = b.avgTiming - a.avgTiming
        if (Math.abs(timingDiff) > 1) {
          // Only use timing if there's a meaningful difference
          return timingDiff
        }
      }
      // Fall back to count-based sorting if timing is very close or unavailable
      return b.count - a.count
    })
    .slice(0, 8)
    .map(({ avgTiming, ...rest }) => rest) // Remove avgTiming from final result

  // Get emoji names for context
  const topEmojis = currentStandings.map((s) => s.emoji)
  const { data: emojiNames } = await supabase
    .from("emojis")
    .select("emoji, name")
    .in("emoji", topEmojis)

  const emojiNameMap = new Map(emojiNames?.map((e) => [e.emoji, e.name]) || [])

  // Add names to standings
  currentStandings.forEach((standing) => {
    standing.name = emojiNameMap.get(standing.emoji)
  })

  // Use the working countdown function
  const timeRemaining = getRemainingTimeToMidnightUTC()

  // Get historical context (last 3 days)
  const { data: historicalData } = await supabase
    .from("daily_summaries")
    .select("vote_date, winning_emoji, winning_count")
    .order("vote_date", { ascending: false })
    .limit(3)

  const historicalWinners =
    historicalData?.map((h) => ({
      date: h.vote_date,
      emoji: h.winning_emoji,
      winningCount: h.winning_count,
    })) || []

  // Calculate momentum by looking at recent vote timing
  const { data: recentVotes } = await supabase
    .from("votes")
    .select("emoji, created_at")
    .eq("vote_date", dateString)
    .order("created_at", { ascending: false })
    .limit(50) // Last 50 votes for momentum analysis

  // Group recent votes by emoji and calculate momentum
  const recentVoteCounts: { [key: string]: number } = {}
  recentVotes?.forEach((vote) => {
    recentVoteCounts[vote.emoji] = (recentVoteCounts[vote.emoji] || 0) + 1
  })

  const momentum = Object.entries(recentVoteCounts)
    .map(([emoji, recentCount]) => {
      const totalCount = voteCounts[emoji] || 0
      const recentPercentage =
        totalCount > 0 ? (recentCount / totalCount) * 100 : 0

      let trend: "surging" | "steady" | "declining"
      if (recentPercentage > 25) trend = "surging"
      else if (recentPercentage > 10) trend = "steady"
      else trend = "declining"

      return {
        emoji,
        recentVotes: recentCount,
        trend,
      }
    })
    .filter((m) => m.recentVotes > 0)
    .sort((a, b) => b.recentVotes - a.recentVotes)
    .slice(0, 5)

  // Calculate race stats - note that "leader" is now timing-based, not just vote count
  const uniqueEmojis = Object.keys(voteCounts).length
  const leader = currentStandings[0]
  const runnerUp = currentStandings[1]
  const frontrunnerLead = leader && runnerUp ? leader.count - runnerUp.count : 0
  const tightestRace = frontrunnerLead <= Math.max(2, totalVotes * 0.05) // Lead < 5% or 2 votes

  // Detect dramatic moments
  const isDramaticMoment =
    tightestRace ||
    momentum.some((m) => m.trend === "surging") ||
    timeRemaining.hours <= 2 || // Final 2 hours
    totalVotes >= 50 // Decent participation

  return {
    currentStandings,
    totalVotes,
    timeRemaining: {
      hours: Math.max(0, timeRemaining.hours),
      minutes: Math.max(0, timeRemaining.minutes),
    },
    historicalWinners,
    momentum,
    raceStats: {
      uniqueEmojis,
      tightestRace,
      frontrunnerLead,
      isDramaticMoment,
    },
  }
}

async function generateCommentaryWithOpenRouter(
  context: RaceContext,
  mode: "chyron" | "farcaster" = "farcaster"
): Promise<string> {
  let prompt = ""

  if (mode === "chyron") {
    // Ultra-short ticker style for scrolling chyron
    prompt = `You are a TV news ticker announcer covering the daily emoji election at emoji.today. Write an ultra-short, punchy update (max 60 characters) in ALL CAPS ticker style:

CURRENT STANDINGS (ranked by timing - later votes get better rankings):
${context.currentStandings
  .slice(0, 3) // Only top 3 for chyron
  .map((s, i) => `${i + 1}. ${s.emoji}: ${s.count} votes`)
  .join(" • ")}

Total: ${context.totalVotes} votes • Time: ${context.timeRemaining.hours}H ${
      context.timeRemaining.minutes
    }M LEFT
${
  context.raceStats.tightestRace
    ? "TIGHT RACE!"
    : `${context.currentStandings[0]?.emoji} LEADS`
}

NOTE: Rankings are timing-based - emojis with later average vote times rank higher, not just vote count!

Write like a TV ticker: ALL CAPS, urgent, punchy! Examples: "🔥 LEADS WITH 15 VOTES • 6H LEFT" or "TIGHT RACE! 🎯 vs 🔥 • 2 VOTE GAP"`
  } else {
    // Farcaster mode
    prompt = `You are a breathless horse race announcer covering the daily emoji election at emoji.today. Write exciting commentary (1-2 sentences, under 200 chars) for Farcaster:

CURRENT STANDINGS (ranked by timing - later votes get better rankings, not just vote count):
${context.currentStandings
  .map((s, i) => `${i + 1}. ${s.emoji}: ${s.count} votes (${s.percentage}%)`)
  .join("\n")}

Total votes: ${context.totalVotes}
Time remaining: ${context.timeRemaining.hours}H ${
      context.timeRemaining.minutes
    }M LEFT
${
  context.raceStats.tightestRace
    ? "TIGHT RACE!"
    : `Leader ahead by ${context.raceStats.frontrunnerLead} votes`
}

MOMENTUM: ${context.momentum.map((m) => `${m.emoji}: ${m.trend}`).join(", ")}

IMPORTANT: Rankings use timing-based algorithm where later votes give better rankings! An emoji with fewer votes but more recent timing can rank higher!

Write like a horse race announcer - dramatic, energetic! Reference specific emojis and vote counts. Keep under 200 characters for Farcaster!`
  }

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "X-Title": "emoji.today race commentary",
        },
        body: JSON.stringify({
          model: "anthropic/claude-3.5-haiku",
          messages: [{ role: "user", content: prompt }],
          max_tokens: mode === "chyron" ? 30 : 80,
          temperature: 0.9,
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`)
    }

    const data = (await response.json()) as any
    return data.choices[0].message.content.trim()
  } catch (error) {
    console.error("Error generating commentary:", error)
    // Fallback commentary based on mode
    const leader = context.currentStandings[0]
    if (leader) {
      if (mode === "chyron") {
        return `${leader.emoji} LEADS WITH ${leader.count} • ${context.timeRemaining.hours}H${context.timeRemaining.minutes}M LEFT`
      } else {
        return `🏁 ${leader.emoji} leads with ${leader.count} votes, but ${context.timeRemaining.hours}h ${context.timeRemaining.minutes}m left in this ${context.raceStats.uniqueEmojis}-emoji showdown!`
      }
    }
    return mode === "chyron"
      ? "EMOJI RACE HEATING UP!"
      : "🏁 The emoji race is heating up!"
  }
}

async function postToFarcaster(text: string): Promise<boolean> {
  try {
    console.log(`📱 Posting to Farcaster: "${text}"`)

    const response = await fetch("https://api.neynar.com/v2/farcaster/cast", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.NEYNAR_API_KEY!,
      },
      body: JSON.stringify({
        signer_uuid: process.env.FARCASTER_SIGNER_UUID!,
        text: text,
        channel_id: "emojitoday", // Optional: remove if you don't have a channel
      }),
    })

    if (!response.ok) {
      const errorData = (await response.json()) as any
      console.error("❌ Neynar API error:", response.status, errorData)
      return false
    }

    const data = (await response.json()) as any
    console.log(`✅ Cast posted successfully: ${data.cast?.hash}`)
    return true
  } catch (error) {
    console.error("❌ Error posting to Farcaster:", error)
    return false
  }
}

// Simple rate limiting using environment or could use database
let lastPostTime = 0
const MIN_POST_INTERVAL = 30 * 60 * 1000 // 30 minutes

async function shouldPost(dateString: string): Promise<boolean> {
  const now = Date.now()

  // Don't post if it's been less than 30 minutes since last post
  if (now - lastPostTime < MIN_POST_INTERVAL) {
    return false
  }

  return true
}

async function logSuccessfulPost(
  dateString: string,
  commentary: string
): Promise<void> {
  lastPostTime = Date.now()
  // Could also log to database if needed
  console.log(`📝 Logged successful post for ${dateString}`)
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2)
  const options = {
    forcePost: args.includes("--force"),
    dramaticOnly: args.includes("--dramatic"),
    dryRun: args.includes("--dry-run"),
    chyronOnly: args.includes("--chyron"),
  }

  console.log(`🚀 Starting race commentary job with options:`, options)

  runRaceCommentary(options)
    .then((result) => {
      console.log("\n✅ Race commentary job complete:", result)
      process.exit(0)
    })
    .catch((error) => {
      console.error("\n❌ Race commentary job failed:", error)
      process.exit(1)
    })
}
