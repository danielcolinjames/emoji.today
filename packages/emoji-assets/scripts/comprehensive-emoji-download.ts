#!/usr/bin/env tsx

import fs from "fs"
import path from "path"
import https from "https"
import { promisify } from "util"

// Load emoji data from emojibase-data (same as our analysis)
const emojiDataPath = path.join(
  __dirname,
  "../../../node_modules/emojibase-data/en/data.json"
)
const emojiData = JSON.parse(fs.readFileSync(emojiDataPath, "utf8"))

const writeFile = promisify(fs.writeFile)
const mkdir = promisify(fs.mkdir)

// Type definitions
interface EmojibaseData {
  label: string
  emoji: string
  group: number
  hexcode: string
  shortcodes?: string[]
  tags?: string[]
  version?: number
  skins?: EmojibaseData[]
}

const IMAGES_DIR = path.join(__dirname, "../images/apple-160")
const EMOJI_DATA_BASE_URL =
  "https://raw.githubusercontent.com/iamcal/emoji-data/master/img-apple-160"

// Function to get image filename variations for an emoji
function getImageFilenames(hexcode: string): string[] {
  const baseCode = hexcode.toLowerCase()

  // emoji-data repository naming conventions:
  // 1. Most emojis have -fe0f (variation selector) suffix
  // 2. Some use the base code without variation selector
  // 3. Some complex sequences use full hexcode
  const variants = [
    `${baseCode}.png`, // Base: 1f600.png
    `${baseCode}-fe0f.png`, // With variation selector: 1f600-fe0f.png
    `${baseCode.replace(/-fe0f/g, "")}-fe0f.png`, // Ensure -fe0f: 1f600-fe0f.png
    `${baseCode.replace(/-/g, "")}.png`, // No dashes: 1f600.png
    `${baseCode.replace(/-fe0f$/, "")}.png`, // Remove trailing -fe0f: 1f600.png
  ]

  return [...new Set(variants)] // Remove duplicates
}

// Function to check if image exists locally
function imageExists(hexcode: string): boolean {
  const filenames = getImageFilenames(hexcode)
  return filenames.some((filename) =>
    fs.existsSync(path.join(IMAGES_DIR, filename))
  )
}

// Function to download image with retries
async function downloadImage(
  url: string,
  filepath: string,
  retries = 3
): Promise<boolean> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await new Promise<void>((resolve, reject) => {
        const file = fs.createWriteStream(filepath)

        https
          .get(url, (response) => {
            if (response.statusCode === 404) {
              reject(new Error(`Not found: ${response.statusCode}`))
              return
            }
            if (response.statusCode !== 200) {
              reject(new Error(`HTTP error: ${response.statusCode}`))
              return
            }

            response.pipe(file)

            file.on("finish", () => {
              file.close()
              resolve()
            })

            file.on("error", (err) => {
              fs.unlink(filepath, () => {}) // Delete the file on error
              reject(err)
            })
          })
          .on("error", (err) => {
            reject(err)
          })
      })

      return true // Success
    } catch (error) {
      console.log(`   Attempt ${attempt}/${retries} failed: ${error}`)
      if (attempt === retries) {
        return false // All attempts failed
      }
      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }
  return false
}

// Function to try multiple download URLs for a single emoji
async function downloadEmojiImage(emoji: EmojibaseData): Promise<boolean> {
  const hexcode = emoji.hexcode.toLowerCase()

  // Try different filename formats - BOTH base and FE0F variations
  const urlVariants = [
    `${hexcode}.png`, // Base first: 2648.png (for zodiac signs)
    `${hexcode}-fe0f.png`, // Then FE0F: 1f600-fe0f.png (for most others)
    `${hexcode.replace(/-fe0f/g, "")}.png`, // Ensure base without FE0F
    `${hexcode.replace(/-/g, "")}.png`, // No dashes at all
  ]

  for (const filename of [...new Set(urlVariants)]) {
    const url = `${EMOJI_DATA_BASE_URL}/${filename}`
    const localFilename = `${hexcode}.png` // Always save as standard format
    const filepath = path.join(IMAGES_DIR, localFilename)

    // Skip if already exists
    if (fs.existsSync(filepath)) {
      return true
    }

    console.log(`   Trying: ${filename}`)
    const success = await downloadImage(url, filepath)

    if (success) {
      console.log(
        `   ✅ Downloaded: ${emoji.emoji} ${emoji.label} (${filename})`
      )
      return true
    }
  }

  return false
}

