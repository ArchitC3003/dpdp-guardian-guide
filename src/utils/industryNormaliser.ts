/**
 * Industry String Normalisation
 * 
 * Maps legacy/variant industry strings to canonical industry names
 * used throughout PrivCybHub.
 */

const INDUSTRY_ALIASES: Record<string, string> = {
  "HealthTech/Healthcare": "Healthcare/Healthtech",
  "Healthcare": "Healthcare/Healthtech",
  "Healthcare/HealthTech": "Healthcare/Healthtech",
  "Healthtech": "Healthcare/Healthtech",
  "BFSI": "BFSI/Banking",
  "Banking": "BFSI/Banking",
  "Fintech": "BFSI/Banking",
  "E-commerce": "Retail/E-commerce",
  "Ecommerce": "Retail/E-commerce",
  "Retail": "Retail/E-commerce",
  "IT Services": "Technology/IT Services",
  "Technology": "Technology/IT Services",
  "IT": "Technology/IT Services",
  "SaaS": "Technology/IT Services",
  "Education": "EdTech/Education",
  "EdTech": "EdTech/Education",
  "Telecom": "Telecom",
  "Government": "Government/PSU",
  "PSU": "Government/PSU",
  "Legal": "Legal/Professional Services",
};

export function normaliseIndustry(input: string): string {
  if (!input) return input;
  return INDUSTRY_ALIASES[input] || INDUSTRY_ALIASES[input.trim()] || input;
}

export function normaliseIndustries(inputs: string[]): string[] {
  return inputs.map(normaliseIndustry);
}
