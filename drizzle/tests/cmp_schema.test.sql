-- Package 1 acceptance tests for the consent-platform schema.
-- Run by scripts/test-cmp-db.sh against a throwaway database. Fails the run on any failed check.
\set QUIET 1
\o /dev/null

CREATE SCHEMA t;
CREATE TABLE t.results (n serial PRIMARY KEY, label text NOT NULL, ok boolean NOT NULL, detail text);
GRANT USAGE ON SCHEMA t TO PUBLIC;
GRANT ALL ON ALL TABLES IN SCHEMA t TO PUBLIC;
GRANT ALL ON ALL SEQUENCES IN SCHEMA t TO PUBLIC;

CREATE FUNCTION t.ok(label text, cond boolean, detail text DEFAULT NULL) RETURNS void LANGUAGE sql AS
  $$ INSERT INTO t.results (label, ok, detail) VALUES (label, COALESCE(cond, false), detail) $$;

-- Passes when the statement is refused: it raises, or it changes no rows.
CREATE FUNCTION t.blocked(label text, stmt text) RETURNS void LANGUAGE plpgsql AS $$
DECLARE n bigint;
BEGIN
  BEGIN
    EXECUTE stmt; GET DIAGNOSTICS n = ROW_COUNT;
  EXCEPTION WHEN OTHERS THEN
    PERFORM t.ok(label, true, SQLERRM); RETURN;
  END;
  PERFORM t.ok(label, n = 0, n || ' row(s) affected');
END $$;

-- Passes when the statement succeeds and changes at least one row.
CREATE FUNCTION t.allowed(label text, stmt text) RETURNS void LANGUAGE plpgsql AS $$
DECLARE n bigint;
BEGIN
  BEGIN
    EXECUTE stmt; GET DIAGNOSTICS n = ROW_COUNT;
  EXCEPTION WHEN OTHERS THEN
    PERFORM t.ok(label, false, SQLERRM); RETURN;
  END;
  PERFORM t.ok(label, n > 0, n || ' row(s) affected');
END $$;

CREATE FUNCTION t.n(q text) RETURNS bigint LANGUAGE plpgsql AS $$
DECLARE n bigint; BEGIN EXECUTE 'SELECT count(*) FROM (' || q || ') x' INTO n; RETURN n; END $$;

CREATE FUNCTION t.login(u uuid) RETURNS void LANGUAGE sql AS
  $$ SELECT set_config('request.jwt.claim.sub', COALESCE(u::text, ''), false) $$;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA t TO PUBLIC;

-- ───────────── Fixtures: two organisations, each with a site and a full set of rows ─────────────

\set a_owner  '''a0000000-0000-0000-0000-000000000001'''
\set a_editor '''a0000000-0000-0000-0000-000000000002'''
\set a_viewer '''a0000000-0000-0000-0000-000000000003'''
\set b_owner  '''b0000000-0000-0000-0000-000000000001'''
\set org_a    '''aaaaaaaa-0000-0000-0000-000000000000'''
\set org_b    '''bbbbbbbb-0000-0000-0000-000000000000'''
\set site_a   '''aaaaaaaa-1111-0000-0000-000000000000'''
\set site_b   '''bbbbbbbb-1111-0000-0000-000000000000'''
\set h '''0000000000000000000000000000000000000000000000000000000000000000'''

INSERT INTO auth.users (id) VALUES (:a_owner), (:a_editor), (:a_viewer), (:b_owner);
INSERT INTO cmp.organisations (id, name) VALUES (:org_a, 'Org A'), (:org_b, 'Org B');
INSERT INTO cmp.org_members VALUES (:org_a, :a_owner, 'owner'), (:org_a, :a_editor, 'editor'),
                                   (:org_a, :a_viewer, 'viewer'), (:org_b, :b_owner, 'owner');
INSERT INTO cmp.sites (id, org_id, name, default_profile, retention_days) VALUES
  (:site_a, :org_a, 'Site A', 'in-dpdp', 365), (:site_b, :org_b, 'Site B', 'in-dpdp', 365);
