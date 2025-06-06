#!/usr/bin/env tsx

import { createClient } from "@supabase/supabase-js"
import { analyzeAndPopulateEmojiDatabase } from "./analyze-and-populate-emoji-database"
import * as dotenv from "dotenv"

// Load environment variables
dotenv.config({ path: ".env" })

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase environment variables")
  process.exit(1)
}

// Create Supabase client with service key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Helper function to find emoji data with variation selector handling
function findEmojiData(properEmojiData: Map<string, any>, targetEmoji: string) {
  // Try exact match first
  let found = properEmojiData.get(targetEmoji)
  if (found) return found

  // Try with variation selector (FE0F)
  const withVariationSelector = targetEmoji + "\uFE0F"
  found = properEmojiData.get(withVariationSelector)
  if (found) return found

  // Try without variation selector (remove FE0F if present)
  const withoutVariationSelector = targetEmoji.replace(/\uFE0F/g, "")
  if (withoutVariationSelector !== targetEmoji) {
    found = properEmojiData.get(withoutVariationSelector)
    if (found) return found
  }

  return null
}

async function fixProductionEmojis() {
  console.log("🚀 FIXING ALL BROKEN EMOJI DATA")
  console.log("===============================\n")

  try {
    // First, check what emojis are currently broken
    const { data: brokenEmojis, error: brokenError } = await supabase
      .from("emojis")
      .select("emoji, name, keywords, category")
      .eq("name", "EMOJI") // All categories now, not just People & Body

    if (brokenError) {
      console.error("❌ Error checking broken emojis:", brokenError)
      return
    }

    console.log(
      `🚨 Found ${
        brokenEmojis?.length || 0
      } broken emojis across all categories`
    )

    if (!brokenEmojis || brokenEmojis.length === 0) {
      console.log("✅ No broken emojis found!")
      return
    }

    // Show breakdown by category
    const categoryBreakdown = brokenEmojis.reduce((acc, emoji) => {
      acc[emoji.category] = (acc[emoji.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    console.log("\n📊 Broken emojis by category:")
    Object.entries(categoryBreakdown).forEach(([category, count]) => {
      console.log(`   ${category}: ${count}`)
    })

    // Show sample of broken emojis
    console.log("\n📝 Sample broken emojis that will be fixed:")
    brokenEmojis.slice(0, 10).forEach((emoji) => {
      console.log(
        `   ${emoji.emoji} - Currently: "${emoji.name}" (${emoji.category})`
      )
    })

    // Run the analysis to get proper emoji data
    console.log("\n📊 Analyzing emojis and generating proper data...")
    const results = await analyzeAndPopulateEmojiDatabase()

    // Create a map of emoji character to proper data
    const properEmojiData = new Map()
    results.processedEmojis
      .filter((emoji) => emoji.image_exists)
      .forEach((emoji) => {
        properEmojiData.set(emoji.emoji, emoji)
      })

    console.log(`📚 Created lookup map with ${properEmojiData.size} emojis`)

    // Track lookup results for debugging
    let foundCount = 0
    let notFoundCount = 0
    const notFoundEmojis: string[] = []

    // Only prepare updates for emojis that are currently broken
    const emojiUpdates = brokenEmojis
      .map((brokenEmoji) => {
        const properData = findEmojiData(properEmojiData, brokenEmoji.emoji)
        if (!properData) {
          console.warn(`⚠️  No proper data found for ${brokenEmoji.emoji}`)
          notFoundCount++
          notFoundEmojis.push(brokenEmoji.emoji)
          return null
        }

        foundCount++
        return {
          emoji: brokenEmoji.emoji,
          name: properData.name,
          short_name: properData.short_name,
          short_names: properData.short_names,
          keywords: properData.keywords,
          category: properData.category,
          search_text: `${properData.emoji} ${properData.name} ${
            properData.short_name
          } ${properData.keywords.join(" ")}`.toLowerCase(),
        }
      })
      .filter((update): update is NonNullable<typeof update> => update !== null)

    console.log(`\n📊 Lookup Results:`)
    console.log(`   ✅ Found in emojibase: ${foundCount}`)
    console.log(`   ❌ Not found: ${notFoundCount}`)

    if (notFoundEmojis.length > 0) {
      console.log(
        `\n🔍 Emojis not found (likely newer than emojibase v16.0.3):`
      )
      notFoundEmojis.slice(0, 10).forEach((emoji) => {
        console.log(`   ${emoji}`)
      })
      if (notFoundEmojis.length > 10) {
        console.log(`   ... and ${notFoundEmojis.length - 10} more`)
      }
    }

    console.log(
      `\n🎯 Preparing to fix ${emojiUpdates.length} broken emojis across all categories`
    )
    console.log("📋 Will ONLY update emojis with name = 'EMOJI'")
    console.log("✅ Will NOT touch emojis with proper names")

    // Show examples of what will be fixed
    console.log("\n🔧 Examples of fixes:")
    emojiUpdates.slice(0, 8).forEach((update) => {
      console.log(
        `   ${update.emoji} - Will become: "${update.name}" (${update.category})`
      )
    })

    if (emojiUpdates.length === 0) {
      console.log("\n🤷 No emojis can be fixed (all missing from emojibase)")
      return
    }

    console.log(
      "\n⚠️  SAFETY CHECK: This will only update emojis with name='EMOJI'"
    )

    // Check current database state
    const { count: currentCount } = await supabase
      .from("emojis")
      .select("*", { count: "exact", head: true })

    console.log(`📈 Current database has ${currentCount} total emojis`)

    // Update in small batches
    const batchSize = 25 // Even smaller for production safety
    let updated = 0
    let errors = 0

    for (let i = 0; i < emojiUpdates.length; i += batchSize) {
      const batch = emojiUpdates.slice(i, i + batchSize)
      console.log(
        `\n🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
          emojiUpdates.length / batchSize
        )} (${batch.length} emojis)...`
      )

      try {
        for (const update of batch) {
          const { error } = await supabase
            .from("emojis")
            .update({
              name: update.name,
              short_name: update.short_name,
              short_names: update.short_names,
              keywords: update.keywords,
              search_text: update.search_text,
              updated_at: new Date().toISOString(),
            })
            .eq("emoji", update.emoji)
            .eq("name", "EMOJI") // Double safety check

          if (error) {
            console.error(`❌ Error updating ${update.emoji}:`, error)
            errors++
          } else {
            updated++
          }
        }

        console.log(`✅ Processed batch ${Math.floor(i / batchSize) + 1}`)

        // Add a delay between batches
        await new Promise((resolve) => setTimeout(resolve, 300))
      } catch (err) {
        console.error(
          `❌ Exception in batch ${Math.floor(i / batchSize) + 1}:`,
          err
        )
        errors += batch.length
      }
    }

    // Verify the fixes
    const { data: stillBroken, error: verifyError } = await supabase
      .from("emojis")
      .select("emoji, name, category")
      .eq("name", "EMOJI")

    console.log("\n🎉 UPDATE COMPLETE!")
    console.log("==================")
    console.log(`📊 Statistics:`)
    console.log(`   - Successfully updated: ${updated}`)
    console.log(`   - Errors: ${errors}`)
    console.log(`   - Still broken emojis: ${stillBroken?.length || 0}`)
    console.log(`   - Emojis not in emojibase: ${notFoundCount}`)

    if (stillBroken && stillBroken.length > 0) {
      const remainingCategories = [
        ...new Set(stillBroken.map((e) => e.category)),
      ]
      console.log(
        `   - Remaining broken categories: ${remainingCategories.join(", ")}`
      )
    }
  } catch (error) {
    console.error("❌ Failed to fix database:", error)
    process.exit(1)
  }
}

// Run the fix
if (require.main === module) {
  fixProductionEmojis()
    .then(() => {
      console.log("\n✅ Production emoji fix complete!")
      process.exit(0)
    })
    .catch((error) => {
      console.error("❌ Production emoji fix failed:", error)
      process.exit(1)
    })
}

export { fixProductionEmojis }
