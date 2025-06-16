"use server"

import { getSession } from "@/auth"
import { supabase } from "@/lib/supabase"
import { supabaseService } from "@/lib/supabase-service"
import { createClient } from "@supabase/supabase-js"
import {
  getCurrentVotingDateString,
  getVotingDayBounds,
  getCurrentVotingDay,
  getHoursRemaining,
} from "@/lib/date-utils"
import { getRemainingTimeToMidnightUTC } from "@/lib/utils"
import { getDefaultOpeningChyron } from "@/lib/constants"

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

/**
 * Build the full context for a given voting day.
 *
 * @param voteDate Optional date string (YYYY-MM-DD). If omitted, the current voting day is used.
 */
async function buildRaceContext(voteDate?: string): Promise<RaceContext> {
  // Determine which day we are building context for
  const today = voteDate ?? getCurrentVotingDateString()

  // Get current standings from live results
  const { data: liveResult } = await supabase
    .from("live_results")
    .select("emoji_counts, total_votes")
    .eq("vote_date", today)
    .single()

  const voteCounts =
    (liveResult?.emoji_counts as { [key: string]: number }) || {}
  const totalVotes = liveResult?.total_votes || 0

  // Get timing data for proper ranking (where later votes = better ranking)
  const { data: voteTimingData } = await supabase
    .from("votes")
    .select("emoji, created_at")
    .eq("vote_date", today)

  // Calculate timing-based rankings (same logic as main voting results)
  const emojiTimingMap = new Map()
  if (voteTimingData && voteTimingData.length > 0) {
    const dayStart = new Date(today + "T00:00:00.000Z").getTime()
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

  // Use the same countdown logic as the navbar
  const timeRemaining = getRemainingTimeToMidnightUTC()

  // Get historical context (last 5 days)
  const { data: historicalData } = await supabase
    .from("daily_summaries")
    .select("vote_date, winning_emoji, winning_count")
    .order("vote_date", { ascending: false })
    .limit(5)

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
    .eq("vote_date", today)
    .order("created_at", { ascending: false })
    .limit(100) // Last 100 votes for momentum analysis

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
      if (recentPercentage > 20) trend = "surging"
      else if (recentPercentage > 5) trend = "steady"
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
    totalVotes >= 100 // High participation

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
  mode: "chyron" | "farcaster" | "web" = "web"
): Promise<string> {
  let prompt = ""

  if (mode === "chyron") {
    const standingsSnippet = context.currentStandings
      .map((s, i) => `${i + 1}. ${s.emoji} ${s.count}V`)
      .join(" • ")

    const recentWinners = context.historicalWinners
      .slice(0, 5)
      .map((w) => `${w.emoji}`)
      .join(" ")

    const streakInfo = (() => {
      const first = context.historicalWinners[0]
      if (!first) return ""
      const streakLen = context.historicalWinners.filter(
        (w) => w.emoji === first.emoji
      ).length
      if (streakLen >= 2)
        return ` • ${first.emoji} WON ${streakLen} OF LAST ${context.historicalWinners.length}`
      return ""
    })()

    prompt = `You are a breaking-news ticker announcer covering the daily emoji election on EMOJI.TODAY.

GOAL: Write ONE punchy ticker line (ALL CAPS, max 60 chars). It should feel like live sports commentary—dramatic, witty, sometimes cheeky.

CURRENT STANDINGS:
${standingsSnippet}

Total votes ${context.totalVotes} • ${context.timeRemaining.hours}H ${context.timeRemaining.minutes}M LEFT

RANK ORDER ABOVE IS FINAL—#1 is the current leader. When vote counts are tied, the emoji that got a vote most recently ranks higher.

Feel free to comment on late surges, under-dog emojis, or wild world events that might explain an emoji's rise (e.g. "🌊 TSUNAMI OF SUPPORT"). Use emoji characters, keep it fun.

RECENT WINNERS: ${recentWinners}${streakInfo}

FUN FACTS: ${context.raceStats.uniqueEmojis} UNIQUE EMOJIS IN TODAY'S RACE.

Think like a sports commentator-meets-tabloid editor: exaggerate drama, invent playful storylines, but keep it believable.

IMPORTANT: REFER TO EMOJIS **ONLY** BY THEIR GLYPHS, NOT THEIR ENGLISH NAMES (e.g., use 🔥, not "FIRE").

OUTPUT: single line, ALL CAPS. Example styles:
"🔥 LEADS WITH 15 • 6H LEFT"
"TIGHT RACE! 🎩 VS 💎 • 2 VOTE GAP"
"🌱 LATE SURGE HOPES FOR MIRACLE"`
  } else if (mode === "farcaster") {
    // Optimized for social media posts (Farcaster)
    prompt = `You are a larger-than-life master of ceremonies announcing the daily emoji election on emoji.today. Only ONE emoji will capture today's vibe and echo through history. Write 1–2 punchy sentences (≤ 200 chars) that:

• Spotlight the frontrunner (based on vote count, with latest vote as tiebreaker).
• Tease the challengers and any late surges.
• Remind people they can still tip the scales if voting is open.
• Convey epic stakes – future humans may judge this choice!
• If emojis are tied in votes, the one with more recent activity ranks higher.

Rankings (vote count first, latest vote breaks ties):
${context.currentStandings
  .map((s, i) => `${i + 1}. ${s.emoji}: ${s.count} votes (${s.percentage}%)`)
  .join("\n")}

Total votes so far: ${context.totalVotes}
Time remaining: ${context.timeRemaining.hours}h ${
      context.timeRemaining.minutes
    }m
Momentum: ${context.momentum.map((m) => `${m.emoji}: ${m.trend}`).join(", ")}

Tone: Think sports commentator meets royal herald – dramatic, witty, a dash of cheek. Use emoji glyphs only, NO hashtags, no URLs.`
  } else {
    // Original web version
    prompt = `You are a breathless, exciting horse race announcer covering the daily emoji election at emoji.today. Write a short, energetic commentary (1-2 sentences max) about the current race based on this data:

CURRENT STANDINGS (ranked by vote count, with latest vote time as tiebreaker):
${context.currentStandings
  .map(
    (s, i) =>
      `${i + 1}. ${s.emoji} ${s.name ? `(${s.name})` : ""}: ${s.count} votes (${
        s.percentage
      }%)`
  )
  .join("\n")}

Total votes: ${context.totalVotes}
Time remaining: ${context.timeRemaining.hours}H ${
      context.timeRemaining.minutes
    }M LEFT
Unique emojis in race: ${context.raceStats.uniqueEmojis}
${
  context.raceStats.tightestRace
    ? "This is an incredibly tight race!"
    : `Leader ahead by ${context.raceStats.frontrunnerLead} votes`
}

RECENT MOMENTUM:
${context.momentum
  .map((m) => `${m.emoji}: ${m.recentVotes} recent votes (${m.trend})`)
  .join("\n")}

RECENT HISTORY:
${context.historicalWinners
  .slice(0, 3)
  .map((h) => `${h.date}: ${h.emoji} won with ${h.winningCount} votes`)
  .join("\n")}

CRITICAL: The rankings use vote count first, then LATEST vote time as a tiebreaker. When two emojis have the same vote count, the one that received a vote most recently ranks higher - they're not tied! The higher-ranked emoji "leads by timing tiebreak". This creates strategic late-game dynamics where a last-minute vote can shift rankings!

Write like you're calling a horse race - dramatic, energetic, and focused on the most exciting current developments. Reference specific emojis by their actual emoji character, mention vote counts, and capture the drama of the moment. Keep it concise but thrilling!`
  }

  const modelCandidates = [
    "x-ai/grok-3-mini-beta", // primary
    "google/gemini-2.5-pro-preview", // fallback
  ]

  for (const modelName of modelCandidates) {
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
            model: modelName,
            messages: [{ role: "user", content: prompt }],
            max_tokens:
              mode === "chyron" ? 200 : mode === "farcaster" ? 280 : 140,
            temperature: 0.9,
          }),
        }
      )

      if (!response.ok) {
        // Try next candidate
        console.warn(`Model ${modelName} failed with status ${response.status}`)
        continue
      }

      const data = (await response.json()) as any
      return data.choices[0].message.content.trim()
    } catch (error) {
      console.warn(`Model ${modelName} threw error`, error)
      // Try next model
    }
  }

  // If all models fail, produce fallback
  try {
    const leader = context.currentStandings[0]
    const second = context.currentStandings[1]
    if (leader) {
      // Check for timing-based ties (same vote count, different ranking due to timing)
      const isTimingTiebreak = second && leader.count === second.count

      if (mode === "chyron") {
        if (isTimingTiebreak) {
          return `${leader.emoji} LEADS BY TIMING • BOTH AT ${leader.count} VOTES • ${context.timeRemaining.hours}H${context.timeRemaining.minutes}M LEFT`
        }
        return `${leader.emoji} LEADS WITH ${leader.count} • ${context.timeRemaining.hours}H${context.timeRemaining.minutes}M LEFT`
      } else if (mode === "farcaster") {
        if (isTimingTiebreak) {
          return `🏁 ${leader.emoji} leads by timing tiebreak over ${second.emoji} (both at ${leader.count} votes) with ${context.timeRemaining.hours}h ${context.timeRemaining.minutes}m left!`
        }
        return `🏁 ${leader.emoji} leads with ${leader.count} votes, but ${context.timeRemaining.hours}h ${context.timeRemaining.minutes}m left in this ${context.raceStats.uniqueEmojis}-emoji showdown!`
      } else {
        if (isTimingTiebreak) {
          return `🏁 ${leader.emoji} leads by timing tiebreak! Both ${leader.emoji} and ${second.emoji} have ${leader.count} votes, but ${leader.emoji} gets the edge from more recent voting activity.`
        }
        return `🏁 ${leader.emoji} is leading the pack with ${leader.count} votes (${leader.percentage}%), but with ${context.timeRemaining.hours}h ${context.timeRemaining.minutes}m left, anything can happen in this ${context.raceStats.uniqueEmojis}-emoji showdown!`
      }
    }
    return mode === "chyron"
      ? "EMOJI RACE HEATING UP!"
      : "🏁 The emoji race is heating up! Every vote counts as we approach the finish line!"
  } catch (error) {
    console.error("Error generating commentary:", error)
    return mode === "chyron"
      ? "EMOJI RACE HEATING UP!"
      : "🏁 The emoji race is heating up! Every vote counts as we approach the finish line!"
  }
}

