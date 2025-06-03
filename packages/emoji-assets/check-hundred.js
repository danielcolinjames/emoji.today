const { createClient } = require("@supabase/supabase-js")
require("dotenv").config({ path: "../../../apps/emoji.today/.env.local" })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkHundred() {
  console.log("Checking 💯 emoji color in database...")

  const { data, error } = await supabase
    .from("emojis")
    .select("emoji, accent_color, updated_at")
    .eq("emoji", "💯")
    .single()

  if (error) {
    console.log("Error:", error.message)
  } else {
    console.log("💯 current color:", data.accent_color)
    console.log("Last updated:", data.updated_at)

    if (data.accent_color === "#e40404") {
      console.log("✅ Color is correct vibrant red!")
    } else {
      console.log("❌ Color is NOT the expected #e40404")
    }
  }
}

checkHundred()
