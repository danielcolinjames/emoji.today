import { supabase } from "./lib/supabase"
import { tallyVotes } from "./tally-votes"
import {
  getCurrentVotingDay,
  formatDateForDB,
  formatDateForDisplay,
} from "./lib/date-utils"
import { subDays } from "date-fns"
import { UTCDate } from "@date-fns/utc"

/**
 * Daily reset job that runs at midnight UTC
 * - Finalizes the previous day's voting
 * - Announces the winner
 */
export async function dailyReset() {
  console.log("🌅 Starting daily reset...")
  console.log(`Current UTC time: ${new UTCDate().toISOString()}`)

  try {
    // Get yesterday's date (the day that just ended)
    const yesterday = subDays(getCurrentVotingDay(), 1)
    const yesterdayString = formatDateForDB(yesterday)

    console.log(`\nFinalizing votes for ${formatDateForDisplay(yesterday)}`)

    // Check if yesterday's results are already finalized
    const { data: existingResult, error: checkError } = await supabase
      .from("daily_results")
      .select("finalized_at")
      .eq("vote_date", yesterdayString)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      throw new Error(`Failed to check existing results: ${checkError.message}`)
    }

    if (existingResult?.finalized_at) {
      console.log("Yesterday's results already finalized, skipping...")
    } else {
      // Run final tally for yesterday (this will create/update the daily_results record)
      await tallyVotes(yesterday)
    }

    console.log("\n✅ Daily reset complete!")
  } catch (error) {
    console.error("❌ Daily reset failed:", error)
    throw error
  }
}

// Run the script if called directly
if (require.main === module) {
  dailyReset()
    .then(() => {
      console.log("\nDaily reset job completed successfully")
      process.exit(0)
    })
    .catch((error) => {
      console.error("\nDaily reset job failed:", error)
      process.exit(1)
    })
}
