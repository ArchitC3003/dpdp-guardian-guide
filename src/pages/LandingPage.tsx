import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Cog, Shield, FileText, Bot, ClipboardList, Building2,
  ChevronRight, CheckCircle2, ArrowRight, BarChart3, Lock,
  Scale, Globe, Users, BookMarked, FolderOpen, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: ClipboardList,
    title: "DPDP Gap Assessments",
    desc: "88 statutory requirements mapped across 15 compliance domains. Six-phase structured assessment workflow with automated scoring.",
  },
  {
    icon: Bot,
    title: "AI Policy & SOP Builder",
    desc: "Generate audit-ready policies calibrated to your org size, sector, SDF classification, and processing activities. 13 regulatory frameworks.",
  },
  {
    icon: FolderOpen,
    title: "Assessment Repository",
    desc: "Pre-built templates for every DPDP requirement — consent notices, DPIA templates, breach registers, DPO appointment letters.",
  },
  {
    icon: BookMarked,
    title: "Policy Lifecycle Register",
    desc: "Track policy versions, approvals, review dates, and audit trails. Full document lifecycle management.",
  },
  {
    icon: BarChart3,
    title: "Executive Dashboards",
    desc: "Real-time compliance scoring, domain-wise heatmaps, risk distribution charts, and exportable board-level reports.",
  },
  {
    icon: Shield,
    title: "Multi-Framework Mapping",
    desc: "DPDP Act 2023, NIST CSF 2.0, ISO 27001, GDPR, CERT-In Directions, RBI, SEBI CSCRF, IRDAI — all in one platform.",
  },
];

const FRAMEWORKS = [
  "DPDP Act 2023 + Rules 2025",
  "NIST CSF 2.0",
  "ISO 27001:2022",
  "ISO 27701:2019",
  "GDPR",
  "CERT-In Directions 2022",
  "RBI Cybersecurity Framework",
  "SEBI CSCRF 2024",
  "IRDAI Guidelines 2023",
  "IT Act 2000",
];

const STEPS = [
  { num: "01", title: "Set Up Organisation Profile", desc: "Define your sector, size, SDF classification, processing activities, and applicable jurisdictions." },
  { num: "02", title: "Run Gap Assessment", desc: "Work through 88 DPDP requirements across 15 domains. Score, evidence, and assign owners." },
  { num: "03", title: "Generate Policies & SOPs", desc: "AI builds audit-ready documents calibrated to your exact compliance profile — no placeholders." },
  { num: "04", title: "Track & Report", desc: "Monitor compliance posture, manage policy lifecycles, and export board-level reports." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-6">
          <Link to="/" className="flex items-center gap-2">
            <Cog className="h-7 w-7 text-primary" />
            <span className="font-bold text-lg text-gradient">PrivcybHub</span>
            <span className="text-[10px] font-mono bg-primary/20 text-primary px-1.5 py-0.5 rounded">v3.0</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#frameworks" className="hover:text-foreground transition-colors">Frameworks</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/auth">Get Started <ArrowRight className="h-4 w-4 ml-1" /></Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/10 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-24 md:pt-28 md:pb-32 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary mb-6">
              <Shield className="h-3.5 w-3.5" />
              India's DPDP Act 2023 Compliance Platform
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
              Privacy & Cyber Compliance,{" "}
              <span className="text-gradient">Simplified.</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl">
              PrivcybHub is an end-to-end GRC platform for Indian organisations navigating DPDP Act 2023, CERT-In, RBI, SEBI, and global privacy frameworks. Assess gaps, generate audit-ready policies, and track compliance — all in one place.
            </p>
            <div className="flex flex-wrap gap-4 mt-8">
              <Button size="lg" asChild>
                <Link to="/auth">
                  Start Free Assessment <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#features">
                  Explore Features
                </a>
              </Button>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-8 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> 88 DPDP Requirements</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> 13 Frameworks</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> AI-Powered Documents</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <section className="border-y border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><Scale className="h-4 w-4" /> DPDP Act 2023 Aligned</span>
          <span className="flex items-center gap-1.5"><Shield className="h-4 w-4" /> CERT-In Compliant</span>
          <span className="flex items-center gap-1.5"><Lock className="h-4 w-4" /> End-to-End Encrypted</span>
          <span className="flex items-center gap-1.5"><Globe className="h-4 w-4" /> Multi-Jurisdiction Support</span>
          <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> Role-Based Access Control</span>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20 md:py-28">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold">Everything You Need for Compliance</h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            From gap assessments to AI-generated policies — a complete toolkit for privacy and cybersecurity compliance.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <Card key={f.title} className="group hover:border-primary/40 transition-colors">
              <CardContent className="p-6">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── FRAMEWORKS ── */}
      <section id="frameworks" className="border-y border-border bg-card/30">
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-28">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">13 Regulatory Frameworks, One Platform</h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Map your controls to Indian and global privacy and cybersecurity standards simultaneously.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
            {FRAMEWORKS.map((fw) => (
              <span
                key={fw}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:border-primary/40 transition-colors"
              >
                <Shield className="h-3.5 w-3.5 text-primary" />
                {fw}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-6 py-20 md:py-28">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold">How It Works</h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            Four steps from zero to compliance-ready.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {STEPS.map((s, i) => (
            <div key={s.num} className="relative">
              <span className="text-5xl font-bold text-primary/15 absolute -top-2 -left-1 select-none">{s.num}</span>
              <div className="pt-10">
                <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-t border-border">
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-28 text-center">
          <div className="max-w-2xl mx-auto">
            <Zap className="h-10 w-10 text-primary mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-bold">Ready to Get Compliant?</h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Start your DPDP Act compliance journey today. Set up your organisation profile and run your first gap assessment in minutes.
            </p>
            <Button size="lg" className="mt-8" asChild>
              <Link to="/auth">
                Get Started — It's Free <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Cog className="h-5 w-5 text-primary" />
            <span className="font-semibold text-gradient">PrivcybHub</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
          </div>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} PrivcybHub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
