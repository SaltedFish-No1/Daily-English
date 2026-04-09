-- 用量管理数据库表结构（用户等级 + 每日 API 用量聚合）
-- Run this in the Supabase SQL editor.

-- ==========================================================================
-- 1. user_tiers — 用户等级（默认 free）
-- ==========================================================================
CREATE TABLE IF NOT EXISTS user_tiers (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tier       TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro')),
  expires_at TIMESTAMPTZ,              -- pro 到期时间，NULL = 永久
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_tiers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users read own tier') THEN
    CREATE POLICY "Users read own tier"
      ON user_tiers FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END
$$;

-- ==========================================================================
-- 2. api_usage_daily — 每日用量聚合（按用户 + 路由 + 日期）
-- ==========================================================================
CREATE TABLE IF NOT EXISTS api_usage_daily (
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  route_key    TEXT NOT NULL,            -- e.g. 'review-generate', 'writing-grade'
  usage_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  call_count   INT NOT NULL DEFAULT 0,
  token_input  INT NOT NULL DEFAULT 0,   -- 累计输入 token
  token_output INT NOT NULL DEFAULT 0,   -- 累计输出 token
  updated_at   TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, route_key, usage_date)
);

ALTER TABLE api_usage_daily ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users read own usage') THEN
    CREATE POLICY "Users read own usage"
      ON api_usage_daily FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_usage_daily_date ON api_usage_daily (user_id, usage_date);

-- ==========================================================================
-- 3. increment_usage — 原子递增函数（upsert + increment）
-- ==========================================================================
CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id       UUID,
  p_route_key     TEXT,
  p_calls         INT DEFAULT 1,
  p_input_tokens  INT DEFAULT 0,
  p_output_tokens INT DEFAULT 0
) RETURNS void AS $$
BEGIN
  INSERT INTO api_usage_daily (user_id, route_key, usage_date, call_count, token_input, token_output)
  VALUES (p_user_id, p_route_key, CURRENT_DATE, p_calls, p_input_tokens, p_output_tokens)
  ON CONFLICT (user_id, route_key, usage_date) DO UPDATE SET
    call_count   = api_usage_daily.call_count   + p_calls,
    token_input  = api_usage_daily.token_input  + p_input_tokens,
    token_output = api_usage_daily.token_output + p_output_tokens,
    updated_at   = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
