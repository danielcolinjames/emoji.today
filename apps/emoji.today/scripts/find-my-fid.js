#!/usr/bin/env node

/**
 * Helper script to find your FID
 * This will show you what FID to use with clear-my-vote script
 */

console.log("🔍 How to find your FID:")
console.log("")
console.log("Method 1: From Browser Console")
console.log("1. Open your browser and go to emoji.today")
console.log("2. Sign in with Farcaster")
console.log("3. Open Developer Tools (F12)")
console.log("4. Go to Console tab")
console.log('5. Type: localStorage.getItem("farcaster-session")')
console.log('6. Look for "fid" in the response')
console.log("")
console.log("Method 2: From URL")
console.log("1. Check the URL when signed in")
console.log("2. Sometimes the FID appears in query parameters")
console.log("")
console.log("Method 3: Quick JavaScript")
console.log("Run this in browser console after signing in:")
console.log('JSON.parse(localStorage.getItem("farcaster-session") || "{}").fid')
console.log("")
console.log("Once you have your FID, run:")
console.log("npm run clear-my-vote YOUR_FID")
console.log("")
console.log("Example: npm run clear-my-vote 12345")
