#!/usr/bin/env tsx

import fs from "fs"
import path from "path"
import { readFileSync } from "fs"

// Load emoji data to match hexcodes
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

const CATEGORY_MAP: Record<number, string> = {
  0: "Smileys & Emotion",
  1: "People & Body",
  2: "Component",
  3: "Animals & Nature",
  4: "Food & Drink",
  5: "Travel & Places",
  6: "Activities",
  7: "Objects",
  8: "Symbols",
  9: "Flags",
}

function categorizeEmptyFiles() {
  console.log("🔍 CATEGORIZING EMPTY FILES")
  console.log("==========================\n")

  // Find all empty files
  const allFiles = fs.readdirSync(IMAGES_DIR)
  const emptyFiles = allFiles.filter((filename) => {
    const filePath = path.join(IMAGES_DIR, filename)
    const stats = fs.statSync(filePath)
    return stats.size === 0
  })

  console.log(`📊 Found ${emptyFiles.length} empty files\n`)

  const categories = {
    regionalIndicators: [] as any[],
    components: [] as any[],
    flags: [] as any[],
    votableEmojis: [] as any[],
    unknown: [] as any[],
  }

  // Create a map of hexcodes to emoji data
  const hexcodeMap = new Map<string, EmojibaseData>()
  for (const emoji of emojiData) {
    hexcodeMap.set(emoji.hexcode.toLowerCase(), emoji)
  }

  // Categorize each empty file
  for (const filename of emptyFiles) {
    const hexcode = filename.replace(".png", "").toLowerCase()
    const emojiInfo = hexcodeMap.get(hexcode)

    if (!emojiInfo) {
      categories.unknown.push({ filename, hexcode })
      continue
    }

    if (emojiInfo.label.includes("REGIONAL INDICATOR")) {
      categories.regionalIndicators.push({
        filename,
        hexcode,
        emoji: emojiInfo.emoji,
        label: emojiInfo.label,
      })
    } else if (emojiInfo.group === 2) {
      // Component
      categories.components.push({
        filename,
        hexcode,
        emoji: emojiInfo.emoji,
        label: emojiInfo.label,
      })
    } else if (emojiInfo.group === 9) {
      // Flags
      categories.flags.push({
        filename,
        hexcode,
        emoji: emojiInfo.emoji,
        label: emojiInfo.label,
      })
    } else {
      // These are actual votable emojis!
      categories.votableEmojis.push({
        filename,
        hexcode,
        emoji: emojiInfo.emoji,
        label: emojiInfo.label,
        category: CATEGORY_MAP[emojiInfo.group],
      })
    }
  }

  console.log("📋 CATEGORIZATION RESULTS")
  console.log("=========================")
  console.log(`🇦 Regional Indicators: ${categories.regionalIndicators.length}`)
  console.log(`🎨 Components: ${categories.components.length}`)
  console.log(`🏳️ Flags: ${categories.flags.length}`)
  console.log(`🗳️  Votable Emojis: ${categories.votableEmojis.length}`)
  console.log(`❓ Unknown: ${categories.unknown.length}`)
  console.log()

  // Show details for regional indicators (should be filtered out)
  if (categories.regionalIndicators.length > 0) {
    console.log("🇦 REGIONAL INDICATORS (should be removed):")
    categories.regionalIndicators.slice(0, 10).forEach((item) => {
      console.log(`   ${item.emoji} ${item.label}`)
    })
    if (categories.regionalIndicators.length > 10) {
      console.log(
        `   ... and ${categories.regionalIndicators.length - 10} more`
      )
    }
    console.log()
  }

  // Show details for components (should be filtered out)
  if (categories.components.length > 0) {
    console.log("🎨 COMPONENTS (should be removed):")
    categories.components.slice(0, 10).forEach((item) => {
      console.log(`   ${item.emoji} ${item.label}`)
    })
    if (categories.components.length > 10) {
      console.log(`   ... and ${categories.components.length - 10} more`)
    }
    console.log()
  }

  // Show actual votable emojis that need fixing
  if (categories.votableEmojis.length > 0) {
    console.log("🗳️  VOTABLE EMOJIS MISSING IMAGES (need fixing!):")
    categories.votableEmojis.forEach((item) => {
      console.log(`   ${item.emoji} ${item.label} (${item.category})`)
    })
    console.log()
  }

  // Show unknown files
  if (categories.unknown.length > 0) {
    console.log("❓ UNKNOWN FILES:")
    categories.unknown.forEach((item) => {
      console.log(`   ${item.filename} (${item.hexcode})`)
    })
    console.log()
  }

  console.log("💡 RECOMMENDATIONS")
  console.log("==================")
  if (categories.regionalIndicators.length > 0) {
    console.log(
      `✂️  Remove ${categories.regionalIndicators.length} regional indicator files`
    )
  }
  if (categories.components.length > 0) {
    console.log(`✂️  Remove ${categories.components.length} component files`)
  }
  if (categories.votableEmojis.length > 0) {
    console.log(`🔧 Fix ${categories.votableEmojis.length} actual emoji images`)
  } else {
    console.log(
      `🎉 No votable emojis missing - only expected non-visual files!`
    )
  }

  return categories
}

if (require.main === module) {
  categorizeEmptyFiles()
}

export { categorizeEmptyFiles }
