# Exact repository citation corrections

## Scope
- Edit only `src/data/repositoryData.ts`.
- Apply only the quoted replacements and deletions in the uploaded instruction file.
- Preserve all existing placeholders, surrounding content, formatting, object structure, and template wording not explicitly listed.

## Implementation
1. Replace each specified requirement label, `dpdpRef`, statutory citation, legal-basis sentence, penalty statement, timeline, and template phrase at its matching current location.
2. Delete only the two explicitly identified fragments:
   - the `Independent Data Fiduciary` option line;
   - the Rule 14 wording from the Data Sharing Agreement recital.
3. Add the four requested comments immediately above their affected template/object entry:
   - `TODO(LEGAL-REVIEW-E1)` for fraud/security;
   - `TODO(LEGAL-REVIEW-E2)` for CCTV references and strictly necessary cookies;
   - `TODO(VERIFY)` for breach-notification content.
4. Replace the three-row Sec 7 table with the supplied nine-row table, preserving its existing columns and placeholders.
5. Apply repeated-reference corrections at every explicitly listed occurrence, including Phase 3 evidence items and Phase 4–6 repository entries.

## Verification
- Compare the resulting file against every instruction row and confirm each old fragment is absent from its intended location and each replacement is present.
- Check that no file other than `src/data/repositoryData.ts` changed.
- Confirm the app still builds successfully.
- Return the requested audit table with `line | old | new`, plus a separate list of any instruction rows that could not be located. Current inspection found matching text or the explicitly allowed equivalent wording for all requested rows.
