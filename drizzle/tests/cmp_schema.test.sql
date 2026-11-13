-- Package 1 acceptance tests for the consent-platform schema.
-- Run by scripts/test-cmp-db.sh against a throwaway database. Any failed check ends the run with an error.
--
-- Every refusal names the cause it expects. A statement that is refused for any other reason,
-- or that raises any unexpected error, FAILS the check:
--   'rows0'   the statement runs and changes no rows (row-level security filtered them out)
--   'priv'    SQLSTATE 42501, "permission denied"            (no table or column privilege)
--   'rls'     SQLSTATE 42501, "row-level security"           (a WITH CHECK policy refused the row)
--   'rule'    SQLSTATE 42501, message starting "cmp:"        (an integrity trigger of this schema)
--   'check'   SQLSTATE 23514, message not starting "cmp:"    (a CHECK constraint)
--   'evidence' SQLSTATE 23514, message starting "cmp:"       (a receipt does not match its config)
--   'fk'      SQLSTATE 23503                                 (a foreign key)
--   'unique'  SQLSTATE 23505                                 (a unique index)
\set QUIET 1
\o /dev/null

CREATE SCHEMA t;
CREATE TABLE t.results (n serial PRIMARY KEY, label text NOT NULL, ok boolean NOT NULL, expected text, detail text);
GRANT USAGE ON SCHEMA t TO PUBLIC;
GRANT ALL ON ALL TABLES IN SCHEMA t TO PUBLIC;
GRANT ALL ON ALL SEQUENCES IN SCHEMA t TO PUBLIC;

CREATE FUNCTION t.ok(label text, cond boolean, detail text DEFAULT NULL) RETURNS void LANGUAGE sql AS
  $$ INSERT INTO t.results (label, ok, expected, detail) VALUES (label, COALESCE(cond, false), 'true', detail) $$;

CREATE FUNCTION t.refused(label text, stmt text, how text) RETURNS void LANGUAGE plpgsql AS $$
DECLARE n bigint; state text; msg text; got text; pass boolean;
BEGIN
  IF how NOT IN ('rows0','priv','rls','rule','check','evidence','fk','unique') THEN
    RAISE EXCEPTION 'test error: unknown expectation %', how;
  END IF;
  BEGIN
    EXECUTE stmt; GET DIAGNOSTICS n = ROW_COUNT;
    got := n || ' row(s) affected';
    pass := (how = 'rows0' AND n = 0);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS state = RETURNED_SQLSTATE, msg = MESSAGE_TEXT;
    got := state || ': ' || msg;
    pass := CASE how
      WHEN 'priv'   THEN state = '42501' AND msg LIKE 'permission denied%'
      WHEN 'rls'    THEN state = '42501' AND msg LIKE '%row-level security%'
      WHEN 'rule'   THEN state = '42501' AND msg LIKE 'cmp:%'
      WHEN 'check'  THEN state = '23514' AND msg NOT LIKE 'cmp:%'
      WHEN 'evidence' THEN state = '23514' AND msg LIKE 'cmp:%'
      WHEN 'fk'     THEN state = '23503'
      WHEN 'unique' THEN state = '23505'
      ELSE false END;
  END;
  INSERT INTO t.results (label, ok, expected, detail) VALUES (label, pass, how, got);
END $$;

-- Passes only when the statement succeeds and changes at least one row.
CREATE FUNCTION t.allowed(label text, stmt text) RETURNS void LANGUAGE plpgsql AS $$
DECLARE n bigint;
BEGIN
  BEGIN
    EXECUTE stmt; GET DIAGNOSTICS n = ROW_COUNT;
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO t.results (label, ok, expected, detail) VALUES (label, false, 'allowed', SQLSTATE || ': ' || SQLERRM); RETURN;
  END;
  INSERT INTO t.results (label, ok, expected, detail) VALUES (label, n > 0, 'allowed', n || ' row(s) affected');
END $$;

CREATE FUNCTION t.n(q text) RETURNS bigint LANGUAGE plpgsql AS $$
DECLARE n bigint; BEGIN EXECUTE 'SELECT count(*) FROM (' || q || ') x' INTO n; RETURN n; END $$;

CREATE FUNCTION t.login(u uuid) RETURNS void LANGUAGE sql AS
  $$ SELECT set_config('request.jwt.claim.sub', COALESCE(u::text, ''), false) $$;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA t TO PUBLIC;

-- The suite must run as the schema owner and that owner must not be a superuser, so that
-- "database owner" checks below prove the triggers under the hosting platform's kind of role.
SELECT t.ok('tests run as a non-superuser schema owner',
  (SELECT NOT rolsuper FROM pg_roles WHERE rolname = current_user)
  AND (SELECT nspowner = (SELECT oid FROM pg_roles WHERE rolname = current_user) FROM pg_namespace WHERE nspname = 'cmp'),
  current_user || ', bypassrls=' || (SELECT rolbypassrls FROM pg_roles WHERE rolname = current_user));
SELECT t.ok('every SECURITY DEFINER function in cmp is owned by the schema owner and pins its search path',
  count(*) > 0 AND bool_and(p.proowner = n.nspowner AND p.proconfig::text LIKE '%search_path=cmp, pg_temp%'),
  count(*) || ' functions: ' || string_agg(p.proname, ', ' ORDER BY p.proname))
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'cmp' AND p.prosecdef;
SELECT t.ok('no request-serving role owns anything in cmp',
  NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'cmp' AND pg_get_userbyid(c.relowner) IN ('anon','authenticated','service_role'))
  AND NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'cmp' AND pg_get_userbyid(p.proowner) IN ('anon','authenticated','service_role')));
SELECT t.ok('row-level security is enabled on every cmp table',
  bool_and(c.relrowsecurity), count(*) || ' tables')
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'cmp' AND c.relkind = 'r';

-- ───────────── 1. Seeds (checked before fixtures change anything) ─────────────

SELECT t.ok('seed: five regulation profiles, all draft', t.n('SELECT 1 FROM cmp.regulation_profiles WHERE status = ''draft''') = 5);
SELECT t.ok('seed: platform vendor catalogue present', t.n('SELECT 1 FROM cmp.vendors WHERE org_id IS NULL') = 6);

-- ───────────── Fixtures: two organisations, each with a site and a full set of rows ─────────────

\set a_owner  '''a0000000-0000-0000-0000-000000000001'''
\set a_editor '''a0000000-0000-0000-0000-000000000002'''
\set a_viewer '''a0000000-0000-0000-0000-000000000003'''
\set b_owner  '''b0000000-0000-0000-0000-000000000001'''
\set b_second '''b0000000-0000-0000-0000-000000000002'''
\set org_a    '''aaaaaaaa-0000-0000-0000-000000000000'''
\set org_b    '''bbbbbbbb-0000-0000-0000-000000000000'''
\set site_a   '''aaaaaaaa-1111-0000-0000-000000000000'''
\set site_b   '''bbbbbbbb-1111-0000-0000-000000000000'''

