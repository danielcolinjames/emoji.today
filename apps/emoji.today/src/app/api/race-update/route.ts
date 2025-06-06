import { NextRequest, NextResponse } from "next/server"
import {
  generateAndPostRaceUpdate,
  checkForDramaticMoments,
} from "@/actions/race-commentary"

export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication/webhook verification
    const authHeader = request.headers.get("authorization")
    const expectedToken = process.env.RACE_UPDATE_SECRET_TOKEN

    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if this is a dramatic moment (optional parameter)
    const { searchParams } = new URL(request.url)
    const forcePost = searchParams.get("force") === "true"
    const checkDrama = searchParams.get("drama") === "true"

    if (checkDrama) {
      // Only post if it's a dramatic moment
      const { isDramatic } = await checkForDramaticMoments()
      if (!isDramatic && !forcePost) {
        return NextResponse.json({
          success: true,
          message: "No dramatic moment detected, skipping post",
          posted: false,
        })
      }
    }

    const result = await generateAndPostRaceUpdate()

    return NextResponse.json(result)
  } catch (error) {
    console.error("Race update API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Health check endpoint
    const { isDramatic, context } = await checkForDramaticMoments()

    return NextResponse.json({
      healthy: true,
      isDramatic,
      totalVotes: context?.totalVotes || 0,
      timeRemaining: context?.timeRemaining,
      frontrunner: context?.currentStandings?.[0]?.emoji || null,
    })
  } catch (error) {
    console.error("Race update health check error:", error)
    return NextResponse.json(
      { healthy: false, error: "Health check failed" },
      { status: 500 }
    )
  }
}
