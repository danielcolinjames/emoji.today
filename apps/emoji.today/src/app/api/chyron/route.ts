import { NextRequest, NextResponse } from "next/server"
import { getLatestChyronText } from "@/lib/race-commentary-service"
import { DEFAULT_OPENING_CHYRON } from "@/lib/constants"

export async function GET(request: NextRequest) {
  try {
    // Check if we're in a build environment
    if (
      process.env.NODE_ENV === "production" &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL
    ) {
      // During build time, return a static response
      return NextResponse.json({
        success: true,
        chyron: DEFAULT_OPENING_CHYRON,
        cached: true,
        source: "build_fallback",
        timestamp: new Date().toISOString(),
      })
    }

    // Get the latest chyron text from race snapshots
    const chyronText = await getLatestChyronText()

    return NextResponse.json({
      success: true,
      chyron: chyronText,
      cached: false, // Always fresh from the snapshot system
      source: "race_snapshots",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error fetching chyron text:", error)

    // Fallback to default text
    return NextResponse.json({
      success: true,
      chyron: DEFAULT_OPENING_CHYRON,
      cached: false,
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    })
  }
}
