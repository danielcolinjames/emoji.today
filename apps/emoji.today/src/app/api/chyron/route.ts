import { NextRequest, NextResponse } from "next/server"
import { generateChyronUpdate } from "@/actions/race-commentary"
import { supabase } from "@/lib/supabase"

// Server-side cache to prevent multiple OpenRouter calls
let cachedChyron: {
  text: string
  totalVotes: number
  lastUpdated: number
  votesAtLastUpdate: number
} = {
  text: "POLLS OPEN • CAST YOUR VOTE AT EMOJI.TODAY",
  totalVotes: 0,
  lastUpdated: 0,
  votesAtLastUpdate: 0,
}

const CACHE_DURATION = 2 * 60 * 1000 // 2 minutes
const MIN_VOTE_CHANGE = 3 // Minimum vote change to trigger update

export async function GET(request: NextRequest) {
  try {
    const now = Date.now()

    // Get current state from database including stored chyron text
    const today = new Date().toISOString().split("T")[0]
    const { data: liveResult, error: liveResultError } = await supabase
      .from("live_results")
      .select("total_votes, chyron_text, last_updated_at")
      .eq("vote_date", today)
      .single()

    // Handle database query errors gracefully
    if (liveResultError && liveResultError.code !== "PGRST116") {
      console.error("Error fetching live results:", liveResultError)
      // Fall back to basic vote count query
      const { data: basicResult } = await supabase
        .from("live_results")
        .select("total_votes")
        .eq("vote_date", today)
        .single()

      const currentTotalVotes = (basicResult as any)?.total_votes || 0

      return NextResponse.json({
        success: true,
        chyron: cachedChyron.text,
        cached: true,
        source: "fallback",
        totalVotes: currentTotalVotes,
        lastUpdated: cachedChyron.lastUpdated,
      })
    }

    const currentTotalVotes = (liveResult as any)?.total_votes || 0
    const storedChyronText = (liveResult as any)?.chyron_text
    const dbLastUpdated = (liveResult as any)?.last_updated_at
      ? new Date((liveResult as any).last_updated_at).getTime()
      : 0

    // Check if we should update the cache
    const timeSinceLastUpdate = now - cachedChyron.lastUpdated
    const votesSinceLastUpdate = Math.abs(
      currentTotalVotes - cachedChyron.votesAtLastUpdate
    )

    // If we have stored chyron text that's newer than our cache, use it
    if (storedChyronText && dbLastUpdated > cachedChyron.lastUpdated) {
      cachedChyron = {
        text: storedChyronText,
        totalVotes: currentTotalVotes,
        lastUpdated: dbLastUpdated,
        votesAtLastUpdate: currentTotalVotes,
      }

      console.log("📺 Using stored chyron from database:", storedChyronText)

      return NextResponse.json({
        success: true,
        chyron: storedChyronText,
        cached: false,
        source: "database",
        totalVotes: currentTotalVotes,
        lastUpdated: dbLastUpdated,
      })
    }

    const shouldUpdate =
      timeSinceLastUpdate > CACHE_DURATION || // Been too long since last update
      votesSinceLastUpdate >= MIN_VOTE_CHANGE || // Significant vote change
      cachedChyron.lastUpdated === 0 // First time

    if (shouldUpdate) {
      console.log(
        `🔄 Updating chyron cache: ${votesSinceLastUpdate} vote change, ${Math.round(
          timeSinceLastUpdate / 1000
        )}s ago`
      )

      try {
        // Generate new chyron text with error handling
        const result = await generateChyronUpdate()

        if (result.success && result.chyron) {
          cachedChyron = {
            text: result.chyron,
            totalVotes: currentTotalVotes,
            lastUpdated: now,
            votesAtLastUpdate: currentTotalVotes,
          }

          // Store the generated chyron in the database for future use
          try {
            await supabase.from("live_results").upsert(
              {
                vote_date: today,
                chyron_text: result.chyron,
                last_updated_at: new Date().toISOString(),
              } as any,
              {
                onConflict: "vote_date",
                ignoreDuplicates: false,
              }
            )
          } catch (dbError) {
            console.warn("Failed to store chyron in database:", dbError)
          }
        } else {
          console.warn("Failed to generate chyron update:", result.error)
        }
      } catch (aiError) {
        console.error("Error generating chyron:", aiError)
        // Don't update cache if AI call fails, just use existing cached text
      }
    }

    return NextResponse.json({
      success: true,
      chyron: cachedChyron.text,
      cached: !shouldUpdate,
      source: shouldUpdate ? "generated" : "cache",
      totalVotes: currentTotalVotes,
      lastUpdated: cachedChyron.lastUpdated,
    })
  } catch (error) {
    console.error("Chyron API error:", error)

    // Always return valid JSON, even in error cases
    return NextResponse.json(
      {
        success: false,
        chyron: cachedChyron.text || "EMOJI RACE HEATING UP!",
        error: error instanceof Error ? error.message : "Unknown error",
        cached: true,
        source: "fallback",
        totalVotes: 0,
        lastUpdated: cachedChyron.lastUpdated,
      },
      { status: 200 } // Return 200 to avoid fetch errors
    )
  }
}
