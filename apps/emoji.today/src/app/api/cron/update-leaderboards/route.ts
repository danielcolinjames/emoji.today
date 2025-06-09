import { NextRequest, NextResponse } from "next/server"
import { updateLeaderboards } from "@/actions/update-leaderboards"

export async function GET(request: NextRequest) {
  try {
    console.log("🏆 Leaderboard update cron triggered")

    // Verify this is a cron request
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.warn("Unauthorized cron request")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Call the server action
    const result = await updateLeaderboards()

    if (!result.success) {
      return NextResponse.json(result, { status: 500 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in leaderboard update cron:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
