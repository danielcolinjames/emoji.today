#!/usr/bin/env tsx

import { supabase } from "./lib/supabase"
import { EMOJI_FILENAME_MAP } from "@emoji.today/emoji-assets/src/filename-mapping"
import { readFileSync, existsSync } from "fs"
import path from "path"
import { Vibrant } from "node-vibrant/node"

// Function to extract dominant color from an image
async function extractAccentColor(imagePath: string): Promise<string> {
  try {
    const palette = await Vibrant.from(imagePath).getPalette()

    // Prefer vibrant colors, fallback to dominant
    const vibrant = palette.Vibrant
    const dominant =
      palette.DarkVibrant || palette.LightVibrant || palette.Muted
    const fallback = palette.DarkMuted || palette.LightMuted

    const chosenSwatch = vibrant || dominant || fallback

    if (chosenSwatch) {
      return chosenSwatch.hex
    }

    // Ultimate fallback
    return "#888888"
  } catch (error) {
    console.warn(`Failed to extract color from ${imagePath}:`, error)
    return "#888888"
  }
}

// Get common emoji names from Unicode data
function getEmojiName(emoji: string): string {
  // Common emoji names - could be expanded
  const commonNames: Record<string, string> = {
    "🥶": "COLD FACE",
    "👍": "THUMBS UP",
    "👎": "THUMBS DOWN",
    "⭐": "STAR",
    "✨": "SPARKLES",
    "☀️": "SUN",
    "❄️": "SNOWFLAKE",
    "✅": "CHECK MARK BUTTON",
    "❌": "CROSS MARK",
    "✔️": "CHECK MARK",
    "✖️": "MULTIPLY",
    "♥️": "HEART SUIT",
    "♠️": "SPADE SUIT",
    "♦️": "DIAMOND SUIT",
    "♣️": "CLUB SUIT",
    "🏳️‍🌈": "RAINBOW FLAG",
    "🏴‍☠️": "PIRATE FLAG",
    "❤️‍🔥": "HEART ON FIRE",
    "❤️‍🩹": "MENDING HEART",
    "0️⃣": "KEYCAP DIGIT ZERO",
    "1️⃣": "KEYCAP DIGIT ONE",
    "2️⃣": "KEYCAP DIGIT TWO",
    "3️⃣": "KEYCAP DIGIT THREE",
    "*️⃣": "KEYCAP ASTERISK",
    "#️⃣": "KEYCAP NUMBER SIGN",
    "🔴": "RED CIRCLE",
    "🟢": "GREEN CIRCLE",
    "🔵": "BLUE CIRCLE",
    "🟡": "YELLOW CIRCLE",
    "🟣": "PURPLE CIRCLE",
    "⚫": "BLACK CIRCLE",
    "⚪": "WHITE CIRCLE",
    "🟥": "RED SQUARE",
    "🟩": "GREEN SQUARE",
    "🟦": "BLUE SQUARE",
    "🟨": "YELLOW SQUARE",
    "🟪": "PURPLE SQUARE",
    "⬛": "BLACK LARGE SQUARE",
    "⬜": "WHITE LARGE SQUARE",
    "🗳️": "BALLOT BOX WITH BALLOT",
    "🆘": "SOS BUTTON",
    "🅰️": "A BUTTON (BLOOD TYPE)",
    "🅱️": "B BUTTON (BLOOD TYPE)",
    "🅾️": "O BUTTON (BLOOD TYPE)",
    "🆎": "AB BUTTON (BLOOD TYPE)",
  }

  return commonNames[emoji] || "EMOJI"
}

