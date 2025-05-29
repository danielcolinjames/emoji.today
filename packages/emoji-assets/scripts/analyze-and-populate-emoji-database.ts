#!/usr/bin/env tsx

import { readFileSync, readdirSync, existsSync, statSync } from "fs"
import path from "path"
import { Vibrant } from "node-vibrant/node"

// Load emoji data from emojibase-data (paths relative to workspace root)
const emojiDataPath = path.join(
  __dirname,
  "../../../node_modules/emojibase-data/en/data.json"
)
const emojiData = JSON.parse(readFileSync(emojiDataPath, "utf8"))

// Load shortcodes for additional search keywords
const shortcodesPath = path.join(
  __dirname,
  "../../../node_modules/emojibase-data/en/shortcodes/github.json"
)
const shortcodesData = JSON.parse(readFileSync(shortcodesPath, "utf8"))

// Type definitions based on emojibase structure
interface EmojibaseData {
  label: string // Primary name/label
  emoji: string // The actual emoji character
  emoticon?: string // ASCII emoticon like :)
  group: number // Category group number
  hexcode: string // Unicode codepoint
  shortcodes?: string[] // Array of shortcode names
  tags?: string[] // Search tags/keywords
  text?: string // Text representation
  type?: number // Component type
  unicode?: string // Unicode version
  version?: number // Emoji version
  skins?: EmojibaseData[] // Skin tone variants
  gender?: number // 0=person, 1=man, 2=woman
}

// Category mapping (based on emojibase groups)
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

// Image paths
const IMAGES_DIR = path.join(__dirname, "../images/apple-160")

// Function to get image filename variations for an emoji
function getImageFilenames(hexcode: string): string[] {
  const baseCode = hexcode.toLowerCase()

  // Try multiple naming conventions:
  // 1. Simple: 1f600.png
  // 2. With dashes: 1f-60-0.png
  // 3. Full format: 1f600.png but also check if it has FE0F variants
  const variants = [
    `${baseCode}.png`,
    `${baseCode.replace(/-/g, "")}.png`,
    baseCode.includes("-") ? baseCode : `${baseCode}.png`,
  ]

  return [...new Set(variants)] // Remove duplicates
}

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

    // Ultimate fallback - calculate from emoji group
    return "#888888"
  } catch (error) {
    console.warn(`Failed to extract color from ${imagePath}:`, error)
    return "#888888"
  }
}

// Function to check if image exists and get its info
function getImageInfo(hexcode: string): {
  exists: boolean
  path?: string
  size?: number
  isEmpty?: boolean
} {
  const filenames = getImageFilenames(hexcode)

  for (const filename of filenames) {
    const fullPath = path.join(IMAGES_DIR, filename)
    if (existsSync(fullPath)) {
      const stats = statSync(fullPath)
      return {
        exists: true,
        path: fullPath,
        size: stats.size,
        isEmpty: stats.size === 0,
      }
    }
  }

  return { exists: false }
}

// Function to generate comprehensive keywords
function generateKeywords(
  data: EmojibaseData,
  shortcodes: string[] = []
): string[] {
  const keywords = new Set<string>()

  // Add label words (cleaned up)
  const labelWords = data.label
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 2)

  labelWords.forEach((word) => keywords.add(word))

  // Add shortcodes
  data.shortcodes?.forEach((shortcode) => keywords.add(shortcode))

  // Add additional shortcodes from GitHub mapping
  shortcodes.forEach((shortcode) => keywords.add(shortcode))

  // Add tags
  data.tags?.forEach((tag) => keywords.add(tag))

  // Add category-based keywords
  const category = CATEGORY_MAP[data.group]
  if (category) {
    const categoryWords = category
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((word) => word.length > 2)
    categoryWords.forEach((word) => keywords.add(word))
  }

  // Add emoticon-based keywords
  if (data.emoticon) {
    keywords.add("emoticon")
    const emoticonMeanings: Record<string, string[]> = {
      ":)": ["smile", "happy"],
      ":-)": ["smile", "happy"],
      ":(": ["sad", "frown"],
      ":-(": ["sad", "frown"],
      ":D": ["laugh", "big", "grin"],
      ":-D": ["laugh", "big", "grin"],
      ";)": ["wink"],
      ";-)": ["wink"],
      ":P": ["tongue", "playful"],
      ":-P": ["tongue", "playful"],
      ":o": ["surprise", "shock"],
      ":-o": ["surprise", "shock"],
      ":|": ["neutral", "straight"],
      ":-|": ["neutral", "straight"],
    }

    const meanings = emoticonMeanings[data.emoticon]
    if (meanings) {
      meanings.forEach((meaning) => keywords.add(meaning))
    }
  }

  return Array.from(keywords)
}

