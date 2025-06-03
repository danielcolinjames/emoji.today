import { supabase } from "../lib/supabase"
import {
  getCurrentVotingDay,
  formatDateForDB,
  formatDateForDisplay,
} from "../lib/date-utils"

// Helper function to get current voting date as string
function getCurrentVotingDateString(): string {
  return formatDateForDB(getCurrentVotingDay())
}

interface VoteHistoryEntry {
  emoji: string
  timestamp: string
  fid: number
}

interface RankingSnapshot {
  timestamp: string
  rankings: Array<{
    emoji: string
    count: number
    position: number
  }>
  total_votes: number
}

interface MilestoneContext {
  current_leader: string
  current_count: number
  total_votes: number
  time_remaining_hours: number
  vote_history: VoteHistoryEntry[]
  ranking_snapshots: RankingSnapshot[]
  milestone_type: "time" | "votes" | "leadership_change" | "close_race"
  milestone_description: string
}

interface SocialPostMilestone {
  id: string
  type: "time" | "votes" | "leadership_change" | "close_race"
  condition: string
  triggered: boolean
  last_check: string
}

export class MilestoneSocialPoster {
  private neynar_api_key: string
  private twitter_bearer_token: string
  private farcaster_signer_uuid: string
  private openai_api_key: string

  constructor() {
    this.neynar_api_key = process.env.NEYNAR_API_KEY || ""
    this.twitter_bearer_token = process.env.TWITTER_BEARER_TOKEN || ""
    this.farcaster_signer_uuid = process.env.FARCASTER_SIGNER_UUID || ""
    this.openai_api_key = process.env.OPENAI_API_KEY || ""
  }