SELECT cmp.seed_standard_purposes(:site_a), cmp.seed_standard_purposes(:site_b);
INSERT INTO cmp.signing_keys (key_id, purpose, public_key) VALUES ('cfg-test', 'config', 'pk'), ('chk-test', 'checkpoint', 'pk');

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
    INSERT INTO cmp.receipts (receipt_id, org_id, site_id, visitor_id, action, purposes, config_version_id, canonical)
      VALUES (rid, o.org, o.site, gen_random_uuid(), 'given', '[]', cfg, '{}');
    INSERT INTO cmp.ledger_segments (org_id, site_id, segment_no, first_seq, last_seq, receipt_count, segment_hash, prev_segment_hash)
      VALUES (o.org, o.site, 1, 1, 1, 1, z, z) RETURNING id INTO seg;
    INSERT INTO cmp.receipt_seals VALUES (rid, o.org, o.site, seg, 1, z, z);
    INSERT INTO cmp.receipt_flags (receipt_id, org_id, site_id, reason) VALUES (rid, o.org, o.site, 'test');
    INSERT INTO cmp.checkpoints (org_id, site_id, segment_id, segment_hash, last_seq, signing_key_id, signature) VALUES (o.org, o.site, seg, z, 1, 'chk-test', 'sig');
    INSERT INTO cmp.violation_reports (org_id, site_id, day, category, pattern, sample_rate) VALUES (o.org, o.site, current_date, 'observed', 'cdn.example', 0.05);
  END LOOP;
END $$;

-- ───────────── 1. Seeds ─────────────

SELECT t.ok('seed: five regulation profiles, all draft', t.n('SELECT 1 FROM cmp.regulation_profiles WHERE status = ''draft''') = 5);
SELECT t.ok('seed: platform vendor catalogue present', t.n('SELECT 1 FROM cmp.vendors WHERE org_id IS NULL') = 6);
SELECT t.ok('seed: four standard purposes per site', t.n('SELECT 1 FROM cmp.purposes WHERE site_id = ' || quote_literal(:site_a)) = 4);

-- ───────────── 2. Visitors (anon) have no access at all ─────────────

SET ROLE anon;
SELECT t.blocked('anon cannot read cmp.' || tablename, format('SELECT 1 FROM cmp.%I', tablename))
  FROM pg_tables WHERE schemaname = 'cmp' ORDER BY tablename;
SELECT t.blocked('anon cannot write cmp.organisations', 'INSERT INTO cmp.organisations (name) VALUES (''x'')');
SELECT t.blocked('anon cannot call cmp.is_member', 'SELECT cmp.is_member(gen_random_uuid())');
RESET ROLE;

-- ───────────── 3. Cross-tenant isolation, as viewer, editor and owner of organisation A ─────────────

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
    PERFORM t.blocked(format('%s cannot delete other-tenant rows in %s', who, r.tbl),
                      format('DELETE FROM cmp.%I WHERE org_id = %L', r.tbl, other_org));
  END LOOP;
  PERFORM t.ok(who || ' sees only their own organisation', t.n('SELECT 1 FROM cmp.organisations') = 1);
  PERFORM t.ok(who || ' sees only their own sites', t.n('SELECT 1 FROM cmp.sites') = 1);
  PERFORM t.ok(who || ' sees no other-tenant vendors', t.n(format('SELECT 1 FROM cmp.vendors WHERE org_id = %L', other_org)) = 0);
  PERFORM t.ok(who || ' sees the platform vendor catalogue', t.n('SELECT 1 FROM cmp.vendors WHERE org_id IS NULL') = 6);
  PERFORM t.ok(who || ' sees no other-tenant audit entries', t.n(format('SELECT 1 FROM cmp.audit_log WHERE org_id = %L', other_org)) = 0);
  -- writes aimed at the other tenant
  PERFORM t.blocked(who || ' cannot rename the other organisation', format('UPDATE cmp.organisations SET name = ''x'' WHERE id = %L', other_org));
  PERFORM t.blocked(who || ' cannot join the other organisation', format('INSERT INTO cmp.org_members VALUES (%L, %L, ''owner'')', other_org, uid));
  PERFORM t.blocked(who || ' cannot edit the other site', format('UPDATE cmp.sites SET name = ''x'' WHERE id = %L', other_site));
  PERFORM t.blocked(who || ' cannot add a purpose to the other site', format('INSERT INTO cmp.purposes (org_id, site_id, key, legal_basis) VALUES (%L, %L, ''sneaky'', ''consent'')', other_org, other_site));
  PERFORM t.blocked(who || ' cannot add a technology to the other site', format('INSERT INTO cmp.technologies (org_id, site_id, name, type, party) VALUES (%L, %L, ''x'', ''cookie'', ''first'')', other_org, other_site));
  PERFORM t.blocked(who || ' cannot edit other-tenant technologies', format('UPDATE cmp.technologies SET name = ''x'' WHERE org_id = %L', other_org));
  PERFORM t.blocked(who || ' cannot add a domain to the other site', format('INSERT INTO cmp.site_domains (org_id, site_id, hostname, method) VALUES (%L, %L, ''evil.example'', ''dns_txt'')', other_org, other_site));
  PERFORM t.blocked(who || ' cannot add a vendor to the other organisation', format('INSERT INTO cmp.vendors (org_id, name) VALUES (%L, ''x'')', other_org));
  PERFORM t.blocked(who || ' cannot edit other-tenant translations', format('UPDATE cmp.translations SET value = ''x'' WHERE org_id = %L', other_org));
  -- forged org_id: own organisation claimed, other tenant's site targeted
  PERFORM t.blocked(who || ' cannot attach a purpose to the other site with a forged org_id', format('INSERT INTO cmp.purposes (org_id, site_id, key, legal_basis) VALUES (%L, %L, ''forged'', ''consent'')', own_org, other_site));
  PERFORM t.blocked(who || ' cannot attach a technology to the other site with a forged org_id', format('INSERT INTO cmp.technologies (org_id, site_id, name, type, party) VALUES (%L, %L, ''x'', ''cookie'', ''first'')', own_org, other_site));
  PERFORM t.blocked(who || ' cannot attach a domain to the other site with a forged org_id', format('INSERT INTO cmp.site_domains (org_id, site_id, hostname, method) VALUES (%L, %L, ''forged.example'', ''dns_txt'')', own_org, other_site));
