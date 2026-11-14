# Consent Platform: Package 1 gate decisions (Specification extract)

This is the "Package 1 gate decisions" section of the Technical Specification, copied here so it can be reviewed from the repository. The Specification itself lives in the design document "Consent Platform: Stage 1 Technical Design" (Specification tab) and carries the same text. Where this differs from earlier sections of the Specification, this section governs; the migration is the authority for exact definitions.

## Decisions

**Row-level security is enabled, not forced.** All tables and all privileged functions are owned by the migration role. A table owner is exempt from non-forced policies, which is what the membership helper and the integrity triggers rely on, so the schema needs no bypass privilege and the migration grants none. The migration role is strictly administrative and never serves a request; `anon`, `authenticated` and `service_role` never own anything in `cmp`. The reviewer accepted this on those conditions.

**Evidence stays within one site.** `config_versions`, `receipts`, `ledger_segments` and `technologies` each carry a unique key on record, site and organisation. Every reference between evidence tables is a composite foreign key on those three columns: receipt to config, seal to receipt, seal to segment, checkpoint to segment, flag to receipt, config lineage, the site's live config, and violation report to technology.

**A receipt is bound to its config.** Its profile must be the config's own profile (composite key), and its content hash and notice version must equal the config's (insert trigger, SQLSTATE 23514). Migrated records name no config and follow the provenance rules.

**Scope never changes.** Technologies, purposes, domains, translations and vendors cannot change site or organisation. A move is a retire and a new row.

**Frozen once approved.** An approved regulation profile cannot be edited or deleted; the only change is retirement, and a change of substance is a new version. A reviewer name is required and cannot be blank. Signing keys are immutable apart from a one-time retirement.

**Profile resolution.** A config's profile must be an approved version of the site's default profile; that profile is the fallback. Package 1 does not support country-specific profile resolution.

**Signing keys by purpose.** A config needs an active config-signing key; a checkpoint needs an active checkpoint-signing key.

**An organisation always keeps an owner.** Enforced under a lock on the organisation row. Owner changes are refused outside the default transaction isolation level. Deleting the account of a sole owner is refused until ownership is transferred; the management interface must say so clearly.

**Rollback refuses rather than cascades.** The reverse script checks for anything outside `cmp` that depends on it (views, foreign keys, policies, triggers, columns of a `cmp` type) and for routines outside `cmp` whose body refers to it. If it finds any, it stops with SQLSTATE 2BP01, lists them and changes nothing. There is no override.

## Required in Package 2, before any country override exists

| Receipt field | Purpose |
| --- | --- |
| `config_version_id` | Exact published configuration |
| `profile_id` | Profile associated with that configuration (unchanged from Package 1) |
| `applied_profile_id` | Profile actually applied to the visitor |
| `profile_resolution_reason` | Why that profile was selected |
| `config_hash` | Exact configuration hash |
| `notice_version` | Notice presented |

The applied profile must be validated against the signed configuration snapshot and its resolution rules. The country-to-profile overrides live inside the snapshot, every profile it references must be approved and in force, and the whole mapping is covered by the hash and signature.

## Hosting validation: what has and has not been shown

| Evidence | Status |
| --- | --- |
| Full suite, concurrency checks, rollback-safety checks and mutation tests | Local PostgreSQL 16 only, as a non-superuser owner with and without the bypass privilege |
| Apply, 28-check smoke test under the platform's roles, reverse, re-apply | Run on a separate, empty Supabase project (PostgreSQL 17.6). The earlier reverse script was used; the revised one has not been run there |
| The migration role on that platform | Not a superuser; has the bypass privilege natively. A role without it has been tested only locally |
| Lovable Cloud itself | Not validated. It has no staging database; this is a post-merge checkpoint |
| Requests through the platform's HTTP API | Not tested. Roles were assumed in SQL with the sign-in identity set through request settings |
| Clean-up of the separate test project | Outstanding, pending explicit approval |

## Release procedure requirements recorded by the reviewer

- Verify the migration's SHA-256 checksum against the reviewed commit before it is applied anywhere.
- Keep `npm run test:db` and `npm run test:db:mutations` as permanent regression suites, including the check that a failed test fails the run.
- Preserve receipt immutability through every future migration.
- Repeat the owner-concurrency checks on a hosting platform when that becomes feasible.
