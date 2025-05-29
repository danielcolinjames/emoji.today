#!/usr/bin/env tsx

import { readFileSync } from "fs"
import path from "path"

// Load emoji data from emojibase-data
const emojiDataPath = path.join(
  __dirname,
  "../../../node_modules/emojibase-data/en/data.json"
)
const emojiData = JSON.parse(readFileSync(emojiDataPath, "utf8"))

// Supabase connection
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://lgkbapfskatvfrsnxcys.supabase.co"
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

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

async function findMissingFromDatabase() {
  console.log("🔍 FINDING EMOJIS MISSING FROM DATABASE")
  console.log("=====================================\n")

  // Get all emojis from database
  const { data: dbEmojis, error } = await supabase
    .from("emojis")
    .select("emoji, unified")

  if (error) {
    console.error("❌ Failed to fetch from database:", error)
    return
  }

  const dbEmojiSet = new Set(dbEmojis?.map((e) => e.emoji) || [])
  const dbUnifiedSet = new Set(dbEmojis?.map((e) => e.unified) || [])

  console.log(`📊 Database has ${dbEmojis?.length || 0} emojis`)
  console.log(`📊 Emojibase has ${emojiData.length} emojis\n`)

  const missing: any[] = []
  const missingByCategory: Record<string, any[]> = {}

  // Check each emojibase emoji
  for (const data of emojiData as EmojibaseData[]) {
    // Skip component emojis
    if (data.group === 2) continue

    if (!dbEmojiSet.has(data.emoji) && !dbUnifiedSet.has(data.hexcode)) {
      const category = CATEGORY_MAP[data.group] || "Unknown"

      missing.push({
        emoji: data.emoji,
        label: data.label,
        hexcode: data.hexcode,
        category: category,
        version: data.version,
      })

      if (!missingByCategory[category]) {
        missingByCategory[category] = []
      }
      missingByCategory[category].push({
        emoji: data.emoji,
        label: data.label,
        hexcode: data.hexcode,
        version: data.version,
      })
    }
  }

  console.log(`❌ Found ${missing.length} emojis missing from database\n`)

  // Show missing by category
  console.log("📂 MISSING BY CATEGORY")
  console.log("======================")
  Object.entries(missingByCategory)
    .sort(([, a], [, b]) => b.length - a.length)
    .forEach(([category, emojis]) => {
      console.log(`${category}: ${emojis.length} missing`)
      emojis.slice(0, 5).forEach((emoji) => {
        console.log(`   ${emoji.emoji} ${emoji.label} (${emoji.hexcode})`)
      })
      if (emojis.length > 5) {
        console.log(`   ... and ${emojis.length - 5} more`)
      }
      console.log()
    })

  // Check if these are regional indicators
  const regionalIndicators = missing.filter((e) =>
    e.label.includes("REGIONAL INDICATOR")
  )
  const components = missing.filter((e) => e.category === "Component")

  console.log("🔍 ANALYSIS")
  console.log("===========")
  console.log(`Regional Indicators: ${regionalIndicators.length}`)
  console.log(`Components: ${components.length}`)
  console.log(
    `Other: ${missing.length - regionalIndicators.length - components.length}`
  )

  if (regionalIndicators.length > 0) {
    console.log("\n🇦 REGIONAL INDICATORS (expected to be missing):")
    regionalIndicators.slice(0, 10).forEach((emoji) => {
      console.log(`   ${emoji.emoji} ${emoji.label}`)
    })
  }

  return {
    total: missing.length,
    regionalIndicators: regionalIndicators.length,
    components: components.length,
    missing,
  }
}

if (require.main === module) {
  findMissingFromDatabase()
    .then((results) => {
      if (results) {
        console.log(
          `\n✅ Analysis complete! ${results.total} emojis missing from database`
        )
      }
    })
    .catch(console.error)
}

export { findMissingFromDatabase }
