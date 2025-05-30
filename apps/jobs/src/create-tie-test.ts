import { supabase } from "./lib/supabase"
import {
  getCurrentVotingDay,
  formatDateForDB,
  getVotingDayBounds,
} from "./lib/date-utils"

async function createTieTestScenario() {
  const today = getCurrentVotingDay()
  const dateString = formatDateForDB(today)
  const { start: dayStart } = getVotingDayBounds(today)

  console.log(`Creating tie test scenario for ${dateString}...`)
  console.log(`Day starts at: ${dayStart.toISOString()}`)

  // Clear existing votes for today
  await supabase.from("votes").delete().eq("vote_date", dateString)

  // Create test users if they don't exist
  const testUsers = []
  for (let i = 1; i <= 6; i++) {
    testUsers.push({
      fid: (200000 + i).toString(),
      username: `tietest${i}`,
    })
  }

  const { data: users } = await supabase
    .from("users")
    .upsert(testUsers, { onConflict: "fid" })
    .select()

  if (!users || users.length === 0) {
    throw new Error("Failed to create test users")
  }

  // Create votes with specific timing to test tie-breaking
  // All times are relative to the start of the voting day
  const tieVotes = [
    // 🔥 votes (early in the day)
    {
      user_id: users[0].id,
      fid: users[0].fid,
      emoji: "🔥",
      vote_date: dateString,
      created_at: new Date(dayStart.getTime() + 2 * 3600 * 1000).toISOString(),
    }, // 2 hours after start (2 AM UTC)
    {
      user_id: users[1].id,
      fid: users[1].fid,
      emoji: "🔥",
      vote_date: dateString,
      created_at: new Date(dayStart.getTime() + 4 * 3600 * 1000).toISOString(),
    }, // 4 hours after start (4 AM UTC)
    {
      user_id: users[2].id,
      fid: users[2].fid,
      emoji: "🔥",
      vote_date: dateString,
      created_at: new Date(dayStart.getTime() + 6 * 3600 * 1000).toISOString(),
    }, // 6 hours after start (6 AM UTC)

    // 😂 votes (later in the day - should win the tie)
    {
      user_id: users[3].id,
      fid: users[3].fid,
      emoji: "😂",
      vote_date: dateString,
      created_at: new Date(dayStart.getTime() + 18 * 3600 * 1000).toISOString(),
    }, // 18 hours after start (6 PM UTC)
    {
      user_id: users[4].id,
      fid: users[4].fid,
      emoji: "😂",
      vote_date: dateString,
      created_at: new Date(dayStart.getTime() + 20 * 3600 * 1000).toISOString(),
    }, // 20 hours after start (8 PM UTC)
    {
      user_id: users[5].id,
      fid: users[5].fid,
      emoji: "😂",
      vote_date: dateString,
      created_at: new Date(dayStart.getTime() + 22 * 3600 * 1000).toISOString(),
    }, // 22 hours after start (10 PM UTC)
  ]

  const { error } = await supabase.from("votes").insert(tieVotes)

  if (error) {
    throw new Error(`Failed to create tie votes: ${error.message}`)
  }

  console.log("✅ Tie test scenario created!")
  console.log("🔥 votes: 2 AM, 4 AM, 6 AM UTC (average: 4 AM)")
  console.log("😂 votes: 6 PM, 8 PM, 10 PM UTC (average: 8 PM)")
  console.log(
    "😂 should win the tie because its votes came later in the day on average"
  )
  console.log("\nRun: npx tsx src/tally-votes.ts")
}

if (require.main === module) {
  createTieTestScenario()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Failed to create tie test:", error)
      process.exit(1)
    })
}