// Get emoji category based on type
function getEmojiCategory(emoji: string): string {
  // Simple categorization based on Unicode blocks
  const codePoint = emoji.codePointAt(0) || 0

  // Emoticons & Smileys (U+1F600-1F64F)
  if (codePoint >= 0x1f600 && codePoint <= 0x1f64f) return "Smileys & Emotion"

  // Additional emoticons (U+1F910-1F9FF)
  if (codePoint >= 0x1f910 && codePoint <= 0x1f9ff) return "Smileys & Emotion"

  // People & Body (U+1F466-1F9DF)
  if (codePoint >= 0x1f466 && codePoint <= 0x1f9df) return "People & Body"

  // Animals & Nature (U+1F400-1F43F, U+1F980-1F9AE)
  if (
    (codePoint >= 0x1f400 && codePoint <= 0x1f43f) ||
    (codePoint >= 0x1f980 && codePoint <= 0x1f9ae)
  )
    return "Animals & Nature"

  // Food & Drink (U+1F32D-1F37F)
  if (codePoint >= 0x1f32d && codePoint <= 0x1f37f) return "Food & Drink"

  // Travel & Places (U+1F680-1F6FF)
  if (codePoint >= 0x1f680 && codePoint <= 0x1f6ff) return "Travel & Places"

  // Activities (U+1F3A0-1F3FF, U+1F90C-1F93A)
  if (
    (codePoint >= 0x1f3a0 && codePoint <= 0x1f3ff) ||
    (codePoint >= 0x1f90c && codePoint <= 0x1f93a)
  )
    return "Activities"

  // Objects (U+1F4A0-1F4FF, U+1F50D-1F5FF)
  if (
    (codePoint >= 0x1f4a0 && codePoint <= 0x1f4ff) ||
    (codePoint >= 0x1f50d && codePoint <= 0x1f5ff)
  )
    return "Objects"

  // Symbols (U+2600-26FF, U+2700-27BF)
  if (
    (codePoint >= 0x2600 && codePoint <= 0x26ff) ||
    (codePoint >= 0x2700 && codePoint <= 0x27bf)
  )
    return "Symbols"

  // Flags (U+1F1E6-1F1FF, U+1F3F4)
  if ((codePoint >= 0x1f1e6 && codePoint <= 0x1f1ff) || codePoint === 0x1f3f4)
    return "Flags"

  // Default to Symbols for anything else
  return "Symbols"
}

async function updateSpecificEmojis() {
  console.log("\n🎯 Adding specific missing emojis...")

  const specificEmojis = ["👍", "👎", "⭐", "✨"]
  const IMAGES_DIR = path.join(
    __dirname,
    "../../../apps/emoji.today/public/emoji-assets/apple-160"
  )

  for (const emoji of specificEmojis) {
    const filename = EMOJI_FILENAME_MAP[emoji]
    if (!filename) {
      console.log(`❌ No filename mapping for ${emoji}`)
      continue
    }

    const imagePath = path.join(IMAGES_DIR, filename)
    let accentColor = "#888888"

    if (existsSync(imagePath)) {
      try {
        accentColor = await extractAccentColor(imagePath)
        console.log(`✅ ${emoji} -> ${filename} (${accentColor})`)
      } catch (error) {
        console.log(`⚠️  ${emoji} -> ${filename} (color extraction failed)`)
      }
    }

    const name = getEmojiName(emoji)
    const shortName = name.toLowerCase().replace(/\s+/g, "_")
    const category = getEmojiCategory(emoji)

    // First check if it exists
    const { data: existing } = await supabase
      .from("emojis")
      .select("emoji")
      .eq("emoji", emoji)
      .single()

    if (existing) {
      // Update accent color if missing
      const { error } = await supabase
        .from("emojis")
        .update({ accent_color: accentColor })
        .eq("emoji", emoji)

      if (error) {
        console.error(`❌ Error updating ${emoji}:`, error)
      } else {
        console.log(`✅ Updated accent color for ${emoji}`)
      }
    } else {
      // Insert new emoji
      const { error } = await supabase.from("emojis").insert({
        emoji: emoji,
        name: name,
        short_name: shortName,
        short_names: [shortName],
        keywords: [shortName, ...name.toLowerCase().split(/\s+/)],
        category: category,
        subcategory: null,
        accent_color: accentColor,
        filename: filename,
        unified: filename.replace(".png", "").toUpperCase(),
        non_qualified: null,
        sort_order: 0,
        added_in: "1.0",
        unicode_version: "6.1",
        skin_variations: null,
        has_img_apple: true,
        has_img_google: true,
        has_img_twitter: true,
        has_img_facebook: true,
        is_votable: true,
        search_text: `${emoji} ${name} ${shortName}`.toLowerCase(),
      })

      if (error) {
        console.error(`❌ Error inserting ${emoji}:`, error)
      } else {
        console.log(`✅ Inserted ${emoji}`)
      }
    }
  }
}