INSERT INTO auth.users (id) VALUES (:a_owner), (:a_editor), (:a_viewer), (:b_owner), (:b_second);
INSERT INTO cmp.organisations (id, name) VALUES (:org_a, 'Org A'), (:org_b, 'Org B');
INSERT INTO cmp.org_members VALUES (:org_a, :a_owner, 'owner'), (:org_a, :a_editor, 'editor'),
                                   (:org_a, :a_viewer, 'viewer'), (:org_b, :b_owner, 'owner');
INSERT INTO cmp.signing_keys (key_id, purpose, public_key) VALUES
  ('cfg-test', 'config', 'pk'), ('chk-test', 'checkpoint', 'pk'), ('cfg-old', 'config', 'pk');

-- Rules that must hold before a site or config can exist at all.
SELECT t.refused('a site cannot name an unknown regulation profile',
  format('INSERT INTO cmp.sites (org_id, name, default_profile, retention_days) VALUES (%L, ''x'', ''no-such-profile'', 365)', :org_a), 'rule');
INSERT INTO cmp.sites (id, org_id, name, default_profile, retention_days) VALUES
  (:site_a, :org_a, 'Site A', 'in-dpdp', 365), (:site_b, :org_b, 'Site B', 'in-dpdp', 365);
SELECT cmp.seed_standard_purposes(:site_a), cmp.seed_standard_purposes(:site_b);
SELECT t.ok('seed: four standard purposes per site', t.n('SELECT 1 FROM cmp.purposes WHERE site_id = ' || quote_literal(:site_a)) = 4);

CREATE TABLE t.cfg_insert AS SELECT
  'INSERT INTO cmp.config_versions (org_id, site_id, version, snapshot, content_hash, signature, signing_key_id, profile_id, notice_version, change_impact, published_by) VALUES (%L, %L, %s, ''{}'', repeat(''0'', 64), ''sig'', %L, (SELECT id FROM cmp.regulation_profiles WHERE key = %L AND version = 1), ''v1'', ''none'', gen_random_uuid())'::text AS q;
GRANT SELECT ON t.cfg_insert TO PUBLIC;

SELECT t.refused('a config cannot be published while every profile is still a draft',
  format(q, :org_a, :site_a, 9, 'cfg-test', 'in-dpdp'), 'rule') FROM t.cfg_insert;

-- Profile approval rules, then approve the profile the fixtures use.
SELECT t.refused('a profile cannot be approved without a named reviewer',
  'UPDATE cmp.regulation_profiles SET status = ''approved'' WHERE key = ''in-dpdp''', 'check');
SELECT t.refused('a profile cannot be approved with a blank reviewer',
  'UPDATE cmp.regulation_profiles SET status = ''approved'', reviewed_by = ''   '', reviewed_at = current_date WHERE key = ''in-dpdp''', 'check');
SELECT t.allowed('a profile can be approved with reviewer and date',
  'UPDATE cmp.regulation_profiles SET status = ''approved'', reviewed_by = ''Test counsel'', reviewed_at = current_date WHERE key = ''in-dpdp''');

UPDATE cmp.regulation_profiles SET status = 'approved', reviewed_by = 'Test counsel', reviewed_at = current_date WHERE key = 'uk';
SELECT t.refused('a config cannot use an approved profile that is not the site''s default',
  format(q, :org_a, :site_a, 9, 'cfg-test', 'uk'), 'rule') FROM t.cfg_insert;
SELECT t.refused('a config cannot be published under a draft profile',
  format(q, :org_a, :site_a, 9, 'cfg-test', 'eu-gdpr'), 'rule') FROM t.cfg_insert;
SELECT t.refused('a config cannot be signed with a checkpoint key',
  format(q, :org_a, :site_a, 9, 'chk-test', 'in-dpdp'), 'rule') FROM t.cfg_insert;
UPDATE cmp.signing_keys SET retired_at = now() WHERE key_id = 'cfg-old';
SELECT t.refused('a config cannot be signed with a retired key',
  format(q, :org_a, :site_a, 9, 'cfg-old', 'in-dpdp'), 'rule') FROM t.cfg_insert;

DO $$
DECLARE o record; cfg uuid; seg uuid; tech uuid; rid uuid;
        prof uuid := (SELECT id FROM cmp.regulation_profiles WHERE key = 'in-dpdp');
        z text := repeat('0', 64);
BEGIN
  FOR o IN SELECT s.id AS site, s.org_id AS org FROM cmp.sites s LOOP
    INSERT INTO cmp.site_domains (org_id, site_id, hostname, method) VALUES (o.org, o.site, 'www-' || left(o.org::text, 4) || '.example', 'dns_txt');
    INSERT INTO cmp.vendors (org_id, name) VALUES (o.org, 'Own vendor');
    INSERT INTO cmp.technologies (org_id, site_id, name, type, party) VALUES (o.org, o.site, '_ga', 'cookie', 'third') RETURNING id INTO tech;
    INSERT INTO cmp.technology_purposes SELECT tech, p.id, o.org FROM cmp.purposes p WHERE p.site_id = o.site AND p.key = 'analytics';
    INSERT INTO cmp.translations VALUES (o.org, o.site, 'en', 'banner.title', 'Your privacy', true);
    INSERT INTO cmp.config_versions (org_id, site_id, version, snapshot, content_hash, signature, signing_key_id, profile_id, notice_version, change_impact, published_by)
      VALUES (o.org, o.site, 1, '{}', z, 'sig', 'cfg-test', prof, 'v1', 'none', gen_random_uuid()) RETURNING id INTO cfg;
    rid := gen_random_uuid();
    INSERT INTO cmp.receipts (receipt_id, org_id, site_id, visitor_id, action, purposes, config_version_id, profile_id, config_hash, notice_version, canonical)
      VALUES (rid, o.org, o.site, gen_random_uuid(), 'given', '[]', cfg, prof, z, 'v1', '{}');
    INSERT INTO cmp.ledger_segments (org_id, site_id, segment_no, first_seq, last_seq, receipt_count, segment_hash, prev_segment_hash)
      VALUES (o.org, o.site, 1, 1, 1, 1, z, z) RETURNING id INTO seg;
    INSERT INTO cmp.receipt_seals (receipt_id, org_id, site_id, segment_id, seq, prev_hash, hash) VALUES (rid, o.org, o.site, seg, 1, z, z);
    INSERT INTO cmp.receipt_flags (receipt_id, org_id, site_id, reason) VALUES (rid, o.org, o.site, 'test');
    INSERT INTO cmp.checkpoints (org_id, site_id, segment_id, segment_hash, last_seq, signing_key_id, signature) VALUES (o.org, o.site, seg, z, 1, 'chk-test', 'sig');
    INSERT INTO cmp.violation_reports (org_id, site_id, day, category, pattern, sample_rate) VALUES (o.org, o.site, current_date, 'observed', 'cdn.example', 0.05);
  END LOOP;
