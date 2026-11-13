-- Stand-ins for what the hosting platform provides, so migrations can be tested on plain Postgres.
-- Run as a superuser. Roles mirror the platform's: the migration owner is NOT a superuser, and
-- service_role bypasses row-level security natively. The runner switches platform_owner between
-- BYPASSRLS (as on the hosting platform) and NOBYPASSRLS to show the schema needs neither.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN CREATE ROLE service_role NOLOGIN BYPASSRLS; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'platform_owner') THEN
    CREATE ROLE platform_owner LOGIN NOSUPERUSER CREATEROLE;
    GRANT anon, authenticated, service_role TO platform_owner;
  END IF;
END $$;
GRANT CREATE ON DATABASE :"DBNAME" TO platform_owner;
CREATE SCHEMA auth;
CREATE TABLE auth.users (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
  $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role, platform_owner;
GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated, service_role, platform_owner;
GRANT ALL ON auth.users TO platform_owner;
