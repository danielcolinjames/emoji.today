import { NextRequest, NextResponse } from "next/server"
import { createRaceSnapshot } from "@/lib/race-commentary-service"
import { supabase } from "@/lib/supabase"
import { getCurrentVotingDateString } from "@/lib/date-utils"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const milestone = searchParams.get("milestone") || "opening"
  const force = searchParams.get("force") === "true"

  // Trigger creation
  const result = await createRaceSnapshot(milestone, force)

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 500 }
    )
  }

  // Retrieve the snapshot id we just created
  const today = getCurrentVotingDateString()
  const { data, error } = await supabase
    .from("race_commentary_snapshots")
    .select("id")
    .eq("vote_date", today)
    .eq("milestone", milestone)
    .order("timestamp_utc", { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Snapshot created but id lookup failed",
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    snapshotId: data.id,
    snapshot: result.snapshot,
  })
}
