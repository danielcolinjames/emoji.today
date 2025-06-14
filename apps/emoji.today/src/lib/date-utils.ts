import { format, parseISO, startOfDay, endOfDay, addDays } from "date-fns"
import { UTCDate } from "@date-fns/utc"

// Global timezone for the application - using UTC for consistency
export const APP_TIMEZONE = "UTC"

/**
 * Get the current date in UTC, normalized to the start of the day
 */
export function getCurrentVotingDay(): Date {
  const now = new UTCDate()
  return startOfDay(now)
}

/**
 * Format a date for database storage (YYYY-MM-DD)
 */
export function formatDateForDB(date: Date): string {
  return format(date, "yyyy-MM-dd")
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
  const start = startOfDay(date)
  const end = endOfDay(date)

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
  return format(date, "MMMM d, yyyy")
}

/**
 * Format date for display (e.g., "JAN 6 2025")
 */
export function formatDateShortAndUppercase(date: Date): string {
  return format(date, "MMM dd yyyy").toUpperCase()
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
  return startOfDay(addDays(new UTCDate(), -1))
}

/**
 * Get the previous voting date string for database queries (YYYY-MM-DD)
 */
export function getPreviousVotingDateString(): string {
  return formatDateForDB(getPreviousVotingDay())
}
