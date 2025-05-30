# emoji.today Jobs

This directory contains scheduled jobs for the emoji.today platform.

## Setup

1. Install dependencies:
```bash
yarn workspace emoji-today-jobs install
```

2. Create a `.env` file in this directory with the following variables:
```env
# Supabase configuration
SUPABASE_URL=https://lgkbapfskatvfrsnxcys.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-key-here
```

Note: You'll need a Supabase service key (not the anon key) for these jobs to have admin access.

## Available Jobs

### 1. Vote Tallying (`tally-votes.ts`)
**Stateless date-based vote counting** - counts votes and determines the winning emoji for any given day.

Run manually:
```bash
# Tally votes for today
yarn workspace emoji-today-jobs tally-votes

# Tally votes for a specific date
yarn workspace emoji-today-jobs tally-votes 2025-01-28
```

This job:
- Counts all votes for the specified date (UTC)
- Determines the winning emoji with smart tie-breaking logic
- Updates the `daily_results` table
- Can run at any time and get consistent results
- Includes social media post generation (Phase 2)

**Tie-Breaking Logic**: If multiple emojis have the same vote count, the winner is determined by which emoji's votes came later in the day on average (measured in seconds since midnight UTC).

### 2. Daily Reset (`daily-reset.ts`)
Runs at midnight UTC to finalize the previous day's voting.

Run manually:
```bash
yarn workspace emoji-today-jobs daily-reset
```

This job:
- Finalizes yesterday's voting results
- Announces the winner via social media (Phase 2)
- **No "preparation" needed** - the system is stateless and date-based

## Architecture Philosophy

The jobs follow a **stateless, date-based architecture**:

- ✅ Vote counting is pure: `SELECT * FROM votes WHERE vote_date = '2025-01-28'`
- ✅ Scripts can run at any time and get the same results
- ✅ No complex state management or preparation steps
- ✅ Resilient to timing issues or re-runs

## Deployment on Railway

These jobs should be deployed as cron jobs on Railway:

1. **Results Updater** (every 5 minutes):
   - Command: `yarn workspace emoji-today-jobs tally-votes`
   - Cron: `*/5 * * * *`

2. **Daily Reset** (midnight UTC):
   - Command: `yarn workspace emoji-today-jobs daily-reset`
   - Cron: `0 0 * * *`

## Date Handling

All dates use UTC timezone for consistency. The `lib/date-utils.ts` module provides utilities for:
- Getting the current voting day
- Formatting dates for database storage
- Checking if voting is still open
- Getting hours remaining
- **All operations are UTC-based** to prevent timezone issues

## Testing

### Populate Test Data
```bash
# Create test votes for today
yarn workspace emoji-today-jobs populate-test

# Create test votes for X days ago
yarn workspace emoji-today-jobs populate-test 1
```

### Clear Test Data
```bash
yarn workspace emoji-today-jobs clear-test
```

### Test Tie-Breaking
```bash
# Create a specific tie scenario
npx tsx src/create-tie-test.ts

# Then run tally to see tie-breaking in action
yarn workspace emoji-today-jobs tally-votes
```

## Future Enhancements (Phase 2)

- NFT minting for winning emojis
- 24-hour auction management
- Social media integration (X/Twitter and Farcaster)
- Winner notifications
- Raffle system for voters
- Streak tracking 