// Utility to remove all hashtags from the generated commentary
function stripHashtags(text: string): string {
  // Remove hashtags (words that start with # and continue until a whitespace or punctuation)
  return text
    .replace(/#[\w-]+/g, "") // strip hashtags themselves
    .replace(/\s{2,}/g, " ") // collapse multiple spaces created by removals
    .trim()
}

async function postToFarcaster(text: string): Promise<boolean> {
  try {
    const response = await fetch("https://api.neynar.com/v2/farcaster/cast", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.NEYNAR_API_KEY!,
      },
      body: JSON.stringify({
        signer_uuid: process.env.FARCASTER_SIGNER_UUID!,
        text,
        channel_id: "emojitoday", // Post to your channel if you have one
      }),
    })

    if (!response.ok) {
      const errorData = (await response.json()) as any
      console.error("Neynar API error:", response.status, errorData)
      return false
    }

    const data = (await response.json()) as any
    console.log("Cast posted successfully:", data.cast.hash)
    return true
  } catch (error) {
    console.error("Error posting to Farcaster:", error)
    return false
  }
}

// Store last posted commentary to avoid duplicate posts using database
async function shouldPostNewCommentary(
  newCommentary: string
): Promise<boolean> {
  const today = new Date().toISOString().split("T")[0]

  try {
    // Check if we've posted this exact commentary today
    const { data: existingPosts } = await supabase
      .from("race_commentary_posts")
      .select("commentary")
      .eq("post_date", today)
      .order("created_at", { ascending: false })
      .limit(5)

    if (existingPosts) {
      // Check if any recent post is too similar (prevent spam)
      const isDuplicate = existingPosts.some(
        (post) =>
          post.commentary === newCommentary ||
          // Simple similarity check (you could make this more sophisticated)
          post.commentary.slice(0, 50) === newCommentary.slice(0, 50)
      )

      if (isDuplicate) {
        return false
      }
    }

    return true
  } catch (error) {
    console.error("Error checking commentary posts:", error)
    return true // Default to allowing post if check fails
  }
}