END $$;

CREATE TABLE t.ids AS SELECT
  (SELECT id FROM cmp.purposes WHERE site_id = :site_b AND key = 'analytics') AS b_purpose,
  (SELECT id FROM cmp.vendors WHERE org_id = :org_b) AS b_vendor,
  (SELECT id FROM cmp.technologies WHERE site_id = :site_a AND name = '_ga') AS a_tech,
  (SELECT id FROM cmp.config_versions WHERE site_id = :site_a AND version = 1) AS a_cfg,
  (SELECT id FROM cmp.config_versions WHERE site_id = :site_b AND version = 1) AS b_cfg,
  (SELECT id FROM cmp.ledger_segments WHERE site_id = :site_a) AS a_seg,
  (SELECT id FROM cmp.ledger_segments WHERE site_id = :site_b) AS b_seg,
  (SELECT receipt_id FROM cmp.receipts WHERE site_id = :site_a) AS a_receipt,
  (SELECT id FROM cmp.purposes WHERE site_id = :site_a AND key = 'analytics') AS a_purpose,
  (SELECT id FROM cmp.purposes WHERE site_id = :site_a AND key = 'preferences') AS a_pref,
  (SELECT id FROM cmp.technologies WHERE site_id = :site_b) AS b_tech,
  (SELECT id FROM cmp.regulation_profiles WHERE key = 'in-dpdp' AND version = 1) AS dpdp,
  (SELECT id FROM cmp.regulation_profiles WHERE key = 'uk' AND version = 1) AS uk,
  repeat('0', 64) AS z;
GRANT SELECT ON t.ids TO PUBLIC;

-- A receipt insert in which every value is individually valid; tests change exactly one thing.
-- Arguments: receipt id, organisation, site, config, profile, config hash, notice version.
CREATE TABLE t.rcpt AS SELECT
  'INSERT INTO cmp.receipts (receipt_id, org_id, site_id, visitor_id, action, purposes, config_version_id, profile_id, config_hash, notice_version, canonical) VALUES (%L, %L, %L, gen_random_uuid(), ''given'', ''[]'', %L, %L, %L, %L, ''{}'')'::text AS q;
GRANT SELECT ON t.rcpt TO PUBLIC;

-- ───────────── 2. Visitors (anon) have no access at all ─────────────

SET ROLE anon;
SELECT t.refused('anon cannot read cmp.' || tablename, format('SELECT 1 FROM cmp.%I', tablename), 'priv')
  FROM pg_tables WHERE schemaname = 'cmp' ORDER BY tablename;
SELECT t.refused('anon cannot write cmp.organisations', 'INSERT INTO cmp.organisations (name) VALUES (''x'')', 'priv');
SELECT t.refused('anon cannot call cmp.is_member', 'SELECT cmp.is_member(gen_random_uuid())', 'priv');
RESET ROLE;

-- ───────────── 3. Cross-tenant isolation, as viewer, editor and owner ─────────────

CREATE TABLE t.org_tables AS
  SELECT c.table_name::text AS tbl FROM information_schema.columns c
  WHERE c.table_schema = 'cmp' AND c.column_name = 'org_id' AND c.table_name NOT IN ('vendors', 'audit_log');
GRANT SELECT ON t.org_tables TO PUBLIC;

CREATE FUNCTION t.cross_tenant(who text, uid uuid, own_org uuid, other_org uuid, other_site uuid) RETURNS void LANGUAGE plpgsql AS $$
DECLARE r record;
BEGIN
  PERFORM t.login(uid);
  FOR r IN SELECT tbl FROM t.org_tables ORDER BY tbl LOOP
    PERFORM t.ok(format('%s reads no other-tenant rows in %s', who, r.tbl),
                 t.n(format('SELECT 1 FROM cmp.%I WHERE org_id = %L', r.tbl, other_org)) = 0);
    PERFORM t.ok(format('%s reads own rows in %s', who, r.tbl),
                 t.n(format('SELECT 1 FROM cmp.%I WHERE org_id = %L', r.tbl, own_org)) > 0);
    -- Where members hold DELETE at all, row-level security must hide the rows; elsewhere the privilege is absent.
    PERFORM t.refused(format('%s cannot delete other-tenant rows in %s', who, r.tbl),
                      format('DELETE FROM cmp.%I WHERE org_id = %L', r.tbl, other_org),
                      CASE WHEN has_table_privilege(current_user, 'cmp.' || r.tbl, 'DELETE') THEN 'rows0' ELSE 'priv' END);
  END LOOP;
  PERFORM t.ok(who || ' sees only their own organisation', t.n('SELECT 1 FROM cmp.organisations') = 1);
  PERFORM t.ok(who || ' sees only their own sites', t.n('SELECT 1 FROM cmp.sites') = 1);
  PERFORM t.ok(who || ' sees no other-tenant vendors', t.n(format('SELECT 1 FROM cmp.vendors WHERE org_id = %L', other_org)) = 0);
  PERFORM t.ok(who || ' sees the platform vendor catalogue', t.n('SELECT 1 FROM cmp.vendors WHERE org_id IS NULL') = 6);
  PERFORM t.ok(who || ' sees no other-tenant audit entries', t.n(format('SELECT 1 FROM cmp.audit_log WHERE org_id = %L', other_org)) = 0);
  -- writes aimed at the other tenant
  PERFORM t.refused(who || ' cannot rename the other organisation', format('UPDATE cmp.organisations SET name = ''x'' WHERE id = %L', other_org), 'rows0');
  PERFORM t.refused(who || ' cannot join the other organisation', format('INSERT INTO cmp.org_members VALUES (%L, %L, ''owner'')', other_org, uid), 'rls');
  PERFORM t.refused(who || ' cannot edit the other site', format('UPDATE cmp.sites SET name = ''x'' WHERE id = %L', other_site), 'rows0');
  PERFORM t.refused(who || ' cannot add a purpose to the other site', format('INSERT INTO cmp.purposes (org_id, site_id, key, legal_basis) VALUES (%L, %L, ''sneaky'', ''consent'')', other_org, other_site), 'rls');
  PERFORM t.refused(who || ' cannot add a technology to the other site', format('INSERT INTO cmp.technologies (org_id, site_id, name, type, party) VALUES (%L, %L, ''x'', ''cookie'', ''first'')', other_org, other_site), 'rls');
  PERFORM t.refused(who || ' cannot edit other-tenant technologies', format('UPDATE cmp.technologies SET name = ''x'' WHERE org_id = %L', other_org), 'rows0');
  PERFORM t.refused(who || ' cannot add a domain to the other site', format('INSERT INTO cmp.site_domains (org_id, site_id, hostname, method) VALUES (%L, %L, ''evil.example'', ''dns_txt'')', other_org, other_site), 'rls');
  PERFORM t.refused(who || ' cannot add a vendor to the other organisation', format('INSERT INTO cmp.vendors (org_id, name) VALUES (%L, ''x'')', other_org), 'rls');
  PERFORM t.refused(who || ' cannot edit other-tenant translations', format('UPDATE cmp.translations SET value = ''x'' WHERE org_id = %L', other_org), 'rows0');
  -- forged org_id: own organisation claimed, other tenant's site targeted
  PERFORM t.refused(who || ' cannot attach a purpose to the other site with a forged org_id', format('INSERT INTO cmp.purposes (org_id, site_id, key, legal_basis) VALUES (%L, %L, ''forged'', ''consent'')', own_org, other_site), 'rule');
  PERFORM t.refused(who || ' cannot attach a technology to the other site with a forged org_id', format('INSERT INTO cmp.technologies (org_id, site_id, name, type, party) VALUES (%L, %L, ''x'', ''cookie'', ''first'')', own_org, other_site), 'rule');
  PERFORM t.refused(who || ' cannot attach a domain to the other site with a forged org_id', format('INSERT INTO cmp.site_domains (org_id, site_id, hostname, method) VALUES (%L, %L, ''forged.example'', ''dns_txt'')', own_org, other_site), 'rule');
