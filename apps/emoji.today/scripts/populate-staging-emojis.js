#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

// Load environment variables from .env.local specifically
dotenv.config({ path: ".env.local" })

// Use staging database
const STAGING_URL = "https://rlhcjdxokgdzwxevqjtr.supabase.co"
const STAGING_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!STAGING_SERVICE_KEY) {
  console.error("❌ Missing SUPABASE_SERVICE_ROLE_KEY in your .env.local")
  console.error(
    "   Get it from: https://supabase.com/dashboard/project/rlhcjdxokgdzwxevqjtr/settings/api"
  )
  console.error("   Current working directory:", process.cwd())
  console.error(
    "   Looking for .env.local file at:",
    process.cwd() + "/.env.local"
  )
  process.exit(1)
}

const supabase = createClient(STAGING_URL, STAGING_SERVICE_KEY)

// Essential emojis for testing
const essentialEmojis = [
  {
    emoji: "😎",
    name: "SMILING FACE WITH SUNGLASSES",
    short_name: "sunglasses",
    short_names: ["sunglasses", "cool"],
    keywords: ["sunglasses", "cool", "smile", "face", "smileys", "emotion"],
    category: "Smileys & Emotion",
    accent_color: "#ffcc4d",
    filename: "1f60e.png",
    unified: "1F60E",
  },
  {
    emoji: "👍",
    name: "THUMBS UP",
    short_name: "thumbs_up",
    short_names: ["thumbs_up", "+1"],
    keywords: [
      "thumbs",
      "up",
      "yes",
      "awesome",
      "good",
      "agree",
      "accept",
      "cool",
      "hand",
      "like",
      "people",
      "body",
    ],
    category: "People & Body",
    accent_color: "#ffcc4d",
    filename: "1f44d.png",
    unified: "1F44D",
  },
  {
    emoji: "⚡",
    name: "HIGH VOLTAGE",
    short_name: "zap",
    short_names: ["zap", "lightning"],
    keywords: [
      "lightning",
      "bolt",
      "fast",
      "zap",
      "electric",
      "energy",
      "weather",
      "travel",
      "places",
    ],
    category: "Travel & Places",
    accent_color: "#f4d03f",
    filename: "26a1.png",
    unified: "26A1",
  },
  {
    emoji: "👎",
    name: "THUMBS DOWN",
    short_name: "thumbs_down",
    short_names: ["thumbs_down", "-1"],
    keywords: ["thumbs", "down", "no", "dislike", "hand", "people", "body"],
    category: "People & Body",
    accent_color: "#ffcc4d",
    filename: "1f44e.png",
    unified: "1F44E",
  },
  {
    emoji: "⭐",
    name: "STAR",
    short_name: "star",
    short_names: ["star"],
    keywords: ["star", "night", "yellow", "astronomy", "space"],
    category: "Travel & Places",
    accent_color: "#f1c40f",
    filename: "2b50.png",
    unified: "2B50",
  },
  {
    emoji: "✨",
    name: "SPARKLES",
    short_name: "sparkles",
    short_names: ["sparkles"],
    keywords: ["stars", "shine", "shiny", "cool", "awesome", "good", "magic"],
    category: "Travel & Places",
    accent_color: "#f39c12",
    filename: "2728.png",
    unified: "2728",
  },
  {
    emoji: "🔥",
    name: "FIRE",
    short_name: "fire",
    short_names: ["fire", "flame"],
    keywords: ["fire", "flame", "hot", "lit", "snapstreak"],
    category: "Travel & Places",
    accent_color: "#e74c3c",
    filename: "1f525.png",
    unified: "1F525",
  },
  {
    emoji: "💯",
    name: "HUNDRED POINTS",
    short_name: "100",
    short_names: ["100", "hundred"],
    keywords: ["hundred", "perfect", "score", "full", "numbers"],
    category: "Symbols",
    accent_color: "#e74c3c",
    filename: "1f4af.png",
    unified: "1F4AF",
  },
  {
    emoji: "❤️",
    name: "RED HEART",
    short_name: "heart",
    short_names: ["heart", "love"],
    keywords: ["love", "like", "heart", "affection", "valentines", "red"],
    category: "Smileys & Emotion",
    accent_color: "#e74c3c",
    filename: "2764-fe0f.png",
    unified: "2764-FE0F",
  },
  {
    emoji: "😂",
    name: "FACE WITH TEARS OF JOY",
    short_name: "joy",
    short_names: ["joy", "tears_of_joy"],
    keywords: ["face", "cry", "tears", "weep", "happy", "happytears", "haha"],
    category: "Smileys & Emotion",
    accent_color: "#ffcc4d",
    filename: "1f602.png",
    unified: "1F602",
  },
  {
    emoji: "🚀",
    name: "ROCKET",
    short_name: "rocket",
    short_names: ["rocket"],
    keywords: ["rocket", "ship", "launch", "space", "travel"],
    category: "Travel & Places",
    accent_color: "#3498db",
    filename: "1f680.png",
    unified: "1F680",
  },
  {
    emoji: "🎉",
    name: "PARTY POPPER",
    short_name: "tada",
    short_names: ["tada", "party"],
    keywords: ["party", "celebration", "birthday", "congrats", "tada"],
    category: "Activities",
    accent_color: "#f39c12",
    filename: "1f389.png",
    unified: "1F389",
  },
]

async function populateStagingEmojis() {
  console.log("🚀 Populating STAGING database with essential emojis...\n")
  console.log(`🔗 Database: ${STAGING_URL}`)

  // First check if any emojis already exist
  const { count: existingCount } = await supabase
    .from("emojis")
    .select("*", { count: "exact", head: true })

  console.log(`📊 Current emoji count: ${existingCount || 0}`)

  if (existingCount && existingCount > 0) {
    console.log("✅ Emojis already exist in staging database!")
    console.log(
      "   If you want to refresh them, delete them first via Supabase dashboard."
    )
    return
  }

  console.log(`\n📝 Inserting ${essentialEmojis.length} essential emojis...\n`)

  for (const emoji of essentialEmojis) {
    console.log(`Processing ${emoji.emoji} (${emoji.name})...`)

    try {
      const { error } = await supabase.from("emojis").insert({
        emoji: emoji.emoji,
        name: emoji.name,
        short_name: emoji.short_name,
        short_names: emoji.short_names,
        keywords: emoji.keywords,
        category: emoji.category,
        subcategory: null,
        accent_color: emoji.accent_color,
        filename: emoji.filename,
        unified: emoji.unified,
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
        search_text:
          `${emoji.emoji} ${emoji.name} ${emoji.short_name}`.toLowerCase(),
      })

      if (error) {
        console.error(`❌ Error inserting ${emoji.emoji}:`, error)
        console.error(`   Full error details:`, JSON.stringify(error, null, 2))
      } else {
        console.log(`✅ Successfully inserted ${emoji.emoji}`)
      }
    } catch (err) {
      console.error(`❌ Exception inserting ${emoji.emoji}:`, err)
    }
  }

  // Verify final count
  const { count: finalCount } = await supabase
    .from("emojis")
    .select("*", { count: "exact", head: true })

  console.log(`\n🎉 Staging database now contains ${finalCount} emojis!`)
  console.log("✅ Ready for testing the voting and minting flow!")
}

populateStagingEmojis()
  .then(() => {
    console.log("\n🏁 Done!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("❌ Failed:", error)
    process.exit(1)
  })