  async getVoteHistory(): Promise<VoteHistoryEntry[]> {
    const today = getCurrentVotingDateString()

    const { data, error } = await supabase
      .from("votes")
      .select("emoji, created_at, fid")
      .eq("vote_date", today)
      .order("created_at", { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch vote history: ${error.message}`)
    }

    return data.map((vote) => ({
      emoji: vote.emoji,
      timestamp: vote.created_at,
      fid: vote.fid,
    }))
  }

  generateRankingSnapshots(voteHistory: VoteHistoryEntry[]): RankingSnapshot[] {
    const snapshots: RankingSnapshot[] = []
    const emojiCounts: Record<string, number> = {}

    // Create snapshots at key vote count intervals: 5, 10, 25, 50, 100, etc.
    const snapshotIntervals = [5, 10, 25, 50, 100, 200, 500]
    let currentSnapshot = 0

    voteHistory.forEach((vote, index) => {
      emojiCounts[vote.emoji] = (emojiCounts[vote.emoji] || 0) + 1
      const totalVotes = index + 1

      if (
        snapshotIntervals[currentSnapshot] &&
        totalVotes >= snapshotIntervals[currentSnapshot]
      ) {
        const rankings = Object.entries(emojiCounts)
          .sort(([, a], [, b]) => b - a)
          .map(([emoji, count], position) => ({
            emoji,
            count,
            position: position + 1,
          }))

        snapshots.push({
          timestamp: vote.timestamp,
          rankings: rankings.slice(0, 5), // Top 5 only
          total_votes: totalVotes,
        })

        currentSnapshot++
      }
    })

    return snapshots
  }

  async getCurrentMilestoneContext(): Promise<MilestoneContext> {
    const voteHistory = await this.getVoteHistory()
    const rankingSnapshots = this.generateRankingSnapshots(voteHistory)

    // Calculate current state
    const emojiCounts = voteHistory.reduce((acc, vote) => {
      acc[vote.emoji] = (acc[vote.emoji] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const currentRankings = Object.entries(emojiCounts).sort(
      ([, a], [, b]) => b - a
    )

    const current_leader = currentRankings[0]?.[0] || "🤔"
    const current_count = currentRankings[0]?.[1] || 0
    const total_votes = voteHistory.length

    // Calculate time remaining
    const now = new Date()
    const nextMidnight = new Date(now)
    nextMidnight.setUTCDate(nextMidnight.getUTCDate() + 1)
    nextMidnight.setUTCHours(0, 0, 0, 0)
    const time_remaining_hours = Math.max(
      0,
      Math.ceil((nextMidnight.getTime() - now.getTime()) / (1000 * 60 * 60))
    )

    return {
      current_leader,
      current_count,
      total_votes,
      time_remaining_hours,
      vote_history: voteHistory,
      ranking_snapshots: rankingSnapshots,
      milestone_type: "votes", // Will be determined by trigger
      milestone_description: "", // Will be set by trigger
    }
  }

  async checkTimeMilestones(context: MilestoneContext): Promise<string | null> {
    const { time_remaining_hours } = context

    // Check for time milestones: 12h, 6h, 3h, 1h, 30min
    const timeMilestones = [12, 6, 3, 1]

    for (const milestone of timeMilestones) {
      if (
        time_remaining_hours <= milestone &&
        time_remaining_hours > milestone - 1
      ) {
        // Check if we've already posted for this milestone today
        const { data: existingPost } = await supabase
          .from("social_posts_log")
          .select("id")
          .eq("vote_date", getCurrentVotingDateString())
          .like("content", `%${milestone}h%`)
          .single()

        if (!existingPost) {
          return `time_${milestone}h`
        }
      }
    }

    return null
  }

  async checkLeadershipChange(
    context: MilestoneContext
  ): Promise<string | null> {
    const { ranking_snapshots, total_votes } = context

    if (ranking_snapshots.length < 2 || total_votes < 10) return null

    const latest = ranking_snapshots[ranking_snapshots.length - 1]
    const previous = ranking_snapshots[ranking_snapshots.length - 2]

    const latestLeader = latest.rankings[0]?.emoji
    const previousLeader = previous.rankings[0]?.emoji

    if (latestLeader !== previousLeader && total_votes >= 10) {
      // Check if we've already posted about this leadership change
      const { data: existingPost } = await supabase
        .from("social_posts_log")
        .select("id")
        .eq("vote_date", getCurrentVotingDateString())
        .like("content", `%${latestLeader}%takes%lead%`)
        .single()

      if (!existingPost) {
        return `leadership_change_${latestLeader}`
      }
    }

    return null
  }

  async checkCloseRace(context: MilestoneContext): Promise<string | null> {
    const { ranking_snapshots, total_votes } = context

    if (total_votes < 20) return null

    const latest = ranking_snapshots[ranking_snapshots.length - 1]
    if (latest.rankings.length < 2) return null

    const leader = latest.rankings[0]
    const secondPlace = latest.rankings[1]
    const gap = leader.count - secondPlace.count

    // Close race if gap is 3 votes or less and we have significant vote count
    if (gap <= 3 && gap > 0 && total_votes >= 20) {
      const { data: existingPost } = await supabase
        .from("social_posts_log")
        .select("id")
        .eq("vote_date", getCurrentVotingDateString())
        .like("content", "%close race%")
        .gte(
          "posted_at",
          new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        ) // Within last 2 hours
        .single()

      if (!existingPost) {
        return `close_race_${gap}votes`
      }
    }

    return null
  }

  async generateMilestonePost(
    context: MilestoneContext,
    milestoneType: string
  ): Promise<string> {
    // Create rich context for AI with historical data
    const historyContext = context.ranking_snapshots
      .map(
        (snapshot) =>
          `At ${snapshot.total_votes} votes: ${snapshot.rankings
            .slice(0, 3)
            .map((r) => `${r.emoji}(${r.count})`)
            .join(", ")}`
      )
      .join("\n")

    const prompt = `Generate an engaging social media post for emoji.today about a voting milestone.

Current Status:
- Leading emoji: ${context.current_leader} with ${context.current_count} votes
- Total votes: ${context.total_votes}
- Time remaining: ${context.time_remaining_hours} hours
- Milestone: ${milestoneType}

Historical Context:
${historyContext}

Style: Exciting, urgent, news-worthy. This is a significant moment in today's emoji democracy.
Length: 200-280 characters (Twitter-optimized)
Tone: Breaking news meets sports commentary

Generate ONE compelling post that captures this milestone moment.`

    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.openai_api_key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini", // Cost-effective: $0.15/1M input tokens
            messages: [
              {
                role: "system",
                content:
                  "You are a sports commentator for emoji voting. Create exciting, urgent posts about voting milestones.",
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            max_tokens: 100, // Keep output short and cost-effective
            temperature: 0.9, // High creativity for engaging content
          }),
        }
      )

      if (!response.ok) {
        throw new Error(
          `OpenAI API error: ${response.status} ${response.statusText}`
        )
      }

      const data = (await response.json()) as {
        choices: Array<{ message: { content: string } }>
      }
      return (
        data.choices[0]?.message?.content?.trim() ||
        this.getFallbackPost(context, milestoneType)
      )
    } catch (error) {
      console.error("Error generating milestone post:", error)
      return this.getFallbackPost(context, milestoneType)
    }
  }

  getFallbackPost(context: MilestoneContext, milestoneType: string): string {
    if (milestoneType.startsWith("time_")) {
      return `⏰ ${context.time_remaining_hours} hours left! ${context.current_leader} leads with ${context.current_count} votes. The race is heating up! 🔥`
    } else if (milestoneType.startsWith("leadership_change_")) {
      return `🚨 LEADERSHIP CHANGE! ${context.current_leader} takes the lead with ${context.current_count} votes! The plot thickens...`
    } else if (milestoneType.startsWith("close_race_")) {
      return `📊 NAIL-BITER ALERT! ${context.current_leader} leads by just ${
        context.ranking_snapshots[context.ranking_snapshots.length - 1]
          ?.rankings[0]?.count -
        context.ranking_snapshots[context.ranking_snapshots.length - 1]
          ?.rankings[1]?.count
      } votes! This is anyone's game!`
    }
    return `🗳️ ${context.total_votes} votes cast today! ${context.current_leader} leads the pack. What emoji will win the day?`
  }

  async generateShareUrl(context: MilestoneContext): Promise<string> {
    const { data: emojiData } = await supabase
      .from("emojis")
      .select("accent_color")
      .eq("emoji", context.current_leader)
      .single()

    const accentColor = emojiData?.accent_color || "#FFFFFF"
    const today = getCurrentVotingDateString()

    return `https://emoji.today/share?emoji=${encodeURIComponent(
      context.current_leader
    )}&date=${today}&accentColor=${encodeURIComponent(
      accentColor
    )}&milestone=true`
  }

  async postToFarcaster(text: string, shareUrl: string): Promise<void> {
    if (!this.neynar_api_key || !this.farcaster_signer_uuid) {
      console.log(`🟣 Farcaster posting skipped - credentials not configured`)
      return
    }

    try {
      const response = await fetch("https://api.neynar.com/v2/farcaster/cast", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.neynar_api_key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          signer_uuid: this.farcaster_signer_uuid,
          text: text,
          embeds: [{ url: shareUrl }],
        }),
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(
          `Farcaster API error: ${response.status} ${response.statusText} - ${errorData}`
        )
      }

      const result = (await response.json()) as { cast?: { hash: string } }
      console.log(
        `✅ Posted to Farcaster successfully - Cast hash: ${result.cast?.hash}`
      )
    } catch (error) {
      console.error(`❌ Failed to post to Farcaster:`, error)
      throw error
    }
  }

  async postToTwitter(text: string, shareUrl: string): Promise<void> {
    if (!this.twitter_bearer_token) {
      console.log(`📱 Twitter posting skipped - credentials not configured`)
      return
    }

    try {
      const tweetText = `${text}\n\n${shareUrl}`

      const response = await fetch("https://api.twitter.com/2/tweets", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.twitter_bearer_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: tweetText,
        }),
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(
          `Twitter API error: ${response.status} ${response.statusText} - ${errorData}`
        )
      }

      const result = (await response.json()) as { data?: { id: string } }
      console.log(
        `✅ Posted to Twitter successfully - Tweet ID: ${result.data?.id}`
      )
    } catch (error) {
      console.error(`❌ Failed to post to Twitter:`, error)
      throw error
    }
  }

  async checkAndPostMilestones(): Promise<void> {
    try {
      console.log("🎯 Checking for social media milestones...")

      const context = await this.getCurrentMilestoneContext()

      // Check all milestone types
      const milestoneChecks = [
        this.checkTimeMilestones(context),
        this.checkLeadershipChange(context),
        this.checkCloseRace(context),
      ]

      const triggeredMilestone = await Promise.all(milestoneChecks).then(
        (results) => results.find((result) => result !== null)
      )

      if (!triggeredMilestone) {
        console.log("📋 No milestones triggered at this time")
        return
      }

      console.log(`🎯 Milestone triggered: ${triggeredMilestone}`)

      const postText = await this.generateMilestonePost(
        context,
        triggeredMilestone
      )
      const shareUrl = await this.generateShareUrl(context)

      console.log(`📝 Generated milestone post: "${postText}"`)
      console.log(`🔗 Share URL: ${shareUrl}`)

      // Post to both platforms
      const promises = [
        this.postToFarcaster(postText, shareUrl),
        this.postToTwitter(postText, shareUrl),
      ]

      await Promise.allSettled(promises)

      // Log the milestone post
      await this.logMilestonePost({
        platform: "both",
        content: postText,
        share_url: shareUrl,
        milestone_type: triggeredMilestone,
        context: context,
        posted_at: new Date().toISOString(),
      })

      console.log("✅ Milestone social media post completed")
    } catch (error) {
      console.error("❌ Milestone social media posting failed:", error)
      throw error
    }
  }

  async logMilestonePost(postData: {
    platform: string
    content: string
    share_url: string
    milestone_type: string
    context: MilestoneContext
    posted_at: string
  }): Promise<void> {
    try {
      const { error } = await supabase.from("social_posts_log").insert({
        platform: postData.platform,
        content: postData.content,
        share_url: postData.share_url,
        post_context: {
          ...postData.context,
          milestone_type: postData.milestone_type,
        },
        posted_at: postData.posted_at,
        vote_date: getCurrentVotingDateString(),
      })

      if (error) {
        console.error("Failed to log milestone post:", error)
      }
    } catch (error) {
      console.error("Error logging milestone post:", error)
    }
  }
}
