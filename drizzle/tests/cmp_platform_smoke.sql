-- Platform smoke test for the cmp schema: plain SQL, no psql features, so it can be run through
-- any SQL console on the hosting platform as the migration role. It exercises the SECURITY DEFINER
-- functions (membership helper, integrity, audit and ownership triggers) under the platform's real
-- anon, authenticated and service_role roles. Run on a freshly migrated, empty cmp schema.
-- Returns one row per check: n, outcome, check, expected, actual. Leaves its rows in place;
-- reverse the migration (and delete the five c0... users) to clean up.

CREATE SCHEMA IF NOT EXISTS cmp_stage;
GRANT USAGE ON SCHEMA cmp_stage TO anon, authenticated, service_role;
DROP TABLE IF EXISTS cmp_stage.results;
CREATE TABLE cmp_stage.results (n serial PRIMARY KEY, label text, ok boolean, expected text, actual text);
GRANT ALL ON cmp_stage.results TO anon, authenticated, service_role;
GRANT ALL ON SEQUENCE cmp_stage.results_n_seq TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION cmp_stage.chk(label text, stmt text, how text) RETURNS void LANGUAGE plpgsql AS $$
DECLARE n bigint; state text; msg text; got text; pass boolean;
BEGIN
  BEGIN
    EXECUTE stmt; GET DIAGNOSTICS n = ROW_COUNT;
    got := n || ' row(s)';
    pass := (how = 'rows0' AND n = 0) OR (how = 'allowed' AND n > 0);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS state = RETURNED_SQLSTATE, msg = MESSAGE_TEXT;
    got := state || ': ' || msg;
    pass := CASE how
      WHEN 'priv'     THEN state = '42501' AND msg LIKE 'permission denied%'
      WHEN 'rls'      THEN state = '42501' AND msg LIKE '%row-level security%'
      WHEN 'rule'     THEN state = '42501' AND msg LIKE 'cmp:%'
      WHEN 'evidence' THEN state = '23514' AND msg LIKE 'cmp:%'
      WHEN 'fk'       THEN state = '23503'
      ELSE false END;
  END;
  INSERT INTO cmp_stage.results (label, ok, expected, actual) VALUES (label, pass, how, got);
END $$;
CREATE OR REPLACE FUNCTION cmp_stage.ok(label text, cond boolean, actual text DEFAULT NULL) RETURNS void LANGUAGE sql AS
  $$ INSERT INTO cmp_stage.results (label, ok, expected, actual) VALUES (label, COALESCE(cond, false), 'true', actual) $$;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA cmp_stage TO anon, authenticated, service_role;

-- Fixtures: two organisations, one site each, one config and one receipt each.
INSERT INTO auth.users (id) VALUES
  ('c0000000-0000-0000-0000-00000000a001'), ('c0000000-0000-0000-0000-00000000a002'), ('c0000000-0000-0000-0000-00000000b001');
INSERT INTO cmp.organisations (id, name) VALUES
  ('c0000000-aaaa-0000-0000-000000000000', 'Stage A'), ('c0000000-bbbb-0000-0000-000000000000', 'Stage B');
INSERT INTO cmp.org_members VALUES
  ('c0000000-aaaa-0000-0000-000000000000', 'c0000000-0000-0000-0000-00000000a001', 'owner'),
  ('c0000000-aaaa-0000-0000-000000000000', 'c0000000-0000-0000-0000-00000000a002', 'viewer'),
  ('c0000000-bbbb-0000-0000-000000000000', 'c0000000-0000-0000-0000-00000000b001', 'owner');
UPDATE cmp.regulation_profiles SET status = 'approved', reviewed_by = 'Staging check', reviewed_at = current_date WHERE key = 'in-dpdp' AND version = 1;
INSERT INTO cmp.sites (id, org_id, name, default_profile, retention_days) VALUES
  ('c0000000-aaaa-1111-0000-000000000000', 'c0000000-aaaa-0000-0000-000000000000', 'Stage site A', 'in-dpdp', 365),
  ('c0000000-bbbb-1111-0000-000000000000', 'c0000000-bbbb-0000-0000-000000000000', 'Stage site B', 'in-dpdp', 365);
SELECT cmp.seed_standard_purposes(id) FROM cmp.sites;
INSERT INTO cmp.signing_keys (key_id, purpose, public_key) VALUES ('stage-cfg', 'config', 'pk');
INSERT INTO cmp.technologies (id, org_id, site_id, name, type, party) VALUES
  ('c0000000-aaaa-2222-0000-000000000000', 'c0000000-aaaa-0000-0000-000000000000', 'c0000000-aaaa-1111-0000-000000000000', '_ga', 'cookie', 'third');
