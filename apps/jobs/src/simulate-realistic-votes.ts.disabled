import { supabase } from "./lib/supabase"
import {
  getCurrentVotingDay,
  formatDateForDB,
  getVotingDayBounds,
} from "./lib/date-utils"

interface EmojiOption {
  emoji: string
  name: string
  weight: number // 0-1, higher means more likely to be chosen
  timeDistribution: "early" | "midday" | "evening" | "uniform" // When votes come in
}

// Configuration for the simulation
const SIMULATION_CONFIG = {
  userCount: 350, // Total number of voters
  votePercentage: 0.85, // 85% of users will vote
  obviousWinners: [
    {
      emoji: "🔥",
      name: "Fire",
      weight: 0.25,
      timeDistribution: "evening" as const,
    },
    {
      emoji: "😂",
      name: "Laughing",
      weight: 0.2,
      timeDistribution: "midday" as const,
    },
    {
      emoji: "❤️",
      name: "Heart",
      weight: 0.15,
      timeDistribution: "uniform" as const,
    },
    {
      emoji: "👍",
      name: "Thumbs Up",
      weight: 0.15,
      timeDistribution: "uniform" as const,
    },
    {
      emoji: "⚡",
      name: "Lightning",
      weight: 0.1,
      timeDistribution: "evening" as const,
    },
  ],
  competitiveEmojis: [
    {
      emoji: "🚀",
      name: "Rocket",
      weight: 0.08,
      timeDistribution: "early" as const,
    },
    {
      emoji: "🎉",
      name: "Party",
      weight: 0.06,
      timeDistribution: "evening" as const,
    },
    {
      emoji: "💯",
      name: "100",
      weight: 0.04,
      timeDistribution: "midday" as const,
    },
    {
      emoji: "⭐",
      name: "Star",
      weight: 0.03,
      timeDistribution: "early" as const,
    },
    {
      emoji: "🤔",
      name: "Thinking",
      weight: 0.02,
      timeDistribution: "uniform" as const,
    },
  ],
}

async function getRandomEmojiFromDatabase(): Promise<string> {
  const { data, error } = await supabase
    .from("emojis")
    .select("emoji")
    .not("accent_color", "is", null)
    .not("is_votable", "is", false)
    .limit(1)
    .order("created_at", { ascending: false })

  if (error || !data || data.length === 0) {
    // Fallback emojis that we confirmed exist in the database
    const fallbackEmojis = ["🤔", "😊", "🤷", "😍", "🙌", "💪", "🎯", "🔮"]
    return fallbackEmojis[Math.floor(Math.random() * fallbackEmojis.length)]
  }

  return data[0].emoji
}

function selectEmojiByWeight(): EmojiOption | null {
  const allEmojis = [
    ...SIMULATION_CONFIG.obviousWinners,
    ...SIMULATION_CONFIG.competitiveEmojis,
  ]
  const totalWeight = allEmojis.reduce((sum, emoji) => sum + emoji.weight, 0)

  // Add random chance for completely random emoji (5% chance)
  if (Math.random() < 0.05) {
    return null // Will trigger random emoji selection
  }

  const random = Math.random() * totalWeight
  let currentWeight = 0

  for (const emoji of allEmojis) {
    currentWeight += emoji.weight
    if (random <= currentWeight) {
      return emoji
    }
  }

  return allEmojis[0] // Fallback
}

