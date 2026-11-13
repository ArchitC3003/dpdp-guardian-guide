-- Consent platform, package 1: schema, isolation and integrity rules.
-- Everything lives in its own schema so the module stays portable. Visitors (anon)
-- have no access at all; they reach the platform only through server functions.
-- Reverse with drizzle/rollback/0015_cmp_schema.down.sql.

CREATE SCHEMA cmp;
REVOKE ALL ON SCHEMA cmp FROM PUBLIC;
REVOKE ALL ON SCHEMA cmp FROM anon;
GRANT USAGE ON SCHEMA cmp TO authenticated, service_role;

-- ───────────────────────── Tenancy and sites ─────────────────────────

CREATE TABLE cmp.organisations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 200),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE cmp.org_members (
  org_id   uuid NOT NULL REFERENCES cmp.organisations(id),
  user_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role     text NOT NULL CHECK (role IN ('owner','editor','viewer')),
  PRIMARY KEY (org_id, user_id)
);
CREATE INDEX org_members_user ON cmp.org_members (user_id);

CREATE TABLE cmp.sites (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            uuid NOT NULL REFERENCES cmp.organisations(id),
  name              text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 200),
  site_key          text NOT NULL UNIQUE DEFAULT ('pk_live_' || replace(gen_random_uuid()::text, '-', '')),
  default_profile   text NOT NULL,
  default_language  text NOT NULL DEFAULT 'en',
  identity_mode     text NOT NULL DEFAULT 'browser' CHECK (identity_mode IN ('browser','identity')),
  consent_scope     text NOT NULL DEFAULT 'host' CHECK (consent_scope IN ('host','registrable_domain')),
  retention_days    integer NOT NULL CHECK (retention_days BETWEEN 30 AND 3650),
  live_config_id    uuid,
  created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sites_org ON cmp.sites (org_id);

CREATE TABLE cmp.site_domains (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid NOT NULL REFERENCES cmp.organisations(id),
  site_id      uuid NOT NULL REFERENCES cmp.sites(id),
  hostname     text NOT NULL CHECK (hostname = lower(hostname) AND hostname ~ '^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$'),
  method       text NOT NULL CHECK (method IN ('dns_txt','http_file')),
  token        text NOT NULL DEFAULT replace(gen_random_uuid()::text, '-', ''),
  verified_at  timestamptz,
  UNIQUE (site_id, hostname)
);
-- A hostname can be verified by only one site at a time.
CREATE UNIQUE INDEX site_domains_verified_host ON cmp.site_domains (hostname) WHERE verified_at IS NOT NULL;

-- ───────────────── Governance: profiles, purposes, vendors, technologies ─────────────────

CREATE TABLE cmp.regulation_profiles (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key              text NOT NULL,
  version          integer NOT NULL CHECK (version > 0),
  name             text NOT NULL,
  rules            jsonb NOT NULL CHECK (jsonb_typeof(rules) = 'object'),
  sources          jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(sources) = 'array'),
  effective_from   date NOT NULL,
  effective_until  date,
  status           text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','retired')),
  reviewed_by      text,
  reviewed_at      date,
  UNIQUE (key, version),
  CHECK (effective_until IS NULL OR effective_until > effective_from),
  -- a profile cannot be approved without a named reviewer and date
  CHECK (status = 'draft' OR (reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL))
);

CREATE TABLE cmp.vendors (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid REFERENCES cmp.organisations(id),   -- null = platform catalogue
  name         text NOT NULL,
  domains      text[] NOT NULL DEFAULT '{}',
  country      text,
  privacy_url  text
);
CREATE INDEX vendors_org ON cmp.vendors (org_id);

CREATE TABLE cmp.purposes (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         uuid NOT NULL REFERENCES cmp.organisations(id),
  site_id        uuid NOT NULL REFERENCES cmp.sites(id),
  key            text NOT NULL CHECK (key ~ '^[a-z][a-z0-9_]{1,39}$'),
  required       boolean NOT NULL DEFAULT false,
  legal_basis    text NOT NULL CHECK (legal_basis IN
                 ('consent','legitimate_use','legitimate_interest','contract','legal_obligation','no_personal_data')),
  display_order  integer NOT NULL DEFAULT 0,
  published      boolean NOT NULL DEFAULT false,
  retired_at     timestamptz,
  UNIQUE (site_id, key),
  -- a purpose that cannot be refused may not rest on consent
  CHECK (NOT (required AND legal_basis = 'consent'))
);

