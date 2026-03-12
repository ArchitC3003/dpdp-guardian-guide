/**
 * Smart Context Inference Engine
 *
 * Deterministic mapping matrix that auto-deduces Processing Activities
 * and recommended Compliance Maturity based on Industry, Jurisdiction,
 * and DPDP Classification selections.
 */

export interface InferenceResult {
  processingActivities: string[];
  maturityLevel: string;
}

interface RuleKey {
  /** Matches against OrgContext.industry */
  industry: string;
  /** Matches against OrgContext.geographies */
  geographies: string;
  /** Matches against OrgContext.sdfClassification */
  sdfClassification: string;
}

interface Rule extends RuleKey {
  result: InferenceResult;
}

// ── Mapping Matrix ────────────────────────────────────────────────────
const RULES: Rule[] = [
  // Healthcare ─────────────────────────────────────────────────────────
  {
    industry: "HealthTech/Healthcare",
    geographies: "india-only",
    sdfClassification: "sdf",
    result: {
      processingActivities: [
        "Health & Medical Data",
        "Customer Personal Data",
        "Biometric Data",
        "Sensitive Personal Data",
      ],
      maturityLevel: "defined",
    },
  },
  {
    industry: "HealthTech/Healthcare",
    geographies: "india-eu",
    sdfClassification: "sdf",
    result: {
      processingActivities: [
        "Health & Medical Data",
        "Customer Personal Data",
        "Biometric Data",
        "Cross-border Data Transfers",
        "Sensitive Personal Data",
      ],
      maturityLevel: "managed",
    },
  },
  {
    industry: "HealthTech/Healthcare",
    geographies: "india-only",
    sdfClassification: "standard",
    result: {
      processingActivities: [
        "Health & Medical Data",
        "Customer Personal Data",
        "Employee/HR Data",
      ],
      maturityLevel: "developing",
    },
  },

  // BFSI / Banking ────────────────────────────────────────────────────
  {
    industry: "BFSI/Banking",
    geographies: "india-only",
    sdfClassification: "sdf",
    result: {
      processingActivities: [
        "Financial & Payment Data",
        "Customer Personal Data",
        "Biometric Data",
        "Cross-border Data Transfers",
        "Automated Decision Making",
      ],
      maturityLevel: "managed",
    },
  },
  {
    industry: "BFSI/Banking",
    geographies: "global",
    sdfClassification: "sdf",
    result: {
      processingActivities: [
        "Financial & Payment Data",
        "Customer Personal Data",
        "Biometric Data",
        "Cross-border Data Transfers",
        "Automated Decision Making",
        "Third-Party/Vendor Data",
      ],
      maturityLevel: "managed",
    },
  },
  {
    industry: "BFSI/Banking",
    geographies: "india-only",
    sdfClassification: "standard",
    result: {
      processingActivities: [
        "Financial & Payment Data",
        "Customer Personal Data",
        "Employee/HR Data",
      ],
      maturityLevel: "developing",
    },
  },

  // Insurance ─────────────────────────────────────────────────────────
  {
    industry: "Insurance",
    geographies: "india-only",
    sdfClassification: "sdf",
    result: {
      processingActivities: [
        "Health & Medical Data",
        "Financial & Payment Data",
        "Customer Personal Data",
        "Sensitive Personal Data",
        "Automated Decision Making",
      ],
      maturityLevel: "managed",
    },
  },
  {
    industry: "Insurance",
    geographies: "india-only",
    sdfClassification: "standard",
    result: {
      processingActivities: [
        "Customer Personal Data",
        "Financial & Payment Data",
        "Employee/HR Data",
      ],
      maturityLevel: "developing",
    },
  },

  // Technology / IT Services ──────────────────────────────────────────
  {
    industry: "Technology/IT Services",
    geographies: "global",
    sdfClassification: "processor",
    result: {
      processingActivities: [
        "Employee/HR Data",
        "Third-Party/Vendor Data",
        "Cross-border Data Transfers",
        "Customer Personal Data",
      ],
      maturityLevel: "defined",
    },
  },
  {
    industry: "Technology/IT Services",
    geographies: "india-eu",
    sdfClassification: "processor",
    result: {
      processingActivities: [
        "Employee/HR Data",
        "Third-Party/Vendor Data",
        "Cross-border Data Transfers",
        "Customer Personal Data",
      ],
      maturityLevel: "defined",
    },
  },
  {
    industry: "Technology/IT Services",
    geographies: "india-only",
    sdfClassification: "sdf",
    result: {
      processingActivities: [
        "Customer Personal Data",
        "Employee/HR Data",
        "Automated Decision Making",
        "Third-Party/Vendor Data",
        "Cross-border Data Transfers",
      ],
      maturityLevel: "managed",
    },
  },
  {
    industry: "Technology/IT Services",
    geographies: "india-only",
    sdfClassification: "standard",
    result: {
      processingActivities: [
        "Customer Personal Data",
        "Employee/HR Data",
        "Third-Party/Vendor Data",
      ],
      maturityLevel: "developing",
    },
  },

  // EdTech / Education ────────────────────────────────────────────────
  {
    industry: "EdTech/Education",
    geographies: "india-only",
    sdfClassification: "sdf",
    result: {
      processingActivities: [
        "Children's Data (under 18)",
        "Customer Personal Data",
        "Employee/HR Data",
        "Sensitive Personal Data",
      ],
      maturityLevel: "defined",
    },
  },
  {
    industry: "EdTech/Education",
    geographies: "india-only",
    sdfClassification: "standard",
    result: {
      processingActivities: [
        "Children's Data (under 18)",
        "Customer Personal Data",
        "Employee/HR Data",
      ],
      maturityLevel: "developing",
    },
  },

  // Telecom ───────────────────────────────────────────────────────────
  {
    industry: "Telecom",
    geographies: "india-only",
    sdfClassification: "sdf",
    result: {
      processingActivities: [
        "Customer Personal Data",
        "Biometric Data",
        "Automated Decision Making",
        "Cross-border Data Transfers",
        "Third-Party/Vendor Data",
      ],
      maturityLevel: "managed",
    },
  },

  // Retail / E-commerce ───────────────────────────────────────────────
  {
    industry: "Retail/E-commerce",
    geographies: "india-only",
    sdfClassification: "sdf",
    result: {
      processingActivities: [
        "Customer Personal Data",
        "Financial & Payment Data",
        "Automated Decision Making",
        "Third-Party/Vendor Data",
      ],
      maturityLevel: "defined",
    },
  },
  {
    industry: "Retail/E-commerce",
    geographies: "global",
    sdfClassification: "sdf",
    result: {
      processingActivities: [
        "Customer Personal Data",
        "Financial & Payment Data",
        "Automated Decision Making",
        "Third-Party/Vendor Data",
        "Cross-border Data Transfers",
      ],
      maturityLevel: "managed",
    },
  },

  // Government / PSU ──────────────────────────────────────────────────
  {
    industry: "Government/PSU",
    geographies: "india-only",
    sdfClassification: "sdf",
    result: {
      processingActivities: [
        "Customer Personal Data",
        "Biometric Data",
        "Sensitive Personal Data",
        "Children's Data (under 18)",
        "Automated Decision Making",
      ],
      maturityLevel: "defined",
    },
  },

  // Manufacturing ─────────────────────────────────────────────────────
  {
    industry: "Manufacturing",
    geographies: "india-only",
    sdfClassification: "standard",
    result: {
      processingActivities: [
        "Employee/HR Data",
        "Third-Party/Vendor Data",
        "Customer Personal Data",
      ],
      maturityLevel: "developing",
    },
  },

  // Legal / Professional Services ─────────────────────────────────────
  {
    industry: "Legal/Professional Services",
    geographies: "india-only",
    sdfClassification: "standard",
    result: {
      processingActivities: [
        "Customer Personal Data",
        "Sensitive Personal Data",
        "Employee/HR Data",
        "Third-Party/Vendor Data",
      ],
      maturityLevel: "defined",
    },
  },
];