INSERT INTO cmp.config_versions (id, org_id, site_id, version, snapshot, content_hash, signature, signing_key_id, profile_id, notice_version, change_impact, published_by)
  SELECT x.id, s.org_id, s.id, 1, '{}', repeat('0', 64), 'sig', 'stage-cfg', p.id, 'v1', 'none', gen_random_uuid()
  FROM cmp.sites s
  JOIN (VALUES ('c0000000-aaaa-1111-0000-000000000000'::uuid, 'c0000000-aaaa-3333-0000-000000000000'::uuid),
               ('c0000000-bbbb-1111-0000-000000000000'::uuid, 'c0000000-bbbb-3333-0000-000000000000'::uuid)) x(site, id) ON x.site = s.id
  CROSS JOIN (SELECT id FROM cmp.regulation_profiles WHERE key = 'in-dpdp' AND version = 1) p;
INSERT INTO cmp.receipts (receipt_id, org_id, site_id, visitor_id, action, purposes, config_version_id, profile_id, config_hash, notice_version, canonical)
  SELECT gen_random_uuid(), c.org_id, c.site_id, gen_random_uuid(), 'given', '[]', c.id, c.profile_id, c.content_hash, c.notice_version, '{}'
  FROM cmp.config_versions c;

-- Who owns what, as seen on this platform.
SELECT cmp_stage.ok('migration role is not a superuser', NOT rolsuper, rolname || ': bypassrls=' || rolbypassrls) FROM pg_roles WHERE rolname = current_user;
SELECT cmp_stage.ok('every SECURITY DEFINER function in cmp is owned by the schema owner with a pinned search path',
  count(*) > 0 AND bool_and(p.proowner = n.nspowner AND p.proconfig::text LIKE '%search_path=cmp, pg_temp%'),
  count(*) || ' functions owned by ' || string_agg(DISTINCT pg_get_userbyid(p.proowner), ','))
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'cmp' AND p.prosecdef;
SELECT cmp_stage.ok('no request-serving role owns a cmp table or function',
  NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'cmp' AND pg_get_userbyid(c.relowner) IN ('anon','authenticated','service_role','authenticator'))
  AND NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'cmp' AND pg_get_userbyid(p.proowner) IN ('anon','authenticated','service_role','authenticator')));
SELECT cmp_stage.ok('anon has no privilege on the cmp schema', NOT has_schema_privilege('anon', 'cmp', 'USAGE'));

-- anon
SET ROLE anon;
SELECT cmp_stage.chk('anon cannot read receipts', 'SELECT 1 FROM cmp.receipts', 'priv');
SELECT cmp_stage.chk('anon cannot call the membership helper', 'SELECT cmp.is_member(gen_random_uuid())', 'priv');
RESET ROLE;

-- authenticated, as the viewer of organisation A
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'c0000000-0000-0000-0000-00000000a002', false);
SELECT set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-00000000a002","role":"authenticated"}', false);
SELECT cmp_stage.ok('auth.uid() resolves to the signed-in member', auth.uid() = 'c0000000-0000-0000-0000-00000000a002', auth.uid()::text);
SELECT cmp_stage.ok('membership helper: true for own organisation, false for the other',
  cmp.is_member('c0000000-aaaa-0000-0000-000000000000') AND NOT cmp.is_member('c0000000-bbbb-0000-0000-000000000000')
  AND NOT cmp.is_member('c0000000-aaaa-0000-0000-000000000000', 'editor'));
SELECT cmp_stage.ok('viewer sees exactly their own organisation, site, config and receipt',
  (SELECT count(*) FROM cmp.organisations) = 1 AND (SELECT count(*) FROM cmp.sites) = 1
  AND (SELECT count(*) FROM cmp.config_versions) = 1 AND (SELECT count(*) FROM cmp.receipts) = 1
  AND (SELECT count(*) FROM cmp.receipts WHERE org_id = 'c0000000-bbbb-0000-0000-000000000000') = 0);
SELECT cmp_stage.chk('viewer cannot add a technology', $q$INSERT INTO cmp.technologies (org_id, site_id, name, type, party) VALUES ('c0000000-aaaa-0000-0000-000000000000', 'c0000000-aaaa-1111-0000-000000000000', 'x', 'cookie', 'first')$q$, 'rls');

