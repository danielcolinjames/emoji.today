#!/usr/bin/env tsx

import { readdir, mkdir, access } from "fs/promises"
import { existsSync } from "fs"
import path from "path"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

const SOURCE_DIR = path.join(__dirname, "../images/apple-160")
const OUTPUT_DIR = path.join(__dirname, "../images/apple-80")

async function checkImageMagick() {
  try {
    await execAsync("convert --version")
    return true
  } catch {
    return false
  }
}

async function checkSharp() {
  try {
    await import("sharp")
    return true
  } catch {
    return false
  }
}

async function resizeWithImageMagick(inputPath: string, outputPath: string) {
  const command = `convert "${inputPath}" -resize 80x80 "${outputPath}"`
  await execAsync(command)
}

async function resizeWithSharp(inputPath: string, outputPath: string) {
  const sharp = await import("sharp")
  await sharp
    .default(inputPath)
    .resize(80, 80, {
      kernel: sharp.default.kernel.lanczos3,
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(outputPath)
}

async function generateSmallerImages() {
  console.log("🖼️  Generating smaller emoji images (80x80)...")

  // Check if we have image processing tools available
  const hasImageMagick = await checkImageMagick()
  const hasSharp = await checkSharp()

  if (!hasImageMagick && !hasSharp) {
    console.error("❌ No image processing library found!")
    console.error("Please install either:")
    console.error("1. ImageMagick: brew install imagemagick")
    console.error("2. Sharp: yarn add sharp (in the emoji-assets package)")
    process.exit(1)
  }

  const useSharp = hasSharp // Prefer sharp if available
  console.log(
    `✅ Using ${useSharp ? "Sharp" : "ImageMagick"} for image processing`
  )

  // Create output directory if it doesn't exist
  if (!existsSync(OUTPUT_DIR)) {
    await mkdir(OUTPUT_DIR, { recursive: true })
    console.log(`📁 Created output directory: ${OUTPUT_DIR}`)
  }

  // Get all PNG files from source directory
  const files = await readdir(SOURCE_DIR)
  const pngFiles = files.filter((file) => file.endsWith(".png"))

  console.log(`📊 Found ${pngFiles.length} emoji images to process`)

  let processed = 0
  let skipped = 0
  let errors = 0

  // Process files in batches to avoid overwhelming the system
  const BATCH_SIZE = 50

  for (let i = 0; i < pngFiles.length; i += BATCH_SIZE) {
    const batch = pngFiles.slice(i, i + BATCH_SIZE)

    await Promise.all(
      batch.map(async (file) => {
        const inputPath = path.join(SOURCE_DIR, file)
        const outputPath = path.join(OUTPUT_DIR, file)

        try {
          // Check if output already exists
          if (existsSync(outputPath)) {
            skipped++
            return
          }

          if (useSharp) {
            await resizeWithSharp(inputPath, outputPath)
          } else {
            await resizeWithImageMagick(inputPath, outputPath)
          }

          processed++

          // Progress indicator
          if ((processed + skipped) % 100 === 0) {
            console.log(
              `   Progress: ${processed + skipped}/${pngFiles.length}`
            )
          }
        } catch (error) {
          console.error(`❌ Error processing ${file}:`, error)
          errors++
        }
      })
    )
  }

  console.log("\n✨ Image generation complete!")
  console.log(`✅ Processed: ${processed}`)
  console.log(`⏭️  Skipped (already exists): ${skipped}`)
  console.log(`❌ Errors: ${errors}`)
  console.log(`📁 Output directory: ${OUTPUT_DIR}`)

  // Now sync to apps
  if (processed > 0) {
    console.log("\n🔄 Syncing to apps...")
    try {
      await execAsync("yarn tsx scripts/sync-to-apps.ts", {
        cwd: path.join(__dirname, ".."),
      })
      console.log("✅ Sync complete!")
    } catch (error) {
      console.error("❌ Error syncing to apps:", error)
    }
  }
}

// Run the script
generateSmallerImages().catch(console.error)
