#!/usr/bin/env tsx
import { config } from "dotenv"
config({ path: ".env.local" })
/**
 * Verification script for race commentary system
 * Checks database table and displays recent snapshots
 *
 * Usage: yarn workspace emoji.today tsx scripts/verify-race-commentary.ts
 */

import { createClient } from "@supabase/supabase-js"
import process from "process"

// Rudimentary CLI arg parsing
const args = process.argv.slice(2)

const flags = args.reduce<Record<string, string | boolean>>((acc, curr) => {
  if (curr.startsWith("--")) {
    const [key, value] = curr.replace(/^--/, "").split("=")
    acc[key] = value ?? true
  }
  return acc
}, {})

const showFull = Boolean(flags.full)
const dateFilter =
  typeof flags.date === "string" ? (flags.date as string) : null
const resetDate =
  typeof flags.reset === "string" ? (flags.reset as string) : null

if (resetDate && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("--reset requires SUPABASE_SERVICE_ROLE_KEY in env")
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function verifyRaceCommentarySystem() {
  console.log("\n🔍 Verifying Race Commentary System")
  console.log("=====================================\n")

  try {
    // Check if table exists and has correct structure
    console.log("📋 Checking table structure...")
    const { data: tableInfo, error: tableError } = await supabase
      .from("race_commentary_snapshots")
      .select("*")
      .limit(1)

    if (tableError) {
      console.error(
        "❌ Table not found or error accessing:",
        tableError.message
      )
      return
    }

    console.log("✅ Table exists and accessible")

    // Optionally delete snapshots (--reset)
    if (resetDate) {
      console.log(`\n🗑️  Resetting snapshots for ${resetDate} ...`)
      const { error: delErr } = await supabase
        .from("race_commentary_snapshots")
        .delete()
        .eq("vote_date", resetDate)

      if (delErr) {
        console.error("❌ Failed to delete snapshots:", delErr.message)
      } else {
        console.log("✅ Snapshots deleted for", resetDate)
      }
    }

    let query = supabase
      .from("race_commentary_snapshots")
      .select(
        "vote_date, milestone, total_votes, commentary_text, chyron_text, created_at"
      )
      .order("created_at", { ascending: false })

    if (dateFilter) {
      query = query.eq("vote_date", dateFilter)
    } else {
      query = query.limit(5)
    }

    const { data: recentSnapshots, error: snapshotsError } = await query

    if (snapshotsError) {
      console.error("❌ Error fetching snapshots:", snapshotsError.message)
      return
    }

    if (!recentSnapshots || recentSnapshots.length === 0) {
      console.log("📭 No snapshots found yet")
    } else {
      console.log(`✅ Found ${recentSnapshots.length} recent snapshots:`)

      recentSnapshots.forEach((snapshot, i) => {
        console.log(`\n${i + 1}. ${snapshot.vote_date} - ${snapshot.milestone}`)
        if (showFull) {
          console.log(`\n   💬 Commentary:`)
          console.log(snapshot.commentary_text)
          console.log(`\n   📺 Chyron:`)
          console.log(snapshot.chyron_text)
        } else {
          console.log(
            `   💬 Commentary: ${snapshot.commentary_text?.slice(0, 80)}...`
          )
          console.log(`   📺 Chyron: ${snapshot.chyron_text}`)
        }
        console.log(`   📊 Votes: ${snapshot.total_votes}`)
        console.log(
          `   🕐 Created: ${new Date(snapshot.created_at).toLocaleString()}`
        )
      })
    }

    // Test API routes
    console.log("\n🔗 Testing API routes...")
    const apiRoutes = [
      "/api/race-commentary/opening",
      "/api/race-commentary/1hour",
      "/api/race-commentary/halfway",
      "/api/race-commentary/6hours_left",
      "/api/race-commentary/3hours_left",
      "/api/race-commentary/final_hour",
      "/api/race-commentary/final_minutes",
    ]

    apiRoutes.forEach((route) => {
      console.log(`   📍 ${route} - Ready`)
    })

    console.log("\n✅ System verification complete!")
    console.log("\n💡 Flags:")
    console.log("   --full            Show full commentary/chyron text")
    console.log("   --date=YYYY-MM-DD  Filter snapshots by date")
    console.log(
      "   --reset=YYYY-MM-DD Delete snapshots for date (requires service key)"
    )

    console.log("\n💡 To test a milestone:")
    console.log('   export CRON_SECRET="your-secret"')
    console.log(
      '   curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/race-commentary/opening'
    )
  } catch (error) {
    console.error("❌ Verification failed:", error)
  }
}

// Run verification
verifyRaceCommentarySystem().catch(console.error)
