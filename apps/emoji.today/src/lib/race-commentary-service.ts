import { supabase } from "./supabase"
import { createClient } from "@supabase/supabase-js"
import { getCurrentVotingDateString } from "./date-utils"
import { getRemainingTimeToMidnightUTC } from "./utils"
import { DEFAULT_OPENING_CHYRON } from "./constants"

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
}

const MILESTONE_PROMPTS = {
  opening: `OPENING CEREMONY: Voting is now open for the emoji of {vote_date_formatted}. Write a dignified yet compelling Farcaster post announcing the beginning of today's election. Reference any early voting patterns if present. This is a historic daily ritual - treat it with importance and gravitas. Under 280 characters.

Early voting data: {emoji_standings}
Historical context: Yesterday's winner was {yesterday_winner} with {yesterday_count} votes.

Tone: Authoritative, ceremonial, builds anticipation. "Today's election begins." Do not use any decorative emojis - only reference actual voting emojis. Do NOT include hashtags like #EmojiElection or any # symbols.`,

  "1hour": `EARLY RETURNS: One hour into voting for {vote_date_formatted}. Provide an analytical breakdown of the emerging patterns. Call out significant leads, unexpected developments, or tight competitions. Reference specific vote counts and trends. Think election night coverage with substance.

Current standings: {emoji_standings}
Vote momentum: {momentum_data}
Hourly rate: {vote_velocity} votes per hour

Tone: Analytical, authoritative, insightful. "Here's what the numbers tell us." Use only voting emojis in context. Do NOT include hashtags like #EmojiElection or any # symbols.`,

  halfway: `MIDDAY REPORT: We have reached the halfway point in today's election for {vote_date_formatted}. This is when decisive movements often emerge. Analyze the competitive landscape, identify momentum shifts, and assess which candidates are positioned for the final stretch.

Current standings: {emoji_standings}
Momentum analysis: {momentum_data}
Historical comparison: {historical_comparison}

Tone: Serious analysis, strategic insight, building tension. "The race takes shape." Reference only actual competing emojis. Do NOT include hashtags like #EmojiElection or any # symbols.`,

  final_hour: `FINAL HOUR: Sixty minutes remain in the election for {vote_date_formatted}. This is the decisive moment when late momentum can determine the outcome. Focus on viable paths to victory, tight margins, and the urgency of this closing window.

Current standings: {emoji_standings}
Late momentum: {momentum_data}
Time remaining: {time_remaining}

Tone: Urgent, dramatic, high stakes. "Every vote matters now." Use only competing emojis. Do NOT include hashtags like #EmojiElection or any # symbols.`,

  final_minutes: `FINAL MOMENTS: The election for {vote_date_formatted} closes in minutes. This is the culmination of 24 hours of democratic participation. If the race is close, emphasize the drama. If there's a clear winner, acknowledge their commanding performance.

Final standings: {emoji_standings}
Closing momentum: {momentum_data}

Tone: Climactic, historic, definitive. "History is being written." Reference only the competing emojis. Do NOT include hashtags like #EmojiElection or any # symbols.`,

  daily_summary: `ELECTION NIGHT WRAP-UP: The polls have closed and all votes have been counted for {vote_date_formatted}. Provide a comprehensive summary of the completed election. Announce the official winner, highlight key moments from the day, and provide statistical insights about voter turnout and competition.

Final official results: {emoji_standings}
Total voter turnout: {total_votes}
Winner: {winner_emoji} with {winner_count} votes
Historical context: {historical_comparison}

Tone: Authoritative, comprehensive, celebratory of democratic participation. "The results are in." Reference the winning emoji and key competitors. Do NOT include hashtags like #EmojiElection or any # symbols.`,
}

const CHYRON_PROMPT = `You will be some emojis and some context about the race for which one will represent today. You are the writer of headlines that will scroll across the bottom of a live view of the race, that anyone on earth can watch and vote on. It's your job to make people feel a sense of democratic pride, wonder about the winning emoji, and urgency about the race.

Data: {emoji_standings}

Write one VERY short ticker line. Format: [EMOJI] [RACE CONTEXT] • [SHORT PHRASE]! • [BRIEF SPECULATION]`

