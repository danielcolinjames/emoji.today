#!/usr/bin/env tsx

/**
 * Test new democratic tone prompts
 */

import { config } from "dotenv"
config({ path: ".env.local" })

async function testDemocraticTone() {
  console.log("\n🗳️  Testing New Democratic Authority Tone")
  console.log("=".repeat(60))

  const prompt = `POLLS OPEN! Write an authoritative announcement calling citizens to their daily democratic duty.

Current early results: 1. 🔥: 2 votes (11%)
2. 🔮: 2 votes (11%)  
3. 🌲: 1 vote (6%)
4. 🍀: 1 vote (6%)
5. 💙: 1 vote (6%)

Yesterday's champion: 🌊 (15 votes)

Tone: Dignified but urgent civic duty. "Citizens, the polls are open!" CRITICAL: Keep under 160 chars - be concise! No hashtags. Only use actual competing emojis from standings.`

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "X-Title": "emoji.today democratic test",
        },
        body: JSON.stringify({
          model: "anthropic/claude-3.5-haiku",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 400,
          temperature: 0.9,
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`)
    }

    const data = (await response.json()) as any
    const commentary = data.choices[0].message.content.trim()

    const fullPost = `${commentary}\n\nVote now at emoji.today: https://farcaster.xyz/miniapps/c_Y960s6FSE2/emojitoday`

    console.log(`📢 DEMOCRATIC COMMENTARY:`)
    console.log(`"${commentary}"`)
    console.log(
      `\n📏 ${commentary.length} chars | Full post: ${fullPost.length}/280 chars`
    )

    if (fullPost.length > 280) {
      console.log(`⚠️  Exceeds limit by ${fullPost.length - 280} chars`)
    } else {
      console.log(`✅ Perfect civic length!`)
    }

    console.log(`\n🎯 Analysis:`)
    console.log(
      `• Uses democratic language: ${
        /citizen|democracy|vote|duty|civic/i.test(commentary)
          ? "✅ Yes"
          : "❌ No"
      }`
    )
    console.log(
      `• Authoritative tone: ${
        /polls|election|democratic|ballot/i.test(commentary)
          ? "✅ Yes"
          : "❌ No"
      }`
    )
    console.log(
      `• Only competing emojis: ${
        /🔥|🔮|🌲|🍀|💙/.test(commentary) ? "✅ Yes" : "❌ No"
      }`
    )
    console.log(
      `• No decorative emojis: ${
        !/🗳️|⚡|🔥|🚨|⏰|🏆/.test(commentary.replace(/🔥/, ""))
          ? "✅ Yes"
          : "❌ No"
      }`
    )
  } catch (error) {
    console.error("Error:", error)
  }
}

testDemocraticTone().catch(console.error)
