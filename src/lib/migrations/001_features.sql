-- Migration: Add features for Degen Clicker
-- Run in Supabase SQL editor

-- ── 1. Referral system ──────────────────────────────────────────────────────
ALTER TABLE players
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by TEXT,
  ADD COLUMN IF NOT EXISTS prestige_level INTEGER DEFAULT 0;

-- Index for fast referral lookups
CREATE INDEX IF NOT EXISTS idx_players_referral_code ON players(referral_code);

-- ── 2. Login streak tracking ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS player_streaks (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_login_date DATE,
  total_days_played INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE player_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "streak_read_own" ON player_streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "streak_write_own" ON player_streaks FOR ALL USING (auth.uid() = user_id);

-- ── 3. Achievements table ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS player_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);
ALTER TABLE player_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "achieve_read_own" ON player_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "achieve_write_own" ON player_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ── 4. Friend / follow system ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS player_follows (
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);
ALTER TABLE player_follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "follows_read" ON player_follows FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "follows_write" ON player_follows FOR ALL USING (auth.uid() = follower_id);

-- ── 5. Daily quests ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id TEXT NOT NULL,          -- e.g. 'tap_500', 'reach_floor_20'
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  reward_coins INTEGER DEFAULT 0,
  target INTEGER DEFAULT 1,        -- target count to complete
  quest_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS player_quest_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  quest_id TEXT NOT NULL,
  quest_date DATE NOT NULL DEFAULT CURRENT_DATE,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  claimed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, quest_id, quest_date)
);
ALTER TABLE player_quest_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "quest_read_own" ON player_quest_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "quest_write_own" ON player_quest_progress FOR ALL USING (auth.uid() = user_id);

-- Seed today's quests (run this daily or use a pg_cron job)
INSERT INTO daily_quests (quest_id, name, description, reward_coins, target, quest_date)
VALUES
  ('tap_500',       'Tap Grinder',     'Tap 500 times today',              500,    500,  CURRENT_DATE),
  ('earn_10k',      'Coin Hoarder',    'Earn 10,000 $TOWER today',         800,    10000,CURRENT_DATE),
  ('reach_combo_10','Combo King',      'Reach a 10× combo',                300,    10,   CURRENT_DATE),
  ('floor_20',      'Tower Climber',   'Reach floor 20 in tower mode',     600,    20,   CURRENT_DATE),
  ('buy_upgrade',   'Upgrade Maniac',  'Purchase 5 upgrades',              400,    5,    CURRENT_DATE),
  ('play_3_hours',  'Dedicated Degen', 'Play for 3 hours total today',     1000,   180,  CURRENT_DATE)
ON CONFLICT DO NOTHING;

-- ── 6. In-game emotes / chat ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS game_emotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  emote TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);
-- Auto-delete emotes older than 10 minutes
CREATE INDEX IF NOT EXISTS idx_emotes_room_time ON game_emotes(room_id, sent_at DESC);

-- ── 7. Push notification subscriptions ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "push_read_own" ON push_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "push_write_own" ON push_subscriptions FOR ALL USING (auth.uid() = user_id);
