import { supabase } from "../lib/supabase"
import { getCurrentVotingDay } from "../lib/date-utils"

interface TickerContent {
  id: string
  content: string
  priority: number
  created_at: string
  expires_at: string
  context: {
    leading_emoji?: string
    vote_count?: number
    time_remaining?: string
    trending_change?: string
  }
}

interface VotingContext {
  leading_emoji: string
  leading_count: number
  total_votes: number
  time_remaining_hours: number
  recent_changes: Array<{
    emoji: string
    change: "rising" | "falling" | "new"
    position: number
  }>
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

export class TickerGenerator {
  private openai_api_key: string

  constructor() {
    this.openai_api_key = process.env.OPENAI_API_KEY || ""
    if (!this.openai_api_key) {
      throw new Error("OPENAI_API_KEY is required for ticker generation")
    }
  }

  async getCurrentVotingContext(): Promise<VotingContext> {
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

    // Calculate time remaining (voting ends at 00:00 UTC)
    const now = new Date()
    const nextMidnight = new Date(now)
    nextMidnight.setUTCDate(nextMidnight.getUTCDate() + 1)
    nextMidnight.setUTCHours(0, 0, 0, 0)
    const time_remaining_hours = Math.max(
      0,
      Math.ceil((nextMidnight.getTime() - now.getTime()) / (1000 * 60 * 60))
    )

    // Mock recent changes for now - would need historical data for real implementation
    const recent_changes = sorted.slice(0, 3).map((emoji, index) => ({
      emoji: emoji[0],
      change: "rising" as const,
      position: index + 1,
    }))

    return {
      leading_emoji,
      leading_count,
      total_votes,
      time_remaining_hours,
      recent_changes,
    }
  }

  async generateTickerContent(context: VotingContext): Promise<string[]> {
    const prompt = `Generate 3-5 concise news ticker headlines about today's emoji voting on emoji.today. 

Current situation:
- Leading emoji: ${context.leading_emoji} with ${context.leading_count} votes
- Total votes: ${context.total_votes}
- Time remaining: ${context.time_remaining_hours} hours
- Recent activity: ${context.recent_changes
      .map((c) => `${c.emoji} ${c.change}`)
      .join(", ")}

Style: Keep it punchy, news-like, urgent but fun. Like breaking news but for emoji democracy.
Format: Return as JSON array of strings, each headline 50-80 characters.

Examples:
- "🔥 SURGES to lead with 247 votes as ${context.time_remaining_hours}h remain"
- "BREAKING: ${context.total_votes} votes cast, race tightening"
- "🚨 Late surge could upset ${context.leading_emoji} frontrunner status"`

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
            model: "gpt-4o-mini", // Lightweight and cost-effective
            messages: [
              {
                role: "system",
                content:
                  "You are a breaking news ticker generator for emoji voting. Keep headlines concise, urgent, and engaging.",
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            max_tokens: 300,
            temperature: 0.8,
          }),
        }
      )

      if (!response.ok) {
        throw new Error(
          `OpenAI API error: ${response.status} ${response.statusText}`
        )
      }

      const data = (await response.json()) as OpenAIResponse
      const content = data.choices[0]?.message?.content

      if (!content) {
        throw new Error("No content received from OpenAI")
      }

      // Parse JSON response
      try {
        const headlines = JSON.parse(content)
        return Array.isArray(headlines) ? headlines : [content]
      } catch {
        // Fallback: split by newlines if JSON parsing fails
        return content.split("\n").filter((line: string) => line.trim())
      }
    } catch (error) {
      console.error("Error generating ticker content:", error)

      // Fallback headlines
      return [
        `🗳️ ${context.total_votes} votes cast, ${context.leading_emoji} leads`,
        `⏰ ${context.time_remaining_hours} hours left to vote`,
        `📊 Live results update every 30 seconds`,
      ]
    }
  }

  async updateTickerQueue(): Promise<void> {
    const context = await this.getCurrentVotingContext()
    const headlines = await this.generateTickerContent(context)

    // Clear old ticker content
    await supabase
      .from("ticker_content")
      .delete()
      .lt("expires_at", new Date().toISOString())

    // Insert new headlines
    const tickerItems: Omit<TickerContent, "id">[] = headlines.map(
      (content, index) => ({
        content,
        priority: index + 1,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
        context: {
          leading_emoji: context.leading_emoji,
          vote_count: context.total_votes,
          time_remaining: `${context.time_remaining_hours}h`,
          trending_change: context.recent_changes[0]?.change,
        },
      })
    )

    const { error } = await supabase.from("ticker_content").insert(tickerItems)

    if (error) {
      throw new Error(`Failed to update ticker queue: ${error.message}`)
    }

    console.log(`✅ Updated ticker with ${headlines.length} new headlines`)
  }

  async getActiveTickerContent(): Promise<TickerContent[]> {
    const { data, error } = await supabase
      .from("ticker_content")
      .select("*")
      .gt("expires_at", new Date().toISOString())
      .order("priority", { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch ticker content: ${error.message}`)
    }

    return data || []
  }
}
