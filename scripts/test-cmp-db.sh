#!/usr/bin/env bash
# Runs the consent-platform database tests on a throwaway local Postgres:
#   apply migration -> run tests -> concurrency checks -> reverse migration -> apply again.
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

echo "1/5 apply migration"
run -f "$WORK/supabase_stubs.sql"
run -f "$WORK/0015_cmp_schema.sql"

echo "2/5 run tests"
RESULTS="$WORK/results.txt"
run -v results_file="$RESULTS" -f "$WORK/cmp_schema.test.sql"

echo "3/5 concurrent owner removal"
# Two sessions each try to remove a different one of an organisation's last two owners.
# The second must wait for the first and then be refused, leaving exactly one owner.
ORG="bbbbbbbb-0000-0000-0000-000000000000"
O1="b0000000-0000-0000-0000-000000000001"; O2="b0000000-0000-0000-0000-000000000002"
owners() { run -At -c "select count(*) from cmp.org_members where org_id = '$ORG' and role = 'owner'"; }
N=1000
record() { N=$((N+1)); printf '%s\t%s\t%s\texpected: %s\t%s\n' "$N" "$1" "$2" "$3" "$4" >> "$RESULTS"; [ "$1" = PASS ] || FAILED=1; echo "  $1 $2"; }
FAILED=0
race() { # $1 label, $2 first session statement, $3 second session statement
  [ "$(owners)" = "2" ] || { record FAIL "$1" "two owners before the race" "setup: $(owners) owners"; return; }
  run -c "begin; $2; select pg_sleep(2); commit;" >/dev/null &
  FIRST=$!
  sleep 0.7
  OUT="$(run -c "$3" 2>&1)" && SECOND=ok || SECOND=refused
  wait "$FIRST"
  LEFT="$(owners)"
  if [ "$SECOND" = refused ] && echo "$OUT" | grep -q "cmp: an organisation must keep at least one owner" && [ "$LEFT" = "1" ]; then
    record PASS "$1" "second removal refused by rule, one owner left" "$(echo "$OUT" | grep -o 'ERROR.*' | head -1); owners left: $LEFT"
  else
    record FAIL "$1" "second removal refused by rule, one owner left" "second session: $SECOND; owners left: $LEFT; $OUT"
  fi
}
race "concurrent deletion of the last two owners leaves one" \
  "delete from cmp.org_members where org_id = '$ORG' and user_id = '$O1'" \
  "delete from cmp.org_members where org_id = '$ORG' and user_id = '$O2'"
run -c "insert into cmp.org_members values ('$ORG', '$O1', 'owner')" >/dev/null
race "concurrent demotion and deletion of the last two owners leaves one" \
  "update cmp.org_members set role = 'editor' where org_id = '$ORG' and user_id = '$O1'" \
  "delete from cmp.org_members where org_id = '$ORG' and user_id = '$O2'"
[ "$FAILED" = "0" ] || { echo "FAIL: concurrency checks"; exit 1; }
[ -n "${CMP_RESULTS_OUT:-}" ] && cp "$RESULTS" "$CMP_RESULTS_OUT" && chmod 644 "$CMP_RESULTS_OUT"

echo "4/5 reverse migration"
run -f "$WORK/0015_cmp_schema.down.sql"
LEFT="$(run -At -c "select count(*) from pg_namespace where nspname = 'cmp'")"
[ "$LEFT" = "0" ] || { echo "FAIL: cmp schema still present after rollback"; exit 1; }

echo "5/5 apply migration again"
run -f "$WORK/0015_cmp_schema.sql"
echo "OK: migration applies, passes its tests, reverses and re-applies"