-- authenticated, as the owner of organisation A
SELECT set_config('request.jwt.claim.sub', 'c0000000-0000-0000-0000-00000000a001', false);
SELECT set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-00000000a001","role":"authenticated"}', false);
SELECT cmp_stage.chk('owner can rename own site', $q$UPDATE cmp.sites SET name = 'Stage site A renamed' WHERE id = 'c0000000-aaaa-1111-0000-000000000000'$q$, 'allowed');
SELECT cmp_stage.chk('owner cannot edit the other tenant''s site', $q$UPDATE cmp.sites SET name = 'x' WHERE id = 'c0000000-bbbb-1111-0000-000000000000'$q$, 'rows0');
SELECT cmp_stage.chk('owner cannot change the site key', $q$UPDATE cmp.sites SET site_key = 'pk_live_mine'$q$, 'priv');
SELECT cmp_stage.chk('owner cannot attach a purpose to the other site with a forged org_id', $q$INSERT INTO cmp.purposes (org_id, site_id, key, legal_basis) VALUES ('c0000000-aaaa-0000-0000-000000000000', 'c0000000-bbbb-1111-0000-000000000000', 'forged', 'consent')$q$, 'rule');
SELECT cmp_stage.chk('owner cannot add a purpose to the other tenant', $q$INSERT INTO cmp.purposes (org_id, site_id, key, legal_basis) VALUES ('c0000000-bbbb-0000-0000-000000000000', 'c0000000-bbbb-1111-0000-000000000000', 'sneaky', 'consent')$q$, 'rls');
SELECT cmp_stage.chk('owner can add a technology (audit trigger runs)', $q$INSERT INTO cmp.technologies (org_id, site_id, name, type, party) VALUES ('c0000000-aaaa-0000-0000-000000000000', 'c0000000-aaaa-1111-0000-000000000000', '_fbp', 'cookie', 'third')$q$, 'allowed');
SELECT cmp_stage.ok('owner reads the audit entry naming them as actor',
  (SELECT count(*) FROM cmp.audit_log WHERE entity = 'technologies' AND actor = 'c0000000-0000-0000-0000-00000000a001') = 1);
SELECT cmp_stage.chk('owner cannot move a technology to another organisation', $q$UPDATE cmp.technologies SET org_id = 'c0000000-bbbb-0000-0000-000000000000' WHERE id = 'c0000000-aaaa-2222-0000-000000000000'$q$, 'rule');
SELECT cmp_stage.chk('the only owner cannot demote themselves', $q$UPDATE cmp.org_members SET role = 'editor' WHERE user_id = 'c0000000-0000-0000-0000-00000000a001'$q$, 'rule');
SELECT cmp_stage.chk('owner cannot insert a receipt', 'INSERT INTO cmp.receipts DEFAULT VALUES', 'priv');
SELECT set_config('request.jwt.claim.sub', '', false);
SELECT set_config('request.jwt.claims', '', false);
RESET ROLE;

-- service_role
SET ROLE service_role;
SELECT cmp_stage.chk('service role cannot update a receipt', 'UPDATE cmp.receipts SET org_id = org_id', 'priv');
SELECT cmp_stage.chk('service role cannot delete a receipt', 'DELETE FROM cmp.receipts', 'priv');
SELECT cmp_stage.chk('service role cannot edit an approved profile', $q$UPDATE cmp.regulation_profiles SET rules = '{}' WHERE key = 'in-dpdp'$q$, 'rule');
SELECT cmp_stage.chk('service role can insert a receipt that matches its config', $q$INSERT INTO cmp.receipts (receipt_id, org_id, site_id, visitor_id, action, purposes, config_version_id, profile_id, config_hash, notice_version, canonical) SELECT gen_random_uuid(), c.org_id, c.site_id, gen_random_uuid(), 'given', '[]', c.id, c.profile_id, c.content_hash, c.notice_version, '{}' FROM cmp.config_versions c WHERE c.id = 'c0000000-aaaa-3333-0000-000000000000'$q$, 'allowed');
SELECT cmp_stage.chk('service role cannot insert a receipt with the wrong hash', $q$INSERT INTO cmp.receipts (receipt_id, org_id, site_id, visitor_id, action, purposes, config_version_id, profile_id, config_hash, notice_version, canonical) SELECT gen_random_uuid(), c.org_id, c.site_id, gen_random_uuid(), 'given', '[]', c.id, c.profile_id, repeat('1', 64), c.notice_version, '{}' FROM cmp.config_versions c WHERE c.id = 'c0000000-aaaa-3333-0000-000000000000'$q$, 'evidence');
SELECT cmp_stage.chk('service role cannot link a Site A receipt to Site B''s config', $q$INSERT INTO cmp.receipts (receipt_id, org_id, site_id, visitor_id, action, purposes, config_version_id, profile_id, config_hash, notice_version, canonical) SELECT gen_random_uuid(), 'c0000000-aaaa-0000-0000-000000000000', 'c0000000-aaaa-1111-0000-000000000000', gen_random_uuid(), 'given', '[]', c.id, c.profile_id, c.content_hash, c.notice_version, '{}' FROM cmp.config_versions c WHERE c.id = 'c0000000-bbbb-3333-0000-000000000000'$q$, 'fk');
RESET ROLE;

-- the migration role itself: privileges do not apply, so this proves the trigger
SELECT cmp_stage.chk('the migration role cannot update a receipt', 'UPDATE cmp.receipts SET org_id = org_id', 'rule');
SELECT cmp_stage.chk('the migration role cannot delete a receipt outside retention', 'DELETE FROM cmp.receipts', 'rule');

SELECT n, CASE WHEN ok THEN 'PASS' ELSE 'FAIL' END AS outcome, label, expected, actual FROM cmp_stage.results ORDER BY n;
