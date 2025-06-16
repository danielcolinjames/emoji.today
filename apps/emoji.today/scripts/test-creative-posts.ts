#!/usr/bin/env tsx

/**
 * Test script to generate creative AI posts for different milestones
 * Forces regeneration even if snapshots already exist
 *
 * Usage: yarn workspace emoji.today tsx scripts/test-creative-posts.ts
 */

import { config } from "dotenv"
config({ path: ".env.local" })

import { createRaceSnapshot } from "../src/lib/race-commentary-service"
import { formatInTimeZone } from "date-fns-tz"

const MILESTONES_TO_TEST = [
  { milestone: "opening", description: "🌅 Opening - Polls just opened" },
  { milestone: "1hour", description: "📊 1 Hour - Early returns" },
  { milestone: "halfway", description: "☀️ Halfway - Midday check" },
  {
    milestone: "6hours_left",
    description: "🌇 6 Hours Left - Afternoon update",
  },
  { milestone: "3hours_left", description: "🌆 3 Hours Left - Evening update" },
  { milestone: "final_hour", description: "⏰ Final Hour - Crunch time" },
  { milestone: "final_minutes", description: "🏁 Final Minutes - Last call" },
]

async function testCreativePosts() {
  console.log("\n🎨 Testing Creative Post Generation")
  console.log("=" + "=".repeat(79))
  console.log("Generating AI-powered posts with improved creative prompts...")
  console.log("=" + "=".repeat(79))

  // Check required environment variables
  const requiredEnvVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "OPENROUTER_API_KEY",
  ]

  const missingVars = requiredEnvVars.filter((v) => !process.env[v])
  if (missingVars.length > 0) {
    console.error("\n❌ Missing required environment variables:")
    missingVars.forEach((v) => console.error(`   - ${v}`))
    console.error(
      "\nMake sure you have a .env.local file with these variables set."
    )
    process.exit(1)
  }

  console.log("\n✅ Environment variables loaded successfully")
  console.log(
    "💡 Make sure your .env.local is pointing to the STAGING Supabase branch"
  )
  console.log("   (The staging branch has test vote data)")

  // Show which OpenRouter model is being used
  const commentaryModel =
    process.env.OPENROUTER_COMMENTARY_MODEL || "x-ai/grok-3-mini-beta"
  console.log(`🤖 Using OpenRouter model: ${commentaryModel}`)
  console.log(
    `🔑 OpenRouter API Key: ${
      process.env.OPENROUTER_API_KEY ? "Set ✓" : "Missing ✗"
    }\n`
  )

  // Quick test of OpenRouter API
  console.log("🧪 Testing OpenRouter API connection...")
  try {
    const testResponse = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: commentaryModel,
          messages: [
            {
              role: "user",
              content: "Say 'Hello emoji world!' and nothing else.",
            },
          ],
          max_tokens: 20,
        }),
      }
    )

    if (!testResponse.ok) {
      const errorText = await testResponse.text()
      console.error(`❌ OpenRouter API test failed: ${testResponse.status}`)
      console.error(`Error: ${errorText}`)
      console.error("\nPlease check your OPENROUTER_API_KEY in .env.local")
      process.exit(1)
    }

    const testJson = (await testResponse.json()) as any
    console.log(
      `✅ OpenRouter API is working! Test response: "${testJson.choices?.[0]?.message?.content}"\n`
    )
  } catch (error) {
    console.error("❌ Failed to connect to OpenRouter API:", error)
    console.error(
      "\nPlease check your OPENROUTER_API_KEY and internet connection"
    )
    process.exit(1)
  }

  // Use June 9, 2025 which has 18 votes in staging
  const testDate = "2025-06-09"
  console.log(
    `📅 Using date with vote data: ${testDate} (18 votes in staging)\n`
  )

  // Daily summary needs to use the day before our test date
  const summaryDate = "2025-06-08"

  // Test current day milestones
  for (const { milestone, description } of MILESTONES_TO_TEST) {
    console.log(`\n${description}`)
    console.log("-".repeat(80))

    try {
      const result = await createRaceSnapshot(milestone, true, testDate)

      if (result.success && result.snapshot?.commentary_text) {
        console.log(`\n📱 GENERATED POST:`)
        console.log(`"${result.snapshot.commentary_text}"`)
        console.log(
          `\n✅ Length: ${result.snapshot.commentary_text.length} chars`
        )
        console.log(`📊 Based on: ${result.snapshot.total_votes} votes`)

        if (result.snapshot.emoji_standings.length > 0) {
          const topEmojis = result.snapshot.emoji_standings
            .slice(0, 3)
            .map((s) => `${s.rank}. ${s.emoji} (${s.count}v)`)
            .join(" ")
          console.log(`🏆 Leaders: ${topEmojis}`)
        }
      } else {
        console.log(`❌ Failed: ${result.error || "Unknown error"}`)
      }
    } catch (error) {
      console.error(
        `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`
      )
    }
  }

  // Test daily summary with yesterday's data
  console.log(`\n🏆 Daily Summary - Yesterday's winner`)
  console.log("-".repeat(80))

  try {
    const result = await createRaceSnapshot("daily_summary", true, summaryDate)

    if (result.success && result.snapshot?.commentary_text) {
      console.log(`\n📱 GENERATED POST:`)
      console.log(`"${result.snapshot.commentary_text}"`)
      console.log(
        `\n✅ Length: ${result.snapshot.commentary_text.length} chars`
      )
      console.log(`📊 Final results: ${result.snapshot.total_votes} votes`)

      if (result.snapshot.emoji_standings.length > 0) {
        const winner = result.snapshot.emoji_standings[0]
        console.log(
          `🏆 Winner: ${winner.emoji} with ${winner.count} votes (${winner.percentage}%)`
        )
      }
    } else {
      console.log(`❌ Failed: ${result.error || "Unknown error"}`)
    }
  } catch (error) {
    console.error(
      `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`
    )
  }

  console.log("\n" + "=".repeat(80))
  console.log(
    "✨ Test complete! Posts above show the new creative AI generation."
  )
  console.log(
    "\n💡 Each post should be unique and creative, avoiding formulaic patterns."
  )
}

// Run the test
testCreativePosts().catch(console.error)