// Function to get base emoji (strip skin tones for search mapping)
function getBaseEmoji(data: EmojibaseData): string {
  if (data.skins && data.skins.length > 0) {
    return data.emoji
  }

  const skinToneModifiers = ["1F3FB", "1F3FC", "1F3FD", "1F3FE", "1F3FF"]
  const hasSkinTone = skinToneModifiers.some((modifier) =>
    data.hexcode.includes(modifier)
  )

  if (hasSkinTone) {
    return data.emoji // For now, we'll handle mapping in the database
  }

  return data.emoji
}

// Main analysis and processing function
async function analyzeAndPopulateEmojiDatabase() {
  console.log("🔍 EMOJI IMAGE & DATABASE ANALYSIS")
  console.log("====================================\n")

  console.log(`📊 Loading ${emojiData.length} emojis from emojibase...`)

  // Create a map of emoji to shortcodes from GitHub data
  const emojiToShortcodes: Record<string, string[]> = {}
  Object.entries(shortcodesData).forEach(
    ([shortcode, emoji]: [string, any]) => {
      if (typeof emoji === "string") {
        if (!emojiToShortcodes[emoji]) {
          emojiToShortcodes[emoji] = []
        }
        emojiToShortcodes[emoji].push(shortcode)
      }
    }
  )

  const processedEmojis: any[] = []
  const missingImages: any[] = []
  const emptyImages: any[] = []
  const validImages: any[] = []

  console.log("🖼️  Analyzing images and extracting colors...\n")

  // Process emojis with progress indication
  for (let i = 0; i < emojiData.length; i++) {
    const data = emojiData[i] as EmojibaseData

    // Skip component emojis (skin tones, hair styles, etc.)
    if (data.group === 2) continue

    const additionalShortcodes = emojiToShortcodes[data.emoji] || []
    const keywords = generateKeywords(data, additionalShortcodes)
    const category = CATEGORY_MAP[data.group] || "Unknown"

    // Check for image
    const imageInfo = getImageInfo(data.hexcode)

    let accentColor = "#888888" // Default fallback

    if (imageInfo.exists && !imageInfo.isEmpty) {
      try {
        accentColor = await extractAccentColor(imageInfo.path!)
        validImages.push({
          emoji: data.emoji,
          hexcode: data.hexcode,
          path: imageInfo.path,
          size: imageInfo.size,
        })
      } catch (error) {
        console.warn(
          `Failed to process ${data.emoji} (${data.hexcode}):`,
          error
        )
      }
    } else if (imageInfo.exists && imageInfo.isEmpty) {
      emptyImages.push({
        emoji: data.emoji,
        label: data.label,
        hexcode: data.hexcode,
        version: data.version,
      })
    } else {
      missingImages.push({
        emoji: data.emoji,
        label: data.label,
        hexcode: data.hexcode,
        version: data.version,
      })
    }

    // Determine Unicode version
    const emojiToUnicodeVersion: Record<number, string> = {
      1: "6.1",
      2: "8.0",
      3: "9.0",
      4: "10.0",
      5: "11.0",
      11: "11.0",
      12: "12.0",
      12.1: "12.1",
      13: "13.0",
      13.1: "13.1",
      14: "14.0",
      15: "15.0",
      15.1: "15.1",
      16: "16.0",
    }

    const processedEmoji = {
      emoji: data.emoji,
      unified: data.hexcode,
      non_qualified: null,
      name: data.label.toUpperCase(),
      short_name:
        (data.shortcodes && data.shortcodes[0]) ||
        data.label.toLowerCase().replace(/\s+/g, "_"),
      short_names: [...(data.shortcodes || []), ...additionalShortcodes],
      keywords,
      category,
      subcategory: null,
      sort_order: i,
      added_in: data.version?.toString() || "1.0",
      unicode_version: emojiToUnicodeVersion[data.version || 1] || "6.1",
      accent_color: accentColor,
      skin_variations: data.skins
        ? JSON.stringify(
            data.skins.map((skin) => ({
              emoji: skin.emoji,
              hexcode: skin.hexcode,
              tone: skin.type || 1,
            }))
          )
        : null,
      filename: `${data.hexcode.toLowerCase()}.png`,
      has_img_apple: true,
      has_img_google: true,
      has_img_twitter: true,
      has_img_facebook: true,
      base_emoji: getBaseEmoji(data),
      image_exists: imageInfo.exists,
      image_path: imageInfo.path,
      image_size: imageInfo.size,
    }

    processedEmojis.push(processedEmoji)

    // Progress indicator
    if ((i + 1) % 100 === 0) {
      console.log(`   Processed ${i + 1}/${emojiData.length} emojis...`)
    }
  }

  console.log("\n📈 ANALYSIS RESULTS")
  console.log("==================")
  console.log(`✅ Valid images: ${validImages.length}`)
  console.log(`❌ Missing images: ${missingImages.length}`)
  console.log(`🚫 Empty images: ${emptyImages.length}`)
  console.log(`📦 Total processed: ${processedEmojis.length}`)

  // Show missing Unicode 16.0 emojis specifically
  const missingV16 = missingImages.filter((img) => img.version === 16)
  const emptyV16 = emptyImages.filter((img) => img.version === 16)

  if (missingV16.length > 0 || emptyV16.length > 0) {
    console.log("\n🆕 MISSING UNICODE 16.0 EMOJIS (2024 release):")
    const allMissingV16 = missingV16.concat(emptyV16)
    allMissingV16.forEach((img) => {
      console.log(`   ${img.emoji} ${img.label} (${img.hexcode})`)
    })
  }

  // Show some stats
  const categories = [...new Set(processedEmojis.map((e) => e.category))]
  const versionCounts = processedEmojis.reduce((acc, emoji) => {
    acc[emoji.added_in] = (acc[emoji.added_in] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  console.log("\n📊 STATISTICS")
  console.log("============")
  console.log(`Categories: ${categories.length}`)
  console.log(
    `Emoji versions represented: ${Object.keys(versionCounts).length}`
  )
  console.log(`Unicode 16.0 emojis: ${versionCounts["16"] || 0}`)

  // Generate sample SQL
  console.log("\n💾 SAMPLE DATABASE INSERT")
  console.log("========================")
  const sampleEmojis = processedEmojis.filter((e) => e.image_exists).slice(0, 3)

  console.log(
    "INSERT INTO emojis (emoji, unified, non_qualified, name, short_name, short_names, keywords, category, subcategory, sort_order, added_in, unicode_version, accent_color, skin_variations, filename, has_img_apple, has_img_google, has_img_twitter, has_img_facebook) VALUES"
  )

  const values = sampleEmojis.map((emoji) => {
    const escapedName = emoji.name.replace(/'/g, "''")
    const escapedShortName = emoji.short_name.replace(/'/g, "''")
    const shortNamesArray = `{${emoji.short_names
      .map((name: string) => `"${name.replace(/"/g, '""')}"`)
      .join(",")}}`
    const keywordsArray = `{${emoji.keywords
      .map((keyword: string) => `"${keyword.replace(/"/g, '""')}"`)
      .join(",")}}`
    const escapedCategory = emoji.category.replace(/'/g, "''")
    const skinVariations = emoji.skin_variations
      ? `'${emoji.skin_variations.replace(/'/g, "''")}'::jsonb`
      : "NULL"

    return `  ('${emoji.emoji}', '${emoji.unified}', NULL, '${escapedName}', '${escapedShortName}', '${shortNamesArray}', '${keywordsArray}', '${escapedCategory}', NULL, ${emoji.sort_order}, '${emoji.added_in}', '${emoji.unicode_version}', '${emoji.accent_color}', ${skinVariations}, '${emoji.filename}', true, true, true, true)`
  })

  console.log(values.join(",\n"))
  console.log("ON CONFLICT (emoji) DO UPDATE SET")
  console.log("  unified = EXCLUDED.unified,")
  console.log("  name = EXCLUDED.name,")
  console.log("  keywords = EXCLUDED.keywords,")
  console.log("  accent_color = EXCLUDED.accent_color,")
  console.log("  updated_at = NOW();")

  console.log("\n🔧 NEXT STEPS")
  console.log("============")
  console.log("1. 📥 Download missing emoji images (see list above)")
  console.log("2. 🎨 Run this script again to extract accent colors")
  console.log("3. 💾 Populate Supabase database with processed data")
  console.log("4. 🖼️  Set up NFT generation pipeline")

  if (missingV16.length > 0 || emptyV16.length > 0) {
    console.log("\n📝 TO GET MISSING UNICODE 16.0 IMAGES:")
    console.log("Visit https://emojipedia.org/apple/ and download:")
    const allMissingV16Again = missingV16.concat(emptyV16)
    allMissingV16Again.forEach((img) => {
      console.log(
        `   ${img.emoji} https://emojipedia.org/${img.label
          .toLowerCase()
          .replace(/\s+/g, "-")}/`
      )
    })
  }

  return {
    processedEmojis,
    missingImages,
    emptyImages,
    validImages,
    stats: {
      total: processedEmojis.length,
      withImages: validImages.length,
      missing: missingImages.length,
      empty: emptyImages.length,
      unicode16Missing: missingV16.length + emptyV16.length,
    },
  }
}

// Run the analysis
if (require.main === module) {
  analyzeAndPopulateEmojiDatabase()
    .then((results) => {
      console.log("\n✅ Analysis complete!")
      process.exit(0)
    })
    .catch((error) => {
      console.error("❌ Analysis failed:", error)
      process.exit(1)
    })
}

export { analyzeAndPopulateEmojiDatabase }
