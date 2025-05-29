#!/usr/bin/env tsx

import { readFileSync, readdirSync, existsSync, statSync } from "fs"
import path from "path"

// Load emoji data from emojibase-data
const emojiDataPath = path.join(
  __dirname,
  "../../../node_modules/emojibase-data/en/data.json"
)
const emojiData = JSON.parse(readFileSync(emojiDataPath, "utf8"))

// Type definitions
interface EmojibaseData {
  label: string
  emoji: string
  group: number
  hexcode: string
  shortcodes?: string[]
  tags?: string[]
  version?: number
  skins?: EmojibaseData[]
}

// Category mapping
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

const IMAGES_DIR = path.join(__dirname, "../images/apple-160")

// Function to get image filename variations
function getImageFilenames(hexcode: string): string[] {
  const baseCode = hexcode.toLowerCase()

  // Use same logic as comprehensive download script
  const variants = [
    `${baseCode}.png`, // Base first: 2648.png (for zodiac signs)
    `${baseCode}-fe0f.png`, // Then FE0F: 1f600-fe0f.png (for most others)
    `${baseCode.replace(/-fe0f/g, "")}.png`, // Ensure base without FE0F
    `${baseCode.replace(/-/g, "")}.png`, // No dashes at all
  ]

  return [...new Set(variants)] // Remove duplicates
}

// Function to check if image exists
function imageExists(hexcode: string): boolean {
  const filenames = getImageFilenames(hexcode)
  return filenames.some((filename) =>
    existsSync(path.join(IMAGES_DIR, filename))
  )
}