export async function createRaceSnapshot(
  milestone: string
): Promise<{ success: boolean; snapshot?: RaceSnapshot; error?: string }> {
  try {
    console.log(`📸 Creating race snapshot for milestone: ${milestone}`)

    const today = getCurrentVotingDateString()
    const now = new Date()

    // Check if snapshot already exists for this milestone today
    const { data: existingSnapshot } = await getServiceSupabase()
      .from("race_commentary_snapshots")
      .select("*")
      .eq("vote_date", today)
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
          emoji_standings: existingSnapshot.emoji_standings as EmojiStanding[],
          momentum_data:
            existingSnapshot.momentum_data as RaceSnapshot["momentum_data"],
          historical_context:
            existingSnapshot.historical_context as RaceSnapshot["historical_context"],
          commentary_text: existingSnapshot.commentary_text,
          chyron_text: existingSnapshot.chyron_text,
        } as RaceSnapshot,
      }
    }

    // Get current race state
    const raceContext = await buildRaceContext(today)

    // Get historical context
    const historicalContext = await buildHistoricalContext(today, milestone)

    // Build the snapshot
    const snapshot: RaceSnapshot = {
      vote_date: today,
      milestone,
      timestamp_utc: now.toISOString(),
      total_votes: raceContext.totalVotes,
      emoji_standings: raceContext.standings,
      momentum_data: raceContext.momentum,
      historical_context: historicalContext,
    }

    // Generate commentary and chyron
    const commentary = await generateCommentaryForMilestone(milestone, snapshot)
    const chyron = await generateChyronText(snapshot)

    snapshot.commentary_text = commentary
    snapshot.chyron_text = chyron

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
          chyron_text: snapshot.chyron_text,
        })
        .select()
        .single()

    if (insertError) {
      console.error("Error inserting snapshot:", insertError)
      return { success: false, error: insertError.message }
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
      if (emojiTimingMap.size > 0) {
        const timingDiff = b.timing_score - a.timing_score
        if (Math.abs(timingDiff) > 1) return timingDiff
      }
      return b.count - a.count
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
          messages: [{ role: "user", content: processedPrompt }],
          max_tokens: 100,
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
    // Fallback commentary
    const leader = snapshot.emoji_standings[0]
    const formattedDate = formatDateForCommentary(snapshot.vote_date)
    if (leader) {
      return `${leader.emoji} leads with ${leader.count} votes in the election for ${formattedDate}. Total turnout: ${snapshot.total_votes} votes.`
    }
    return `Voting continues for the emoji of ${formattedDate}. Cast your vote at emoji.today`
  }
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
          model: "anthropic/claude-3.5-haiku",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 80,
          temperature: 0.7,
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`)
    }

    const data = (await response.json()) as any
    let chyron = data.choices[0].message.content.trim()

    // Extract just the first line if AI returned multiple lines
    const lines = chyron
      .split("\n")
      .filter((line: string) => line.trim().length > 0)
    const firstLine = lines[0]?.trim() || chyron

    // Remove quotes if present
    chyron = firstLine.replace(/^["']|["']$/g, "")

    // Validate the chyron is complete and well-formed
    console.log(`📺 Generated chyron: "${chyron}" (${chyron.length} chars)`)

    if (chyron.length < 20 || !chyron.includes("•") || chyron.length > 65) {
      console.warn(
        "Generated chyron invalid:",
        chyron,
        `(${chyron.length} chars)`,
        "Reasons:",
        {
          tooShort: chyron.length < 20,
          missingBullet: !chyron.includes("•"),
          tooLong: chyron.length > 200,
        }
      )
      throw new Error("Invalid chyron generated")
    }

    return chyron.toUpperCase()
  } catch (error) {
    console.error("Error generating chyron:", error)
    // Fallback chyron - guaranteed complete and well-formed
    const leader = snapshot.emoji_standings[0]
    const second = snapshot.emoji_standings[1]
    const loser = snapshot.emoji_standings.find((s) => s.count === 1)

    if (loser && leader !== loser) {
      return `${loser.emoji} HANGING ON WITH 1 VOTE • LONE SUPPORTER!`
    } else if (leader && second && leader.count - second.count <= 3) {
      return `TIGHT RACE! ${leader.emoji} LEADS ${second.emoji} BY ${
        leader.count - second.count
      }!`
    } else if (leader) {
      return `${leader.emoji} DOMINATES WITH ${leader.count} VOTES • RUNNING AWAY!`
    }
    return DEFAULT_OPENING_CHYRON
  }
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
    const response = await fetch("https://api.neynar.com/v2/farcaster/cast", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.NEYNAR_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        signer_uuid: process.env.FARCASTER_SIGNER_UUID,
        text: text + "\n\nVote now at emoji.today 🗳️",
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`Neynar API error: ${response.status} - ${errorData}`)
    }

    const data = (await response.json()) as any
    const castHash = data.cast?.hash

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
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
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
    }

    // Generate chyron without saving to database
    const chyron = await generateChyronText(tempSnapshot)
    return chyron
  } catch (error) {
    console.error("Error generating fallback chyron:", error)
    return DEFAULT_OPENING_CHYRON
  }
}
