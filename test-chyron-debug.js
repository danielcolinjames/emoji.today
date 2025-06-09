const fetch = require("node-fetch")

async function testChyron() {
  try {
    console.log("🧪 Testing chyron POST API...\n")

    const response = await fetch("http://localhost:3000/api/chyron", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer smilefireheartwhaleshark",
      },
    })

    const result = await response.json()

    console.log("📡 Response Status:", response.status)
    console.log("📡 Response Body:", JSON.stringify(result, null, 2))

    if (result.success) {
      console.log("\n✅ Chyron generated successfully!")
      console.log("📝 Generated chyron:", result.chyron)
    } else {
      console.log("\n❌ Chyron generation failed")
      console.log("❌ Error:", result.error)
    }

    // Now test GET API
    console.log("\n🔍 Testing chyron GET API...\n")
    const getResponse = await fetch("http://localhost:3000/api/chyron")
    const getResult = await getResponse.json()

    console.log("📡 GET Response:", JSON.stringify(getResult, null, 2))
  } catch (error) {
    console.error("💥 Test failed:", error.message)
  }
}

testChyron()
