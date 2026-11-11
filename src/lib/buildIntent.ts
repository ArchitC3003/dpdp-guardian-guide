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
  try { sessionStorage.removeItem(KEY); sessionStorage.removeItem(ROUTE_KEY); } catch { /* nothing to clear */ }
}

/**
 * Carries "take me to this stage" from the landing page through sign-in. Only the routes listed here are ever
 * stored or acted on, and the choice expires, so a stale value cannot redirect a later sign-in.
 */
const ROUTE_KEY = "privcybhub_route_intent";
const ROUTE_TTL_MS = 15 * 60 * 1000;
export const RESUMABLE_ROUTES = ["/assessments", "/execute"];
export function saveRouteIntent(route: string | null | undefined, now = Date.now()) {
  if (!route || !RESUMABLE_ROUTES.includes(route)) return;
  try { sessionStorage.setItem(ROUTE_KEY, JSON.stringify({ route, at: now })); } catch { /* storage unavailable: sign-in still works */ }
}
function routeIntent(now: number): string | null {
  try {
    const v = JSON.parse(sessionStorage.getItem(ROUTE_KEY) || "null");
    return v && RESUMABLE_ROUTES.includes(v.route) && typeof v.at === "number" && now - v.at >= 0 && now - v.at < ROUTE_TTL_MS ? v.route : null;
  } catch { return null; }
}
/** Where to go after sign-in: the builder if the visitor asked to build something, a stage they chose on the landing page, otherwise the dashboard. */
export function postSignInPath(now = Date.now()): string {
  let v: string | null = null;
  try { v = sessionStorage.getItem(KEY); } catch { /* fall through */ }
  return v ? builderPath(v) : routeIntent(now) ?? "/dashboard";
}
