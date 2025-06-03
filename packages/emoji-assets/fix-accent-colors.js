const { Vibrant } = require("node-vibrant/node")
const path = require("path")
const fs = require("fs")

// You'll need to add your Supabase connection here
const { createClient } = require("@supabase/supabase-js")

// Add your Supabase URL and key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "your-supabase-url"
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "your-service-role-key"
const supabase = createClient(supabaseUrl, supabaseKey)

async function extractAccentColor(imagePath) {
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

    return "#888888" // Fallback
  } catch (error) {
    console.warn(`Failed to extract color from ${imagePath}:`, error.message)
    return "#888888"
  }
}

async function fixAccentColors() {
  console.log("🎨 Fixing accent colors in database...\n")

  // Get all emojis from database
  const { data: emojis, error } = await supabase
    .from("emojis")
    .select("emoji, filename, accent_color")
    .order("emoji")

  if (error) {
    console.error("Error fetching emojis:", error)
    return
  }

  console.log(`Found ${emojis.length} emojis in database\n`)

  let updated = 0
  let skipped = 0
  let errors = 0

  for (const emoji of emojis) {
    const imagePath = path.join(__dirname, "images/apple-160", emoji.filename)

    if (!fs.existsSync(imagePath)) {
      console.log(`⚠️  ${emoji.emoji}: Image not found (${emoji.filename})`)
      skipped++
      continue
    }

    // Extract new accent color
    const newColor = await extractAccentColor(imagePath)

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
      .eq("emoji", emoji.emoji)

    if (updateError) {
      console.error(`❌ Failed to update ${emoji.emoji}:`, updateError.message)
      errors++
    } else {
      updated++
    }
  }

  console.log("\n📊 Summary:")
  console.log(`✅ Updated: ${updated}`)
  console.log(`⚠️  Skipped: ${skipped}`)
  console.log(`❌ Errors: ${errors}`)
  console.log(`✨ Total processed: ${emojis.length}`)
}

async function fixSpecificEmojis() {
  // Test with the problematic emojis first
  const testEmojis = ["💯", "🔥", "❤️", "🎯", "🚀"]

  console.log("🧪 Testing specific emojis first...\n")

  for (const emojiChar of testEmojis) {
    const { data: emoji, error } = await supabase
      .from("emojis")
      .select("emoji, filename, accent_color")
      .eq("emoji", emojiChar)
      .single()

    if (error) {
      console.log(`❌ ${emojiChar}: Not found in database`)
      continue
    }

    const imagePath = path.join(__dirname, "images/apple-160", emoji.filename)
    const newColor = await extractAccentColor(imagePath)

    console.log(
      `${emojiChar}: DB=${emoji.accent_color} → Extracted=${newColor}`
    )

    if (newColor !== emoji.accent_color) {
      const { error: updateError } = await supabase
        .from("emojis")
        .update({ accent_color: newColor })
        .eq("emoji", emojiChar)

      if (updateError) {
        console.log(`❌ Failed to update ${emojiChar}`)
      } else {
        console.log(`✅ Updated ${emojiChar}`)
      }
    }
  }
}

// Run the fix
if (process.argv.includes("--test")) {
  fixSpecificEmojis()
} else if (process.argv.includes("--all")) {
  fixAccentColors()
} else {
  console.log("Usage:")
  console.log(
    "  node fix-accent-colors.js --test   # Fix specific problematic emojis"
  )
  console.log(
    "  node fix-accent-colors.js --all    # Fix all emojis in database"
  )
}
