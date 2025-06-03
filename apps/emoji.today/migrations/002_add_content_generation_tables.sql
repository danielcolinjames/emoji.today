-- Migration: Add content generation tables
-- Description: Add tables for live ticker content and social posts logging

-- Table for storing live ticker headlines
CREATE TABLE IF NOT EXISTS ticker_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  context JSONB DEFAULT '{}'::jsonb,
  vote_date DATE DEFAULT CURRENT_DATE
);

-- Indexes for ticker_content
CREATE INDEX IF NOT EXISTS idx_ticker_content_expires_at ON ticker_content(expires_at);
CREATE INDEX IF NOT EXISTS idx_ticker_content_priority ON ticker_content(priority);
CREATE INDEX IF NOT EXISTS idx_ticker_content_vote_date ON ticker_content(vote_date);

-- Table for logging social media posts
CREATE TABLE IF NOT EXISTS social_posts_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  platform VARCHAR(50) NOT NULL, -- 'farcaster', 'twitter', 'both'
  content TEXT NOT NULL,
  share_url TEXT,
  post_context JSONB DEFAULT '{}'::jsonb,
  posted_at TIMESTAMPTZ DEFAULT NOW(),
  vote_date DATE DEFAULT CURRENT_DATE,
  external_id TEXT, -- Cast hash for Farcaster, Tweet ID for Twitter
  success BOOLEAN DEFAULT true,
  error_message TEXT
);

-- Indexes for social_posts_log
CREATE INDEX IF NOT EXISTS idx_social_posts_platform ON social_posts_log(platform);
CREATE INDEX IF NOT EXISTS idx_social_posts_vote_date ON social_posts_log(vote_date);
CREATE INDEX IF NOT EXISTS idx_social_posts_posted_at ON social_posts_log(posted_at);

-- RLS (Row Level Security) policies
ALTER TABLE ticker_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts_log ENABLE ROW LEVEL SECURITY;

-- Allow all users to read ticker content
CREATE POLICY "Allow public read on ticker_content" ON ticker_content
  FOR SELECT USING (true);

-- Allow all users to read social posts log (for transparency)
CREATE POLICY "Allow public read on social_posts_log" ON social_posts_log
  FOR SELECT USING (true);

-- Only service role can insert/update/delete
CREATE POLICY "Allow service role full access on ticker_content" ON ticker_content
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role full access on social_posts_log" ON social_posts_log
  FOR ALL USING (auth.role() = 'service_role'); 