END $$;
GRANT EXECUTE ON FUNCTION t.cross_tenant(text, uuid, uuid, uuid, uuid) TO PUBLIC;

SET ROLE authenticated;
SELECT t.cross_tenant('A viewer', :a_viewer, :org_a, :org_b, :site_b);
SELECT t.cross_tenant('A editor', :a_editor, :org_a, :org_b, :site_b);
SELECT t.cross_tenant('A owner',  :a_owner,  :org_a, :org_b, :site_b);
SELECT t.cross_tenant('B owner',  :b_owner,  :org_b, :org_a, :site_a);

SELECT t.login(:a_editor);
SELECT t.refused('editor cannot map own technology to another tenant''s purpose',
  format('INSERT INTO cmp.technology_purposes VALUES (%L, %L, %L)', a_tech, b_purpose, :org_a), 'rule') FROM t.ids;
SELECT t.refused('editor cannot point own technology at another tenant''s vendor',
  format('UPDATE cmp.technologies SET vendor_id = %L WHERE id = %L', b_vendor, a_tech), 'rule') FROM t.ids;
SELECT t.allowed('editor can point own technology at a platform vendor',
  format('UPDATE cmp.technologies SET vendor_id = (SELECT id FROM cmp.vendors WHERE org_id IS NULL LIMIT 1) WHERE id = %L', a_tech)) FROM t.ids;
SELECT t.refused('editor cannot change a platform vendor', 'UPDATE cmp.vendors SET name = ''x'' WHERE org_id IS NULL', 'rows0');
SELECT t.refused('editor cannot add to the platform catalogue', 'INSERT INTO cmp.vendors (org_id, name) VALUES (NULL, ''x'')', 'rls');

-- ───────────── 4. Roles inside one organisation ─────────────

SELECT t.login(:a_viewer);
SELECT t.refused('viewer cannot add a technology', format('INSERT INTO cmp.technologies (org_id, site_id, name, type, party) VALUES (%L, %L, ''v'', ''cookie'', ''first'')', :org_a, :site_a), 'rls');
SELECT t.refused('viewer cannot edit a purpose', 'UPDATE cmp.purposes SET display_order = 9', 'rows0');
SELECT t.ok('viewer cannot read the audit log', t.n('SELECT 1 FROM cmp.audit_log') = 0);
SELECT t.ok('members read approved regulation profiles only', t.n('SELECT 1 FROM cmp.regulation_profiles') = 2 AND t.n('SELECT 1 FROM cmp.regulation_profiles WHERE status <> ''approved''') = 0);

SELECT t.login(:a_editor);
SELECT t.allowed('editor can add a technology', format('INSERT INTO cmp.technologies (org_id, site_id, name, type, party) VALUES (%L, %L, ''_fbp'', ''cookie'', ''third'')', :org_a, :site_a));
SELECT t.allowed('editor can add a purpose', format('INSERT INTO cmp.purposes (org_id, site_id, key, legal_basis) VALUES (%L, %L, ''chat_support'', ''consent'')', :org_a, :site_a));
SELECT t.refused('editor cannot edit the site', 'UPDATE cmp.sites SET name = ''x''', 'rows0');
SELECT t.refused('editor cannot add members', format('INSERT INTO cmp.org_members VALUES (%L, %L, ''viewer'')', :org_a, :b_owner), 'rls');
SELECT t.refused('editor cannot change a member''s role', 'UPDATE cmp.org_members SET role = ''owner''', 'rows0');
SELECT t.refused('editor cannot mark a purpose as published', 'UPDATE cmp.purposes SET published = true', 'priv');
SELECT t.refused('editor cannot mark a domain as verified', 'UPDATE cmp.site_domains SET verified_at = now()', 'priv');
SELECT t.refused('editor cannot choose a domain token', format('INSERT INTO cmp.site_domains (org_id, site_id, hostname, method, token) VALUES (%L, %L, ''tok.example'', ''dns_txt'', ''mine'')', :org_a, :site_a), 'priv');
SELECT t.ok('editor cannot read the audit log', t.n('SELECT 1 FROM cmp.audit_log') = 0);

SELECT t.login(:a_owner);
SELECT t.allowed('owner can rename the site', 'UPDATE cmp.sites SET name = ''Site A renamed''');
SELECT t.refused('owner cannot change the site key', 'UPDATE cmp.sites SET site_key = ''pk_live_mine''', 'priv');
SELECT t.refused('owner cannot set the live config', format('UPDATE cmp.sites SET live_config_id = %L', (SELECT a_cfg FROM t.ids)), 'priv');
SELECT t.refused('owner cannot create a site directly', format('INSERT INTO cmp.sites (org_id, name, default_profile, retention_days) VALUES (%L, ''x'', ''in-dpdp'', 365)', :org_a), 'priv');
SELECT t.refused('owner cannot create an organisation', 'INSERT INTO cmp.organisations (name) VALUES (''x'')', 'priv');
SELECT t.refused('owner cannot point the site at an unknown profile', 'UPDATE cmp.sites SET default_profile = ''no-such-profile''', 'rule');
SELECT t.refused('owner cannot edit a regulation profile', 'UPDATE cmp.regulation_profiles SET name = ''x''', 'priv');
SELECT t.refused('owner cannot retire a signing key', 'UPDATE cmp.signing_keys SET retired_at = now()', 'priv');
SELECT t.ok('owner reads own audit entries', t.n('SELECT 1 FROM cmp.audit_log') > 0);
SELECT t.ok('audit records the acting member', t.n(format('SELECT 1 FROM cmp.audit_log WHERE entity = ''technologies'' AND action = ''insert'' AND actor = %L', :a_editor)) = 1);

