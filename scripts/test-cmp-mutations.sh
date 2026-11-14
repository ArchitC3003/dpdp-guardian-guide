#!/usr/bin/env bash
# Mutation tests for the consent-platform schema: remove one control at a time from a copy of the
# migration (or of the rollback script) and confirm the unchanged test suite fails, naming the check that should catch it.
# A mutation that still passes means the suite does not cover that control.
# Usage: npm run test:db:mutations
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/drizzle/migrations/0015_cmp_schema.sql"
DOWN="$ROOT/drizzle/rollback/0015_cmp_schema.down.sql"
TMP="$(mktemp -d)"; chmod 755 "$TMP"; trap 'rm -rf "$TMP"' EXIT

python3 - "$SRC" "$TMP" "$DOWN" <<'EOF'
import sys
src, out, down = sys.argv[1], sys.argv[2], sys.argv[3]
base = open(src).read()
down_base = open(down).read()
# name | check that must fail | list of (find, replace)
mutations = [
 ("receipt-config-site-key", "a Site A receipt cannot name Site B's config", [
   ("  FOREIGN KEY (config_version_id, site_id, org_id) REFERENCES cmp.config_versions (id, site_id, org_id),\n",
    "  FOREIGN KEY (config_version_id) REFERENCES cmp.config_versions (id),\n"),
   ("  CONSTRAINT receipts_config_profile_fk FOREIGN KEY (config_version_id, site_id, org_id, profile_id)\n    REFERENCES cmp.config_versions (id, site_id, org_id, profile_id),\n", "")]),
 ("receipt-profile-key", "a receipt cannot carry a profile other than its config's", [
   ("  CONSTRAINT receipts_config_profile_fk FOREIGN KEY (config_version_id, site_id, org_id, profile_id)\n    REFERENCES cmp.config_versions (id, site_id, org_id, profile_id),\n", "")]),
 ("receipt-config-trigger", "a receipt cannot carry a hash other than its config's", [
   ("CREATE TRIGGER receipt_config BEFORE INSERT ON cmp.receipts\n  FOR EACH ROW EXECUTE FUNCTION cmp.tg_receipt_config();\n", "")]),
 ("seal-segment-site-key", "a Site A receipt cannot be sealed into Site B's segment", [
   ("ON DELETE CASCADE,\n  FOREIGN KEY (segment_id, site_id, org_id) REFERENCES cmp.ledger_segments (id, site_id, org_id)\n);",
    "ON DELETE CASCADE,\n  FOREIGN KEY (segment_id) REFERENCES cmp.ledger_segments (id)\n);")]),
 ("violation-technology-scope-key", "a report cannot name a technology of another site in the same organisation", [
   ("  CONSTRAINT violation_reports_technology_scope_fk FOREIGN KEY (technology_id, site_id, org_id)\n    REFERENCES cmp.technologies (id, site_id, org_id) ON DELETE SET NULL (technology_id)\n",
    "  CONSTRAINT violation_reports_technology_scope_fk FOREIGN KEY (technology_id)\n    REFERENCES cmp.technologies (id) ON DELETE SET NULL\n")]),
 ("technology-scope-trigger", "a member cannot move a technology to another site of the same organisation", [
   ("CREATE TRIGGER technology_scope_immutable BEFORE UPDATE OF site_id, org_id ON cmp.technologies\n  FOR EACH ROW EXECUTE FUNCTION cmp.tg_technology_scope_immutable();\n", "")]),
 ("profile-frozen-trigger", "an approved profile's rules cannot be changed", [
   ("CREATE TRIGGER profile_frozen BEFORE UPDATE OR DELETE ON cmp.regulation_profiles\n  FOR EACH ROW EXECUTE FUNCTION cmp.tg_profile_frozen();\n", "")]),
 ("keep-an-owner-trigger", "the only owner cannot demote themselves", [
   ("CREATE TRIGGER keep_an_owner AFTER UPDATE OR DELETE ON cmp.org_members\n  FOR EACH ROW EXECUTE FUNCTION cmp.tg_keep_an_owner();\n", "")]),
 ("evidence-read-policy", "A viewer reads no other-tenant rows in receipts", [
   ("    EXECUTE format('CREATE POLICY member_read ON cmp.%I FOR SELECT TO authenticated USING (cmp.is_member(org_id))', t);\n  END LOOP;\n  -- Read by members, written by editors.",
    "    EXECUTE format('CREATE POLICY member_read ON cmp.%I FOR SELECT TO authenticated USING (true)', t);\n  END LOOP;\n  -- Read by members, written by editors.")]),
 ("evidence-no-update-trigger", "trigger refuses update on receipts", [
   ("  FOREACH t IN ARRAY ARRAY['receipts','receipt_seals','receipt_flags','config_versions','checkpoints','audit_log'] LOOP\n    EXECUTE format('CREATE TRIGGER no_update",
    "  FOREACH t IN ARRAY ARRAY['receipt_seals','receipt_flags','config_versions','checkpoints','audit_log'] LOOP\n    EXECUTE format('CREATE TRIGGER no_update")]),
 ("config-key-purpose", "a config cannot be signed with a checkpoint key", [
   ("WHERE k.key_id = NEW.signing_key_id AND k.purpose = 'config' AND k.retired_at IS NULL", "WHERE k.key_id = NEW.signing_key_id AND k.retired_at IS NULL")]),
]
# The same, applied to the rollback script instead of the migration.
rollback_mutations = [
 ("rollback-dependency-check", "rollback refuses while a view outside cmp selects from it", [
   ("  WHERE ref_ns = ns AND dep_ns IS DISTINCT FROM ns;", "  WHERE false;")]),
 ("rollback-routine-scan", "rollback refuses while a routine outside cmp refers to it in its body", [
   ("    AND p.prosrc ~* '\\mcmp\\.[a-z_]';", "    AND false;")]),
]
with open(out + "/list.txt", "w") as lst:
    for target, text, group in (("up", base, mutations), ("down", down_base, rollback_mutations)):
        for name, check, edits in group:
            s = text
            for a, b in edits:
                if s.count(a) != 1:
                    sys.exit(f"mutation {name}: pattern found {s.count(a)} times, expected 1")
                s = s.replace(a, b)
            open(f"{out}/{name}.sql", "w").write(s)
            lst.write(f"{name}\t{check}\t{target}\n")
