const en = require("emojibase-data/en/data.json")
const compact = require("emojibase-data/en/compact.json")

console.log("Checking for emoji variants and data sources...\n")

// Check thumbs up variants
console.log("🔍 Searching for thumbs up variants:")
const thumbsVariants = en.filter(
  (e) =>
    (e.label && e.label.toLowerCase().includes("thumb")) ||
    (e.emoji && e.emoji.includes("👍"))
)
thumbsVariants.forEach((emoji) => {
  console.log(`   ${emoji.emoji} (${emoji.label}) - ${emoji.hexcode}`)
})

console.log("\n🔍 Searching for lightning/electricity variants:")
const lightningVariants = en.filter(
  (e) =>
    (e.label &&
      (e.label.toLowerCase().includes("lightning") ||
        e.label.toLowerCase().includes("bolt") ||
        e.label.toLowerCase().includes("electric"))) ||
    (e.emoji && e.emoji.includes("⚡"))
)
lightningVariants.forEach((emoji) => {
  console.log(`   ${emoji.emoji} (${emoji.label}) - ${emoji.hexcode}`)
})

console.log("\n🔍 Searching for sunglasses variants:")
const sunglassVariants = en.filter(
  (e) =>
    (e.label && e.label.toLowerCase().includes("sunglasses")) ||
    (e.emoji && e.emoji.includes("😎"))
)
sunglassVariants.forEach((emoji) => {
  console.log(`   ${emoji.emoji} (${emoji.label}) - ${emoji.hexcode}`)
})

// Check compact data
console.log("\n📊 Data source comparison:")
console.log(`Full data.json: ${en.length} emojis`)
console.log(`Compact.json: ${compact.length} emojis`)

// Search by hexcode
console.log("\n🔍 Searching by known hexcodes:")
const knownCodes = ["1F44D", "26A1", "1F60E"] // thumbs up, lightning bolt, sunglasses
knownCodes.forEach((code) => {
  const found = en.find((e) => e.hexcode === code)
  if (found) {
    console.log(`   ${code}: ${found.emoji} (${found.label})`)
  } else {
    console.log(`   ${code}: NOT FOUND`)
  }
})

console.log("\n🔍 Checking compact data for missing ones:")
const compactThumbsUp = compact.find((e) => e.hexcode === "1F44D")
const compactLightning = compact.find((e) => e.hexcode === "26A1")
if (compactThumbsUp) {
  console.log(
    `   Compact thumbs up: ${compactThumbsUp.unicode} (${compactThumbsUp.label})`
  )
}
if (compactLightning) {
  console.log(
    `   Compact lightning: ${compactLightning.unicode} (${compactLightning.label})`
  )
}
