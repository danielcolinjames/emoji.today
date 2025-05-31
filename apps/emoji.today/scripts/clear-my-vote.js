#!/usr/bin/env node

/**
 * Development script to clear your vote for today
 * Usage: node scripts/clear-my-vote.js
 *
 * This allows you to vote multiple times during development/testing
 */

import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, "../.env.local") })

if (process.env.NODE_ENV === "production") {
  console.error("🚫 This script is only for development mode!")
  process.exit(1)
}

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function clearMyVote() {
  try {
    // Get your FID from command line argument or prompt
    const fid = process.argv[2]

    if (!fid) {
      console.error("❌ Please provide your FID as an argument:")
      console.error("   node scripts/clear-my-vote.js YOUR_FID")
      console.error("   Example: node scripts/clear-my-vote.js 12345")
      process.exit(1)
    }

    const today = new Date().toISOString().split("T")[0] // YYYY-MM-DD format

    console.log(`🗑️  Clearing votes for FID ${fid} on ${today}...`)

    // First, check what votes exist
    const { data: existingVotes, error: checkError } = await supabase
      .from("votes")
      .select("*")
      .eq("fid", fid)
      .eq("vote_date", today)

    if (checkError) {
      throw checkError
    }

    if (existingVotes.length === 0) {
      console.log("✅ No votes found for today - you can vote freely!")
      return
    }

    console.log(`📊 Found ${existingVotes.length} vote(s):`)
    existingVotes.forEach((vote) => {
      console.log(`   - ${vote.emoji} (ID: ${vote.id})`)
    })

    // Clear the votes
    const { error: deleteError } = await supabase
      .from("votes")
      .delete()
      .eq("fid", fid)
      .eq("vote_date", today)

    if (deleteError) {
      throw deleteError
    }

    console.log("✅ Votes cleared! You can now vote again.")
    console.log("🔄 Refresh your browser and try voting again.")
  } catch (error) {
    console.error("❌ Error clearing votes:", error.message)
    process.exit(1)
  }
}

// Run the script
clearMyVote()
