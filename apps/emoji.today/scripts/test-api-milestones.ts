#!/usr/bin/env tsx

/**
 * API Test script for race commentary milestones
 * Actually calls the real API endpoints with current voting data
 *
 * Usage: yarn workspace emoji.today tsx scripts/test-api-milestones.ts
 */

import { config } from "dotenv"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

// Load environment variables from .env.local
const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, "../.env.local") })

const API_BASE = "http://localhost:3000"
const CRON_SECRET = process.env.CRON_SECRET

if (!CRON_SECRET) {
  console.error("❌ CRON_SECRET environment variable not set")
  console.log('💡 Set it with: export CRON_SECRET="your-secret"')
  process.exit(1)
}

const MILESTONES = [
  { name: "opening", description: "Polls just opened (00:05 UTC)" },
  { name: "1hour", description: "One hour in (01:00 UTC)" },
  { name: "halfway", description: "Halfway point (12:00 UTC)" },
  { name: "final_hour", description: "Final hour (23:00 UTC)" },
  { name: "final_minutes", description: "Final minutes (23:55 UTC)" },
  { name: "daily_summary", description: "Election wrap-up (00:01 UTC)" },
]

async function callMilestoneAPI(milestone: string) {
  try {
    const response = await fetch(
      `${API_BASE}/api/race-commentary/${milestone}`,
      {
        headers: {
          Authorization: `Bearer ${CRON_SECRET}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`)
    }

    return await response.json()
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

function formatAPIResponse(
  milestone: string,
  description: string,
  response: any
) {
  const separator = "=".repeat(80)
  const shortSep = "-".repeat(40)

  console.log(`\n${separator}`)
  console.log(`🎯 ${milestone.toUpperCase()} - ${description.toUpperCase()}`)
  console.log(`${separator}`)

  if (!response.success) {
    console.log("\n❌ API ERROR:")
    console.log(`${shortSep}`)
    console.log(response.error || "Unknown error")
    console.log(`\n${separator}`)
    return
  }

  const snapshot = response.snapshot || {}

  console.log("\n📊 RACE DATA:")
  console.log(`${shortSep}`)
  console.log(`Total Votes: ${snapshot.total_votes || 0}`)
  console.log(`Emoji Count: ${snapshot.emoji_count || 0}`)

  console.log("\n📱 FARCASTER COMMENTARY:")
  console.log(`${shortSep}`)
  console.log(snapshot.commentary || "No commentary generated")

  console.log("\n📺 CHYRON TICKER:")
  console.log(`${shortSep}`)
  console.log(snapshot.chyron || "No chyron generated")

  if (response.farcaster) {
    console.log("\n🐦 FARCASTER STATUS:")
    console.log(`${shortSep}`)
    if (response.farcaster.success) {
      console.log(`✅ Posted successfully: ${response.farcaster.hash}`)
    } else {
      console.log(`❌ Post failed: ${response.farcaster.error}`)
    }
  }

  console.log(`\n${separator}`)
}

async function testAllMilestones() {
  console.log("\n🚀 Testing Race Commentary API Endpoints")
  console.log("Using real voting data from database...\n")
  console.log(`🔗 API Base: ${API_BASE}`)
  console.log(`🔐 CRON_SECRET: ${CRON_SECRET!.slice(0, 8)}...`)

  for (const milestone of MILESTONES) {
    console.log(`\n⏱️  Calling: /api/race-commentary/${milestone.name}`)

    const response = await callMilestoneAPI(milestone.name)

    formatAPIResponse(milestone.name, milestone.description, response)

    // Add a small delay between API calls to be nice
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  console.log("\n✅ API Test complete!")
  console.log("\n💡 Notes:")
  console.log("   • This used real voting data from your database")
  console.log("   • Farcaster errors are expected if credentials not set")
  console.log(
    "   • Each call creates a snapshot in race_commentary_snapshots table"
  )
}

// Run the test
testAllMilestones().catch(console.error)
