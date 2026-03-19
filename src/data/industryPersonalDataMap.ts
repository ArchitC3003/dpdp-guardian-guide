/**
 * Static knowledge base of personal data types per industry.
 * Used for instant Phase 1 auto-population (no AI call needed).
 */

export const INDUSTRY_PERSONAL_DATA_MAP: Record<string, string[]> = {
  "Technology/IT Services": ["Email Address", "IP Address", "Device Identifiers", "Usage/Behavioural Data", "Login Credentials", "API Access Tokens", "Geolocation Data", "Cookie/Tracking Data"],
  "BFSI/Banking": ["PAN / Tax ID", "Aadhaar / National ID", "Bank Account Details", "Credit/Debit Card Data", "Credit Score", "Income & Financial Records", "KYC Documents", "Transaction History", "Nominee Details"],
  "Insurance": ["Health & Medical Records", "Policy Holder Details", "Nominee Details", "Claims History", "PAN / Tax ID", "Aadhaar / National ID", "Bank Account Details", "Age & Date of Birth"],
  "Healthcare/Healthtech": ["Health & Medical Records", "Biometric Data", "Genetic Data", "Prescription Data", "Insurance/TPA Details", "Emergency Contact", "Blood Group", "Disability Status", "Mental Health Records"],
  "EdTech/Education": ["Student ID & Academic Records", "Parent/Guardian Details", "Age & Date of Birth", "Attendance Records", "Assessment/Grade Data", "Learning Behaviour Data", "Disability/Special Needs Data"],
  "Manufacturing": ["Employee ID & HR Records", "Biometric Attendance Data", "Health & Safety Records", "CCTV/Surveillance Footage", "Vendor Contact Data", "Contractor Identity Documents"],
  "Retail/E-commerce": ["Delivery Address", "Payment Card Data", "Purchase History", "Browsing/Wishlist Data", "Phone Number", "Email Address", "Cookie/Tracking Data", "Loyalty Programme Data"],
  "Telecom": ["Phone Number", "IMEI/Device ID", "Call Detail Records (CDR)", "Location/Cell Tower Data", "Aadhaar / National ID", "Usage & Billing Data", "Email Address"],
  "Government/PSU": ["Aadhaar / National ID", "PAN / Tax ID", "Voter ID", "Passport Details", "Caste/Category Certificate", "Income Certificate", "Biometric Data", "Address Proof"],
  "Legal/Professional Services": ["Client Identity Data", "Case/Matter Details", "Financial Records", "Court Records", "Communication Records", "PAN / Tax ID"],
  "Hospitality & Travel": ["Passport/Visa Details", "Booking & Itinerary Data", "Payment Card Data", "Loyalty Programme Data", "Dietary/Accessibility Preferences", "Phone Number", "Email Address"],
  "Media & Entertainment": ["User Profile Data", "Content Preferences", "Viewing/Listening History", "Payment/Subscription Data", "Age & Date of Birth", "Device Identifiers", "Advertising ID"],
  "Energy & Utilities": ["Meter/Connection Number", "Consumption Data", "Billing Address", "Payment Records", "Aadhaar / National ID", "Phone Number"],
  "Real Estate & PropTech": ["Property Ownership Records", "Aadhaar / National ID", "PAN / Tax ID", "Bank Account Details", "Address History", "Tenant Identity Data", "Income Proof"],
  "Logistics & Supply Chain": ["Driver/Operator ID", "Vehicle Registration", "GPS/Location Data", "Delivery Address", "Phone Number", "Warehouse Access Logs", "Biometric Attendance Data"],
  "Agriculture & AgriTech": ["Farmer Identity Data", "Land Records", "Aadhaar / National ID", "Bank Account Details", "Crop/Yield Data", "GPS/Location Data", "Subsidy/Loan Records"],
};

/** Get merged, deduped personal data types for multiple industries */
export function getPersonalDataForIndustries(industries: string[]): string[] {
  const allTypes = new Set<string>();
  for (const ind of industries) {
    const types = INDUSTRY_PERSONAL_DATA_MAP[ind];
    if (types) types.forEach(t => allTypes.add(t));
  }
  return Array.from(allTypes).sort();
}