END $$;
GRANT EXECUTE ON FUNCTION t.cross_tenant(text, uuid, uuid, uuid, uuid) TO PUBLIC;

SET ROLE authenticated;
SELECT t.cross_tenant('A viewer', :a_viewer, :org_a, :org_b, :site_b);
SELECT t.cross_tenant('A editor', :a_editor, :org_a, :org_b, :site_b);
SELECT t.cross_tenant('A owner',  :a_owner,  :org_a, :org_b, :site_b);
SELECT t.cross_tenant('B owner',  :b_owner,  :org_b, :org_a, :site_a);

RESET ROLE;

-- An editor cannot map their own technology to another tenant's purpose, or use its vendor.
CREATE TABLE t.ids AS SELECT
  (SELECT id FROM cmp.purposes WHERE site_id = :site_b AND key = 'analytics') AS b_purpose,
  (SELECT id FROM cmp.vendors WHERE org_id = :org_b) AS b_vendor,
  (SELECT id FROM cmp.technologies WHERE site_id = :site_a) AS a_tech,
  (SELECT id FROM cmp.config_versions WHERE site_id = :site_a) AS a_cfg,
  (SELECT id FROM cmp.config_versions WHERE site_id = :site_b) AS b_cfg,
  (SELECT id FROM cmp.purposes WHERE site_id = :site_a AND key = 'analytics') AS a_purpose,
  (SELECT id FROM cmp.purposes WHERE site_id = :site_a AND key = 'preferences') AS a_pref;
GRANT SELECT ON t.ids TO PUBLIC;

SET ROLE authenticated;
SELECT t.login(:a_editor);
SELECT t.blocked('editor cannot map own technology to another tenant''s purpose',
  format('INSERT INTO cmp.technology_purposes VALUES (%L, %L, %L)', a_tech, b_purpose, :org_a)) FROM t.ids;
SELECT t.blocked('editor cannot point own technology at another tenant''s vendor',
  format('UPDATE cmp.technologies SET vendor_id = %L WHERE id = %L', b_vendor, a_tech)) FROM t.ids;
SELECT t.allowed('editor can point own technology at a platform vendor',
  format('UPDATE cmp.technologies SET vendor_id = (SELECT id FROM cmp.vendors WHERE org_id IS NULL LIMIT 1) WHERE id = %L', a_tech)) FROM t.ids;