CREATE TABLE cmp.technologies (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              uuid NOT NULL REFERENCES cmp.organisations(id),
  site_id             uuid NOT NULL REFERENCES cmp.sites(id),
  vendor_id           uuid REFERENCES cmp.vendors(id),
  name                text NOT NULL,
  type                text NOT NULL CHECK (type IN
                      ('cookie','local_storage','session_storage','pixel','script','iframe','sdk','fingerprint')),
  party               text NOT NULL CHECK (party IN ('first','third')),
  duration            text,
  data_categories     text[] NOT NULL DEFAULT '{}',
  transfer_countries  text[] NOT NULL DEFAULT '{}',
  match_patterns      text[] NOT NULL DEFAULT '{}',
  blocking_strategy   text NOT NULL DEFAULT 'declared' CHECK (blocking_strategy IN ('declared','automatic','signal_only','none')),
  source              text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','scanned')),
  last_verified_at    timestamptz
);
CREATE INDEX technologies_site ON cmp.technologies (site_id);

CREATE TABLE cmp.technology_purposes (
  technology_id  uuid NOT NULL REFERENCES cmp.technologies(id) ON DELETE CASCADE,
  purpose_id     uuid NOT NULL REFERENCES cmp.purposes(id),
  org_id         uuid NOT NULL REFERENCES cmp.organisations(id),
  PRIMARY KEY (technology_id, purpose_id)
);

CREATE TABLE cmp.translations (
  org_id    uuid NOT NULL REFERENCES cmp.organisations(id),
  site_id   uuid NOT NULL REFERENCES cmp.sites(id),
  language  text NOT NULL CHECK (language ~ '^[a-z]{2,3}(-[A-Za-z0-9]{2,8})?$'),
  key       text NOT NULL,
  value     text NOT NULL,
  reviewed  boolean NOT NULL DEFAULT false,
  PRIMARY KEY (site_id, language, key)
);

-- ───────────────────────── Published config ─────────────────────────

CREATE TABLE cmp.signing_keys (
  key_id              text PRIMARY KEY,
  purpose             text NOT NULL CHECK (purpose IN ('config','checkpoint')),
  public_key          text NOT NULL,      -- the private half is never stored in the database
  activated_at        timestamptz NOT NULL DEFAULT now(),
  retired_at          timestamptz,
  rotation_signature  text
);

CREATE TABLE cmp.config_versions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES cmp.organisations(id),
  site_id         uuid NOT NULL REFERENCES cmp.sites(id),
  version         integer NOT NULL CHECK (version > 0),
  snapshot        jsonb NOT NULL,
  content_hash    text NOT NULL CHECK (content_hash ~ '^[0-9a-f]{64}$'),
  signature       text NOT NULL,
  signing_key_id  text NOT NULL REFERENCES cmp.signing_keys(key_id),
  profile_id      uuid NOT NULL REFERENCES cmp.regulation_profiles(id),
  notice_version  text NOT NULL,
  change_impact   text NOT NULL CHECK (change_impact IN ('none','inventory','vendor','purpose','profile')),
  supersedes_id   uuid REFERENCES cmp.config_versions(id),
  copied_from_id  uuid REFERENCES cmp.config_versions(id),
  published_by    uuid NOT NULL,
  published_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (site_id, version)
);

ALTER TABLE cmp.sites
  ADD CONSTRAINT sites_live_config_fk FOREIGN KEY (live_config_id) REFERENCES cmp.config_versions(id);

-- ───────────────────────── Evidence ─────────────────────────

CREATE TABLE cmp.receipts (
  receipt_id           uuid PRIMARY KEY,                  -- generated in the browser
  org_id               uuid NOT NULL REFERENCES cmp.organisations(id),
  site_id              uuid NOT NULL REFERENCES cmp.sites(id),
  visitor_id           uuid NOT NULL,
  subject_ref          text,
  action               text NOT NULL CHECK (action IN ('given','updated','withdrawn','expired','signalled','migrated')),
  purposes             jsonb NOT NULL CHECK (jsonb_typeof(purposes) = 'array'),
  previous_receipt_id  uuid,
  config_version_id    uuid REFERENCES cmp.config_versions(id),
  config_hash          text,
  notice_version       text,
  profile_id           uuid REFERENCES cmp.regulation_profiles(id),
  language             text,
  banner_layer         text CHECK (banner_layer IN ('first','panel','api','signal')),
  signals              jsonb NOT NULL DEFAULT '{}'::jsonb,
  country              text,
  net_hash             text,
  user_agent_family    text,
  client_time          timestamptz,
  received_at          timestamptz NOT NULL DEFAULT now(),
  provenance           jsonb,                             -- migrated records only
  canonical            text NOT NULL,                     -- RFC 8785 text; the receipt of record
  CHECK ((action = 'migrated') = (provenance IS NOT NULL)),
  CHECK (action = 'migrated' OR config_version_id IS NOT NULL)
);
CREATE INDEX receipts_site_received ON cmp.receipts (site_id, received_at);
CREATE INDEX receipts_visitor ON cmp.receipts (site_id, visitor_id, received_at);

