import { useState, useMemo } from "react";
import { BookOpen, Search, Copy, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ClauseSnippet {
  id: string;
  title: string;
  text: string;
  topic: string;
  regulation: string;
  regulationColor: string;
}

const CLAUSE_SNIPPETS: ClauseSnippet[] = [
  // Consent (DPDP)
  { id: "c1", title: "Informed Consent Collection", text: "The Data Fiduciary shall obtain free, specific, informed, and unambiguous consent from the Data Principal prior to processing personal data. Consent requests shall be presented in clear, plain language with itemised purposes.", topic: "Consent", regulation: "DPDP Act", regulationColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  { id: "c2", title: "Consent Withdrawal Mechanism", text: "Data Principals shall have the right to withdraw consent at any time with the same ease as it was given. Upon withdrawal, the Data Fiduciary shall cease processing within 72 hours and delete data unless retention is required by law.", topic: "Consent", regulation: "DPDP Act", regulationColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  { id: "c3", title: "Granular Consent Management", text: "Consent shall be collected on a per-purpose basis. Bundled consent for multiple unrelated purposes is prohibited. The consent manager shall maintain an auditable register of all consent transactions.", topic: "Consent", regulation: "DPDP Act", regulationColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  { id: "c4", title: "Consent for Children's Data", text: "Processing of children's personal data requires verifiable parental or guardian consent obtained before any data collection. Age verification mechanisms proportionate to risk shall be implemented [DPDP Act Sec 9].", topic: "Consent", regulation: "DPDP Act", regulationColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  { id: "c5", title: "Legitimate Use Without Consent", text: "Processing without consent is permitted only for legitimate uses specified under Section 7 of the DPDP Act, including voluntary provision, State functions, medical emergencies, and employment purposes.", topic: "Consent", regulation: "DPDP Act", regulationColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },

  // Retention
  { id: "r1", title: "Data Retention Schedule", text: "Personal data shall be retained only for the period necessary to fulfil the purpose for which it was collected. A formal retention schedule shall be maintained with specific periods per data category, legal basis, and destruction method.", topic: "Retention", regulation: "DPDP Act", regulationColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  { id: "r2", title: "KYC Record Retention (BFSI)", text: "KYC records shall be retained for a minimum of 5 years from the date of account closure or last transaction, whichever is later, as mandated by PMLA Rules, Rule 3(1). Suspicious Transaction Reports retained for 5 years from FIU-IND filing.", topic: "Retention", regulation: "PMLA/RBI", regulationColor: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { id: "r3", title: "Healthcare Record Retention", text: "Patient medical records shall be retained for a minimum of 3 years from the last consultation (MCI recommendation: indefinite). Clinical trial records retained for 15 years post-completion per ICMR and New Drugs Rules 2019.", topic: "Retention", regulation: "ICMR/MCI", regulationColor: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  { id: "r4", title: "System Log Retention (CERT-In)", text: "All ICT system logs including firewall, IDS/IPS, web server, and application logs shall be retained for a rolling period of 180 days as mandated by CERT-In Directions 2022, Para 4(vi). Logs shall be maintained in a tamper-proof SIEM.", topic: "Retention", regulation: "CERT-In", regulationColor: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  { id: "r5", title: "Employee Data Retention", text: "Employee personal data shall be retained for the duration of employment plus 8 years post-separation as required by the Payment of Wages Act, EPF Act, and applicable labour legislation. Biometric data deleted within 30 days of separation.", topic: "Retention", regulation: "Labour Laws", regulationColor: "bg-amber-500/20 text-amber-400 border-amber-500/30" },

  // Breach Notification
  { id: "b1", title: "CERT-In 6-Hour Reporting", text: "Any cybersecurity incident shall be reported to CERT-In within 6 hours of becoming aware of the incident, as mandated by CERT-In Directions 2022. The incident report shall include nature, impact, systems affected, and initial containment actions.", topic: "Breach", regulation: "CERT-In", regulationColor: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  { id: "b2", title: "DPDP Breach Notification to DPB", text: "In the event of a personal data breach, the Data Fiduciary shall notify the Data Protection Board of India as soon as possible, and in any event within 72 hours of becoming aware of the breach [DPDP Act Sec 8(6), Rule 7].", topic: "Breach", regulation: "DPDP Act", regulationColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  { id: "b3", title: "Data Principal Breach Notification", text: "Affected Data Principals shall be notified of a personal data breach without undue delay. The notification shall include: nature of breach, categories of data affected, likely consequences, remedial measures taken, and contact details of the DPO.", topic: "Breach", regulation: "DPDP Act", regulationColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  { id: "b4", title: "Breach Severity Classification", text: "Data breaches shall be classified into four severity levels: Critical (mass PII exposure), High (sensitive data of >100 principals), Medium (limited PII exposure), Low (metadata/non-sensitive). Response timelines and escalation paths shall be calibrated per severity.", topic: "Breach", regulation: "NIST/ISO", regulationColor: "bg-sky-500/20 text-sky-400 border-sky-500/30" },
  { id: "b5", title: "RBI Cyber Incident Reporting", text: "For BFSI entities: cyber security incidents shall be reported to RBI CSITE within 6 hours of detection. Payment fraud incidents reported within 2-6 hours. SEBI-regulated entities report to SEBI within 6 hours [CSCRF Annex-B].", topic: "Breach", regulation: "RBI/SEBI", regulationColor: "bg-blue-500/20 text-blue-400 border-blue-500/30" },

  // Vendor / Third-Party
  { id: "v1", title: "Data Processing Agreement (DPA)", text: "All Data Processors shall execute a Data Processing Agreement prior to accessing personal data. The DPA shall specify: processing purposes, data categories, retention, security measures, sub-processor controls, audit rights, and breach notification obligations [DPDP Act Sec 8(4)].", topic: "Vendor", regulation: "DPDP Act", regulationColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  { id: "v2", title: "Sub-Processor Chain Control", text: "Data Processors shall not engage sub-processors without prior written authorisation from the Data Fiduciary. A register of all sub-processors shall be maintained with processing scope, geographic location, and security certification status.", topic: "Vendor", regulation: "DPDP Act", regulationColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  { id: "v3", title: "Vendor Security Assessment", text: "Prior to engagement, all vendors processing personal data shall undergo a security assessment covering: ISO 27001/SOC 2 certification status, encryption practices, access controls, incident response capability, and regulatory compliance posture.", topic: "Vendor", regulation: "ISO 27001", regulationColor: "bg-sky-500/20 text-sky-400 border-sky-500/30" },
  { id: "v4", title: "Data Return and Deletion", text: "Upon contract termination, the Data Processor shall return or securely delete all personal data within 30 days, providing a certificate of destruction. Backup copies shall be purged within 90 days unless retention is required by law [DPDP Act Sec 8(8)].", topic: "Vendor", regulation: "DPDP Act", regulationColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  { id: "v5", title: "Cross-Border Transfer Controls", text: "Transfer of personal data outside India shall only be to jurisdictions or entities notified by the Central Government under Section 16(1) of the DPDP Act. Transfer Impact Assessments shall be conducted for each cross-border data flow.", topic: "Vendor", regulation: "DPDP Act", regulationColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },

  // Employee Obligations
  { id: "e1", title: "Employee Privacy Training", text: "All employees shall complete mandatory privacy awareness training within 30 days of joining and annually thereafter. Role-specific training for IT, HR, and customer-facing staff shall cover data handling procedures specific to their function.", topic: "Employee", regulation: "NIST CSF", regulationColor: "bg-sky-500/20 text-sky-400 border-sky-500/30" },
  { id: "e2", title: "Confidentiality Obligations", text: "All employees and contractors with access to personal data shall sign confidentiality agreements. Obligations survive employment termination. Breach of confidentiality shall result in disciplinary action up to and including termination.", topic: "Employee", regulation: "IT Act", regulationColor: "bg-violet-500/20 text-violet-400 border-violet-500/30" },
  { id: "e3", title: "Acceptable Use Policy", text: "Employees shall process personal data only for authorised business purposes. Use of personal data for personal benefit, unauthorised disclosure, or circumvention of security controls is strictly prohibited and subject to disciplinary proceedings.", topic: "Employee", regulation: "ISO 27001", regulationColor: "bg-sky-500/20 text-sky-400 border-sky-500/30" },
  { id: "e4", title: "Clean Desk and Screen Policy", text: "Documents containing personal data shall not be left unattended. Workstations shall be locked when unattended (maximum 5-minute auto-lock). Printed personal data shall be stored in locked cabinets and securely shredded when no longer required.", topic: "Employee", regulation: "ISO 27001", regulationColor: "bg-sky-500/20 text-sky-400 border-sky-500/30" },
  { id: "e5", title: "Incident Reporting Obligation", text: "All employees shall report suspected or actual data breaches, security incidents, or policy violations to the DPO within 4 hours of discovery. Failure to report a known incident shall be treated as a separate disciplinary matter.", topic: "Employee", regulation: "CERT-In", regulationColor: "bg-orange-500/20 text-orange-400 border-orange-500/30" },

  // Security Controls
  { id: "s1", title: "Encryption Standards", text: "Personal data shall be encrypted at rest (AES-256) and in transit (TLS 1.2+). Encryption keys shall be managed through a dedicated KMS with key rotation every 90 days. Sensitive personal data requires application-layer encryption in addition to storage encryption.", topic: "Security", regulation: "CERT-In", regulationColor: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  { id: "s2", title: "Access Control Framework", text: "Access to personal data shall follow the principle of least privilege. Role-based access control (RBAC) shall be implemented with quarterly access reviews. Privileged access requires multi-factor authentication and session recording.", topic: "Security", regulation: "NIST CSF", regulationColor: "bg-sky-500/20 text-sky-400 border-sky-500/30" },
  { id: "s3", title: "Vulnerability Management", text: "Vulnerability assessments shall be conducted quarterly. Penetration testing shall be performed annually by CERT-In empanelled auditors. Critical vulnerabilities (CVSS ≥ 9.0) shall be remediated within 48 hours; high (CVSS ≥ 7.0) within 7 days.", topic: "Security", regulation: "CERT-In", regulationColor: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  { id: "s4", title: "Data Classification Scheme", text: "All data assets shall be classified into four levels: Public, Internal, Confidential, and Restricted. Personal data is classified as minimum Confidential. Sensitive personal data (biometric, health, financial) is classified as Restricted.", topic: "Security", regulation: "ISO 27001", regulationColor: "bg-sky-500/20 text-sky-400 border-sky-500/30" },
  { id: "s5", title: "Security Incident Response", text: "A formal incident response plan shall be maintained with defined phases: Preparation, Detection, Containment, Eradication, Recovery, and Post-Incident Review. Tabletop exercises shall be conducted semi-annually. Incident response team activation within 30 minutes of detection.", topic: "Security", regulation: "NIST CSF", regulationColor: "bg-sky-500/20 text-sky-400 border-sky-500/30" },
];

const TOPICS = ["All", "Consent", "Retention", "Breach", "Vendor", "Employee", "Security"];

interface Props {
  onCopyToContext: (text: string) => void;
}

export default function ClauseLibraryPanel({ onCopyToContext }: Props) {
  const [search, setSearch] = useState("");
  const [activeTopic, setActiveTopic] = useState("All");

  const filtered = useMemo(() => {
    return CLAUSE_SNIPPETS.filter((c) => {
      const topicMatch = activeTopic === "All" || c.topic === activeTopic;
      const searchMatch = !search.trim() || c.title.toLowerCase().includes(search.toLowerCase()) || c.text.toLowerCase().includes(search.toLowerCase()) || c.regulation.toLowerCase().includes(search.toLowerCase());
      return topicMatch && searchMatch;
    });
  }, [search, activeTopic]);

  const handleCopy = (clause: ClauseSnippet) => {
    const formatted = `\n---\n[${clause.regulation}] ${clause.title}:\n${clause.text}\n---`;
    onCopyToContext(formatted);
    toast.success(`"${clause.title}" added to context`);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5">
          <BookOpen className="h-3.5 w-3.5" /> Clause Library
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[420px] sm:w-[480px] p-0">
        <SheetHeader className="px-4 pt-4 pb-3 border-b border-border">
          <SheetTitle className="text-sm flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" /> Clause Library
            <Badge variant="outline" className="text-[9px] ml-auto">{filtered.length} clauses</Badge>
          </SheetTitle>
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search clauses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {TOPICS.map((t) => (
              <button
                key={t}
                onClick={() => setActiveTopic(t)}
                className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all",
                  activeTopic === t
                    ? "bg-primary/20 border-primary/50 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/30"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-180px)]">
          <div className="p-3 space-y-2">
            {filtered.map((clause) => (
              <div
                key={clause.id}
                className="rounded-lg border border-border bg-card p-3 space-y-2 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground leading-tight">{clause.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{clause.text}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={cn("text-[8px]", clause.regulationColor)}>
                    {clause.regulation}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] gap-1 text-primary hover:text-primary"
                    onClick={() => handleCopy(clause)}
                  >
                    <Copy className="h-3 w-3" /> Copy to Context
                  </Button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8">No clauses match your search.</p>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
