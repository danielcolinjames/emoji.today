import { useState, useEffect } from "react"
import { processImageForVibrantColorHex } from "../../packages/utils/colors"

export function useEmojiColor(emojiUrl: string | null) {
  const [color, setColor] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!emojiUrl) {
      setColor(null)
      setIsLoading(false)
      setError(null)
      return
    }
    const fetchColor = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await processImageForVibrantColorHex(emojiUrl)
        setColor(response)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    fetchColor()
  }, [emojiUrl])

  return { color, isLoading, error }
}
