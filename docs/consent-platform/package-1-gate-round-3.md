# Consent Platform: Package 1 gate, round 3 submission

For: Independent Technical Reviewer. From: Implementation Owner. Date: 2026-11-13.
Code under review: commit 0250cd0 on branch claude/awesome-cray-tn8nhp (previous: a82571a). Not merged. Not applied to the PrivcybHub live database.

Response to A to F, hosting-platform evidence, checksums, the migration diff and expected-versus-actual output for every check. The files themselves are in this repository at the paths named in section 1.

## 1. Checksums (SHA-256)

| File | SHA-256 |
| --- | --- |
| drizzle/migrations/0015_cmp_schema.sql | bce57a8fcb139341ce9cdb2634be2fdd8e3456fbfc973d756d12745997604c07 |
| drizzle/rollback/0015_cmp_schema.down.sql | 2e0f3e7b1b3a5fd20ff9d6a108fb7effbe58e9c60721d5161520c25cda1cf3fb |
| drizzle/tests/cmp_schema.test.sql | 3bc02e736f7633d31ffcd4cde69add13c22536d1c0c3d9fce8c56182fc7ce2d3 |
| drizzle/tests/cmp_platform_smoke.sql | ec995bedbe319b1e658e2e1b77c3a9d5a43ebe80b5007412151fadd0ad22fffd |

## 2. Response to A to F

| Item | Status | What was done |
| --- | --- | --- |
| A. Bind receipt to its config | Done | config_versions_evidence_uq, receipts_config_profile_fk and receipts_profile_required_for_config added as specified. BEFORE INSERT trigger tg_receipt_config rejects a differing or missing config_hash or notice_version with a "cmp:" message and SQLSTATE 23514. Migrated records (no config) pass through to the provenance rules. Tests: wrong profile (fk), missing profile (check), wrong hash, missing hash, wrong notice version (all 23514 cmp:), valid receipt accepted, migrated receipt accepted |
| B. Violation-report technology scope | Done | technologies_scope_uq and violation_reports_technology_scope_fk with ON DELETE SET NULL (technology_id), replacing the single-column key. Tests: different-site technology in the same organisation (23503), different-organisation technology (23503), valid report accepted, technology deleted, report keeps site_id and org_id with technology_id null |
| C. Technology scope immutable | Done | tg_technology_scope_immutable and trigger as specified. Tests: site change refused as a member and as the owner role, organisation change refused, name, vendor and match-pattern edits still succeed |
| D. Hosting-platform check | Done on Supabase, not on Lovable Cloud | See section 3. Read the limitation there before relying on it |
| E. Profile resolution | Fallback rule enforced now; one question raised | tg_config_guard now requires a config's profile to be an approved version of the site's default profile. See section 5, question 1 |
| F. Evidence | This file | Sections 6 to 11 |

Beyond what was asked (say if any should be removed):

- The scope-immutable rule is also applied to purposes, site_domains, translations and vendors, for the same reason as C.
- The harness now runs as a non-superuser owner, in two modes (with and without BYPASSRLS).
- The mutation tests are a committed script (11 controls).
- A plain-SQL platform smoke test (28 checks) is committed and is also run locally in both modes.

## 3. Hosting-platform check (item D)

### What it was run on, and what it was not

"Lovable Cloud staging" does not exist: Lovable Cloud has one database serving live and preview, and the product owner's instruction is that live PrivcybHub data must not be touched. The check was therefore run on a separate, empty Supabase project owned by the product owner (PostgreSQL 17.6, region ap-south-1). Lovable Cloud is hosted on Supabase, so the role model is the same kind, but this is not the Lovable Cloud project itself. A run on Lovable Cloud remains a separate checkpoint after merge.

Before the run the project was confirmed empty: 0 auth users, 0 storage objects, 0 tables outside platform schemas.

### Procedure and results

| Step | Result |
| --- | --- |
| Stage migration text in five pieces | Each piece's SHA-256 matched the local file's corresponding piece |
| Checksum of the staged whole | bce57a8fcb139341ce9cdb2634be2fdd8e3456fbfc973d756d12745997604c07, identical to the committed file |
| Apply (2026-11-13 20:37 UTC) | Ran as postgres. 19 tables, 21 functions, 52 triggers, 42 policies, row-level security enabled on 19 of 19 tables, 5 profiles, 6 vendors |
| Platform smoke test | 28 of 28 passed (table below) |
| Reverse (20:47 UTC) | cmp schema, tables and functions all 0 |
| Re-apply (20:47 UTC) | Same checksum; 19 tables, 21 functions, 52 triggers, 42 policies; 5 draft profiles, 6 vendors, 0 organisations |
| Clean-up of the test project | Pending. The connector's confirmation prompt has not been answered; the cmp schema, the staging schema and three test users are still in that separate project |

Not run on the platform: the full 447-check suite (it uses psql features the SQL console lacks), the two-session concurrency checks, and the mutation tests. Those are local only.

### Roles on the platform

| Role | Superuser | BYPASSRLS |
| --- | --- | --- |
| postgres (migration role, owner of everything in cmp) | No | Yes |
| service_role | No | Yes |
| authenticated | No | No |
| anon | No | No |
| authenticator | No | No |

### Your SECURITY DEFINER query, result

Every row: function_owner = postgres, rolbypassrls = true, owner is not a superuser, proconfig = search_path=cmp, pg_temp.

```
is_member, seed_standard_purposes, tg_audit, tg_checkpoint_guard, tg_config_guard, tg_keep_an_owner,
tg_mapping_consistency, tg_org_consistency, tg_receipt_config, tg_site_guard, tg_site_profile,
tg_vendor_consistency                                                              (12 functions)
```

SECURITY INVOKER (9): tg_delete_only_by_retention, tg_no_delete, tg_no_update, tg_profile_frozen, tg_purpose_frozen, tg_scope_immutable, tg_segment_guard, tg_signing_key_frozen, tg_technology_scope_immutable. None of these reads a table.

Other facts read from the platform catalog after apply:

| Fact | Value |
| --- | --- |
| Schema owner, and owner of every cmp table | postgres |
| Tables with FORCE ROW LEVEL SECURITY | 0 |
| anon has USAGE on schema cmp | false |
| Table or column privileges in cmp held by anon or PUBLIC | 0 |
| anon can execute cmp.is_member | false |
| authenticated can execute cmp.seed_standard_purposes | false |
| UPDATE, DELETE or TRUNCATE held by service_role on evidence tables | 0 |
| Any non-SELECT privilege held by authenticated on evidence, profile or key tables | 0 |

### Function-owner and least-privilege decision

- All tables and all SECURITY DEFINER functions are owned by the migration role. No request-serving role owns anything in cmp.
- Row-level security is enabled on every table and deliberately not forced. A table owner is exempt from non-forced policies, which is what the definer functions rely on. The schema therefore needs no BYPASSRLS attribute to function, and the migration grants none.
- This is shown locally: the whole suite passes with the owner both with and without BYPASSRLS. On the platform the migration role happens to have BYPASSRLS natively; the design does not depend on it.
- This is a departure from the specification, which said "enabled and forced". With FORCE, an owner without BYPASSRLS would be subject to the policies, the membership helper would return false for everyone, and the schema would fail closed. I judged a design that needs no bypass privilege to be the lower-privilege choice. If you want FORCE restored, it requires either relying on the platform's BYPASSRLS or adding owner policies; say which.
- Residual: the migration role can still disable a trigger on a table it owns. That is unchanged and is what signed checkpoints address in package 6.

### Platform smoke test: expected versus actual (run as postgres, switching role per section)

| # | Outcome | Check | Expected | Actual |
| --- | --- | --- | --- | --- |
| 1 | PASS | migration role is not a superuser | true | postgres: bypassrls=true |
| 2 | PASS | every SECURITY DEFINER function in cmp is owned by the schema owner with a pinned search path | true | 12 functions owned by postgres |
| 3 | PASS | no request-serving role owns a cmp table or function | true | |
| 4 | PASS | anon has no privilege on the cmp schema | true | |
| 5 | PASS | anon cannot read receipts | priv | 42501: permission denied for schema cmp |
| 6 | PASS | anon cannot call the membership helper | priv | 42501: permission denied for schema cmp |
| 7 | PASS | auth.uid() resolves to the signed-in member | true | c0000000-0000-0000-0000-00000000a002 |
| 8 | PASS | membership helper: true for own organisation, false for the other | true | |
| 9 | PASS | viewer sees exactly their own organisation, site, config and receipt | true | |
| 10 | PASS | viewer cannot add a technology | rls | 42501: new row violates row-level security policy for table "technologies" |
| 11 | PASS | owner can rename own site | allowed | 1 row(s) |
| 12 | PASS | owner cannot edit the other tenant's site | rows0 | 0 row(s) |
| 13 | PASS | owner cannot change the site key | priv | 42501: permission denied for table sites |
| 14 | PASS | owner cannot attach a purpose to the other site with a forged org_id | rule | 42501: cmp: row does not belong to the organisation of its site |
| 15 | PASS | owner cannot add a purpose to the other tenant | rls | 42501: new row violates row-level security policy for table "purposes" |
| 16 | PASS | owner can add a technology (audit trigger runs) | allowed | 1 row(s) |
| 17 | PASS | owner reads the audit entry naming them as actor | true | |
| 18 | PASS | owner cannot move a technology to another organisation | rule | 42501: cmp: row does not belong to the organisation of its site |
| 19 | PASS | the only owner cannot demote themselves | rule | 42501: cmp: an organisation must keep at least one owner |
| 20 | PASS | owner cannot insert a receipt | priv | 42501: permission denied for table receipts |
| 21 | PASS | service role cannot update a receipt | priv | 42501: permission denied for table receipts |
| 22 | PASS | service role cannot delete a receipt | priv | 42501: permission denied for table receipts |
| 23 | PASS | service role cannot edit an approved profile | rule | 42501: cmp: an approved regulation profile is frozen; create a new version instead |
| 24 | PASS | service role can insert a receipt that matches its config | allowed | 1 row(s) |
| 25 | PASS | service role cannot insert a receipt with the wrong hash | evidence | 23514: cmp: receipt config_hash does not match the referenced config |
| 26 | PASS | service role cannot link a Site A receipt to Site B's config | fk | 23503: insert or update on table "receipts" violates foreign key constraint "receipts_config_version_id_site_id_org_id_fkey" |
| 27 | PASS | the migration role cannot update a receipt | rule | 42501: cmp: receipts rows are immutable |
| 28 | PASS | the migration role cannot delete a receipt outside retention | rule | 42501: cmp: receipts rows can be removed only by the retention routine |

Note on check 18: the refusal came from the organisation-consistency trigger, which fires before the technology-scope trigger for an organisation change. The scope trigger itself is exercised by the same-organisation site move in the local suite and by a mutation test.

