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
import { buildSimpleRankings } from "./simple-ranking"

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
  opening: `You're covering today's emoji election. The day has just begun and the first votes are coming in!

Current standings: {emoji_standings}
Yesterday's winner: {yesterday_winner} ({yesterday_count} votes)

Write an energetic, creative opening announcement about the race. Mix political drama with playful observation. Be inventive with your metaphors and framing. Keep it under 140 chars.

CRITICAL: Only use emojis shown in the standings above.`,

  "1hour": `Early returns are coming in for today's emoji election.

Current standings: {emoji_standings}
Vote velocity: {vote_velocity} votes/hour

Analyze the early trends with fresh perspective. What story is emerging? Find a unique angle - could be cultural, temporal, emotional. Keep it witty and under 140 chars.

CRITICAL: Only use emojis shown in the standings above.`,

  halfway: `We're at the midpoint of today's emoji election.

Current standings: {emoji_standings}
Total votes: {total_votes}

Share a creative midday observation. Could be about momentum shifts, voter psychology, or cultural significance. Be imaginative but concise. Under 140 chars.

CRITICAL: Only use emojis shown in the standings above.`,

  "6hours_left": `Six hours remain in today's emoji vote.

Current leader: {emoji_standings}

Share an interesting insight, fun fact, or witty observation about why this emoji might be resonating today. Keep it light and engaging. Under 120 chars.

CRITICAL: Only use emojis shown in the standings above.`,

  "3hours_left": `Three hours left in today's emoji election.

Current standings: {emoji_standings}  

Make a brief, entertaining observation. Could be about the leader, a surprise underdog, or voting patterns. Be creative and conversational. Under 100 chars.

CRITICAL: Only use emojis shown in the standings above.`,

  final_hour: `The final hour of today's emoji election!

Current standings: {emoji_standings}
Time remaining: {time_remaining}

Create urgency with creative flair. What's at stake? Who might pull ahead? Keep the energy high and unique. Under 140 chars.

CRITICAL: Only use emojis shown in the standings above.`,

  final_minutes: `Minutes remain in today's emoji election!

Current standings: {emoji_standings}

Write a thrilling final stretch announcement. Make it dramatic but fresh - avoid clichés. What makes this moment special? Under 140 chars.

CRITICAL: Only use emojis shown in the standings above.`,

  daily_summary: `Today's emoji election has concluded!

Final results: {emoji_standings}
Winner: {winner_emoji} ({winner_count} votes)
Total turnout: {total_votes}

Announce the winner with creative ceremony. What does this victory mean? How did they win? Make it memorable and fun. Under 140 chars.

CRITICAL: Only use emojis shown in the standings above.`,
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

  // Use the same ranking logic as VotingResults
  const simpleRankings = buildSimpleRankings(
    voteCounts,
    totalVotes,
    voteTimingData || [],
    10 // Top 10 for race context
  )

  // Convert to EmojiStanding format
  const standings: EmojiStanding[] = simpleRankings.map((ranking) => ({
    emoji: ranking.emoji,
    count: ranking.count,
    percentage: ranking.percentage,
    rank: ranking.rank,
    timing_score: 0, // Not used with simple rankings
    name: undefined,
  }))

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