-- Members can never write published config or evidence: the privilege itself is absent.
SELECT t.refused('owner cannot insert into ' || x, format('INSERT INTO cmp.%I DEFAULT VALUES', x), 'priv')
  FROM unnest(ARRAY['config_versions','receipts','receipt_seals','receipt_flags','ledger_segments','checkpoints','audit_log','violation_reports','regulation_profiles','signing_keys']) x;
SELECT t.refused('owner cannot update ' || x, format('UPDATE cmp.%I SET org_id = org_id', x), 'priv')
  FROM unnest(ARRAY['config_versions','receipts','receipt_seals','receipt_flags','ledger_segments','checkpoints','violation_reports']) x;
SELECT t.refused('owner cannot delete from ' || x, format('DELETE FROM cmp.%I', x), 'priv')
  FROM unnest(ARRAY['config_versions','receipts','receipt_seals','receipt_flags','ledger_segments','checkpoints','audit_log','violation_reports','regulation_profiles','signing_keys']) x;

-- ───────────── 5. An organisation always keeps an owner ─────────────

SELECT t.refused('the only owner cannot demote themselves', format('UPDATE cmp.org_members SET role = ''editor'' WHERE user_id = %L', :a_owner), 'rule');
SELECT t.refused('the only owner cannot remove themselves', format('DELETE FROM cmp.org_members WHERE user_id = %L', :a_owner), 'rule');
SELECT t.allowed('an owner can promote a second owner', format('UPDATE cmp.org_members SET role = ''owner'' WHERE user_id = %L', :a_editor));
SELECT t.allowed('ownership can be transferred: the first owner steps down', format('UPDATE cmp.org_members SET role = ''editor'' WHERE user_id = %L', :a_owner));
SELECT t.login(:a_editor);
SELECT t.refused('the remaining owner cannot then be removed', format('DELETE FROM cmp.org_members WHERE user_id = %L', :a_editor), 'rule');
SELECT t.allowed('a non-owner member can be removed', format('DELETE FROM cmp.org_members WHERE user_id = %L', :a_viewer));
SELECT t.ok('organisation A still has exactly one owner', t.n(format('SELECT 1 FROM cmp.org_members WHERE org_id = %L AND role = ''owner''', :org_a)) = 1);
RESET ROLE;
SELECT t.login(NULL);

-- An owner removal under a snapshot isolation level cannot see concurrent removals, so it is refused.
INSERT INTO cmp.org_members VALUES (:org_b, :b_second, 'owner');
BEGIN ISOLATION LEVEL REPEATABLE READ;
SELECT t.refused('owner removal is refused outside READ COMMITTED', format('DELETE FROM cmp.org_members WHERE user_id = %L', :b_second), 'rule');
COMMIT;
SELECT t.refused('deleting the account of a sole owner is refused', format('DELETE FROM auth.users WHERE id = %L', :a_editor), 'rule');

-- ───────────── 6. Evidence is immutable for the service role and for the database owner ─────────────

SET ROLE service_role;
SELECT t.refused('service role cannot update ' || x, format('UPDATE cmp.%I SET org_id = org_id', x), 'priv')
  FROM unnest(ARRAY['receipts','receipt_seals','receipt_flags','config_versions','checkpoints','audit_log','ledger_segments']) x;
SELECT t.refused('service role cannot delete from ' || x, format('DELETE FROM cmp.%I', x), 'priv')
  FROM unnest(ARRAY['receipts','receipt_seals','receipt_flags','config_versions','checkpoints','audit_log','ledger_segments']) x;
SELECT set_config('cmp.retention_purge', 'on', false);
SELECT t.refused('service role cannot delete receipts even with the retention flag set', 'DELETE FROM cmp.receipts', 'priv');
SELECT set_config('cmp.retention_purge', '', false);
SELECT t.refused('service role cannot edit an approved profile', 'UPDATE cmp.regulation_profiles SET rules = ''{}'' WHERE key = ''in-dpdp''', 'rule');
SELECT t.refused('service role cannot delete a signing key', 'DELETE FROM cmp.signing_keys WHERE key_id = ''chk-test''', 'rule');
RESET ROLE;

-- As the database owner: privileges do not apply, so these prove the triggers themselves.
SELECT t.refused('trigger refuses update on ' || x, format('UPDATE cmp.%I SET org_id = org_id', x), 'rule')
  FROM unnest(ARRAY['receipts','receipt_seals','receipt_flags','config_versions','checkpoints','audit_log']) x;
SELECT t.refused('trigger refuses delete on ' || x, format('DELETE FROM cmp.%I', x), 'rule')
  FROM unnest(ARRAY['receipts','receipt_seals','receipt_flags','config_versions','checkpoints','audit_log','ledger_segments']) x;
SELECT t.refused('a sealed segment''s hash cannot change', 'UPDATE cmp.ledger_segments SET segment_hash = repeat(''1'', 64)', 'rule');
SELECT t.refused('a segment cannot be marked purged and altered together', 'UPDATE cmp.ledger_segments SET purged_at = now(), receipt_count = 0', 'rule');

-- ───────────── 7. Evidence stays inside one site and organisation ─────────────
-- Each statement uses identifiers that are individually valid, so only the cross-site link is wrong.

SELECT t.refused('a Site A receipt cannot name Site B''s config',
  format(r.q, gen_random_uuid(), :org_a, :site_a, i.b_cfg, i.dpdp, i.z, 'v1'), 'fk') FROM t.ids i, t.rcpt r;
SELECT t.refused('a receipt cannot carry a profile other than its config''s',
  format(r.q, gen_random_uuid(), :org_a, :site_a, i.a_cfg, i.uk, i.z, 'v1'), 'fk') FROM t.ids i, t.rcpt r;
SELECT t.refused('a receipt naming a config must carry a profile',
  format(r.q, gen_random_uuid(), :org_a, :site_a, i.a_cfg, NULL, i.z, 'v1'), 'check') FROM t.ids i, t.rcpt r;
SELECT t.refused('a receipt cannot carry a hash other than its config''s',
  format(r.q, gen_random_uuid(), :org_a, :site_a, i.a_cfg, i.dpdp, repeat('1', 64), 'v1'), 'evidence') FROM t.ids i, t.rcpt r;
