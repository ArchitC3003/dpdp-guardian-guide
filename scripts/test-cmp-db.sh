#!/usr/bin/env bash
# Runs the consent-platform database tests on a throwaway local Postgres. For each owner mode:
#   apply migration -> run tests -> concurrency checks -> rollback safety -> reverse -> apply again.
#
# The migration and tests run as "platform_owner", a non-superuser role like the hosting
# platform's migration role. Two modes show the schema does not depend on BYPASSRLS:
#   bypassrls    the owner has BYPASSRLS (as on the hosting platform)
#   nobypassrls  the owner has no BYPASSRLS
#
# Needs PostgreSQL 15+ server binaries (initdb, pg_ctl) and psql. Usage: npm run test:db
# Environment: CMP_MODES (default "bypassrls nobypassrls"), CMP_MIGRATION and CMP_ROLLBACK (files to test),
#              CMP_RESULTS_OUT (write every check's outcome to this file), CMP_TEST_PORT.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MIGRATION="${CMP_MIGRATION:-$ROOT/drizzle/migrations/0015_cmp_schema.sql}"
ROLLBACK="${CMP_ROLLBACK:-$ROOT/drizzle/rollback/0015_cmp_schema.down.sql}"
MODES="${CMP_MODES:-bypassrls nobypassrls}"
BIN="$(pg_config --bindir 2>/dev/null || true)"
[ -x "$BIN/initdb" ] || BIN="$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)"
[ -x "$BIN/initdb" ] || { echo "PostgreSQL server binaries not found"; exit 2; }

