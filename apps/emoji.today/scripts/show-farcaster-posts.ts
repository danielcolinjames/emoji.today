#!/usr/bin/env tsx

/**
 * Show what would be posted to Farcaster for race commentary milestones
 * Displays the exact text that would be sent to the Farcaster API
 *
 * Usage: yarn workspace emoji.today tsx scripts/show-farcaster-posts.ts
 */

import { config } from "dotenv"
config({ path: ".env.local" })

async function showFarcasterPosts() {
  console.log("\n📱 FARCASTER POSTS - EXACT TEXT THAT WOULD BE POSTED")
  console.log("=".repeat(80))

  const baseUrl =
    process.env.NODE_ENV === "production"
      ? "https://emoji.today"
      : "http://localhost:3000"

  console.log(`🔗 API: ${baseUrl}`)
  console.log(`📅 Using today's actual voting data\n`)

  const milestones = [
    {
      name: "opening",
      description: "Race starts - Opening bell",
      time: "00:05 UTC",
    },
    { name: "1hour", description: "Early momentum check", time: "01:00 UTC" },
    {
      name: "halfway",
      description: "Midday drama analysis",
      time: "12:00 UTC",
    },
    {
      name: "final_hour",
      description: "Crunch time urgency",
      time: "23:00 UTC",
    },
    {
      name: "final_minutes",
      description: "Climactic finish",
      time: "23:55 UTC",
    },
    {
      name: "daily_summary",
      description: "Results announcement",
      time: "00:01 UTC",
    },
  ]

  for (const milestone of milestones) {
    console.log(`\n🎬 ${milestone.name.toUpperCase()} (${milestone.time})`)
    console.log(`${milestone.description}`)
    console.log("-".repeat(60))

    try {
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

      if (result.success && result.snapshot?.commentary) {
        const commentary = result.snapshot.commentary
        const votes = result.snapshot.total_votes || 0

        // This is exactly what gets posted to Farcaster
        const finalPostText = `${commentary}`

        console.log(`📊 Votes: ${votes}`)
        console.log(`📏 Length: ${finalPostText.length} chars`)
        console.log(``)
        console.log(`📱 EXACT FARCASTER POST TEXT:`)
        console.log(`┌${"─".repeat(78)}┐`)

        // Split into lines and show with borders
        const lines = finalPostText.split("\n")
        lines.forEach((line) => {
          // Handle long lines by wrapping
          if (line.length <= 76) {
            console.log(`│ ${line.padEnd(76)} │`)
          } else {
            // Simple word wrap for long lines
            const words = line.split(" ")
            let currentLine = ""

            words.forEach((word) => {
              if ((currentLine + word).length <= 76) {
                currentLine += (currentLine ? " " : "") + word
              } else {
                if (currentLine) {
                  console.log(`│ ${currentLine.padEnd(76)} │`)
                }
                currentLine = word
              }
            })

            if (currentLine) {
              console.log(`│ ${currentLine.padEnd(76)} │`)
            }
          }
        })

        console.log(`└${"─".repeat(78)}┘`)

        // Show length warning if over Farcaster limit
        if (finalPostText.length > 280) {
          console.log(
            `⚠️  WARNING: ${finalPostText.length} chars exceeds Farcaster's 280 char limit!`
          )
        } else if (finalPostText.length > 250) {
          console.log(
            `⚠️  CAUTION: ${finalPostText.length} chars is close to Farcaster's 280 char limit`
          )
        } else {
          console.log(`✅ Good length: ${finalPostText.length}/280 chars`)
        }
      } else {
        console.log(
          `⚠️  No commentary generated (${result.error || "no votes yet"})`
        )
      }
    } catch (error) {
      console.log(`❌ Request failed: ${error}`)
    }

    // Delay between requests
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  console.log(`\n✅ Complete!`)
  console.log(
    `\n💡 This shows the exact text that would be posted to Farcaster`
  )
  console.log(`   when the automated cron jobs run at the scheduled times.`)
}

// Run the script
showFarcasterPosts().catch(console.error)
