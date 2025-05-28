import fs from "fs"
import path from "path"
import https from "https"
import { promisify } from "util"
import { emojiArray } from "../../../apps/emoji.today/src/lib/emojis"

const writeFile = promisify(fs.writeFile)
const mkdir = promisify(fs.mkdir)

// TO DOWNLOAD ALL EMOJIS:
// 1. Import the full emoji array from the main app:
//    import { emojiArray } from "../../../apps/emoji.today/src/lib/emojis"
// 2. Replace POPULAR_EMOJIS with emojiArray
// 3. Run: yarn download (this will take 10-20 minutes and download ~1,700 images)
//
// Current setup only downloads ~587 popular emojis to keep the initial download quick

// Now using the FULL emoji array - this will download ALL emojis!
const ALL_EMOJIS = emojiArray

function getEmojiCodePoint(emoji: string): string {
  const codePoints = Array.from(emoji).map((char) =>
    char.codePointAt(0)!.toString(16).padStart(4, "0")
  )
  return codePoints.join("-")
}

async function downloadImage(url: string, filepath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath)

    https
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download: ${response.statusCode}`))
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
}

async function main() {
  const outputDir = path.join(__dirname, "..", "images", "apple-160")

  // Ensure output directory exists
  await mkdir(outputDir, { recursive: true })

  console.log(`Downloading ${ALL_EMOJIS.length} emoji images...`)

  let downloaded = 0
  let failed = 0

  for (const emoji of ALL_EMOJIS) {
    const codePoint = getEmojiCodePoint(emoji)
    const filename = `${codePoint}.png`
    const filepath = path.join(outputDir, filename)

    // Skip if already exists
    if (fs.existsSync(filepath)) {
      console.log(`✓ Already exists: ${emoji} (${filename})`)
      downloaded++
      continue
    }

    const url = `https://raw.githubusercontent.com/iamcal/emoji-data/master/img-apple-160/${filename}`

    try {
      await downloadImage(url, filepath)
      downloaded++
      console.log(`✓ Downloaded: ${emoji} (${filename})`)
    } catch (error) {
      failed++
      console.error(`✗ Failed: ${emoji} (${filename}) - ${error}`)
    }

    // Add a small delay to be nice to GitHub
    await new Promise((resolve) => setTimeout(resolve, 50))
  }

  console.log(`\nDownload complete!`)
  console.log(`Downloaded: ${downloaded}`)
  console.log(`Failed: ${failed}`)

  // Save emoji metadata
  const metadata = ALL_EMOJIS.map((emoji) => ({
    emoji,
    codePoint: getEmojiCodePoint(emoji),
    filename: `${getEmojiCodePoint(emoji)}.png`,
  }))

  await writeFile(
    path.join(__dirname, "..", "data", "emoji-metadata.json"),
    JSON.stringify(metadata, null, 2)
  )

  console.log(`\nSaved emoji metadata to data/emoji-metadata.json`)
}

main().catch(console.error)
