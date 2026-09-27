# Exact assessment and policy-builder citation corrections

## Scope
- Edit only `src/data/assessmentDomains.ts` and `src/components/policy-builder/mockResponses.ts`.
- Change only the fragments listed in the uploaded instruction file; preserve all other wording and formatting.

## Changes
1. In the assessment catalogue, update the specified Act/Rule references and supporting descriptions across Domains A, B, D, E, G, H, I, J, K, L, and M.
2. Update the Consent Manager and children special-status hints exactly as supplied.
3. In the policy-builder sample response, correct both penalty statements, the Section 7 lawful-basis wording, the data-minimisation reference, and the grievance contact wording.
4. Delete only the two specified lawful-basis lines for “Legal Obligation” and “Vital Interest.”

## Verified current state
- All requested fragments are present in their intended locations.
- The G.3 source uses the equivalent wording `Grievance redress ≤90 days (Sec 13)` rather than the uploaded shorthand `Grievance redress 90 days (Sec 13)`; only that matching phrase will be replaced.

## Verification
- Confirm every old fragment is removed from its intended location and every replacement is present.
- Confirm only the two named files changed.
- Confirm both files parse and the automatic app build succeeds.
- Return the requested `file | item/line | old | new` change table.