SELECT t.refused('a receipt naming a config cannot omit the hash',
  format(r.q, gen_random_uuid(), :org_a, :site_a, i.a_cfg, i.dpdp, NULL, 'v1'), 'evidence') FROM t.ids i, t.rcpt r;
SELECT t.refused('a receipt cannot carry a notice version other than its config''s',
  format(r.q, gen_random_uuid(), :org_a, :site_a, i.a_cfg, i.dpdp, i.z, 'v2'), 'evidence') FROM t.ids i, t.rcpt r;
SELECT t.allowed('a receipt matching its config in site, profile, hash and notice version is accepted',
  format(r.q, 'aaaaaaaa-2222-0000-0000-000000000000', :org_a, :site_a, i.a_cfg, i.dpdp, i.z, 'v1')) FROM t.ids i, t.rcpt r;
SELECT t.allowed('a migrated record with provenance and no config is accepted',
  format('INSERT INTO cmp.receipts (receipt_id, org_id, site_id, visitor_id, action, purposes, provenance, canonical) VALUES (gen_random_uuid(), %L, %L, gen_random_uuid(), ''migrated'', ''[]'', ''{"source":"legacy banner","original_time":"2026-11-01T10:00:00Z","migrated_at":"2026-12-01T00:00:00Z"}'', ''{}'')', :org_a, :site_a));
SELECT t.refused('a Site A receipt cannot be sealed into Site B''s segment',
  format('INSERT INTO cmp.receipt_seals (receipt_id, org_id, site_id, segment_id, seq, prev_hash, hash) VALUES (''aaaaaaaa-2222-0000-0000-000000000000'', %L, %L, %L, 2, %L, %L)', :org_a, :site_a, b_seg, z, z), 'fk') FROM t.ids;
SELECT t.refused('a Site A receipt cannot be sealed under Site B''s identity',
  format('INSERT INTO cmp.receipt_seals (receipt_id, org_id, site_id, segment_id, seq, prev_hash, hash) VALUES (''aaaaaaaa-2222-0000-0000-000000000000'', %L, %L, %L, 2, %L, %L)', :org_b, :site_b, b_seg, z, z), 'fk') FROM t.ids;
SELECT t.allowed('a Site A receipt can be sealed into Site A''s segment',
  format('INSERT INTO cmp.receipt_seals (receipt_id, org_id, site_id, segment_id, seq, prev_hash, hash) VALUES (''aaaaaaaa-2222-0000-0000-000000000000'', %L, %L, %L, 2, %L, %L)', :org_a, :site_a, a_seg, z, z)) FROM t.ids;
SELECT t.refused('a Site A checkpoint cannot cover Site B''s segment',
  format('INSERT INTO cmp.checkpoints (org_id, site_id, segment_id, segment_hash, last_seq, signing_key_id, signature) VALUES (%L, %L, %L, %L, 1, ''chk-test'', ''sig'')', :org_a, :site_a, b_seg, z), 'fk') FROM t.ids;
SELECT t.refused('a checkpoint cannot be signed with a config key',
  format('INSERT INTO cmp.checkpoints (org_id, site_id, segment_id, segment_hash, last_seq, signing_key_id, signature) VALUES (%L, %L, %L, %L, 1, ''cfg-test'', ''sig'')', :org_a, :site_a, a_seg, z), 'rule') FROM t.ids;
SELECT t.refused('a flag cannot point at a receipt that does not exist',
  format('INSERT INTO cmp.receipt_flags (receipt_id, org_id, site_id, reason) VALUES (gen_random_uuid(), %L, %L, ''x'')', :org_a, :site_a), 'fk');
SELECT t.refused('a Site B flag cannot point at a Site A receipt',
  format('INSERT INTO cmp.receipt_flags (receipt_id, org_id, site_id, reason) VALUES (%L, %L, %L, ''x'')', a_receipt, :org_b, :site_b), 'fk') FROM t.ids;
SELECT t.refused('a config cannot supersede another site''s config',
  format('INSERT INTO cmp.config_versions (org_id, site_id, version, snapshot, content_hash, signature, signing_key_id, profile_id, notice_version, change_impact, published_by, supersedes_id) VALUES (%L, %L, 2, ''{}'', %L, ''sig'', ''cfg-test'', (SELECT id FROM cmp.regulation_profiles WHERE key = ''in-dpdp''), ''v1'', ''none'', gen_random_uuid(), %L)', :org_a, :site_a, z, b_cfg), 'fk') FROM t.ids;
SELECT t.refused('a receipt cannot claim another organisation''s site',
  format(r.q, gen_random_uuid(), :org_b, :site_a, i.a_cfg, i.dpdp, i.z, 'v1'), 'rule') FROM t.ids i, t.rcpt r;
SELECT t.refused('a migrated receipt must carry provenance', format('INSERT INTO cmp.receipts (receipt_id, org_id, site_id, visitor_id, action, purposes, canonical) VALUES (gen_random_uuid(), %L, %L, gen_random_uuid(), ''migrated'', ''[]'', ''{}'')', :org_a, :site_a), 'check');
SELECT t.refused('a captured receipt must name its config', format('INSERT INTO cmp.receipts (receipt_id, org_id, site_id, visitor_id, action, purposes, canonical) VALUES (gen_random_uuid(), %L, %L, gen_random_uuid(), ''given'', ''[]'', ''{}'')', :org_a, :site_a), 'check');
SELECT t.refused('a violation count cannot be negative', format('INSERT INTO cmp.violation_reports (org_id, site_id, day, category, pattern, occurrences, sample_rate) VALUES (%L, %L, current_date, ''observed'', ''neg.example'', -1, 0.05)', :org_a, :site_a), 'check');

-- Violation reports can only name a technology of their own site and organisation.
INSERT INTO cmp.sites (id, org_id, name, default_profile, retention_days) VALUES ('aaaaaaaa-3333-0000-0000-000000000000', :org_a, 'Site A2', 'in-dpdp', 365);
INSERT INTO cmp.technologies (id, org_id, site_id, name, type, party) VALUES
  ('aaaaaaaa-4444-0000-0000-000000000000', :org_a, 'aaaaaaaa-3333-0000-0000-000000000000', 'a2 tech', 'cookie', 'first'),
  ('aaaaaaaa-5555-0000-0000-000000000000', :org_a, :site_a, 'short lived', 'cookie', 'first');
CREATE TABLE t.vr AS SELECT
  'INSERT INTO cmp.violation_reports (org_id, site_id, day, category, technology_id, pattern, sample_rate) VALUES (%L, %L, current_date, ''potential_violation'', %L, %L, 0.05)'::text AS q;
SELECT t.refused('a report cannot name a technology of another site in the same organisation',
  format(v.q, :org_a, :site_a, 'aaaaaaaa-4444-0000-0000-000000000000', 'x1'), 'fk') FROM t.vr v;
