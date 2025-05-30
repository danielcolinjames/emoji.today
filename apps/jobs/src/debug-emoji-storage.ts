import { supabase } from "./lib/supabase"

async function debugEmojiStorage() {
  console.log("🔍 DEBUGGING EMOJI STORAGE ISSUE")
  console.log("=================================\n")

  const problematicCodes = [
    { hexcode: "1F44D", expectedEmoji: "👍", name: "THUMBS UP" },
    { hexcode: "26A1", expectedEmoji: "⚡", name: "HIGH VOLTAGE" },
    { hexcode: "1F44E", expectedEmoji: "👎", name: "THUMBS DOWN" },
    { hexcode: "2B50", expectedEmoji: "⭐", name: "STAR" },
    { hexcode: "2728", expectedEmoji: "✨", name: "SPARKLES" },
  ]

  for (const item of problematicCodes) {
    console.log(`\n🔍 Checking ${item.name} (${item.expectedEmoji})`)
    console.log(`Expected hexcode: ${item.hexcode}`)

    // Search by hexcode (unified field)
    const { data: byHexcode } = await supabase
      .from("emojis")
      .select("emoji, name, unified, accent_color")
      .eq("unified", item.hexcode)

    if (byHexcode && byHexcode.length > 0) {
      console.log(`✅ Found by hexcode:`)
      byHexcode.forEach((row) => {
        console.log(`   Stored emoji: "${row.emoji}" (${row.name})`)
        console.log(`   Unified: ${row.unified}`)
        console.log(`   Accent color: ${row.accent_color}`)

        // Check if the stored emoji matches what we expect
        const matches = row.emoji === item.expectedEmoji
        console.log(`   Matches expected: ${matches ? "✅" : "❌"}`)

        if (!matches) {
          // Show the actual Unicode codepoints
          const storedCodes = []
          for (let i = 0; i < row.emoji.length; i++) {
            const code = row.emoji.codePointAt(i)
            if (code) {
              storedCodes.push(code.toString(16).toUpperCase().padStart(4, "0"))
              if (code > 0xffff) i++ // Skip surrogate pairs
            }
          }

          const expectedCodes = []
          for (let i = 0; i < item.expectedEmoji.length; i++) {
            const code = item.expectedEmoji.codePointAt(i)
            if (code) {
              expectedCodes.push(
                code.toString(16).toUpperCase().padStart(4, "0")
              )
              if (code > 0xffff) i++ // Skip surrogate pairs
            }
          }

          console.log(`   Stored Unicode: ${storedCodes.join("-")}`)
          console.log(`   Expected Unicode: ${expectedCodes.join("-")}`)
        }
      })
    } else {
      console.log(`❌ NOT found by hexcode`)
    }

    // Search by emoji character
    const { data: byEmoji } = await supabase
      .from("emojis")
      .select("emoji, name, unified, accent_color")
      .eq("emoji", item.expectedEmoji)

    if (byEmoji && byEmoji.length > 0) {
      console.log(`✅ Found by emoji character:`)
      byEmoji.forEach((row) => {
        console.log(`   ${row.emoji} (${row.name}) - ${row.unified}`)
      })
    } else {
      console.log(`❌ NOT found by emoji character`)
    }
  }

  // Check total count of emojis
  const { count } = await supabase
    .from("emojis")
    .select("*", { count: "exact", head: true })

  console.log(`\n📊 Total emojis in database: ${count}`)

  // Get a sample to see the pattern
  const { data: sample } = await supabase
    .from("emojis")
    .select("emoji, name, unified")
    .limit(5)

  console.log("\n📋 Sample emojis from database:")
  sample?.forEach((row) => {
    console.log(`   ${row.emoji} (${row.name}) - ${row.unified}`)
  })
}

if (require.main === module) {
  debugEmojiStorage()
    .then(() => {
      console.log("\n✅ Debug complete!")
      process.exit(0)
    })
    .catch((error) => {
      console.error("❌ Failed:", error)
      process.exit(1)
    })
}
