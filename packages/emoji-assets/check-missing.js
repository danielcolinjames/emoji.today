const en = require("emojibase-data/en/data.json")

const missing = ["😎", "👍", "⚡"]

console.log("Checking emojibase data for missing emojis...\n")

missing.forEach((emoji) => {
  const found = en.find((e) => e.emoji === emoji)
  if (found) {
    console.log(`✅ ${emoji} (${found.label}) - hexcode: ${found.hexcode}`)
    console.log(`   Group: ${found.group}, Version: ${found.version}`)
  } else {
    console.log(`❌ ${emoji} - NOT FOUND in emojibase data`)
  }
  console.log("")
})

console.log(`Total emojis in emojibase: ${en.length}`)

// Also check some working ones for comparison
console.log("\nChecking some working emojis for comparison:")
const working = ["🔥", "😂", "❤️"]
working.forEach((emoji) => {
  const found = en.find((e) => e.emoji === emoji)
  if (found) {
    console.log(`✅ ${emoji} (${found.label}) - hexcode: ${found.hexcode}`)
  }
})
