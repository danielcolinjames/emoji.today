#!/usr/bin/env tsx

/**
 * Test script to preview AI-generated creative posts without database operations
 * This focuses only on the text generation part
 *
 * Usage: yarn workspace emoji.today tsx scripts/test-creative-generation.ts
 */

import { config } from "dotenv"
config({ path: ".env.local" })

import { generateModularCommentary } from "../src/lib/race-commentary-service"
import type { RaceSnapshot } from "../src/lib/race-commentary-service"

// Mock data for testing (June 9 data from staging)
const MOCK_SNAPSHOT: RaceSnapshot = {
  vote_date: "2025-06-09",
  milestone: "opening",
  timestamp_utc: new Date().toISOString(),
  total_votes: 18,
  emoji_standings: [
    {
      emoji: "🔥",
      count: 2,
      percentage: 11,
      rank: 1,
      timing_score: 0,
      name: "FIRE",
    },
    {
      emoji: "🔮",
      count: 2,
      percentage: 11,
      rank: 2,
      timing_score: 0,
      name: "CRYSTAL BALL",
    },
    {
      emoji: "💯",
      count: 2,
      percentage: 11,
      rank: 3,
      timing_score: 0,
      name: "HUNDRED POINTS",
    },
    {
      emoji: "🦋",
      count: 1,
      percentage: 6,
      rank: 4,
      timing_score: 0,
      name: "BUTTERFLY",
    },
    {
      emoji: "🍀",
      count: 1,
      percentage: 6,
      rank: 5,
      timing_score: 0,
      name: "FOUR LEAF CLOVER",
    },
    {
      emoji: "💙",
      count: 1,
      percentage: 6,
      rank: 6,
      timing_score: 0,
      name: "BLUE HEART",
    },
    {
      emoji: "💖",
      count: 1,
      percentage: 6,
      rank: 7,
      timing_score: 0,
      name: "SPARKLING HEART",
    },
    {
      emoji: "🌈",
      count: 1,
      percentage: 6,
      rank: 8,
      timing_score: 0,
      name: "RAINBOW",
    },
  ],
  momentum_data: {
    recent_leaders: [
      { emoji: "🔥", recent_votes: 1, trend: "steady" },
      { emoji: "🔮", recent_votes: 1, trend: "steady" },
    ],
    vote_velocity: 2.5,
    dramatic_moments: [],
  },
  historical_context: {
    previous_snapshots: [],
    recent_winners: [
      { date: "2025-06-15", emoji: "🚀", count: 2 },
      { date: "2025-06-14", emoji: "🌈", count: 3 },
      { date: "2025-06-08", emoji: "🔥", count: 2 },
    ],
  },
}

const MILESTONES = [
  { name: "opening", description: "🌅 Opening - Polls just opened" },
  { name: "1hour", description: "📊 1 Hour - Early returns" },
  { name: "halfway", description: "☀️ Halfway - Midday check" },
  { name: "6hours_left", description: "🌇 6 Hours Left - Afternoon update" },
  { name: "3hours_left", description: "🌆 3 Hours Left - Evening update" },
  { name: "final_hour", description: "⏰ Final Hour - Crunch time" },
  { name: "final_minutes", description: "🏁 Final Minutes - Last call" },
  {
    name: "daily_summary",
    description: "🏆 Daily Summary - Winner announcement",
  },
]

async function testCreativeGeneration() {
  console.log("\n🎨 AI Creative Post Generation Test")
  console.log("=" + "=".repeat(79))
  console.log("Testing all milestones with mock data (no database operations)")
  console.log("=" + "=".repeat(79))

  // Check for OpenRouter API key
  if (!process.env.OPENROUTER_API_KEY) {
    console.error("\n❌ Missing OPENROUTER_API_KEY in .env.local")
    process.exit(1)
  }

  console.log("\n📊 Mock Race Data:")
  console.log(`   Date: June 9, 2025`)
  console.log(`   Total Votes: 18`)
  console.log(`   Leaders: 🔥🔮💯 (tied at 2 votes each)`)
  console.log(`   Yesterday's Winner: 🔥\n`)

  for (const milestone of MILESTONES) {
    console.log(`\n${milestone.description}`)
    console.log("-".repeat(80))

    try {
      // Update milestone in snapshot
      const snapshot = { ...MOCK_SNAPSHOT, milestone: milestone.name }

      console.log("⏳ Generating creative post...")
      const startTime = Date.now()

      // This is the actual function we're testing
      const commentary = await generateModularCommentary(
        milestone.name,
        snapshot
      )

      const duration = Date.now() - startTime

      console.log(`\n📱 GENERATED POST:`)
      console.log(`"${commentary}"`)
      console.log(`\n✅ Length: ${commentary.length} chars`)
      console.log(`⏱️ Generated in: ${duration}ms`)

      // Check for creativity indicators
      const hasEmojis = /[\uD83C-\uDBFF\uDC00-\uDFFF]+|[\u2600-\u27BF]/.test(
        commentary
      )
      const isFormulaic =
        commentary.includes("leads with") &&
        commentary.includes("votes in the election")

      if (isFormulaic) {
        console.log(`⚠️ Warning: This looks like a fallback message`)
      } else {
        console.log(`✨ Creative generation successful!`)
      }
    } catch (error) {
      console.error(
        `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`
      )
    }

    // Small delay between milestones
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  console.log("\n" + "=".repeat(80))
  console.log(
    "✅ Test complete! Check the posts above for creativity and variety."
  )
  console.log(
    "\n💡 Each post should be unique and avoid formulaic patterns like:"
  )
  console.log('   ❌ "X leads with Y votes in the election for..."')
  console.log("   ✅ Creative, engaging, varied language")
}

// Run the test
testCreativeGeneration().catch(console.error)
