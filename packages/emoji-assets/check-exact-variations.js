const en = require("emojibase-data/en/data.json")

function getUnicodeDetails(str) {
  const codePoints = []
  for (let i = 0; i < str.length; i++) {
    const code = str.codePointAt(i)
    if (code) {
      codePoints.push(code.toString(16).toUpperCase().padStart(4, "0"))
      // Skip surrogate pairs
      if (code > 0xffff) i++
    }
  }
  return codePoints.join("-")
}

console.log("🔍 EXACT VARIATION SELECTOR ANALYSIS")
console.log("====================================\n")

// Check the problematic emojis we know about
const problemEmojis = ["👍", "⚡", "😎"]

console.log("Manual Unicode analysis:")
problemEmojis.forEach((emoji) => {
  const unicode = getUnicodeDetails(emoji)
  console.log(`${emoji} → ${unicode}`)

  // Search for base version in emojibase
  const baseFound = en.find((e) => e.hexcode === unicode)
  console.log(
    `  Base version (${unicode}): ${baseFound ? "FOUND" : "NOT FOUND"}`
  )

  // Search for FE0F version
  const fe0fVersion = unicode + "-FE0F"
  const fe0fFound = en.find((e) => e.hexcode === fe0fVersion)
  console.log(
    `  FE0F version (${fe0fVersion}): ${fe0fFound ? "FOUND" : "NOT FOUND"}`
  )
  if (fe0fFound) {
    console.log(`    → ${fe0fFound.emoji} (${fe0fFound.label})`)
  }

  // Search by emoji character in emojibase (different approach)
  const emojiMatch = en.find((e) => e.emoji === emoji)
  console.log(`  Direct emoji match: ${emojiMatch ? "FOUND" : "NOT FOUND"}`)
  if (emojiMatch) {
    console.log(
      `    → ${emojiMatch.emoji} (${emojiMatch.label}) - ${emojiMatch.hexcode}`
    )
  }

  console.log("")
})

// Now let's find all the missing ones with their potential FE0F versions
console.log("\n🔍 Searching for FE0F versions of missing emojis:")
console.log("================================================")

const commonMissing = ["👍", "👎", "⚡", "⭐", "✨", "☔", "⚽"]

commonMissing.forEach((emoji) => {
  const unicode = getUnicodeDetails(emoji)

  // Try to find the FE0F version
  const fe0fVersion = unicode + "-FE0F"
  const fe0fFound = en.find((e) => e.hexcode === fe0fVersion)

  if (fe0fFound) {
    console.log(
      `✅ ${emoji} → Found FE0F version: ${fe0fFound.emoji} (${fe0fFound.label})`
    )
    console.log(`   Base: ${unicode} → FE0F: ${fe0fVersion}`)
  } else {
    console.log(`❌ ${emoji} → No FE0F version found`)
  }
})

// Show some examples of emojis that DO have FE0F versions
console.log("\n📋 Examples of emojis WITH variation selectors in emojibase:")
const withFE0F = en.filter((e) => e.hexcode.includes("FE0F")).slice(0, 10)
withFE0F.forEach((emoji) => {
  console.log(`   ${emoji.emoji} (${emoji.label}) - ${emoji.hexcode}`)
})

console.log(
  `\nTotal emojis with FE0F: ${
    en.filter((e) => e.hexcode.includes("FE0F")).length
  }`
)
