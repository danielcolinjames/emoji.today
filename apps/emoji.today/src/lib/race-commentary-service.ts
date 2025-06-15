import { supabase } from "./supabase"
import { createClient } from "@supabase/supabase-js"
import {
  getCurrentVotingDateString,
  getPreviousVotingDateString,
} from "./date-utils"
import { getRemainingTimeToMidnightUTC } from "./utils"
import { getDefaultOpeningChyron } from "./constants"
import { supabaseService } from "@/lib/supabase-service"
import { format } from "date-fns"

// Service role client for bypassing RLS - lazy initialization
let _serviceSupabase: ReturnType<typeof createClient> | null = null

function getServiceSupabase() {
  if (!_serviceSupabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Supabase service role credentials are not configured")
    }

    _serviceSupabase = createClient(supabaseUrl, serviceRoleKey)
  }

  return _serviceSupabase
}

export interface EmojiStanding {
  emoji: string
  count: number
  percentage: number
  rank: number
  timing_score: number
  name?: string
}

export interface RaceSnapshot {
  vote_date: string
  milestone: string
  timestamp_utc: string
  total_votes: number
  emoji_standings: EmojiStanding[]
  momentum_data: {
    recent_leaders: {
      emoji: string
      recent_votes: number
      trend: "surging" | "steady" | "declining"
    }[]
    vote_velocity: number // votes per hour
    dramatic_moments: string[]
  }
  historical_context: {
    previous_snapshots: any[]
    same_time_yesterday?: { total_votes: number; leader: string }
    recent_winners: { date: string; emoji: string; count: number }[]
  }
  commentary_text?: string
  chyron_text?: string
  id?: number
}

const MILESTONE_PROMPTS = {
  opening: `THE POLLS ARE OPEN! Write like a breathless election night announcer calling citizens to choose which emoji gets enshrined in history today.

Current early returns: {emoji_standings}
Yesterday's champion: {yesterday_winner} ({yesterday_count} votes)

Tone: Breathless horse race announcer meets political pundit. Self-aware drama about "digital democracy" and "historical archives." Under 120 chars! 

CRITICAL: DO NOT USE ANY EMOJIS except the ones listed in the standings above. NO decorative emojis, NO flag emojis, NO chart emojis. Only the actual competing emojis from the race.`,

  "1hour": `EARLY RETURNS! Write like an election night pundit analyzing which emoji will claim its place in the eternal digital archives.

Current standings: {emoji_standings}
Voter turnout: {vote_velocity} votes/hour

Tone: Political pundit meets horse race announcer. "What we're seeing here..." Self-aware about the stakes of emoji immortality. Under 120 chars! 

CRITICAL: DO NOT USE ANY EMOJIS except the ones listed in the standings above. NO decorative emojis, NO additional emojis. Only the actual competing emojis from the race.`,

  halfway: `MIDDAY ANALYSIS! Write like a seasoned political commentator on which emoji will earn eternal digital glory.

Current race: {emoji_standings}
Total votes: {total_votes}

Tone: Election night analyst meets old-school politician. "The voters are speaking!" Dramatic about historical significance. Under 120 chars! 

CRITICAL: DO NOT USE ANY EMOJIS except the ones listed in the standings above. NO decorative emojis, NO flag emojis, NO chart emojis. Only the actual competing emojis from the race.`,

  "6hours_left": `AFTERNOON CHECK-IN! Write a fun, shorter observation about the leading emoji. Share a quirky fact, cultural insight, or playful speculation about why this emoji is resonating today.

Current leader: {emoji_standings}
Hours remaining: 6

Tone: Casual but witty pundit. Think fun trivia meets social commentary. Make an interesting connection or observation about the winning emoji. Under 120 chars! 

CRITICAL: DO NOT USE ANY EMOJIS except the ones listed in the standings above. NO decorative emojis, NO additional emojis. Only the actual competing emojis from the race.`,

  "3hours_left": `EVENING UPDATE! Write a brief, entertaining take on the race. Maybe a fun fact about the winning emoji or a witty observation about voting patterns.

Current standings: {emoji_standings}  
Time left: 3 hours

Tone: Casual evening news anchor with personality. Share something surprising or amusing about the leader. Keep it light and engaging. Under 100 chars! 

CRITICAL: DO NOT USE ANY EMOJIS except the ones listed in the standings above. NO decorative emojis, NO additional emojis. Only the actual competing emojis from the race.`,

  final_hour: `FINAL HOUR! Write like a frantic election night anchor - time is running out to determine which emoji enters the historical record!

Race standings: {emoji_standings}
Time left: {time_remaining}

Tone: Breathless urgency meets political gravitas. "History hangs in the balance!" Self-aware drama about emoji posterity. Under 120 chars! 

CRITICAL: DO NOT USE ANY EMOJIS except the ones listed in the standings above. NO decorative emojis, NO flag emojis, NO chart emojis. Only the actual competing emojis from the race.`,

  final_minutes: `FINAL MINUTES! Write like a horse race announcer calling the stretch run - which emoji will be immortalized in today's archives?

Current positions: {emoji_standings}

Tone: Peak breathless announcer energy. "Coming down the stretch!" Dramatic stakes about digital immortality. Under 120 chars! 

CRITICAL: DO NOT USE ANY EMOJIS except the ones listed in the standings above. NO decorative emojis, NO additional emojis. Only the actual competing emojis from the race.`,

  daily_summary: `THE VOTES ARE IN! Write like a triumphant election night anchor announcing which emoji has been enshrined in history.

Official results: {emoji_standings}
Victor: {winner_emoji} ({winner_count} votes)
Total turnout: {total_votes}

Tone: Ceremonial gravitas meets victory announcement. "History has been written!" Celebrate the emoji's eternal glory. Under 120 chars! 

CRITICAL: DO NOT USE ANY EMOJIS except the ones listed in the standings above. NO decorative emojis, NO flag emojis, NO chart emojis. Only the winning emoji and competing emojis from the race.`,
}