Limits of this platform evidence: the roles were assumed with SET ROLE from the migration role and the sign-in identity was set through request settings, as the platform's own API layer does. No request went through the platform's HTTP API.

## 4. Disclosures

1. Harness defect, now fixed. Until commit 6733217 a failed check did not make the run exit with failure: the test file ended with psql's \quit 1, which does not set an exit status. Every check in the two earlier submissions did pass (the printed counts were 0 failed), so the reported results were true, but my statement that a failure would stop the run was false. I found it when writing the mutation script, which reported failures with exit code 0. The test file now raises an error on any failure, and the runner separately fails on any non-passing line or an empty result file. The mutation script proves the fix: each of 11 removals now ends the run with a failure.
2. Check count. The round-2 figure was 424. One receipt check was replaced by seven stricter ones and one config-profile check was reworded to match item E. The suite is now 447 schema checks, 2 concurrency checks and 28 smoke checks per owner mode: 477 per mode, 954 across both.
3. Section comments in the migration were changed from box-drawing characters to plain ASCII so the file could be staged and checksummed byte for byte. No executable SQL changed in that commit.

## 5. Questions for the reviewer

1. A and E conflict under country overrides. A binds receipts.profile_id to the config's own profile through the composite key. E says the receipt records the exact profile selected for that visitor, which under a country override differs from the config's profile. One column cannot hold both. Proposal for package 2: keep profile_id bound to the config as in A, and add applied_profile_id for the profile actually selected, validated at ingestion against the overrides in the signed snapshot. Until then no override path exists, so nothing is ambiguous. Please confirm or direct otherwise.
2. FORCE ROW LEVEL SECURITY removed (section 3). Accept, or restore and say how the owner should be exempted.
3. Scope-immutable rule extended to four more tables. Accept or remove.
4. Is the Supabase run accepted for item D, with the Lovable Cloud run kept as the post-merge checkpoint you already defined?

## 6. Local results summary

Environment: local PostgreSQL 16.15, migration and tests run as a non-superuser owner role.

| Owner mode | Checks | Passed | Failed | Reverse and re-apply |
| --- | --- | --- | --- | --- |
| bypassrls | 477 | 477 | 0 | Succeeded |
| nobypassrls | 477 | 477 | 0 | Succeeded |

Expected causes across the bypassrls mode (the other mode is identical):

| Expected cause | Checks |
| --- | --- |
| allowed | 28 |
| check | 7 |
| evidence | 4 |
| fk | 11 |
| priv | 110 |
| rls | 25 |
| rows0 | 45 |
| rule | 83 |
| second removal refused by rule, one owner left | 2 |
| true | 161 |
| unique | 1 |

