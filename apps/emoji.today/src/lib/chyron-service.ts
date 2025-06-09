import { supabase } from "@/lib/supabase"
import { getCurrentVotingDateString } from "@/lib/date-utils"
import { getDefaultOpeningChyron } from "@/lib/constants"
import { supabaseService } from "@/lib/supabase-service"
import { buildSimpleRankings } from "@/lib/simple-ranking"

interface EmojiStanding {
  emoji: string
  count: number
  percentage: number
  rank: number
  name?: string
  recentVotes: number // votes in last hour
  momentum: "surging" | "steady" | "declining"
}

interface ChyronContext {
  currentStandings: EmojiStanding[]
  totalVotes: number
  voteVelocity: number // votes per hour
  timeRemaining: string
  recentWinners: Array<{ date: string; emoji: string; count: number }>
  lastChyronUpdate: string | null
  significantChanges: {
    leadershipChange: boolean
    majorMomentumShift: boolean
    milestoneReached: boolean
  }
  previousLeader?: string // Add this to track leadership changes
}

export class ChyronService {
  private static instance: ChyronService
  private lastUpdateHash: string | null = null
  private previousLeader: string | null = null // Add this to store previous leader
  private lastStandingsHash: string | null = null // Track vote data changes

  static getInstance(): ChyronService {
    if (!ChyronService.instance) {
      ChyronService.instance = new ChyronService()
    }
    return ChyronService.instance
  }

