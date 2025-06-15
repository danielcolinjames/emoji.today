"use server"

import { createRaceSnapshot } from "@/lib/race-commentary-service"

export async function generateCommentaryAction(
  date: string,
  milestone: string = "opening"
) {
  // Force regen and target date
  const result = await createRaceSnapshot(milestone, true, date)
  if (!result.success) return { success: false, error: result.error }
  return {
    success: true,
    commentary: result.snapshot?.commentary_text || "",
    total_votes: result.snapshot?.total_votes || 0,
  }
}