// ── Fuzzy fallback matrix (partial match on 2 of 3 keys) ─────────────
function scoreMatch(rule: RuleKey, input: RuleKey): number {
  let score = 0;
  if (rule.industry === input.industry) score += 3;
  if (rule.sdfClassification === input.sdfClassification) score += 2;
  if (rule.geographies === input.geographies) score += 1;
  return score;
}

/**
 * Main inference function.
 * Returns null when no reasonable match is found (< 2 key matches).
 */
export function inferSmartContext(
  industry: string,
  geographies: string,
  sdfClassification: string
): InferenceResult | null {
  if (!industry || !geographies || !sdfClassification) return null;

  const input: RuleKey = { industry, geographies, sdfClassification };

  // Exact match first
  const exact = RULES.find(
    (r) =>
      r.industry === input.industry &&
      r.geographies === input.geographies &&
      r.sdfClassification === input.sdfClassification
  );
  if (exact) return exact.result;

  // Fuzzy: best partial match (need at least industry match + 1 other)
  let bestScore = 0;
  let bestRule: Rule | null = null;
  for (const rule of RULES) {
    const s = scoreMatch(rule, input);
    if (s > bestScore) {
      bestScore = s;
      bestRule = rule;
    }
  }

  // Require at least industry match (score >= 3) for fuzzy
  if (bestScore >= 3 && bestRule) return bestRule.result;

  return null;
}
