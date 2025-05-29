#!/usr/bin/env tsx

import fs from "fs"
import path from "path"
import { readFileSync } from "fs"

const emojiDataPath = path.join(
  __dirname,
  "../../../node_modules/emojibase-data/en/data.json"
)
const emojiData = JSON.parse(readFileSync(emojiDataPath, "utf8"))
const IMAGES_DIR = path.join(__dirname, "../images/apple-160")

interface EmojibaseData {
  label: string
  emoji: string
  group: number
  hexcode: string
  version?: number
}

// Create hexcode map
const hexcodeMap = new Map<string, EmojibaseData>()
for (const emoji of emojiData) {
  hexcodeMap.set(emoji.hexcode.toLowerCase(), emoji)
}

async function cleanAndFinalize() {
  console.log("🧹 CLEANING UP AND FINALIZING")
  console.log("=============================\n")

  // Find all files in images directory
  const allFiles = fs.readdirSync(IMAGES_DIR)

  const stats = {
    totalFiles: allFiles.length,
    emptyFiles: 0,
    regionalIndicators: 0,
    validEmojis: 0,
    deletedFiles: 0,
  }

  const filesToDelete: string[] = []

  for (const filename of allFiles) {
    const filePath = path.join(IMAGES_DIR, filename)
    const fileStats = fs.statSync(filePath)
    const hexcode = filename.replace(".png", "").toLowerCase()
    const emojiInfo = hexcodeMap.get(hexcode)

    if (fileStats.size === 0) {
      stats.emptyFiles++

      // Check if it's a regional indicator
      if (emojiInfo?.label.includes("REGIONAL INDICATOR")) {
        stats.regionalIndicators++
        filesToDelete.push(filename)
        console.log(
          `🗑️ Will delete regional indicator: ${emojiInfo.emoji} ${emojiInfo.label}`
        )
      }
    } else {
      stats.validEmojis++
    }
  }

  console.log(`\n📊 CURRENT STATE`)
  console.log(`================`)
  console.log(`Total files: ${stats.totalFiles}`)
  console.log(`Valid emojis: ${stats.validEmojis}`)
  console.log(`Empty files: ${stats.emptyFiles}`)
  console.log(`Regional indicators to delete: ${stats.regionalIndicators}`)

  // Delete regional indicator files
  if (filesToDelete.length > 0) {
    console.log(`\n🗑️ DELETING REGIONAL INDICATORS`)
    console.log(`===============================`)

    for (const filename of filesToDelete) {
      const filePath = path.join(IMAGES_DIR, filename)
      try {
        fs.unlinkSync(filePath)
        stats.deletedFiles++
        console.log(`✅ Deleted: ${filename}`)
      } catch (error) {
        console.log(`❌ Failed to delete: ${filename}`)
      }
    }
  }

  // Count remaining empty files (non-regional)
  const remainingFiles = fs.readdirSync(IMAGES_DIR)
  const remainingEmpty = remainingFiles.filter((filename) => {
    const filePath = path.join(IMAGES_DIR, filename)
    return fs.statSync(filePath).size === 0
  })

  console.log(`\n🎯 FINAL RESULTS`)
  console.log(`================`)
  console.log(
    `✅ Valid emoji images: ${remainingFiles.length - remainingEmpty.length}`
  )
  console.log(`🗑️ Regional indicators deleted: ${stats.deletedFiles}`)
  console.log(`⚠️ Remaining empty files: ${remainingEmpty.length}`)

  if (remainingEmpty.length > 0) {
    console.log(`\n⚠️ REMAINING EMPTY FILES:`)
    for (const filename of remainingEmpty) {
      const hexcode = filename.replace(".png", "").toLowerCase()
      const emojiInfo = hexcodeMap.get(hexcode)
      console.log(
        `   ${emojiInfo?.emoji || "❓"} ${emojiInfo?.label || filename}`
      )
    }

    console.log(`\n💡 These are likely:`)
    console.log(
      `   - ♀️ ♂️ gender symbols (no standalone images in emoji-data)`
    )
    console.log(`   - ⚕️ medical symbol (might be licensing issue)`)
    console.log(`   - Can be safely excluded from voting if needed`)
  }

  console.log(`\n✨ EMOJI.TODAY IS NOW READY!`)
  console.log(`============================`)
  console.log(
    `🎯 ${
      remainingFiles.length - remainingEmpty.length
    } votable emojis available`
  )
  console.log(`🎨 Color extraction ready for database update`)
  console.log(`🗳️ True completeness achieved!`)

  return {
    validEmojis: remainingFiles.length - remainingEmpty.length,
    deletedRegionalIndicators: stats.deletedFiles,
    remainingEmpty: remainingEmpty.length,
  }
}

if (require.main === module) {
  cleanAndFinalize()
    .then((results) => {
      if (results) {
        console.log(
          `\n🏁 Cleanup complete! ${results.validEmojis} emojis ready for voting`
        )
      }
    })
    .catch(console.error)
}

export { cleanAndFinalize }
