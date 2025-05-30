import { supabase } from "./lib/supabase"

const missingEmojis = [
  {
    emoji: "😎",
    name: "SMILING FACE WITH SUNGLASSES",
    short_name: "sunglasses",
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
    keywords: ["stars", "shine", "shiny", "cool", "awesome", "good", "magic"],
    category: "Travel & Places",
    accent_color: "#f39c12",
    filename: "2728.png",
    unified: "2728",
  },
]

async function populateMissingEmojis() {
  console.log("🚀 Adding missing emojis to database...\n")

  for (const emoji of missingEmojis) {
    console.log(`Processing ${emoji.emoji} (${emoji.name})...`)

    try {
      const { data, error } = await supabase.from("emojis").upsert(
        {
          emoji: emoji.emoji,
          name: emoji.name,
          short_name: emoji.short_name,
          short_names: [emoji.short_name],
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
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "emoji",
        }
      )

      if (error) {
        console.error(`❌ Error inserting ${emoji.emoji}:`, error)
      } else {
        console.log(`✅ Successfully inserted ${emoji.emoji}`)
      }
    } catch (err) {
      console.error(`❌ Exception inserting ${emoji.emoji}:`, err)
    }
  }

  console.log("\n🔍 Verifying inserted emojis...")

  // Verify they were inserted
  for (const emoji of missingEmojis) {
    const { data, error } = await supabase
      .from("emojis")
      .select("emoji, name, accent_color")
      .eq("emoji", emoji.emoji)
      .single()

    if (data) {
      console.log(`✅ ${emoji.emoji} (${data.name}): ${data.accent_color}`)
    } else {
      console.log(`❌ ${emoji.emoji}: Not found - ${error?.message}`)
    }
  }
}

if (require.main === module) {
  populateMissingEmojis()
    .then(() => {
      console.log("\n🎉 Done!")
      process.exit(0)
    })
    .catch((error) => {
      console.error("❌ Failed:", error)
      process.exit(1)
    })
}
