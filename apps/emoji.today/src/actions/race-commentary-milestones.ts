"use server"

import {
  createRaceSnapshot,
  postToFarcaster,
} from "@/lib/race-commentary-service"

interface MilestoneResult {
  success: boolean
  milestone: string
  snapshot?: {
    total_votes: number
    emoji_count: number
    commentary?: string
  }
  farcaster?: {
    success: boolean
    hash?: string
    error?: string
  }
  error?: string
}

async function createMilestoneSnapshot(
  milestone: string,
  force: boolean = false
): Promise<MilestoneResult> {
  try {
    console.log(`🎯 ${milestone} milestone triggered${force ? " (FORCE)" : ""}`)

    // Create race snapshot for this milestone
    const result = await createRaceSnapshot(milestone, force)

    if (!result.success) {
      console.error(`Failed to create ${milestone} snapshot:`, result.error)
      return {
        success: false,
        milestone,
        error: result.error,
      }
    }

    const snapshot = result.snapshot!
    let farcasterResult = null

    // Post to Farcaster if we have commentary
    if (snapshot.commentary_text) {
      farcasterResult = await postToFarcaster(
        snapshot.commentary_text,
        snapshot.id
      )
    }

    console.log(`✅ ${milestone} milestone completed:`, {
      snapshot_id: snapshot.vote_date + "-" + snapshot.milestone,
      total_votes: snapshot.total_votes,
      posted_to_farcaster: farcasterResult?.success || false,
      farcaster_hash: farcasterResult?.hash,
    })

    return {
      success: true,
      milestone,
      snapshot: {
        total_votes: snapshot.total_votes,
        emoji_count: snapshot.emoji_standings.length,
        commentary: snapshot.commentary_text,
      },
      farcaster: farcasterResult || undefined,
    }
  } catch (error) {
    console.error(`Error in ${milestone} milestone:`, error)
    return {
      success: false,
      milestone,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function createOpeningSnapshot(
  force: boolean = false
): Promise<MilestoneResult> {
  return createMilestoneSnapshot("opening", force)
}

export async function create1HourSnapshot(): Promise<MilestoneResult> {
  return createMilestoneSnapshot("1hour")
}

export async function createHalfwaySnapshot(): Promise<MilestoneResult> {
  return createMilestoneSnapshot("halfway")
}

export async function create6HoursLeftSnapshot(): Promise<MilestoneResult> {
  return createMilestoneSnapshot("6hours_left")
}

export async function create3HoursLeftSnapshot(): Promise<MilestoneResult> {
  return createMilestoneSnapshot("3hours_left")
}

export async function createFinalHourSnapshot(): Promise<MilestoneResult> {
  return createMilestoneSnapshot("final_hour")
}

export async function createFinalMinutesSnapshot(): Promise<MilestoneResult> {
  return createMilestoneSnapshot("final_minutes")
}

export async function createDailySummarySnapshot(): Promise<MilestoneResult> {
  return createMilestoneSnapshot("daily_summary")
}

// Utility action for manual testing
export async function createManualSnapshot(
  milestone: string
): Promise<MilestoneResult> {
  // Validate milestone
  const validMilestones = [
    "opening",
    "1hour",
    "halfway",
    "6hours_left",
    "3hours_left",
    "final_hour",
    "final_minutes",
    "daily_summary",
  ]
  if (!validMilestones.includes(milestone)) {
    return {
      success: false,
      milestone,
      error: `Invalid milestone. Must be one of: ${validMilestones.join(", ")}`,
    }
  }

  return createMilestoneSnapshot(milestone)
}
