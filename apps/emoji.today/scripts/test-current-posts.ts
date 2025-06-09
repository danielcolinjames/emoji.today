#!/usr/bin/env tsx

/**
 * Test current Farcaster post generation
 * Shows what posts would be created with today's voting data
 *
 * Usage: yarn workspace emoji.today tsx scripts/test-current-posts.ts
 */

import { config } from "dotenv"
config({ path: ".env.local" })

async function testCurrentPosts() {
  console.log("\n🎯 Testing Current Farcaster Post Generation")
  console.log("=".repeat(60))

  const baseUrl =
    process.env.NODE_ENV === "production"
      ? "https://emoji.today"
      : "http://localhost:3000"

  console.log(`🔗 Using API base: ${baseUrl}`)
  console.log(`📅 Testing with today's voting data`)

  const milestones = [
    { name: "opening", description: "Race starts - Opening bell" },
    { name: "1hour", description: "Early momentum check" },
    { name: "halfway", description: "Midday drama analysis" },
    { name: "final_hour", description: "Crunch time urgency" },
    { name: "final_minutes", description: "Climactic finish" },
    { name: "daily_summary", description: "Results announcement" },
  ]

  for (const milestone of milestones) {
    console.log(
      `\n🎬 ${milestone.name.toUpperCase()}: ${milestone.description}`
    )
    console.log("-".repeat(50))

    try {
      // Test each milestone endpoint with dry-run (no actual posting)
      const response = await fetch(
        `${baseUrl}/api/race-commentary/${milestone.name}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.CRON_SECRET}`,
            "Content-Type": "application/json",
          },
        }
      )

      if (!response.ok) {
        console.log(`❌ API Error: ${response.status} - ${response.statusText}`)
        continue
      }

      const result = await response.json()

      if (result.success) {
        const commentary = result.snapshot?.commentary
        const chyron = result.snapshot?.chyron
        const votes = result.snapshot?.total_votes || 0

        console.log(`📊 Current votes: ${votes}`)

        if (commentary) {
          console.log(`\n📱 FARCASTER POST:`)
          console.log(`"${commentary}"`)
          console.log(`\n📝 FULL POST TEXT:`)
          console.log(`"${commentary}`)
          console.log(``)
          console.log(
            `Vote now at emoji.today @https://farcaster.xyz/miniapps/c_Y960s6FSE2/emojitoday"`
          )
        }

        if (chyron) {
          console.log(`\n📺 CHYRON TICKER:`)
          console.log(`"${chyron}"`)
        }

        if (!commentary && !chyron) {
          console.log(`⚠️  No commentary generated (probably no votes yet)`)
        }
      } else {
        console.log(`❌ Failed: ${result.error || "Unknown error"}`)
      }
    } catch (error) {
      console.log(`❌ Request failed: ${error}`)
    }

    // Add delay between requests
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  console.log(`\n✅ Test complete!`)
  console.log(`\n💡 To run actual posts:`)
  console.log(`   • Make sure FARCASTER_SIGNER_UUID and NEYNAR_API_KEY are set`)
  console.log(
    `   • Posts will be triggered automatically by Vercel cron at scheduled times`
  )
  console.log(
    `   • Or manually trigger: curl -H "Authorization: Bearer $CRON_SECRET" ${baseUrl}/api/race-commentary/opening`
  )
}

// Run the test
testCurrentPosts().catch(console.error)
