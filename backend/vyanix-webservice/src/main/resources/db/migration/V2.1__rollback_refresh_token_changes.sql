-- V2.1: Rollback refresh token security changes
-- EMERGENCY USE ONLY - Only run if V2 causes critical production issues
-- This will remove all security enhancements and revert to basic token storage

-- Note: This will result in loss of:
-- - Grace period protection
-- - Theft detection
-- - Token format tracking
-- - Enhanced revocation tracking

-- Drop indexes first
DROP INDEX IF EXISTS idx_refresh_token_format;
DROP INDEX IF EXISTS idx_refresh_token_grace;
DROP INDEX IF EXISTS idx_refresh_token_last_used;
DROP INDEX IF EXISTS idx_refresh_token_expiry;
DROP INDEX IF EXISTS idx_refresh_token_session;
DROP INDEX IF EXISTS idx_refresh_token_user;
DROP INDEX IF EXISTS idx_refresh_token_hash;

-- Remove new columns
ALTER TABLE refresh_tokens DROP COLUMN IF EXISTS grace_period_ends_at;
ALTER TABLE refresh_tokens DROP COLUMN IF EXISTS grace_used;
ALTER TABLE refresh_tokens DROP COLUMN IF EXISTS revoke_message_code;
ALTER TABLE refresh_tokens DROP COLUMN IF EXISTS token_format;
ALTER TABLE refresh_tokens DROP COLUMN IF EXISTS version;
ALTER TABLE refresh_tokens DROP COLUMN IF EXISTS theft_detected;
ALTER TABLE refresh_tokens DROP COLUMN IF EXISTS theft_detected_at;

-- Recreate basic index on token_hash
CREATE INDEX idx_refresh_token_hash ON refresh_tokens(token_hash);

-- Remove comments
COMMENT ON COLUMN refresh_tokens.token_format IS NULL;
COMMENT ON COLUMN refresh_tokens.revoke_message_code IS NULL;
COMMENT ON COLUMN refresh_tokens.grace_period_ends_at IS NULL;
COMMENT ON COLUMN refresh_tokens.grace_used IS NULL;