SELECT t.blocked('editor cannot change a platform vendor', 'UPDATE cmp.vendors SET name = ''x'' WHERE org_id IS NULL');
SELECT t.blocked('editor cannot add to the platform catalogue', 'INSERT INTO cmp.vendors (org_id, name) VALUES (NULL, ''x'')');

-- ───────────── 4. Roles inside one organisation ─────────────

SELECT t.login(:a_viewer);
SELECT t.blocked('viewer cannot add a technology', format('INSERT INTO cmp.technologies (org_id, site_id, name, type, party) VALUES (%L, %L, ''v'', ''cookie'', ''first'')', :org_a, :site_a));
SELECT t.blocked('viewer cannot edit a purpose', 'UPDATE cmp.purposes SET display_order = 9');
SELECT t.ok('viewer cannot read the audit log', t.n('SELECT 1 FROM cmp.audit_log') = 0);
SELECT t.ok('members cannot read draft regulation profiles', t.n('SELECT 1 FROM cmp.regulation_profiles') = 0);

SELECT t.login(:a_editor);
SELECT t.allowed('editor can add a technology', format('INSERT INTO cmp.technologies (org_id, site_id, name, type, party) VALUES (%L, %L, ''_fbp'', ''cookie'', ''third'')', :org_a, :site_a));
SELECT t.allowed('editor can add a purpose', format('INSERT INTO cmp.purposes (org_id, site_id, key, legal_basis) VALUES (%L, %L, ''chat_support'', ''consent'')', :org_a, :site_a));
SELECT t.blocked('editor cannot edit the site', 'UPDATE cmp.sites SET name = ''x''');
SELECT t.blocked('editor cannot add members', format('INSERT INTO cmp.org_members VALUES (%L, %L, ''viewer'')', :org_a, :b_owner));
SELECT t.blocked('editor cannot mark a purpose as published', 'UPDATE cmp.purposes SET published = true');
SELECT t.blocked('editor cannot mark a domain as verified', 'UPDATE cmp.site_domains SET verified_at = now()');
SELECT t.blocked('editor cannot choose a domain token', format('INSERT INTO cmp.site_domains (org_id, site_id, hostname, method, token) VALUES (%L, %L, ''tok.example'', ''dns_txt'', ''mine'')', :org_a, :site_a));
SELECT t.ok('editor cannot read the audit log', t.n('SELECT 1 FROM cmp.audit_log') = 0);

SELECT t.login(:a_owner);
SELECT t.allowed('owner can rename the site', 'UPDATE cmp.sites SET name = ''Site A renamed''');
SELECT t.blocked('owner cannot change the site key', 'UPDATE cmp.sites SET site_key = ''pk_live_mine''');
SELECT t.blocked('owner cannot set the live config', format('UPDATE cmp.sites SET live_config_id = %L', (SELECT a_cfg FROM t.ids)));
SELECT t.blocked('owner cannot create a site directly', format('INSERT INTO cmp.sites (org_id, name, default_profile, retention_days) VALUES (%L, ''x'', ''in-dpdp'', 365)', :org_a));
SELECT t.blocked('owner cannot create an organisation', 'INSERT INTO cmp.organisations (name) VALUES (''x'')');
SELECT t.ok('owner reads own audit entries', t.n('SELECT 1 FROM cmp.audit_log') > 0);
SELECT t.ok('audit records the acting member', t.n(format('SELECT 1 FROM cmp.audit_log WHERE entity = ''technologies'' AND action = ''insert'' AND actor = %L', :a_editor)) = 1);

-- Members can never write published config or evidence.
SELECT t.blocked('owner cannot insert into ' || x, format('INSERT INTO cmp.%I DEFAULT VALUES', x))
  FROM unnest(ARRAY['config_versions','receipts','receipt_seals','receipt_flags','ledger_segments','checkpoints','audit_log','violation_reports','regulation_profiles','signing_keys']) x;
SELECT t.blocked('owner cannot update ' || x, format('UPDATE cmp.%I SET org_id = org_id', x))
  FROM unnest(ARRAY['config_versions','receipts','receipt_seals','receipt_flags','ledger_segments','checkpoints','violation_reports']) x;
SELECT t.blocked('owner cannot delete from ' || x, format('DELETE FROM cmp.%I', x))
  FROM unnest(ARRAY['config_versions','receipts','receipt_seals','receipt_flags','ledger_segments','checkpoints','audit_log','violation_reports']) x;
