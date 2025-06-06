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

// Create Supabase client with service key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Manual fallback mapping for common symbols not in emojibase
const MANUAL_EMOJI_DATA: Record<
  string,
  { name: string; keywords: string[]; category: string }
> = {
  // Copyright and trademark symbols
  "©": {
    name: "COPYRIGHT",
    keywords: ["copyright", "symbol", "legal"],
    category: "Symbols",
  },
  "®": {
    name: "REGISTERED",
    keywords: ["registered", "trademark", "symbol", "legal"],
    category: "Symbols",
  },
  "™": {
    name: "TRADE MARK",
    keywords: ["trademark", "symbol", "legal"],
    category: "Symbols",
  },

  // Weather symbols
  "☀": {
    name: "BLACK SUN WITH RAYS",
    keywords: ["sun", "sunny", "weather", "bright"],
    category: "Travel & Places",
  },
  "☁": {
    name: "CLOUD",
    keywords: ["cloud", "cloudy", "weather"],
    category: "Travel & Places",
  },
  "☂": {
    name: "UMBRELLA",
    keywords: ["umbrella", "rain", "weather"],
    category: "Travel & Places",
  },
  "☃": {
    name: "SNOWMAN",
    keywords: ["snowman", "snow", "winter", "cold"],
    category: "Travel & Places",
  },
  "☄": {
    name: "COMET",
    keywords: ["comet", "space", "shooting", "star"],
    category: "Travel & Places",
  },
  "❄": {
    name: "SNOWFLAKE",
    keywords: ["snowflake", "snow", "winter", "cold"],
    category: "Travel & Places",
  },

  // Time symbols
  "⌚": {
    name: "WATCH",
    keywords: ["watch", "time", "clock"],
    category: "Travel & Places",
  },
  "⌛": {
    name: "HOURGLASS",
    keywords: ["hourglass", "time", "sand", "timer"],
    category: "Travel & Places",
  },
  "⏰": {
    name: "ALARM CLOCK",
    keywords: ["alarm", "clock", "time", "wake"],
    category: "Travel & Places",
  },

  // Clock faces
  "🕐": {
    name: "ONE OCLOCK",
    keywords: ["one", "clock", "time", "1"],
    category: "Travel & Places",
  },
  "🕑": {
    name: "TWO OCLOCK",
    keywords: ["two", "clock", "time", "2"],
    category: "Travel & Places",
  },
  "🕒": {
    name: "THREE OCLOCK",
    keywords: ["three", "clock", "time", "3"],
    category: "Travel & Places",
  },
  "🕓": {
    name: "FOUR OCLOCK",
    keywords: ["four", "clock", "time", "4"],
    category: "Travel & Places",
  },
  "🕔": {
    name: "FIVE OCLOCK",
    keywords: ["five", "clock", "time", "5"],
    category: "Travel & Places",
  },
  "🕕": {
    name: "SIX OCLOCK",
    keywords: ["six", "clock", "time", "6"],
    category: "Travel & Places",
  },
  "🕖": {
    name: "SEVEN OCLOCK",
    keywords: ["seven", "clock", "time", "7"],
    category: "Travel & Places",
  },
  "🕗": {
    name: "EIGHT OCLOCK",
    keywords: ["eight", "clock", "time", "8"],
    category: "Travel & Places",
  },
  "🕘": {
    name: "NINE OCLOCK",
    keywords: ["nine", "clock", "time", "9"],
    category: "Travel & Places",
  },
  "🕙": {
    name: "TEN OCLOCK",
    keywords: ["ten", "clock", "time", "10"],
    category: "Travel & Places",
  },
  "🕚": {
    name: "ELEVEN OCLOCK",
    keywords: ["eleven", "clock", "time", "11"],
    category: "Travel & Places",
  },
  "🕛": {
    name: "TWELVE OCLOCK",
    keywords: ["twelve", "clock", "time", "12"],
    category: "Travel & Places",
  },

  // Arrows
  "➡": {
    name: "BLACK RIGHTWARDS ARROW",
    keywords: ["arrow", "right", "direction"],
    category: "Symbols",
  },
  "⬅": {
    name: "LEFTWARDS BLACK ARROW",
    keywords: ["arrow", "left", "direction"],
    category: "Symbols",
  },
  "⬆": {
    name: "UPWARDS BLACK ARROW",
    keywords: ["arrow", "up", "direction"],
    category: "Symbols",
  },
  "⬇": {
    name: "DOWNWARDS BLACK ARROW",
    keywords: ["arrow", "down", "direction"],
    category: "Symbols",
  },

  // Math symbols
  "➕": {
    name: "HEAVY PLUS SIGN",
    keywords: ["plus", "add", "math"],
    category: "Symbols",
  },
  "➖": {
    name: "HEAVY MINUS SIGN",
    keywords: ["minus", "subtract", "math"],
    category: "Symbols",
  },
  "➗": {
    name: "HEAVY DIVISION SIGN",
    keywords: ["division", "divide", "math"],
    category: "Symbols",
  },

  // Playing cards
  "♠": {
    name: "BLACK SPADE SUIT",
    keywords: ["spade", "cards", "game"],
    category: "Activities",
  },
  "♣": {
    name: "BLACK CLUB SUIT",
    keywords: ["club", "cards", "game"],
    category: "Activities",
  },
  "♥": {
    name: "BLACK HEART SUIT",
    keywords: ["heart", "cards", "game"],
    category: "Activities",
  },
  "♦": {
    name: "BLACK DIAMOND SUIT",
    keywords: ["diamond", "cards", "game"],
    category: "Activities",
  },

  // Zodiac signs
  "♈": {
    name: "ARIES",
    keywords: ["aries", "zodiac", "ram"],
    category: "Symbols",
  },
  "♉": {
    name: "TAURUS",
    keywords: ["taurus", "zodiac", "bull"],
    category: "Symbols",
  },
  "♊": {
    name: "GEMINI",
    keywords: ["gemini", "zodiac", "twins"],
    category: "Symbols",
  },
  "♋": {
    name: "CANCER",
    keywords: ["cancer", "zodiac", "crab"],
    category: "Symbols",
  },
  "♌": {
    name: "LEO",
    keywords: ["leo", "zodiac", "lion"],
    category: "Symbols",
  },
  "♍": {
    name: "VIRGO",
    keywords: ["virgo", "zodiac", "maiden"],
    category: "Symbols",
  },
  "♎": {
    name: "LIBRA",
    keywords: ["libra", "zodiac", "scales"],
    category: "Symbols",
  },
  "♏": {
    name: "SCORPIUS",
    keywords: ["scorpio", "zodiac", "scorpion"],
    category: "Symbols",
  },
  "♐": {
    name: "SAGITTARIUS",
    keywords: ["sagittarius", "zodiac", "archer"],
    category: "Symbols",
  },
  "♑": {
    name: "CAPRICORN",
    keywords: ["capricorn", "zodiac", "goat"],
    category: "Symbols",
  },
  "♒": {
    name: "AQUARIUS",
    keywords: ["aquarius", "zodiac", "water"],
    category: "Symbols",
  },
  "♓": {
    name: "PISCES",
    keywords: ["pisces", "zodiac", "fish"],
    category: "Symbols",
  },

  // Basic objects
  "☕": {
    name: "HOT BEVERAGE",
    keywords: ["coffee", "hot", "drink", "beverage"],
    category: "Food & Drink",
  },
  "☎": {
    name: "BLACK TELEPHONE",
    keywords: ["phone", "telephone", "call"],
    category: "Objects",
  },

  // Common symbols
  "☑": {
    name: "BALLOT BOX WITH CHECK",
    keywords: ["check", "ballot", "vote", "box"],
    category: "Symbols",
  },
  "❤": {
    name: "HEAVY BLACK HEART",
    keywords: ["heart", "love", "red"],
    category: "Smileys & Emotion",
  },
  "⭐": {
    name: "WHITE MEDIUM STAR",
    keywords: ["star", "favorite"],
    category: "Travel & Places",
  },
  "⭕": {
    name: "HEAVY LARGE CIRCLE",
    keywords: ["circle", "red"],
    category: "Symbols",
  },

  // Shapes
  "▪": {
    name: "BLACK SMALL SQUARE",
    keywords: ["square", "black", "small"],
    category: "Symbols",
  },
  "▫": {
    name: "WHITE SMALL SQUARE",
    keywords: ["square", "white", "small"],
    category: "Symbols",
  },
  "▶": {
    name: "BLACK RIGHT-POINTING TRIANGLE",
    keywords: ["play", "triangle", "right"],
    category: "Symbols",
  },
  "◀": {
    name: "BLACK LEFT-POINTING TRIANGLE",
    keywords: ["triangle", "left"],
    category: "Symbols",
  },
  "◻": {
    name: "WHITE MEDIUM SQUARE",
    keywords: ["square", "white", "medium"],
    category: "Symbols",
  },
  "◼": {
    name: "BLACK MEDIUM SQUARE",
    keywords: ["square", "black", "medium"],
    category: "Symbols",
  },
  "◽": {
    name: "WHITE MEDIUM SMALL SQUARE",
    keywords: ["square", "white"],
    category: "Symbols",
  },
  "◾": {
    name: "BLACK MEDIUM SMALL SQUARE",
    keywords: ["square", "black"],
    category: "Symbols",
  },

  // Warning and hazard
  "⚠": {
    name: "WARNING SIGN",
    keywords: ["warning", "caution", "alert"],
    category: "Symbols",
  },
  "☢": {
    name: "RADIOACTIVE SIGN",
    keywords: ["radioactive", "danger", "nuclear"],
    category: "Symbols",
  },
  "☣": {
    name: "BIOHAZARD SIGN",
    keywords: ["biohazard", "danger", "toxic"],
    category: "Symbols",
  },
}

