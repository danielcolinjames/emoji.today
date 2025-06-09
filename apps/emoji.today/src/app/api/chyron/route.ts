import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getCurrentVotingDateString } from "@/lib/date-utils"
import { getDefaultOpeningChyron } from "@/lib/constants"
import { ChyronService } from "@/lib/chyron-service"

export async function GET(request: NextRequest) {
  try {
    const today = getCurrentVotingDateString()

    // Get the current chyron from the chyrons table
    const { data: chyron } = await supabase
      .from("chyrons")
      .select("text")
      .eq("vote_date", today)
      .order("updated_at", { ascending: false })
      .limit(1)
      .single()

    const chyronText = chyron?.text || getDefaultOpeningChyron().toUpperCase()

    return NextResponse.json({
      success: true,
      chyron: chyronText,
      cached: false,
      source: "chyrons_table",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error fetching chyron text:", error)

    return NextResponse.json({
      success: true,
      chyron: getDefaultOpeningChyron().toUpperCase(),
      cached: false,
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check for CRON_SECRET authentication
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Use the comprehensive chyron service
    const chyronService = ChyronService.getInstance()
    const result = await chyronService.updateChyron()

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.reason || "Failed to update chyron",
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      chyron: result.chyron,
      reason: result.reason,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error updating chyron:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

// Keep the old simple function as fallback helper
function toUpperCase(text: string): string {
  return text.toUpperCase()
}
