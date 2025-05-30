import { supabase } from "./lib/supabase"
import { getCurrentVotingDay, formatDateForDB } from "./lib/date-utils"
import { subDays } from "date-fns"

const TEST_EMOJIS = ["🔥", "😂", "❤️", "🚀", "🎉", "😎", "🌟", "💯", "🤔", "😊"]
const TEST_USER_COUNT = 20

async function createTestUsers() {
  console.log("Creating test users...")
  const users = []

  for (let i = 1; i <= TEST_USER_COUNT; i++) {
    users.push({
      fid: (100000 + i).toString(),
      username: `testuser${i}`,
    })
  }

  const { data, error } = await supabase
    .from("users")
    .upsert(users, { onConflict: "fid" })
    .select()

  if (error) {
    throw new Error(`Failed to create test users: ${error.message}`)
  }

  console.log(`Created ${data.length} test users`)
  return data
}

async function createTestVotes(users: any[], targetDate: Date) {
  const dateString = formatDateForDB(targetDate)
  console.log(`\nCreating test votes for ${dateString}...`)

  const votes = []

  // Create votes with a bias towards certain emojis to make it interesting
  const emojiWeights = {
    "🔥": 0.25, // 25% chance
    "😂": 0.2, // 20% chance
    "❤️": 0.15, // 15% chance
    "🚀": 0.1, // 10% chance
    "🎉": 0.1, // 10% chance
    // Rest share the remaining 20%
  }

  for (const user of users) {
    // Pick a random emoji based on weights
    const rand = Math.random()
    let emoji
    let cumulative = 0

    for (const [e, weight] of Object.entries(emojiWeights)) {
      cumulative += weight
      if (rand < cumulative) {
        emoji = e
        break
      }
    }

    // If no weighted emoji selected, pick from the rest
    if (!emoji) {
      const remainingEmojis = TEST_EMOJIS.filter(
        (e) => !emojiWeights.hasOwnProperty(e)
      )
      emoji =
        remainingEmojis[Math.floor(Math.random() * remainingEmojis.length)]
    }

    votes.push({
      user_id: user.id,
      fid: user.fid,
      emoji: emoji,
      vote_date: dateString,
    })
  }

  // Delete existing votes for this date first
  await supabase.from("votes").delete().eq("vote_date", dateString)

  const { data, error } = await supabase.from("votes").insert(votes).select()

  if (error) {
    throw new Error(`Failed to create test votes: ${error.message}`)
  }

  // Count votes by emoji for display
  const voteCounts: Record<string, number> = {}
  votes.forEach((vote) => {
    voteCounts[vote.emoji] = (voteCounts[vote.emoji] || 0) + 1
  })

  console.log(`Created ${data.length} test votes:`)
  Object.entries(voteCounts)
    .sort(([, a], [, b]) => b - a)
    .forEach(([emoji, count]) => {
      console.log(`  ${emoji}: ${count} votes`)
    })
}

async function populateTestData(daysAgo: number = 0) {
  try {
    // Create test users first
    const users = await createTestUsers()

    // Create votes for the specified day
    const targetDate =
      daysAgo === 0
        ? getCurrentVotingDay()
        : subDays(getCurrentVotingDay(), daysAgo)

    await createTestVotes(users, targetDate)

    console.log("\n✅ Test data populated successfully!")
    console.log(
      `\nYou can now run: yarn workspace emoji-today-jobs tally-votes${
        daysAgo > 0 ? ` ${formatDateForDB(targetDate)}` : ""
      }`
    )
  } catch (error) {
    console.error("❌ Failed to populate test data:", error)
    throw error
  }
}

// Run the script if called directly
if (require.main === module) {
  const args = process.argv.slice(2)
  const daysAgo = parseInt(args[0]) || 0

  if (daysAgo < 0) {
    console.error("Days ago must be 0 or positive")
    process.exit(1)
  }

  console.log(
    `Populating test votes for ${
      daysAgo === 0 ? "today" : `${daysAgo} day(s) ago`
    }...`
  )

  populateTestData(daysAgo)
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}
