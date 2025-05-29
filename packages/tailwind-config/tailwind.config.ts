import type { Config } from "tailwindcss"

// This is a partial config meant to be extended by apps
const sharedConfig: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        // Brand colors
        "brand-yellow": "#FFD700",
        "brand-primary": "#FFD700",
        "brand-secondary": "#FFA500",

        // Semantic colors
        background: "var(--background)",
        foreground: "var(--foreground)",

        // Additional brand colors
        brand: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-satoshi)",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        "geist-mono": [
          "var(--font-geist-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
      },
      letterSpacing: {
        branded: "-0.07em", // -7% converted to em
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { transform: "translateY(10px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
}

export default sharedConfig
