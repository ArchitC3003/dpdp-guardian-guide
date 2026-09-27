# Exact policy and sector citation corrections

## Scope
- Update only `AssessmentRepoGenerator.tsx` and `sectorIntelligence.ts`.
- Replace only the exact text fragments listed in the uploaded task.
- Preserve bullets, template expressions, newline formatting, and surrounding code.
- Add the specified verification and legal-review comments directly above the affected entries.
- Do not connect sector intelligence to any component.

## Verification
- Confirm every requested old fragment was found and every replacement is present.
- Check both files parse and the preview build remains successful.
- Return a file-and-line change table, including any requested item not located.