CREATE TABLE cmp.ledger_segments (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id             uuid NOT NULL REFERENCES cmp.organisations(id),
  site_id            uuid NOT NULL REFERENCES cmp.sites(id),
  segment_no         bigint NOT NULL CHECK (segment_no > 0),
  kind               text NOT NULL DEFAULT 'receipts' CHECK (kind IN ('receipts','loss_event')),
  first_seq          bigint NOT NULL,
  last_seq           bigint NOT NULL,
  receipt_count      integer NOT NULL CHECK (receipt_count >= 0),
  segment_hash       text NOT NULL CHECK (segment_hash ~ '^[0-9a-f]{64}$'),
  prev_segment_hash  text NOT NULL CHECK (prev_segment_hash ~ '^[0-9a-f]{64}$'),
  sealed_at          timestamptz NOT NULL DEFAULT now(),
  purged_at          timestamptz,
  UNIQUE (site_id, segment_no),
  CHECK (last_seq >= first_seq)
);

CREATE TABLE cmp.receipt_seals (
  receipt_id  uuid PRIMARY KEY REFERENCES cmp.receipts(receipt_id) ON DELETE CASCADE,
  org_id      uuid NOT NULL REFERENCES cmp.organisations(id),
  site_id     uuid NOT NULL REFERENCES cmp.sites(id),
  segment_id  uuid NOT NULL REFERENCES cmp.ledger_segments(id),
  seq         bigint NOT NULL CHECK (seq > 0),
  prev_hash   text NOT NULL CHECK (prev_hash ~ '^[0-9a-f]{64}$'),
  hash        text NOT NULL CHECK (hash ~ '^[0-9a-f]{64}$'),
  UNIQUE (site_id, seq)
);
CREATE INDEX receipt_seals_segment ON cmp.receipt_seals (segment_id);

