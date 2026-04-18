-- V3__seed_admin_user.sql
-- Seed admin user for initial access to admin panel

INSERT INTO users (id, email, password, first_name, last_name, role, created_at, token_version, enabled)
VALUES (
  gen_random_uuid(),
  'admin@vyanix.in',
  '$2b$12$zFqFC4tsCpRu5J0y8Bu//eeifzMlrrO2pZW9vMD8kFdTKYSWzzht6',
  'Admin', 'Vyanix', 'ADMIN', NOW(), 1, true
) ON CONFLICT (email) DO NOTHING;