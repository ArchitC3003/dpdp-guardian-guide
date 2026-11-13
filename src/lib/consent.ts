/**
 * Consent state for cookies and similar browser storage.
 *
 * One inventory (`CONSENT_CATEGORIES`) drives the banner, the preferences page
 * and enforcement, so what we declare is what we actually store. A category is
 * shown only when it holds at least one technology.
 */

export const CONSENT_STORAGE_KEY = "privcybhub_cookie_consent_v2";
export const CONSENT_CHANGE_EVENT = "privcybhub:consent-change";
export const CONSENT_OPEN_EVENT = "privcybhub:consent-open";

export type ConsentAction = "accept_all" | "reject_all" | "custom" | "updated" | "withdrawn";
export type ConsentChoices = Record<string, boolean>;

export interface ConsentTechnology {
  name: string;
  kind: "Cookie" | "Local storage" | "Session storage";
  provider: string;
  duration: string;
  purpose: string;
}

export interface ConsentCategory {
  id: string;
  name: string;
  description: string;
  required: boolean;
  technologies: ConsentTechnology[];
}

const US = "PrivcybHub";

export const CONSENT_CATEGORIES: ConsentCategory[] = [
  {
    id: "strictly_necessary",
    name: "Strictly necessary",
    description: "Needed to sign you in, keep your session secure, remember this choice and carry your selection through sign-in. These cannot be switched off.",
    required: true,
    technologies: [
      { name: "sb-*-auth-token", kind: "Local storage", provider: US, duration: "Until you sign out", purpose: "Keeps you signed in" },
      { name: CONSENT_STORAGE_KEY, kind: "Local storage", provider: US, duration: "Until you clear it", purpose: "Remembers your privacy choices" },
      { name: "privcybhub_build_intent, privcybhub_route_intent", kind: "Session storage", provider: US, duration: "Until the tab closes", purpose: "Returns you to what you chose before signing in" },
      { name: "execute.selectedSectors, execute.draftSectors", kind: "Local storage", provider: US, duration: "Until you clear it", purpose: "Holds the work you have in progress" },
    ],
  },
  {
    id: "functional",
    name: "Preferences",
    description: "Remember how you like the product to look and behave between visits. Without these, your settings reset each time.",
    required: false,
    technologies: [
      { name: "sidebar:state", kind: "Cookie", provider: US, duration: "7 days", purpose: "Remembers whether the side menu is open" },
      { name: "privcybhub-theme-prefs", kind: "Local storage", provider: US, duration: "Until you clear it", purpose: "Remembers your colour settings" },
      { name: "privcybhub.listen.rate, privcybhub.listen.voice", kind: "Local storage", provider: US, duration: "Until you clear it", purpose: "Remembers your listening speed and voice" },
      { name: "execute.selectView", kind: "Local storage", provider: US, duration: "Until you clear it", purpose: "Remembers your preferred view" },
    ],
  },
];

/** Storage that may be written only with consent, by category. Used to erase on withdrawal. */
const GATED_STORAGE: Record<string, { local: string[]; cookies: string[] }> = {
  functional: {
    local: ["privcybhub-theme-prefs", "privcybhub.listen.rate", "privcybhub.listen.voice", "execute.selectView"],
    cookies: ["sidebar:state"],
  },
};

export interface StoredConsent {
  categories: ConsentChoices;
  action: ConsentAction;
  ts: string;
}

const required = (id: string) => CONSENT_CATEGORIES.find((c) => c.id === id)?.required === true;

/** Every category set to `on`, with required ones always on. */
export function choicesFor(on: boolean): ConsentChoices {
  return Object.fromEntries(CONSENT_CATEGORIES.map((c) => [c.id, c.required || on]));
}

/** Keeps only known categories and forces required ones on. */
export function normaliseChoices(input: unknown): ConsentChoices {
  const raw = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  return Object.fromEntries(CONSENT_CATEGORIES.map((c) => [c.id, c.required || raw[c.id] === true]));
}

export function readConsent(): StoredConsent | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(CONSENT_STORAGE_KEY) || "null");
    if (!parsed || typeof parsed !== "object") return null;
    return { categories: normaliseChoices(parsed.categories), action: parsed.action, ts: parsed.ts };
  } catch {
    return null;
  }
}

/** True only when the visitor has actively allowed the category. No choice yet means no. */
export function hasConsent(categoryId: string): boolean {
  if (required(categoryId)) return true;
  return readConsent()?.categories[categoryId] === true;
}

export function splitChoices(choices: ConsentChoices) {
  const accepted = CONSENT_CATEGORIES.filter((c) => choices[c.id]).map((c) => c.id);
  const rejected = CONSENT_CATEGORIES.filter((c) => !c.required && !choices[c.id]).map((c) => c.id);
  return { accepted, rejected };
}

function eraseGated(categoryId: string) {
  const gated = GATED_STORAGE[categoryId];
  if (!gated) return;
  for (const key of gated.local) {
    try { localStorage.removeItem(key); } catch { /* storage unavailable */ }
  }
  for (const name of gated.cookies) {
    document.cookie = `${name}=; path=/; max-age=0`;
  }
}

/** Stores the choice, erases anything no longer permitted and tells the page. */
export function saveConsent(choices: ConsentChoices, action: ConsentAction): StoredConsent {
  const record: StoredConsent = { categories: normaliseChoices(choices), action, ts: new Date().toISOString() };
  try { localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record)); } catch { /* storage unavailable */ }
  for (const c of CONSENT_CATEGORIES) if (!record.categories[c.id]) eraseGated(c.id);
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGE_EVENT, { detail: record }));
  return record;
}

/** Reopens the choices panel from anywhere (footer links, menus). */
export function openConsentPreferences() {
  window.dispatchEvent(new Event(CONSENT_OPEN_EVENT));
}

/** Writes a preference to local storage only if the visitor allowed that category. */
export function setPreference(key: string, value: string, categoryId = "functional"): boolean {
  if (!hasConsent(categoryId)) return false;
  try { localStorage.setItem(key, value); return true; } catch { return false; }
}

/** Sets a preference cookie only if the visitor allowed that category. */
export function setPreferenceCookie(name: string, value: string, maxAgeSeconds: number, categoryId = "functional"): boolean {
  if (!hasConsent(categoryId)) return false;
  document.cookie = `${name}=${value}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
  return true;
}
