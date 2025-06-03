#!/usr/bin/env tsx

import { readFileSync, existsSync, statSync } from "fs"
import path from "path"
import { Vibrant } from "node-vibrant/node"
import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"

// Load environment variables
dotenv.config({
  path: path.join(__dirname, "../../../apps/emoji.today/.env.local"),
})

// Supabase connection
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials in environment variables")
  console.error(
    "   Need: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
  )
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Image directory
const IMAGES_DIR = path.join(__dirname, "../images/apple-160")

// Function to extract accent color using same logic as analyze script
async function extractAccentColor(imagePath: string): Promise<string> {
  try {
    const palette = await Vibrant.from(imagePath).getPalette()

    // Same logic as analyze-and-populate-emoji-database.ts
    const vibrant = palette.Vibrant
    const dominant =
      palette.DarkVibrant || palette.LightVibrant || palette.Muted
    const fallback = palette.DarkMuted || palette.LightMuted
    const chosenSwatch = vibrant || dominant || fallback

    if (chosenSwatch) {
      return chosenSwatch.hex
    }

    return "#888888" // Default fallback
  } catch (error) {
    console.warn(`Failed to extract color from ${imagePath}:`, error)
    return "#888888"
  }
}

// Function to get image path for an emoji
function getImagePath(filename: string): string | null {
  const imagePath = path.join(IMAGES_DIR, filename)

  if (existsSync(imagePath)) {
    const stats = statSync(imagePath)
    if (stats.size > 0) {
      return imagePath
    }
  }

  return null
}

async function fixStagingColors() {
  console.log("🎨 Fixing accent colors on staging database...\n")

  try {
    // Get all emojis from database
    console.log("📊 Fetching emojis from database...")
    const { data: emojis, error: fetchError } = await supabase
      .from("emojis")
      .select("emoji, filename, accent_color, id")
      .order("emoji")

    if (fetchError) {
      console.error("❌ Error fetching emojis:", fetchError)
      return
    }

    if (!emojis || emojis.length === 0) {
      console.error("❌ No emojis found in database")
      return
    }

    console.log(`✅ Found ${emojis.length} emojis in database\n`)

    let updated = 0
    let skipped = 0
    let errors = 0

    console.log("🖼️  Re-extracting accent colors...\n")

    for (let i = 0; i < emojis.length; i++) {
      const emoji = emojis[i]

      // Progress indicator
      if ((i + 1) % 100 === 0) {
        console.log(`   Processed ${i + 1}/${emojis.length} emojis...`)
      }

      const imagePath = getImagePath(emoji.filename)

      if (!imagePath) {
        console.log(`⚠️  ${emoji.emoji}: Image not found (${emoji.filename})`)
        skipped++
        continue
      }

      // Extract new accent color
      const newColor = await extractAccentColor(imagePath)

      // Only update if the color is different
      if (newColor === emoji.accent_color) {
        // Color is already correct
        continue
      }

      console.log(`🔄 ${emoji.emoji}: ${emoji.accent_color} → ${newColor}`)

      // Update database
      const { error: updateError } = await supabase
        .from("emojis")
        .update({
          accent_color: newColor,
          updated_at: new Date().toISOString(),
        })
        .eq("id", emoji.id)

      if (updateError) {
        console.error(
          `❌ Failed to update ${emoji.emoji}:`,
          updateError.message
        )
        errors++
      } else {
        updated++
      }
    }

    console.log("\n📊 RESULTS:")
    console.log("============")
    console.log(`✅ Updated: ${updated}`)
    console.log(`⚠️  Skipped: ${skipped}`)
    console.log(`❌ Errors: ${errors}`)
    console.log(`📦 Total processed: ${emojis.length}`)

    if (updated > 0) {
      console.log(
        "\n🎉 Accent colors have been fixed! The app should now show vibrant colors."
      )
    } else {
      console.log("\n✨ All accent colors were already correct.")
    }
  } catch (error) {
    console.error("❌ Error during color fixing:", error)
    process.exit(1)
  }
}

// Run the fix
if (require.main === module) {
  fixStagingColors()
    .then(() => {
      console.log("\n✅ Color fix complete!")
      process.exit(0)
    })
    .catch((error) => {
      console.error("❌ Color fix failed:", error)
      process.exit(1)
    })
}

export { fixStagingColors }
