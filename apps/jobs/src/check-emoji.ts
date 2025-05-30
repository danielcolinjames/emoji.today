import { supabase } from "./lib/supabase"

async function checkEmoji() {
  const emoji = "😎"

  console.log(`Checking emoji: ${emoji}`)

  const { data, error } = await supabase
    .from("emojis")
    .select("emoji, name, accent_color, filename, category")
    .eq("emoji", emoji)
    .single()

  if (error) {
    console.log("Error:", error)
  } else if (data) {
    console.log("\n😎 Emoji data:")
    console.log("Name:", data.name)
    console.log("Accent Color:", data.accent_color)
    console.log("Filename:", data.filename)
    console.log("Category:", data.category)
  } else {
    console.log("😎 emoji not found in database")
  }

  // Also check a few other emojis for comparison
  const compareEmojis = ["🔥", "😂", "❤️"]

  for (const compareEmoji of compareEmojis) {
    const { data: compareData } = await supabase
      .from("emojis")
      .select("emoji, name, accent_color")
      .eq("emoji", compareEmoji)
      .single()

    if (compareData) {
      console.log(
        `\n${compareEmoji} (${compareData.name}): ${compareData.accent_color}`
      )
    }
  }
}

if (require.main === module) {
  checkEmoji()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Failed:", error)
      process.exit(1)
    })
}
