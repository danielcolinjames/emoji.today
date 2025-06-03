#!/usr/bin/env node

import { TickerGenerator } from "./content-generation/ticker-generator"

async function runTickerUpdate() {
  console.log("📰 Starting ticker content update...")

  try {
    const ticker = new TickerGenerator()
    await ticker.updateTickerQueue()

    console.log("✅ Ticker content update completed successfully")
    process.exit(0)
  } catch (error) {
    console.error("❌ Ticker content update failed:", error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  runTickerUpdate()
}

export { runTickerUpdate }