// Main comprehensive download function
async function downloadAllMissingEmojis() {
  console.log("🚀 COMPREHENSIVE EMOJI IMAGE DOWNLOAD")
  console.log("=====================================\n")

  // Ensure output directory exists
  await mkdir(IMAGES_DIR, { recursive: true })

  console.log(`📊 Loading ${emojiData.length} emojis from emojibase...`)

  const missingEmojis: EmojibaseData[] = []
  const existingEmojis: EmojibaseData[] = []

  // First pass: identify missing emojis
  for (const data of emojiData as EmojibaseData[]) {
    // Skip component emojis (skin tones, hair styles, etc.)
    if (data.group === 2) continue

    if (!imageExists(data.hexcode)) {
      missingEmojis.push(data)
    } else {
      existingEmojis.push(data)
    }
  }

  console.log(`✅ Existing images: ${existingEmojis.length}`)
  console.log(`❌ Missing images: ${missingEmojis.length}`)
  console.log(
    `📈 Current coverage: ${(
      (existingEmojis.length / (existingEmojis.length + missingEmojis.length)) *
      100
    ).toFixed(1)}%\n`
  )

  if (missingEmojis.length === 0) {
    console.log("🎉 All emoji images already exist! 100% coverage achieved.")
    return
  }

  console.log(
    `🔄 Starting download of ${missingEmojis.length} missing images...\n`
  )

  let downloaded = 0
  let failed = 0
  let alreadyExisted = 0

  // Download missing emojis with progress tracking
  for (let i = 0; i < missingEmojis.length; i++) {
    const emoji = missingEmojis[i]

    console.log(
      `[${i + 1}/${missingEmojis.length}] ${emoji.emoji} ${emoji.label} (${
        emoji.hexcode
      })`
    )

    // Check if it already exists (might have been downloaded in a previous run)
    if (imageExists(emoji.hexcode)) {
      console.log(`   ⏭️  Already exists, skipping`)
      alreadyExisted++
      continue
    }

    const success = await downloadEmojiImage(emoji)

    if (success) {
      downloaded++
    } else {
      failed++
      console.log(`   ❌ Failed to download: ${emoji.emoji} ${emoji.label}`)
    }

    // Small delay to be nice to the server
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Progress update every 25 downloads
    if ((i + 1) % 25 === 0) {
      console.log(
        `\n📊 Progress: ${i + 1}/${
          missingEmojis.length
        } processed (${downloaded} downloaded, ${failed} failed)\n`
      )
    }
  }

  // Final results
  const finalExisting = existingEmojis.length + alreadyExisted + downloaded
  const finalTotal = existingEmojis.length + missingEmojis.length
  const finalCoverage = ((finalExisting / finalTotal) * 100).toFixed(1)

  console.log("\n🎯 FINAL RESULTS")
  console.log("================")
  console.log(`📥 Downloaded: ${downloaded}`)
  console.log(`⏭️  Already existed: ${alreadyExisted}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`✅ Total images: ${finalExisting}/${finalTotal}`)
  console.log(`📈 Coverage: ${finalCoverage}%`)

  if (finalCoverage === "100.0") {
    console.log("\n🎉 SUCCESS! 100% emoji image coverage achieved!")
  } else {
    console.log(`\n⚠️  ${failed} images still missing. These might be:`)
    console.log("   - Very new emojis not yet in emoji-data repository")
    console.log("   - Different naming conventions")
    console.log("   - Regional indicator symbols")
    console.log(
      "\n🔍 Run the missing emoji analysis to see what's still missing"
    )
  }

  // Save a log of failed downloads for debugging
  if (failed > 0) {
    const failedEmojis = missingEmojis.filter(
      (emoji) => !imageExists(emoji.hexcode)
    )
    const failedLog = failedEmojis.map((emoji) => ({
      emoji: emoji.emoji,
      label: emoji.label,
      hexcode: emoji.hexcode,
      version: emoji.version,
    }))

    await writeFile(
      path.join(__dirname, "../data/failed-downloads.json"),
      JSON.stringify(failedLog, null, 2)
    )
    console.log(`\n📝 Failed downloads logged to: data/failed-downloads.json`)
  }
}

// Run the comprehensive download
if (require.main === module) {
  downloadAllMissingEmojis()
    .then(() => {
      console.log("\n✅ Download process complete!")
      process.exit(0)
    })
    .catch((error) => {
      console.error("❌ Download process failed:", error)
      process.exit(1)
    })
}

export { downloadAllMissingEmojis }
