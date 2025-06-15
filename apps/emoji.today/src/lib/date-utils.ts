import { format, parseISO, startOfDay, endOfDay, addDays } from "date-fns"
import { UTCDate } from "@date-fns/utc"

// Global timezone for the application - using UTC for consistency
export const APP_TIMEZONE = "UTC"

/**
 * Get the current date in UTC, normalized to the start of the day
 */
export function getCurrentVotingDay(): Date {
  const now = new UTCDate()
  // Create a new UTCDate at start of day to avoid timezone conversion
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth()
  const day = now.getUTCDate()
  return new UTCDate(year, month, day, 0, 0, 0, 0)
}

/**
 * Format a date for database storage (YYYY-MM-DD)
 */
export function formatDateForDB(date: Date): string {
  // Manually format to avoid date-fns version conflicts
  const utcDate = date instanceof UTCDate ? date : new UTCDate(date)
  const year = utcDate.getUTCFullYear()
  const month = String(utcDate.getUTCMonth() + 1).padStart(2, "0")
  const day = String(utcDate.getUTCDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/**
 * Parse a date string from the database
 */
export function parseDateFromDB(dateString: string): Date {
  return parseISO(dateString)
}

/**
 * Get the start and end timestamps for a voting day
 */
export function getVotingDayBounds(date: Date): { start: Date; end: Date } {
  // Ensure we're working with UTC dates
  const utcDate = new UTCDate(date)
  const year = utcDate.getUTCFullYear()
  const month = utcDate.getUTCMonth()
  const day = utcDate.getUTCDate()

  const start = new UTCDate(year, month, day, 0, 0, 0, 0)
  const end = new UTCDate(year, month, day, 23, 59, 59, 999)

  return { start, end }
}

/**
 * Check if voting is still open for a given day
 */
export function isVotingOpen(votingDay: Date): boolean {
  const now = new UTCDate()
  const { end } = getVotingDayBounds(votingDay)
  return now < end
}

/**
 * Format date for display (e.g., "Wednesday, January 28, 2025")
 */
export function formatDateForDisplay(date: Date): string {
  const utcDate = date instanceof UTCDate ? date : new UTCDate(date)
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]
  return `${
    months[utcDate.getUTCMonth()]
  } ${utcDate.getUTCDate()}, ${utcDate.getUTCFullYear()}`
}

/**
 * Format date for display (e.g., "JAN 6 2025")
 */
export function formatDateShortAndUppercase(date: Date): string {
  const utcDate = date instanceof UTCDate ? date : new UTCDate(date)
  const months = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ]
  const day = String(utcDate.getUTCDate()).padStart(2, "0")
  return `${months[utcDate.getUTCMonth()]} ${day} ${utcDate.getUTCFullYear()}`
}

/**
 * Get hours remaining until voting closes
 */
export function getHoursRemaining(votingDay: Date): number {
  const now = new UTCDate()
  const { end } = getVotingDayBounds(votingDay)
  const msRemaining = end.getTime() - now.getTime()
  return Math.max(0, Math.floor(msRemaining / (1000 * 60 * 60)))
}

/**
 * Get the current voting date string for database queries
 */
export function getCurrentVotingDateString(): string {
  return formatDateForDB(getCurrentVotingDay())
}

/**
 * Check if we're currently in a voting period
 */
export function isVotingPeriodActive(): boolean {
  return isVotingOpen(getCurrentVotingDay())
}

/**
 * Get the previous voting day (UTC), normalized to start of day.
 */
export function getPreviousVotingDay(): Date {
  const now = new UTCDate()
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth()
  const day = now.getUTCDate()
  // Subtract one day
  const yesterday = new UTCDate(year, month, day - 1, 0, 0, 0, 0)
  return yesterday
}

/**
 * Get the previous voting date string for database queries (YYYY-MM-DD)
 */
export function getPreviousVotingDateString(): string {
  return formatDateForDB(getPreviousVotingDay())
}
