import { supabase } from "../lib/supabase"
import { getCurrentVotingDay, formatDateForDB } from "../lib/date-utils"

// Helper function to get current voting date as string
function getCurrentVotingDateString(): string {
  return formatDateForDB(getCurrentVotingDay())
}

interface SimplifiedTickerContext {
  leading_emoji: string
  leading_count: number
  second_emoji?: string
  second_count?: number
  total_votes: number
  time_remaining_hours: number
  gap: number
}

export class EfficientTickerGenerator {
  private openai_api_key: string

  constructor() {
    this.openai_api_key = process.env.OPENAI_API_KEY || ""
  }

  async getSimplifiedContext(): Promise<SimplifiedTickerContext> {
    const today = getCurrentVotingDateString()

    // Get current voting results
    const { data: results, error } = await supabase
      .from("votes")
      .select("emoji")
      .eq("vote_date", today)

    if (error) {
      throw new Error(`Failed to fetch voting data: ${error.message}`)
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
    const second_emoji = sorted[1]?.[0]
    const second_count = sorted[1]?.[1] || 0
    const gap = leading_count - second_count

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
      second_emoji,
      second_count,
      total_votes,
      time_remaining_hours,
      gap,
    }
  }

  async generateTickerHeadlines(
    context: SimplifiedTickerContext
  ): Promise<string[]> {
    // Use template-based generation for most cases to save AI costs
    const headlines: string[] = []

    if (context.total_votes === 0) {
      return ["🗳️ Voting is open • Be the first to cast your vote"]
    }

    // Primary headline - always show current leader
    headlines.push(
      `${context.leading_emoji} leads with ${context.leading_count} vote${
        context.leading_count !== 1 ? "s" : ""
      } • ${context.time_remaining_hours}h left`
    )

    // Secondary headlines based on context
    if (context.gap <= 2 && context.second_emoji && context.total_votes >= 10) {
      headlines.push(
        `🔥 Close race: ${context.leading_emoji} vs ${context.second_emoji} • ${context.gap} vote gap`
      )
    } else if (context.total_votes >= 20) {
      headlines.push(
        `📊 ${context.total_votes} votes cast • Democracy in action`
      )
    }

    // Time-based urgency
    if (context.time_remaining_hours <= 3) {
      headlines.push(
        `⏰ Final ${context.time_remaining_hours} hours • Every vote counts`
      )
    } else if (context.time_remaining_hours <= 6) {
      headlines.push(
        `🚨 ${context.time_remaining_hours}h remaining • Race heating up`
      )
    }

    // Only use AI for special situations to minimize costs
    if (this.shouldUseAI(context)) {
      try {
        const aiHeadline = await this.generateAIHeadline(context)
        if (aiHeadline) {
          headlines.unshift(aiHeadline) // Put AI headline first
        }
      } catch (error) {
        console.warn("AI headline generation failed, using templates:", error)
      }
    }

    return headlines.slice(0, 3) // Max 3 headlines
  }

  private shouldUseAI(context: SimplifiedTickerContext): boolean {
    // Only use AI for special situations to minimize costs
    return (
      (context.gap === 1 && context.total_votes >= 15) || // Very close race
      context.time_remaining_hours === 1 || // Final hour
      context.total_votes >= 100 // High engagement
    )
  }

  private async generateAIHeadline(
    context: SimplifiedTickerContext
  ): Promise<string | null> {
    const prompt = `Create a breaking news ticker headline for emoji voting:
- ${context.leading_emoji} leads: ${context.leading_count} votes
- ${context.second_emoji || "Others"}: ${context.second_count} votes  
- Gap: ${context.gap} votes
- Time left: ${context.time_remaining_hours}h
- Total: ${context.total_votes} votes

Style: Exciting, urgent, 50-70 chars max.
Output: ONE headline only, no quotes.`

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
            model: "gpt-3.5-turbo", // Even cheaper than 4o-mini
            messages: [{ role: "user", content: prompt }],
            max_tokens: 30, // Keep very short for cost control
            temperature: 0.7,
          }),
        }
      )

      if (!response.ok) throw new Error(`API error: ${response.status}`)

      const data = (await response.json()) as {
        choices: Array<{ message: { content: string } }>
      }
      return data.choices[0]?.message?.content?.trim() || null
    } catch (error) {
      console.error("AI headline generation failed:", error)
      return null
    }
  }

  async updateEfficientTicker(): Promise<void> {
    try {
      const context = await this.getSimplifiedContext()
      const headlines = await this.generateTickerHeadlines(context)

      // Store in simplified format or just log for now
      console.log("📰 Generated efficient ticker headlines:")
      headlines.forEach((headline, i) => {
        console.log(`  ${i + 1}. ${headline}`)
      })

      // Could store in cache/memory instead of database to reduce overhead
      // For now, just return the headlines for the API to pick up
      return
    } catch (error) {
      console.error("Efficient ticker update failed:", error)
      throw error
    }
  }
}
