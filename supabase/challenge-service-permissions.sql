-- The server-only challenge RPC checks account eligibility using these five columns.
-- No browser role receives access, and emails/password hashes are not granted.
GRANT SELECT (id, deleted_at, is_anonymous, email_confirmed_at, banned_until) ON auth.users TO service_role;