EOF
[ $? -eq 0 ] || exit 2

BAD=0; N=0
while IFS=$'\t' read -r NAME CHECK TARGET; do
  N=$((N+1))
  if [ "$TARGET" = "down" ]; then UP="$SRC"; DN="$TMP/$NAME.sql"; else UP="$TMP/$NAME.sql"; DN="$DOWN"; fi
  OUT="$(CMP_MODES=bypassrls CMP_MIGRATION="$UP" CMP_ROLLBACK="$DN" CMP_TEST_PORT="${CMP_TEST_PORT:-54331}" bash "$ROOT/scripts/test-cmp-db.sh" 2>&1)"; CODE=$?
  FAILS="$(echo "$OUT" | grep -cE '^FAIL: .* \[expected |^  FAIL ' || true)"
  if [ "$CODE" -ne 0 ] && { echo "$OUT" | grep -qF "FAIL: $CHECK [" || echo "$OUT" | grep -qF "  FAIL $CHECK"; }; then
    echo "CAUGHT    $NAME: suite failed ($FAILS checks), including \"$CHECK\""
  else
    echo "NOT CAUGHT $NAME: expected \"$CHECK\" to fail (exit $CODE, $FAILS failed checks)"; BAD=1
  fi
done < "$TMP/list.txt"
[ "$BAD" = "0" ] || { echo "FAIL: at least one removed control was not detected"; exit 1; }
echo "OK: all $N removed controls were detected"
