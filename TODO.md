# emoji.today - TODO List

## 🚨 Critical - Before Going Live

### Database Migration (URGENT)
**Run these SQL commands in Supabase SQL editor:**

```sql
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
```

### Staging Environment Setup (HIGH PRIORITY)
- [ ] Create separate Supabase project for staging
- [ ] Set up staging deployment pipeline (Vercel preview deployments?)
- [ ] Configure staging environment variables
- [ ] Create staging-specific emoji assets and data
- [ ] Document deployment process for staging vs production
- [ ] Set up staging database with same schema as production

### Pre-Launch Cleanup
- [ ] Clear all test votes: `yarn clear-all-votes`
- [ ] Verify emoji data consistency
- [ ] Test full voting flow with real Farcaster users
- [ ] Verify share card generation
- [ ] Test results display with various vote counts

## 🔧 Technical Improvements

### Database & Performance
- [ ] Consider storing fid directly in votes table vs. normalized approach
- [ ] Add database constraints and foreign keys
- [ ] Set up database backups
- [ ] Monitor query performance once live
- [ ] Add proper error logging/monitoring

### Authentication & User Management
- [x] Track username changes in `previous_usernames` array
- [x] Update username on sign-in from Frame context
- [x] Store FID as primary identifier
- [ ] Handle edge cases for username conflicts
- [ ] Add user profile endpoints if needed

### Testing & Monitoring
- [ ] Add comprehensive unit tests
- [ ] Set up error monitoring (Sentry?)
- [ ] Add analytics tracking
- [ ] Create health check endpoints
- [ ] Add rate limiting for voting

## 📱 Product Features

### Phase 1 (MVP - Friday Launch)
- [x] Clean segmented voting flow (SelectEmoji → ConfirmEmoji → Results)
- [x] Consistent page layouts with proper spacing/typography
- [x] Farcaster authentication
- [x] Daily vote limitation
- [x] Real-time results display
- [ ] Share card generation
- [ ] Automated social posts

### Phase 2 (Post-Launch)
- [ ] $1 "mint your vote" collectible
- [ ] Cultural curation rewards pool
- [ ] Auto-minting 1/1 NFT of winning emoji
- [ ] 24-hour auction system
- [ ] Advanced share card customization

## 🏗️ Infrastructure

### Deployment
- [ ] Set up production domain (emoji.today)
- [ ] Set up mini-app domain (vote.emoji.today)
- [ ] Configure DNS properly
- [ ] Set up SSL certificates
- [ ] Configure Vercel deployment settings

### Monitoring & Maintenance
- [ ] Set up uptime monitoring
- [ ] Create backup/restore procedures
- [ ] Document troubleshooting guide
- [ ] Set up alerts for critical failures

## 🎨 UI/UX Polish

### Visual Design
- [ ] Finalize color scheme and branding
- [ ] Add loading states and animations
- [ ] Optimize mobile responsiveness
- [ ] Add proper error messages and states
- [ ] Implement proper dark mode support

### User Experience
- [ ] Add confirmation modals for critical actions
- [ ] Improve accessibility (ARIA labels, keyboard navigation)
- [ ] Add helpful tooltips and onboarding
- [ ] Optimize page load times

## 📋 Scripts & Tools

### Available Scripts
```bash
# Clear your vote for testing
yarn clear-vote 1090325

# Reassign your vote to random user  
yarn reassign-vote 1090325

# Clear all votes (before going live!)
yarn clear-all-votes

# Run database migration
yarn migrate-db
```

### Development Tools
- [x] Vote clearing scripts for testing
- [x] Database migration scripts
- [ ] Data seeding scripts for testing
- [ ] Performance benchmarking tools

## 📚 Documentation

### Technical Documentation
- [ ] API documentation
- [ ] Database schema documentation
- [ ] Deployment guide
- [ ] Troubleshooting guide

### User Documentation
- [ ] User guide for voting
- [ ] FAQ section
- [ ] Terms of service and privacy policy
- [ ] Help section for common issues

---

## 🎯 Priority Order

1. **Run database migration SQL** (blocking TypeScript compilation)
2. **Set up staging environment** (needed for safe testing)
3. **Test full voting flow** (verify everything works)
4. **Clear test data** (prepare for launch)
5. **Deploy to production domains** (go live!)

## Notes

- FID is the source of truth for user identity
- Username can change, so track in `previous_usernames` array
- Database design now supports both normalized queries (via user_id) and efficient direct queries (via fid)
- Testing override: FID 1090325 always allows fresh voting in development 

## RIGHT NOW (1 thing at a time, move to DONE when done, move next Immediately up to here)
- [ ] Fix vote results page and vote tallying (IN PROGRESS)
  - ✅ Created scalable database architecture:
    - `emoji_ranks` table: One row per emoji per day (rank, count, percentage)
    - `daily_summaries` table: One row per day with winner and top 5
    - Database trigger automatically updates both tables when votes change
  - ✅ Applied migration to staging successfully
  - [ ] Frontend updates needed:
    - Update VotingResults to use new tables
    - Implement infinite scroll (load top 5, then 10 more at a time)
    - Remove "View all results" button, replace with scroll-to-load
  - [ ] Migration plan for production:
    1. Apply migration to prod (tables created alongside existing ones)
    2. Update job to write to both old and new tables (dual-write)
    3. Deploy frontend to use new tables
    4. Monitor for a week, then remove old tables
  
  **Original notes:**
  - Right now the way it works (veryify this for me) is that every time someone votes, it recalculates the live_results table.
  - Instead, there should be a job that updates a new table, which maybe this new table can be daily_records, and the frontend checks the entry for that date (UTC) and pulls a certain range of those results, ranked. Maybe it just pulls the top 5 results (can we make that table update its rankings automatically? I don't know the best way to store all voted-for emojis and how many votes each one received, but that's how it should work, and it should be query-able by asking for e.g. top 5, then the user presses "View more" and it loads the next 10, then the next 10 come up when they scroll to the bottom, so it's like an infinite scroll reveal)
  - Maybe there's a job that runs either every 5 minutes, OR gets triggered every time a user votes. I'm not sure how to accomplish that, but I think that's probably how it should work. 