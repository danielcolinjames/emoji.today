import { formatDateShortAndUppercase, getCurrentVotingDay } from "./date-utils"

export const APP_URL = process.env.NEXT_PUBLIC_URL!
export const APP_NAME = process.env.NEXT_PUBLIC_FRAME_NAME
export const APP_DESCRIPTION = process.env.NEXT_PUBLIC_FRAME_DESCRIPTION
export const APP_PRIMARY_CATEGORY =
  process.env.NEXT_PUBLIC_FRAME_PRIMARY_CATEGORY
export const APP_TAGS = process.env.NEXT_PUBLIC_FRAME_TAGS?.split(",")
export const APP_ICON_URL = `${APP_URL}/icon-1024.png`
export const APP_OG_IMAGE_URL = `${APP_URL}/og.png`
export const APP_SPLASH_URL = `${APP_URL}/splash-200.png`
export const APP_SPLASH_BACKGROUND_COLOR = "#050505"
export const APP_BUTTON_TEXT = process.env.NEXT_PUBLIC_FRAME_BUTTON_TEXT
export const APP_WEBHOOK_URL =
  process.env.NEYNAR_API_KEY && process.env.NEYNAR_CLIENT_ID
    ? `https://api.neynar.com/f/app/${process.env.NEYNAR_CLIENT_ID}/event`
    : `${APP_URL}/api/webhook`

// Additional manifest fields
export const APP_SUBTITLE = "What emoji is today?"
export const APP_HERO_IMAGE_URL = `${APP_URL}/og.png`
export const APP_TAGLINE = "Vote for today's emoji"
export const APP_OG_TITLE = "emoji.today"
export const APP_OG_DESCRIPTION = "What emoji is today?"
export const APP_OG_IMAGE_URL_FINAL = `${APP_URL}/og.png`

// Generate the default chyron dynamically to ensure correct date
export function getDefaultOpeningChyron(): string {
  const currentDate = getCurrentVotingDay()
  return `VOTING UNDERWAY FOR ${formatDateShortAndUppercase(currentDate)}`
}

// Legacy constant for backward compatibility (but now dynamic)
export const DEFAULT_OPENING_CHYRON = getDefaultOpeningChyron()
