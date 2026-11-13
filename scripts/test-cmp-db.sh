#!/usr/bin/env bash
# Runs the consent-platform database tests on a throwaway local Postgres:
#   apply migration -> run tests -> reverse migration -> apply again.
# Needs PostgreSQL server binaries (initdb, pg_ctl) and psql. Usage: npm run test:db
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BIN="$(pg_config --bindir 2>/dev/null || true)"
[ -x "$BIN/initdb" ] || BIN="$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)"
[ -x "$BIN/initdb" ] || { echo "PostgreSQL server binaries not found"; exit 2; }

WORK="$(mktemp -d)"
PORT="${CMP_TEST_PORT:-54329}"
cp "$ROOT"/drizzle/tests/*.sql "$ROOT"/drizzle/migrations/0015_cmp_schema.sql "$ROOT"/drizzle/rollback/0015_cmp_schema.down.sql "$WORK"/

# Postgres will not run as root; use the postgres account when we are root.
if [ "$(id -u)" = "0" ]; then
  chown -R postgres "$WORK"; chmod 755 "$WORK"
  as_pg() { runuser -u postgres -- "$@"; }
else
  as_pg() { "$@"; }
fi

cleanup() { as_pg "$BIN/pg_ctl" -D "$WORK/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$WORK"; }
trap cleanup EXIT

as_pg "$BIN/initdb" -D "$WORK/data" -U postgres -A trust >/dev/null
as_pg "$BIN/pg_ctl" -D "$WORK/data" -o "-p $PORT -c listen_addresses='' -k $WORK" -l "$WORK/log" -w start >/dev/null

run() { as_pg psql -X -q -v ON_ERROR_STOP=1 -h "$WORK" -p "$PORT" -U postgres -d postgres "$@"; }

echo "1/4 apply migration"
run -f "$WORK/supabase_stubs.sql"
run -f "$WORK/0015_cmp_schema.sql"

echo "2/4 run tests"
run -f "$WORK/cmp_schema.test.sql"

echo "3/4 reverse migration"
run -f "$WORK/0015_cmp_schema.down.sql"
LEFT="$(run -At -c "select count(*) from pg_namespace where nspname = 'cmp'")"
[ "$LEFT" = "0" ] || { echo "FAIL: cmp schema still present after rollback"; exit 1; }

echo "4/4 apply migration again"
run -f "$WORK/0015_cmp_schema.sql"
echo "OK: migration applies, passes its tests, reverses and re-applies"
