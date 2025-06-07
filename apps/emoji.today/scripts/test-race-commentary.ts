#!/usr/bin/env tsx

/**
 * Test script for race commentary system
 * Generates sample commentary for all milestones without posting to Farcaster
 *
 * Usage: yarn workspace emoji.today tsx scripts/test-race-commentary.ts
 */

import { DEFAULT_OPENING_CHYRON } from "@/lib/constants"
import {
  createRaceSnapshot,
  postToFarcaster,
} from "../src/lib/race-commentary-service"
import type { EmojiStanding } from "../src/lib/race-commentary-service"

// Mock vote data for testing
const MOCK_VOTE_DATA = {
  opening: {
    total_votes: 0,
    emoji_standings: [],
    emoji_counts: {},
  },
  early: {
    total_votes: 47,
    emoji_standings: [
      { emoji: "🔥", count: 12, percentage: 25.5, recent_momentum: "up" },
      { emoji: "⚡", count: 8, percentage: 17.0, recent_momentum: "stable" },
      { emoji: "🎯", count: 7, percentage: 14.9, recent_momentum: "down" },
      { emoji: "💯", count: 6, percentage: 12.8, recent_momentum: "up" },
      { emoji: "🚀", count: 5, percentage: 10.6, recent_momentum: "stable" },
      { emoji: "✨", count: 4, percentage: 8.5, recent_momentum: "up" },
      { emoji: "🌟", count: 3, percentage: 6.4, recent_momentum: "down" },
      { emoji: "🎉", count: 2, percentage: 4.3, recent_momentum: "stable" },
    ],
    emoji_counts: {
      "🔥": 12,
      "⚡": 8,
      "🎯": 7,
      "💯": 6,
      "🚀": 5,
      "✨": 4,
      "🌟": 3,
      "🎉": 2,
    },
  },
  midday: {
    total_votes: 234,
    emoji_standings: [
      { emoji: "🔥", count: 67, percentage: 28.6, recent_momentum: "up" },
      { emoji: "💯", count: 34, percentage: 14.5, recent_momentum: "up" },
      { emoji: "⚡", count: 29, percentage: 12.4, recent_momentum: "down" },
      { emoji: "🎯", count: 24, percentage: 10.3, recent_momentum: "stable" },
      { emoji: "🚀", count: 22, percentage: 9.4, recent_momentum: "up" },
      { emoji: "✨", count: 18, percentage: 7.7, recent_momentum: "stable" },
      { emoji: "🌟", count: 15, percentage: 6.4, recent_momentum: "down" },
      { emoji: "🎉", count: 12, percentage: 5.1, recent_momentum: "stable" },
      { emoji: "💪", count: 8, percentage: 3.4, recent_momentum: "up" },
      { emoji: "👍", count: 5, percentage: 2.1, recent_momentum: "down" },
    ],
    emoji_counts: {
      "🔥": 67,
      "💯": 34,
      "⚡": 29,
      "🎯": 24,
      "🚀": 22,
      "✨": 18,
      "🌟": 15,
      "🎉": 12,
      "💪": 8,
      "👍": 5,
    },
  },
  intense: {
    total_votes: 892,
    emoji_standings: [
      { emoji: "🔥", count: 198, percentage: 22.2, recent_momentum: "stable" },
      { emoji: "💯", count: 156, percentage: 17.5, recent_momentum: "up" },
      { emoji: "⚡", count: 134, percentage: 15.0, recent_momentum: "up" },
      { emoji: "🚀", count: 89, percentage: 10.0, recent_momentum: "down" },
      { emoji: "🎯", count: 76, percentage: 8.5, recent_momentum: "stable" },
      { emoji: "✨", count: 67, percentage: 7.5, recent_momentum: "up" },
      { emoji: "🌟", count: 45, percentage: 5.0, recent_momentum: "down" },
      { emoji: "🎉", count: 34, percentage: 3.8, recent_momentum: "stable" },
      { emoji: "💪", count: 28, percentage: 3.1, recent_momentum: "up" },
      { emoji: "👍", count: 24, percentage: 2.7, recent_momentum: "down" },
      { emoji: "❤️", count: 19, percentage: 2.1, recent_momentum: "up" },
      { emoji: "😍", count: 12, percentage: 1.3, recent_momentum: "stable" },
      { emoji: "🙌", count: 10, percentage: 1.1, recent_momentum: "down" },
    ],
    emoji_counts: {
      "🔥": 198,
      "💯": 156,
      "⚡": 134,
      "🚀": 89,
      "🎯": 76,
      "✨": 67,
      "🌟": 45,
      "🎉": 34,
      "💪": 28,
      "👍": 24,
      "❤️": 19,
      "😍": 12,
      "🙌": 10,
    },
  },
  nailbiter: {
    total_votes: 1247,
    emoji_standings: [
      { emoji: "💯", count: 289, percentage: 23.2, recent_momentum: "up" },
      { emoji: "🔥", count: 276, percentage: 22.1, recent_momentum: "down" },
      { emoji: "⚡", count: 198, percentage: 15.9, recent_momentum: "stable" },
      { emoji: "🚀", count: 134, percentage: 10.7, recent_momentum: "up" },
      { emoji: "🎯", count: 98, percentage: 7.9, recent_momentum: "down" },
      { emoji: "✨", count: 87, percentage: 7.0, recent_momentum: "stable" },
      { emoji: "🌟", count: 56, percentage: 4.5, recent_momentum: "up" },
      { emoji: "🎉", count: 43, percentage: 3.4, recent_momentum: "down" },
      { emoji: "💪", count: 34, percentage: 2.7, recent_momentum: "stable" },
      { emoji: "👍", count: 32, percentage: 2.6, recent_momentum: "up" },
    ],
    emoji_counts: {
      "💯": 289,
      "🔥": 276,
      "⚡": 198,
      "🚀": 134,
      "🎯": 98,
      "✨": 87,
      "🌟": 56,
      "🎉": 43,
      "💪": 34,
      "👍": 32,
    },
  },
}