async function logCommentaryPost(
  commentary: string,
  wasPosted: boolean
): Promise<void> {
  const today = new Date().toISOString().split("T")[0]

  try {
    await supabase.from("race_commentary_posts").insert({
      post_date: today,
      commentary,
      posted_to_farcaster: wasPosted,
    })
  } catch (error) {
    console.error("Error logging commentary post:", error)
    // Don't throw - logging is not critical
  }
}

export async function generateRaceCommentary(): Promise<{
  success: boolean
  commentary?: string
  error?: string
}> {
  try {
    // Check authentication
    const session = await getSession()
    if (!session?.user?.fid) {
      throw new Error("Authentication required")
    }

    // Build race context
    const context = await buildRaceContext()

    // Generate commentary with OpenRouter (web mode for the existing component)
    const commentary = await generateCommentaryWithOpenRouter(context, "web")

    return {
      success: true,
      commentary,
    }
  } catch (error) {
    console.error("Error generating race commentary:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function generateChyronUpdate(): Promise<{
  success: boolean
  chyron?: string
  error?: string
}> {
  try {
    // Build race context (no auth required for chyron)
    const context = await buildRaceContext()

    // Only proceed if there are votes to comment on
    if (context.totalVotes === 0) {
      return {
        success: true,
        chyron: getDefaultOpeningChyron(),
      }
    }

    // Generate chyron-optimized commentary
    const chyron = await generateCommentaryWithOpenRouter(context, "chyron")

    return {
      success: true,
      chyron,
    }
  } catch (error) {
    console.error("Error generating chyron update:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function generateAndPostRaceUpdate(): Promise<{
  success: boolean
  commentary?: string
  posted?: boolean
  error?: string
}> {
  try {
    // Decide which day to pull results for – if it's shortly after UTC midnight, use the previous day
    const now = new Date()
    const isJustAfterMidnightUTC =
      now.getUTCHours() === 0 && now.getUTCMinutes() < 30

    const previousDateString = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0]

    const context = await buildRaceContext(
      isJustAfterMidnightUTC ? previousDateString : undefined
    )

    // Only proceed if there are votes to comment on
    if (context.totalVotes === 0) {
      return {
        success: false,
        error: "No votes yet today",
      }
    }

    // Generate Farcaster-optimised commentary
    const rawCommentary = await generateCommentaryWithOpenRouter(
      context,
      "farcaster"
    )

    // Remove any hashtags to keep the feed clean
    const commentary = stripHashtags(rawCommentary)

    // Check if we should post this commentary
    const shouldPost = await shouldPostNewCommentary(commentary)

    let posted = false
    if (shouldPost) {
      posted = await postToFarcaster(commentary)
    }

    // Log the attempt
    await logCommentaryPost(commentary, posted)

    return {
      success: true,
      commentary,
      posted,
    }
  } catch (error) {
    console.error("Error generating and posting race update:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function checkForDramaticMoments(): Promise<{
  isDramatic: boolean
  context?: RaceContext
}> {
  try {
    const context = await buildRaceContext()

    return {
      isDramatic: context.raceStats.isDramaticMoment,
      context,
    }
  } catch (error) {
    console.error("Error checking for dramatic moments:", error)
    return { isDramatic: false }
  }
}

// Add function to update chyron in database when votes change
export async function updateChyronOnVoteChange(): Promise<{
  success: boolean
  chyron?: string
  error?: string
}> {
  try {
    // Generate new chyron text
    const result = await generateChyronUpdate()

    if (!result.success || !result.chyron) {
      return { success: false, error: result.error }
    }

    const today = new Date().toISOString().split("T")[0]

    const serviceSupabase = supabaseService()

    const { error: upsertErr } = await serviceSupabase.from("chyrons").upsert(
      {
        vote_date: today,
        text: result.chyron,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "vote_date" }
    )

    if (upsertErr) {
      console.error("Failed to store chyron:", upsertErr)
      return { success: false, error: upsertErr.message }
    }

    console.log("📺 Chyron updated:", result.chyron)
    return { success: true, chyron: result.chyron }
  } catch (error) {
    console.error("Error updating chyron on vote change:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
