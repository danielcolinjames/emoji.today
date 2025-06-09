#!/usr/bin/env tsx

/**
 * Test new prompts directly without database caching
 */

import { config } from "dotenv"
config({ path: ".env.local" })

async function testPrompt(name: string, prompt: string) {
  console.log(`\n🎬 ${name.toUpperCase()}`)
  console.log("-".repeat(50))

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "X-Title": "emoji.today test",
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

    const fullPost = `${commentary}\n\nVote now: https://farcaster.xyz/miniapps/c_Y960s6FSE2/emojitoday`

    console.log(`📱 "${commentary}"`)
    console.log(
      `📏 ${commentary.length} chars | Full post: ${fullPost.length}/280 chars`
    )

    if (fullPost.length > 280) {
      console.log(`⚠️  Exceeds limit by ${fullPost.length - 280} chars`)
    } else {
      console.log(`✅ Perfect length!`)
    }
  } catch (error) {
    console.error("Error:", error)
  }
}

async function testNewPrompts() {
  console.log("\n🎯 Testing All New Commentary Styles")
  console.log("=".repeat(60))

  const prompts = [
    {
      name: "opening",
      prompt: `POLLS OPEN! Write a punchy 1-sentence social media post announcing today's emoji vote is live.

Current leaders: 1. 🔥: 2 votes (11%)
2. 🔮: 2 votes (11%)  
3. 🌲: 1 vote (6%)
4. 🍀: 1 vote (6%)
5. 💙: 1 vote (6%)

Yesterday's winner: 🌊 (15 votes)

RULES: Under 200 chars. No hashtags. Only use emojis from the standings list above. Never use decorative emojis like ballot boxes, fire, or alerts - only the actual competing emojis and their vote counts.`,
    },
    {
      name: "final_hour",
      prompt: `FINAL HOUR! Time is running out in today's emoji election. Write an urgent social post.

Current race: 1. 🔥: 8 votes (35%)
2. 🔮: 6 votes (26%)  
3. 🌲: 4 votes (17%)
4. 🍀: 3 votes (13%)
5. 💙: 2 votes (9%)

Time left: 1h 15m

RULES: Under 200 chars. No hashtags. Only mention competing emojis from standings. No decorative emojis like clocks or alerts. Focus on race positions.`,
    },
    {
      name: "results",
      prompt: `RESULTS! Today's emoji election is over. Announce the winner with flair.

Final results: 1. 🔥: 12 votes (40%)
2. 🔮: 8 votes (27%)  
3. 🌲: 5 votes (17%)
4. 🍀: 3 votes (10%)
5. 💙: 2 votes (6%)

Winner: 🔥 (12 votes)
Total turnout: 30

RULES: Under 200 chars. No hashtags. Only mention the winning emoji and competitors from results. No decorative emojis like trophies.`,
    },
  ]

  for (const test of prompts) {
    await testPrompt(test.name, test.prompt)
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  console.log(`\n✅ All tests complete!`)
}

testNewPrompts().catch(console.error)