function generateVoteTime(
  timeDistribution: string,
  dayStart: Date,
  dayEnd: Date
): Date {
  const dayDuration = dayEnd.getTime() - dayStart.getTime()

  let timeOffset: number

  switch (timeDistribution) {
    case "early":
      // Concentrate votes in first 8 hours (with some randomness)
      timeOffset =
        Math.random() * (dayDuration * 0.33) + Math.random() * dayDuration * 0.1
      break
    case "midday":
      // Concentrate votes in middle 8 hours
      timeOffset = dayDuration * 0.3 + Math.random() * dayDuration * 0.4
      break
    case "evening":
      // Concentrate votes in last 8 hours
      timeOffset = dayDuration * 0.6 + Math.random() * dayDuration * 0.35
      break
    case "uniform":
    default:
      // Uniform distribution throughout the day
      timeOffset = Math.random() * dayDuration
      break
  }

  // Add some noise to make it feel more organic (±30 minutes)
  const noise = (Math.random() - 0.5) * 2 * 30 * 60 * 1000 // 30 minutes in ms
  timeOffset += noise

  // Ensure we don't go outside the day bounds
  timeOffset = Math.max(0, Math.min(timeOffset, dayDuration))

  return new Date(dayStart.getTime() + timeOffset)
}

async function createSimulationUsers(): Promise<any[]> {
  console.log(`Creating ${SIMULATION_CONFIG.userCount} simulation users...`)
  const users = []

  for (let i = 1; i <= SIMULATION_CONFIG.userCount; i++) {
    users.push({
      fid: (300000 + i).toString(), // Use 300000+ range for simulation users
      username: `sim_user_${i}`,
    })
  }

  const { data, error } = await supabase
    .from("users")
    .upsert(users, { onConflict: "fid" })
    .select()

  if (error) {
    throw new Error(`Failed to create simulation users: ${error.message}`)
  }

  console.log(`✅ Created ${data.length} simulation users`)
  return data
}

async function simulateRealisticVotes() {
  const today = getCurrentVotingDay()
  const dateString = formatDateForDB(today)
  const { start: dayStart, end: dayEnd } = getVotingDayBounds(today)

  console.log(`🎬 Starting realistic vote simulation for ${dateString}`)
  console.log(
    `📅 Day bounds: ${dayStart.toISOString()} to ${dayEnd.toISOString()}`
  )

  // Clear existing votes for today
  console.log("🧹 Clearing existing votes for today...")
  await supabase.from("votes").delete().eq("vote_date", dateString)

  // Create simulation users
  const users = await createSimulationUsers()

  // Determine which users will vote (not everyone votes)
  const voterCount = Math.floor(users.length * SIMULATION_CONFIG.votePercentage)
  const voters = users.slice(0, voterCount)

  console.log(
    `👥 ${voters.length} out of ${users.length} users will vote (${Math.round(
      SIMULATION_CONFIG.votePercentage * 100
    )}%)`
  )

  const votes = []
  const emojiCounts: Record<string, number> = {}

  for (const user of voters) {
    // Select emoji based on weights
    const emojiOption = selectEmojiByWeight()
    let emoji: string
    let timeDistribution: string = "uniform"

    if (emojiOption) {
      emoji = emojiOption.emoji
      timeDistribution = emojiOption.timeDistribution
    } else {
      // Get a random emoji from database
      emoji = await getRandomEmojiFromDatabase()
    }

    // Generate vote time based on distribution
    const voteTime = generateVoteTime(timeDistribution, dayStart, dayEnd)

    votes.push({
      user_id: user.id,
      fid: user.fid,
      emoji,
      vote_date: dateString,
      created_at: voteTime.toISOString(),
    })

    // Track counts for summary
    emojiCounts[emoji] = (emojiCounts[emoji] || 0) + 1
  }

  // Sort votes by created_at to simulate chronological voting
  votes.sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  console.log(`🗳️  Inserting ${votes.length} votes...`)

  // Insert votes in batches to avoid overwhelming the database
  const batchSize = 50
  for (let i = 0; i < votes.length; i += batchSize) {
    const batch = votes.slice(i, i + batchSize)
    const { error } = await supabase.from("votes").insert(batch)

    if (error) {
      throw new Error(
        `Failed to insert vote batch ${i / batchSize + 1}: ${error.message}`
      )
    }

    // Small delay between batches to spread out the inserts
    await new Promise((resolve) => setTimeout(resolve, 100))

    if ((i / batchSize) % 10 === 0) {
      console.log(
        `📝 Inserted ${Math.min(i + batchSize, votes.length)}/${
          votes.length
        } votes...`
      )
    }
  }

  // Display results summary
  console.log("\n📊 Simulation Results:")
  console.log("=".repeat(50))

  const sortedResults = Object.entries(emojiCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10) // Top 10

  sortedResults.forEach(([emoji, count], index) => {
    const percentage = ((count / votes.length) * 100).toFixed(1)
    console.log(
      `${(index + 1).toString().padStart(2)}. ${emoji} ${count
        .toString()
        .padStart(3)} votes (${percentage}%)`
    )
  })

  console.log("=".repeat(50))
  console.log(
    `✅ Simulation complete! ${
      votes.length
    } votes spread across ${dayStart.toLocaleDateString()} to ${dayEnd.toLocaleDateString()}`
  )

  // Show first and last vote times for verification
  if (votes.length > 0) {
    const firstVote = new Date(votes[0].created_at)
    const lastVote = new Date(votes[votes.length - 1].created_at)
    console.log(`⏰ First vote: ${firstVote.toLocaleTimeString()}`)
    console.log(`⏰ Last vote: ${lastVote.toLocaleTimeString()}`)
  }
}