const MILESTONES = [
  {
    name: "opening",
    description: "Polls just opened (00:05 UTC)",
    data: MOCK_VOTE_DATA.opening,
  },
  {
    name: "1hour",
    description: "One hour in (01:00 UTC)",
    data: MOCK_VOTE_DATA.early,
  },
  {
    name: "halfway",
    description: "Halfway point (12:00 UTC)",
    data: MOCK_VOTE_DATA.midday,
  },
  {
    name: "final_hour",
    description: "Final hour (23:00 UTC)",
    data: MOCK_VOTE_DATA.intense,
  },
  {
    name: "final_minutes",
    description: "Final minutes (23:55 UTC)",
    data: MOCK_VOTE_DATA.nailbiter,
  },
  {
    name: "daily_summary",
    description: "Election wrap-up (00:01 UTC)",
    data: MOCK_VOTE_DATA.nailbiter,
  },
] as const

function generateMockCommentary(
  milestone: string,
  totalVotes: number,
  standings: EmojiStanding[]
): string {
  const leader = standings[0]
  const second = standings[1]
  const today = new Date()
    .toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    .toUpperCase()

  switch (milestone) {
    case "opening":
      if (totalVotes === 0) {
        return `Voting is now open for the emoji of ${today}. The polls have officially opened and will remain active for 24 hours. Cast your vote at emoji.today`
      }
      return `Early voting has begun for ${today}. ${leader?.emoji} establishes an initial lead with ${leader?.count} votes. The election continues at emoji.today`

    case "1hour":
      return `One hour into voting for ${today}: ${leader?.emoji} leads with ${leader?.count} votes (${leader?.percentage}%), followed by ${second?.emoji} with ${second?.count}. Total turnout: ${totalVotes} votes`

    case "halfway":
      const gap = leader && second ? leader.count - second.count : 0
      return `Midday report for ${today}: ${leader?.emoji} maintains dominance with ${leader?.count} votes, while ${second?.emoji} trails by ${gap} votes. Total participation: ${totalVotes} votes`

    case "final_hour":
      return `Final hour approaches for ${today}. ${leader?.emoji} leads with ${leader?.count} votes. With sixty minutes remaining, late momentum could determine the outcome. Total votes: ${totalVotes}`

    case "final_minutes":
      return `The election for ${today} closes in minutes. ${leader?.emoji} holds ${leader?.count} votes against ${second?.emoji} with ${second?.count}. History will be decided shortly`

    case "daily_summary":
      return `The polls have closed for ${today}. ${leader?.emoji} has been declared the winner with ${leader?.count} votes out of ${totalVotes} total ballots cast. Final results show ${second?.emoji} finished second with ${second?.count} votes. Democracy in action.`

    default:
      return `Election in progress for ${today}: ${leader?.emoji} leads with ${leader?.count} votes. Total participation: ${totalVotes} votes at emoji.today`
  }
}

