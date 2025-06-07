import { NextRequest, NextResponse } from "next/server"
import { getLatestChyronText } from "@/lib/race-commentary-service"
import { DEFAULT_OPENING_CHYRON } from "@/lib/constants"

export async function GET(request: NextRequest) {
  try {
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
