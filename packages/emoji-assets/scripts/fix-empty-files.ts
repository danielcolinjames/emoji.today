#!/usr/bin/env tsx

import fs from "fs"
import path from "path"
import https from "https"

const EMOJI_DATA_BASE_URL =
  "https://raw.githubusercontent.com/iamcal/emoji-data/master/img-apple-160"
const IMAGES_DIR = path.join(__dirname, "../images/apple-160")

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
            resolve(true)
          })
        } else {
          file.close()
          fs.unlinkSync(filePath) // Delete the empty file
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

// Function to get filename variations for download attempts
function getDownloadVariations(baseFilename: string): string[] {
  const baseName = baseFilename.replace(".png", "")

  return [
    `${baseName}.png`, // Original filename
    `${baseName}-fe0f.png`, // Add FE0F
    `${baseName.replace(/-fe0f$/, "")}.png`, // Remove FE0F
    `${baseName.replace(/-/g, "")}.png`, // Remove all dashes
  ]
}

async function fixEmptyFiles() {
  console.log("🔧 FIXING EMPTY IMAGE FILES")
  console.log("==========================\n")

  if (!fs.existsSync(IMAGES_DIR)) {
    console.error(`❌ Images directory not found: ${IMAGES_DIR}`)
    return
  }

  // Find all empty files
  const allFiles = fs.readdirSync(IMAGES_DIR)
  const emptyFiles = allFiles.filter((filename) => {
    const filePath = path.join(IMAGES_DIR, filename)
    const stats = fs.statSync(filePath)
    return stats.size === 0
  })

  console.log(
    `📊 Found ${emptyFiles.length} empty files out of ${allFiles.length} total`
  )
  console.log(`🎯 Attempting to re-download...\n`)

  let successCount = 0
  let failureCount = 0

  for (let i = 0; i < emptyFiles.length; i++) {
    const filename = emptyFiles[i]
    const localPath = path.join(IMAGES_DIR, filename)

    console.log(`[${i + 1}/${emptyFiles.length}] ${filename}`)

    // Try different URL variations
    const variations = getDownloadVariations(filename)
    let downloaded = false

    for (const variant of variations) {
      const url = `${EMOJI_DATA_BASE_URL}/${variant}`
      console.log(`   Trying: ${variant}`)

      const success = await downloadFile(url, localPath)
      if (success) {
        // Check if file is actually not empty
        const stats = fs.statSync(localPath)
        if (stats.size > 0) {
          console.log(`   ✅ Downloaded ${stats.size} bytes`)
          downloaded = true
          successCount++
          break
        } else {
          console.log(`   ⚠️  Downloaded but still empty`)
        }
      } else {
        console.log(`   ❌ 404 Not Found`)
      }
    }

    if (!downloaded) {
      console.log(`   💀 All variations failed`)
      failureCount++
    }

    // Add small delay to be nice to the server
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  console.log(`\n📊 FINAL RESULTS`)
  console.log(`================`)
  console.log(`✅ Successfully downloaded: ${successCount}`)
  console.log(`❌ Failed to download: ${failureCount}`)
  console.log(
    `📈 Success rate: ${((successCount / emptyFiles.length) * 100).toFixed(1)}%`
  )

  if (failureCount > 0) {
    console.log(`\n🔍 Remaining failures might be:`)
    console.log(`   - Regional indicators (expected)`)
    console.log(`   - Component emojis (expected)`)
    console.log(`   - Very new Unicode 16.0 emojis`)
    console.log(`   - Emojis not in emoji-data repository`)
  }

  return { successCount, failureCount, total: emptyFiles.length }
}

if (require.main === module) {
  fixEmptyFiles()
    .then((results) => {
      if (results) {
        console.log(
          `\n🎉 Empty file fix complete! ${results.successCount}/${results.total} files recovered`
        )
      }
    })
    .catch(console.error)
}

export { fixEmptyFiles }
