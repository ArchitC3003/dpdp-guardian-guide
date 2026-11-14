# Consent Platform: Package 1 gate, round 4 submission

For: Independent Technical Reviewer. From: Implementation Owner. Date: 2026-11-14.
Responds to the round-3 review. Not merged to main. Not applied to the PrivcybHub live database.

## 1. Response to the round-3 instructions

| # | Instruction | Status | Detail |
| --- | --- | --- | --- |
| 1 | Rollback safety | Done | Section 2 |
| 2 | Applied profile in package 2 | Recorded as a package 2 requirement | Specification, "Package 1 gate decisions"; AGENTS.md. profile_id is unchanged. Package 1 does not claim country-specific profile resolution |
| 3 | Update the Technical Specification | Done | New section "Package 1 gate decisions": row-level security decision, same-site keys, receipt binding, scope immutability, frozen profiles and keys, last-owner rule, rollback behaviour, package 2 receipt fields, and a table of what hosting validation has and has not shown. The earlier "enabled and forced" wording is corrected |
| 4 | Classify the Supabase results correctly | Done | Described everywhere as a separate-project run, not Lovable Cloud |
| 5 | Keep the suite and mutation tests permanently | Done | npm run test:db and npm run test:db:mutations; both extended in this round |
| 6 | Branch divergence | Resolved by merge after review | Section 4 |
| 7 | Test-project clean-up | Not done | Awaiting the product owner's explicit approval |

## 2. Rollback safety

The finding is correct. The previous script was DROP SCHEMA cmp CASCADE with a comment claiming nothing outside cmp is touched; that claim holds only while nothing outside cmp depends on it.

The reverse script is now a single DO block, so the check and the drop succeed or fail together:

1. It finds every object outside cmp that the catalogue records as depending on an object in cmp. Each side of a dependency is mapped to the schema it lives in. A kind the query cannot place is treated as outside cmp, so it errs towards refusing.
2. It finds routines outside cmp whose body mentions cmp. The catalogue does not track these, so CASCADE would not drop them; it would leave them broken.
3. If either finds anything, it raises SQLSTATE 2BP01 (dependent objects still exist), lists the objects, and changes nothing.
4. Only otherwise does it drop the schema. There is no override: dependants must be removed or repointed deliberately first.

Defect found by the new tests, before submission: my first version counted internal dependencies, so it listed PostgreSQL's own TOAST storage tables as outside dependants and would have refused every rollback. The routine test exposed it. The check now considers normal and automatic dependencies only, and each refusal test additionally requires that exactly one object is named and that no storage table appears.

Limits:

- The routine scan is a text match on "cmp." in function bodies. It can refuse because of a comment or string, and it cannot see a schema name built at run time or a reference made through search_path. It errs towards refusing.
- It does not detect references from outside the database: application code, saved queries, or another database.
- The revised script has been run locally only. The platform run in round 3 used the earlier script.

## 3. Test evidence (local PostgreSQL 16.15, non-superuser owner, two owner modes)

| Owner mode | Checks | Passed | Failed |
| --- | --- | --- | --- |
| bypassrls | 484 | 484 | 0 |
| nobypassrls | 484 | 484 | 0 |

Per mode: 447 schema checks, 2 concurrency checks, 7 rollback-safety checks, 28 smoke checks. The 477 checks of round 3 are all retained; the 7 rollback checks are new.

Rollback-safety checks, expected versus actual (nobypassrls mode; the other mode is identical in outcome):

