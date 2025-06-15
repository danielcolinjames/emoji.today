import baseConfig from "@emoji-today/tailwind-config"
import type { Config } from "tailwindcss"

export default {
  presets: [baseConfig as Config],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/core-data/src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/core-ui/src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
} satisfies Config
