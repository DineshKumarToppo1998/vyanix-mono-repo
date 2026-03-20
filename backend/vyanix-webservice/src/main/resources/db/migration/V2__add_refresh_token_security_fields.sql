-- V2: Add refresh token security fields for production-grade JWT authentication
-- This migration adds support for:
-- - SHA-256 token hashing (faster lookups than BCrypt)
-- - Grace period for token rotation (prevents false positive theft detection)
-- - Token format tracking (LEGACY vs CURRENT for migration)
-- - Optimistic locking (version field)
-- - Enhanced revocation tracking with user-friendly error codes

-- Create refresh_tokens table if it doesn't exist (for new installations)
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expiry_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP,
    
    -- Grace period fields (prevents race conditions during token rotation)
    grace_period_ends_at TIMESTAMP,
    grace_used BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Revocation tracking
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    revoked_at TIMESTAMP,
    revoke_reason VARCHAR(50),
    revoke_message_code VARCHAR(50),
    
    -- Session/device tracking
    device_info VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent VARCHAR(512),
    session_id VARCHAR(36),
    
    -- Token rotation tracking
    replaced_by_token_hash VARCHAR(64),
    
    -- Theft detection
    theft_detected BOOLEAN NOT NULL DEFAULT FALSE,
    theft_detected_at TIMESTAMP,
    
    -- Migration support
    token_format VARCHAR(20) NOT NULL DEFAULT 'LEGACY',
    
    -- Optimistic locking
    version BIGINT NOT NULL DEFAULT 0
);

-- For existing installations, add new columns if table already exists
-- (These will be no-ops for new installations where table was just created above)

-- Add grace period columns
ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS grace_period_ends_at TIMESTAMP NULL;
ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS grace_used BOOLEAN NOT NULL DEFAULT FALSE;

-- Add revocation message code for user-friendly errors
ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS revoke_message_code VARCHAR(50) NULL;

-- Add token format for migration tracking
ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS token_format VARCHAR(20) NOT NULL DEFAULT 'LEGACY';

-- Add version for optimistic locking
ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;

-- Add theft detection columns if not exists
ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS theft_detected BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS theft_detected_at TIMESTAMP NULL;

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_refresh_token_hash ON refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_token_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_token_session ON refresh_tokens(session_id);
CREATE INDEX IF NOT EXISTS idx_refresh_token_expiry ON refresh_tokens(expiry_date);
CREATE INDEX IF NOT EXISTS idx_refresh_token_last_used ON refresh_tokens(last_used_at);
CREATE INDEX IF NOT EXISTS idx_refresh_token_grace ON refresh_tokens(grace_period_ends_at);
CREATE INDEX IF NOT EXISTS idx_refresh_token_format ON refresh_tokens(token_format);

-- Add comments for documentation
COMMENT ON COLUMN refresh_tokens.token_format IS 'Token format: LEGACY (pre-migration), CURRENT (SHA-256 with grace period)';
COMMENT ON COLUMN refresh_tokens.revoke_message_code IS 'Frontend error code: SESSION_LIMIT_EXCEEDED, SECURITY_THEFT_DETECTED, etc.';
COMMENT ON COLUMN refresh_tokens.grace_period_ends_at IS 'Grace period end time for token rotation (prevents race conditions)';
COMMENT ON COLUMN refresh_tokens.grace_used IS 'Whether grace period has been consumed (atomic flag)';

-- ============ USERS TABLE UPDATES ============

-- Add token versioning columns to users table (with defaults for existing data)
ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_password_change_at TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_role_change_at TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS enabled BOOLEAN NOT NULL DEFAULT true;

-- Add comments
COMMENT ON COLUMN users.token_version IS 'Token version for bulk invalidation (incremented on password/role change)';
COMMENT ON COLUMN users.enabled IS 'Account enabled flag';