SELECT t.refused('a report cannot name a technology of another organisation',
  format(v.q, :org_a, :site_a, i.b_tech, 'x2'), 'fk') FROM t.vr v, t.ids i;
SELECT t.allowed('a report can name a technology of its own site',
  format(v.q, :org_a, :site_a, 'aaaaaaaa-5555-0000-0000-000000000000', 'del.example')) FROM t.vr v;
SELECT t.allowed('a technology named by a report can be deleted', 'DELETE FROM cmp.technologies WHERE id = ''aaaaaaaa-5555-0000-0000-000000000000''');
SELECT t.ok('deleting the technology clears only technology_id; the report keeps its site and organisation',
  t.n(format('SELECT 1 FROM cmp.violation_reports WHERE pattern = ''del.example'' AND technology_id IS NULL AND site_id = %L AND org_id = %L', :site_a, :org_a)) = 1);

-- An inventory row cannot change site or organisation; ordinary edits still work. Run as a member.
SET ROLE authenticated;
SELECT t.login(:a_editor);
SELECT t.refused('a member cannot move a technology to another site of the same organisation',
  format('UPDATE cmp.technologies SET site_id = ''aaaaaaaa-3333-0000-0000-000000000000'' WHERE id = %L', a_tech), 'rule') FROM t.ids;
SELECT t.refused('a member cannot move a technology to another organisation',
  format('UPDATE cmp.technologies SET org_id = %L WHERE id = %L', :org_b, a_tech), 'rule') FROM t.ids;
SELECT t.allowed('a member can still edit a technology''s name, vendor and match patterns',
  format('UPDATE cmp.technologies SET name = ''_ga (renamed)'', vendor_id = (SELECT id FROM cmp.vendors WHERE org_id IS NULL ORDER BY name LIMIT 1), match_patterns = ARRAY[''cookie:_ga*''] WHERE id = %L', a_tech)) FROM t.ids;
SELECT t.refused('a member cannot move a translation to another site',
  format('UPDATE cmp.translations SET site_id = ''aaaaaaaa-3333-0000-0000-000000000000'' WHERE site_id = %L', :site_a), 'rule');
RESET ROLE;
SELECT t.login(NULL);
SELECT t.refused('a technology''s site cannot change even for the database owner',
  format('UPDATE cmp.technologies SET site_id = ''aaaaaaaa-3333-0000-0000-000000000000'' WHERE id = %L', a_tech), 'rule') FROM t.ids;
SELECT t.refused('a purpose cannot move to another site',
  format('UPDATE cmp.purposes SET site_id = ''aaaaaaaa-3333-0000-0000-000000000000'' WHERE site_id = %L AND key = ''marketing''', :site_a), 'rule');
SELECT t.refused('a domain cannot move to another site',
  format('UPDATE cmp.site_domains SET site_id = ''aaaaaaaa-3333-0000-0000-000000000000'' WHERE site_id = %L', :site_a), 'rule');
SELECT t.refused('an organisation''s vendor cannot move to another organisation',
  format('UPDATE cmp.vendors SET org_id = %L WHERE org_id = %L', :org_b, :org_a), 'rule');

-- ───────────── 8. Retention path: whole segment, flag set, then the segment is marked purged once ─────────────

BEGIN;
SELECT set_config('cmp.retention_purge', 'on', true);
SELECT t.allowed('retention routine can remove a segment''s receipts', format('DELETE FROM cmp.receipts WHERE site_id = %L', :site_b));
COMMIT;
SELECT t.ok('the retention flag does not outlive its transaction', COALESCE(current_setting('cmp.retention_purge', true), '') = '');
SELECT t.ok('seals are removed with their receipts', t.n(format('SELECT 1 FROM cmp.receipt_seals WHERE site_id = %L', :site_b)) = 0);
SELECT t.ok('flags are removed with their receipts', t.n(format('SELECT 1 FROM cmp.receipt_flags WHERE site_id = %L', :site_b)) = 0);
SELECT t.allowed('a segment can be marked purged', format('UPDATE cmp.ledger_segments SET purged_at = now() WHERE site_id = %L', :site_b));
SELECT t.refused('a purged segment cannot be changed again', format('UPDATE cmp.ledger_segments SET purged_at = now() WHERE site_id = %L', :site_b), 'rule');
SELECT t.ok('the segment record survives the purge', t.n(format('SELECT 1 FROM cmp.ledger_segments WHERE site_id = %L AND purged_at IS NOT NULL', :site_b)) = 1);
SELECT t.ok('the checkpoint survives the purge', t.n(format('SELECT 1 FROM cmp.checkpoints WHERE site_id = %L', :site_b)) = 1);

-- ───────────── 9. Purposes, site guard, profiles, keys ─────────────

UPDATE cmp.purposes SET published = true WHERE id = (SELECT a_purpose FROM t.ids);
SELECT t.refused('a published purpose''s key cannot change', format('UPDATE cmp.purposes SET key = ''renamed'' WHERE id = %L', (SELECT a_purpose FROM t.ids)), 'rule');
SELECT t.refused('a published purpose cannot be unpublished', format('UPDATE cmp.purposes SET published = false WHERE id = %L', (SELECT a_purpose FROM t.ids)), 'rule');
DELETE FROM cmp.technology_purposes WHERE purpose_id = (SELECT a_purpose FROM t.ids);
SELECT t.refused('a published purpose cannot be deleted', format('DELETE FROM cmp.purposes WHERE id = %L', (SELECT a_purpose FROM t.ids)), 'rule');
SELECT t.allowed('a published purpose can be retired', format('UPDATE cmp.purposes SET retired_at = now() WHERE id = %L', (SELECT a_purpose FROM t.ids)));
SELECT t.allowed('an unpublished purpose can be deleted', format('DELETE FROM cmp.purposes WHERE id = %L', (SELECT a_pref FROM t.ids)));
SELECT t.refused('a required purpose cannot rest on consent', format('INSERT INTO cmp.purposes (org_id, site_id, key, required, legal_basis) VALUES (%L, %L, ''bad_basis'', true, ''consent'')', :org_a, :site_a), 'check');