const CHYRON_PROMPT = `Write a dramatic news ticker about today's emoji race. Make it feel like breaking news!

Current leaders: {emoji_standings}

Create a fun story explaining WHY people are voting for the winning emoji. Examples:
"🔥 SPICY FOOD TREND EXPLODES GLOBALLY"
"😴 MONDAY BLUES HIT PEAK INTENSITY"

Style: 40-60 chars, ALL CAPS, dramatic, witty. No hashtags. 

CRITICAL: DO NOT USE ANY EMOJIS except the ones listed in the standings above. NO decorative emojis, NO flag emojis, NO additional emojis. Only the actual competing emojis from the race.`

// === OpenRouter model configuration ===
// Override via environment variables without touching code.
export const OPENROUTER_COMMENTARY_MODEL =
  process.env.OPENROUTER_COMMENTARY_MODEL || "x-ai/grok-3-mini-beta"

export const OPENROUTER_CHYRON_MODEL =
  process.env.OPENROUTER_CHYRON_MODEL || "google/gemini-2.5-pro-preview"

export async function createRaceSnapshot(
  milestone: string,
  force: boolean = false,
  dateOverride?: string
): Promise<{ success: boolean; snapshot?: RaceSnapshot; error?: string }> {
  try {
    console.log(`📸 Creating race snapshot for milestone: ${milestone}`)

    const effectiveDateStr = dateOverride
      ? dateOverride
      : milestone === "daily_summary"
      ? getPreviousVotingDateString()
      : getCurrentVotingDateString()
    const now = new Date()

    // Check if snapshot already exists for this milestone today (unless forced)
    if (!force) {
      const { data: existingSnapshot } = await getServiceSupabase()
        .from("race_commentary_snapshots")
        .select("*")
        .eq("vote_date", effectiveDateStr)
        .eq("milestone", milestone)
        .single()

      if (existingSnapshot) {
        console.log(`⏭️  Snapshot for ${milestone} already exists today`)
        return {
          success: true,
          snapshot: {
            vote_date: existingSnapshot.vote_date,
            milestone: existingSnapshot.milestone,
            timestamp_utc: existingSnapshot.timestamp_utc,
            total_votes: existingSnapshot.total_votes,
            emoji_standings:
              existingSnapshot.emoji_standings as EmojiStanding[],
            momentum_data:
              existingSnapshot.momentum_data as RaceSnapshot["momentum_data"],
            historical_context:
              existingSnapshot.historical_context as RaceSnapshot["historical_context"],
            commentary_text: existingSnapshot.commentary_text,
            id: existingSnapshot.id,
          } as RaceSnapshot,
        }
      }
    } else {
      console.log(`🔄 Force regenerating ${milestone} snapshot`)
    }

    // Get race state. For daily_summary we reference finalized daily_results to avoid zero-count bug.
    const raceContext =
      milestone === "daily_summary"
        ? await buildDailySummaryContext(effectiveDateStr)
        : await buildRaceContext(effectiveDateStr)

    // Get historical context
    const historicalContext = await buildHistoricalContext(
      effectiveDateStr,
      milestone
    )

    // Build the snapshot
    const snapshot: RaceSnapshot = {
      vote_date: effectiveDateStr,
      milestone,
      timestamp_utc: now.toISOString(),
      total_votes: raceContext.totalVotes,
      emoji_standings: raceContext.standings,
      momentum_data: raceContext.momentum,
      historical_context: historicalContext,
      id: undefined,
    }

    // Generate commentary only (chyron is handled by separate cron job)
    const commentary = await generateCommentaryForMilestone(milestone, snapshot)
    snapshot.commentary_text = commentary

    // Store snapshot in database
    const { data: insertedSnapshot, error: insertError } =
      await getServiceSupabase()
        .from("race_commentary_snapshots")
        .insert({
          vote_date: snapshot.vote_date,
          milestone: snapshot.milestone,
          timestamp_utc: snapshot.timestamp_utc,
          total_votes: snapshot.total_votes,
          emoji_standings: snapshot.emoji_standings,
          momentum_data: snapshot.momentum_data,
          historical_context: snapshot.historical_context,
          commentary_text: snapshot.commentary_text,
        })
        .select()
        .single()

    if (insertError) {
      console.error("Error inserting snapshot:", insertError)
      return { success: false, error: insertError.message }
    }

    // Attach generated id to snapshot
    if (insertedSnapshot && typeof insertedSnapshot.id === "number") {
      snapshot.id = insertedSnapshot.id
    }

    console.log(
      `✅ Created snapshot for ${milestone}: ${commentary?.slice(0, 100)}...`
    )
    return { success: true, snapshot: snapshot }
  } catch (error) {
    console.error("Error creating race snapshot:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

async function buildRaceContext(dateString: string) {
  // Get current standings from live results
  const { data: liveResult } = await supabase
    .from("live_results")
    .select("emoji_counts, total_votes")
    .eq("vote_date", dateString)
    .single()

  const voteCounts =
    (liveResult?.emoji_counts as { [key: string]: number }) || {}
  const totalVotes = liveResult?.total_votes || 0

  // Get timing data for proper ranking
  const { data: voteTimingData } = await supabase
    .from("votes")
    .select("emoji, created_at")
    .eq("vote_date", dateString)

  // Calculate timing-based rankings
  const emojiTimingMap = new Map()
  if (voteTimingData && voteTimingData.length > 0) {
    const dayStart = new Date(dateString + "T00:00:00.000Z").getTime()
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

  // Build standings with timing-based ranking
  const standings: EmojiStanding[] = Object.entries(voteCounts)
    .map(([emoji, count]) => ({
      emoji,
      count,
      percentage: Math.round((count / totalVotes) * 100),
      rank: 0, // Will be set after sorting
      timing_score: emojiTimingMap.get(emoji) || 0,
      name: undefined,
    }))
    .sort((a, b) => {
      // First sort by count (descending)
      if (a.count !== b.count) {
        return b.count - a.count
      }

      // For ties, use timing as tiebreaker (earlier votes win)
      if (emojiTimingMap.size > 0) {
        return a.timing_score - b.timing_score
      }

      return 0
    })
    .map((standing, index) => ({ ...standing, rank: index + 1 }))
    .slice(0, 10)

  // Get emoji names
  const topEmojis = standings.map((s) => s.emoji)
  const { data: emojiNames } = await supabase
    .from("emojis")
    .select("emoji, name")
    .in("emoji", topEmojis)

  const emojiNameMap = new Map(emojiNames?.map((e) => [e.emoji, e.name]) || [])
  standings.forEach((standing) => {
    standing.name = emojiNameMap.get(standing.emoji)
  })

  // Calculate momentum
  const { data: recentVotes } = await supabase
    .from("votes")
    .select("emoji, created_at")
    .eq("vote_date", dateString)
    .order("created_at", { ascending: false })
    .limit(100)

  const recentVoteCounts: { [key: string]: number } = {}
  recentVotes?.forEach((vote) => {
    recentVoteCounts[vote.emoji] = (recentVoteCounts[vote.emoji] || 0) + 1
  })

  const recent_leaders = Object.entries(recentVoteCounts)
    .map(([emoji, recentCount]) => {
      const totalCount = voteCounts[emoji] || 0
      const recentPercentage =
        totalCount > 0 ? (recentCount / totalCount) * 100 : 0

      let trend: "surging" | "steady" | "declining"
      if (recentPercentage > 20) trend = "surging"
      else if (recentPercentage > 5) trend = "steady"
      else trend = "declining"

      return { emoji, recent_votes: recentCount, trend }
    })
    .filter((m) => m.recent_votes > 0)
    .sort((a, b) => b.recent_votes - a.recent_votes)
    .slice(0, 5)

  // Calculate vote velocity (votes per hour)
  const timeElapsed =
    (Date.now() - new Date(dateString + "T00:00:00.000Z").getTime()) /
    (1000 * 60 * 60)
  const vote_velocity = timeElapsed > 0 ? totalVotes / timeElapsed : 0

  return {
    totalVotes,
    standings,
    momentum: {
      recent_leaders,
      vote_velocity,
      dramatic_moments: [], // TODO: Detect dramatic moments
    },
  }
}

async function buildHistoricalContext(dateString: string, milestone: string) {
  // Get previous snapshots for context
  const { data: previousSnapshots } = await getServiceSupabase()
    .from("race_commentary_snapshots")
    .select("*")
    .eq("vote_date", dateString)
    .neq("milestone", milestone)
    .order("timestamp_utc", { ascending: false })
    .limit(3)

  // Get yesterday's data at same time (if available)
  const yesterday = new Date(Date.parse(dateString) - 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0]
  const { data: yesterdaySnapshot } = await getServiceSupabase()
    .from("race_commentary_snapshots")
    .select("*")
    .eq("vote_date", yesterday)
    .eq("milestone", milestone)
    .single()

  // Get recent winners
  const { data: recentWinners } = await supabase
    .from("daily_summaries")
    .select("vote_date, winning_emoji, winning_count")
    .order("vote_date", { ascending: false })
    .limit(5)

  return {
    previous_snapshots: previousSnapshots || [],
    same_time_yesterday: yesterdaySnapshot
      ? {
          total_votes: Number(yesterdaySnapshot.total_votes) || 0,
          leader:
            (yesterdaySnapshot.emoji_standings as EmojiStanding[])?.[0]
              ?.emoji || "❓",
        }
      : undefined,
    recent_winners:
      recentWinners?.map((w) => ({
        date: w.vote_date,
        emoji: w.winning_emoji,
        count: w.winning_count,
      })) || [],
  }
}

function formatDateForCommentary(dateString: string): string {
  const date = new Date(dateString + "T00:00:00.000Z")
  const months = [
    "JANUARY",
    "FEBRUARY",
    "MARCH",
    "APRIL",
    "MAY",
    "JUNE",
    "JULY",
    "AUGUST",
    "SEPTEMBER",
    "OCTOBER",
    "NOVEMBER",
    "DECEMBER",
  ]
  const month = months[date.getUTCMonth()]
  const day = date.getUTCDate()
  const year = date.getUTCFullYear()
  return `${month} ${day}, ${year}`
}

async function generateCommentaryForMilestone(
  milestone: string,
  snapshot: RaceSnapshot
): Promise<string> {
  const prompt = MILESTONE_PROMPTS[milestone as keyof typeof MILESTONE_PROMPTS]
  if (!prompt) {
    throw new Error(`No prompt defined for milestone: ${milestone}`)
  }

  // Replace template variables
  const winner = snapshot.emoji_standings[0]
  const processedPrompt = prompt
    .replace(
      "{vote_date_formatted}",
      formatDateForCommentary(snapshot.vote_date)
    )
    .replace(
      "{emoji_standings}",
      formatStandingsForPrompt(snapshot.emoji_standings)
    )
    .replace("{momentum_data}", JSON.stringify(snapshot.momentum_data, null, 2))
    .replace("{vote_velocity}", snapshot.momentum_data.vote_velocity.toFixed(1))
    .replace("{total_votes}", snapshot.total_votes.toString())
    .replace("{winner_emoji}", winner?.emoji || "❓")
    .replace("{winner_count}", winner?.count?.toString() || "0")
    .replace(
      "{yesterday_winner}",
      snapshot.historical_context.recent_winners?.[0]?.emoji || "❓"
    )
    .replace(
      "{yesterday_count}",
      snapshot.historical_context.recent_winners?.[0]?.count?.toString() || "0"
    )
    .replace(
      "{time_remaining}",
      getRemainingTimeToMidnightUTC().hours +
        "h " +
        getRemainingTimeToMidnightUTC().minutes +
        "m"
    )
    .replace(
      "{historical_comparison}",
      JSON.stringify(snapshot.historical_context, null, 2)
    )

  try {
    let commentary = ""
    let attempts = 0
    const maxAttempts = 3

    while (attempts < maxAttempts && commentary === "") {
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
            model: OPENROUTER_COMMENTARY_MODEL,
            messages: [
              {
                role: "system",
                content:
                  'You are an energetic, globally minded election-night announcer. Reply ONLY in valid JSON like {"commentary":"TEXT"}. No other keys. No references to any country (e.g., USA). Only emojis listed are allowed. NO hashtags. Very brief and concise.',
              },
              { role: "user", content: processedPrompt },
            ],
            max_tokens: 400,
            temperature: 0.8 + attempts * 0.1,
            response_format: { type: "json_object" },
          }),
        }
      )

      if (!response.ok) throw new Error(`OpenRouter API ${response.status}`)

      const json = (await response.json()) as any
      let rawContent = json.choices?.[0]?.message?.content?.trim() || ""

      // Try parse JSON
      try {
        const parsed = JSON.parse(rawContent)
        commentary = parsed.commentary?.trim() || ""
      } catch (e) {
        // If content is not pure JSON, attempt to extract between braces
        const match = rawContent.match(/\{[\s\S]*\}/)
        if (match) {
          try {
            const parsed = JSON.parse(match[0])
            commentary = parsed.commentary?.trim() || ""
          } catch (_) {}
        }
      }

      commentary = stripMetaCommentary(commentary)

      // Validate forbidden references
      const geoPattern = /(america|usa|united states|u\.s\.?)/i
      if (geoPattern.test(commentary)) commentary = ""

      attempts++
    }

    if (!commentary) throw new Error("Failed to get clean commentary")

    // Validate that only racing emojis are used
    const validEmojis = snapshot.emoji_standings.map((s) => s.emoji)
    const validEmojisSet = new Set(validEmojis)

    // Find all emojis in the commentary using Unicode emoji regex
    const emojiRegex = /[\uD83C-\uDBFF\uDC00-\uDFFF]+|[\u2600-\u27BF]/g
    const foundEmojis = commentary.match(emojiRegex) || []

    // Check if any invalid emojis are present
    const invalidEmojis = foundEmojis.filter(
      (emoji: string) => !validEmojisSet.has(emoji)
    )

    if (invalidEmojis.length > 0) {
      console.warn(
        `Generated commentary contains invalid emojis: ${invalidEmojis.join(
          ", "
        )}`
      )
      console.warn(`Valid emojis: ${validEmojis.join(", ")}`)
      console.warn(`Original commentary: ${commentary}`)

      // Remove invalid emojis
      invalidEmojis.forEach((invalidEmoji: string) => {
        commentary = commentary.replace(new RegExp(invalidEmoji, "g"), "")
      })

      console.log(`Cleaned commentary: ${commentary}`)
    }

    return commentary
  } catch (error) {
    console.error("Error generating commentary:", error)
    // Fallback commentary
    const leader = snapshot.emoji_standings[0]
    const formattedDate = formatDateForCommentary(snapshot.vote_date)
    if (leader) {
      return `${leader.emoji} leads with ${leader.count} votes in the election for ${formattedDate}. Total turnout: ${snapshot.total_votes} votes.`
    }
    return `Voting continues for the emoji of ${formattedDate}. Cast your vote at emoji.today`
  }
}

