const { config } = require("dotenv")
const { resolve } = require("path")
const fs = require("fs")

const envPath = resolve(__dirname, "../.env.local")
console.log("Loading from:", envPath)
console.log("File exists:", fs.existsSync(envPath))

const result = config({ path: envPath })
console.log("Load result:", result.error ? "ERROR: " + result.error : "SUCCESS")
console.log("CRON_SECRET:", process.env.CRON_SECRET)

// Also try loading from current directory
console.log("\n--- Also trying from current directory ---")
const result2 = config({ path: ".env.local" })
console.log(
  "Load result2:",
  result2.error ? "ERROR: " + result2.error : "SUCCESS"
)
console.log("CRON_SECRET after second load:", process.env.CRON_SECRET)
