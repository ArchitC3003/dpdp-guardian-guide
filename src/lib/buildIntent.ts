import { DOCUMENT_TYPES } from "@/components/policy-builder/types";

/**
 * Carries "I want to build this artefact" from a public Learn page, through sign-in, into the Policy and SOP Builder.
 * Only a known builder document type is ever stored or acted on, so the value cannot steer navigation anywhere else.
 */
const KEY = "privcybhub_build_intent";
export const BUILDER_PATH = "/policy-sop-builder";

export function isBuilderDocumentType(v: string | null | undefined): v is (typeof DOCUMENT_TYPES)[number]["value"] {
  return !!v && DOCUMENT_TYPES.some((d) => d.value === v);
}
export function builderDocumentLabel(v: string | null | undefined): string | null {
  return DOCUMENT_TYPES.find((d) => d.value === v)?.label ?? null;
}
/** Where the builder opens for a document type; the plain builder when the type is unknown or missing. */
export function builderPath(documentType?: string | null): string {
  return isBuilderDocumentType(documentType) ? `${BUILDER_PATH}?documentType=${encodeURIComponent(documentType)}` : BUILDER_PATH;
}

/** Remember what the visitor chose to build. An artefact with no builder type still sends them to the builder. */
export function saveBuildIntent(documentType?: string | null) {
  try { sessionStorage.setItem(KEY, isBuilderDocumentType(documentType) ? documentType : "any"); } catch { /* storage unavailable: sign-in still works */ }
}
export function clearBuildIntent() {
  try { sessionStorage.removeItem(KEY); } catch { /* nothing to clear */ }
}
/** Where to go after sign-in: the builder if the visitor asked to build something, otherwise the dashboard. */
export function postSignInPath(): string {
  let v: string | null = null;
  try { v = sessionStorage.getItem(KEY); } catch { /* fall through to the dashboard */ }
  return v ? builderPath(v) : "/dashboard";
}