export async function generateModularCommentary(
  milestone: string,
  snapshot: RaceSnapshot
): Promise<string> {
  const formattedDate = formatDateForCommentary(snapshot.vote_date)
  const validEmojis = snapshot.emoji_standings.map((s) => s.emoji)
  const leader = snapshot.emoji_standings[0]
  const second = snapshot.emoji_standings[1]
  const third = snapshot.emoji_standings[2]
  const totalVotes = snapshot.total_votes

  // If no votes yet, use simple fallback
  if (totalVotes === 0) {
    switch (milestone) {
      case "opening":
        return `Polls are open for ${formattedDate}! Be the first to cast your vote and set the tone for today.`
      case "1hour":
        return `One hour in and the emoji election awaits its first voter. Will you be the one to break the silence?`
      default:
        return `Voting continues for the emoji of ${formattedDate}. Cast your vote at emoji.today`
    }
  }

  try {
    let prompt = ""

    switch (milestone) {
      case "opening":
        prompt = `Write a creative announcement for the opening of emoji voting on ${formattedDate}. 
        ${totalVotes} early voters have cast ballots. ${
          leader.emoji
        } leads with ${leader.count} votes.
        Make it energetic and playful. About 100-140 chars. Use only these emojis: ${validEmojis
          .slice(0, 5)
          .join(", ")}`
        break

      case "1hour":
        prompt = `Write about early returns in the emoji election. ${
          leader.emoji
        } has ${leader.count} votes, ${second?.emoji || "❓"} has ${
          second?.count || 0
        }.
        Total turnout: ${totalVotes}. Make a witty observation about early voting patterns. 100-140 chars.`
        break

      case "halfway":
        prompt = `It's midday in the emoji race. ${leader.emoji} leads with ${leader.count} votes (${leader.percentage}%).
        Total votes: ${totalVotes}. Write something creative about the halfway point dynamics. 100-140 chars.`
        break

      case "6hours_left":
        prompt = `Six hours left! ${leader.emoji} is winning. Write a fun fact or cultural observation about why ${leader.emoji} might be resonating today.
        Keep it light and entertaining. About 80-120 chars.`
        break

      case "3hours_left":
        prompt = `Three hours remain. Current leader: ${leader.emoji} with ${
          leader.count
        } votes.
        Write a brief, witty evening update. Maybe mention ${
          second?.emoji || "others"
        } trying to catch up. Under 100 chars.`
        break

      case "final_hour":
        const timeRemaining = getRemainingTimeToMidnightUTC()
        prompt = `Final hour! ${leader.emoji} leads but ${
          second?.emoji || "challengers"
        } could still surge.
        ${timeRemaining.hours}h ${
          timeRemaining.minutes
        }m left. Create urgency without being cliché. 100-140 chars.`
        break

      case "final_minutes":
        prompt = `Minutes left in today's emoji election! ${leader.emoji} vs ${
          second?.emoji || "the field"
        }.
        ${
          leader.count === second?.count
            ? "TIED!"
            : `${leader.emoji} ahead by ${leader.count - (second?.count || 0)}`
        }
        Write dramatic final moments commentary. 100-140 chars.`
        break

      case "daily_summary":
        prompt = `${leader.emoji} wins ${formattedDate} with ${
          leader.count
        } votes! Total turnout: ${totalVotes}.
        ${second?.emoji || "No one"} came second with ${
          second?.count || 0
        } votes.
        Write a celebratory winner announcement. Make it memorable. 100-140 chars.`
        break

      default:
        prompt = `Write about the emoji election on ${formattedDate}. ${leader.emoji} leads with ${leader.count} votes.
        Be creative and witty. About 100-140 chars.`
    }

    // Add system context
    const fullPrompt = `${prompt}
    
    Important: Be creative and unique. Avoid formulaic phrases. No hashtags. No country-specific references.`

    const generated = await generateSinglePart(fullPrompt)

    if (generated) {
      return generated
    }

    // Fallback if generation fails
    console.warn("Generation failed, using fallback")
  } catch (error) {
    console.error("Error in modular generation:", error)
  }

  // Simple fallback
  return `${leader.emoji} leads with ${leader.count} votes in the election for ${formattedDate}. Total turnout: ${totalVotes} votes.`
}

async function generateSinglePart(prompt: string): Promise<string> {
  try {
    console.log(
      `🧩 Generating part with prompt: ${prompt.substring(0, 100)}...`
    )

    // Try different models in order of preference
    const models = [
      "openai/gpt-3.5-turbo",
      "anthropic/claude-3-haiku",
      "google/gemini-flash-1.5",
      process.env.OPENROUTER_COMMENTARY_MODEL || "x-ai/grok-3-mini-beta",
    ]

    for (const model of models) {
      try {
        console.log(`🤖 Trying model: ${model}`)

        const response = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
              "Content-Type": "application/json",
              "X-Title": "emoji.today commentary part",
            },
            body: JSON.stringify({
              model,
              messages: [
                {
                  role: "system",
                  content:
                    "You are a witty election commentator. Respond with ONLY the requested sentence. No quotes, no explanation.",
                },
                { role: "user", content: prompt },
              ],
              max_tokens: 100,
              temperature: 0.9,
            }),
          }
        )

        if (!response.ok) {
          console.error(`❌ Model ${model} error: ${response.status}`)
          continue // Try next model
        }

        const json = (await response.json()) as any
        const content = json.choices?.[0]?.message?.content?.trim() || ""

        if (content) {
          console.log(`✅ Got response from ${model}: "${content}"`)

          // Basic cleanup
          const cleaned = content
            .replace(/^["']|["']$/g, "") // Remove quotes
            .replace(/#\w+/g, "") // Remove hashtags
            .trim()

          console.log(`✨ Cleaned part: "${cleaned}"`)
          return cleaned
        } else {
          console.warn(`⚠️ Model ${model} returned empty content`)
        }
      } catch (error) {
        console.error(`❌ Model ${model} failed:`, error)
      }
    }

    console.error("❌ All models failed to generate content")
    return ""
  } catch (error) {
    console.error("Error generating part:", error)
    return ""
  }
}

async function generateCommentaryForMilestone(
  milestone: string,
  snapshot: RaceSnapshot
): Promise<string> {
  // Use modular generation for all milestones now
  return generateModularCommentary(milestone, snapshot)
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

  // Get timing data for proper ranking (even for daily summary)
  const { data: voteTimingData } = await supabase
    .from("votes")
    .select("emoji, created_at")
    .eq("vote_date", dateString)

  // Use the same ranking logic as VotingResults
  const simpleRankings = buildSimpleRankings(
    voteCounts,
    totalVotes,
    voteTimingData || [],
    10 // Top 10 for consistency
  )

  // Convert to EmojiStanding format
  const standings: EmojiStanding[] = simpleRankings.map((ranking) => ({
    emoji: ranking.emoji,
    count: ranking.count,
    percentage: ranking.percentage,
    rank: ranking.rank,
    timing_score: 0, // Not used with simple rankings
    name: undefined,
  }))

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
