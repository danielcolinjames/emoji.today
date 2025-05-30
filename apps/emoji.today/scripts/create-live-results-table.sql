-- Create live_results table for real-time vote tracking
CREATE TABLE IF NOT EXISTS live_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vote_date DATE NOT NULL UNIQUE,
  emoji_counts JSONB NOT NULL DEFAULT '{}',
  total_votes INTEGER NOT NULL DEFAULT 0,
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups by date
CREATE INDEX IF NOT EXISTS idx_live_results_vote_date ON live_results(vote_date);

-- Index for faster ordering by last_updated_at
CREATE INDEX IF NOT EXISTS idx_live_results_last_updated ON live_results(last_updated_at);

-- Function to update live_results when a vote is submitted
CREATE OR REPLACE FUNCTION update_live_results_on_vote()
RETURNS TRIGGER AS $$
DECLARE
  vote_date_key DATE;
  current_counts JSONB;
  emoji_key TEXT;
  current_count INTEGER;
BEGIN
  -- Get the vote date
  vote_date_key := NEW.vote_date::DATE;
  emoji_key := NEW.emoji;
  
  -- Insert or update live_results for this date
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

-- Create trigger to automatically update live_results when votes are inserted
DROP TRIGGER IF EXISTS trigger_update_live_results ON votes;
CREATE TRIGGER trigger_update_live_results
  AFTER INSERT ON votes
  FOR EACH ROW
  EXECUTE FUNCTION update_live_results_on_vote();

-- Initialize live_results for today if it doesn't exist
INSERT INTO live_results (vote_date, emoji_counts, total_votes)
SELECT 
  CURRENT_DATE,
  '{}',
  0
WHERE NOT EXISTS (
  SELECT 1 FROM live_results WHERE vote_date = CURRENT_DATE
);

-- Backfill existing vote data into live_results
INSERT INTO live_results (vote_date, emoji_counts, total_votes, last_updated_at)
SELECT 
  vote_date::DATE,
  jsonb_object_agg(emoji, vote_count),
  SUM(vote_count),
  NOW()
FROM (
  SELECT 
    vote_date,
    emoji,
    COUNT(*) as vote_count
  FROM votes
  GROUP BY vote_date, emoji
) grouped_votes
GROUP BY vote_date
ON CONFLICT (vote_date) DO UPDATE SET
  emoji_counts = EXCLUDED.emoji_counts,
  total_votes = EXCLUDED.total_votes,
  last_updated_at = EXCLUDED.last_updated_at; 