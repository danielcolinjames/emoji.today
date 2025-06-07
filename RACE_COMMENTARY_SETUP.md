# Race Commentary Setup Guide 🏁

This guide will help you set up the AI-powered race commentary feature that automatically generates exciting emoji race announcements and posts them to Farcaster, plus a live TV-style chyron ticker.

## Features

### 1. **Scrolling Chyron Ticker** ⚡ NEW!
- TV news-style ticker at bottom of voting results page
- Ultra-short, punchy updates in ALL CAPS
- Uses **Sixtyfour Convergence** font for authentic broadcast feel
- Auto-updates every 30 seconds when votes change
- No manual refresh needed

### 2. **Live Race Commentary in UI**
- Shows in voting results page as Farcaster-ready posts
- Manual refresh button available
- Displays breathless horse race announcer style commentary
- Purple/blue themed for social media focus

### 3. **Automatic Farcaster Posts**
- API endpoint: `POST /api/race-update`
- Can be triggered manually or by schedulers
- Includes rate limiting (30 min minimum between posts)
- Detects "dramatic moments" for smart posting

### 4. **Scheduled Jobs**
- Located in `apps/jobs/src/race-commentary.ts`
- Can run with different options including chyron-only mode

## Required API Keys & Environment Variables

Add these to your `.env.local` file (or your production environment):

```bash
# OpenRouter API (for AI commentary generation)
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Neynar API (for posting to Farcaster)
NEYNAR_API_KEY=your_neynar_api_key_here
FARCASTER_SIGNER_UUID=your_farcaster_signer_uuid_here

# Optional: Security token for API endpoint
RACE_UPDATE_SECRET_TOKEN=your_secret_token_here
```

## Getting API Keys

