export interface FarcasterShareOptions {
  emoji: string
  date: string
  accentColor: string
}

export function generateVoteShareUrl({
  emoji,
  date,
  accentColor,
}: FarcasterShareOptions): string {
  return `${window.location.origin}/vote?emoji=${encodeURIComponent(
    emoji
  )}&date=${date}&accentColor=${encodeURIComponent(accentColor)}`
}

export function generateFarcasterComposeUrl(
  shareUrl: string,
  emoji: string,
  date: string
): string {
  const shareText = `I just voted ${emoji} for ${date}.\n\nWhat emoji do you think best represents today?`
  return `https://farcaster.xyz.com/~/compose?text=${encodeURIComponent(
    shareText
  )}&embeds[]=${encodeURIComponent(shareUrl)}`
}

export function handleFarcasterShare({
  emoji,
  date,
  accentColor,
}: FarcasterShareOptions): void {
  const shareUrl = generateVoteShareUrl({ emoji, date, accentColor })
  const farcasterUrl = generateFarcasterComposeUrl(shareUrl, emoji, date)
  window.open(farcasterUrl, "_blank")
}