// Utility: remove meta explanations (e.g., "Whoops, here's a corrected version") to keep commentary "pure".
function stripMetaCommentary(text: string): string {
  // Split into lines, drop any that contain common apology/correction phrases
  const forbiddenPatterns =
    /whoops|correct(ed|ion)|apolog(y|ies)|sorry|here's a corrected|here is a corrected/i

  // Remove entire lines that reference specific countries (America/USA/etc.) to keep global framing
  const geoPatterns =
    /\b(america|american|americans|usa|united states|u\.s\.?|us)\b/i

  const cleanedLines = text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(
      (l) => l.length > 0 && !forbiddenPatterns.test(l) && !geoPatterns.test(l)
    )

  let cleaned = cleanedLines
    .join(" ")
    .replace(/\s{2,}/g, " ")
    .trim()

  // In the rare case the model included multiple versions separated by parenthesis, keep the first sentence up to the first newline or 280 chars.
  if (cleaned.length > 280) {
    cleaned = cleaned.slice(0, 279).trim()
  }

  return cleaned
}

async function generateChyronText(snapshot: RaceSnapshot): Promise<string> {
  const prompt = CHYRON_PROMPT.replace(
    "{vote_date_formatted}",
    formatDateForCommentary(snapshot.vote_date)
  )
    .replace(
      "{emoji_standings}",
      formatStandingsForPrompt(snapshot.emoji_standings.slice(0, 5))
    )
    .replace(
      "{historical_context}",
      JSON.stringify(snapshot.historical_context.recent_winners, null, 2)
    )

  console.log("🔍 Prompt:", prompt)

  // Try AI generation first
  let attempts = 0
  const maxAttempts = 2

  while (attempts < maxAttempts) {
    try {
      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "X-Title": "emoji.today chyron",
          },
          body: JSON.stringify({
            model: OPENROUTER_CHYRON_MODEL,
            messages: [{ role: "user", content: prompt }],
            max_tokens: 100,
            temperature: 0.7 + attempts * 0.2, // Increase temperature on retry
          }),
        }
      )

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`)
      }

      const data = (await response.json()) as any
      let chyron = data.choices[0].message.content.trim()

      // Clean up the response
      const lines = chyron
        .split("\n")
        .filter((line: string) => line.trim().length > 0)
      const firstLine = lines[0]?.trim() || chyron

      // Remove quotes if present
      chyron = firstLine.replace(/^["']|["']$/g, "")

      // Validate that only racing emojis are used in chyron too
      const validEmojis = snapshot.emoji_standings.map((s) => s.emoji)
      const validEmojisSet = new Set(validEmojis)
      const emojiRegex = /[\uD83C-\uDBFF\uDC00-\uDFFF]+|[\u2600-\u27BF]/g
      const foundEmojis = chyron.match(emojiRegex) || []
      const invalidEmojis = foundEmojis.filter(
        (emoji: string) => !validEmojisSet.has(emoji)
      )

      if (invalidEmojis.length > 0) {
        console.warn(
          `Generated chyron contains invalid emojis: ${invalidEmojis.join(
            ", "
          )}`
        )
        invalidEmojis.forEach((invalidEmoji: string) => {
          chyron = chyron.replace(new RegExp(invalidEmoji, "g"), "")
        })
      }

      // Validate the chyron
      console.log(`📺 Generated chyron: "${chyron}" (${chyron.length} chars)`)

      if (chyron.length >= 20 && chyron.length <= 200) {
        return chyron.toUpperCase()
      } else {
        console.warn(
          "Generated chyron invalid:",
          chyron,
          `(${chyron.length} chars)`,
          "Reasons:",
          {
            tooShort: chyron.length < 20,
            tooLong: chyron.length > 200,
          }
        )
        attempts++
        continue
      }
    } catch (error) {
      console.error(`Error generating chyron (attempt ${attempts + 1}):`, error)
      attempts++
      if (attempts >= maxAttempts) break

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  console.warn("AI chyron generation failed, using fallback")

  // Enhanced fallback chyrons based on race dynamics
  const leader = snapshot.emoji_standings[0]
  const second = snapshot.emoji_standings[1]
  const loser = snapshot.emoji_standings.find((s) => s.count === 1)

  if (loser && leader !== loser) {
    // Create stories for single-vote emojis
    const stories = [
      `${loser.emoji} HOLDS THE LINE • ONE BRAVE SOUL STANDS ALONE`,
      `${loser.emoji} DEFIES THE ODDS • UNDERDOG SPIRIT LIVES ON`,
      `${loser.emoji} FIGHTS FOR RELEVANCE • DAVID VS GOLIATH VIBES`,
    ]
    return stories[Math.floor(Math.random() * stories.length)]
  } else if (leader && second) {
    const gap = leader.count - second.count
    if (gap === 0) {
      const tieStories = [
        `${leader.emoji}${second.emoji} DEADLOCK DRAMA • FATE HANGS IN BALANCE`,
        `${leader.emoji}${second.emoji} PHOTO FINISH • EVERY VOTE MATTERS NOW`,
        `${leader.emoji}${second.emoji} SPLIT DECISION • WORLD CAN'T CHOOSE`,
      ]
      return tieStories[Math.floor(Math.random() * tieStories.length)]
    } else if (gap <= 3) {
      const closeStories = [
        `${leader.emoji} BARELY AHEAD • ${second.emoji} BREATHING DOWN NECK`,
        `NAIL-BITER ALERT! ${leader.emoji} LEADS BY WHISKER`,
        `${leader.emoji} vs ${second.emoji} • THRILLER IN PROGRESS`,
      ]
      return closeStories[Math.floor(Math.random() * closeStories.length)]
    }
  } else if (leader) {
    const dominationStories = [
      `${leader.emoji} TOTAL DOMINATION • RESISTANCE IS FUTILE`,
      `${leader.emoji} STEAMROLLS COMPETITION • CROWD GOES WILD`,
      `${leader.emoji} UNSTOPPABLE FORCE • NEW WORLD ORDER?`,
    ]
    return dominationStories[
      Math.floor(Math.random() * dominationStories.length)
    ]
  }
  return getDefaultOpeningChyron()
}

