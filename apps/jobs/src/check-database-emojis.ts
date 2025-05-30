import { supabase } from "./lib/supabase"

async function checkDatabaseEmojis() {
  // Emojis used in our simulation
  const simulationEmojis = [
    "😎",
    "🤔",
    "😊",
    "👍",
    "🤷",
    "😍",
    "🙌",
    "💪",
    "🎯",
    "⚡",
    "🔮",
    "🔥",
    "😂",
    "❤️",
    "🚀",
    "🎉",
    "💯",
    "🌟",
  ]

  console.log("Checking which simulation emojis exist in database...\n")

  const { data, error } = await supabase
    .from("emojis")
    .select("emoji, name, accent_color")
    .in("emoji", simulationEmojis)
    .order("name")

  if (error) {
    console.error("Error:", error)
    return
  }

  const foundEmojis = new Set(data?.map((e) => e.emoji) || [])

  console.log("✅ Found in database:")
  data?.forEach((emoji) => {
    console.log(`${emoji.emoji} (${emoji.name}): ${emoji.accent_color}`)
  })

  console.log("\n❌ Missing from database:")
  simulationEmojis.forEach((emoji) => {
    if (!foundEmojis.has(emoji)) {
      console.log(`${emoji} - Not found`)
    }
  })

  // Check total count
  const { count } = await supabase
    .from("emojis")
    .select("*", { count: "exact", head: true })

  console.log(`\nTotal emojis in database: ${count}`)

  // Get a sample of what IS in the database
  const { data: sample } = await supabase
    .from("emojis")
    .select("emoji, name, accent_color")
    .limit(10)
    .order("name")

  console.log("\nSample emojis that ARE in database:")
  sample?.forEach((emoji) => {
    console.log(`${emoji.emoji} (${emoji.name}): ${emoji.accent_color}`)
  })
}

if (require.main === module) {
  checkDatabaseEmojis()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Failed:", error)
      process.exit(1)
    })
}
