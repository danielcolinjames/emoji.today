import { supabase } from "./lib/supabase"

// Define the FID ranges used by various simulation scripts
const FAKE_USER_FID_RANGES = [
  {
    min: 1,
    max: 999,
    description: "Reassign script fake users (clear-votes.js)",
    usernamePattern: "test_user_%",
  },
  { min: 100001, max: 100020, description: "Test users (populate-test-votes)" },
  { min: 200001, max: 200050, description: "Tie test users (create-tie-test)" },
  {
    min: 300001,
    max: 300350,
    description: "Simulation users (simulate-realistic-votes)",
  },
  {
    min: 400001,
    max: 400050,
    description: "Continuous users (simulate-realistic-votes)",
  },
]

async function clearFakeVotes() {
  console.log("🧹 Starting cleanup of fake votes...")

  let totalClearedVotes = 0
  let totalClearedUsers = 0

  for (const range of FAKE_USER_FID_RANGES) {
    console.log(`\n📋 Processing ${range.description}...`)
    console.log(`   FID range: ${range.min} - ${range.max}`)

    let usersQuery = supabase
      .from("users")
      .select("id, fid, username")
      .gte("fid", range.min.toString())
      .lte("fid", range.max.toString())

    // For the reassign script range, also filter by username pattern
    if (range.usernamePattern) {
      usersQuery = usersQuery.like("username", range.usernamePattern)
      console.log(`   Username pattern: ${range.usernamePattern}`)
    }

    // Get all users in this FID range
    const { data: usersToDelete, error: usersError } = await usersQuery

    if (usersError) {
      console.error(
        `❌ Error fetching users for range ${range.min}-${range.max}:`,
        usersError
      )
      continue
    }

    if (!usersToDelete || usersToDelete.length === 0) {
      console.log(`   ✅ No users found in this range`)
      continue
    }

    console.log(`   Found ${usersToDelete.length} fake users`)

    // Show some example usernames for verification
    if (usersToDelete.length > 0) {
      const examples = usersToDelete
        .slice(0, 3)
        .map((u) => `${u.fid}:${u.username}`)
        .join(", ")
      console.log(`   Examples: ${examples}`)
    }

    // Get user IDs for vote deletion
    const userIds = usersToDelete.map((user) => user.id)

    // Delete all votes from these fake users
    const { data: deletedVotes, error: votesError } = await supabase
      .from("votes")
      .delete()
      .in("user_id", userIds)
      .select("id")

    if (votesError) {
      console.error(
        `❌ Error deleting votes for range ${range.min}-${range.max}:`,
        votesError
      )
      continue
    }

    const votesDeleted = deletedVotes?.length || 0
    totalClearedVotes += votesDeleted
    console.log(`   🗳️  Deleted ${votesDeleted} votes`)

    // Delete the fake users
    const { error: deleteUsersError } = await supabase
      .from("users")
      .delete()
      .in("id", userIds)

    if (deleteUsersError) {
      console.error(
        `❌ Error deleting users for range ${range.min}-${range.max}:`,
        deleteUsersError
      )
      continue
    }

    totalClearedUsers += usersToDelete.length
    console.log(`   👥 Deleted ${usersToDelete.length} fake users`)
  }

  console.log("\n" + "=".repeat(50))
  console.log("🎯 CLEANUP SUMMARY")
  console.log("=".repeat(50))
  console.log(`Total fake votes deleted: ${totalClearedVotes}`)
  console.log(`Total fake users deleted: ${totalClearedUsers}`)
  console.log("✅ Fake vote cleanup complete!")

  // Also check for any remaining suspicious users with numerical usernames
  console.log("\n🔍 Checking for other potential fake users...")

  const { data: suspiciousUsers, error: suspiciousError } = await supabase
    .from("users")
    .select("id, fid, username")
    .or(
      "username.like.%sim_user_%,username.like.%testuser%,username.like.%continuous_%,username.like.%tietest%,username.like.%test_user_%"
    )

  if (suspiciousError) {
    console.error("❌ Error checking for suspicious users:", suspiciousError)
  } else if (suspiciousUsers && suspiciousUsers.length > 0) {
    console.log(
      `⚠️  Found ${suspiciousUsers.length} additional suspicious users:`
    )
    suspiciousUsers.forEach((user) => {
      console.log(`   - FID ${user.fid}: ${user.username}`)
    })
    console.log("   Consider reviewing these manually if needed.")
  } else {
    console.log("✅ No additional suspicious users found")
  }
}

// Run the cleanup
clearFakeVotes().catch((error) => {
  console.error("❌ Cleanup failed:", error)
  process.exit(1)
})