WORK="$(mktemp -d)"
PORT="${CMP_TEST_PORT:-54329}"
cp "$ROOT"/drizzle/tests/*.sql "$WORK"/
cp "$MIGRATION" "$WORK/up.sql"
cp "$ROLLBACK" "$WORK/down.sql"

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

  echo "4/5 rollback safety, then reverse migration"
  # The rollback must refuse, changing nothing, while anything outside cmp depends on it.
  # Each case creates one such object in another schema, runs the rollback, and checks that it was
  # refused with SQLSTATE 2BP01 naming that object and nothing else, and that the object and cmp are
  # both still there.
  N=3000
  run -c "create schema if not exists ext" >/dev/null
  refuses() { # $1 label, $2 create statement, $3 text the refusal must name, $4 query proving survival, $5 drop statement
    run -c "$2" >/dev/null
    OUT="$(run -v VERBOSITY=verbose -f "$WORK/down.sql" 2>&1)" && CODE=0 || CODE=$?
    KEPT="$(run -At -c "select ($4)::int::text || ',' || (select count(*) from pg_namespace where nspname = 'cmp') || ',' || (select count(*) from pg_tables where schemaname = 'cmp')")"
    if [ "$CODE" -ne 0 ] && echo "$OUT" | grep -q "ERROR:  2BP01: cmp rollback refused" && echo "$OUT" | grep -qF "$3" && ! echo "$OUT" | grep -q "pg_toast" && [ "$(echo "$OUT" | grep -o 'ERROR:.*' | head -1 | tr ';' '\n' | wc -l)" = "1" ] && [ "$KEPT" = "1,1,19" ]; then
      record PASS "$1" "refused with 2BP01 naming the object; object and cmp intact" "$(echo "$OUT" | grep -o 'ERROR:.*' | head -1 | cut -c1-220); kept=$KEPT"
    else
      record FAIL "$1" "refused with 2BP01 naming the object; object and cmp intact" "exit=$CODE kept=$KEPT $(echo "$OUT" | tr '\n' ' ' | cut -c1-300)"
    fi
    run -c "$5" >/dev/null
  }
  refuses "rollback refuses while a view outside cmp selects from it" \
    "create view ext.vendor_names as select name from cmp.vendors" "view ext.vendor_names" \
    "select count(*) = 1 from pg_views where schemaname = 'ext' and viewname = 'vendor_names'" "drop view ext.vendor_names"
  refuses "rollback refuses while a table outside cmp has a foreign key into it" \
    "create table ext.billing (org_id uuid references cmp.organisations(id))" "ext.billing" \
    "select count(*) = 1 from pg_constraint where conrelid = 'ext.billing'::regclass and contype = 'f'" "drop table ext.billing"
  refuses "rollback refuses while a policy outside cmp calls a cmp function" \
    "create table ext.notes (org_id uuid); alter table ext.notes enable row level security; create policy members on ext.notes using (cmp.is_member(org_id))" "policy members on table ext.notes" \
    "select count(*) = 1 from pg_policies where schemaname = 'ext' and policyname = 'members'" "drop table ext.notes"
  refuses "rollback refuses while a trigger outside cmp uses a cmp function" \
    "create table ext.frozen (id int); create trigger no_update before update on ext.frozen for each row execute function cmp.tg_no_update()" "trigger no_update on table ext.frozen" \
    "select count(*) = 1 from pg_trigger where tgrelid = 'ext.frozen'::regclass and not tgisinternal" "drop table ext.frozen"
  refuses "rollback refuses while a column outside cmp uses a cmp row type" \
    "create table ext.snapshots (v cmp.vendors)" "ext.snapshots" \
    "select count(*) = 1 from information_schema.columns where table_schema = 'ext' and table_name = 'snapshots' and column_name = 'v'" "drop table ext.snapshots"
  refuses "rollback refuses while a routine outside cmp refers to it in its body" \
    "create function ext.org_count() returns bigint language plpgsql as \$f\$ begin return (select count(*) from cmp.organisations); end \$f\$" "ext.org_count()" \
    "select count(*) = 1 from pg_proc where oid = 'ext.org_count()'::regprocedure" "drop function ext.org_count()"
  run -c "create table ext.unrelated (id int); insert into ext.unrelated values (1)" >/dev/null
  sed "s/^/$MODE\t/" "$RESULTS" | awk -F'\t' '$2 > 3000' >> "$ALL"
  [ "$FAILED" = "0" ] || break

  run -f "$WORK/down.sql"
  LEFT="$(run -At -c "select count(*) from pg_namespace where nspname = 'cmp'")"
  [ "$LEFT" = "0" ] || { echo "FAIL: cmp schema still present after rollback"; exit 1; }
  LEFT="$(run -At -c "select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'cmp'")"
  [ "$LEFT" = "0" ] || { echo "FAIL: cmp functions still present after rollback"; exit 1; }
  KEPT="$(run -At -c "select count(*) from ext.unrelated")"
  if [ "$KEPT" = "1" ]; then S3=PASS; else S3=FAIL; FAILED=1; fi
  printf '%s\t3099\t%s\trollback with no dependants removes cmp and leaves an unrelated table untouched\texpected: cmp gone, ext.unrelated has 1 row\tcmp schemas=%s, ext.unrelated rows=%s\n' "$MODE" "$S3" "$LEFT" "$KEPT" >> "$ALL"
  echo "  $S3 rollback with no dependants removes cmp and leaves an unrelated table untouched"
  [ "$FAILED" = "0" ] || break

  echo "5/5 apply migration again, then the platform smoke test on the fresh schema"
  run -f "$WORK/up.sql"
  SMOKE="$(run -At -F "$(printf '\t')" -f "$WORK/cmp_platform_smoke.sql" | grep -E "^[0-9]+$(printf '\t')(PASS|FAIL)" || true)"
  [ -n "$SMOKE" ] || { echo "FAIL: platform smoke test produced no results"; FAILED=1; }
  echo "$SMOKE" | awk -F'\t' -v m="$MODE" '{printf "%s\t%d\t%s\tsmoke: %s\texpected: %s\t%s\n", m, 2000+$1, $2, $3, $4, $5}' >> "$ALL"
  if echo "$SMOKE" | grep -q "$(printf '\tFAIL\t')"; then echo "$SMOKE" | grep "$(printf '\tFAIL\t')"; FAILED=1; break; fi
  echo "  smoke: $(echo "$SMOKE" | wc -l) checks passed"
done

if [ -n "${CMP_RESULTS_OUT:-}" ]; then cp "$ALL" "$CMP_RESULTS_OUT"; chmod 644 "$CMP_RESULTS_OUT"; fi
PASSED="$(grep -c "$(printf '\tPASS\t')" "$ALL" || true)"
NOTPASSED="$(grep -vc "$(printf '\tPASS\t')" "$ALL" || true)"
echo "checks: $PASSED passed, $NOTPASSED failed, across modes: $MODES"
[ "$FAILED" = "0" ] || { echo "FAIL: cmp database tests"; exit 1; }
echo "OK: migration applies, passes its tests, reverses and re-applies in every owner mode"
