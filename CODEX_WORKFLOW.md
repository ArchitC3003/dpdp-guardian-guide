# Codex development workflow

This repository is a Lovable-managed Vite + React + TypeScript application. Codex must preserve the existing product architecture and the repository-specific rules in `AGENTS.md`. Read `AGENTS.md`, this document, and the relevant source files before changing code.

## Working agreement

1. Start from the latest `main`; create a focused branch named `feat/<short-name>`, `fix/<short-name>`, or `chore/<short-name>`.
2. Do not commit directly to `main`. Keep changes small and explain the reason for each meaningful change.
3. Preserve Lovable compatibility. Do not remove Lovable plugins, generated integration files, Supabase configuration, Drizzle configuration, lockfiles, or existing dependency overrides without a documented reason and explicit review.
4. Do not overwrite work from Lovable or another contributor. Fetch/rebase the latest base branch before opening a PR and resolve conflicts deliberately.
5. Before finishing, run `npm ci`, `npm run lint`, `npm test`, `npm run build`, and `npm run audit` where the environment permits. Report commands not run and their reason; never claim a check passed without running it.
6. Open a pull request with a summary, rationale, risk assessment, test evidence, migration/deployment notes, and screenshots for UI changes.

## Security and privacy constraints

- Treat this as a privacy and compliance product. Minimize personal data, avoid logging personal data or secrets, and use synthetic data in tests and examples.
- Never commit `.env`, `.env.local`, credentials, service-role keys, database passwords, access tokens, customer exports, production data, or private certificates.
- Browser-exposed `VITE_*` variables are public configuration, not secrets. Never put privileged credentials in them. Use server-side functions and narrowly scoped secrets for privileged operations.
- Preserve Supabase Row Level Security, database constraints, authorization checks, consent/notice evidence, audit trails, and server-side validation. Never weaken a control merely to make a test pass.
- Validate authorization on the server/database boundary; hiding a UI control is not access control. Keep anonymous/public operations narrowly scoped and rate-limited.
- For security-sensitive changes, add negative tests for unauthenticated, unauthorized, malformed, and cross-tenant access where applicable.
- Do not run destructive production migrations, alter production data, rotate credentials, or change deployed secrets as part of a code task.

## Database and Lovable coordination

Follow the migration and release process in `AGENTS.md`. Inspect existing Drizzle/Supabase migrations before creating a new one. Keep schema changes, generated types, application code, and tests consistent. Never assume a migration has been applied to Lovable Cloud; state the exact manual deployment step in the PR.

## Definition of done

- Scope is limited to the requested change; unrelated formatting/refactors are excluded.
- Lint, tests, production build, and security audit results are reported accurately.
- No secrets or real personal data are added.
- Documentation, migration notes, and regression tests are updated where needed.
- A PR is ready for human review; do not merge unless explicitly instructed.
