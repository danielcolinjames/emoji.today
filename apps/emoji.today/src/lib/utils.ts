import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { mnemonicToAccount } from "viem/accounts"
import { hex as wcagHex } from "wcag-contrast"
import {
  APP_BUTTON_TEXT,
  APP_DESCRIPTION,
  APP_ICON_URL,
  APP_NAME,
  APP_OG_IMAGE_URL,
  APP_PRIMARY_CATEGORY,
  APP_SPLASH_BACKGROUND_COLOR,
  APP_TAGS,
  APP_URL,
  APP_WEBHOOK_URL,
  APP_SPLASH_URL,
} from "./constants"

interface FrameMetadata {
  version: string
  name: string
  iconUrl: string
  homeUrl: string
  imageUrl?: string
  buttonTitle?: string
  splashImageUrl?: string
  splashBackgroundColor?: string
  webhookUrl?: string
  description?: string
  primaryCategory?: string
  tags?: string[]
}

interface FrameManifest {
  accountAssociation?: {
    header: string
    payload: string
    signature: string
  }
  frame: FrameMetadata
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getSecretEnvVars() {
  const seedPhrase = process.env.SEED_PHRASE
  const fid = process.env.FID

  if (!seedPhrase || !fid) {
    return null
  }

  return { seedPhrase, fid }
}

export function getFrameEmbedMetadata(ogImageUrl?: string) {
  return {
    version: "next",
    imageUrl: ogImageUrl ?? APP_OG_IMAGE_URL,
    button: {
      title: APP_BUTTON_TEXT,
      action: {
        type: "launch_frame",
        name: APP_NAME,
        url: APP_URL,
        splashImageUrl: APP_SPLASH_URL,
        iconUrl: APP_ICON_URL,
        splashBackgroundColor: APP_SPLASH_BACKGROUND_COLOR,
        description: APP_DESCRIPTION,
        primaryCategory: APP_PRIMARY_CATEGORY,
        tags: APP_TAGS,
      },
    },
  }
}

export async function getFarcasterMetadata(): Promise<FrameManifest> {
  // First check for FRAME_METADATA in .env and use that if it exists
  if (process.env.FRAME_METADATA) {
    try {
      const metadata = JSON.parse(process.env.FRAME_METADATA)
      console.log("Using pre-signed frame metadata from environment")
      return metadata
    } catch (error) {
      console.warn("Failed to parse FRAME_METADATA from environment:", error)
    }
  }

  if (!APP_URL) {
    throw new Error("NEXT_PUBLIC_URL not configured")
  }

  // Get the domain from the URL (without https:// prefix)
  const domain = new URL(APP_URL).hostname
  console.log("Using domain for manifest:", domain)

  const secretEnvVars = getSecretEnvVars()
  if (!secretEnvVars) {
    console.warn(
      "No seed phrase or FID found in environment variables -- generating unsigned metadata"
    )
  }

  let accountAssociation
  if (secretEnvVars) {
    // Generate account from seed phrase
    const account = mnemonicToAccount(secretEnvVars.seedPhrase)
    const custodyAddress = account.address

    const header = {
      fid: parseInt(secretEnvVars.fid),
      type: "custody",
      key: custodyAddress,
    }
    const encodedHeader = Buffer.from(JSON.stringify(header), "utf-8").toString(
      "base64"
    )

    const payload = {
      domain,
    }
    const encodedPayload = Buffer.from(
      JSON.stringify(payload),
      "utf-8"
    ).toString("base64url")

    const signature = await account.signMessage({
      message: `${encodedHeader}.${encodedPayload}`,
    })
    const encodedSignature = Buffer.from(signature, "utf-8").toString(
      "base64url"
    )

    accountAssociation = {
      header: encodedHeader,
      payload: encodedPayload,
      signature: encodedSignature,
    }
  }

  return {
    accountAssociation,
    frame: {
      version: "1",
      name: APP_NAME ?? "Frames v2 Demo",
      iconUrl: APP_ICON_URL,
      homeUrl: APP_URL,
      imageUrl: APP_OG_IMAGE_URL,
      buttonTitle: APP_BUTTON_TEXT ?? "Launch Frame",
      splashImageUrl: APP_SPLASH_URL,
      splashBackgroundColor: APP_SPLASH_BACKGROUND_COLOR,
      webhookUrl: APP_WEBHOOK_URL,
      description: APP_DESCRIPTION,
      primaryCategory: APP_PRIMARY_CATEGORY,
      tags: APP_TAGS,
    },
  }
}

const sampleEmojis = [
  // Smiley faces & emotion
  "😀",
  "😃",
  "😄",
  "😁",
  "😆",
  "😅",
  "😂",
  "🤣",
  "☺️",
  "😊",
  "😇",
  "🙂",
  "🙃",
  "😉",
  "😌",
  "😍",
  "🥰",
  "😘",
  "😗",
  "😙",
  "😚",
  "😋",
  "😛",
  "😝",
  "😜",
  "🤪",
  "🤨",
  "🧐",
  "🤓",
  "😎",
  "🥸",
  "🤩",
  "🥳",
  "😏",
  "😒",
  "😞",
  "😔",
  "😟",
  "😕",
  "🙁",
  "☹️",
  "😣",
  "😖",
  "😫",
  "😩",
  "🥺",
  "😢",
  "😭",
  "😤",
  "😠",
  "😡",
  "🤬",
  "🤯",
  "😳",
  "🥵",
  "🥶",
  "😱",
  "😨",
  "😰",
  "😥",
  "😓",
  "🤗",
  "🤔",
  "🤭",
  "🤫",
  "🤥",
  "😶",
  "😐",
  "😑",
  "😬",
  "🙄",
  "😯",
  "😦",
  "😧",
  "😮",
  "😲",
  "🥱",
  "😴",
  "🤤",
  "😪",
  "😵",
  "🤐",
  "🥴",
  "🤢",
  "🤮",
  "🤧",
  "😷",
  "🤒",
  "🤕",
  "🤑",
  "🤠",
  "😈",
  "👿",
  "👹",
  "👺",
  "🤡",
  "💩",
  "👻",
  "💀",
  "☠️",
  "👽",
  "👾",
  "🤖",

  // Animals & Nature
  "🐶",
  "🐱",
  "🐭",
  "🐹",
  "🐰",
  "🦊",
  "🐻",
  "🐼",
  "🐻‍❄️",
  "🐨",
  "🐯",
  "🦁",
  "🐮",
  "🐷",
  "🐸",
  "🐵",
  "🙈",
  "🙉",
  "🙊",
  "🐒",
  // ... many more animals ...

  // Food & Drink
  "🍏",
  "🍎",
  "🍐",
  "🍊",
  "🍋",
  "🍌",
  "🍉",
  "🍇",
  "🍓",
  "🫐",
  "🍈",
  "🍒",
  "🍑",
  "🥭",
  "🍍",
  "🥥",
  "🥝",
  "🍅",
  "🍆",
  "🥑",
  // ... many more food items ...

  // Activity
  "⚽",
  "🏀",
  "🏈",
  "⚾",
  "🥎",
  "🎾",
  "🏐",
  "🏉",
  "🥏",
  "🎱",
  "🪀",
  "🏓",
  "🏸",
  "🏒",
  "🏑",
  "🥍",
  "🏏",
  "🪃",
  "🥅",
  "⛳",
  // ... more activities ...

  // Travel & Places
  "🚗",
  "🚕",
  "🚙",
  "🚌",
  "🚎",
  "🏎",
  "🚓",
  "🚑",
  "🚒",
  "🚐",
  "🚚",
  "🚛",
  "🚜",
  "🏍",
  "🛵",
  "🦽",
  "🦼",
  "🛺",
  "🚲",
  "🛴",
  // ... more vehicles and places ...

  // Objects
  "⌚",
  "📱",
  "📲",
  "💻",
  "⌨️",
  "🖥",
  "🖨",
  "🖱",
  "🖲",
  "🕹",
  "🗜",
  "💽",
  "💾",
  "💿",
  "📀",
  "🧮",
  "🎥",
  "🎞",
  "📽",
  "📺",
  // ... more objects ...

  // Symbols
  "❤️",
  "🧡",
  "💛",
  "💚",
  "💙",
  "💜",
  "🖤",
  "🤍",
  "🤎",
  "💔",
  "❣️",
  "💕",
  "💞",
  "💓",
  "💗",
  "💖",
  "💘",
  "💝",
  "💟",
  "☮️",
  // ... more symbols ...

  // Flags
  "🏁",
  "🚩",
  "🎌",
  "🏴",
  "🏳️",
  "🏳️‍🌈",
  "🏴‍☠️",
  // ... country flags ...
]

export function getRandomSampleEmoji(): string {
  return sampleEmojis[Math.floor(Math.random() * sampleEmojis.length)]
}

interface EmojiRange {
  start: number
  end: number
  description: string
}

/**
 * Determine if text should be black or white based on background color
 * Returns 'black' or 'white' based on WCAG contrast guidelines
 * Strongly favors white text - only uses black when white contrast is poor
 */
export function getContrastTextColor(
  backgroundColor: string
): "black" | "white" {
  try {
    // Test contrast with white text
    const contrastWithWhite = wcagHex(backgroundColor, "#ffffff")

    // WCAG AA standard requires 4.5:1 contrast ratio for normal text
    // We'll be even more lenient and only switch to black if white is below 3:1
    const minimumAcceptableContrast = 3.0

    // Strongly favor white - only use black if white contrast is really poor
    if (contrastWithWhite >= minimumAcceptableContrast) {
      return "white"
    }

    // If white is too poor, check if black is significantly better
    const contrastWithBlack = wcagHex(backgroundColor, "#000000")

    // Only use black if it's significantly better than white (at least 2x better)
    // This ensures we really need black text
    if (contrastWithBlack > contrastWithWhite * 1.5) {
      return "black"
    }

    // Default to white even if contrast isn't great
    return "white"
  } catch (error) {
    console.error(
      "Error calculating contrast for color:",
      backgroundColor,
      error
    )
    return "white" // fallback for invalid colors
  }
}

// Voting countdown utility
export function getRemainingTimeToMidnightUTC(): {
  hours: number
  minutes: number
  seconds: number
  totalMs: number
} {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  tomorrow.setUTCHours(0, 0, 0, 0)

  const totalMs = tomorrow.getTime() - now.getTime()

  const hours = Math.floor(totalMs / (1000 * 60 * 60))
  const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((totalMs % (1000 * 60)) / 1000)

  return { hours, minutes, seconds, totalMs }
}

export function formatCountdown(
  time: {
    hours: number
    minutes: number
    seconds: number
  },
  verbose?: boolean
): string {
  const h = time.hours.toString().padStart(2, "0")
  const m = time.minutes.toString().padStart(2, "0")
  const s = time.seconds.toString().padStart(2, "0")
  const countdown = `${h}:${m}:${s}`
  return verbose ? `${countdown} LEFT (UTC)` : countdown
}
