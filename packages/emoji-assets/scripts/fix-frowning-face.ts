#!/usr/bin/env tsx

import fs from "fs"
import path from "path"
import { Vibrant } from "node-vibrant/node"

const IMAGES_DIR = path.join(__dirname, "../images/apple-160")

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

async function fixFrowningFace() {
  console.log("😔 FIXING FROWNING FACE COLOR")
  console.log("============================\n")

  // Test both possible files for frowning face
  const possibleFiles = ["2639-fe0f.png", "2639.png"]

  for (const filename of possibleFiles) {
    const filePath = path.join(IMAGES_DIR, filename)

    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath)
      console.log(`🔍 Testing: ${filename} (${stats.size} bytes)`)

      if (stats.size > 0) {
        const color = await extractColor(filePath)
        console.log(`🎨 Extracted color: ${color}`)

        if (color !== "#888888") {
          console.log(`✅ Color extraction successful!`)
          console.log(`📝 SQL to update database:`)
          console.log(
            `UPDATE emojis SET accent_color = '${color}', updated_at = NOW() WHERE unified = '2639';`
          )
          return color
        } else {
          console.log(`⚠️ Color extraction failed`)
        }
      }
    } else {
      console.log(`❌ File not found: ${filename}`)
    }
  }

  return null
}

if (require.main === module) {
  fixFrowningFace()
    .then((color) => {
      if (color) {
        console.log(`\n🎉 Frowning face color extracted: ${color}`)
      } else {
        console.log(`\n😞 Failed to extract frowning face color`)
      }
    })
    .catch(console.error)
}

export { fixFrowningFace }
