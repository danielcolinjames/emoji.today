const en = require("emojibase-data/en/data.json")

// Common emojis that we'd expect to be in any emoji database
const commonEmojis = [
  "👍",
  "👎",
  "👌",
  "✌️",
  "🤞",
  "🤟",
  "🤘",
  "🤙",
  "👈",
  "👉",
  "👆",
  "👇",
  "☝️",
  "✋",
  "🤚",
  "🖐️",
  "🖖",
  "👋",
  "🤏",
  "💪",
  "🦾",
  "🦿",
  "🦵",
  "🦶",
  "👂",
  "🦻",
  "👃",
  "🧠",
  "🫀",
  "🫁",
  "🦷",
  "🦴",
  "👀",
  "👁️",
  "👅",
  "👄",
  "💋",
  "🩸",
  "⚡",
  "🔥",
  "💥",
  "💫",
  "⭐",
  "🌟",
  "✨",
  "⚡",
  "☄️",
  "💨",
  "☀️",
  "🌤️",
  "⛅",
  "🌥️",
  "☁️",
  "🌦️",
  "🌧️",
  "⛈️",
  "🌩️",
  "🌨️",
  "❄️",
  "☃️",
  "⛄",
  "🌬️",
  "💨",
  "💧",
  "💦",
  "🌊",
  "☂️",
  "☔",
  "⛱️",
  "⚓",
  "🛟",
  "🪝",
  "⛵",
  "🛶",
  "🚤",
  "🛳️",
  "⛴️",
  "🛥️",
  "🚢",
  "✈️",
  "🛩️",
  "🛫",
  "🛬",
  "🪂",
  "💺",
  "🚁",
  "🚟",
  "🚠",
  "🚡",
  "🛰️",
  "🚀",
  "🛸",
  "🛎️",
  "🧳",
  "⌛",
  "⏳",
  "⌚",
  "⏰",
  "⏱️",
  "⏲️",
  "🕰️",
  "🌡️",
  "🗺️",
  "🧭",
  "🎃",
  "🎄",
  "🎆",
  "🎇",
  "🧨",
  "✨",
  "🎈",
  "🎉",
  "🎊",
  "🎋",
  "🎍",
  "🎎",
  "🎏",
  "🎐",
  "🎑",
  "🧧",
  "🎀",
  "🎁",
  "🎗️",
  "🎟️",
  "🎫",
  "🎖️",
  "🏆",
  "🏅",
  "🥇",
  "🥈",
  "🥉",
  "⚽",
  "⚾",
  "🥎",
  "🏀",
  "🏐",
  "🏈",
  "🏉",
  "🎾",
  "🥏",
  "🎳",
  "🏏",
  "🏑",
  "🏒",
  "🥍",
  "🏓",
  "🏸",
  "🥊",
  "🥋",
  "🥅",
  "⛳",
  "⛸️",
  "🎣",
  "🤿",
  "🎽",
  "🎿",
  "🛷",
  "🥌",
  "🎯",
  "🪀",
  "🪁",
  "🎱",
  "🔮",
  "🪄",
  "🧿",
  "🎮",
]

async function findAllMissing() {
  // Get all emojis from our current database (simulating with the ones we know exist)
  const knownInDatabase = [
    "🎯",
    "🔮",
    "😂",
    "🔥",
    "💪",
    "🌟",
    "💯",
    "🎉",
    "🤷",
    "🙌",
    "❤️",
    "🚀",
    "😍",
    "😊",
    "🤔",
  ]

  console.log("🔍 COMPREHENSIVE MISSING EMOJI ANALYSIS")
  console.log("=======================================\n")

  console.log(
    `📊 Checking ${commonEmojis.length} common emojis against emojibase data...\n`
  )

  const missingFromEmojibase = []
  const existsInEmojibase = []
  const variationSelectorEmojis = []

  commonEmojis.forEach((emoji) => {
    const found = en.find((e) => e.emoji === emoji)
    if (found) {
      existsInEmojibase.push({
        emoji: found.emoji,
        label: found.label,
        hexcode: found.hexcode,
        hasVariationSelector: found.hexcode.includes("FE0F"),
      })

      if (found.hexcode.includes("FE0F")) {
        variationSelectorEmojis.push({
          emoji: found.emoji,
          label: found.label,
          hexcode: found.hexcode,
        })
      }
    } else {
      missingFromEmojibase.push(emoji)
    }
  })

  console.log(
    `✅ Found in emojibase: ${existsInEmojibase.length}/${commonEmojis.length}`
  )
  console.log(
    `❌ Missing from emojibase: ${missingFromEmojibase.length}/${commonEmojis.length}`
  )
  console.log(
    `🔗 With variation selectors (FE0F): ${variationSelectorEmojis.length}`
  )

  if (missingFromEmojibase.length > 0) {
    console.log("\n❌ Emojis missing from emojibase entirely:")
    missingFromEmojibase.forEach((emoji) => {
      console.log(`   ${emoji}`)
    })
  }

  if (variationSelectorEmojis.length > 0) {
    console.log(
      "\n🔗 Emojis with variation selectors (likely missing from database):"
    )
    variationSelectorEmojis.forEach((emoji) => {
      console.log(`   ${emoji.emoji} (${emoji.label}) - ${emoji.hexcode}`)
    })
  }

  // Check specific patterns
  console.log("\n🎯 SPECIFIC PATTERN ANALYSIS")
  console.log("===========================")

  // Weather emojis (many have variation selectors)
  const weatherEmojis = en.filter(
    (e) =>
      e.label &&
      (e.label.toLowerCase().includes("sun") ||
        e.label.toLowerCase().includes("cloud") ||
        e.label.toLowerCase().includes("rain") ||
        e.label.toLowerCase().includes("snow") ||
        e.label.toLowerCase().includes("lightning"))
  )

  const weatherWithFE0F = weatherEmojis.filter((e) =>
    e.hexcode.includes("FE0F")
  )
  console.log(
    `Weather emojis: ${weatherEmojis.length} total, ${weatherWithFE0F.length} with FE0F`
  )

  if (weatherWithFE0F.length > 0) {
    console.log("Weather emojis with variation selectors:")
    weatherWithFE0F.forEach((emoji) => {
      console.log(`   ${emoji.emoji} (${emoji.label})`)
    })
  }

  // Transportation emojis
  const transportEmojis = en.filter(
    (e) =>
      e.label &&
      (e.label.toLowerCase().includes("car") ||
        e.label.toLowerCase().includes("plane") ||
        e.label.toLowerCase().includes("train") ||
        e.label.toLowerCase().includes("boat") ||
        e.label.toLowerCase().includes("ship"))
  )

  const transportWithFE0F = transportEmojis.filter((e) =>
    e.hexcode.includes("FE0F")
  )
  console.log(
    `\nTransport emojis: ${transportEmojis.length} total, ${transportWithFE0F.length} with FE0F`
  )

  // Show total count of emojis with variation selectors
  const allWithFE0F = en.filter((e) => e.hexcode.includes("FE0F"))
  console.log(
    `\n📊 TOTAL EMOJIS WITH VARIATION SELECTORS: ${allWithFE0F.length}/${
      en.length
    } (${((allWithFE0F.length / en.length) * 100).toFixed(1)}%)`
  )

  console.log("\n🚨 RECOMMENDATION:")
  console.log(
    "The database population script likely needs to handle variation selectors properly."
  )
  console.log("This could affect hundreds of common emojis!")
}

findAllMissing()
