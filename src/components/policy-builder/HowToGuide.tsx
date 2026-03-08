import { useState } from "react";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  FileText,
  Shield,
  Settings,
  MessageSquare,
  Eye,
  Download,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const STEPS = [
  {
    number: 1,
    title: "Select Your Document Type",
    icon: FileText,
    description:
      "Choose from 8 Policy types or 5 SOP types. Policies govern 'what' and 'why'. SOPs govern 'how'. Match the document to your compliance gap or audit finding.",
    tip: "Start with Information Security Policy if you're building from scratch",
  },
  {
    number: 2,
    title: "Choose Your Compliance Frameworks",
    icon: Shield,
    description:
      "Select all frameworks your organisation must comply with. Multi-framework selection generates cross-mapped control references automatically. NIST CSF 2.0 is recommended as the base framework.",
    tip: "DPDP Act 2023 + NIST Privacy Framework for Indian organisations",
  },
  {
    number: 3,
    title: "Configure Your Context",
    icon: Settings,
    description:
      "Set your Industry Vertical, Organisation Size, and Compliance Maturity level. This context allows the AI to tailor language, scope, and obligations appropriately — a FinTech policy differs significantly from a Manufacturing one.",
    tip: "Higher maturity = more prescriptive control language",
  },
  {
    number: 4,
    title: "Describe Your Requirements in Chat",
    icon: MessageSquare,
    description:
      "Use the AI chat to describe your specific requirements, exceptions, organisational structure, or ask to include specific clauses. Be specific: mention your data types, third-party integrations, jurisdictions, and any recent audit findings.",
    tip: "'We are a 500-person FinTech in India processing payment data...' gives better results",
  },
  {
    number: 5,
    title: "Review, Refine & Iterate",
    icon: Eye,
    description:
      "Review the generated document in the live preview panel. Ask the AI to refine specific clauses, add definitions, or adjust the tone (board-level vs operational). Use the Regenerate button for fresh drafts. All control references map back to source frameworks.",
    tip: "Ask 'Make Section 4.2 more prescriptive for a BFSI context'",
  },
  {
    number: 6,
    title: "Export & Save to Repository",
    icon: Download,
    description:
      "Once satisfied, export as DOCX or PDF for legal review. Save to Repository for version control. Documents carry metadata: classification label, review date, framework tags, and version number — audit-ready from Day 1.",
    tip: "Always route through qualified legal counsel before publishing",
  },
];

export default function HowToGuide() {
  const [expanded, setExpanded] = useState(true);

  return (
    <section>
      <div
        className="rounded-xl border border-border bg-card overflow-hidden"
        style={{ borderLeftWidth: 4, borderLeftColor: "hsl(158 64% 51%)" }}
      >
        {/* Header */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-muted/10 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-primary" />
            </div>
            <div className="text-left">
              <h2 className="text-sm font-bold text-foreground">
                How to Create Accurate Policies & SOPs — Step-by-Step Guide
              </h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Follow these 6 steps for audit-ready, framework-aligned documents
              </p>
            </div>
          </div>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {/* Content */}
        {expanded && (
          <div className="px-6 pb-6 space-y-5 animate-fade-in">
            {/* Steps Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {STEPS.map((step) => (
                <div
                  key={step.number}
                  className="rounded-lg border border-border bg-background/50 p-4 space-y-3 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                      {step.number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <step.icon className="h-3.5 w-3.5 text-primary shrink-0" />
                        <h3 className="text-xs font-bold text-foreground truncate">
                          {step.title}
                        </h3>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-1.5 bg-primary/5 rounded-md px-2.5 py-2 border border-primary/10">
                    <Lightbulb className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                    <p className="text-[10px] text-primary leading-relaxed">
                      <span className="font-semibold">Pro Tip:</span> {step.tip}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Disclaimer */}
            <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-[11px] text-foreground/80 leading-relaxed">
                <span className="font-bold">⚠️ Important:</span> AI-generated documents are
                first-draft aids. All policies and SOPs must be reviewed by qualified legal counsel,
                your DPO, or a certified GRC professional before implementation. Control references
                are mapped to publicly available NIST and ISO framework documentation.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
