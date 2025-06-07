-- Initial schema migration - all tables from working production
-- This replaces all previous migrations with a clean state

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fid BIGINT NOT NULL UNIQUE,
  username TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  previous_usernames TEXT[],
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Votes table
CREATE TABLE IF NOT EXISTS votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  emoji TEXT NOT NULL,
  vote_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fid INTEGER NOT NULL
);

-- Emojis table
CREATE TABLE IF NOT EXISTS emojis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  emoji TEXT NOT NULL UNIQUE,
  unified TEXT NOT NULL UNIQUE,
  non_qualified TEXT,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  short_names TEXT[] NOT NULL DEFAULT '{}',
  keywords TEXT[] NOT NULL DEFAULT '{}',
  category TEXT NOT NULL,
  subcategory TEXT,
  sort_order INTEGER NOT NULL,
  added_in TEXT NOT NULL,
  unicode_version TEXT NOT NULL,
  accent_color TEXT,
  skin_variations JSONB,
  filename TEXT NOT NULL,
  has_img_apple BOOLEAN DEFAULT true,
  has_img_google BOOLEAN DEFAULT true,
  has_img_twitter BOOLEAN DEFAULT true,
  has_img_facebook BOOLEAN DEFAULT true,
  search_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_votable BOOLEAN DEFAULT true
);

-- Live results table
CREATE TABLE IF NOT EXISTS live_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vote_date DATE NOT NULL UNIQUE,
  emoji_counts JSONB NOT NULL DEFAULT '{}'::jsonb,
  total_votes INTEGER NOT NULL DEFAULT 0,
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  chyron_text TEXT
);

-- Daily results table
CREATE TABLE IF NOT EXISTS daily_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vote_date DATE NOT NULL UNIQUE,
  emoji_votes JSONB,
  winning_emoji TEXT,
  total_votes INTEGER DEFAULT 0,
  finalized_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Daily summaries table
CREATE TABLE IF NOT EXISTS daily_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vote_date DATE NOT NULL UNIQUE,
  winning_emoji TEXT NOT NULL,
  winning_count INTEGER NOT NULL,
  total_votes INTEGER NOT NULL,
  unique_emojis INTEGER NOT NULL,
  top_5_emojis JSONB,
  finalized_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Emoji ranks table
CREATE TABLE IF NOT EXISTS emoji_ranks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vote_date DATE NOT NULL,
  emoji TEXT NOT NULL,
  vote_count INTEGER NOT NULL DEFAULT 0,
  rank INTEGER,
  percentage NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  accent_color TEXT
);

-- Vote NFTs table
CREATE TABLE IF NOT EXISTS vote_nfts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vote_id UUID NOT NULL REFERENCES votes(id),
  wallet_address TEXT NOT NULL,
  signature_payload JSONB NOT NULL,
  signature TEXT NOT NULL,
  mint_price_usdc NUMERIC NOT NULL,
  transaction_hash TEXT,
  minted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Emoji assets table
CREATE TABLE IF NOT EXISTS emoji_assets (
  id BIGSERIAL PRIMARY KEY,
  emoji_char TEXT NOT NULL UNIQUE,
  codepoint TEXT NOT NULL,
  name TEXT,
  keywords TEXT[],
  category TEXT,
  image_url TEXT,
  storage_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Race commentary posts table
CREATE TABLE IF NOT EXISTS race_commentary_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_date DATE NOT NULL,
  commentary TEXT NOT NULL,
  posted_to_farcaster BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Race commentary snapshots table
CREATE TABLE IF NOT EXISTS race_commentary_snapshots (
  id BIGSERIAL PRIMARY KEY,
  vote_date DATE NOT NULL,
  milestone TEXT NOT NULL CHECK (milestone IN ('opening', '1hour', 'halfway', 'final_hour', 'final_minutes', 'daily_summary')),
  timestamp_utc TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_votes INTEGER NOT NULL DEFAULT 0,
  emoji_standings JSONB NOT NULL DEFAULT '[]'::jsonb,
  momentum_data JSONB,
  historical_context JSONB,
  commentary_text TEXT,
  chyron_text TEXT,
  posted_to_farcaster BOOLEAN DEFAULT false,
  farcaster_cast_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Essential indexes
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_vote_date ON votes(vote_date);
CREATE INDEX IF NOT EXISTS idx_votes_fid_date ON votes(fid, vote_date);
CREATE INDEX IF NOT EXISTS idx_live_results_vote_date ON live_results(vote_date);
CREATE INDEX IF NOT EXISTS idx_daily_results_vote_date ON daily_results(vote_date);
CREATE INDEX IF NOT EXISTS idx_emoji_ranks_date_rank ON emoji_ranks(vote_date, rank);
CREATE INDEX IF NOT EXISTS idx_race_snapshots_date_milestone ON race_commentary_snapshots(vote_date, milestone);

-- RLS (Row Level Security) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE emojis ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE emoji_ranks ENABLE ROW LEVEL SECURITY;
ALTER TABLE vote_nfts ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_commentary_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_commentary_snapshots ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (allow service role full access, public read on most tables)
CREATE POLICY "Public read access" ON emojis FOR SELECT USING (true);
CREATE POLICY "Service role full access" ON emojis FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Public read access" ON live_results FOR SELECT USING (true);
CREATE POLICY "Service role full access" ON live_results FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Public read access" ON daily_results FOR SELECT USING (true);
CREATE POLICY "Service role full access" ON daily_results FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Public read access" ON daily_summaries FOR SELECT USING (true);
CREATE POLICY "Service role full access" ON daily_summaries FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Public read access" ON emoji_ranks FOR SELECT USING (true);
CREATE POLICY "Service role full access" ON emoji_ranks FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Public read access" ON race_commentary_snapshots FOR SELECT USING (true);
CREATE POLICY "Service role full access" ON race_commentary_snapshots FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON users FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON votes FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON vote_nfts FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON race_commentary_posts FOR ALL USING (auth.role() = 'service_role');

-- Trigger to automatically update live_results when votes are added
CREATE OR REPLACE FUNCTION update_live_results_on_vote()
RETURNS TRIGGER AS $$
DECLARE
  vote_date_key DATE;
  emoji_key TEXT;
BEGIN
  vote_date_key := NEW.vote_date::DATE;
  emoji_key := NEW.emoji;
  
  INSERT INTO live_results (vote_date, emoji_counts, total_votes, last_updated_at)
  VALUES (vote_date_key, jsonb_build_object(emoji_key, 1), 1, NOW())
  ON CONFLICT (vote_date) DO UPDATE SET
    emoji_counts = CASE 
      WHEN live_results.emoji_counts ? emoji_key THEN
        jsonb_set(
          live_results.emoji_counts,
          ARRAY[emoji_key],
          to_jsonb((live_results.emoji_counts->>emoji_key)::INTEGER + 1)
        )
      ELSE
        live_results.emoji_counts || jsonb_build_object(emoji_key, 1)
    END,
    total_votes = live_results.total_votes + 1,
    last_updated_at = NOW();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_live_results ON votes;
CREATE TRIGGER trigger_update_live_results
  AFTER INSERT ON votes
  FOR EACH ROW
  EXECUTE FUNCTION update_live_results_on_vote(); 