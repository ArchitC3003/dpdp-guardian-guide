/**
 * Custom Entry Normalisation
 * 
 * Normalises free-text entries for personal data types and processing
 * activities to canonical forms with DPDP Act references.
 */

export interface NormalisationResult {
  original: string;
  normalised: string;
  dpdpReference?: string;
  isSensitive: boolean;
  category: "personal-data" | "processing-activity";
}

const DATA_TYPE_NORMALISATIONS: Record<string, { normalised: string; dpdpReference: string; isSensitive: boolean }> = {
  "face scan": { normalised: "Facial Recognition / Biometric Data", dpdpReference: "S.8(5) — Sensitive Personal Data", isSensitive: true },
  "face data": { normalised: "Facial Recognition / Biometric Data", dpdpReference: "S.8(5) — Sensitive Personal Data", isSensitive: true },
  "facial recognition": { normalised: "Facial Recognition / Biometric Data", dpdpReference: "S.8(5) — Sensitive Personal Data", isSensitive: true },
  "fingerprint": { normalised: "Fingerprint / Biometric Data", dpdpReference: "S.8(5) — Sensitive Personal Data", isSensitive: true },
  "biometric": { normalised: "Biometric Data", dpdpReference: "S.8(5) — Sensitive Personal Data", isSensitive: true },
  "iris scan": { normalised: "Iris Scan / Biometric Data", dpdpReference: "S.8(5) — Sensitive Personal Data", isSensitive: true },
  "aadhaar": { normalised: "Aadhaar Number / National ID", dpdpReference: "S.8(5), Aadhaar Act S.29", isSensitive: true },
  "pan card": { normalised: "PAN / Tax Identification Number", dpdpReference: "S.4(1)", isSensitive: false },
  "health record": { normalised: "Health & Medical Records", dpdpReference: "S.8(5) — Sensitive Personal Data", isSensitive: true },
  "medical data": { normalised: "Health & Medical Records", dpdpReference: "S.8(5) — Sensitive Personal Data", isSensitive: true },
  "genetic data": { normalised: "Genetic Data", dpdpReference: "S.8(5) — Sensitive Personal Data", isSensitive: true },
  "child data": { normalised: "Children's Personal Data", dpdpReference: "S.9 — Children's Data", isSensitive: true },
  "children": { normalised: "Children's Personal Data", dpdpReference: "S.9 — Children's Data", isSensitive: true },
  "minor": { normalised: "Children's Personal Data (Minors)", dpdpReference: "S.9 — Children's Data", isSensitive: true },
  "location data": { normalised: "Geolocation / Location Data", dpdpReference: "S.4(1)", isSensitive: false },
  "gps": { normalised: "Geolocation / GPS Data", dpdpReference: "S.4(1)", isSensitive: false },
  "credit card": { normalised: "Payment Card Data (PCI DSS Applicable)", dpdpReference: "S.4(1), PCI DSS", isSensitive: false },
  "bank account": { normalised: "Financial Account Data", dpdpReference: "S.4(1)", isSensitive: false },
  "sexual orientation": { normalised: "Sexual Orientation Data", dpdpReference: "S.8(5) — Sensitive Personal Data", isSensitive: true },
  "caste": { normalised: "Caste / Social Category Data", dpdpReference: "S.8(5) — Sensitive Personal Data", isSensitive: true },
  "religion": { normalised: "Religious Belief Data", dpdpReference: "S.8(5) — Sensitive Personal Data", isSensitive: true },
  "political opinion": { normalised: "Political Opinion Data", dpdpReference: "S.8(5) — Sensitive Personal Data", isSensitive: true },
  "disability": { normalised: "Disability / Health Status Data", dpdpReference: "S.8(5) — Sensitive Personal Data", isSensitive: true },
  "transgender": { normalised: "Gender Identity Data", dpdpReference: "S.8(5) — Sensitive Personal Data", isSensitive: true },
};

const ACTIVITY_NORMALISATIONS: Record<string, { normalised: string; dpdpReference: string; isSensitive: boolean }> = {
  "data sharing with foreign server": { normalised: "Cross-border Data Transfer", dpdpReference: "S.16 — Chapter V Obligations", isSensitive: false },
  "sending data abroad": { normalised: "Cross-border Data Transfer", dpdpReference: "S.16 — Chapter V Obligations", isSensitive: false },
  "overseas transfer": { normalised: "Cross-border Data Transfer", dpdpReference: "S.16 — Chapter V Obligations", isSensitive: false },
  "international data transfer": { normalised: "Cross-border Data Transfer", dpdpReference: "S.16 — Chapter V Obligations", isSensitive: false },
  "face scan for attendance": { normalised: "Biometric Attendance & Access Control", dpdpReference: "S.8(5)", isSensitive: true },
  "cctv": { normalised: "CCTV Surveillance & Physical Security", dpdpReference: "S.4(1)", isSensitive: false },
  "video surveillance": { normalised: "CCTV Surveillance & Physical Security", dpdpReference: "S.4(1)", isSensitive: false },
  "email marketing": { normalised: "Marketing Communications & Profiling", dpdpReference: "S.6", isSensitive: false },
  "profiling": { normalised: "Automated Decision Making & AI Scoring", dpdpReference: "S.6, S.12", isSensitive: false },
  "ai scoring": { normalised: "Automated Decision Making & AI Scoring", dpdpReference: "S.6, S.12", isSensitive: false },
  "vendor sharing": { normalised: "Third-Party/Vendor Data Sharing", dpdpReference: "S.8(2)", isSensitive: false },
  "outsourcing": { normalised: "Third-Party/Vendor Data Sharing", dpdpReference: "S.8(2)", isSensitive: false },
  "data processor": { normalised: "Third-Party/Vendor Data Sharing", dpdpReference: "S.8(2)", isSensitive: false },
  "delete request": { normalised: "Data Subject Access Request (DSAR) Handling", dpdpReference: "S.11, S.12, S.13", isSensitive: false },
  "right to erasure": { normalised: "Data Subject Access Request (DSAR) Handling", dpdpReference: "S.11, S.12, S.13", isSensitive: false },
  "data deletion": { normalised: "Data Retention & Disposal", dpdpReference: "S.8(7)", isSensitive: false },
};

export function normaliseCustomEntry(
  input: string,
  category: "personal-data" | "processing-activity"
): NormalisationResult {
  const lower = input.toLowerCase().trim();
  const map = category === "personal-data" ? DATA_TYPE_NORMALISATIONS : ACTIVITY_NORMALISATIONS;

  // Exact match
  if (map[lower]) {
    return { original: input, normalised: map[lower].normalised, dpdpReference: map[lower].dpdpReference, isSensitive: map[lower].isSensitive, category };
  }

  // Partial match — check if any key is contained in the input
  for (const [key, value] of Object.entries(map)) {
    if (lower.includes(key) || key.includes(lower)) {
      return { original: input, normalised: value.normalised, dpdpReference: value.dpdpReference, isSensitive: value.isSensitive, category };
    }
  }

  // No match — return as-is
  return { original: input, normalised: input, dpdpReference: undefined, isSensitive: false, category };
}
