#!/usr/bin/env tsx

import fs from "fs"
import path from "path"
import https from "https"
import { readFileSync } from "fs"

// Load emoji data to match hexcodes
const emojiDataPath = path.join(
  __dirname,
  "../../../node_modules/emojibase-data/en/data.json"
)
const emojiData = JSON.parse(readFileSync(emojiDataPath, "utf8"))

const EMOJI_DATA_BASE_URL =
  "https://raw.githubusercontent.com/iamcal/emoji-data/master/img-apple-160"
const IMAGES_DIR = path.join(__dirname, "../images/apple-160")

interface EmojibaseData {
  label: string
  emoji: string
  group: number
  hexcode: string
  version?: number
}

// Create hexcode map for quick lookup
const hexcodeMap = new Map<string, EmojibaseData>()
for (const emoji of emojiData) {
  hexcodeMap.set(emoji.hexcode.toLowerCase(), emoji)
}

// Function to download a file
function downloadFile(url: string, filePath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const file = fs.createWriteStream(filePath)

    https
      .get(url, (response) => {
        if (response.statusCode === 200) {
          response.pipe(file)
          file.on("finish", () => {
            file.close()
            // Check if file is actually not empty
            const stats = fs.statSync(filePath)
            resolve(stats.size > 0)
          })
        } else {
          file.close()
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath)
          }
          resolve(false)
        }
      })
      .on("error", () => {
        file.close()
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath)
        }
        resolve(false)
      })
  })
}

// Enhanced filename variations based on emoji-data patterns
function getEmojiDataFilenames(hexcode: string): string[] {
  const baseCode = hexcode.toLowerCase()

  // Special patterns for different emoji types
  const variations: string[] = []

  // 1. Most emojis use base + FE0F
  variations.push(`${baseCode}-fe0f.png`)

  // 2. Some use just the base (like zodiac signs)
  variations.push(`${baseCode}.png`)

  // 3. For complex sequences, try without internal FE0F
  if (baseCode.includes("-fe0f-")) {
    variations.push(`${baseCode.replace(/-fe0f-/g, "-")}.png`)
  }

  // 4. Try with all FE0F removed
  variations.push(`${baseCode.replace(/-fe0f/g, "")}.png`)

  // 5. Try with just final FE0F removed
  variations.push(`${baseCode.replace(/-fe0f$/, "")}.png`)

  // 6. For single codepoints that might not need dashes
  if (!baseCode.includes("-")) {
    variations.push(`${baseCode}.png`)
    variations.push(`${baseCode}-fe0f.png`)
  }

  return [...new Set(variations)] // Remove duplicates
}

async function fixVotableEmojis() {
  console.log("🔧 FIXING VOTABLE EMOJI IMAGES")
  console.log("==============================\n")

  // Find empty files that are votable emojis
  const allFiles = fs.readdirSync(IMAGES_DIR)
  const emptyFiles = allFiles.filter((filename) => {
    const filePath = path.join(IMAGES_DIR, filename)
    const stats = fs.statSync(filePath)
    return stats.size === 0
  })

  const votableEmptyFiles = emptyFiles.filter((filename) => {
    const hexcode = filename.replace(".png", "").toLowerCase()
    const emojiInfo = hexcodeMap.get(hexcode)

    if (!emojiInfo) return false

    // Skip regional indicators, components, and flags
    if (emojiInfo.label.includes("REGIONAL INDICATOR")) return false
    if (emojiInfo.group === 2) return false // Components

    return true
  })

  console.log(
    `🎯 Found ${votableEmptyFiles.length} votable emojis missing images`
  )
  console.log(`📊 Starting targeted download...\n`)

  let successCount = 0
  let failureCount = 0
  const failures: string[] = []

  for (let i = 0; i < votableEmptyFiles.length; i++) {
    const filename = votableEmptyFiles[i]
    const hexcode = filename.replace(".png", "").toLowerCase()
    const emojiInfo = hexcodeMap.get(hexcode)
    const localPath = path.join(IMAGES_DIR, filename)

    console.log(
      `[${i + 1}/${votableEmptyFiles.length}] ${emojiInfo?.emoji} ${
        emojiInfo?.label
      }`
    )

    // Try different URL variations
    const variations = getEmojiDataFilenames(hexcode)
    let downloaded = false

    for (const variant of variations) {
      const url = `${EMOJI_DATA_BASE_URL}/${variant}`
      console.log(`   Trying: ${variant}`)

      const success = await downloadFile(url, localPath)
      if (success) {
        const stats = fs.statSync(localPath)
        console.log(`   ✅ Downloaded ${stats.size} bytes`)
        downloaded = true
        successCount++
        break
      } else {
        console.log(`   ❌ Failed`)
      }
    }

    if (!downloaded) {
      console.log(`   💀 All variations failed`)
      failures.push(`${emojiInfo?.emoji} ${emojiInfo?.label} (${hexcode})`)
      failureCount++
    }

    // Small delay to be nice to the server
    await new Promise((resolve) => setTimeout(resolve, 150))
  }

  console.log(`\n📊 FINAL RESULTS`)
  console.log(`================`)
  console.log(`✅ Successfully downloaded: ${successCount}`)
  console.log(`❌ Failed to download: ${failureCount}`)
  console.log(
    `📈 Success rate: ${(
      (successCount / votableEmptyFiles.length) *
      100
    ).toFixed(1)}%`
  )

  if (failures.length > 0) {
    console.log(`\n❌ REMAINING FAILURES:`)
    failures.forEach((failure) => console.log(`   ${failure}`))

    console.log(`\n💡 Next steps for failures:`)
    console.log(`   - Check if they exist in other emoji repositories`)
    console.log(`   - Create fallback placeholder images`)
    console.log(`   - Or exclude from voting if truly unavailable`)
  }

  return {
    successCount,
    failureCount,
    total: votableEmptyFiles.length,
    failures,
  }
}

if (require.main === module) {
  fixVotableEmojis()
    .then((results) => {
      if (results) {
        console.log(
          `\n🎉 Votable emoji fix complete! ${results.successCount}/${results.total} recovered`
        )
      }
    })
    .catch(console.error)
}

export { fixVotableEmojis }