```
nobypassrls	3001	PASS	rollback refuses while a view outside cmp selects from it	expected: refused with 2BP01 naming the object; object and cmp intact	ERROR:  2BP01: cmp rollback refused: objects outside cmp depend on it and would be dropped: rule _RETURN on view ext.vendor_names; kept=1,1,19
nobypassrls	3002	PASS	rollback refuses while a table outside cmp has a foreign key into it	expected: refused with 2BP01 naming the object; object and cmp intact	ERROR:  2BP01: cmp rollback refused: objects outside cmp depend on it and would be dropped: constraint billing_org_id_fkey on table ext.billing; kept=1,1,19
nobypassrls	3003	PASS	rollback refuses while a policy outside cmp calls a cmp function	expected: refused with 2BP01 naming the object; object and cmp intact	ERROR:  2BP01: cmp rollback refused: objects outside cmp depend on it and would be dropped: policy members on table ext.notes; kept=1,1,19
nobypassrls	3004	PASS	rollback refuses while a trigger outside cmp uses a cmp function	expected: refused with 2BP01 naming the object; object and cmp intact	ERROR:  2BP01: cmp rollback refused: objects outside cmp depend on it and would be dropped: trigger no_update on table ext.frozen; kept=1,1,19
nobypassrls	3005	PASS	rollback refuses while a column outside cmp uses a cmp row type	expected: refused with 2BP01 naming the object; object and cmp intact	ERROR:  2BP01: cmp rollback refused: objects outside cmp depend on it and would be dropped: column v of table ext.snapshots; kept=1,1,19
nobypassrls	3006	PASS	rollback refuses while a routine outside cmp refers to it in its body	expected: refused with 2BP01 naming the object; object and cmp intact	ERROR:  2BP01: cmp rollback refused: routines outside cmp refer to it and would be left broken: ext.org_count(); kept=1,1,19
nobypassrls	3099	PASS	rollback with no dependants removes cmp and leaves an unrelated table untouched	expected: cmp gone, ext.unrelated has 1 row	cmp schemas=0, ext.unrelated rows=1
```

Mutation tests: one control removed per run, tests unchanged. Two of the thirteen remove a control from the rollback script.

```
CAUGHT    receipt-config-site-key: suite failed (2 checks), including "a Site A receipt cannot name Site B's config"
CAUGHT    receipt-profile-key: suite failed (1 checks), including "a receipt cannot carry a profile other than its config's"
CAUGHT    receipt-config-trigger: suite failed (3 checks), including "a receipt cannot carry a hash other than its config's"
CAUGHT    seal-segment-site-key: suite failed (3 checks), including "a Site A receipt cannot be sealed into Site B's segment"
CAUGHT    violation-technology-scope-key: suite failed (2 checks), including "a report cannot name a technology of another site in the same organisation"
CAUGHT    technology-scope-trigger: suite failed (2 checks), including "a member cannot move a technology to another site of the same organisation"
CAUGHT    profile-frozen-trigger: suite failed (17 checks), including "an approved profile's rules cannot be changed"
CAUGHT    keep-an-owner-trigger: suite failed (13 checks), including "the only owner cannot demote themselves"
CAUGHT    evidence-read-policy: suite failed (28 checks), including "A viewer reads no other-tenant rows in receipts"
CAUGHT    evidence-no-update-trigger: suite failed (1 checks), including "trigger refuses update on receipts"
CAUGHT    config-key-purpose: suite failed (1 checks), including "a config cannot be signed with a checkpoint key"
CAUGHT    rollback-dependency-check: suite failed (1 checks), including "rollback refuses while a view outside cmp selects from it"
CAUGHT    rollback-routine-scan: suite failed (1 checks), including "rollback refuses while a routine outside cmp refers to it in its body"
OK: all 13 removed controls were detected
```

App unit tests after merging main: 131 passed across 13 files.

## 4. Branch divergence

Your comparison was right and my statement was incomplete. I reported the branch as in sync with its own remote and six commits ahead of main, which was true, but I had not fetched main since the previous day, so I did not report that main had moved six commits.

