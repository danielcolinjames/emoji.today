import { ImageResponse } from "next/og"
import { NextRequest } from "next/server"
import { supabase } from "@/lib/supabase"
import { getEmojiFilenameNormalized } from "@emoji.today/emoji-assets/src/emoji-utils"

export const runtime = "edge"

// Helper to fetch accent colors for emojis
async function getAccentColors(emojis: string[]): Promise<Record<string, string>> {
  if (emojis.length === 0) return {}

  const { data, error } = await supabase
    .from("emojis")
    .select("emoji, accent_color")
    .in("emoji", emojis)

  if (error) {
    console.error("Error fetching accent colors", error)
    return {}
  }

  return (
    data?.reduce<Record<string, string>>((acc, row) => {
      acc[row.emoji] = row.accent_color || "#FFD700"
      return acc
    }, {}) || {}
  )
}

export async function GET(request: NextRequest) {
  // Extract snapshotId from the URL path (last segment)
  const pathname = new URL(request.url).pathname
  const snapshotIdStr = pathname.split("/").pop() || ""
  const snapshotId = Number(snapshotIdStr)

  if (Number.isNaN(snapshotId) || snapshotIdStr.trim() === "") {
    return new Response("Invalid snapshot id", { status: 400 })
  }

  // Fetch snapshot
  const { data: snapshot, error } = await supabase
    .from("race_commentary_snapshots")
    .select("emoji_standings")
    .eq("id", snapshotId)
    .single()

  if (error || !snapshot) {
    console.error("Snapshot not found", error)
    // FALLBACK IMAGE WITH LOGO
    const badgeSvg = `<svg width="144" height="144" viewBox="0 0 144 144" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M144 72C143.862 67.0498 142.352 62.2299 139.632 58.0843C136.92 53.9464 133.103 50.636 128.613 48.5364C130.322 43.8851 130.682 38.8506 129.686 34C128.682 29.1418 126.337 24.6667 122.927 21.0728C119.326 17.6628 114.858 15.3257 110 14.3142C105.149 13.318 100.115 13.6782 95.4636 15.387C93.3716 10.8889 90.069 7.06515 85.9234 4.35251C81.7778 1.63987 76.9579 0.122605 72 0C67.0498 0.130268 62.2452 1.6322 58.1073 4.35251C53.9694 7.07282 50.682 10.8965 48.6054 15.387C43.9464 13.6782 38.8966 13.3027 34.0307 14.3142C29.1648 15.3104 24.682 17.6552 21.0805 21.0728C17.6705 24.6743 15.341 29.1571 14.3525 34.0077C13.3563 38.8582 13.7395 43.8927 15.4559 48.5364C10.9579 50.636 7.12644 53.9387 4.39847 58.0766C1.6705 62.2146 0.145594 67.0421 0 72C0.153257 76.9579 1.6705 81.7778 4.39847 85.9234C7.12644 90.0613 10.9579 93.3716 15.4559 95.4636C13.7395 100.107 13.3563 105.142 14.3525 109.992C15.3487 114.851 17.6705 119.326 21.0728 122.927C24.6743 126.322 29.1494 128.651 34 129.655C38.8506 130.667 43.8851 130.299 48.5364 128.613C50.636 133.103 53.9387 136.92 58.0843 139.64C62.2222 142.352 67.0498 143.862 72 144C76.9579 143.877 81.7778 142.368 85.9234 139.655C90.069 136.943 93.3716 133.111 95.4636 128.621C100.092 130.452 105.165 130.889 110.046 129.877C114.92 128.866 119.395 126.452 122.92 122.927C126.444 119.402 128.866 114.927 129.877 110.046C130.889 105.165 130.452 100.092 128.613 95.4636C133.103 93.364 136.92 90.0613 139.64 85.9157C142.352 81.7778 143.862 76.9502 144 72Z" fill="white"/><path d="M37.44 74.0353L63.7159 100.303L107.264 52.7479L96.9419 43.2L63.2254 79.9357L47.3481 64.0583L37.44 74.0353Z" fill="black"/></svg>`
    const logoDataUrl = `data:image/svg+xml;base64,${Buffer.from(badgeSvg).toString("base64")}`

    return new ImageResponse(
      <div
        style={{
          width: "600px",
          height: "300px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#050505",
        }}
      >
        <img src={logoDataUrl} width={160} height={160} />
      </div>,
      { width: 600, height: 300 }
    )
  }

  // Ensure standings array
  const standings: any[] = Array.isArray(snapshot.emoji_standings)
    ? ([...snapshot.emoji_standings] as any[])
      .sort((a, b) => {
        // Primary: higher vote count first
        if (b.count !== a.count) {
          return b.count - a.count
        }

        // Secondary: higher timing_score (later votes) first if available
        if (a.timing_score !== undefined && b.timing_score !== undefined) {
          return b.timing_score - a.timing_score
        }

        return 0
      })
      .slice(0, 3)
    : []

  // If no standings, show fallback logo
  if (standings.length === 0) {
    const badgeSvg = `<svg width="144" height="144" viewBox="0 0 144 144" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M144 72C143.862 67.0498 142.352 62.2299 139.632 58.0843C136.92 53.9464 133.103 50.636 128.613 48.5364C130.322 43.8851 130.682 38.8506 129.686 34C128.682 29.1418 126.337 24.6667 122.927 21.0728C119.326 17.6628 114.858 15.3257 110 14.3142C105.149 13.318 100.115 13.6782 95.4636 15.387C93.3716 10.8889 90.069 7.06515 85.9234 4.35251C81.7778 1.63987 76.9579 0.122605 72 0C67.0498 0.130268 62.2452 1.6322 58.1073 4.35251C53.9694 7.07282 50.682 10.8965 48.6054 15.387C43.9464 13.6782 38.8966 13.3027 34.0307 14.3142C29.1648 15.3104 24.682 17.6552 21.0805 21.0728C17.6705 24.6743 15.341 29.1571 14.3525 34.0077C13.3563 38.8582 13.7395 43.8927 15.4559 48.5364C10.9579 50.636 7.12644 53.9387 4.39847 58.0766C1.6705 62.2146 0.145594 67.0421 0 72C0.153257 76.9579 1.6705 81.7778 4.39847 85.9234C7.12644 90.0613 10.9579 93.3716 15.4559 95.4636C13.7395 100.107 13.3563 105.142 14.3525 109.992C15.3487 114.851 17.6705 119.326 21.0728 122.927C24.6743 126.322 29.1494 128.651 34 129.655C38.8506 130.667 43.8851 130.299 48.5364 128.613C50.636 133.103 53.9387 136.92 58.0843 139.64C62.2222 142.352 67.0498 143.862 72 144C76.9579 143.877 81.7778 142.368 85.9234 139.655C90.069 136.943 93.3716 133.111 95.4636 128.621C100.092 130.452 105.165 130.889 110.046 129.877C114.92 128.866 119.395 126.452 122.92 122.927C126.444 119.402 128.866 114.927 129.877 110.046C130.889 105.165 130.452 100.092 128.613 95.4636C133.103 93.364 136.92 90.0613 139.64 85.9157C142.352 81.7778 143.862 76.9502 144 72Z" fill="white"/><path d="M37.44 74.0353L63.7159 100.303L107.264 52.7479L96.9419 43.2L63.2254 79.9357L47.3481 64.0583L37.44 74.0353Z" fill="black"/></svg>`
    const logoDataUrl = `data:image/svg+xml;base64,${Buffer.from(badgeSvg).toString("base64")}`

    return new ImageResponse(
      <div
        style={{
          width: "600px",
          height: "300px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#050505",
        }}
      >
        <img src={logoDataUrl} width={160} height={160} />
      </div>,
      { width: 600, height: 300 }
    )
  }

  const emojis = standings.map((s) => s.emoji)
  const accentMap = await getAccentColors(emojis)

  // Calculate width scaling based on vote counts
  const counts = standings.map((s) => s.count || 0)
  const maxCount = Math.max(...counts, 1)
  const minCount = Math.min(...counts)

  const canvasWidth = 600
  const canvasHeight = 300

  // === Dynamic vertical sizing ===
  // Base values reflect the current proportions
  const BASE_PAD = 24
  const BASE_GAP = 12
  const BASE_BAR_HEIGHT = 64
  const BASE_BORDER_WIDTH = 4

  // Scale everything uniformly so that the layout fits perfectly in the
  // allotted canvas height while maintaining the original proportions.
  const scale =
    canvasHeight /
    (BASE_PAD * 2 + BASE_GAP * 2 + BASE_BAR_HEIGHT * standings.length)

  const verticalPadding = BASE_PAD * scale
  const gapSize = BASE_GAP * scale
  const barHeight = BASE_BAR_HEIGHT * scale
  const borderSize = BASE_BORDER_WIDTH * scale
  const barShift = 60 // pixels the bar starts off-canvas to the left
  const rightPadding = 24 // must match container style

  return new ImageResponse(
    <div
      style={{
        width: `${canvasWidth}px`,
        height: `${canvasHeight}px`,
        display: "flex",
        flexDirection: "column",
        padding: `${verticalPadding}px 24px ${verticalPadding}px 0`,
        gap: `${gapSize}px`,
        background: "#050505",
      }}
    >
      {standings.map((s, idx) => {
        const contentWidth = canvasWidth - rightPadding
        // Define the minimum visible width so the emoji bubble sits ~24px from the bar's flat edge
        const minVisibleWidth = barHeight + 24

        // Normalize count to [0,1] where the lowest count gets 0
        const fraction = maxCount === minCount ? 0 : (s.count - minCount) / (maxCount - minCount)

        const visibleWidth = minVisibleWidth + fraction * (contentWidth - minVisibleWidth)
        const barWidth = visibleWidth + barShift
        const accent = accentMap[s.emoji] || "#FFD700"

        // Build emoji image URL
        const filename = getEmojiFilenameNormalized(s.emoji)
        const origin = process.env.NODE_ENV === "development" ? "http://localhost:3000" : process.env.NEXT_PUBLIC_URL || "https://emoji.today"
        const imgUrl = filename
          ? `${origin}/emoji-assets/apple-160/${filename}`
          : null

        return (
          <div
            key={s.emoji}
            style={{
              position: "relative",
              height: barHeight,
              overflow: "hidden",
              display: "flex",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: `-${barShift}px`,
                top: 0,
                height: "100%",
                width: barWidth,
                background: accent,
                borderRadius: 9999,
                display: "flex",
                alignItems: "center",
              }}
            >
              <div style={{ flex: 1 }} />

              {imgUrl ? (
                <div style={{
                  height: barHeight,
                  width: barHeight,
                  backgroundColor: "#050505",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `${borderSize}px solid ${accent}`
                }}>
                  <img
                    src={imgUrl}
                    alt={s.emoji}
                    width={barHeight / 2}
                    height={barHeight / 2}
                    style={{
                      borderRadius: "50%",
                      background: "#050505",
                    }}
                  />
                </div>
              ) : (
                <span style={{ fontSize: 40 }}>{s.emoji}</span>
              )}
            </div>
          </div>
        )
      })}
    </div>,
    {
      width: canvasWidth,
      height: canvasHeight,
    }
  )
} 