RESET ROLE;
SELECT t.login(NULL);

-- ───────────── 5. Evidence is immutable for the service role and for the database owner ─────────────

SET ROLE service_role;
SELECT t.blocked('service role cannot update ' || x, format('UPDATE cmp.%I SET org_id = org_id', x))
  FROM unnest(ARRAY['receipts','receipt_seals','receipt_flags','config_versions','checkpoints','audit_log','ledger_segments']) x;
SELECT t.blocked('service role cannot delete from ' || x, format('DELETE FROM cmp.%I', x))
  FROM unnest(ARRAY['receipts','receipt_seals','receipt_flags','config_versions','checkpoints','audit_log','ledger_segments']) x;
SELECT set_config('cmp.retention_purge', 'on', false);
SELECT t.blocked('service role cannot delete receipts even with the retention flag set', 'DELETE FROM cmp.receipts');
SELECT set_config('cmp.retention_purge', '', false);
RESET ROLE;

-- As the database owner: privileges do not apply, so these prove the triggers themselves.
SELECT t.blocked('trigger refuses update on ' || x, format('UPDATE cmp.%I SET org_id = org_id', x))
  FROM unnest(ARRAY['receipts','receipt_seals','receipt_flags','config_versions','checkpoints','audit_log']) x;
SELECT t.blocked('trigger refuses delete on ' || x, format('DELETE FROM cmp.%I', x))
  FROM unnest(ARRAY['receipts','receipt_seals','receipt_flags','config_versions','checkpoints','audit_log','ledger_segments']) x;

SELECT t.blocked('a sealed segment''s hash cannot change', 'UPDATE cmp.ledger_segments SET segment_hash = repeat(''1'', 64)');
SELECT t.blocked('a segment cannot be marked purged and altered together', 'UPDATE cmp.ledger_segments SET purged_at = now(), receipt_count = 0');

-- The retention path: whole segment, flag set, then the segment is marked purged once.
BEGIN;
SELECT set_config('cmp.retention_purge', 'on', true);
SELECT t.allowed('retention routine can remove a segment''s receipts', format('DELETE FROM cmp.receipts WHERE site_id = %L', :site_b));
COMMIT;
SELECT t.ok('seals are removed with their receipts', t.n(format('SELECT 1 FROM cmp.receipt_seals WHERE site_id = %L', :site_b)) = 0);
SELECT t.allowed('a segment can be marked purged', format('UPDATE cmp.ledger_segments SET purged_at = now() WHERE site_id = %L', :site_b));
SELECT t.blocked('a purged segment cannot be changed again', format('UPDATE cmp.ledger_segments SET purged_at = now() WHERE site_id = %L', :site_b));
SELECT t.ok('the segment record survives the purge', t.n(format('SELECT 1 FROM cmp.ledger_segments WHERE site_id = %L AND purged_at IS NOT NULL', :site_b)) = 1);

-- ───────────── 6. Purposes, site guard, data rules ─────────────

UPDATE cmp.purposes SET published = true WHERE id = (SELECT a_purpose FROM t.ids);
SELECT t.blocked('a published purpose''s key cannot change', format('UPDATE cmp.purposes SET key = ''renamed'' WHERE id = %L', (SELECT a_purpose FROM t.ids)));
SELECT t.blocked('a published purpose cannot be unpublished', format('UPDATE cmp.purposes SET published = false WHERE id = %L', (SELECT a_purpose FROM t.ids)));
DELETE FROM cmp.technology_purposes WHERE purpose_id = (SELECT a_purpose FROM t.ids);
SELECT t.blocked('a published purpose cannot be deleted', format('DELETE FROM cmp.purposes WHERE id = %L', (SELECT a_purpose FROM t.ids)));
SELECT t.allowed('a published purpose can be retired', format('UPDATE cmp.purposes SET retired_at = now() WHERE id = %L', (SELECT a_purpose FROM t.ids)));
SELECT t.allowed('an unpublished purpose can be deleted', format('DELETE FROM cmp.purposes WHERE id = %L', (SELECT a_pref FROM t.ids)));
SELECT t.blocked('a required purpose cannot rest on consent', format('INSERT INTO cmp.purposes (org_id, site_id, key, required, legal_basis) VALUES (%L, %L, ''bad_basis'', true, ''consent'')', :org_a, :site_a));

