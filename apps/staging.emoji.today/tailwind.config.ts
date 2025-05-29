import type { Config } from "tailwindcss"
import sharedConfig from "@emoji-today/tailwind-config/tailwind.config"

export default {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    ...sharedConfig.theme,
    extend: {
      ...sharedConfig.theme?.extend,
      // App-specific extensions can go here
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config
