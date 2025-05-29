#!/usr/bin/env tsx

import "dotenv/config"
import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"
import path from "path"
import { analyzeAndPopulateEmojiDatabase } from "./analyze-and-populate-emoji-database"

async function populateWithServiceRole() {
  console.log("🚀 Populating database using Supabase service role...\n")

  // Check for environment variables
  const supabaseUrl = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("❌ Missing environment variables:")
    console.error("   SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required")
    console.error("   Add them to your .env file or environment")
    process.exit(1)
  }

  // Create Supabase client with service role
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  })

  console.log("✅ Connected to Supabase with service role")

  // Get emoji data
  console.log("📊 Analyzing emoji data...")
  const originalLog = console.log
  console.log = () => {} // Suppress analysis output

  const results = await analyzeAndPopulateEmojiDatabase()
  console.log = originalLog // Restore

  const validEmojis = results.processedEmojis.filter(
    (emoji) => emoji.image_exists
  )

  console.log(`📝 Ready to insert ${validEmojis.length} emojis`)
  console.log("🔄 Processing in batches of 100 for optimal performance...\n")

  const batchSize = 100
  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < validEmojis.length; i += batchSize) {
    const batch = validEmojis.slice(i, i + batchSize)
    const batchNumber = Math.floor(i / batchSize) + 1
    const totalBatches = Math.ceil(validEmojis.length / batchSize)

    console.log(
      `📦 Batch ${batchNumber}/${totalBatches}: Inserting ${batch.length} emojis...`
    )

    try {
      // Transform batch for Supabase insert
      const insertData = batch.map((emoji) => ({
        emoji: emoji.emoji,
        unified: emoji.unified,
        non_qualified: emoji.non_qualified,
        name: emoji.name,
        short_name: emoji.short_name,
        short_names: emoji.short_names,
        keywords: emoji.keywords,
        category: emoji.category,
        subcategory: emoji.subcategory,
        sort_order: emoji.sort_order,
        added_in: emoji.added_in,
        unicode_version: emoji.unicode_version,
        accent_color: emoji.accent_color,
        skin_variations: emoji.skin_variations
          ? JSON.parse(emoji.skin_variations)
          : null,
        filename: emoji.filename,
        has_img_apple: emoji.has_img_apple,
        has_img_google: emoji.has_img_google,
        has_img_twitter: emoji.has_img_twitter,
        has_img_facebook: emoji.has_img_facebook,
      }))

      // Insert batch with upsert
      const { data, error } = await supabase.from("emojis").upsert(insertData, {
        onConflict: "emoji",
        ignoreDuplicates: false,
      })

      if (error) {
        throw error
      }

      successCount += batch.length
      console.log(`   ✅ Successfully inserted ${batch.length} emojis`)

      // Show sample
      const samples = batch
        .slice(0, 3)
        .map((e) => `${e.emoji} ${e.name}`)
        .join(", ")
      console.log(`   📝 Sample: ${samples}${batch.length > 3 ? "..." : ""}`)
    } catch (error) {
      console.error(`   ❌ Batch ${batchNumber} failed:`, error)
      errorCount += batch.length
    }

    console.log("")
  }

  console.log("🎉 Database population complete!")
  console.log(`✅ Successfully inserted: ${successCount} emojis`)
  if (errorCount > 0) {
    console.log(`❌ Failed: ${errorCount} emojis`)
  }

  // Verify final count
  console.log("\n🔍 Verifying database...")
  const { count, error: countError } = await supabase
    .from("emojis")
    .select("*", { count: "exact", head: true })

  if (!countError) {
    console.log(`📊 Total emojis in database: ${count}`)
  }

  // Test search functionality
  console.log("\n🔍 Testing search functionality...")
  const { data: smileEmojis, error: searchError } = await supabase
    .from("emojis")
    .select("emoji, name, accent_color")
    .contains("keywords", ["smile"])
    .limit(5)

  if (!searchError && smileEmojis) {
    console.log('😀 Sample "smile" search results:')
    smileEmojis.forEach((emoji) => {
      console.log(`   ${emoji.emoji} ${emoji.name} (${emoji.accent_color})`)
    })
  }

  return {
    totalProcessed: validEmojis.length,
    successCount,
    errorCount,
    finalDatabaseCount: count,
  }
}

// Run the script
if (require.main === module) {
  populateWithServiceRole()
    .then((result) => {
      console.log(`\n🎯 Final Result:`)
      console.log(`   Processed: ${result.totalProcessed} emojis`)
      console.log(`   Successful: ${result.successCount}`)
      console.log(`   Failed: ${result.errorCount}`)
      console.log(`   Database total: ${result.finalDatabaseCount}`)

      if (result.errorCount === 0) {
        console.log("\n✅ All emojis successfully populated!")
      }

      process.exit(result.errorCount > 0 ? 1 : 0)
    })
    .catch((error) => {
      console.error("❌ Population failed:", error)
      process.exit(1)
    })
}

export { populateWithServiceRole }