function generateMockChyron(
  standings: EmojiStanding[],
  totalVotes: number,
  milestone?: string
): string {
  const leader = standings[0]
  const loser = standings.find((s) => s.count === 1)
  const second = standings[1]

  // Special case for daily summary
  if (milestone === "daily_summary" && leader) {
    return `🏆 WINNER: ${leader.emoji} VICTORIOUS WITH ${leader.count} VOTES! FINAL TALLY: ${totalVotes} TOTAL!`
  }

  if (loser) {
    return `${loser.emoji} HANGING ON WITH 1 VOTE • LONE SUPPORTER STAYING LOYAL!`
  }

  if (leader && second) {
    const gap = leader.count - second.count
    if (gap === 0) {
      return `${leader.emoji} LEADS BY TIMING TIEBREAK • BOTH AT ${leader.count} VOTES!`
    } else if (gap <= 3) {
      return `NAIL-BITER! ${leader.emoji} VS ${second.emoji} SEPARATED BY ${gap} VOTES!`
    }
    return `${leader.emoji} RUNNING AWAY WITH ${leader.count} VOTES • ${second.emoji} CHASING AT ${second.count}!`
  }

  if (leader) {
    return `${leader.emoji} LEADS WITH ${leader.count} VOTES • ${totalVotes} VOTES AND COUNTING!`
  }

  return DEFAULT_OPENING_CHYRON
}

function formatOutput(title: string, content: string, chyron?: string) {
  const separator = "=".repeat(80)
  const shortSep = "-".repeat(40)

  console.log(`\n${separator}`)
  console.log(`🎯 ${title.toUpperCase()}`)
  console.log(`${separator}`)

  console.log("\n📱 FARCASTER COMMENTARY:")
  console.log(`${shortSep}`)
  console.log(content)

  if (chyron) {
    console.log("\n📺 CHYRON TICKER:")
    console.log(`${shortSep}`)
    console.log(chyron)
  }

  console.log(`\n${separator}`)
}

async function generateTestCommentary() {
  console.log("\n🚀 Testing Race Commentary System")
  console.log(
    "Generating sample output for all milestones without posting to Farcaster...\n"
  )

  for (const milestone of MILESTONES) {
    try {
      console.log(`\n⏱️  Processing: ${milestone.description}`)

      // For testing, we'll create a mock snapshot and use simplified generation
      // In production, this would call createRaceSnapshot which handles the full flow

      // Mock simple commentary based on milestone
      const commentary = generateMockCommentary(
        milestone.name as any,
        milestone.data.total_votes,
        milestone.data.emoji_standings as EmojiStanding[]
      )

      // Mock simple chyron based on data
      const chyron = generateMockChyron(
        milestone.data.emoji_standings as EmojiStanding[],
        milestone.data.total_votes,
        milestone.name
      )

      formatOutput(
        `${milestone.name} - ${milestone.description}`,
        commentary,
        chyron
      )
    } catch (error) {
      console.error(`❌ Error generating ${milestone.name}:`, error)
      console.log(`\n🔄 Continuing with next milestone...\n`)
    }
  }

  console.log("\n✅ Test complete!")
  console.log("\n💡 To run actual milestones with Farcaster posting:")
  console.log("   • Set FARCASTER_SIGNER_UUID and NEYNAR_API_KEY")
  console.log(
    '   • Trigger via: curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/race-commentary/opening'
  )
}

// Run the test
generateTestCommentary().catch(console.error)
