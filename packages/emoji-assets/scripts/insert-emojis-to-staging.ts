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
  console.log({
    SUPABASE_URL: supabaseUrl ? "Set" : "Missing",
    SUPABASE_SERVICE_ROLE_KEY: supabaseServiceKey ? "Set" : "Missing",
  })
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function insertEmojisToDatabase() {
  console.log("🚀 INSERTING EMOJI DATA TO STAGING DATABASE")
  console.log("===========================================\n")

  // Get analyzed emoji data
  console.log("📊 Getting analyzed emoji data...")
  const { processedEmojis } = await analyzeAndPopulateEmojiDatabase()

  // Filter to only emojis with images
  const emojisToInsert = processedEmojis.filter((e: any) => e.image_exists)

  console.log(`💾 Inserting ${emojisToInsert.length} emojis with images...`)

  // Insert in batches of 100
  const batchSize = 100
  let inserted = 0
  let errors = 0

  for (let i = 0; i < emojisToInsert.length; i += batchSize) {
    const batch = emojisToInsert.slice(i, i + batchSize)
    console.log(
      `🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
        emojisToInsert.length / batchSize
      )} (${batch.length} emojis)...`
    )

    try {
      const { error } = await supabase.from("emojis").upsert(
        batch.map((emoji: any) => ({
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
          search_text: `${emoji.emoji} ${emoji.name} ${
            emoji.short_name
          } ${emoji.keywords.join(" ")}`.toLowerCase(),
          is_votable: true,
        })),
        {
          onConflict: "emoji",
          ignoreDuplicates: false,
        }
      )

      if (error) {
        console.error(
          `❌ Error in batch ${Math.floor(i / batchSize) + 1}:`,
          error
        )
        errors += batch.length
      } else {
        inserted += batch.length
        console.log(`✅ Batch ${Math.floor(i / batchSize) + 1} complete`)
      }
    } catch (error) {
      console.error(
        `❌ Exception in batch ${Math.floor(i / batchSize) + 1}:`,
        error
      )
      errors += batch.length
    }
  }

  console.log("\n📈 INSERTION RESULTS")
  console.log("===================")
  console.log(`✅ Inserted: ${inserted}`)
  console.log(`❌ Errors: ${errors}`)
  console.log(`📦 Total processed: ${inserted + errors}`)

  if (inserted > 0) {
    console.log("\n🎉 SUCCESS! Emoji database populated!")
    console.log(`🔗 Database: ${supabaseUrl}`)
  }
}

// Run the insertion
insertEmojisToDatabase()
  .then(() => {
    console.log("\n✅ Insertion complete!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("❌ Insertion failed:", error)
    process.exit(1)
  })
