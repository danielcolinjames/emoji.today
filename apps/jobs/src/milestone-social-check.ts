#!/usr/bin/env node

import { MilestoneSocialPoster } from "./content-generation/milestone-social-poster"

async function runMilestoneCheck() {
  console.log("🎯 Starting milestone-based social media check...")

  try {
    const poster = new MilestoneSocialPoster()
    await poster.checkAndPostMilestones()

    console.log("✅ Milestone check completed successfully")
    process.exit(0)
  } catch (error) {
    console.error("❌ Milestone check failed:", error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  runMilestoneCheck()
}

export { runMilestoneCheck }
