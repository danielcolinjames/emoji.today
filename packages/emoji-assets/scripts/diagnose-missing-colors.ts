#!/usr/bin/env tsx

import fs from "fs"
import path from "path"
import { Vibrant } from "node-vibrant/node"

const IMAGES_DIR = path.join(__dirname, "../images/apple-160")

// Test emojis that we know should work
const testEmojis = [
  { emoji: "⚠️", hexcode: "26A0", label: "warning" },
  { emoji: "✈️", hexcode: "2708", label: "airplane" },
  { emoji: "🗑️", hexcode: "1F5D1", label: "wastebasket" },
  { emoji: "♈️", hexcode: "2648", label: "Aries" },
  { emoji: "☀️", hexcode: "2600", label: "sun" },
]

// Function to get image filename variations
function getImageFilenames(hexcode: string): string[] {
  const baseCode = hexcode.toLowerCase()

  const variants = [
    `${baseCode}.png`, // Base first: 2648.png
    `${baseCode}-fe0f.png`, // Then FE0F: 26a0-fe0f.png
    `${baseCode.replace(/-fe0f/g, "")}.png`, // Ensure base without FE0F
    `${baseCode.replace(/-/g, "")}.png`, // No dashes at all
  ]

  return [...new Set(variants)]
}

// Function to check which image file actually exists
function findExistingImage(hexcode: string): {
  exists: boolean
  path?: string
  size?: number
} {
  const filenames = getImageFilenames(hexcode)

  for (const filename of filenames) {
    const fullPath = path.join(IMAGES_DIR, filename)
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath)
      return {
        exists: true,
        path: fullPath,
        size: stats.size,
      }
    }
  }

  return { exists: false }
}

// Function to extract color from image
async function extractColor(imagePath: string): Promise<string> {
  try {
    const palette = await Vibrant.from(imagePath).getPalette()

    const vibrant = palette.Vibrant
    const dominant =
      palette.DarkVibrant || palette.LightVibrant || palette.Muted
    const fallback = palette.DarkMuted || palette.LightMuted

    const chosenSwatch = vibrant || dominant || fallback

    if (chosenSwatch) {
      return chosenSwatch.hex
    }

    return "#888888"
  } catch (error) {
    console.warn(`Failed to extract color: ${error}`)
    return "#888888"
  }
}

async function diagnoseColorIssues() {
  console.log("🔬 DIAGNOSING COLOR EXTRACTION ISSUES")
  console.log("====================================\n")

  console.log(`📂 Looking in: ${IMAGES_DIR}\n`)

  for (const emoji of testEmojis) {
    console.log(`🔍 Testing: ${emoji.emoji} ${emoji.label} (${emoji.hexcode})`)

    // Check which image file exists
    const imageInfo = findExistingImage(emoji.hexcode)

    if (!imageInfo.exists) {
      console.log(`   ❌ No image file found`)
      console.log(`   🔍 Tried: ${getImageFilenames(emoji.hexcode).join(", ")}`)
    } else {
      console.log(
        `   ✅ Found: ${path.basename(imageInfo.path!)} (${
          imageInfo.size
        } bytes)`
      )

      if (imageInfo.size === 0) {
        console.log(`   ⚠️  File is empty!`)
      } else {
        // Try to extract color
        const color = await extractColor(imageInfo.path!)
        console.log(`   🎨 Extracted color: ${color}`)

        if (color === "#888888") {
          console.log(`   ⚠️  Default color - color extraction failed`)
        }
      }
    }
    console.log()
  }

  // Check directory contents
  console.log("📁 DIRECTORY ANALYSIS")
  console.log("====================")

  if (fs.existsSync(IMAGES_DIR)) {
    const files = fs.readdirSync(IMAGES_DIR)
    const totalFiles = files.length
    const emptyFiles = files.filter((f) => {
      const stat = fs.statSync(path.join(IMAGES_DIR, f))
      return stat.size === 0
    }).length

    console.log(`Total files: ${totalFiles}`)
    console.log(`Empty files: ${emptyFiles}`)
    console.log(`Valid files: ${totalFiles - emptyFiles}`)

    // Show some sample filenames
    console.log("\nSample filenames:")
    files.slice(0, 10).forEach((f) => {
      const stat = fs.statSync(path.join(IMAGES_DIR, f))
      console.log(`   ${f} (${stat.size} bytes)`)
    })
  } else {
    console.log(`❌ Directory does not exist: ${IMAGES_DIR}`)
  }
}

if (require.main === module) {
  diagnoseColorIssues().catch(console.error)
}

export { diagnoseColorIssues }