// Add continuous voting simulation (votes trickling in)
async function simulateContinuousVoting(
  intervalMinutes: number = 2,
  durationMinutes: number = 60
) {
  console.log(`🔄 Starting continuous voting simulation...`)
  console.log(
    `📝 New vote every ~${intervalMinutes} minutes for ${durationMinutes} minutes`
  )

  const today = getCurrentVotingDay()
  const dateString = formatDateForDB(today)

  // Create a few more users for continuous voting
  const continuousUsers = []
  for (let i = 1; i <= 50; i++) {
    continuousUsers.push({
      fid: (400000 + i).toString(), // Use 400000+ range for continuous users
      username: `continuous_${i}`,
    })
  }

  const { data: users, error } = await supabase
    .from("users")
    .upsert(continuousUsers, { onConflict: "fid" })
    .select()

  if (error) {
    throw new Error(`Failed to create continuous users: ${error.message}`)
  }

  const endTime = Date.now() + durationMinutes * 60 * 1000
  let voteCount = 0

  while (Date.now() < endTime) {
    // Select random user and emoji
    const user = users[Math.floor(Math.random() * users.length)]
    const emojiOption = selectEmojiByWeight()
    const emoji = emojiOption
      ? emojiOption.emoji
      : await getRandomEmojiFromDatabase()

    // Check if this user already voted today
    const { data: existingVote } = await supabase
      .from("votes")
      .select("id")
      .eq("fid", user.fid)
      .eq("vote_date", dateString)
      .single()

    if (!existingVote) {
      const { error: voteError } = await supabase.from("votes").insert({
        user_id: user.id,
        fid: user.fid,
        emoji,
        vote_date: dateString,
      })

      if (!voteError) {
        voteCount++
        console.log(`🗳️  Vote #${voteCount}: ${emoji} by ${user.username}`)
      }
    }

    // Wait for random interval (±50% variation)
    const baseInterval = intervalMinutes * 60 * 1000
    const variation = (Math.random() - 0.5) * baseInterval
    const actualInterval = Math.max(baseInterval + variation, 30000) // Minimum 30 seconds

    await new Promise((resolve) => setTimeout(resolve, actualInterval))
  }

  console.log(
    `✅ Continuous simulation complete! Added ${voteCount} votes over ${durationMinutes} minutes`
  )
}

// Main function to run the simulation
async function runSimulation() {
  try {
    const args = process.argv.slice(2)
    const mode = args[0] || "batch"

    if (mode === "continuous") {
      const intervalMinutes = parseInt(args[1]) || 2
      const durationMinutes = parseInt(args[2]) || 60
      await simulateContinuousVoting(intervalMinutes, durationMinutes)
    } else {
      await simulateRealisticVotes()
    }
  } catch (error) {
    console.error("❌ Simulation failed:", error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  runSimulation()
}