CREATE TABLE cmp.receipt_flags (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id  uuid NOT NULL,
  org_id      uuid NOT NULL REFERENCES cmp.organisations(id),
  site_id     uuid NOT NULL REFERENCES cmp.sites(id),
  reason      text NOT NULL,
  flagged_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX receipt_flags_receipt ON cmp.receipt_flags (receipt_id);

CREATE TABLE cmp.checkpoints (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id               uuid NOT NULL REFERENCES cmp.organisations(id),
  site_id              uuid NOT NULL REFERENCES cmp.sites(id),
  segment_id           uuid NOT NULL REFERENCES cmp.ledger_segments(id),
  segment_hash         text NOT NULL,
  last_seq             bigint NOT NULL,
  taken_at             timestamptz NOT NULL DEFAULT now(),
  signing_key_id       text NOT NULL REFERENCES cmp.signing_keys(key_id),
  signature            text NOT NULL,
  tsa_name             text,
  tsa_token            bytea,
  delivered_to_tenant  timestamptz
);
CREATE INDEX checkpoints_site ON cmp.checkpoints (site_id, taken_at);

CREATE TABLE cmp.violation_reports (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         uuid NOT NULL REFERENCES cmp.organisations(id),
  site_id        uuid NOT NULL REFERENCES cmp.sites(id),
  day            date NOT NULL,
  category       text NOT NULL CHECK (category IN ('observed','known_technology','potential_violation')),
  technology_id  uuid REFERENCES cmp.technologies(id) ON DELETE SET NULL,
  pattern        text NOT NULL DEFAULT '',
  occurrences    integer NOT NULL DEFAULT 0,
  views_sampled  integer NOT NULL DEFAULT 0,
  sample_rate    numeric NOT NULL CHECK (sample_rate > 0 AND sample_rate <= 1)
);
CREATE UNIQUE INDEX violation_reports_bucket ON cmp.violation_reports
  (site_id, day, category, pattern, COALESCE(technology_id, '00000000-0000-0000-0000-000000000000'::uuid));

CREATE TABLE cmp.audit_log (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     uuid,
  actor      uuid,
  action     text NOT NULL,
  entity     text NOT NULL,
  entity_id  text,
  before     jsonb,
  after      jsonb,
  at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_log_org ON cmp.audit_log (org_id, at);

-- ───────────────────────── Membership helper ─────────────────────────

CREATE FUNCTION cmp.is_member(target_org uuid, min_role text DEFAULT 'viewer')
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = cmp, pg_temp AS $$
  SELECT EXISTS (
    SELECT 1 FROM cmp.org_members m
    WHERE m.org_id = target_org AND m.user_id = auth.uid()
      AND CASE min_role
            WHEN 'viewer' THEN true
            WHEN 'editor' THEN m.role IN ('editor','owner')
            WHEN 'owner'  THEN m.role = 'owner'
            ELSE false
          END);
$$;
REVOKE ALL ON FUNCTION cmp.is_member(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION cmp.is_member(uuid, text) TO authenticated, service_role;

-- ───────────────────────── Integrity triggers ─────────────────────────

-- A child row must belong to the same organisation as the site (or parents) it hangs from,
-- so a forged org_id cannot attach data to another tenant's site.
CREATE FUNCTION cmp.tg_org_consistency() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = cmp, pg_temp AS $$
DECLARE site_org uuid;
BEGIN
  SELECT org_id INTO site_org FROM cmp.sites WHERE id = NEW.site_id;
  IF site_org IS NULL OR site_org <> NEW.org_id THEN
    RAISE EXCEPTION 'cmp: row does not belong to the organisation of its site' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;

CREATE FUNCTION cmp.tg_mapping_consistency() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = cmp, pg_temp AS $$
DECLARE t cmp.technologies; p cmp.purposes;
BEGIN
  SELECT * INTO t FROM cmp.technologies WHERE id = NEW.technology_id;
  SELECT * INTO p FROM cmp.purposes WHERE id = NEW.purpose_id;
  IF t.id IS NULL OR p.id IS NULL OR t.site_id <> p.site_id OR t.org_id <> NEW.org_id OR p.org_id <> NEW.org_id THEN
    RAISE EXCEPTION 'cmp: technology and purpose must belong to the same site and organisation' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;

-- A technology may reference a platform vendor or one of its own organisation's vendors.
CREATE FUNCTION cmp.tg_vendor_consistency() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = cmp, pg_temp AS $$
DECLARE vendor_org uuid; found boolean;
BEGIN
  IF NEW.vendor_id IS NULL THEN RETURN NEW; END IF;
  SELECT true, org_id INTO found, vendor_org FROM cmp.vendors WHERE id = NEW.vendor_id;
  IF found IS NULL OR (vendor_org IS NOT NULL AND vendor_org <> NEW.org_id) THEN
    RAISE EXCEPTION 'cmp: vendor belongs to another organisation' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;

CREATE FUNCTION cmp.tg_no_update() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'cmp: % rows are immutable', TG_TABLE_NAME USING ERRCODE = '42501';
END $$;

CREATE FUNCTION cmp.tg_no_delete() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'cmp: % rows cannot be deleted', TG_TABLE_NAME USING ERRCODE = '42501';
END $$;

-- Receipts and seals may be deleted only by the retention routine, which removes whole sealed
-- segments. The routine (package 6) is the only code that holds DELETE on these tables and
-- sets this flag; the flag alone grants nothing.
CREATE FUNCTION cmp.tg_delete_only_by_retention() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF current_setting('cmp.retention_purge', true) IS DISTINCT FROM 'on' THEN
    RAISE EXCEPTION 'cmp: % rows can be removed only by the retention routine', TG_TABLE_NAME USING ERRCODE = '42501';
  END IF;
  RETURN OLD;
END $$;

-- A sealed segment never changes, except that purged_at may be set once.
CREATE FUNCTION cmp.tg_segment_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.purged_at IS NOT NULL OR NEW.purged_at IS NULL
     OR (to_jsonb(NEW) - 'purged_at') IS DISTINCT FROM (to_jsonb(OLD) - 'purged_at') THEN
    RAISE EXCEPTION 'cmp: a sealed segment can only be marked purged, once' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;

-- A purpose identifier is permanent once it has appeared in a published config.
CREATE FUNCTION cmp.tg_purpose_frozen() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.published THEN
      RAISE EXCEPTION 'cmp: a published purpose cannot be deleted; retire it instead' USING ERRCODE = '42501';
    END IF;
    RETURN OLD;
  END IF;
  IF OLD.published AND (NEW.key <> OLD.key OR NEW.site_id <> OLD.site_id OR NOT NEW.published) THEN
    RAISE EXCEPTION 'cmp: a published purpose keeps its identifier; create a new purpose instead' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;

-- The live config and the site key move only through the publish and rotation routines
-- (package 2), and a live config must belong to the same site.
CREATE FUNCTION cmp.tg_site_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = cmp, pg_temp AS $$
BEGIN
  IF NEW.org_id <> OLD.org_id THEN
    RAISE EXCEPTION 'cmp: a site cannot move between organisations' USING ERRCODE = '42501';
  END IF;
  IF NEW.live_config_id IS DISTINCT FROM OLD.live_config_id THEN
    IF current_setting('cmp.publishing', true) IS DISTINCT FROM 'on' THEN
      RAISE EXCEPTION 'cmp: the live config changes only by publishing' USING ERRCODE = '42501';
    END IF;
    IF NEW.live_config_id IS NULL OR NOT EXISTS (
      SELECT 1 FROM cmp.config_versions c WHERE c.id = NEW.live_config_id AND c.site_id = NEW.id) THEN
      RAISE EXCEPTION 'cmp: the live config must be a published config of this site' USING ERRCODE = '42501';
    END IF;
  END IF;
  IF NEW.site_key <> OLD.site_key AND current_setting('cmp.rotating_key', true) IS DISTINCT FROM 'on' THEN
    RAISE EXCEPTION 'cmp: the site key changes only by rotation' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;

-- Before and after values of every management change.
CREATE FUNCTION cmp.tg_audit() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = cmp, pg_temp AS $$
DECLARE r jsonb := to_jsonb(COALESCE(NEW, OLD));
BEGIN
  INSERT INTO cmp.audit_log (org_id, actor, action, entity, entity_id, before, after)
  VALUES (
    CASE WHEN TG_TABLE_NAME = 'organisations' THEN (r->>'id')::uuid ELSE (r->>'org_id')::uuid END,
    auth.uid(), lower(TG_OP), TG_TABLE_NAME, COALESCE(r->>'id', r->>'key_id'),
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END);
  RETURN COALESCE(NEW, OLD);
END $$;

DO $$
DECLARE t text;
BEGIN
  -- org_id must match the parent site
  FOREACH t IN ARRAY ARRAY['site_domains','purposes','technologies','translations','config_versions','receipts',
                           'ledger_segments','receipt_seals','receipt_flags','checkpoints','violation_reports'] LOOP
    EXECUTE format('CREATE TRIGGER org_consistency BEFORE INSERT OR UPDATE ON cmp.%I FOR EACH ROW EXECUTE FUNCTION cmp.tg_org_consistency()', t);
  END LOOP;
  -- never updated
  FOREACH t IN ARRAY ARRAY['receipts','receipt_seals','receipt_flags','config_versions','checkpoints','audit_log'] LOOP
    EXECUTE format('CREATE TRIGGER no_update BEFORE UPDATE ON cmp.%I FOR EACH ROW EXECUTE FUNCTION cmp.tg_no_update()', t);
  END LOOP;
  -- never deleted
  FOREACH t IN ARRAY ARRAY['receipt_flags','config_versions','checkpoints','audit_log','ledger_segments'] LOOP
    EXECUTE format('CREATE TRIGGER no_delete BEFORE DELETE ON cmp.%I FOR EACH ROW EXECUTE FUNCTION cmp.tg_no_delete()', t);
  END LOOP;
  -- deleted only by retention
  FOREACH t IN ARRAY ARRAY['receipts','receipt_seals'] LOOP
    EXECUTE format('CREATE TRIGGER delete_only_by_retention BEFORE DELETE ON cmp.%I FOR EACH ROW EXECUTE FUNCTION cmp.tg_delete_only_by_retention()', t);
  END LOOP;
  -- audited
  FOREACH t IN ARRAY ARRAY['organisations','org_members','sites','site_domains','vendors','purposes','technologies',
                           'technology_purposes','translations','regulation_profiles','signing_keys'] LOOP
    EXECUTE format('CREATE TRIGGER audit AFTER INSERT OR UPDATE OR DELETE ON cmp.%I FOR EACH ROW EXECUTE FUNCTION cmp.tg_audit()', t);
  END LOOP;
END $$;

CREATE TRIGGER mapping_consistency BEFORE INSERT OR UPDATE ON cmp.technology_purposes
  FOR EACH ROW EXECUTE FUNCTION cmp.tg_mapping_consistency();
CREATE TRIGGER vendor_consistency BEFORE INSERT OR UPDATE ON cmp.technologies
  FOR EACH ROW EXECUTE FUNCTION cmp.tg_vendor_consistency();
CREATE TRIGGER segment_guard BEFORE UPDATE ON cmp.ledger_segments
  FOR EACH ROW EXECUTE FUNCTION cmp.tg_segment_guard();
CREATE TRIGGER purpose_frozen BEFORE UPDATE OR DELETE ON cmp.purposes
  FOR EACH ROW EXECUTE FUNCTION cmp.tg_purpose_frozen();
CREATE TRIGGER site_guard BEFORE UPDATE ON cmp.sites
  FOR EACH ROW EXECUTE FUNCTION cmp.tg_site_guard();

-- ───────────────────────── Privileges ─────────────────────────
-- Nothing is granted by default. anon gets nothing. Members get exactly the columns they may
-- set; values the platform owns (site key, tokens, verification, published flags) are not
-- writable by members at all. The service role gets no UPDATE or DELETE on evidence.

REVOKE ALL ON ALL TABLES IN SCHEMA cmp FROM PUBLIC, anon, authenticated, service_role;

GRANT SELECT ON ALL TABLES IN SCHEMA cmp TO authenticated, service_role;
-- audit_log is readable by owners only, by policy.

GRANT UPDATE (name) ON cmp.organisations TO authenticated;
GRANT INSERT, DELETE, UPDATE (role) ON cmp.org_members TO authenticated;
GRANT UPDATE (name, default_profile, default_language, identity_mode, consent_scope, retention_days) ON cmp.sites TO authenticated;
GRANT INSERT (org_id, site_id, hostname, method), DELETE ON cmp.site_domains TO authenticated;
GRANT INSERT (org_id, name, domains, country, privacy_url), UPDATE (name, domains, country, privacy_url), DELETE ON cmp.vendors TO authenticated;
GRANT INSERT (org_id, site_id, key, required, legal_basis, display_order),
      UPDATE (required, legal_basis, display_order, retired_at), DELETE ON cmp.purposes TO authenticated;
GRANT INSERT, UPDATE, DELETE ON cmp.technologies TO authenticated;
GRANT INSERT, DELETE ON cmp.technology_purposes TO authenticated;
GRANT INSERT, UPDATE, DELETE ON cmp.translations TO authenticated;

GRANT INSERT, UPDATE, DELETE ON cmp.organisations, cmp.org_members, cmp.sites, cmp.site_domains, cmp.vendors,
      cmp.purposes, cmp.technologies, cmp.technology_purposes, cmp.translations,
      cmp.regulation_profiles, cmp.signing_keys, cmp.violation_reports TO service_role;
GRANT INSERT ON cmp.config_versions, cmp.receipts, cmp.receipt_seals, cmp.receipt_flags,
      cmp.ledger_segments, cmp.checkpoints, cmp.audit_log TO service_role;

-- ───────────────────────── Row-level security ─────────────────────────

DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'cmp' LOOP
    EXECUTE format('ALTER TABLE cmp.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE cmp.%I FORCE ROW LEVEL SECURITY', t);
  END LOOP;
  -- Read-only for members: published config and evidence.
  FOREACH t IN ARRAY ARRAY['config_versions','receipts','receipt_seals','receipt_flags','ledger_segments',
                           'checkpoints','violation_reports'] LOOP
    EXECUTE format('CREATE POLICY member_read ON cmp.%I FOR SELECT TO authenticated USING (cmp.is_member(org_id))', t);
  END LOOP;
  -- Read by members, written by editors.
  FOREACH t IN ARRAY ARRAY['site_domains','purposes','technologies','technology_purposes','translations'] LOOP
    EXECUTE format('CREATE POLICY member_read ON cmp.%I FOR SELECT TO authenticated USING (cmp.is_member(org_id))', t);
    EXECUTE format('CREATE POLICY editor_insert ON cmp.%I FOR INSERT TO authenticated WITH CHECK (cmp.is_member(org_id, ''editor''))', t);
    EXECUTE format('CREATE POLICY editor_update ON cmp.%I FOR UPDATE TO authenticated USING (cmp.is_member(org_id, ''editor'')) WITH CHECK (cmp.is_member(org_id, ''editor''))', t);
    EXECUTE format('CREATE POLICY editor_delete ON cmp.%I FOR DELETE TO authenticated USING (cmp.is_member(org_id, ''editor''))', t);
  END LOOP;
END $$;

CREATE POLICY member_read ON cmp.organisations FOR SELECT TO authenticated USING (cmp.is_member(id));
CREATE POLICY owner_update ON cmp.organisations FOR UPDATE TO authenticated
  USING (cmp.is_member(id, 'owner')) WITH CHECK (cmp.is_member(id, 'owner'));

CREATE POLICY member_read ON cmp.org_members FOR SELECT TO authenticated USING (cmp.is_member(org_id));
CREATE POLICY owner_insert ON cmp.org_members FOR INSERT TO authenticated WITH CHECK (cmp.is_member(org_id, 'owner'));
CREATE POLICY owner_update ON cmp.org_members FOR UPDATE TO authenticated
  USING (cmp.is_member(org_id, 'owner')) WITH CHECK (cmp.is_member(org_id, 'owner'));
CREATE POLICY owner_delete ON cmp.org_members FOR DELETE TO authenticated USING (cmp.is_member(org_id, 'owner'));

CREATE POLICY member_read ON cmp.sites FOR SELECT TO authenticated USING (cmp.is_member(org_id));
CREATE POLICY owner_update ON cmp.sites FOR UPDATE TO authenticated
  USING (cmp.is_member(org_id, 'owner')) WITH CHECK (cmp.is_member(org_id, 'owner'));

-- Vendors: everyone signed in reads the platform catalogue; organisations manage only their own.
CREATE POLICY vendor_read ON cmp.vendors FOR SELECT TO authenticated USING (org_id IS NULL OR cmp.is_member(org_id));
CREATE POLICY vendor_insert ON cmp.vendors FOR INSERT TO authenticated
  WITH CHECK (org_id IS NOT NULL AND cmp.is_member(org_id, 'editor'));
CREATE POLICY vendor_update ON cmp.vendors FOR UPDATE TO authenticated
  USING (org_id IS NOT NULL AND cmp.is_member(org_id, 'editor'))
  WITH CHECK (org_id IS NOT NULL AND cmp.is_member(org_id, 'editor'));
CREATE POLICY vendor_delete ON cmp.vendors FOR DELETE TO authenticated
  USING (org_id IS NOT NULL AND cmp.is_member(org_id, 'editor'));

CREATE POLICY approved_read ON cmp.regulation_profiles FOR SELECT TO authenticated USING (status = 'approved');
CREATE POLICY key_read ON cmp.signing_keys FOR SELECT TO authenticated USING (true);
CREATE POLICY owner_read ON cmp.audit_log FOR SELECT TO authenticated USING (org_id IS NOT NULL AND cmp.is_member(org_id, 'owner'));

-- ───────────────────────── Standard purposes ─────────────────────────
-- Used when a site is created (package 2). Sites may add their own purposes afterwards.

CREATE FUNCTION cmp.seed_standard_purposes(p_site uuid) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = cmp, pg_temp AS $$
  INSERT INTO cmp.purposes (org_id, site_id, key, required, legal_basis, display_order)
  SELECT s.org_id, s.id, v.key, v.required, v.legal_basis, v.ord
  FROM cmp.sites s,
       (VALUES ('strictly_necessary', true,  'legitimate_use', 0),
               ('preferences',        false, 'consent',        1),
               ('analytics',          false, 'consent',        2),
               ('marketing',          false, 'consent',        3)) AS v(key, required, legal_basis, ord)
  WHERE s.id = p_site
  ON CONFLICT (site_id, key) DO NOTHING;
$$;
REVOKE ALL ON FUNCTION cmp.seed_standard_purposes(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION cmp.seed_standard_purposes(uuid) TO service_role;

-- ───────────────────────── Seed: regulation profiles ─────────────────────────
-- Engineering defaults, seeded as drafts. A profile cannot be used to publish a config until
-- it is approved, which requires a named reviewer (legal sign-off).

INSERT INTO cmp.regulation_profiles (key, version, name, effective_from, rules, sources) VALUES
('in-dpdp', 1, 'India DPDP', DATE '2027-05-13',
 '{"consent_model":"opt_in","reject_on_first_layer":true,"equal_prominence":true,"preselected_optional":false,
   "dismiss_without_choice":false,"expiry_days":365,"honour_privacy_signal":true,"privacy_signal_purposes":["marketing"],
   "minor_age":18,"minor_denies":["analytics","marketing"],
   "required_links":["notice","withdrawal","grievance"],"language_rule":"english_or_scheduled_indian_language",
   "reprompt_on":["purpose","vendor","profile"]}',
 '[{"instrument":"Digital Personal Data Protection Act, 2023","provisions":["s.5","s.6","s.7","s.9","s.13"]},
   {"instrument":"Digital Personal Data Protection Rules, 2025","provisions":["r.3"]}]'),
('eu-gdpr', 1, 'EU GDPR and ePrivacy', DATE '2018-05-25',
 '{"consent_model":"opt_in","reject_on_first_layer":true,"equal_prominence":true,"preselected_optional":false,
   "dismiss_without_choice":false,"expiry_days":180,"honour_privacy_signal":true,"privacy_signal_purposes":["analytics","marketing"],
   "minor_age":16,"minor_denies":["marketing"],
   "required_links":["notice","withdrawal"],"language_rule":"site_languages","name_third_parties":true,
   "reprompt_on":["purpose","vendor","profile"]}',
 '[{"instrument":"Regulation (EU) 2016/679","provisions":["Art.4(11)","Art.6","Art.7"]},
   {"instrument":"Directive 2002/58/EC","provisions":["Art.5(3)"]}]'),
('uk', 1, 'United Kingdom', DATE '2021-01-01',
 '{"consent_model":"opt_in","reject_on_first_layer":true,"equal_prominence":true,"preselected_optional":false,
   "dismiss_without_choice":false,"expiry_days":180,"honour_privacy_signal":true,"privacy_signal_purposes":["analytics","marketing"],
   "minor_age":13,"minor_denies":["marketing"],"low_risk_exceptions_enabled":false,
   "required_links":["notice","withdrawal"],"language_rule":"site_languages",
   "reprompt_on":["purpose","vendor","profile"]}',
 '[{"instrument":"UK GDPR","provisions":["Art.6","Art.7"]},
   {"instrument":"Privacy and Electronic Communications Regulations 2003","provisions":["reg.6"]}]'),
('us-opt-out', 1, 'US opt-out states', DATE '2023-01-01',
 '{"consent_model":"opt_out","opt_out_purposes":["marketing"],"reject_on_first_layer":false,"equal_prominence":true,
   "preselected_optional":true,"dismiss_without_choice":true,"expiry_days":365,
   "honour_privacy_signal":true,"privacy_signal_purposes":["marketing"],"sensitive_data_opt_in":true,
   "required_links":["notice","do_not_sell_or_share"],"language_rule":"site_languages",
   "reprompt_on":["purpose","profile"]}',
 '[{"instrument":"California Consumer Privacy Act as amended","provisions":["s.1798.120","s.1798.135"]}]'),
