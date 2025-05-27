import { Vibrant } from "node-vibrant/browser"

// Function to process an image URL and return a vibrant color hex
export async function processImageForVibrantColorHex(
  imageUrl: string
): Promise<string | null> {
  if (!imageUrl) {
    return null
  }
  try {
    const palette = await Vibrant.from(imageUrl).getPalette()
    // Prioritize Vibrant, but fallback to other swatches if Vibrant is not available
    if (palette) {
      if (palette.Vibrant) return palette.Vibrant.hex
      if (palette.LightVibrant) return palette.LightVibrant.hex
      if (palette.DarkVibrant) return palette.DarkVibrant.hex
      if (palette.Muted) return palette.Muted.hex
      // Add more fallbacks if necessary or return a default color / null
    }
    return null // Return null if no suitable color is found
  } catch (error) {
    console.error("Error extracting color with node-vibrant:", error)
    // Re-throw the error so the calling hook can handle it
    throw error
  }
}
