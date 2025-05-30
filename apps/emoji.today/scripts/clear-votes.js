#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Using service role key for admin operations
)

async function clearUserVote(fid) {
  try {
    console.log(`Clearing vote for FID: ${fid}`)

    const today = new Date().toISOString().split("T")[0]

    // Delete today's vote for this FID directly
    const { data, error } = await supabase
      .from("votes")
      .delete()
      .eq("fid", fid)
      .eq("vote_date", today)

    if (error) {
      console.error("Error clearing vote:", error)
      return
    }

    console.log(`✅ Cleared vote for FID ${fid} on ${today}`)
  } catch (error) {
    console.error("Error:", error)
  }
}

async function clearAllVotesToday() {
  try {
    const today = new Date().toISOString().split("T")[0]

    console.log(`⚠️  Clearing ALL votes for ${today}...`)

    const { data, error } = await supabase
      .from("votes")
      .delete()
      .eq("vote_date", today)

    if (error) {
      console.error("Error clearing all votes:", error)
      return
    }

    console.log(`✅ Cleared all votes for ${today}`)
  } catch (error) {
    console.error("Error:", error)
  }
}

async function reassignUserVoteToRandomFid(fid) {
  try {
    console.log(`Reassigning vote from FID: ${fid} to random FID`)

    const today = new Date().toISOString().split("T")[0]

    // Get user by FID
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("fid", fid)
      .single()

    if (userError) {
      console.log("User not found in database - no vote to reassign")
      return
    }

    // Generate random FID between 1-999
    const randomFid = Math.floor(Math.random() * 999) + 1

    // Create or get random user
    const { data: randomUser, error: randomUserError } = await supabase
      .from("users")
      .upsert({
        fid: randomFid,
        username: `test_user_${randomFid}`,
      })
      .select("id")
      .single()

    if (randomUserError) {
      console.error("Error creating random user:", randomUserError)
      return
    }

    // Update the vote to belong to the random user
    const { data, error } = await supabase
      .from("votes")
      .update({ user_id: randomUser.id })
      .eq("user_id", user.id)
      .eq("vote_date", today)

    if (error) {
      console.error("Error reassigning vote:", error)
      return
    }

    console.log(
      `✅ Reassigned vote from FID ${fid} to random FID ${randomFid} on ${today}`
    )
  } catch (error) {
    console.error("Error:", error)
  }
}

// Parse command line arguments
const command = process.argv[2]
const fid = process.argv[3]

async function main() {
  switch (command) {
    case "clear":
      if (!fid) {
        console.error("Usage: node scripts/clear-votes.js clear <FID>")
        process.exit(1)
      }
      await clearUserVote(parseInt(fid))
      break

    case "clear-all":
      console.log(
        "Are you sure you want to clear ALL votes for today? This cannot be undone."
      )
      console.log("Press Ctrl+C to cancel, or wait 5 seconds to continue...")

      await new Promise((resolve) => setTimeout(resolve, 5000))
      await clearAllVotesToday()
      break

    case "reassign":
      if (!fid) {
        console.error("Usage: node scripts/clear-votes.js reassign <FID>")
        process.exit(1)
      }
      await reassignUserVoteToRandomFid(parseInt(fid))
      break

    default:
      console.log("Available commands:")
      console.log("  clear <FID>     - Clear vote for specific FID")
      console.log("  clear-all       - Clear ALL votes for today (careful!)")
      console.log("  reassign <FID>  - Reassign vote to random FID")
      console.log("")
      console.log("Examples:")
      console.log("  node scripts/clear-votes.js clear 1234")
      console.log("  node scripts/clear-votes.js reassign 1234")
      console.log("  node scripts/clear-votes.js clear-all")
      console.log("")
      console.log("Or use yarn scripts:")
      console.log("  yarn clear-vote 1234")
      console.log("  yarn reassign-vote 1234")
      console.log("  yarn clear-all-votes")
      break
  }
}

main()
