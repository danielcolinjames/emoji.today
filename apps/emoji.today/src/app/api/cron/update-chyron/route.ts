import { NextRequest, NextResponse } from "next/server"
import { ChyronService } from "@/lib/chyron-service"

export async function GET(request: NextRequest) {
  try {
    console.log("📺 Chyron update cron triggered")

    // Verify this is a cron request
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.warn("Unauthorized cron request")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Use the ChyronService directly instead of making an internal fetch
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
      message: "Chyron update completed",
      chyron: result.chyron,
      reason: result.reason,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error in chyron cron job:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