function formatStandingsForPrompt(standings: EmojiStanding[]): string {
  return standings
    .map((s, i) => `${i + 1}. ${s.emoji}: ${s.count} votes (${s.percentage}%)`)
    .join("\n")
}

export async function postToFarcaster(
  text: string,
  snapshotId?: number
): Promise<{ success: boolean; hash?: string; error?: string }> {
  if (!process.env.NEYNAR_API_KEY || !process.env.FARCASTER_SIGNER_UUID) {
    console.log("🚫 Farcaster credentials not configured - skipping post")
    return { success: false, error: "Farcaster credentials not configured" }
  }

  try {
    // Use the official Neynar SDK instead of direct fetch
    const { getNeynarClient } = await import("@/lib/neynar")
    const client = getNeynarClient()

    const response = await client.publishCast({
      signerUuid: process.env.FARCASTER_SIGNER_UUID,
      text: text,
      embeds: [
        {
          url: `${
            process.env.NODE_ENV === "development"
              ? "http://localhost:3000"
              : process.env.NEXT_PUBLIC_URL || "https://emoji.today"
          }/podium-snapshot/${snapshotId}`,
        },
      ],
    })

    const castHash = response.cast?.hash

    // Update snapshot with successful post
    if (snapshotId && castHash) {
      await getServiceSupabase()
        .from("race_commentary_snapshots")
        .update({
          posted_to_farcaster: true,
          farcaster_cast_hash: castHash,
        })
        .eq("id", snapshotId)
    }

    console.log(`✅ Posted to Farcaster: ${castHash}`)
    return { success: true, hash: castHash }
  } catch (error) {
    console.error("Error posting to Farcaster:", error)

    // Enhanced error handling with specific messages
    let errorMessage = "Unknown error"
    if (error instanceof Error) {
      errorMessage = error.message

      // Provide specific guidance for common issues
      if (
        errorMessage.includes("Invalid token") ||
        errorMessage.includes("403")
      ) {
        errorMessage += " - Check NEYNAR_API_KEY in environment variables"
      } else if (errorMessage.includes("signer")) {
        errorMessage +=
          " - Check FARCASTER_SIGNER_UUID in environment variables"
      }
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}

export async function getLatestChyronText(): Promise<string> {
  const today = getCurrentVotingDateString()

  // Get the most recent snapshot for today using service client
  const { data: latestSnapshot } = await getServiceSupabase()
    .from("race_commentary_snapshots")
    .select("chyron_text, timestamp_utc")
    .eq("vote_date", today)
    .order("timestamp_utc", { ascending: false })
    .limit(1)
    .single()

  if (
    latestSnapshot?.chyron_text &&
    typeof latestSnapshot.chyron_text === "string"
  ) {
    return latestSnapshot.chyron_text
  }

  // Fallback to generating a fresh chyron without creating a snapshot
  try {
    // Build current race context
    const raceContext = await buildRaceContext(today)
    const historicalContext = await buildHistoricalContext(today, "opening")

    // Create a temporary snapshot object for chyron generation
    const tempSnapshot: RaceSnapshot = {
      vote_date: today,
      milestone: "opening", // Use a valid milestone for the structure
      timestamp_utc: new Date().toISOString(),
      total_votes: raceContext.totalVotes,
      emoji_standings: raceContext.standings,
      momentum_data: raceContext.momentum,
      historical_context: historicalContext,
      id: undefined,
    }

    // Generate chyron without saving to database
    const chyron = await generateChyronText(tempSnapshot)
    return chyron
  } catch (error) {
    console.error("Error generating fallback chyron:", error)
    return getDefaultOpeningChyron()
  }
}

// Build finalized context for daily summary (uses daily_results table instead of live_results)
async function buildDailySummaryContext(dateString: string) {
  // Try daily_results for comprehensive emoji_votes
  const { data: dailyResult } = await supabase
    .from("daily_results")
    .select("emoji_votes, total_votes")
    .eq("vote_date", dateString)
    .single()

  // Fallback to daily_summaries (has top_5 only)
  const { data: dailySummary } = await supabase
    .from("daily_summaries")
    .select("top_5_emojis, total_votes")
    .eq("vote_date", dateString)
    .single()

  // Build voteCounts map
  const voteCounts: { [key: string]: number } =
    (dailyResult?.emoji_votes as any) || {}

  if (!dailyResult && dailySummary?.top_5_emojis) {
    // Convert array of objects to map if necessary
    const arr = dailySummary.top_5_emojis as unknown as {
      emoji: string
      count: number
    }[]
    arr.forEach((e) => {
      voteCounts[e.emoji] = e.count
    })
  }

  const totalVotes = dailyResult?.total_votes || dailySummary?.total_votes || 0

  // Build standings sorted by count desc
  const standings: EmojiStanding[] = Object.entries(voteCounts)
    .map(([emoji, count]) => ({
      emoji,
      count,
      percentage: totalVotes ? Math.round((count / totalVotes) * 100) : 0,
      rank: 0,
      timing_score: 0,
      name: undefined,
    }))
    .sort((a, b) => b.count - a.count)
    .map((standing, idx) => ({ ...standing, rank: idx + 1 }))
    .slice(0, 10)

  // Fetch names for top emojis
  if (standings.length) {
    const { data: emojiNames } = await supabase
      .from("emojis")
      .select("emoji, name")
      .in(
        "emoji",
        standings.map((s) => s.emoji)
      )

    const map = new Map(emojiNames?.map((e) => [e.emoji, e.name]) || [])
    standings.forEach((s) => (s.name = map.get(s.emoji)))
  }

  return {
    totalVotes,
    standings,
    momentum: {
      recent_leaders: [],
      vote_velocity: 0,
      dramatic_moments: [],
    },
  }
}
