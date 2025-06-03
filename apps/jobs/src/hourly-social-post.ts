#!/usr/bin/env node

import { SocialPoster } from "./content-generation/social-poster"

async function runHourlySocialPost() {
  console.log("📅 Starting hourly social media posting job...")

  try {
    const poster = new SocialPoster()
    await poster.postHourlyUpdate()

    console.log("✅ Hourly social media posting completed successfully")
    process.exit(0)
  } catch (error) {
    console.error("❌ Hourly social media posting failed:", error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  runHourlySocialPost()
}

export { runHourlySocialPost }
