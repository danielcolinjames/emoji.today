#!/usr/bin/env node

async function testChyron() {
  try {
    console.log("🧪 Testing chyron API...")

    // Test GET first
    console.log("\n📥 Testing GET /api/chyron")
    const getResponse = await fetch("http://localhost:3000/api/chyron")
    const getData = await getResponse.json()
    console.log("GET Response:", JSON.stringify(getData, null, 2))

    // Test POST to update
    console.log("\n📤 Testing POST /api/chyron (with CRON_SECRET)")
    const postResponse = await fetch("http://localhost:3000/api/chyron", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer smilefireheartwhaleshark", // Using the actual CRON_SECRET
      },
    })

    const postData = await postResponse.json()
    console.log("POST Response:", JSON.stringify(postData, null, 2))

    // Test GET again to see if it updated
    console.log("\n📥 Testing GET /api/chyron again")
    const getResponse2 = await fetch("http://localhost:3000/api/chyron")
    const getData2 = await getResponse2.json()
    console.log("GET Response after POST:", JSON.stringify(getData2, null, 2))
  } catch (error) {
    console.error("❌ Error testing chyron:", error)
  }
}

testChyron()