async function updateEmojiDatabase() {
  console.log("🔍 Checking existing emojis in database...")

  // Get all existing emojis from database
  const { data: existingEmojis, error: fetchError } = await supabase
    .from("emojis")
    .select("emoji, unified")

  if (fetchError) {
    console.error("Error fetching existing emojis:", fetchError)
    return
  }

  const existingEmojiSet = new Set(existingEmojis?.map((e) => e.emoji) || [])
  const existingUnifiedSet = new Set(
    existingEmojis?.map((e) => e.unified) || []
  )
  console.log(`Found ${existingEmojiSet.size} emojis in database`)

  // Get all emojis from our filename map
  const allEmojis = Object.keys(EMOJI_FILENAME_MAP)
  console.log(`Found ${allEmojis.length} emojis in filename map`)

  // Find missing emojis
  const missingEmojis = allEmojis.filter(
    (emoji) => !existingEmojiSet.has(emoji)
  )
  console.log(`\n🚨 Missing ${missingEmojis.length} emojis from database`)

  if (missingEmojis.length === 0) {
    console.log("✅ Database is up to date!")
    await updateSpecificEmojis()
    return
  }

  console.log("\n📝 Processing missing emojis...")

  const IMAGES_DIR = path.join(
    __dirname,
    "../../../apps/emoji.today/public/emoji-assets/apple-160"
  )
  const emojiData = []

  for (const emoji of missingEmojis) {
    const filename = EMOJI_FILENAME_MAP[emoji]
    if (!filename) continue

    const unified = filename.replace(".png", "").toUpperCase()

    // Skip if unified already exists
    if (existingUnifiedSet.has(unified)) {
      console.log(`⏭️  ${emoji} -> ${filename} (unified key exists)`)
      continue
    }

    const imagePath = path.join(IMAGES_DIR, filename)
    let accentColor = "#888888"

    if (existsSync(imagePath)) {
      try {
        accentColor = await extractAccentColor(imagePath)
        console.log(`✅ ${emoji} -> ${filename} (${accentColor})`)
      } catch (error) {
        console.log(`⚠️  ${emoji} -> ${filename} (color extraction failed)`)
      }
    } else {
      console.log(`❌ ${emoji} -> ${filename} (image not found)`)
    }

    const name = getEmojiName(emoji)
    const shortName = name.toLowerCase().replace(/\s+/g, "_")
    const category = getEmojiCategory(emoji)

    emojiData.push({
      emoji: emoji,
      name: name,
      short_name: shortName,
      short_names: [shortName],
      keywords: [shortName, ...name.toLowerCase().split(/\s+/)],
      category: category,
      subcategory: null,
      accent_color: accentColor,
      filename: filename,
      unified: unified,
      non_qualified: null,
      sort_order: 0,
      added_in: "1.0",
      unicode_version: "6.1",
      skin_variations: null,
      has_img_apple: true,
      has_img_google: true,
      has_img_twitter: true,
      has_img_facebook: true,
      is_votable: true,
      search_text: `${emoji} ${name} ${shortName}`.toLowerCase(),
    })
  }

  console.log(`\n💾 Inserting ${emojiData.length} emojis into database...`)

  // Insert in batches of 50
  const batchSize = 50
  for (let i = 0; i < emojiData.length; i += batchSize) {
    const batch = emojiData.slice(i, i + batchSize)

    const { error } = await supabase.from("emojis").insert(batch)

    if (error) {
      console.error(`❌ Error inserting batch ${i / batchSize + 1}:`, error)
    } else {
      console.log(
        `✅ Inserted batch ${i / batchSize + 1} (${batch.length} emojis)`
      )
    }
  }

  // Also update specific emojis
  await updateSpecificEmojis()

  // Verify final count
  const { count } = await supabase
    .from("emojis")
    .select("*", { count: "exact", head: true })

  console.log(`\n🎉 Database now contains ${count} emojis!`)
}

if (require.main === module) {
  updateEmojiDatabase()
    .then(() => {
      console.log("\n✅ Done!")
      process.exit(0)
    })
    .catch((error) => {
      console.error("❌ Failed:", error)
      process.exit(1)
    })
}
