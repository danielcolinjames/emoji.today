#!/usr/bin/env tsx

import { existsSync, mkdirSync } from "fs"
import { execSync } from "child_process"
import path from "path"

// Use process.cwd() for more reliable path resolution
const EMOJI_ASSETS_DIR = path.join(process.cwd(), "images/apple-160")
const APPS_DIR = path.join(process.cwd(), "../../apps")

// List of apps that need emoji assets
const APPS_WITH_EMOJI = ["emoji.today", "staging.emoji.today"]

function syncEmojiAssets() {
  console.log("🎨 Syncing emoji assets to web apps...")
  console.log("📁 Working from:", process.cwd())
  console.log("📁 Apps directory:", APPS_DIR)

  APPS_WITH_EMOJI.forEach((appName) => {
    const appDir = path.join(APPS_DIR, appName)
    const publicDir = path.join(appDir, "public")
    const emojiAssetsDir = path.join(publicDir, "emoji-assets/apple-160")

    console.log(`🔍 Checking app: ${appDir}`)

    if (!existsSync(appDir)) {
      console.log(`⚠️  App ${appName} doesn't exist at ${appDir}, skipping...`)
      return
    }

    if (!existsSync(publicDir)) {
      console.log(
        `⚠️  Public directory for ${appName} doesn't exist at ${publicDir}, skipping...`
      )
      return
    }

    // Create emoji-assets directory if it doesn't exist
    if (!existsSync(path.dirname(emojiAssetsDir))) {
      mkdirSync(path.dirname(emojiAssetsDir), { recursive: true })
    }

    if (!existsSync(emojiAssetsDir)) {
      mkdirSync(emojiAssetsDir, { recursive: true })
    }

    console.log(`📁 Syncing to ${appName}...`)
    console.log(`   Source: ${EMOJI_ASSETS_DIR}`)
    console.log(`   Target: ${emojiAssetsDir}`)

    // Copy all emoji images
    try {
      execSync(`cp -r "${EMOJI_ASSETS_DIR}"/* "${emojiAssetsDir}"/`, {
        stdio: "inherit",
      })
      console.log(`✅ Successfully synced emoji assets to ${appName}`)
    } catch (error) {
      console.error(`❌ Failed to sync to ${appName}:`, error)
    }
  })

  console.log("\n🎉 Emoji assets sync complete!")
}

// Run if this script is executed directly
if (require.main === module) {
  syncEmojiAssets()
}

export { syncEmojiAssets }
