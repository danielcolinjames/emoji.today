import { supabase } from "../lib/supabase"
import { getCurrentVotingDay, formatDateForDisplay } from "../lib/date-utils"

interface SocialPostContext {
  leading_emoji: string
  leading_count: number
  total_votes: number
  time_remaining_hours: number
  hour_of_day: number // 0-23
  is_final_push: boolean // Last 3 hours
}

interface PostTemplate {
  text: string
  weight: number // For random selection
  time_sensitive?: "morning" | "afternoon" | "evening" | "final"
}

export class SocialPoster {
  private neynar_api_key: string
  private twitter_bearer_token: string
  private farcaster_signer_uuid: string

  constructor() {
    this.neynar_api_key = process.env.NEYNAR_API_KEY || ""
    this.twitter_bearer_token = process.env.TWITTER_BEARER_TOKEN || ""
    this.farcaster_signer_uuid = process.env.FARCASTER_SIGNER_UUID || ""
  }

  async getSocialPostContext(): Promise<SocialPostContext> {
    const today = getCurrentVotingDay()

    // Get current voting results
    const { data: results, error } = await supabase
      .from("votes")
      .select("emoji")
      .eq("vote_date", today)

    if (error) {
      throw new Error(`Failed to fetch voting context: ${error.message}`)
    }

    // Count emoji votes
    const emojiCounts = results.reduce((acc, vote) => {
      acc[vote.emoji] = (acc[vote.emoji] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Sort by count
    const sorted = Object.entries(emojiCounts).sort(([, a], [, b]) => b - a)

    const total_votes = results.length
    const leading_emoji = sorted[0]?.[0] || "🤔"
    const leading_count = sorted[0]?.[1] || 0

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
      leading_emoji,
      leading_count,
      total_votes,
      time_remaining_hours,
      hour_of_day: now.getUTCHours(),
      is_final_push: time_remaining_hours <= 3,
    }
  }

  generatePostTemplates(context: SocialPostContext): PostTemplate[] {
    const templates: PostTemplate[] = [
      // General updates
      {
        text: `${context.leading_emoji} is leading with ${context.leading_count} votes! ${context.time_remaining_hours} hours left to vote. What emoji represents today?`,
        weight: 3,
      },
      {
        text: `📊 Current status: ${context.total_votes} votes cast, ${context.leading_emoji} in the lead. ${context.time_remaining_hours}h remaining to make your mark on history.`,
        weight: 2,
      },
      {
        text: `The people have spoken... ${context.leading_emoji} is winning today's emoji vote. But there's still ${context.time_remaining_hours} hours left. Could there be a surprise?`,
        weight: 2,
      },

      // Time-sensitive posts
      {
        text: `🌅 Good morning! ${context.leading_emoji} is currently leading today's emoji vote. Fresh day, fresh votes needed!`,
        weight: 4,
        time_sensitive: "morning",
      },
      {
        text: `☀️ Midday update: ${context.total_votes} votes so far, ${context.leading_emoji} leading. The afternoon crowd might shake things up...`,
        weight: 3,
        time_sensitive: "afternoon",
      },
      {
        text: `🌆 Evening check-in: ${context.leading_emoji} still holding strong with ${context.leading_count} votes. Prime time for last-minute surprises!`,
        weight: 3,
        time_sensitive: "evening",
      },

      // Final push posts
      {
        text: `🚨 FINAL PUSH! Only ${context.time_remaining_hours} hours left! ${context.leading_emoji} is leading but anything can happen. Cast your vote NOW!`,
        weight: 5,
        time_sensitive: "final",
      },
      {
        text: `⏰ Time is running out! ${context.leading_emoji} vs the field. ${context.time_remaining_hours} hours to make history. Who will win today?`,
        weight: 4,
        time_sensitive: "final",
      },
    ]

    // Filter by time sensitivity
    const timeOfDay = this.getTimeOfDay(context.hour_of_day)

    return templates.filter((template) => {
      if (context.is_final_push && template.time_sensitive === "final")
        return true
      if (!context.is_final_push && template.time_sensitive === "final")
        return false
      if (template.time_sensitive && template.time_sensitive !== timeOfDay)
        return false
      return true
    })
  }

  getTimeOfDay(hour: number): "morning" | "afternoon" | "evening" {
    if (hour >= 5 && hour < 12) return "morning"
    if (hour >= 12 && hour < 18) return "afternoon"
    return "evening"
  }

  selectPostTemplate(templates: PostTemplate[]): string {
    const totalWeight = templates.reduce((sum, t) => sum + t.weight, 0)
    let random = Math.random() * totalWeight

    for (const template of templates) {
      random -= template.weight
      if (random <= 0) {
        return template.text
      }
    }

    return templates[0]?.text || "Vote for today's emoji at emoji.today!"
  }

  async generateShareUrl(context: SocialPostContext): Promise<string> {
    // Get emoji accent color for share card
    const { data: emojiData } = await supabase
      .from("emojis")
      .select("accent_color")
      .eq("emoji", context.leading_emoji)
      .single()

    const accentColor = emojiData?.accent_color || "#FFFFFF"
    const today = getCurrentVotingDay()

    return `https://emoji.today/share?emoji=${encodeURIComponent(
      context.leading_emoji
    )}&date=${today}&accentColor=${encodeURIComponent(accentColor)}&hourly=true`
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

  async postHourlyUpdate(): Promise<void> {
    try {
      console.log("🚀 Starting hourly social media update...")

      const context = await this.getSocialPostContext()
      const templates = this.generatePostTemplates(context)
      const postText = this.selectPostTemplate(templates)
      const shareUrl = await this.generateShareUrl(context)

      console.log(`📝 Generated post: "${postText}"`)
      console.log(`🔗 Share URL: ${shareUrl}`)

      // Post to both platforms
      const promises = [
        this.postToFarcaster(postText, shareUrl),
        this.postToTwitter(postText, shareUrl),
      ]

      await Promise.allSettled(promises)

      // Log the post to database for tracking
      await this.logSocialPost({
        platform: "both",
        content: postText,
        share_url: shareUrl,
        context: context,
        posted_at: new Date().toISOString(),
      })

      console.log("✅ Hourly social media update complete")
    } catch (error) {
      console.error("❌ Hourly social media update failed:", error)
      throw error
    }
  }

  async logSocialPost(postData: {
    platform: string
    content: string
    share_url: string
    context: SocialPostContext
    posted_at: string
  }): Promise<void> {
    try {
      const { error } = await supabase.from("social_posts_log").insert({
        platform: postData.platform,
        content: postData.content,
        share_url: postData.share_url,
        post_context: postData.context,
        posted_at: postData.posted_at,
        vote_date: getCurrentVotingDay(),
      })

      if (error) {
        console.error("Failed to log social post:", error)
        // Don't throw - logging failure shouldn't break posting
      }
    } catch (error) {
      console.error("Error logging social post:", error)
    }
  }
}