  /**
   * Creates a hash of the current standings to detect vote data changes
   */
  private createStandingsHash(standings: EmojiStanding[]): string {
    // Create a simple hash of the top 5 standings (emoji + count + rank)
    const hashData = standings
      .slice(0, 5)
      .map((s) => `${s.emoji}:${s.count}:${s.rank}`)
      .join("|")
    // Simple hash function (could use crypto.createHash in production)
    let hash = 0
    for (let i = 0; i < hashData.length; i++) {
      const char = hashData.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString()
  }

  /**
   * Determines if chyron should be updated based on significance of changes
   */
  async shouldUpdateChyron(context: ChyronContext): Promise<boolean> {
    // Check if vote data has actually changed
    const currentHash = this.createStandingsHash(context.currentStandings)
    if (this.lastStandingsHash === currentHash) {
      console.log("Vote data unchanged since last update, skipping")
      return false
    }

    // Always update if no chyron exists yet
    if (!context.lastChyronUpdate) {
      console.log("No existing chyron found, triggering update")
      this.lastStandingsHash = currentHash
      return true
    }

    // Check time since last update (minimum 15 minutes between AI generations)
    const lastUpdate = new Date(context.lastChyronUpdate)
    const now = new Date()
    const minutesSinceUpdate =
      (now.getTime() - lastUpdate.getTime()) / (1000 * 60)

    console.log(
      `Minutes since last chyron update: ${minutesSinceUpdate.toFixed(1)}`
    )

    // Allow immediate updates for leadership changes, otherwise wait 2 minutes
    if (
      minutesSinceUpdate < 2 &&
      !context.significantChanges.leadershipChange
    ) {
      console.log("Too soon since last update, skipping")
      return false
    }

    // Update on significant changes
    if (context.significantChanges.leadershipChange) {
      console.log("Leadership change detected, triggering immediate update")
      this.lastStandingsHash = currentHash
      return true
    }
    if (context.significantChanges.majorMomentumShift) {
      console.log("Major momentum shift detected, triggering update")
      this.lastStandingsHash = currentHash
      return true
    }
    if (context.significantChanges.milestoneReached) {
      console.log("Milestone reached, triggering update")
      this.lastStandingsHash = currentHash
      return true
    }

    // Update every hour during active voting (more than 5 votes in last hour)
    if (context.voteVelocity > 5 && minutesSinceUpdate >= 60) {
      console.log("Active voting detected, triggering hourly update")
      this.lastStandingsHash = currentHash
      return true
    }

    // Force update after 4 hours regardless
    if (minutesSinceUpdate >= 240) {
      console.log("4+ hours elapsed, forcing update")
      this.lastStandingsHash = currentHash
      return true
    }

    // Force update if no chyron was updated in last hour and we have momentum
    if (
      minutesSinceUpdate >= 60 &&
      context.significantChanges.majorMomentumShift
    ) {
      console.log("Momentum shift + 1 hour elapsed, triggering update")
      this.lastStandingsHash = currentHash
      return true
    }

    console.log("No significant changes detected, skipping update")
    return false
  }

  /**
   * Builds comprehensive context for chyron generation
   */
  async buildChyronContext(): Promise<ChyronContext> {
    const today = getCurrentVotingDateString()
    console.log(`Building chyron context for date: ${today}`)

    // Get current live results
    const { data: liveResult } = await supabase
      .from("live_results")
      .select("emoji_counts, total_votes")
      .eq("vote_date", today)
      .single()

    console.log("Live result:", liveResult)

    if (!liveResult?.emoji_counts) {
      throw new Error("No live results found")
    }

    const voteCounts = liveResult.emoji_counts as { [key: string]: number }
    const totalVotes = liveResult.total_votes

    // Fetch all votes for today for timing-based ranking
    const { data: voteTimingData } = await supabase
      .from("votes")
      .select("emoji, created_at")
      .eq("vote_date", today)

    // Get recent votes for momentum analysis (last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const { data: recentVotes } = await supabase
      .from("votes")
      .select("emoji, created_at")
      .eq("vote_date", today)
      .gte("created_at", oneHourAgo.toISOString())

    // Calculate recent vote counts and momentum
    const recentVoteCounts: { [key: string]: number } = {}
    recentVotes?.forEach((vote) => {
      recentVoteCounts[vote.emoji] = (recentVoteCounts[vote.emoji] || 0) + 1
    })

    // Get emoji names for top emojis
    const topEmojis = Object.entries(voteCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([emoji]) => emoji)

    const { data: emojiNames } = await supabase
      .from("emojis")
      .select("emoji, name")
      .in("emoji", topEmojis)

    const emojiNameMap = new Map(
      emojiNames?.map((e) => [e.emoji, e.name]) || []
    )

    // Build standings with simple ranking (vote count + latest vote tiebreaker)
    const simpleRankings = buildSimpleRankings(
      voteCounts,
      totalVotes,
      voteTimingData ?? [],
      10
    )

    const standings: EmojiStanding[] = simpleRankings.map((s) => {
      const recentCount = recentVoteCounts[s.emoji] || 0
      const recentPercentage = s.count > 0 ? (recentCount / s.count) * 100 : 0
      let momentum: "surging" | "steady" | "declining"
      if (recentPercentage > 25) momentum = "surging"
      else if (recentPercentage > 10) momentum = "steady"
      else momentum = "declining"
      return {
        emoji: s.emoji,
        count: s.count,
        percentage: s.percentage,
        rank: s.rank,
        name: emojiNameMap.get(s.emoji),
        recentVotes: recentCount,
        momentum,
      }
    })

    console.log(
      "[Chyron] timing-rank order",
      standings.map((s) => `${s.rank}.${s.emoji}(${s.count})`).join("  ")
    )

    // Get recent winners for historical context
    const { data: recentWinners } = await supabase
      .from("daily_summaries")
      .select("vote_date, winning_emoji, winning_count")
      .order("vote_date", { ascending: false })
      .limit(7)

    // Get last chyron update time and extract previous leader
    const { data: lastChyron } = await supabase
      .from("chyrons")
      .select("updated_at, text")
      .eq("vote_date", today)
      .order("updated_at", { ascending: false })
      .limit(1)
      .single()

    // Extract previous leader from the last hour's votes to detect changes
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
    const { data: olderVotes } = await supabase
      .from("votes")
      .select("emoji, created_at")
      .eq("vote_date", today)
      .lte("created_at", twoHoursAgo.toISOString())

    let previousLeader: string | null = null
    if (olderVotes && olderVotes.length > 0) {
      // Build old standings to see who was leading 2 hours ago
      const oldVoteCounts: { [key: string]: number } = {}
      olderVotes.forEach((vote) => {
        oldVoteCounts[vote.emoji] = (oldVoteCounts[vote.emoji] || 0) + 1
      })

      const oldRankings = buildSimpleRankings(
        oldVoteCounts,
        olderVotes.length,
        olderVotes,
        1
      )

      previousLeader = oldRankings[0]?.emoji || null
    }

    // Current leader
    const currentLeader = standings[0]?.emoji

    // Detect leadership change
    const leadershipChange =
      previousLeader && currentLeader && previousLeader !== currentLeader

    console.log(
      `[Chyron] Leadership check: previous=${previousLeader} current=${currentLeader} changed=${leadershipChange}`
    )

    // Calculate vote velocity (votes per hour)
    const dayStart = new Date(today + "T00:00:00.000Z")
    const hoursElapsed = (Date.now() - dayStart.getTime()) / (1000 * 60 * 60)
    const voteVelocity = hoursElapsed > 0 ? totalVotes / hoursElapsed : 0

    // Calculate time remaining
    const dayEnd = new Date(today + "T23:59:59.999Z")
    const timeRemaining = this.formatTimeRemaining(
      dayEnd.getTime() - Date.now()
    )

    // Detect significant changes with proper leadership detection
    const significantChanges = {
      leadershipChange: Boolean(leadershipChange),
      majorMomentumShift: standings.some((s) => s.momentum === "surging"),
      milestoneReached: this.checkMilestones(totalVotes),
    }

    return {
      currentStandings: standings,
      totalVotes,
      voteVelocity,
      timeRemaining,
      recentWinners:
        recentWinners?.map((w) => ({
          date: w.vote_date,
          emoji: w.winning_emoji,
          count: w.winning_count,
        })) || [],
      lastChyronUpdate: lastChyron?.updated_at || null,
      significantChanges,
      previousLeader: standings[0]?.emoji,
    }
  }

  /**
   * Generates AI-powered chyron with full context
   */
  async generateContextualChyron(context: ChyronContext): Promise<string> {
    const leader = context.currentStandings[0]
    const second = context.currentStandings[1]
    const third = context.currentStandings[2]

    // Build rich context for AI
    const prompt = `You are creating a dramatic news ticker for a live emoji election. Write ONE compelling ticker line (45-65 characters) in ALL CAPS.

CURRENT STANDINGS:
${context.currentStandings
  .slice(0, 5)
  .map(
    (s) =>
      `${s.rank}. ${s.emoji} (${s.name || "unknown"}): ${s.count} votes (${
        s.percentage
      }%) - ${s.momentum.toUpperCase()}`
  )
  .join("\n")}

MOMENTUM DATA:
- Total votes: ${context.totalVotes}
- Vote velocity: ${context.voteVelocity.toFixed(1)} votes/hour  
- Time remaining: ${context.timeRemaining}
- Recent surging emojis: ${
      context.currentStandings
        .filter((s) => s.momentum === "surging")
        .map((s) => s.emoji)
        .join(", ") || "none"
    }

HISTORICAL CONTEXT:
- Yesterday's winner: ${context.recentWinners[0]?.emoji || "unknown"} (${
      context.recentWinners[0]?.count || 0
    } votes)
- Last week's pattern: ${context.recentWinners
      .slice(0, 7)
      .map((w) => w.emoji)
      .join(" → ")}

Create a dramatic, sports-commentary style ticker that:
- Uses the actual emoji characters (${leader?.emoji}, ${second?.emoji}, etc.)
- Captures the current race dynamics and momentum
- Feels urgent and engaging like live sports
- Focuses on narrative tension and what might happen next

Examples of style:
"🔥 DOMINATES BUT 💤 SURGES • SLEEP REVOLUTION BREWING?"
"⚡ LEADS BY THREAD • 🌊 BUILDING TSUNAMI • PHOTO FINISH"
"💯 PERFECTION REIGNS • 12 HOURS LEFT • WHO DARES CHALLENGE?"

Return ONLY the ticker line, nothing else.`

    try {
      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "X-Title": "emoji.today contextual chyron",
          },
          body: JSON.stringify({
            model: "anthropic/claude-3.5-haiku",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 80,
            temperature: 0.7, // Default web UI temperature
          }),
        }
      )

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`)
      }

      const data = (await response.json()) as any
      let chyron = data.choices[0].message.content.trim()

      // Clean up response
      chyron = chyron.replace(/^["']|["']$/g, "") // Remove quotes
      chyron = chyron.split("\n")[0] // Take first line only
      chyron = chyron.toUpperCase() // Ensure ALL CAPS

      // Validate length (be more lenient)
      if (chyron.length < 15 || chyron.length > 120) {
        console.warn(
          `Generated chyron length ${chyron.length} outside ideal range: "${chyron}"`
        )
        // Don't throw error, just use it anyway unless extremely bad
        if (chyron.length < 5 || chyron.length > 200) {
          throw new Error("Chyron length extremely invalid")
        }
      }

      return chyron
    } catch (error) {
      console.error("Error generating contextual chyron:", error)

      // Intelligent fallbacks based on context
      return this.generateFallbackChyron(context)
    }
  }

  /**
   * Generates smart fallback chyrons based on race dynamics
   */
  private generateFallbackChyron(context: ChyronContext): string {
    const leader = context.currentStandings[0]
    const second = context.currentStandings[1]

    if (!leader) {
      return getDefaultOpeningChyron().toUpperCase()
    }

    if (!second) {
      return `${leader.emoji} COMMANDS THE FIELD • ${leader.count} VOTE${
        leader.count === 1 ? "" : "S"
      } AND RISING`
    }

    const gap = leader.count - second.count
    const leaderMomentum = leader.momentum.toUpperCase()
    const secondMomentum = second.momentum.toUpperCase()

    // Dynamic fallbacks based on race state
    if (gap === 0) {
      return `${leader.emoji}${second.emoji} DEADLOCKED • ${context.totalVotes} VOTES • EDGE OF SEAT THRILLER`
    } else if (gap === 1) {
      return `${leader.emoji} BY ONE • ${second.emoji} BREATHING DOWN NECK • ${context.timeRemaining} LEFT`
    } else if (gap <= 3) {
      return `${leader.emoji} NARROW LEAD • ${second.emoji} ${secondMomentum} • ANYONE'S GAME`
    } else if (second.momentum === "surging") {
      return `${leader.emoji} LEADS BUT ${second.emoji} SURGING • MOMENTUM SHIFT INCOMING?`
    } else {
      return `${leader.emoji} PULLS AWAY • ${gap} VOTE CUSHION • ${context.timeRemaining} REMAINING`
    }
  }

  /**
   * Updates chyron in database with proper context tracking
   */
  async updateChyron(): Promise<{
    success: boolean
    chyron?: string
    reason?: string
  }> {
    try {
      const context = await this.buildChyronContext()

      if (!(await this.shouldUpdateChyron(context))) {
        return {
          success: true,
          reason: "No significant changes detected, skipping update",
        }
      }

      const chyron = await this.generateContextualChyron(context)

      // Update in database with proper error handling
      const today = getCurrentVotingDateString()
      console.log(`Attempting to save chyron for ${today}: "${chyron}"`)

      // Use service-role client for writes (RLS bypass)
      const serviceSupabase = supabaseService()

      const { data: existingChyron, error: selectError } = await serviceSupabase
        .from("chyrons")
        .select("id")
        .eq("vote_date", today)
        .single()

      if (selectError && selectError.code !== "PGRST116") {
        throw new Error(
          `Error checking for existing chyron: ${selectError.message}`
        )
      }

      if (existingChyron) {
        const { error: updateError } = await serviceSupabase
          .from("chyrons")
          .update({
            text: chyron,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingChyron.id)

        if (updateError) {
          throw new Error(`Error updating chyron: ${updateError.message}`)
        }
        console.log(`Updated existing chyron with ID: ${existingChyron.id}`)
      } else {
        const { data: insertedChyron, error: insertError } =
          await serviceSupabase
            .from("chyrons")
            .insert({ text: chyron, vote_date: today })
            .select()
            .single()

        if (insertError) {
          throw new Error(`Error inserting chyron: ${insertError.message}`)
        }
        console.log(`Inserted new chyron with ID: ${insertedChyron?.id}`)
      }

      return { success: true, chyron }
    } catch (error) {
      console.error("Error updating chyron:", error)
      return {
        success: false,
        reason: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  private formatTimeRemaining(ms: number): string {
    const hours = Math.floor(ms / (1000 * 60 * 60))
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}H ${minutes}M`
  }

  private checkMilestones(totalVotes: number): boolean {
    // Check if we've hit voting milestones worth noting
    return [100, 250, 500, 1000, 2500, 5000].includes(totalVotes)
  }
}