// Analysis function
function analyzeMissingEmojis() {
  console.log("🔍 MISSING EMOJI STRATEGIC ANALYSIS")
  console.log("=====================================\n")

  const missingByCategory: Record<string, any[]> = {}
  const missingByVersion: Record<string, any[]> = {}
  const votableCategories = [
    "Smileys & Emotion",
    "People & Body",
    "Animals & Nature",
    "Food & Drink",
    "Activities",
    "Objects",
  ]

  let totalProcessed = 0
  let totalMissing = 0
  let votableMissing = 0
  let flagsMissing = 0
  let symbolsMissing = 0

  console.log("📊 Processing emojis by category and version...\n")

  for (const data of emojiData as EmojibaseData[]) {
    // Skip component emojis
    if (data.group === 2) continue

    totalProcessed++
    const category = CATEGORY_MAP[data.group] || "Unknown"
    const version = data.version?.toString() || "legacy"

    if (!imageExists(data.hexcode)) {
      totalMissing++

      // Track by category
      if (!missingByCategory[category]) {
        missingByCategory[category] = []
      }
      missingByCategory[category].push({
        emoji: data.emoji,
        label: data.label,
        hexcode: data.hexcode,
        version: version,
        isVotable: votableCategories.includes(category),
      })

      // Track by version
      if (!missingByVersion[version]) {
        missingByVersion[version] = []
      }
      missingByVersion[version].push({
        emoji: data.emoji,
        label: data.label,
        hexcode: data.hexcode,
        category: category,
      })

      // Count by relevance to voting
      if (votableCategories.includes(category)) {
        votableMissing++
      } else if (category === "Flags") {
        flagsMissing++
      } else if (category === "Symbols") {
        symbolsMissing++
      }
    }
  }

  // Display results
  console.log("📈 MISSING IMAGES BREAKDOWN")
  console.log("==========================")
  console.log(`Total emojis processed: ${totalProcessed}`)
  console.log(`Total missing images: ${totalMissing}`)
  console.log(
    `Percentage missing: ${((totalMissing / totalProcessed) * 100).toFixed(
      1
    )}%\n`
  )

  console.log("🎯 STRATEGIC RELEVANCE FOR VOTING APP")
  console.log("====================================")
  console.log(
    `🗳️  Highly votable missing: ${votableMissing}/${totalMissing} (${(
      (votableMissing / totalMissing) *
      100
    ).toFixed(1)}%)`
  )
  console.log(
    `🏴 Flags missing: ${flagsMissing}/${totalMissing} (${(
      (flagsMissing / totalMissing) *
      100
    ).toFixed(1)}%)`
  )
  console.log(
    `⚡ Symbols missing: ${symbolsMissing}/${totalMissing} (${(
      (symbolsMissing / totalMissing) *
      100
    ).toFixed(1)}%)\n`
  )

  // Missing by category
  console.log("📂 MISSING BY CATEGORY")
  console.log("=====================")
  Object.entries(missingByCategory)
    .sort(([, a], [, b]) => b.length - a.length)
    .forEach(([category, emojis]) => {
      const votableCount = emojis.filter((e) => e.isVotable).length
      const votableIndicator = votableCategories.includes(category)
        ? "🎯"
        : category === "Flags"
        ? "🏴"
        : "⚡"
      console.log(
        `${votableIndicator} ${category}: ${emojis.length} missing (${votableCount} votable)`
      )

      // Show first few examples
      const examples = emojis.slice(0, 5)
      examples.forEach((emoji) => {
        console.log(`   ${emoji.emoji} ${emoji.label}`)
      })
      if (emojis.length > 5) {
        console.log(`   ... and ${emojis.length - 5} more`)
      }
      console.log()
    })

  // Missing by version
  console.log("📅 MISSING BY VERSION")
  console.log("====================")
  Object.entries(missingByVersion)
    .sort(([a], [b]) => parseFloat(b) - parseFloat(a))
    .forEach(([version, emojis]) => {
      console.log(`Version ${version}: ${emojis.length} missing`)

      // Show category breakdown for this version
      const categoryCounts: Record<string, number> = {}
      emojis.forEach((emoji) => {
        categoryCounts[emoji.category] =
          (categoryCounts[emoji.category] || 0) + 1
      })

      Object.entries(categoryCounts)
        .sort(([, a], [, b]) => b - a)
        .forEach(([cat, count]) => {
          const indicator = votableCategories.includes(cat)
            ? "🎯"
            : cat === "Flags"
            ? "🏴"
            : "⚡"
          console.log(`   ${indicator} ${cat}: ${count}`)
        })
      console.log()
    })

  // Strategic recommendations
  console.log("💡 STRATEGIC RECOMMENDATIONS")
  console.log("===========================")

  if (votableMissing < totalMissing * 0.3) {
    console.log("✅ RECOMMENDATION: Focus on your 1,613 existing emojis")
    console.log("   • Only ~30% of missing emojis are highly votable")
    console.log("   • You have sufficient coverage for daily voting")
    console.log(
      "   • Most missing are flags/symbols (less likely to be voted for)"
    )
  } else {
    console.log(
      "⚠️  RECOMMENDATION: Consider addressing missing votable emojis"
    )
    console.log("   • Significant number of votable emojis are missing")
    console.log("   • May impact user choice and engagement")
  }

  console.log("\n🎯 TOP PRIORITY MISSING EMOJIS (Most Votable)")
  console.log("=============================================")

  const topVotable = Object.values(missingByCategory)
    .flat()
    .filter((e) => e.isVotable)
    .slice(0, 20)

  topVotable.forEach((emoji) => {
    console.log(
      `${emoji.emoji} ${emoji.label} (${
        CATEGORY_MAP[
          emojiData.find((e: any) => e.emoji === emoji.emoji)?.group || 0
        ]
      })`
    )
  })

  console.log("\n📊 SUMMARY FOR DECISION MAKING")
  console.log("==============================")
  console.log(`Current working emojis: 1,613`)
  console.log(`Missing but votable: ${votableMissing}`)
  console.log(`Missing flags/symbols: ${flagsMissing + symbolsMissing}`)
  console.log(
    `Estimated completion rate: ${(
      (1613 / (1613 + votableMissing)) *
      100
    ).toFixed(1)}% for votable emojis`
  )

  const recommendation =
    votableMissing < 100
      ? "PROCEED with current 1,613 emojis"
      : "CONSIDER sourcing missing votable emojis"

  console.log(`\n🎯 FINAL RECOMMENDATION: ${recommendation}`)
}

// Run the analysis
if (require.main === module) {
  analyzeMissingEmojis()
}

export { analyzeMissingEmojis }