('notice-only', 1, 'Notice only', DATE '2000-01-01',
 '{"consent_model":"notice","reject_on_first_layer":false,"preselected_optional":true,"dismiss_without_choice":true,
   "expiry_days":null,"honour_privacy_signal":false,"required_links":["notice"],"language_rule":"site_languages",
   "reprompt_on":[]}',
 '[]');

-- ───────────────────────── Seed: platform vendor catalogue ─────────────────────────

INSERT INTO cmp.vendors (org_id, name, domains, country, privacy_url) VALUES
(NULL, 'Google', ARRAY['google-analytics.com','googletagmanager.com','doubleclick.net','google.com','youtube.com'], 'US', 'https://policies.google.com/privacy'),
(NULL, 'Meta', ARRAY['facebook.com','facebook.net','instagram.com'], 'US', 'https://www.facebook.com/privacy/policy'),
(NULL, 'Microsoft', ARRAY['clarity.ms','bing.com','linkedin.com','licdn.com'], 'US', 'https://privacy.microsoft.com/privacystatement'),
(NULL, 'Hotjar', ARRAY['hotjar.com','hotjar.io'], 'MT', 'https://www.hotjar.com/legal/policies/privacy'),
(NULL, 'Intercom', ARRAY['intercom.io','intercomcdn.com'], 'US', 'https://www.intercom.com/legal/privacy'),
(NULL, 'X', ARRAY['twitter.com','x.com','t.co'], 'US', 'https://x.com/privacy');
