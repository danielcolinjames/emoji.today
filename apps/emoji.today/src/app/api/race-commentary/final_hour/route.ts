import { NextRequest, NextResponse } from "next/server"
import { createFinalHourSnapshot } from "@/actions/race-commentary-milestones"

export async function GET(request: NextRequest) {
  try {
    console.log("🏁 Final hour milestone triggered by Vercel cron")

    // Verify this is a cron request
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.warn("Unauthorized cron request")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Call the server action
    const result = await createFinalHourSnapshot()

    if (!result.success) {
      return NextResponse.json(result, { status: 500 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in final_hour milestone:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

// Also support POST for manual triggering
export async function POST(request: NextRequest) {
  return GET(request)
}
