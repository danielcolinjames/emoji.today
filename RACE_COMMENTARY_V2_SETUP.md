# 🏁 Enhanced Race Commentary System v2

This is the new and improved race commentary system that creates AI-generated commentary at strategic milestones throughout each voting day, with automatic Farcaster posting and enhanced chyron functionality.

## ✨ **Key Features**

### **🎯 Milestone-Based Commentary**
- **Opening Bell** (5 minutes in): Hype-building race start
- **1-Hour Mark**: Early momentum analysis  
- **Halfway Point** (noon): Prime drama time
- **Final Hour** (11pm): Crunch time urgency
- **Final Minutes** (11:55pm): Climactic finish

### **📊 Enhanced Context System**
- Historical comparison to previous days
- Vote velocity tracking
- Momentum analysis with timing-based rankings
- Smart dramatic moment detection

### **📺 Snarky Chyron Ticker**
- Personality-driven commentary: *"😭 HANGING ON WITH 1 VOTE • THAT VOTER IS GOING THROUGH IT"*
- Real-time updates from snapshot system
- No more API calls needed - reads from database

### **🤖 Automated Farcaster Posts**
- Custom prompts for each milestone
- Automatic posting with error handling
- Rate limiting and duplicate prevention

## 🗄️ **Database Setup**

### 1. Run the Migration
```sql
-- Execute this in your Supabase SQL editor:
-- apps/emoji.today/database/migrations/create_race_commentary_snapshots.sql
```

### 2. Update Environment Variables
```bash
# Required for AI generation
OPENROUTER_API_KEY=your_openrouter_key_here

# Required for Farcaster posting  
NEYNAR_API_KEY=your_neynar_api_key_here
FARCASTER_SIGNER_UUID=your_signer_uuid_here

# Required for Vercel cron security
CRON_SECRET=your_random_secret_token_here

# Already exists (for service role access)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## ⏰ **Vercel Cron Schedule**

The system automatically posts at these UTC times:
- **00:05** - Opening (5 minutes after polls open)
- **01:00** - 1-hour milestone  
- **12:00** - Halfway point
- **23:00** - Final hour
- **23:55** - Final minutes

## 🧪 **Testing the System**

### Manual Testing (Server Actions)
```typescript
// Test server actions directly in your dev tools or a test file
import { createManualSnapshot } from "@/actions/race-commentary-milestones"

const result = await createManualSnapshot("opening")
console.log(result)
```

### Manual Testing (API Routes - for cron simulation)
```bash
# Test individual milestones (requires CRON_SECRET)
curl -X POST http://localhost:3000/api/race-commentary/opening \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Test chyron 
curl http://localhost:3000/api/chyron
```

### Check Database
```sql
-- View recent snapshots
SELECT vote_date, milestone, total_votes, 
       substring(commentary_text, 1, 100) as commentary_preview,
       substring(chyron_text, 1, 50) as chyron_preview,
       posted_to_farcaster
FROM race_commentary_snapshots 
ORDER BY timestamp_utc DESC 
LIMIT 5;
```

## 🎨 **Customizing Prompts**

All prompts are in `apps/emoji.today/src/lib/race-commentary-service.ts`:

### **Milestone Prompts**
- `MILESTONE_PROMPTS.opening` - Opening bell energy
- `MILESTONE_PROMPTS['1hour']` - Early momentum  
- `MILESTONE_PROMPTS.halfway` - Midday madness
- `MILESTONE_PROMPTS.final_hour` - Final hour frenzy
- `MILESTONE_PROMPTS.final_minutes` - Final sprint

### **Chyron Prompt**
- `CHYRON_PROMPT` - Snarky ticker style

**Example customization:**
```typescript
const MILESTONE_PROMPTS = {
  opening: `🚀 OPENING BELL ENERGY: Write YOUR CUSTOM PROMPT HERE...`
}
```

## 🔄 **How It Works**

```
┌─ VERCEL CRON TRIGGERS ────────────────────────────┐
│ • 5 specific times per day                        │
│ • Authenticated with CRON_SECRET                  │
│ • Thin API route wrappers                         │
└───────────────────────────────────────────────────┘
          ↓ calls ↓
┌─ SERVER ACTIONS ──────────────────────────────────┐
│ • Secure, server-only execution                   │
│ • createOpeningSnapshot(), create1HourSnapshot()  │
│ • Business logic protected from abuse             │
└───────────────────────────────────────────────────┘
          ↓ creates ↓
┌─ RACE SNAPSHOTS ──────────────────────────────────┐
│ • Analyzes current vote state                     │
│ • Compares to historical data                     │
│ • Generates AI commentary + chyron                │
│ • Stores in race_commentary_snapshots table       │
└───────────────────────────────────────────────────┘
          ↓ triggers ↓
┌─ FARCASTER POSTING ───────────────────────────────┐
│ • Posts milestone commentary                      │
│ • Tracks success/failure                          │
│ • Stores cast hash for reference                  │
└───────────────────────────────────────────────────┘
          ↓ serves ↓
┌─ LIVE UI UPDATES ─────────────────────────────────┐
│ • Chyron reads latest from database               │
│ • No API calls needed                             │
│ • Smooth, uninterrupted scrolling                 │
└───────────────────────────────────────────────────┘
```

## 🚨 **Troubleshooting**

### **"Table race_commentary_snapshots doesn't exist"**
- Run the database migration first
- Check Supabase logs for migration errors

### **"OpenRouter API error"**  
- Verify `OPENROUTER_API_KEY` is set
- Check account balance
- Test with a simple API call

### **"Farcaster posting failed"**
- Verify `NEYNAR_API_KEY` and `FARCASTER_SIGNER_UUID`
- Check signer permissions in Neynar dashboard
- Look for rate limiting issues

### **Cron jobs not triggering**
- Verify `CRON_SECRET` is set in production
- Check Vercel function logs
- Test endpoints manually first

### **Chyron not updating**
- Check if snapshots are being created
- Look for database connection issues
- Verify service role permissions

## 🎯 **Next Steps**

1. **Run the database migration**
2. **Set up environment variables**  
3. **Test manually in development**
4. **Deploy to production**
5. **Monitor first automated run**

The system is designed to be self-healing and will gracefully fall back to default text if anything fails. Every snapshot and post is logged for debugging.

**Happy racing!** 🏁🎉 