SELECT t.refused('the live config cannot move outside publishing', format('UPDATE cmp.sites SET live_config_id = %L WHERE id = %L', (SELECT a_cfg FROM t.ids), :site_a), 'rule');
BEGIN;
SELECT set_config('cmp.publishing', 'on', true);
SELECT t.refused('the live config cannot be another site''s config', format('UPDATE cmp.sites SET live_config_id = %L WHERE id = %L', (SELECT b_cfg FROM t.ids), :site_a), 'rule');
SELECT t.allowed('publishing can set the site''s own config live', format('UPDATE cmp.sites SET live_config_id = %L WHERE id = %L', (SELECT a_cfg FROM t.ids), :site_a));
COMMIT;
SELECT t.ok('the publishing flag does not outlive its transaction', COALESCE(current_setting('cmp.publishing', true), '') = '');
SELECT t.refused('the site key cannot change outside rotation', format('UPDATE cmp.sites SET site_key = ''pk_live_x'' WHERE id = %L', :site_a), 'rule');
SELECT t.refused('a site cannot move to another organisation', format('UPDATE cmp.sites SET org_id = %L WHERE id = %L', :org_b, :site_a), 'rule');

UPDATE cmp.site_domains SET verified_at = now() WHERE site_id = :site_a;
INSERT INTO cmp.site_domains (org_id, site_id, hostname, method) SELECT :org_b, :site_b, hostname, 'dns_txt' FROM cmp.site_domains WHERE site_id = :site_a;
SELECT t.refused('a verified hostname cannot be verified by a second site',
  format('UPDATE cmp.site_domains SET verified_at = now() WHERE site_id = %L AND hostname = (SELECT hostname FROM cmp.site_domains WHERE site_id = %L)', :site_b, :site_a), 'unique');

-- The config's profile is the site's fallback profile: it must be a version of the site's default.
UPDATE cmp.sites SET default_profile = 'eu-gdpr' WHERE id = :site_b;
SELECT t.refused('a config cannot be published under a profile other than the site''s default',
  format(q, :org_b, :site_b, 9, 'cfg-test', 'in-dpdp'), 'rule') FROM t.cfg_insert;
UPDATE cmp.sites SET default_profile = 'in-dpdp' WHERE id = :site_b;
SELECT t.allowed('the same config publishes once it matches the site''s default profile',
  format(q, :org_b, :site_b, 9, 'cfg-test', 'in-dpdp')) FROM t.cfg_insert;

-- Approved profiles are frozen; a change of substance is a new version.
SELECT t.refused('an approved profile''s ' || col || ' cannot be changed', format('UPDATE cmp.regulation_profiles SET %s WHERE key = ''in-dpdp'' AND version = 1', expr), 'rule')
  FROM (VALUES ('rules', 'rules = ''{"consent_model":"notice"}'''), ('sources', 'sources = ''[]'''),
               ('effective date', 'effective_from = DATE ''2020-01-01'''), ('name', 'name = ''x'''),
               ('reviewer', 'reviewed_by = ''Someone else'''), ('key', 'key = ''other'''), ('version number', 'version = 7')) v(col, expr);
SELECT t.refused('an approved profile cannot return to draft', 'UPDATE cmp.regulation_profiles SET status = ''draft'' WHERE key = ''in-dpdp'' AND version = 1', 'rule');
SELECT t.refused('an approved profile cannot be deleted', 'DELETE FROM cmp.regulation_profiles WHERE key = ''in-dpdp'' AND version = 1', 'rule');
SELECT t.allowed('a new version of a profile can be created',
  'INSERT INTO cmp.regulation_profiles (key, version, name, rules, effective_from) SELECT key, 2, name, rules || ''{"expiry_days":180}'', DATE ''2028-01-01'' FROM cmp.regulation_profiles WHERE key = ''in-dpdp'' AND version = 1');
SELECT t.allowed('a draft version can be edited', 'UPDATE cmp.regulation_profiles SET name = ''India DPDP (revised)'' WHERE key = ''in-dpdp'' AND version = 2');
SELECT t.allowed('the new version can be approved', 'UPDATE cmp.regulation_profiles SET status = ''approved'', reviewed_by = ''Test counsel'', reviewed_at = current_date WHERE key = ''in-dpdp'' AND version = 2');
SELECT t.ok('the approved first version is unchanged by the new version',
  t.n('SELECT 1 FROM cmp.regulation_profiles WHERE key = ''in-dpdp'' AND version = 1 AND (rules->>''expiry_days'')::int = 365 AND name = ''India DPDP''') = 1);
SELECT t.allowed('an approved profile can be retired', 'UPDATE cmp.regulation_profiles SET status = ''retired'', effective_until = DATE ''2028-01-01'' WHERE key = ''in-dpdp'' AND version = 1');
SELECT t.refused('a retired profile cannot be changed', 'UPDATE cmp.regulation_profiles SET status = ''approved'' WHERE key = ''in-dpdp'' AND version = 1', 'rule');
SELECT t.refused('a retired profile cannot be deleted', 'DELETE FROM cmp.regulation_profiles WHERE key = ''in-dpdp'' AND version = 1', 'rule');
SELECT t.allowed('a draft profile can be deleted', 'DELETE FROM cmp.regulation_profiles WHERE key = ''notice-only''');
SELECT t.refused('a config cannot be published under a retired profile', format(q, :org_a, :site_a, 9, 'cfg-test', 'in-dpdp'), 'rule') FROM t.cfg_insert;

SELECT t.refused('a signing key''s public key cannot change', 'UPDATE cmp.signing_keys SET public_key = ''other'' WHERE key_id = ''cfg-test''', 'rule');
SELECT t.refused('a signing key''s purpose cannot change', 'UPDATE cmp.signing_keys SET purpose = ''checkpoint'' WHERE key_id = ''cfg-test''', 'rule');
SELECT t.refused('a retired signing key cannot be brought back', 'UPDATE cmp.signing_keys SET retired_at = NULL WHERE key_id = ''cfg-old''', 'rule');
SELECT t.refused('a signing key cannot be deleted', 'DELETE FROM cmp.signing_keys WHERE key_id = ''cfg-old''', 'rule');

-- ───────────── Result ─────────────

\o
\set QUIET 0
\pset tuples_only on
\pset format unaligned
SELECT 'FAIL: ' || label || ' [expected ' || expected || ', got ' || COALESCE(detail, 'false') || ']' FROM t.results WHERE NOT ok ORDER BY n;
SELECT (SELECT count(*) FROM t.results WHERE ok) || ' passed, ' || (SELECT count(*) FROM t.results WHERE NOT ok) || ' failed';
\if :{?results_file}
  \o :results_file
  SELECT n || E'\t' || CASE WHEN ok THEN 'PASS' ELSE 'FAIL' END || E'\t' || label || E'\t' || 'expected: ' || expected || E'\t' || COALESCE(detail, '') FROM t.results ORDER BY n;
  \o
\endif
-- A failed check must stop the run with an error. (psql's \quit does not set an exit status.)
DO $$
DECLARE f bigint := (SELECT count(*) FROM t.results WHERE NOT ok);
BEGIN
  IF f > 0 THEN RAISE EXCEPTION 'cmp schema tests failed: % check(s)', f; END IF;
END $$;
SET client_min_messages = warning;
DROP SCHEMA t CASCADE;
