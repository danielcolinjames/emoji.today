import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getCurrentVotingDateString } from "@/lib/date-utils"

interface TickerHeadline {
  id: string
  content: string
  priority: number
  created_at: string
  context: {
    leading_emoji?: string
    vote_count?: number
    time_remaining?: string
  }
}

async function generateLiveTickerContent(): Promise<TickerHeadline[]> {
  try {
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

    // Calculate time remaining
    const now = new Date()
    const nextMidnight = new Date(now)
    nextMidnight.setUTCDate(nextMidnight.getUTCDate() + 1)
    nextMidnight.setUTCHours(0, 0, 0, 0)
    const time_remaining_hours = Math.max(
      0,
      Math.ceil((nextMidnight.getTime() - now.getTime()) / (1000 * 60 * 60))
    )

    // Generate dynamic headlines
    const headlines: TickerHeadline[] = []
    const currentTime = new Date().toISOString()

    if (total_votes > 0) {
      headlines.push({
        id: "live-1",
        content: `${leading_emoji} LEADS with ${leading_count} votes • ${time_remaining_hours}h remaining`,
        priority: 1,
        created_at: currentTime,
        context: {
          leading_emoji,
          vote_count: total_votes,
          time_remaining: `${time_remaining_hours}h`,
        },
      })

      if (total_votes > 10) {
        headlines.push({
          id: "live-2",
          content: `📊 ${total_votes} total votes cast • Race heating up`,
          priority: 2,
          created_at: currentTime,
          context: {
            vote_count: total_votes,
          },
        })
      }

      if (time_remaining_hours <= 3) {
        headlines.push({
          id: "live-3",
          content: `🚨 FINAL HOURS: ${time_remaining_hours}h left to vote • Make history`,
          priority: 3,
          created_at: currentTime,
          context: {
            time_remaining: `${time_remaining_hours}h`,
          },
        })
      }

      if (sorted.length > 1) {
        const second_emoji = sorted[1][0]
        const second_count = sorted[1][1]
        const gap = leading_count - second_count

        if (gap <= 3 && gap > 0) {
          headlines.push({
            id: "live-4",
            content: `TIGHT RACE: ${leading_emoji} vs ${second_emoji} • Only ${gap} vote${
              gap !== 1 ? "s" : ""
            } apart`,
            priority: 4,
            created_at: currentTime,
            context: {
              leading_emoji,
            },
          })
        }
      }
    } else {
      headlines.push({
        id: "live-no-votes",
        content: `🗳️ No votes yet today • Be the first to make history`,
        priority: 1,
        created_at: currentTime,
        context: {},
      })
    }

    // Add general headlines
    headlines.push({
      id: "live-general",
      content: `📰 Live results update every 30 seconds • emoji.today`,
      priority: 5,
      created_at: currentTime,
      context: {},
    })

    return headlines.slice(0, 3) // Return top 3 headlines
  } catch (error) {
    console.error("Error generating ticker content:", error)
    // Return fallback content
    return [
      {
        id: "fallback-1",
        content: "📊 Live voting results • Cast your vote to see updates",
        priority: 1,
        created_at: new Date().toISOString(),
        context: {},
      },
    ]
  }
}

export async function GET(request: NextRequest) {
  try {
    const tickerContent = await generateLiveTickerContent()

    return NextResponse.json({
      success: true,
      content: tickerContent,
      count: tickerContent.length,
      generated_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Ticker API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Enable CORS for live updates
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}