## 7. Mutation tests (local): one control removed per run, unchanged tests

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
OK: all 11 removed controls were detected
```

## 8. Every local check: mode, number, outcome, check, expected cause, actual

Both modes produced the same outcome for every check, so only the nobypassrls mode is listed in full. Numbers 1001 and 1002 are the two-session concurrency checks; 2001 to 2028 are the smoke test.

```
nobypassrls	1	PASS	tests run as a non-superuser schema owner	expected: true	platform_owner, bypassrls=false
nobypassrls	2	PASS	every SECURITY DEFINER function in cmp is owned by the schema owner and pins its search path	expected: true	12 functions: is_member, seed_standard_purposes, tg_audit, tg_checkpoint_guard, tg_config_guard, tg_keep_an_owner, tg_mapping_consistency, tg_org_consistency, tg_receipt_config, tg_site_guard, tg_site_profile, tg_vendor_consistency
nobypassrls	3	PASS	no request-serving role owns anything in cmp	expected: true	
nobypassrls	4	PASS	row-level security is enabled on every cmp table	expected: true	19 tables
nobypassrls	5	PASS	seed: five regulation profiles, all draft	expected: true	
nobypassrls	6	PASS	seed: platform vendor catalogue present	expected: true	
nobypassrls	7	PASS	a site cannot name an unknown regulation profile	expected: rule	42501: cmp: unknown regulation profile no-such-profile
nobypassrls	8	PASS	seed: four standard purposes per site	expected: true	
nobypassrls	9	PASS	a config cannot be published while every profile is still a draft	expected: rule	42501: cmp: a config can be published only under an approved regulation profile
nobypassrls	10	PASS	a profile cannot be approved without a named reviewer	expected: check	23514: new row for relation "regulation_profiles" violates check constraint "regulation_profiles_check1"
nobypassrls	11	PASS	a profile cannot be approved with a blank reviewer	expected: check	23514: new row for relation "regulation_profiles" violates check constraint "regulation_profiles_check1"
nobypassrls	12	PASS	a profile can be approved with reviewer and date	expected: allowed	1 row(s) affected
nobypassrls	13	PASS	a config cannot use an approved profile that is not the site's default	expected: rule	42501: cmp: a config's profile must be a version of the site's default regulation profile
nobypassrls	14	PASS	a config cannot be published under a draft profile	expected: rule	42501: cmp: a config can be published only under an approved regulation profile
nobypassrls	15	PASS	a config cannot be signed with a checkpoint key	expected: rule	42501: cmp: a config must be signed with an active config-signing key
nobypassrls	16	PASS	a config cannot be signed with a retired key	expected: rule	42501: cmp: a config must be signed with an active config-signing key
nobypassrls	17	PASS	anon cannot read cmp.audit_log	expected: priv	42501: permission denied for schema cmp
nobypassrls	18	PASS	anon cannot read cmp.checkpoints	expected: priv	42501: permission denied for schema cmp
nobypassrls	19	PASS	anon cannot read cmp.config_versions	expected: priv	42501: permission denied for schema cmp
nobypassrls	20	PASS	anon cannot read cmp.ledger_segments	expected: priv	42501: permission denied for schema cmp
nobypassrls	21	PASS	anon cannot read cmp.org_members	expected: priv	42501: permission denied for schema cmp
nobypassrls	22	PASS	anon cannot read cmp.organisations	expected: priv	42501: permission denied for schema cmp
nobypassrls	23	PASS	anon cannot read cmp.purposes	expected: priv	42501: permission denied for schema cmp
nobypassrls	24	PASS	anon cannot read cmp.receipt_flags	expected: priv	42501: permission denied for schema cmp
nobypassrls	25	PASS	anon cannot read cmp.receipt_seals	expected: priv	42501: permission denied for schema cmp
nobypassrls	26	PASS	anon cannot read cmp.receipts	expected: priv	42501: permission denied for schema cmp
nobypassrls	27	PASS	anon cannot read cmp.regulation_profiles	expected: priv	42501: permission denied for schema cmp
nobypassrls	28	PASS	anon cannot read cmp.signing_keys	expected: priv	42501: permission denied for schema cmp
nobypassrls	29	PASS	anon cannot read cmp.site_domains	expected: priv	42501: permission denied for schema cmp
nobypassrls	30	PASS	anon cannot read cmp.sites	expected: priv	42501: permission denied for schema cmp
nobypassrls	31	PASS	anon cannot read cmp.technologies	expected: priv	42501: permission denied for schema cmp
nobypassrls	32	PASS	anon cannot read cmp.technology_purposes	expected: priv	42501: permission denied for schema cmp
nobypassrls	33	PASS	anon cannot read cmp.translations	expected: priv	42501: permission denied for schema cmp
nobypassrls	34	PASS	anon cannot read cmp.vendors	expected: priv	42501: permission denied for schema cmp
nobypassrls	35	PASS	anon cannot read cmp.violation_reports	expected: priv	42501: permission denied for schema cmp
nobypassrls	36	PASS	anon cannot write cmp.organisations	expected: priv	42501: permission denied for schema cmp
nobypassrls	37	PASS	anon cannot call cmp.is_member	expected: priv	42501: permission denied for schema cmp
nobypassrls	38	PASS	A viewer reads no other-tenant rows in checkpoints	expected: true	
nobypassrls	39	PASS	A viewer reads own rows in checkpoints	expected: true	
nobypassrls	40	PASS	A viewer cannot delete other-tenant rows in checkpoints	expected: priv	42501: permission denied for table checkpoints
nobypassrls	41	PASS	A viewer reads no other-tenant rows in config_versions	expected: true	
nobypassrls	42	PASS	A viewer reads own rows in config_versions	expected: true	
nobypassrls	43	PASS	A viewer cannot delete other-tenant rows in config_versions	expected: priv	42501: permission denied for table config_versions
nobypassrls	44	PASS	A viewer reads no other-tenant rows in ledger_segments	expected: true	
nobypassrls	45	PASS	A viewer reads own rows in ledger_segments	expected: true	
nobypassrls	46	PASS	A viewer cannot delete other-tenant rows in ledger_segments	expected: priv	42501: permission denied for table ledger_segments
nobypassrls	47	PASS	A viewer reads no other-tenant rows in org_members	expected: true	
nobypassrls	48	PASS	A viewer reads own rows in org_members	expected: true	
nobypassrls	49	PASS	A viewer cannot delete other-tenant rows in org_members	expected: rows0	0 row(s) affected
nobypassrls	50	PASS	A viewer reads no other-tenant rows in purposes	expected: true	
nobypassrls	51	PASS	A viewer reads own rows in purposes	expected: true	
nobypassrls	52	PASS	A viewer cannot delete other-tenant rows in purposes	expected: rows0	0 row(s) affected
nobypassrls	53	PASS	A viewer reads no other-tenant rows in receipt_flags	expected: true	
nobypassrls	54	PASS	A viewer reads own rows in receipt_flags	expected: true	
nobypassrls	55	PASS	A viewer cannot delete other-tenant rows in receipt_flags	expected: priv	42501: permission denied for table receipt_flags
nobypassrls	56	PASS	A viewer reads no other-tenant rows in receipt_seals	expected: true	
nobypassrls	57	PASS	A viewer reads own rows in receipt_seals	expected: true	
nobypassrls	58	PASS	A viewer cannot delete other-tenant rows in receipt_seals	expected: priv	42501: permission denied for table receipt_seals
nobypassrls	59	PASS	A viewer reads no other-tenant rows in receipts	expected: true	
nobypassrls	60	PASS	A viewer reads own rows in receipts	expected: true	
nobypassrls	61	PASS	A viewer cannot delete other-tenant rows in receipts	expected: priv	42501: permission denied for table receipts
nobypassrls	62	PASS	A viewer reads no other-tenant rows in site_domains	expected: true	
nobypassrls	63	PASS	A viewer reads own rows in site_domains	expected: true	
nobypassrls	64	PASS	A viewer cannot delete other-tenant rows in site_domains	expected: rows0	0 row(s) affected
nobypassrls	65	PASS	A viewer reads no other-tenant rows in sites	expected: true	
nobypassrls	66	PASS	A viewer reads own rows in sites	expected: true	
nobypassrls	67	PASS	A viewer cannot delete other-tenant rows in sites	expected: priv	42501: permission denied for table sites
nobypassrls	68	PASS	A viewer reads no other-tenant rows in technologies	expected: true	
nobypassrls	69	PASS	A viewer reads own rows in technologies	expected: true	
nobypassrls	70	PASS	A viewer cannot delete other-tenant rows in technologies	expected: rows0	0 row(s) affected
nobypassrls	71	PASS	A viewer reads no other-tenant rows in technology_purposes	expected: true	
nobypassrls	72	PASS	A viewer reads own rows in technology_purposes	expected: true	
nobypassrls	73	PASS	A viewer cannot delete other-tenant rows in technology_purposes	expected: rows0	0 row(s) affected
nobypassrls	74	PASS	A viewer reads no other-tenant rows in translations	expected: true	
nobypassrls	75	PASS	A viewer reads own rows in translations	expected: true	
nobypassrls	76	PASS	A viewer cannot delete other-tenant rows in translations	expected: rows0	0 row(s) affected
nobypassrls	77	PASS	A viewer reads no other-tenant rows in violation_reports	expected: true	
nobypassrls	78	PASS	A viewer reads own rows in violation_reports	expected: true	
nobypassrls	79	PASS	A viewer cannot delete other-tenant rows in violation_reports	expected: priv	42501: permission denied for table violation_reports
nobypassrls	80	PASS	A viewer sees only their own organisation	expected: true	
nobypassrls	81	PASS	A viewer sees only their own sites	expected: true	
nobypassrls	82	PASS	A viewer sees no other-tenant vendors	expected: true	
nobypassrls	83	PASS	A viewer sees the platform vendor catalogue	expected: true	
nobypassrls	84	PASS	A viewer sees no other-tenant audit entries	expected: true	
nobypassrls	85	PASS	A viewer cannot rename the other organisation	expected: rows0	0 row(s) affected
nobypassrls	86	PASS	A viewer cannot join the other organisation	expected: rls	42501: new row violates row-level security policy for table "org_members"
nobypassrls	87	PASS	A viewer cannot edit the other site	expected: rows0	0 row(s) affected
nobypassrls	88	PASS	A viewer cannot add a purpose to the other site	expected: rls	42501: new row violates row-level security policy for table "purposes"
nobypassrls	89	PASS	A viewer cannot add a technology to the other site	expected: rls	42501: new row violates row-level security policy for table "technologies"
nobypassrls	90	PASS	A viewer cannot edit other-tenant technologies	expected: rows0	0 row(s) affected
nobypassrls	91	PASS	A viewer cannot add a domain to the other site	expected: rls	42501: new row violates row-level security policy for table "site_domains"
nobypassrls	92	PASS	A viewer cannot add a vendor to the other organisation	expected: rls	42501: new row violates row-level security policy for table "vendors"
nobypassrls	93	PASS	A viewer cannot edit other-tenant translations	expected: rows0	0 row(s) affected
nobypassrls	94	PASS	A viewer cannot attach a purpose to the other site with a forged org_id	expected: rule	42501: cmp: row does not belong to the organisation of its site
nobypassrls	95	PASS	A viewer cannot attach a technology to the other site with a forged org_id	expected: rule	42501: cmp: row does not belong to the organisation of its site
nobypassrls	96	PASS	A viewer cannot attach a domain to the other site with a forged org_id	expected: rule	42501: cmp: row does not belong to the organisation of its site
nobypassrls	97	PASS	A editor reads no other-tenant rows in checkpoints	expected: true	
nobypassrls	98	PASS	A editor reads own rows in checkpoints	expected: true	
nobypassrls	99	PASS	A editor cannot delete other-tenant rows in checkpoints	expected: priv	42501: permission denied for table checkpoints
nobypassrls	100	PASS	A editor reads no other-tenant rows in config_versions	expected: true	
nobypassrls	101	PASS	A editor reads own rows in config_versions	expected: true	
nobypassrls	102	PASS	A editor cannot delete other-tenant rows in config_versions	expected: priv	42501: permission denied for table config_versions
nobypassrls	103	PASS	A editor reads no other-tenant rows in ledger_segments	expected: true	
nobypassrls	104	PASS	A editor reads own rows in ledger_segments	expected: true	
nobypassrls	105	PASS	A editor cannot delete other-tenant rows in ledger_segments	expected: priv	42501: permission denied for table ledger_segments
nobypassrls	106	PASS	A editor reads no other-tenant rows in org_members	expected: true	
nobypassrls	107	PASS	A editor reads own rows in org_members	expected: true	
nobypassrls	108	PASS	A editor cannot delete other-tenant rows in org_members	expected: rows0	0 row(s) affected
nobypassrls	109	PASS	A editor reads no other-tenant rows in purposes	expected: true	
nobypassrls	110	PASS	A editor reads own rows in purposes	expected: true	
nobypassrls	111	PASS	A editor cannot delete other-tenant rows in purposes	expected: rows0	0 row(s) affected
nobypassrls	112	PASS	A editor reads no other-tenant rows in receipt_flags	expected: true	
nobypassrls	113	PASS	A editor reads own rows in receipt_flags	expected: true	
nobypassrls	114	PASS	A editor cannot delete other-tenant rows in receipt_flags	expected: priv	42501: permission denied for table receipt_flags
nobypassrls	115	PASS	A editor reads no other-tenant rows in receipt_seals	expected: true	
nobypassrls	116	PASS	A editor reads own rows in receipt_seals	expected: true	
nobypassrls	117	PASS	A editor cannot delete other-tenant rows in receipt_seals	expected: priv	42501: permission denied for table receipt_seals
nobypassrls	118	PASS	A editor reads no other-tenant rows in receipts	expected: true	
nobypassrls	119	PASS	A editor reads own rows in receipts	expected: true	
nobypassrls	120	PASS	A editor cannot delete other-tenant rows in receipts	expected: priv	42501: permission denied for table receipts
nobypassrls	121	PASS	A editor reads no other-tenant rows in site_domains	expected: true	
nobypassrls	122	PASS	A editor reads own rows in site_domains	expected: true	
nobypassrls	123	PASS	A editor cannot delete other-tenant rows in site_domains	expected: rows0	0 row(s) affected
nobypassrls	124	PASS	A editor reads no other-tenant rows in sites	expected: true	
nobypassrls	125	PASS	A editor reads own rows in sites	expected: true	
nobypassrls	126	PASS	A editor cannot delete other-tenant rows in sites	expected: priv	42501: permission denied for table sites
nobypassrls	127	PASS	A editor reads no other-tenant rows in technologies	expected: true	
nobypassrls	128	PASS	A editor reads own rows in technologies	expected: true	
nobypassrls	129	PASS	A editor cannot delete other-tenant rows in technologies	expected: rows0	0 row(s) affected
nobypassrls	130	PASS	A editor reads no other-tenant rows in technology_purposes	expected: true	
nobypassrls	131	PASS	A editor reads own rows in technology_purposes	expected: true	
nobypassrls	132	PASS	A editor cannot delete other-tenant rows in technology_purposes	expected: rows0	0 row(s) affected
nobypassrls	133	PASS	A editor reads no other-tenant rows in translations	expected: true	
nobypassrls	134	PASS	A editor reads own rows in translations	expected: true	
nobypassrls	135	PASS	A editor cannot delete other-tenant rows in translations	expected: rows0	0 row(s) affected
nobypassrls	136	PASS	A editor reads no other-tenant rows in violation_reports	expected: true	
nobypassrls	137	PASS	A editor reads own rows in violation_reports	expected: true	
nobypassrls	138	PASS	A editor cannot delete other-tenant rows in violation_reports	expected: priv	42501: permission denied for table violation_reports
nobypassrls	139	PASS	A editor sees only their own organisation	expected: true	
nobypassrls	140	PASS	A editor sees only their own sites	expected: true	
nobypassrls	141	PASS	A editor sees no other-tenant vendors	expected: true	
nobypassrls	142	PASS	A editor sees the platform vendor catalogue	expected: true	
nobypassrls	143	PASS	A editor sees no other-tenant audit entries	expected: true	
nobypassrls	144	PASS	A editor cannot rename the other organisation	expected: rows0	0 row(s) affected
nobypassrls	145	PASS	A editor cannot join the other organisation	expected: rls	42501: new row violates row-level security policy for table "org_members"
nobypassrls	146	PASS	A editor cannot edit the other site	expected: rows0	0 row(s) affected
nobypassrls	147	PASS	A editor cannot add a purpose to the other site	expected: rls	42501: new row violates row-level security policy for table "purposes"
nobypassrls	148	PASS	A editor cannot add a technology to the other site	expected: rls	42501: new row violates row-level security policy for table "technologies"
nobypassrls	149	PASS	A editor cannot edit other-tenant technologies	expected: rows0	0 row(s) affected
nobypassrls	150	PASS	A editor cannot add a domain to the other site	expected: rls	42501: new row violates row-level security policy for table "site_domains"
nobypassrls	151	PASS	A editor cannot add a vendor to the other organisation	expected: rls	42501: new row violates row-level security policy for table "vendors"
nobypassrls	152	PASS	A editor cannot edit other-tenant translations	expected: rows0	0 row(s) affected
nobypassrls	153	PASS	A editor cannot attach a purpose to the other site with a forged org_id	expected: rule	42501: cmp: row does not belong to the organisation of its site
nobypassrls	154	PASS	A editor cannot attach a technology to the other site with a forged org_id	expected: rule	42501: cmp: row does not belong to the organisation of its site
nobypassrls	155	PASS	A editor cannot attach a domain to the other site with a forged org_id	expected: rule	42501: cmp: row does not belong to the organisation of its site
nobypassrls	156	PASS	A owner reads no other-tenant rows in checkpoints	expected: true	
nobypassrls	157	PASS	A owner reads own rows in checkpoints	expected: true	
nobypassrls	158	PASS	A owner cannot delete other-tenant rows in checkpoints	expected: priv	42501: permission denied for table checkpoints
nobypassrls	159	PASS	A owner reads no other-tenant rows in config_versions	expected: true	
nobypassrls	160	PASS	A owner reads own rows in config_versions	expected: true	
nobypassrls	161	PASS	A owner cannot delete other-tenant rows in config_versions	expected: priv	42501: permission denied for table config_versions
nobypassrls	162	PASS	A owner reads no other-tenant rows in ledger_segments	expected: true	
nobypassrls	163	PASS	A owner reads own rows in ledger_segments	expected: true	
nobypassrls	164	PASS	A owner cannot delete other-tenant rows in ledger_segments	expected: priv	42501: permission denied for table ledger_segments
nobypassrls	165	PASS	A owner reads no other-tenant rows in org_members	expected: true	
nobypassrls	166	PASS	A owner reads own rows in org_members	expected: true	
nobypassrls	167	PASS	A owner cannot delete other-tenant rows in org_members	expected: rows0	0 row(s) affected
nobypassrls	168	PASS	A owner reads no other-tenant rows in purposes	expected: true	
nobypassrls	169	PASS	A owner reads own rows in purposes	expected: true	
nobypassrls	170	PASS	A owner cannot delete other-tenant rows in purposes	expected: rows0	0 row(s) affected
nobypassrls	171	PASS	A owner reads no other-tenant rows in receipt_flags	expected: true	
nobypassrls	172	PASS	A owner reads own rows in receipt_flags	expected: true	
nobypassrls	173	PASS	A owner cannot delete other-tenant rows in receipt_flags	expected: priv	42501: permission denied for table receipt_flags
nobypassrls	174	PASS	A owner reads no other-tenant rows in receipt_seals	expected: true	
nobypassrls	175	PASS	A owner reads own rows in receipt_seals	expected: true	
nobypassrls	176	PASS	A owner cannot delete other-tenant rows in receipt_seals	expected: priv	42501: permission denied for table receipt_seals
nobypassrls	177	PASS	A owner reads no other-tenant rows in receipts	expected: true	
nobypassrls	178	PASS	A owner reads own rows in receipts	expected: true	
nobypassrls	179	PASS	A owner cannot delete other-tenant rows in receipts	expected: priv	42501: permission denied for table receipts
nobypassrls	180	PASS	A owner reads no other-tenant rows in site_domains	expected: true	
nobypassrls	181	PASS	A owner reads own rows in site_domains	expected: true	
nobypassrls	182	PASS	A owner cannot delete other-tenant rows in site_domains	expected: rows0	0 row(s) affected
nobypassrls	183	PASS	A owner reads no other-tenant rows in sites	expected: true	
nobypassrls	184	PASS	A owner reads own rows in sites	expected: true	
nobypassrls	185	PASS	A owner cannot delete other-tenant rows in sites	expected: priv	42501: permission denied for table sites
nobypassrls	186	PASS	A owner reads no other-tenant rows in technologies	expected: true	
nobypassrls	187	PASS	A owner reads own rows in technologies	expected: true	
nobypassrls	188	PASS	A owner cannot delete other-tenant rows in technologies	expected: rows0	0 row(s) affected
nobypassrls	189	PASS	A owner reads no other-tenant rows in technology_purposes	expected: true	
nobypassrls	190	PASS	A owner reads own rows in technology_purposes	expected: true	
nobypassrls	191	PASS	A owner cannot delete other-tenant rows in technology_purposes	expected: rows0	0 row(s) affected
nobypassrls	192	PASS	A owner reads no other-tenant rows in translations	expected: true	
nobypassrls	193	PASS	A owner reads own rows in translations	expected: true	
nobypassrls	194	PASS	A owner cannot delete other-tenant rows in translations	expected: rows0	0 row(s) affected
nobypassrls	195	PASS	A owner reads no other-tenant rows in violation_reports	expected: true	
nobypassrls	196	PASS	A owner reads own rows in violation_reports	expected: true	
nobypassrls	197	PASS	A owner cannot delete other-tenant rows in violation_reports	expected: priv	42501: permission denied for table violation_reports
nobypassrls	198	PASS	A owner sees only their own organisation	expected: true	
nobypassrls	199	PASS	A owner sees only their own sites	expected: true	
nobypassrls	200	PASS	A owner sees no other-tenant vendors	expected: true	
nobypassrls	201	PASS	A owner sees the platform vendor catalogue	expected: true	
nobypassrls	202	PASS	A owner sees no other-tenant audit entries	expected: true	
nobypassrls	203	PASS	A owner cannot rename the other organisation	expected: rows0	0 row(s) affected
nobypassrls	204	PASS	A owner cannot join the other organisation	expected: rls	42501: new row violates row-level security policy for table "org_members"
nobypassrls	205	PASS	A owner cannot edit the other site	expected: rows0	0 row(s) affected
nobypassrls	206	PASS	A owner cannot add a purpose to the other site	expected: rls	42501: new row violates row-level security policy for table "purposes"
nobypassrls	207	PASS	A owner cannot add a technology to the other site	expected: rls	42501: new row violates row-level security policy for table "technologies"
nobypassrls	208	PASS	A owner cannot edit other-tenant technologies	expected: rows0	0 row(s) affected
nobypassrls	209	PASS	A owner cannot add a domain to the other site	expected: rls	42501: new row violates row-level security policy for table "site_domains"
nobypassrls	210	PASS	A owner cannot add a vendor to the other organisation	expected: rls	42501: new row violates row-level security policy for table "vendors"
nobypassrls	211	PASS	A owner cannot edit other-tenant translations	expected: rows0	0 row(s) affected
nobypassrls	212	PASS	A owner cannot attach a purpose to the other site with a forged org_id	expected: rule	42501: cmp: row does not belong to the organisation of its site
nobypassrls	213	PASS	A owner cannot attach a technology to the other site with a forged org_id	expected: rule	42501: cmp: row does not belong to the organisation of its site
nobypassrls	214	PASS	A owner cannot attach a domain to the other site with a forged org_id	expected: rule	42501: cmp: row does not belong to the organisation of its site
nobypassrls	215	PASS	B owner reads no other-tenant rows in checkpoints	expected: true	
nobypassrls	216	PASS	B owner reads own rows in checkpoints	expected: true	
nobypassrls	217	PASS	B owner cannot delete other-tenant rows in checkpoints	expected: priv	42501: permission denied for table checkpoints
nobypassrls	218	PASS	B owner reads no other-tenant rows in config_versions	expected: true	
nobypassrls	219	PASS	B owner reads own rows in config_versions	expected: true	
nobypassrls	220	PASS	B owner cannot delete other-tenant rows in config_versions	expected: priv	42501: permission denied for table config_versions
nobypassrls	221	PASS	B owner reads no other-tenant rows in ledger_segments	expected: true	
nobypassrls	222	PASS	B owner reads own rows in ledger_segments	expected: true	
nobypassrls	223	PASS	B owner cannot delete other-tenant rows in ledger_segments	expected: priv	42501: permission denied for table ledger_segments
nobypassrls	224	PASS	B owner reads no other-tenant rows in org_members	expected: true	
nobypassrls	225	PASS	B owner reads own rows in org_members	expected: true	
nobypassrls	226	PASS	B owner cannot delete other-tenant rows in org_members	expected: rows0	0 row(s) affected
nobypassrls	227	PASS	B owner reads no other-tenant rows in purposes	expected: true	
nobypassrls	228	PASS	B owner reads own rows in purposes	expected: true	
nobypassrls	229	PASS	B owner cannot delete other-tenant rows in purposes	expected: rows0	0 row(s) affected
nobypassrls	230	PASS	B owner reads no other-tenant rows in receipt_flags	expected: true	
nobypassrls	231	PASS	B owner reads own rows in receipt_flags	expected: true	
nobypassrls	232	PASS	B owner cannot delete other-tenant rows in receipt_flags	expected: priv	42501: permission denied for table receipt_flags
nobypassrls	233	PASS	B owner reads no other-tenant rows in receipt_seals	expected: true	
nobypassrls	234	PASS	B owner reads own rows in receipt_seals	expected: true	
nobypassrls	235	PASS	B owner cannot delete other-tenant rows in receipt_seals	expected: priv	42501: permission denied for table receipt_seals
nobypassrls	236	PASS	B owner reads no other-tenant rows in receipts	expected: true	
nobypassrls	237	PASS	B owner reads own rows in receipts	expected: true	
nobypassrls	238	PASS	B owner cannot delete other-tenant rows in receipts	expected: priv	42501: permission denied for table receipts
nobypassrls	239	PASS	B owner reads no other-tenant rows in site_domains	expected: true	
nobypassrls	240	PASS	B owner reads own rows in site_domains	expected: true	
nobypassrls	241	PASS	B owner cannot delete other-tenant rows in site_domains	expected: rows0	0 row(s) affected
nobypassrls	242	PASS	B owner reads no other-tenant rows in sites	expected: true	
nobypassrls	243	PASS	B owner reads own rows in sites	expected: true	
nobypassrls	244	PASS	B owner cannot delete other-tenant rows in sites	expected: priv	42501: permission denied for table sites
nobypassrls	245	PASS	B owner reads no other-tenant rows in technologies	expected: true	
nobypassrls	246	PASS	B owner reads own rows in technologies	expected: true	
nobypassrls	247	PASS	B owner cannot delete other-tenant rows in technologies	expected: rows0	0 row(s) affected
nobypassrls	248	PASS	B owner reads no other-tenant rows in technology_purposes	expected: true	
nobypassrls	249	PASS	B owner reads own rows in technology_purposes	expected: true	
nobypassrls	250	PASS	B owner cannot delete other-tenant rows in technology_purposes	expected: rows0	0 row(s) affected
nobypassrls	251	PASS	B owner reads no other-tenant rows in translations	expected: true	
nobypassrls	252	PASS	B owner reads own rows in translations	expected: true	
nobypassrls	253	PASS	B owner cannot delete other-tenant rows in translations	expected: rows0	0 row(s) affected
nobypassrls	254	PASS	B owner reads no other-tenant rows in violation_reports	expected: true	
nobypassrls	255	PASS	B owner reads own rows in violation_reports	expected: true	
nobypassrls	256	PASS	B owner cannot delete other-tenant rows in violation_reports	expected: priv	42501: permission denied for table violation_reports
nobypassrls	257	PASS	B owner sees only their own organisation	expected: true	
nobypassrls	258	PASS	B owner sees only their own sites	expected: true	
nobypassrls	259	PASS	B owner sees no other-tenant vendors	expected: true	
nobypassrls	260	PASS	B owner sees the platform vendor catalogue	expected: true	
nobypassrls	261	PASS	B owner sees no other-tenant audit entries	expected: true	
nobypassrls	262	PASS	B owner cannot rename the other organisation	expected: rows0	0 row(s) affected
nobypassrls	263	PASS	B owner cannot join the other organisation	expected: rls	42501: new row violates row-level security policy for table "org_members"
nobypassrls	264	PASS	B owner cannot edit the other site	expected: rows0	0 row(s) affected
nobypassrls	265	PASS	B owner cannot add a purpose to the other site	expected: rls	42501: new row violates row-level security policy for table "purposes"
nobypassrls	266	PASS	B owner cannot add a technology to the other site	expected: rls	42501: new row violates row-level security policy for table "technologies"
nobypassrls	267	PASS	B owner cannot edit other-tenant technologies	expected: rows0	0 row(s) affected
nobypassrls	268	PASS	B owner cannot add a domain to the other site	expected: rls	42501: new row violates row-level security policy for table "site_domains"
nobypassrls	269	PASS	B owner cannot add a vendor to the other organisation	expected: rls	42501: new row violates row-level security policy for table "vendors"
nobypassrls	270	PASS	B owner cannot edit other-tenant translations	expected: rows0	0 row(s) affected
nobypassrls	271	PASS	B owner cannot attach a purpose to the other site with a forged org_id	expected: rule	42501: cmp: row does not belong to the organisation of its site
nobypassrls	272	PASS	B owner cannot attach a technology to the other site with a forged org_id	expected: rule	42501: cmp: row does not belong to the organisation of its site
nobypassrls	273	PASS	B owner cannot attach a domain to the other site with a forged org_id	expected: rule	42501: cmp: row does not belong to the organisation of its site
nobypassrls	274	PASS	editor cannot map own technology to another tenant's purpose	expected: rule	42501: cmp: technology and purpose must belong to the same site and organisation
nobypassrls	275	PASS	editor cannot point own technology at another tenant's vendor	expected: rule	42501: cmp: vendor belongs to another organisation
nobypassrls	276	PASS	editor can point own technology at a platform vendor	expected: allowed	1 row(s) affected
nobypassrls	277	PASS	editor cannot change a platform vendor	expected: rows0	0 row(s) affected
nobypassrls	278	PASS	editor cannot add to the platform catalogue	expected: rls	42501: new row violates row-level security policy for table "vendors"
nobypassrls	279	PASS	viewer cannot add a technology	expected: rls	42501: new row violates row-level security policy for table "technologies"
nobypassrls	280	PASS	viewer cannot edit a purpose	expected: rows0	0 row(s) affected
nobypassrls	281	PASS	viewer cannot read the audit log	expected: true	
nobypassrls	282	PASS	members read approved regulation profiles only	expected: true	
nobypassrls	283	PASS	editor can add a technology	expected: allowed	1 row(s) affected
nobypassrls	284	PASS	editor can add a purpose	expected: allowed	1 row(s) affected
nobypassrls	285	PASS	editor cannot edit the site	expected: rows0	0 row(s) affected
nobypassrls	286	PASS	editor cannot add members	expected: rls	42501: new row violates row-level security policy for table "org_members"
nobypassrls	287	PASS	editor cannot change a member's role	expected: rows0	0 row(s) affected
nobypassrls	288	PASS	editor cannot mark a purpose as published	expected: priv	42501: permission denied for table purposes
nobypassrls	289	PASS	editor cannot mark a domain as verified	expected: priv	42501: permission denied for table site_domains
nobypassrls	290	PASS	editor cannot choose a domain token	expected: priv	42501: permission denied for table site_domains
nobypassrls	291	PASS	editor cannot read the audit log	expected: true	
nobypassrls	292	PASS	owner can rename the site	expected: allowed	1 row(s) affected
nobypassrls	293	PASS	owner cannot change the site key	expected: priv	42501: permission denied for table sites
nobypassrls	294	PASS	owner cannot set the live config	expected: priv	42501: permission denied for table sites
nobypassrls	295	PASS	owner cannot create a site directly	expected: priv	42501: permission denied for table sites
nobypassrls	296	PASS	owner cannot create an organisation	expected: priv	42501: permission denied for table organisations
nobypassrls	297	PASS	owner cannot point the site at an unknown profile	expected: rule	42501: cmp: unknown regulation profile no-such-profile
nobypassrls	298	PASS	owner cannot edit a regulation profile	expected: priv	42501: permission denied for table regulation_profiles
nobypassrls	299	PASS	owner cannot retire a signing key	expected: priv	42501: permission denied for table signing_keys
nobypassrls	300	PASS	owner reads own audit entries	expected: true	
nobypassrls	301	PASS	audit records the acting member	expected: true	
nobypassrls	302	PASS	owner cannot insert into config_versions	expected: priv	42501: permission denied for table config_versions
nobypassrls	303	PASS	owner cannot insert into receipts	expected: priv	42501: permission denied for table receipts
nobypassrls	304	PASS	owner cannot insert into receipt_seals	expected: priv	42501: permission denied for table receipt_seals
nobypassrls	305	PASS	owner cannot insert into receipt_flags	expected: priv	42501: permission denied for table receipt_flags
nobypassrls	306	PASS	owner cannot insert into ledger_segments	expected: priv	42501: permission denied for table ledger_segments
nobypassrls	307	PASS	owner cannot insert into checkpoints	expected: priv	42501: permission denied for table checkpoints
nobypassrls	308	PASS	owner cannot insert into audit_log	expected: priv	42501: permission denied for table audit_log
nobypassrls	309	PASS	owner cannot insert into violation_reports	expected: priv	42501: permission denied for table violation_reports
nobypassrls	310	PASS	owner cannot insert into regulation_profiles	expected: priv	42501: permission denied for table regulation_profiles
nobypassrls	311	PASS	owner cannot insert into signing_keys	expected: priv	42501: permission denied for table signing_keys
nobypassrls	312	PASS	owner cannot update config_versions	expected: priv	42501: permission denied for table config_versions
nobypassrls	313	PASS	owner cannot update receipts	expected: priv	42501: permission denied for table receipts
nobypassrls	314	PASS	owner cannot update receipt_seals	expected: priv	42501: permission denied for table receipt_seals
nobypassrls	315	PASS	owner cannot update receipt_flags	expected: priv	42501: permission denied for table receipt_flags
nobypassrls	316	PASS	owner cannot update ledger_segments	expected: priv	42501: permission denied for table ledger_segments
nobypassrls	317	PASS	owner cannot update checkpoints	expected: priv	42501: permission denied for table checkpoints
nobypassrls	318	PASS	owner cannot update violation_reports	expected: priv	42501: permission denied for table violation_reports
nobypassrls	319	PASS	owner cannot delete from config_versions	expected: priv	42501: permission denied for table config_versions
nobypassrls	320	PASS	owner cannot delete from receipts	expected: priv	42501: permission denied for table receipts
nobypassrls	321	PASS	owner cannot delete from receipt_seals	expected: priv	42501: permission denied for table receipt_seals
nobypassrls	322	PASS	owner cannot delete from receipt_flags	expected: priv	42501: permission denied for table receipt_flags
nobypassrls	323	PASS	owner cannot delete from ledger_segments	expected: priv	42501: permission denied for table ledger_segments
nobypassrls	324	PASS	owner cannot delete from checkpoints	expected: priv	42501: permission denied for table checkpoints
nobypassrls	325	PASS	owner cannot delete from audit_log	expected: priv	42501: permission denied for table audit_log
nobypassrls	326	PASS	owner cannot delete from violation_reports	expected: priv	42501: permission denied for table violation_reports
nobypassrls	327	PASS	owner cannot delete from regulation_profiles	expected: priv	42501: permission denied for table regulation_profiles
nobypassrls	328	PASS	owner cannot delete from signing_keys	expected: priv	42501: permission denied for table signing_keys
nobypassrls	329	PASS	the only owner cannot demote themselves	expected: rule	42501: cmp: an organisation must keep at least one owner
nobypassrls	330	PASS	the only owner cannot remove themselves	expected: rule	42501: cmp: an organisation must keep at least one owner
nobypassrls	331	PASS	an owner can promote a second owner	expected: allowed	1 row(s) affected
nobypassrls	332	PASS	ownership can be transferred: the first owner steps down	expected: allowed	1 row(s) affected
nobypassrls	333	PASS	the remaining owner cannot then be removed	expected: rule	42501: cmp: an organisation must keep at least one owner
nobypassrls	334	PASS	a non-owner member can be removed	expected: allowed	1 row(s) affected
nobypassrls	335	PASS	organisation A still has exactly one owner	expected: true	
nobypassrls	336	PASS	owner removal is refused outside READ COMMITTED	expected: rule	42501: cmp: owner changes must run in a READ COMMITTED transaction
nobypassrls	337	PASS	deleting the account of a sole owner is refused	expected: rule	42501: cmp: an organisation must keep at least one owner
nobypassrls	338	PASS	service role cannot update receipts	expected: priv	42501: permission denied for table receipts
nobypassrls	339	PASS	service role cannot update receipt_seals	expected: priv	42501: permission denied for table receipt_seals
nobypassrls	340	PASS	service role cannot update receipt_flags	expected: priv	42501: permission denied for table receipt_flags
nobypassrls	341	PASS	service role cannot update config_versions	expected: priv	42501: permission denied for table config_versions
nobypassrls	342	PASS	service role cannot update checkpoints	expected: priv	42501: permission denied for table checkpoints
nobypassrls	343	PASS	service role cannot update audit_log	expected: priv	42501: permission denied for table audit_log
nobypassrls	344	PASS	service role cannot update ledger_segments	expected: priv	42501: permission denied for table ledger_segments
nobypassrls	345	PASS	service role cannot delete from receipts	expected: priv	42501: permission denied for table receipts
nobypassrls	346	PASS	service role cannot delete from receipt_seals	expected: priv	42501: permission denied for table receipt_seals
nobypassrls	347	PASS	service role cannot delete from receipt_flags	expected: priv	42501: permission denied for table receipt_flags
nobypassrls	348	PASS	service role cannot delete from config_versions	expected: priv	42501: permission denied for table config_versions
nobypassrls	349	PASS	service role cannot delete from checkpoints	expected: priv	42501: permission denied for table checkpoints
nobypassrls	350	PASS	service role cannot delete from audit_log	expected: priv	42501: permission denied for table audit_log
nobypassrls	351	PASS	service role cannot delete from ledger_segments	expected: priv	42501: permission denied for table ledger_segments
nobypassrls	352	PASS	service role cannot delete receipts even with the retention flag set	expected: priv	42501: permission denied for table receipts
nobypassrls	353	PASS	service role cannot edit an approved profile	expected: rule	42501: cmp: an approved regulation profile is frozen; create a new version instead
nobypassrls	354	PASS	service role cannot delete a signing key	expected: rule	42501: cmp: a signing key cannot be deleted
nobypassrls	355	PASS	trigger refuses update on receipts	expected: rule	42501: cmp: receipts rows are immutable
nobypassrls	356	PASS	trigger refuses update on receipt_seals	expected: rule	42501: cmp: receipt_seals rows are immutable
nobypassrls	357	PASS	trigger refuses update on receipt_flags	expected: rule	42501: cmp: receipt_flags rows are immutable
nobypassrls	358	PASS	trigger refuses update on config_versions	expected: rule	42501: cmp: config_versions rows are immutable
nobypassrls	359	PASS	trigger refuses update on checkpoints	expected: rule	42501: cmp: checkpoints rows are immutable
nobypassrls	360	PASS	trigger refuses update on audit_log	expected: rule	42501: cmp: audit_log rows are immutable
nobypassrls	361	PASS	trigger refuses delete on receipts	expected: rule	42501: cmp: receipts rows can be removed only by the retention routine
nobypassrls	362	PASS	trigger refuses delete on receipt_seals	expected: rule	42501: cmp: receipt_seals rows can be removed only by the retention routine
nobypassrls	363	PASS	trigger refuses delete on receipt_flags	expected: rule	42501: cmp: receipt_flags rows can be removed only by the retention routine
nobypassrls	364	PASS	trigger refuses delete on config_versions	expected: rule	42501: cmp: config_versions rows cannot be deleted
nobypassrls	365	PASS	trigger refuses delete on checkpoints	expected: rule	42501: cmp: checkpoints rows cannot be deleted
nobypassrls	366	PASS	trigger refuses delete on audit_log	expected: rule	42501: cmp: audit_log rows cannot be deleted
nobypassrls	367	PASS	trigger refuses delete on ledger_segments	expected: rule	42501: cmp: ledger_segments rows cannot be deleted
nobypassrls	368	PASS	a sealed segment's hash cannot change	expected: rule	42501: cmp: a sealed segment can only be marked purged, once
nobypassrls	369	PASS	a segment cannot be marked purged and altered together	expected: rule	42501: cmp: a sealed segment can only be marked purged, once
nobypassrls	370	PASS	a Site A receipt cannot name Site B's config	expected: fk	23503: insert or update on table "receipts" violates foreign key constraint "receipts_config_version_id_site_id_org_id_fkey"
nobypassrls	371	PASS	a receipt cannot carry a profile other than its config's	expected: fk	23503: insert or update on table "receipts" violates foreign key constraint "receipts_config_profile_fk"
nobypassrls	372	PASS	a receipt naming a config must carry a profile	expected: check	23514: new row for relation "receipts" violates check constraint "receipts_profile_required_for_config"
nobypassrls	373	PASS	a receipt cannot carry a hash other than its config's	expected: evidence	23514: cmp: receipt config_hash does not match the referenced config
nobypassrls	374	PASS	a receipt naming a config cannot omit the hash	expected: evidence	23514: cmp: receipt config_hash does not match the referenced config
nobypassrls	375	PASS	a receipt cannot carry a notice version other than its config's	expected: evidence	23514: cmp: receipt notice_version does not match the referenced config
nobypassrls	376	PASS	a receipt matching its config in site, profile, hash and notice version is accepted	expected: allowed	1 row(s) affected
nobypassrls	377	PASS	a migrated record with provenance and no config is accepted	expected: allowed	1 row(s) affected
nobypassrls	378	PASS	a Site A receipt cannot be sealed into Site B's segment	expected: fk	23503: insert or update on table "receipt_seals" violates foreign key constraint "receipt_seals_segment_id_site_id_org_id_fkey"
nobypassrls	379	PASS	a Site A receipt cannot be sealed under Site B's identity	expected: fk	23503: insert or update on table "receipt_seals" violates foreign key constraint "receipt_seals_receipt_id_site_id_org_id_fkey"
nobypassrls	380	PASS	a Site A receipt can be sealed into Site A's segment	expected: allowed	1 row(s) affected
nobypassrls	381	PASS	a Site A checkpoint cannot cover Site B's segment	expected: fk	23503: insert or update on table "checkpoints" violates foreign key constraint "checkpoints_segment_id_site_id_org_id_fkey"
nobypassrls	382	PASS	a checkpoint cannot be signed with a config key	expected: rule	42501: cmp: a checkpoint must be signed with an active checkpoint-signing key
nobypassrls	383	PASS	a flag cannot point at a receipt that does not exist	expected: fk	23503: insert or update on table "receipt_flags" violates foreign key constraint "receipt_flags_receipt_id_site_id_org_id_fkey"
nobypassrls	384	PASS	a Site B flag cannot point at a Site A receipt	expected: fk	23503: insert or update on table "receipt_flags" violates foreign key constraint "receipt_flags_receipt_id_site_id_org_id_fkey"
nobypassrls	385	PASS	a config cannot supersede another site's config	expected: fk	23503: insert or update on table "config_versions" violates foreign key constraint "config_versions_supersedes_id_site_id_org_id_fkey"
nobypassrls	386	PASS	a receipt cannot claim another organisation's site	expected: rule	42501: cmp: row does not belong to the organisation of its site
nobypassrls	387	PASS	a migrated receipt must carry provenance	expected: check	23514: new row for relation "receipts" violates check constraint "receipts_check"
nobypassrls	388	PASS	a captured receipt must name its config	expected: check	23514: new row for relation "receipts" violates check constraint "receipts_check1"
nobypassrls	389	PASS	a violation count cannot be negative	expected: check	23514: new row for relation "violation_reports" violates check constraint "violation_reports_occurrences_check"
nobypassrls	390	PASS	a report cannot name a technology of another site in the same organisation	expected: fk	23503: insert or update on table "violation_reports" violates foreign key constraint "violation_reports_technology_scope_fk"
nobypassrls	391	PASS	a report cannot name a technology of another organisation	expected: fk	23503: insert or update on table "violation_reports" violates foreign key constraint "violation_reports_technology_scope_fk"
nobypassrls	392	PASS	a report can name a technology of its own site	expected: allowed	1 row(s) affected
nobypassrls	393	PASS	a technology named by a report can be deleted	expected: allowed	1 row(s) affected
nobypassrls	394	PASS	deleting the technology clears only technology_id; the report keeps its site and organisation	expected: true	
nobypassrls	395	PASS	a member cannot move a technology to another site of the same organisation	expected: rule	42501: cmp: technology site and organisation cannot change; create a new inventory row
nobypassrls	396	PASS	a member cannot move a technology to another organisation	expected: rule	42501: cmp: row does not belong to the organisation of its site
nobypassrls	397	PASS	a member can still edit a technology's name, vendor and match patterns	expected: allowed	1 row(s) affected
nobypassrls	398	PASS	a member cannot move a translation to another site	expected: rule	42501: cmp: translations site and organisation cannot change
nobypassrls	399	PASS	a technology's site cannot change even for the database owner	expected: rule	42501: cmp: technology site and organisation cannot change; create a new inventory row
nobypassrls	400	PASS	a purpose cannot move to another site	expected: rule	42501: cmp: purposes site and organisation cannot change
nobypassrls	401	PASS	a domain cannot move to another site	expected: rule	42501: cmp: site_domains site and organisation cannot change
nobypassrls	402	PASS	an organisation's vendor cannot move to another organisation	expected: rule	42501: cmp: vendors site and organisation cannot change
nobypassrls	403	PASS	retention routine can remove a segment's receipts	expected: allowed	1 row(s) affected
nobypassrls	404	PASS	the retention flag does not outlive its transaction	expected: true	
nobypassrls	405	PASS	seals are removed with their receipts	expected: true	
nobypassrls	406	PASS	flags are removed with their receipts	expected: true	
nobypassrls	407	PASS	a segment can be marked purged	expected: allowed	1 row(s) affected
nobypassrls	408	PASS	a purged segment cannot be changed again	expected: rule	42501: cmp: a sealed segment can only be marked purged, once
nobypassrls	409	PASS	the segment record survives the purge	expected: true	
nobypassrls	410	PASS	the checkpoint survives the purge	expected: true	
nobypassrls	411	PASS	a published purpose's key cannot change	expected: rule	42501: cmp: a published purpose keeps its identifier; create a new purpose instead
nobypassrls	412	PASS	a published purpose cannot be unpublished	expected: rule	42501: cmp: a published purpose keeps its identifier; create a new purpose instead
nobypassrls	413	PASS	a published purpose cannot be deleted	expected: rule	42501: cmp: a published purpose cannot be deleted; retire it instead
nobypassrls	414	PASS	a published purpose can be retired	expected: allowed	1 row(s) affected
nobypassrls	415	PASS	an unpublished purpose can be deleted	expected: allowed	1 row(s) affected
nobypassrls	416	PASS	a required purpose cannot rest on consent	expected: check	23514: new row for relation "purposes" violates check constraint "purposes_check"
nobypassrls	417	PASS	the live config cannot move outside publishing	expected: rule	42501: cmp: the live config changes only by publishing
nobypassrls	418	PASS	the live config cannot be another site's config	expected: rule	42501: cmp: the live config must be a published config of this site
nobypassrls	419	PASS	publishing can set the site's own config live	expected: allowed	1 row(s) affected
nobypassrls	420	PASS	the publishing flag does not outlive its transaction	expected: true	
nobypassrls	421	PASS	the site key cannot change outside rotation	expected: rule	42501: cmp: the site key changes only by rotation
nobypassrls	422	PASS	a site cannot move to another organisation	expected: rule	42501: cmp: a site cannot move between organisations
nobypassrls	423	PASS	a verified hostname cannot be verified by a second site	expected: unique	23505: duplicate key value violates unique constraint "site_domains_verified_host"
nobypassrls	424	PASS	a config cannot be published under a profile other than the site's default	expected: rule	42501: cmp: a config's profile must be a version of the site's default regulation profile
nobypassrls	425	PASS	the same config publishes once it matches the site's default profile	expected: allowed	1 row(s) affected
nobypassrls	426	PASS	an approved profile's rules cannot be changed	expected: rule	42501: cmp: an approved regulation profile is frozen; create a new version instead
nobypassrls	427	PASS	an approved profile's sources cannot be changed	expected: rule	42501: cmp: an approved regulation profile is frozen; create a new version instead
nobypassrls	428	PASS	an approved profile's effective date cannot be changed	expected: rule	42501: cmp: an approved regulation profile is frozen; create a new version instead
nobypassrls	429	PASS	an approved profile's name cannot be changed	expected: rule	42501: cmp: an approved regulation profile is frozen; create a new version instead
nobypassrls	430	PASS	an approved profile's reviewer cannot be changed	expected: rule	42501: cmp: an approved regulation profile is frozen; create a new version instead
nobypassrls	431	PASS	an approved profile's key cannot be changed	expected: rule	42501: cmp: an approved regulation profile is frozen; create a new version instead
nobypassrls	432	PASS	an approved profile's version number cannot be changed	expected: rule	42501: cmp: an approved regulation profile is frozen; create a new version instead
nobypassrls	433	PASS	an approved profile cannot return to draft	expected: rule	42501: cmp: an approved regulation profile is frozen; create a new version instead
nobypassrls	434	PASS	an approved profile cannot be deleted	expected: rule	42501: cmp: an approved or retired regulation profile cannot be deleted
nobypassrls	435	PASS	a new version of a profile can be created	expected: allowed	1 row(s) affected
nobypassrls	436	PASS	a draft version can be edited	expected: allowed	1 row(s) affected
nobypassrls	437	PASS	the new version can be approved	expected: allowed	1 row(s) affected
nobypassrls	438	PASS	the approved first version is unchanged by the new version	expected: true	
nobypassrls	439	PASS	an approved profile can be retired	expected: allowed	1 row(s) affected
nobypassrls	440	PASS	a retired profile cannot be changed	expected: rule	42501: cmp: a retired regulation profile cannot be changed
nobypassrls	441	PASS	a retired profile cannot be deleted	expected: rule	42501: cmp: an approved or retired regulation profile cannot be deleted
nobypassrls	442	PASS	a draft profile can be deleted	expected: allowed	1 row(s) affected
nobypassrls	443	PASS	a config cannot be published under a retired profile	expected: rule	42501: cmp: a config can be published only under an approved regulation profile
nobypassrls	444	PASS	a signing key's public key cannot change	expected: rule	42501: cmp: a signing key can only be retired, once
nobypassrls	445	PASS	a signing key's purpose cannot change	expected: rule	42501: cmp: a signing key can only be retired, once
nobypassrls	446	PASS	a retired signing key cannot be brought back	expected: rule	42501: cmp: a signing key can only be retired, once
nobypassrls	447	PASS	a signing key cannot be deleted	expected: rule	42501: cmp: a signing key cannot be deleted
nobypassrls	1001	PASS	concurrent deletion of the last two owners leaves one	expected: second removal refused by rule, one owner left	ERROR:  cmp: an organisation must keep at least one owner; owners left: 1
nobypassrls	1002	PASS	concurrent demotion and deletion of the last two owners leaves one	expected: second removal refused by rule, one owner left	ERROR:  cmp: an organisation must keep at least one owner; owners left: 1
nobypassrls	2001	PASS	smoke: migration role is not a superuser	expected: true	platform_owner: bypassrls=false
nobypassrls	2002	PASS	smoke: every SECURITY DEFINER function in cmp is owned by the schema owner with a pinned search path	expected: true	12 functions owned by platform_owner
nobypassrls	2003	PASS	smoke: no request-serving role owns a cmp table or function	expected: true	
nobypassrls	2004	PASS	smoke: anon has no privilege on the cmp schema	expected: true	
nobypassrls	2005	PASS	smoke: anon cannot read receipts	expected: priv	42501: permission denied for schema cmp
nobypassrls	2006	PASS	smoke: anon cannot call the membership helper	expected: priv	42501: permission denied for schema cmp
nobypassrls	2007	PASS	smoke: auth.uid() resolves to the signed-in member	expected: true	c0000000-0000-0000-0000-00000000a002
nobypassrls	2008	PASS	smoke: membership helper: true for own organisation, false for the other	expected: true	
nobypassrls	2009	PASS	smoke: viewer sees exactly their own organisation, site, config and receipt	expected: true	
nobypassrls	2010	PASS	smoke: viewer cannot add a technology	expected: rls	42501: new row violates row-level security policy for table "technologies"
nobypassrls	2011	PASS	smoke: owner can rename own site	expected: allowed	1 row(s)
nobypassrls	2012	PASS	smoke: owner cannot edit the other tenant's site	expected: rows0	0 row(s)
nobypassrls	2013	PASS	smoke: owner cannot change the site key	expected: priv	42501: permission denied for table sites
nobypassrls	2014	PASS	smoke: owner cannot attach a purpose to the other site with a forged org_id	expected: rule	42501: cmp: row does not belong to the organisation of its site
nobypassrls	2015	PASS	smoke: owner cannot add a purpose to the other tenant	expected: rls	42501: new row violates row-level security policy for table "purposes"
nobypassrls	2016	PASS	smoke: owner can add a technology (audit trigger runs)	expected: allowed	1 row(s)
nobypassrls	2017	PASS	smoke: owner reads the audit entry naming them as actor	expected: true	
nobypassrls	2018	PASS	smoke: owner cannot move a technology to another organisation	expected: rule	42501: cmp: row does not belong to the organisation of its site
nobypassrls	2019	PASS	smoke: the only owner cannot demote themselves	expected: rule	42501: cmp: an organisation must keep at least one owner
nobypassrls	2020	PASS	smoke: owner cannot insert a receipt	expected: priv	42501: permission denied for table receipts
nobypassrls	2021	PASS	smoke: service role cannot update a receipt	expected: priv	42501: permission denied for table receipts
nobypassrls	2022	PASS	smoke: service role cannot delete a receipt	expected: priv	42501: permission denied for table receipts
nobypassrls	2023	PASS	smoke: service role cannot edit an approved profile	expected: rule	42501: cmp: an approved regulation profile is frozen; create a new version instead
nobypassrls	2024	PASS	smoke: service role can insert a receipt that matches its config	expected: allowed	1 row(s)
nobypassrls	2025	PASS	smoke: service role cannot insert a receipt with the wrong hash	expected: evidence	23514: cmp: receipt config_hash does not match the referenced config
nobypassrls	2026	PASS	smoke: service role cannot link a Site A receipt to Site B's config	expected: fk	23503: insert or update on table "receipts" violates foreign key constraint "receipts_config_version_id_site_id_org_id_fkey"
nobypassrls	2027	PASS	smoke: the migration role cannot update a receipt	expected: rule	42501: cmp: receipts rows are immutable
nobypassrls	2028	PASS	smoke: the migration role cannot delete a receipt outside retention	expected: rule	42501: cmp: receipts rows can be removed only by the retention routine
```

Check that the two modes agree line for line (outcome, check and expected cause):

```
identical: 477 lines in each mode
```

## 9. Changes to the migration since round 2 (a82571a to 0250cd0)

```diff
diff --git a/drizzle/migrations/0015_cmp_schema.sql b/drizzle/migrations/0015_cmp_schema.sql
index ec7abef..278fdec 100644
--- a/drizzle/migrations/0015_cmp_schema.sql
+++ b/drizzle/migrations/0015_cmp_schema.sql
@@ -8,7 +8,7 @@ REVOKE ALL ON SCHEMA cmp FROM PUBLIC;
 REVOKE ALL ON SCHEMA cmp FROM anon;
 GRANT USAGE ON SCHEMA cmp TO authenticated, service_role;
 
 
 CREATE TABLE cmp.organisations (
   id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
@@ -52,7 +52,7 @@ CREATE TABLE cmp.site_domains (
 -- A hostname can be verified by only one site at a time.
 CREATE UNIQUE INDEX site_domains_verified_host ON cmp.site_domains (hostname) WHERE verified_at IS NOT NULL;
 
 
 CREATE TABLE cmp.regulation_profiles (
   id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
@@ -113,7 +113,8 @@ CREATE TABLE cmp.technologies (
   match_patterns      text[] NOT NULL DEFAULT '{}',
   blocking_strategy   text NOT NULL DEFAULT 'declared' CHECK (blocking_strategy IN ('declared','automatic','signal_only','none')),
   source              text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','scanned')),
-  last_verified_at    timestamptz
+  last_verified_at    timestamptz,
+  CONSTRAINT technologies_scope_uq UNIQUE (id, site_id, org_id)
 );
 CREATE INDEX technologies_site ON cmp.technologies (site_id);
 
@@ -134,7 +135,7 @@ CREATE TABLE cmp.translations (
   PRIMARY KEY (site_id, language, key)
 );
 
 
 CREATE TABLE cmp.signing_keys (
   key_id              text PRIMARY KEY,
@@ -162,8 +163,10 @@ CREATE TABLE cmp.config_versions (
   published_by    uuid NOT NULL,
   published_at    timestamptz NOT NULL DEFAULT now(),
   UNIQUE (site_id, version),
-  -- Target for same-site, same-organisation references from other tables.
+  -- Targets for same-site, same-organisation references from other tables. The second also
+  -- carries the profile, so a receipt is bound to the exact profile its config was published under.
   UNIQUE (id, site_id, org_id),
+  CONSTRAINT config_versions_evidence_uq UNIQUE (id, site_id, org_id, profile_id),
   FOREIGN KEY (supersedes_id, site_id, org_id) REFERENCES cmp.config_versions (id, site_id, org_id),
   FOREIGN KEY (copied_from_id, site_id, org_id) REFERENCES cmp.config_versions (id, site_id, org_id)
 );
@@ -173,7 +176,7 @@ ALTER TABLE cmp.sites
   ADD CONSTRAINT sites_live_config_fk FOREIGN KEY (live_config_id, id, org_id)
   REFERENCES cmp.config_versions (id, site_id, org_id);
 
 
 CREATE TABLE cmp.receipts (
   receipt_id           uuid PRIMARY KEY,                  -- generated in the browser
@@ -201,8 +204,12 @@ CREATE TABLE cmp.receipts (
   CHECK ((action = 'migrated') = (provenance IS NOT NULL)),
   CHECK (action = 'migrated' OR config_version_id IS NOT NULL),
   UNIQUE (receipt_id, site_id, org_id),
-  -- A receipt can only name a config of its own site and organisation.
-  FOREIGN KEY (config_version_id, site_id, org_id) REFERENCES cmp.config_versions (id, site_id, org_id)
+  -- A receipt can only name a config of its own site and organisation, and must carry that
+  -- config's own profile. Hash and notice version are bound to the config by trigger.
+  FOREIGN KEY (config_version_id, site_id, org_id) REFERENCES cmp.config_versions (id, site_id, org_id),
+  CONSTRAINT receipts_config_profile_fk FOREIGN KEY (config_version_id, site_id, org_id, profile_id)
+    REFERENCES cmp.config_versions (id, site_id, org_id, profile_id),
+  CONSTRAINT receipts_profile_required_for_config CHECK (config_version_id IS NULL OR profile_id IS NOT NULL)
 );
 CREATE INDEX receipts_site_received ON cmp.receipts (site_id, received_at);
 CREATE INDEX receipts_visitor ON cmp.receipts (site_id, visitor_id, received_at);
@@ -276,11 +283,15 @@ CREATE TABLE cmp.violation_reports (
   site_id        uuid NOT NULL REFERENCES cmp.sites(id),
   day            date NOT NULL,
   category       text NOT NULL CHECK (category IN ('observed','known_technology','potential_violation')),
-  technology_id  uuid REFERENCES cmp.technologies(id) ON DELETE SET NULL,
+  technology_id  uuid,
   pattern        text NOT NULL DEFAULT '',
   occurrences    integer NOT NULL DEFAULT 0 CHECK (occurrences >= 0),
   views_sampled  integer NOT NULL DEFAULT 0 CHECK (views_sampled >= 0),
-  sample_rate    numeric NOT NULL CHECK (sample_rate > 0 AND sample_rate <= 1)
+  sample_rate    numeric NOT NULL CHECK (sample_rate > 0 AND sample_rate <= 1),
+  -- A report can only name a technology of its own site and organisation. When the technology
+  -- is deleted only technology_id is cleared; the report keeps its site and organisation.
+  CONSTRAINT violation_reports_technology_scope_fk FOREIGN KEY (technology_id, site_id, org_id)
+    REFERENCES cmp.technologies (id, site_id, org_id) ON DELETE SET NULL (technology_id)
 );
 CREATE UNIQUE INDEX violation_reports_bucket ON cmp.violation_reports
   (site_id, day, category, pattern, COALESCE(technology_id, '00000000-0000-0000-0000-000000000000'::uuid));
@@ -298,7 +309,7 @@ CREATE TABLE cmp.audit_log (
 );
 CREATE INDEX audit_log_org ON cmp.audit_log (org_id, at);
 
 
 CREATE FUNCTION cmp.is_member(target_org uuid, min_role text DEFAULT 'viewer')
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = cmp, pg_temp AS $$
@@ -315,7 +326,7 @@ $$;
 REVOKE ALL ON FUNCTION cmp.is_member(uuid, text) FROM PUBLIC;
 GRANT EXECUTE ON FUNCTION cmp.is_member(uuid, text) TO authenticated, service_role;
 
 
 -- A child row must belong to the same organisation as the site (or parents) it hangs from,
 -- so a forged org_id cannot attach data to another tenant's site.
@@ -461,17 +472,19 @@ BEGIN
   RETURN NEW;
 END $$;
 
--- A config can be published only under an approved profile, only while the site's default profile
--- has an approved version, and only signed with an active key issued for signing configs.
+-- A config can be published only under an approved version of the site's default profile, and
+-- only signed with an active key issued for signing configs.
 CREATE FUNCTION cmp.tg_config_guard() RETURNS trigger
 LANGUAGE plpgsql SECURITY DEFINER SET search_path = cmp, pg_temp AS $$
 BEGIN
   IF NOT EXISTS (SELECT 1 FROM cmp.regulation_profiles p WHERE p.id = NEW.profile_id AND p.status = 'approved') THEN
     RAISE EXCEPTION 'cmp: a config can be published only under an approved regulation profile' USING ERRCODE = '42501';
   END IF;
+  -- The config's profile is the site's fallback profile: it must be a version of the site's
+  -- default profile. Country overrides, where used, live inside the signed snapshot (package 2).
   IF NOT EXISTS (SELECT 1 FROM cmp.sites s JOIN cmp.regulation_profiles p ON p.key = s.default_profile
-                 WHERE s.id = NEW.site_id AND p.status = 'approved') THEN
-    RAISE EXCEPTION 'cmp: the site''s default regulation profile has no approved version' USING ERRCODE = '42501';
+                 WHERE s.id = NEW.site_id AND p.id = NEW.profile_id) THEN
+    RAISE EXCEPTION 'cmp: a config''s profile must be a version of the site''s default regulation profile' USING ERRCODE = '42501';
   END IF;
   IF NOT EXISTS (SELECT 1 FROM cmp.signing_keys k
                  WHERE k.key_id = NEW.signing_key_id AND k.purpose = 'config' AND k.retired_at IS NULL) THEN
@@ -523,6 +536,46 @@ BEGIN
   RETURN NULL;
 END $$;
 
+-- A receipt's evidence metadata must be the referenced config's own: same content hash and same
+-- notice version. (Its profile is bound by receipts_config_profile_fk.) Migrated records name no
+-- config and follow the provenance rules instead.
+CREATE FUNCTION cmp.tg_receipt_config() RETURNS trigger
+LANGUAGE plpgsql SECURITY DEFINER SET search_path = cmp, pg_temp AS $$
+DECLARE c cmp.config_versions;
+BEGIN
+  IF NEW.config_version_id IS NULL THEN RETURN NEW; END IF;
+  SELECT * INTO c FROM cmp.config_versions v
+   WHERE v.id = NEW.config_version_id AND v.site_id = NEW.site_id AND v.org_id = NEW.org_id AND v.profile_id = NEW.profile_id;
+  IF c.id IS NULL THEN RETURN NEW; END IF;   -- not this site's config or not its profile: the foreign keys refuse it
+  IF NEW.config_hash IS DISTINCT FROM c.content_hash THEN
+    RAISE EXCEPTION 'cmp: receipt config_hash does not match the referenced config' USING ERRCODE = '23514';
+  END IF;
+  IF NEW.notice_version IS DISTINCT FROM c.notice_version THEN
+    RAISE EXCEPTION 'cmp: receipt notice_version does not match the referenced config' USING ERRCODE = '23514';
+  END IF;
+  RETURN NEW;
+END $$;
+
+-- An inventory row belongs to one site for life. Moving it would leave its purpose mappings
+-- pointing across sites; retire the old row and create a new one instead.
+CREATE FUNCTION cmp.tg_technology_scope_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
+BEGIN
+  IF NEW.site_id IS DISTINCT FROM OLD.site_id OR NEW.org_id IS DISTINCT FROM OLD.org_id THEN
+    RAISE EXCEPTION 'cmp: technology site and organisation cannot change; create a new inventory row' USING ERRCODE = '42501';
+  END IF;
+  RETURN NEW;
+END $$;
+
+-- The same rule for the other site-scoped management rows.
+CREATE FUNCTION cmp.tg_scope_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
+BEGIN
+  IF (to_jsonb(NEW)->>'site_id') IS DISTINCT FROM (to_jsonb(OLD)->>'site_id')
+     OR (to_jsonb(NEW)->>'org_id') IS DISTINCT FROM (to_jsonb(OLD)->>'org_id') THEN
+    RAISE EXCEPTION 'cmp: % site and organisation cannot change', TG_TABLE_NAME USING ERRCODE = '42501';
+  END IF;
+  RETURN NEW;
+END $$;
+
 -- Before and after values of every management change.
 CREATE FUNCTION cmp.tg_audit() RETURNS trigger
 LANGUAGE plpgsql SECURITY DEFINER SET search_path = cmp, pg_temp AS $$
@@ -586,8 +639,20 @@ CREATE TRIGGER signing_key_frozen BEFORE UPDATE OR DELETE ON cmp.signing_keys
   FOR EACH ROW EXECUTE FUNCTION cmp.tg_signing_key_frozen();
 CREATE TRIGGER keep_an_owner AFTER UPDATE OR DELETE ON cmp.org_members
   FOR EACH ROW EXECUTE FUNCTION cmp.tg_keep_an_owner();
-
+CREATE TRIGGER receipt_config BEFORE INSERT ON cmp.receipts
+  FOR EACH ROW EXECUTE FUNCTION cmp.tg_receipt_config();
+CREATE TRIGGER technology_scope_immutable BEFORE UPDATE OF site_id, org_id ON cmp.technologies
+  FOR EACH ROW EXECUTE FUNCTION cmp.tg_technology_scope_immutable();
+CREATE TRIGGER scope_immutable BEFORE UPDATE OF site_id, org_id ON cmp.purposes
+  FOR EACH ROW EXECUTE FUNCTION cmp.tg_scope_immutable();
+CREATE TRIGGER scope_immutable BEFORE UPDATE OF site_id, org_id ON cmp.site_domains
+  FOR EACH ROW EXECUTE FUNCTION cmp.tg_scope_immutable();
+CREATE TRIGGER scope_immutable BEFORE UPDATE OF site_id, org_id ON cmp.translations
+  FOR EACH ROW EXECUTE FUNCTION cmp.tg_scope_immutable();
+CREATE TRIGGER scope_immutable BEFORE UPDATE OF org_id ON cmp.vendors
+  FOR EACH ROW EXECUTE FUNCTION cmp.tg_scope_immutable();
+
 -- Nothing is granted by default. anon gets nothing. Members get exactly the columns they may
 -- set; values the platform owns (site key, tokens, verification, published flags) are not
 -- writable by members at all. The service role gets no UPDATE or DELETE on evidence.
@@ -614,14 +679,19 @@ GRANT INSERT, UPDATE, DELETE ON cmp.organisations, cmp.org_members, cmp.sites, c
 GRANT INSERT ON cmp.config_versions, cmp.receipts, cmp.receipt_seals, cmp.receipt_flags,
       cmp.ledger_segments, cmp.checkpoints, cmp.audit_log TO service_role;
 
+-- Row-level security is enabled on every table but not FORCEd. The tables and the SECURITY
+-- DEFINER functions (membership helper, integrity and audit triggers) share one owner: the role
+-- that runs this migration. As table owner that role is exempt from the policies, which is what
+-- those functions rely on, so the schema needs no BYPASSRLS grant to work and none is made here.
+-- The owner role is an administrative role and never serves a request; anon, authenticated and
+-- service_role are never owners. Tests run with the owner both with and without BYPASSRLS.
 
 DO $$
 DECLARE t text;
 BEGIN
   FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'cmp' LOOP
     EXECUTE format('ALTER TABLE cmp.%I ENABLE ROW LEVEL SECURITY', t);
-    EXECUTE format('ALTER TABLE cmp.%I FORCE ROW LEVEL SECURITY', t);
   END LOOP;
   -- Read-only for members: published config and evidence.
   FOREACH t IN ARRAY ARRAY['config_versions','receipts','receipt_seals','receipt_flags','ledger_segments',
@@ -665,7 +735,7 @@ CREATE POLICY approved_read ON cmp.regulation_profiles FOR SELECT TO authenticat
 CREATE POLICY key_read ON cmp.signing_keys FOR SELECT TO authenticated USING (true);
 CREATE POLICY owner_read ON cmp.audit_log FOR SELECT TO authenticated USING (org_id IS NOT NULL AND cmp.is_member(org_id, 'owner'));
 
 -- Used when a site is created (package 2). Sites may add their own purposes afterwards.
 
 CREATE FUNCTION cmp.seed_standard_purposes(p_site uuid) RETURNS void
@@ -683,7 +753,7 @@ $$;
 REVOKE ALL ON FUNCTION cmp.seed_standard_purposes(uuid) FROM PUBLIC;
 GRANT EXECUTE ON FUNCTION cmp.seed_standard_purposes(uuid) TO service_role;
 
 -- Engineering defaults, seeded as drafts. A profile cannot be used to publish a config until
 -- it is approved, which requires a named reviewer (legal sign-off).
 
@@ -725,7 +795,7 @@ INSERT INTO cmp.regulation_profiles (key, version, name, effective_from, rules,
    "reprompt_on":[]}',
  '[]');
 
 
 INSERT INTO cmp.vendors (org_id, name, domains, country, privacy_url) VALUES
 (NULL, 'Google', ARRAY['google-analytics.com','googletagmanager.com','doubleclick.net','google.com','youtube.com'], 'US', 'https://policies.google.com/privacy'),
```

Lines that only changed a section comment from box-drawing characters to ASCII are omitted from this diff.
