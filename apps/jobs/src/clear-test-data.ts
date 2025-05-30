import { supabase } from "./lib/supabase"

async function clearTestData() {
  console.log("Clearing test data...")

  try {
    // Delete test votes
    const { error: votesError } = await supabase
      .from("votes")
      .delete()
      .ilike("user_id", "%") // This will delete all votes - be careful!

    if (votesError) {
      console.error("Failed to delete votes:", votesError.message)
    } else {
      console.log("✓ Cleared all votes")
    }

    // Delete test users (fids 100001-100020)
    const { error: usersError } = await supabase
      .from("users")
      .delete()
      .gte("fid", "100001")
      .lte("fid", "100020")

    if (usersError) {
      console.error("Failed to delete test users:", usersError.message)
    } else {
      console.log("✓ Cleared test users")
    }

    // Clear daily results
    const { error: resultsError } = await supabase
      .from("daily_results")
      .delete()
      .ilike("vote_date", "%") // This will delete all results - be careful!

    if (resultsError) {
      console.error("Failed to delete daily results:", resultsError.message)
    } else {
      console.log("✓ Cleared daily results")
    }

    console.log("\n✅ Test data cleared successfully!")
  } catch (error) {
    console.error("❌ Failed to clear test data:", error)
    throw error
  }
}

// Run the script if called directly
if (require.main === module) {
  clearTestData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}
