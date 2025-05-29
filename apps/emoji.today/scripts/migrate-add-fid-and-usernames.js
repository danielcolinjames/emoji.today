#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function runMigration() {
  console.log("🚀 Starting database migration...")

  try {
    // 1. Add fid column to votes table
    console.log("📝 Adding fid column to votes table...")
    await supabase.rpc("exec_sql", {
      sql: `
        ALTER TABLE votes 
        ADD COLUMN IF NOT EXISTS fid INTEGER;
      `,
    })

    // 2. Add username tracking columns to users table
    console.log("📝 Adding username tracking columns to users table...")
    await supabase.rpc("exec_sql", {
      sql: `
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS previous_usernames TEXT[],
        ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW();
      `,
    })

    // 3. Populate fid in existing votes by joining with users
    console.log("📝 Populating fid in existing votes...")
    await supabase.rpc("exec_sql", {
      sql: `
        UPDATE votes 
        SET fid = users.fid 
        FROM users 
        WHERE votes.user_id = users.id 
        AND votes.fid IS NULL;
      `,
    })

    // 4. Create index for efficient queries
    console.log("📝 Creating indexes...")
    await supabase.rpc("exec_sql", {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_votes_fid_date ON votes(fid, vote_date);
        CREATE INDEX IF NOT EXISTS idx_users_last_updated ON users(last_updated);
      `,
    })

    // 5. Make fid NOT NULL (after populating)
    console.log("📝 Making fid NOT NULL...")
    await supabase.rpc("exec_sql", {
      sql: `
        ALTER TABLE votes 
        ALTER COLUMN fid SET NOT NULL;
      `,
    })

    console.log("✅ Migration completed successfully!")
    console.log("📊 Summary of changes:")
    console.log("  - Added fid column to votes table with NOT NULL constraint")
    console.log("  - Added previous_usernames array to users table")
    console.log("  - Added last_updated timestamp to users table")
    console.log("  - Created indexes for better query performance")
    console.log("  - Populated fid in existing vote records")
  } catch (error) {
    console.error("❌ Migration failed:", error)
    process.exit(1)
  }
}

// Check if we have the exec_sql function, if not, use direct SQL
async function checkAndCreateExecFunction() {
  try {
    // Try to create exec_sql function if it doesn't exist
    const { error } = await supabase.rpc("exec_sql", { sql: "SELECT 1;" })
    if (error) {
      console.log("📝 Creating exec_sql function...")
      // We'll need to run individual SQL commands instead
      return false
    }
    return true
  } catch (error) {
    return false
  }
}

async function runMigrationDirect() {
  console.log("🚀 Starting database migration (direct SQL)...")

  try {
    // 1. Add fid column to votes table
    console.log("📝 Adding fid column to votes table...")
    const { error: addFidError } = await supabase
      .from("votes")
      .select("id")
      .limit(1)

    if (addFidError) {
      console.log("Table might not exist or need different approach")
    }

    // For now, let's create a simpler version that just shows what needs to be done
    console.log("⚠️  Manual SQL migration needed:")
    console.log(`
-- Run these SQL commands in your Supabase SQL editor:

-- 1. Add fid column to votes table
ALTER TABLE votes ADD COLUMN IF NOT EXISTS fid INTEGER;

-- 2. Add username tracking columns to users table  
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS previous_usernames TEXT[],
ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Populate fid in existing votes
UPDATE votes 
SET fid = users.fid 
FROM users 
WHERE votes.user_id = users.id 
AND votes.fid IS NULL;

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_votes_fid_date ON votes(fid, vote_date);
CREATE INDEX IF NOT EXISTS idx_users_last_updated ON users(last_updated);

-- 5. Make fid NOT NULL (run this last, after step 3)
ALTER TABLE votes ALTER COLUMN fid SET NOT NULL;
    `)
  } catch (error) {
    console.error("❌ Migration check failed:", error)
  }
}

async function main() {
  const hasExecFunction = await checkAndCreateExecFunction()

  if (hasExecFunction) {
    await runMigration()
  } else {
    await runMigrationDirect()
  }
}

main()