async function populateSupabaseDatabase() {
  console.log("🚀 FIXING BROKEN EMOJI DATA (SAFE MODE)")
  console.log("=====================================\n")

  try {
    // First, check what emojis are currently broken
    const { data: brokenEmojis, error: brokenError } = await supabase
      .from("emojis")
      .select("emoji, name, keywords")
      .eq("name", "EMOJI")

    if (brokenError) {
      console.error("❌ Error checking broken emojis:", brokenError)
      return
    }

    console.log(
      `🚨 Found ${brokenEmojis?.length || 0} emojis with generic "EMOJI" names`
    )

    if (!brokenEmojis || brokenEmojis.length === 0) {
      console.log(
        "✅ No broken emojis found! Database is already in good shape."
      )
      return
    }

    // Show sample of broken emojis
    console.log("\n📝 Sample broken emojis that will be fixed:")
    brokenEmojis.slice(0, 10).forEach((emoji) => {
      console.log(
        `   ${emoji.emoji} - Currently: "${
          emoji.name
        }" with keywords: ${JSON.stringify(emoji.keywords)}`
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

    // Only prepare updates for emojis that are currently broken
    const emojiUpdates = brokenEmojis
      .map((brokenEmoji) => {
        const properData = properEmojiData.get(brokenEmoji.emoji)
        if (!properData) {
          console.warn(`⚠️  No proper data found for ${brokenEmoji.emoji}`)
          return null
        }

        return {
          emoji: properData.emoji,
          name: properData.name,
          short_name: properData.short_name,
          short_names: properData.short_names,
          keywords: properData.keywords,
          category: properData.category,
          accent_color: properData.accent_color,
          filename: properData.filename,
          unified: properData.unified,
          search_text: `${properData.emoji} ${properData.name} ${
            properData.short_name
          } ${properData.keywords.join(" ")}`.toLowerCase(),
          // Keep existing fields that shouldn't change
          is_votable: true,
        }
      })
      .filter((update): update is NonNullable<typeof update> => update !== null) // Proper type narrowing

    console.log(`\n🎯 Preparing to fix ${emojiUpdates.length} broken emojis`)
    console.log("📋 Will ONLY update emojis that currently have name = 'EMOJI'")
    console.log("✅ Will NOT touch emojis that already have proper names")

    // Show examples of what will be fixed
    console.log("\n🔧 Examples of fixes:")
    emojiUpdates.slice(0, 5).forEach((update) => {
      console.log(
        `   ${update.emoji} - Will become: "${update.name}" with ${update.keywords.length} proper keywords`
      )
    })

    // Ask for confirmation (in a real run, you might want to add a prompt here)
    console.log(
      "\n⚠️  SAFETY CHECK: This will only update emojis with name='EMOJI'"
    )

    // Check current database state
    const { count: currentCount } = await supabase
      .from("emojis")
      .select("*", { count: "exact", head: true })

    console.log(`📈 Current database has ${currentCount} total emojis`)

    // Update in batches, but only emojis that are currently broken
    const batchSize = 50 // Smaller batches for safety
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
        // Use update with a WHERE condition to ONLY update broken emojis
        for (const update of batch) {
          const { error } = await supabase
            .from("emojis")
            .update({
              name: update.name,
              short_name: update.short_name,
              short_names: update.short_names,
              keywords: update.keywords,
              category: update.category,
              search_text: update.search_text,
              updated_at: new Date().toISOString(),
            })
            .eq("emoji", update.emoji)
            .eq("name", "EMOJI") // CRITICAL: Only update if current name is "EMOJI"

          if (error) {
            console.error(`❌ Error updating ${update.emoji}:`, error)
            errors++
          } else {
            updated++
          }
        }

        console.log(`✅ Processed batch ${Math.floor(i / batchSize) + 1}`)

        // Add a small delay between batches
        await new Promise((resolve) => setTimeout(resolve, 200))
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
      .select("emoji, name")
      .eq("name", "EMOJI")

    console.log("\n🎉 UPDATE COMPLETE!")
    console.log("==================")
    console.log(`📊 Statistics:`)
    console.log(`   - Successfully updated: ${updated}`)
    console.log(`   - Errors: ${errors}`)
    console.log(`   - Still broken: ${stillBroken?.length || 0}`)

    // Test the search functionality
    console.log("\n🔍 Testing search functionality...")

    const { data: smileEmojis, error: searchError } = await supabase
      .from("emojis")
      .select("emoji, name, keywords")
      .or(`name.ilike.%smile%,array_to_string(keywords,' ').ilike.%smile%`)
      .not("accent_color", "is", null)
      .not("is_votable", "is", false)
      .limit(10)

    if (searchError) {
      console.error("❌ Search test failed:", searchError)
    } else {
      console.log(
        `✅ Search for "smile" returned ${smileEmojis?.length || 0} results:`
      )
      smileEmojis?.slice(0, 5).forEach((emoji) => {
        console.log(`   ${emoji.emoji} ${emoji.name}`)
      })
    }

    // Show some sample fixed emojis
    console.log("\n📈 Sample fixed emoji data:")
    const { data: sampleEmojis } = await supabase
      .from("emojis")
      .select("emoji, name, keywords")
      .in("emoji", ["🤮", "🤯", "🥳", "🥴", "🥵"])

    sampleEmojis?.forEach((emoji) => {
      console.log(
        `   ${emoji.emoji} "${emoji.name}" - Keywords: ${emoji.keywords
          .slice(0, 5)
          .join(", ")}...`
      )
    })
  } catch (error) {
    console.error("❌ Failed to fix database:", error)
    process.exit(1)
  }
}

// Run the population
if (require.main === module) {
  populateSupabaseDatabase()
    .then(() => {
      console.log("\n✅ Database population complete!")
      process.exit(0)
    })
    .catch((error) => {
      console.error("❌ Database population failed:", error)
      process.exit(1)
    })
}

export { populateSupabaseDatabase }
