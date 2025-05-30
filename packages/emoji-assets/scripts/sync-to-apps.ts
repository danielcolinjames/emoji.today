#!/usr/bin/env tsx

import { existsSync, mkdirSync } from "fs"
import { execSync } from "child_process"
import path from "path"

// Use process.cwd() for more reliable path resolution
const EMOJI_ASSETS_BASE = path.join(process.cwd(), "images")
const APPS_DIR = path.join(process.cwd(), "../../apps")

// List of apps that need emoji assets
const APPS_WITH_EMOJI = ["emoji.today", "staging.emoji.today"]

// Image sizes to sync
const IMAGE_SIZES = ["apple-160", "apple-80"]

function syncEmojiAssets() {
  console.log("🎨 Syncing emoji assets to web apps...")
  console.log("📁 Working from:", process.cwd())
  console.log("📁 Apps directory:", APPS_DIR)

  APPS_WITH_EMOJI.forEach((appName) => {
    const appDir = path.join(APPS_DIR, appName)
    const publicDir = path.join(appDir, "public")
    const emojiAssetsBaseDir = path.join(publicDir, "emoji-assets")

    console.log(`\n🔍 Checking app: ${appName}`)

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
    if (!existsSync(emojiAssetsBaseDir)) {
      mkdirSync(emojiAssetsBaseDir, { recursive: true })
    }

    // Sync each size directory
    IMAGE_SIZES.forEach((sizeDir) => {
      const sourceDir = path.join(EMOJI_ASSETS_BASE, sizeDir)
      const targetDir = path.join(emojiAssetsBaseDir, sizeDir)

      if (!existsSync(sourceDir)) {
        console.log(
          `⚠️  Source directory ${sizeDir} doesn't exist, skipping...`
        )
        return
      }

      if (!existsSync(targetDir)) {
        mkdirSync(targetDir, { recursive: true })
      }

      console.log(`📁 Syncing ${sizeDir} to ${appName}...`)
      console.log(`   Source: ${sourceDir}`)
      console.log(`   Target: ${targetDir}`)

      // Copy all emoji images
      try {
        execSync(`cp -r "${sourceDir}"/* "${targetDir}"/`, {
          stdio: "inherit",
        })
        console.log(`✅ Successfully synced ${sizeDir} to ${appName}`)
      } catch (error) {
        console.error(`❌ Failed to sync ${sizeDir} to ${appName}:`, error)
      }
    })
  })

  console.log("\n🎉 Emoji assets sync complete!")
}

// Run if this script is executed directly
if (require.main === module) {
  syncEmojiAssets()
}

export { syncEmojiAssets }