The six incoming commits are one merged pull request (#7), a rework of the signed-in dashboard:

| Incoming change | Files |
| --- | --- |
| Dashboard rebuilt as a stage-by-stage overview | src/pages/Dashboard.tsx, src/components/dashboard/*, src/hooks/useOverview.ts |
| Supporting logic and tests | src/lib/overview.ts, src/lib/workspaceFeatures.ts and their tests |
| Small edits | src/pages/PhaseRapidAssessment.tsx, src/pages/PolicyLibrary.tsx, AGENTS.md (a Dashboard section) |

Review result: no migration, no change under drizzle/, supabase/, or any consent or cmp file. The only shared file was AGENTS.md, in a different section. Migration number 0015 is still free on main.

Resolution: main was merged into the branch with a merge commit. No rebase and no force push, so the reviewed commits keep their hashes. The merge had no conflicts. After it the branch is 0 behind main.

## 5. Checksums (SHA-256)

| File | SHA-256 |
| --- | --- |
| drizzle/migrations/0015_cmp_schema.sql | bce57a8fcb139341ce9cdb2634be2fdd8e3456fbfc973d756d12745997604c07 |
| drizzle/rollback/0015_cmp_schema.down.sql | 6bffe0754648aab6195a3904ee3b65fffd5b38895210d77a0dfeb24e73679fe5 |
| drizzle/tests/cmp_schema.test.sql | 3bc02e736f7633d31ffcd4cde69add13c22536d1c0c3d9fce8c56182fc7ce2d3 |
| drizzle/tests/cmp_platform_smoke.sql | ec995bedbe319b1e658e2e1b77c3a9d5a43ebe80b5007412151fadd0ad22fffd |
| scripts/test-cmp-db.sh | d0930a0f66e63c247ad920031b8d943aedb57bd27019c61367a203b32b0eb772 |
| scripts/test-cmp-mutations.sh | 8a66c7b2f29eafe58738ae35e1274245a14a74610fbcf0a0d9ff800f0b2fedfc |

The migration is unchanged since round 3 (same checksum as the file staged and applied on the separate Supabase project).

## 6. Still outstanding

| Item | Owner |
| --- | --- |
| Lovable Cloud validation (post-merge checkpoint) | After gate sign-off |
| Full suite, concurrency and mutation tests on a hosting platform | Not feasible through the SQL console; local only |
| HTTP-level authentication and authorisation tests | Package 2, when endpoints exist |
| Revised rollback script on a hosting platform | Not run |
| Clean-up of the separate Supabase test project (cmp schema, staging schema, three test users) | Product owner approval |
| Production migration | Not approved; not attempted |

## 7. Reverse script as submitted

```sql
-- Reverses drizzle/migrations/0015_cmp_schema.sql.
--
-- DROP SCHEMA ... CASCADE also removes objects in OTHER schemas that depend on cmp (a view over a
-- cmp table, a foreign key to one, a policy or trigger that calls a cmp function, a column of a cmp
-- type). This script therefore checks first and REFUSES, changing nothing, if anything outside cmp
-- depends on it or would be left broken. It lists what it found; remove or repoint those objects
-- deliberately, then run it again. There is no override.
--
-- The check and the drop run in one block, so they succeed or fail together.

DO $rollback$
DECLARE
  ns oid := (SELECT oid FROM pg_namespace WHERE nspname = 'cmp');
  found text;
BEGIN
  IF ns IS NULL THEN
    RAISE EXCEPTION 'cmp rollback: schema cmp does not exist' USING ERRCODE = '3F000';
  END IF;

  -- 1. Objects outside cmp that the catalogue records as depending on something in cmp.
  --    Each side of a dependency is mapped to the schema it lives in; a kind this query cannot
  --    place is treated as outside cmp, so the script errs towards refusing.
  WITH placed AS (
    SELECT d.classid, d.objid, d.objsubid, d.refclassid, d.refobjid,
      CASE d.classid
        WHEN 'pg_class'::regclass      THEN (SELECT relnamespace FROM pg_class WHERE oid = d.objid)
        WHEN 'pg_proc'::regclass       THEN (SELECT pronamespace FROM pg_proc WHERE oid = d.objid)
        WHEN 'pg_type'::regclass       THEN (SELECT typnamespace FROM pg_type WHERE oid = d.objid)
        WHEN 'pg_constraint'::regclass THEN (SELECT COALESCE(c.relnamespace, k.connamespace) FROM pg_constraint k LEFT JOIN pg_class c ON c.oid = k.conrelid WHERE k.oid = d.objid)
        WHEN 'pg_trigger'::regclass    THEN (SELECT c.relnamespace FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid WHERE t.oid = d.objid)
        WHEN 'pg_policy'::regclass     THEN (SELECT c.relnamespace FROM pg_policy p JOIN pg_class c ON c.oid = p.polrelid WHERE p.oid = d.objid)
        WHEN 'pg_rewrite'::regclass    THEN (SELECT c.relnamespace FROM pg_rewrite r JOIN pg_class c ON c.oid = r.ev_class WHERE r.oid = d.objid)
        WHEN 'pg_attrdef'::regclass    THEN (SELECT c.relnamespace FROM pg_attrdef a JOIN pg_class c ON c.oid = a.adrelid WHERE a.oid = d.objid)
        WHEN 'pg_namespace'::regclass  THEN d.objid
      END AS dep_ns,
      CASE d.refclassid
        WHEN 'pg_class'::regclass      THEN (SELECT relnamespace FROM pg_class WHERE oid = d.refobjid)
        WHEN 'pg_proc'::regclass       THEN (SELECT pronamespace FROM pg_proc WHERE oid = d.refobjid)
        WHEN 'pg_type'::regclass       THEN (SELECT typnamespace FROM pg_type WHERE oid = d.refobjid)
        WHEN 'pg_constraint'::regclass THEN (SELECT COALESCE(c.relnamespace, k.connamespace) FROM pg_constraint k LEFT JOIN pg_class c ON c.oid = k.conrelid WHERE k.oid = d.refobjid)
        WHEN 'pg_namespace'::regclass  THEN d.refobjid
      END AS ref_ns
    FROM pg_depend d
    -- normal and automatic dependencies only: internal ones (TOAST tables, row types) are parts
    -- of their owning object, not separate dependants
    WHERE d.deptype IN ('n', 'a')
  )
  SELECT string_agg(DISTINCT pg_describe_object(classid, objid, objsubid), '; ' ORDER BY pg_describe_object(classid, objid, objsubid))
    INTO found
  FROM placed
  WHERE ref_ns = ns AND dep_ns IS DISTINCT FROM ns;

  IF found IS NOT NULL THEN
    RAISE EXCEPTION 'cmp rollback refused: objects outside cmp depend on it and would be dropped: %', found
      USING ERRCODE = '2BP01', HINT = 'Remove or repoint these objects deliberately, then run the rollback again.';
  END IF;

  -- 2. Routines outside cmp whose body mentions cmp. The catalogue does not track these, so CASCADE
  --    would not drop them; it would leave them broken. Refuse for the same reason.
  SELECT string_agg(p.oid::regprocedure::text, '; ' ORDER BY p.oid::regprocedure::text) INTO found
  FROM pg_proc p
  WHERE p.pronamespace <> ns
    AND p.pronamespace NOT IN (SELECT oid FROM pg_namespace WHERE nspname IN ('pg_catalog', 'information_schema'))
    AND p.prosrc ~* '\mcmp\.[a-z_]';

  IF found IS NOT NULL THEN
    RAISE EXCEPTION 'cmp rollback refused: routines outside cmp refer to it and would be left broken: %', found
      USING ERRCODE = '2BP01', HINT = 'Remove or repoint these routines deliberately, then run the rollback again.';
  END IF;

  SET LOCAL client_min_messages = warning;
  DROP SCHEMA cmp CASCADE;
END $rollback$;
```