SELECT t.blocked('the live config cannot move outside publishing', format('UPDATE cmp.sites SET live_config_id = %L WHERE id = %L', (SELECT a_cfg FROM t.ids), :site_a));
SELECT set_config('cmp.publishing', 'on', false);
SELECT t.blocked('the live config cannot be another site''s config', format('UPDATE cmp.sites SET live_config_id = %L WHERE id = %L', (SELECT b_cfg FROM t.ids), :site_a));
SELECT t.allowed('publishing can set the site''s own config live', format('UPDATE cmp.sites SET live_config_id = %L WHERE id = %L', (SELECT a_cfg FROM t.ids), :site_a));
SELECT set_config('cmp.publishing', '', false);
SELECT t.blocked('the site key cannot change outside rotation', format('UPDATE cmp.sites SET site_key = ''pk_live_x'' WHERE id = %L', :site_a));
SELECT t.blocked('a site cannot move to another organisation', format('UPDATE cmp.sites SET org_id = %L WHERE id = %L', :org_b, :site_a));

UPDATE cmp.site_domains SET verified_at = now() WHERE site_id = :site_a;
SELECT t.blocked('a verified hostname cannot be verified by a second site', format(
  'WITH d AS (INSERT INTO cmp.site_domains (org_id, site_id, hostname, method) SELECT %L, %L, hostname, ''dns_txt'' FROM cmp.site_domains WHERE site_id = %L RETURNING id)
   UPDATE cmp.site_domains SET verified_at = now() WHERE id IN (SELECT id FROM d)', :org_b, :site_b, :site_a));

SELECT t.blocked('a profile cannot be approved without a named reviewer', 'UPDATE cmp.regulation_profiles SET status = ''approved'' WHERE key = ''in-dpdp''');
SELECT t.allowed('a profile can be approved with reviewer and date', 'UPDATE cmp.regulation_profiles SET status = ''approved'', reviewed_by = ''Counsel'', reviewed_at = current_date WHERE key = ''in-dpdp''');
SET ROLE authenticated;
SELECT t.login(:a_viewer);
SELECT t.ok('members read approved profiles only', t.n('SELECT 1 FROM cmp.regulation_profiles') = 1);
RESET ROLE;

SELECT t.blocked('a migrated receipt must carry provenance', format('INSERT INTO cmp.receipts (receipt_id, org_id, site_id, visitor_id, action, purposes, canonical) VALUES (gen_random_uuid(), %L, %L, gen_random_uuid(), ''migrated'', ''[]'', ''{}'')', :org_a, :site_a));
SELECT t.blocked('a captured receipt must name its config', format('INSERT INTO cmp.receipts (receipt_id, org_id, site_id, visitor_id, action, purposes, canonical) VALUES (gen_random_uuid(), %L, %L, gen_random_uuid(), ''given'', ''[]'', ''{}'')', :org_a, :site_a));
SELECT t.blocked('a receipt cannot claim another organisation''s site', format('INSERT INTO cmp.receipts (receipt_id, org_id, site_id, visitor_id, action, purposes, config_version_id, canonical) VALUES (gen_random_uuid(), %L, %L, gen_random_uuid(), ''given'', ''[]'', %L, ''{}'')', :org_b, :site_a, (SELECT a_cfg FROM t.ids)));

-- ───────────── Result ─────────────

-- A refusal only counts if it came from a rule, not from a mistake in the test itself.
SELECT t.ok('no check passed for the wrong reason', count(*) = 0, string_agg(label || ' => ' || detail, '; '))
  FROM t.results WHERE detail ~* 'syntax error|does not exist|null value|invalid input|violates not-null|violates foreign key';

\o
\set QUIET 0
\pset tuples_only on
SELECT 'FAIL: ' || label || COALESCE(' (' || detail || ')', '') FROM t.results WHERE NOT ok ORDER BY n;
SELECT (SELECT count(*) FROM t.results WHERE ok) || ' passed, ' || (SELECT count(*) FROM t.results WHERE NOT ok) || ' failed';
SELECT count(*) = 0 AS all_passed FROM t.results WHERE NOT ok \gset
\if :all_passed
\else
  \echo 'cmp schema tests failed'
  \quit 1
\endif
SET client_min_messages = warning;
DROP SCHEMA t CASCADE;
