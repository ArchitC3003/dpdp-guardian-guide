-- Reverses drizzle/migrations/0015_cmp_schema.sql. Nothing outside the cmp schema is touched.
SET client_min_messages = warning;
DROP SCHEMA cmp CASCADE;
RESET client_min_messages;
