#!/usr/bin/env bash
# Runs the consent-platform database tests on a throwaway local Postgres. For each owner mode:
#   apply migration -> run tests -> concurrency checks -> reverse migration -> apply again.
#
# The migration and tests run as "platform_owner", a non-superuser role like the hosting
# platform's migration role. Two modes show the schema does not depend on BYPASSRLS:
#   bypassrls    the owner has BYPASSRLS (as on the hosting platform)
#   nobypassrls  the owner has no BYPASSRLS
#
# Needs PostgreSQL 15+ server binaries (initdb, pg_ctl) and psql. Usage: npm run test:db
# Environment: CMP_MODES (default "bypassrls nobypassrls"), CMP_MIGRATION (migration file to test),
#              CMP_RESULTS_OUT (write every check's outcome to this file), CMP_TEST_PORT.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MIGRATION="${CMP_MIGRATION:-$ROOT/drizzle/migrations/0015_cmp_schema.sql}"
MODES="${CMP_MODES:-bypassrls nobypassrls}"
BIN="$(pg_config --bindir 2>/dev/null || true)"
[ -x "$BIN/initdb" ] || BIN="$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)"
[ -x "$BIN/initdb" ] || { echo "PostgreSQL server binaries not found"; exit 2; }

WORK="$(mktemp -d)"
PORT="${CMP_TEST_PORT:-54329}"
cp "$ROOT"/drizzle/tests/*.sql "$ROOT"/drizzle/rollback/0015_cmp_schema.down.sql "$WORK"/
cp "$MIGRATION" "$WORK/up.sql"

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

DB=postgres
super() { as_pg psql -X -q -v ON_ERROR_STOP=1 -h "$WORK" -p "$PORT" -U postgres -d "$DB" "$@"; }
run()   { as_pg psql -X -q -v ON_ERROR_STOP=1 -h "$WORK" -p "$PORT" -U platform_owner -d "$DB" "$@"; }

ALL="$WORK/all-results.txt"; : > "$ALL"
FAILED=0

for MODE in $MODES; do
  echo "== owner mode: $MODE =="
  DB=postgres
  super -c "create database cmp_$MODE" >/dev/null
  DB="cmp_$MODE"
  super -f "$WORK/supabase_stubs.sql"
  case "$MODE" in
    bypassrls)   super -c "alter role platform_owner bypassrls" ;;
    nobypassrls) super -c "alter role platform_owner nobypassrls" ;;
    *) echo "unknown mode $MODE"; exit 2 ;;
  esac

  echo "1/5 apply migration"
  run -f "$WORK/up.sql"

  echo "2/5 run tests"
  RESULTS="$WORK/results-$MODE.txt"; : > "$RESULTS"; chmod 666 "$RESULTS"
  run -v results_file="$RESULTS" -f "$WORK/cmp_schema.test.sql" || FAILED=1
  # Belt and braces: the run fails if the results file is empty or holds any non-passing line.
  [ -s "$RESULTS" ] || { echo "FAIL: no test results were written"; FAILED=1; }
  if grep -qv "$(printf '\tPASS\t')" "$RESULTS"; then FAILED=1; fi

  echo "3/5 concurrent owner removal"
  # Two sessions each try to remove a different one of an organisation's last two owners.
  # The second must wait for the first and then be refused, leaving exactly one owner.
  ORG="bbbbbbbb-0000-0000-0000-000000000000"
  O1="b0000000-0000-0000-0000-000000000001"; O2="b0000000-0000-0000-0000-000000000002"
  owners() { run -At -c "select count(*) from cmp.org_members where org_id = '$ORG' and role = 'owner'"; }
  N=1000
  record() { N=$((N+1)); printf '%s\t%s\t%s\texpected: %s\t%s\n' "$N" "$1" "$2" "$3" "$4" >> "$RESULTS"; [ "$1" = PASS ] || FAILED=1; echo "  $1 $2"; }
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
  if [ "$FAILED" = "0" ]; then
    race "concurrent deletion of the last two owners leaves one" \
      "delete from cmp.org_members where org_id = '$ORG' and user_id = '$O1'" \
      "delete from cmp.org_members where org_id = '$ORG' and user_id = '$O2'"
    run -c "insert into cmp.org_members values ('$ORG', '$O1', 'owner')" >/dev/null
    race "concurrent demotion and deletion of the last two owners leaves one" \
      "update cmp.org_members set role = 'editor' where org_id = '$ORG' and user_id = '$O1'" \
      "delete from cmp.org_members where org_id = '$ORG' and user_id = '$O2'"
  fi
  sed "s/^/$MODE\t/" "$RESULTS" >> "$ALL"
  [ "$FAILED" = "0" ] || break

  echo "4/5 reverse migration"
  run -f "$WORK/0015_cmp_schema.down.sql"
  LEFT="$(run -At -c "select count(*) from pg_namespace where nspname = 'cmp'")"
  [ "$LEFT" = "0" ] || { echo "FAIL: cmp schema still present after rollback"; exit 1; }
  LEFT="$(run -At -c "select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'cmp'")"
  [ "$LEFT" = "0" ] || { echo "FAIL: cmp functions still present after rollback"; exit 1; }

  echo "5/5 apply migration again"
  run -f "$WORK/up.sql"
done

if [ -n "${CMP_RESULTS_OUT:-}" ]; then cp "$ALL" "$CMP_RESULTS_OUT"; chmod 644 "$CMP_RESULTS_OUT"; fi
PASSED="$(grep -c "$(printf '\tPASS\t')" "$ALL" || true)"
NOTPASSED="$(grep -vc "$(printf '\tPASS\t')" "$ALL" || true)"
echo "checks: $PASSED passed, $NOTPASSED failed, across modes: $MODES"
[ "$FAILED" = "0" ] || { echo "FAIL: cmp database tests"; exit 1; }
echo "OK: migration applies, passes its tests, reverses and re-applies in every owner mode"
