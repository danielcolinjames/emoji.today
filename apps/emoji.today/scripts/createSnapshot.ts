#!/usr/bin/env tsx

import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"

// ESM-compatible __dirname replacement
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load env vars from repo root .env.local (two levels up) or app-level .env.local
const rootEnvPath = path.resolve(__dirname, "../../.env.local")
const appEnvPath = path.resolve(__dirname, "../.env.local")
dotenv.config({ path: rootEnvPath, override: false })
dotenv.config({ path: appEnvPath, override: false })

import { createRaceSnapshot } from "../src/lib/race-commentary-service"
import { supabase } from "../src/lib/supabase"
import { getCurrentVotingDateString } from "../src/lib/date-utils"

async function main() {
  const args = process.argv.slice(2)
  const milestoneArg = args.find((a) => !a.startsWith("--"))
  const milestone = milestoneArg || "opening"
  const force = args.includes("--force")

  console.log(`Creating snapshot for milestone="${milestone}" force=${force}`)
  const result = await createRaceSnapshot(milestone, force)

  if (!result.success || !result.snapshot) {
    console.error("❌ Failed to create snapshot", result.error)
    process.exit(1)
  }

  const today = getCurrentVotingDateString()
  const { data, error } = await supabase
    .from("race_commentary_snapshots")
    .select("id")
    .eq("vote_date", today)
    .eq("milestone", milestone)
    .order("timestamp_utc", { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    console.error("❌ Snapshot created but id lookup failed", error)
    process.exit(1)
  }

  console.log("✅ Snapshot created with id:", data.id)
  console.log(`Preview it at http://localhost:3000/podium-snapshot/${data.id}`)
}

main()