### 1. OpenRouter API Key
1. Go to [OpenRouter.ai](https://openrouter.ai/)
2. Sign up and get an API key
3. Fund your account (Claude Haiku is very cheap - ~$0.0001 per request)
4. Add the key as `OPENROUTER_API_KEY`

### 2. Neynar API & Farcaster Signer
1. Go to [Neynar.com](https://neynar.com/)
2. Sign up and get an API key
3. Create a signer for your Farcaster account
4. Add both `NEYNAR_API_KEY` and `FARCASTER_SIGNER_UUID`

Reference: [Neynar Cast API Documentation](https://docs.neynar.com/reference/publish-cast#post-a-cast)

## Usage

### Manual Testing

#### Test Chyron Generation
```bash
# Test chyron ticker update
curl http://localhost:3000/api/chyron

# Generate chyron via job (dry run)
cd apps/jobs && npm run start race-commentary.ts -- --chyron --dry-run
```

#### Test Commentary Generation (Web UI)
1. Go to voting results page
2. See both chyron ticker and Farcaster commentary
3. Chyron auto-updates, commentary has manual refresh

#### Test API Endpoints
```bash
# Health check
curl https://your-domain.com/api/race-update

# Chyron update
curl https://your-domain.com/api/chyron

# Force post (bypasses rate limiting)
curl -X POST "https://your-domain.com/api/race-update?force=true" \
  -H "Authorization: Bearer your_secret_token"

# Only post if dramatic moment
curl -X POST "https://your-domain.com/api/race-update?drama=true"
```

#### Test Scheduled Job
```bash
# From apps/jobs directory
cd apps/jobs

# Generate chyron text only
npm run start race-commentary.ts -- --chyron

# Dry run Farcaster post
npm run start race-commentary.ts -- --dry-run --force

# Only post if dramatic
npm run start race-commentary.ts -- --dramatic
```

### Production Scheduling

#### Option 1: Railway Cron Jobs
Add to your Railway deployment:
```bash
# Every 2 hours during voting day - Farcaster posts
0 */2 * * * cd /app && npm run start race-commentary.ts

# Every 30 minutes during final 4 hours - dramatic posts
0,30 20-23 * * * cd /app && npm run start race-commentary.ts -- --dramatic

# Every 5 minutes - chyron updates (optional, UI auto-updates)
*/5 * * * * cd /app && npm run start race-commentary.ts -- --chyron
```

#### Option 2: External Cron (cron-job.org, etc.)
```bash
# Every hour, only post dramatic moments
curl -X POST "https://your-domain.com/api/race-update?drama=true" \
  -H "Authorization: Bearer your_secret_token"

# Every 3 hours, force post
curl -X POST "https://your-domain.com/api/race-update?force=true" \
  -H "Authorization: Bearer your_secret_token"

# Update chyron (optional)
curl "https://your-domain.com/api/chyron"
```

## Commentary Modes

The system now generates different styles based on context:

### **Chyron Mode** (NEW!)
- **Purpose**: TV ticker scrolling at bottom
- **Style**: ALL CAPS, ultra-short (max 60 chars)
- **Examples**: 
  - `🔥 LEADS WITH 15 VOTES • 6H LEFT`
  - `TIGHT RACE! 🎯 vs 🔥 • 2 VOTE GAP`
  - `POLLS OPEN • CAST YOUR VOTE AT EMOJI.TODAY`

### **Farcaster Mode**
- **Purpose**: Social media posts
- **Style**: 1-2 sentences, under 200 characters
- **Examples**: 
  - `🏁 🔥 is surging ahead with 23 votes, but 🎯 is closing fast with just 3h 15m left in this nail-biter!`

### **Web Mode** 
- **Purpose**: Detailed UI commentary (legacy)
- **Style**: Full sentences with context and history
- **Examples**: Full race analysis with historical context

## Dramatic Moment Detection

The system automatically detects when to post based on:
- **Tight Race**: Lead is < 5% or < 2 votes
- **Momentum Shifts**: Emojis with recent surging votes
- **Final Hours**: Last 2 hours of voting
- **High Participation**: >= 50 votes total

## Customization

### Modify Commentary Style
- **Chyron**: Edit `chyron` mode prompt in race-commentary actions
- **Farcaster**: Edit `farcaster` mode prompt
- **Web**: Edit `web` mode prompt

### Adjust Rate Limiting
Change `MIN_POST_INTERVAL` in the job file (default: 30 minutes)

### Change Dramatic Moment Criteria
Modify the `isDramaticMoment` logic in `buildRaceContext()`

### Customize Chyron Appearance
- Font: Currently uses **Sixtyfour Convergence** from Google Fonts
- Colors: Red theme matching news ticker style
- Animation: 20s scroll duration (customizable in CSS)

## Example Scheduling Strategy

**Conservative Approach:**
- Every 3 hours: Check for dramatic moments (Farcaster)
- Final 4 hours: Every hour (Farcaster)
- Chyron: Auto-updates in UI every 30s

**Aggressive Approach:**
- Every hour: Force post if >10 votes (Farcaster)
- Every 30 minutes: Check dramatic moments (Farcaster)
- Final 2 hours: Every 15 minutes (Farcaster)
- Chyron: Auto-updates in UI every 30s

**TV News Style** (NEW!):
- Continuous chyron updates in UI
- Farcaster posts only on dramatic moments
- Focus on the live ticker experience

## Troubleshooting

### Common Issues

1. **"Authentication required" error**
   - The frontend race commentary requires user login
   - The job/API and chyron can run without user auth

2. **"OpenRouter API error"**
   - Check your API key and account balance
   - Verify the model name is correct

3. **"Neynar API error"**
   - Verify signer UUID is correct and approved
   - Check if you have posting permissions

4. **Chyron not updating**
   - Check browser console for errors
   - Verify API endpoint `/api/chyron` works
   - Font may take time to load initially

5. **Font not loading**
   - Verify Google Fonts connection
   - Check network tab for font loading
   - Fallback is monospace if font fails

### Testing Without Posting

Always test with `--dry-run` first:
```bash
# Test all modes
npm run start race-commentary.ts -- --dry-run --force
npm run start race-commentary.ts -- --chyron --dry-run
```

### Testing Chyron Locally
1. Start your dev server: `yarn emoji`
2. Go to voting results page
3. Watch the red ticker at bottom
4. Check browser console for any errors
5. Test API directly: `curl http://localhost:3000/api/chyron`

The chyron gives your emoji race the authentic feeling of breaking news! 📺🏁 