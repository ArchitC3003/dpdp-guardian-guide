import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DOMAINS, POLICY_ITEMS, DEPARTMENTS, DEPT_CONTROLS, getRiskMultiplier, getStatusPct } from "@/data/assessmentDomains";
import { toast } from "sonner";
import { Save, Share2, CheckCircle2, Copy, AlertTriangle, Shield, BarChart3, FileText, Grid3X3, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import type { Tables } from "@/integrations/supabase/types";
import type { Json } from "@/integrations/supabase/types";
import { exportDashboardToPPT } from "@/lib/exportPpt";
import type { DomainScore } from "@/lib/pptTypes";

interface SpecialStatus {
  sdf?: boolean;
  consentMgr?: boolean;
  children?: boolean;
  [key: string]: boolean | undefined;
}

// DomainScore type imported from pptTypes

export default function PhaseDashboard() {
  const { assessmentId } = useParams();
  const { user } = useAuth();
  const [assessment, setAssessment] = useState<Tables<"assessments"> | null>(null);
  const [checks, setChecks] = useState<Tables<"assessment_checks">[]>([]);
  const [policyItems, setPolicyItems] = useState<Tables<"policy_items">[]>([]);
  const [deptGrid, setDeptGrid] = useState<Tables<"dept_grid">[]>([]);
  const [versions, setVersions] = useState<Tables<"assessment_versions">[]>([]);
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!assessmentId) return;
    Promise.all([
      supabase.from("assessments").select("*").eq("id", assessmentId).single(),
      supabase.from("assessment_checks").select("*").eq("assessment_id", assessmentId),
      supabase.from("policy_items").select("*").eq("assessment_id", assessmentId),
      supabase.from("dept_grid").select("*").eq("assessment_id", assessmentId),
      supabase.from("assessment_versions").select("*").eq("assessment_id", assessmentId).order("version_number", { ascending: false }),
      supabase.from("shared_reports").select("share_code").eq("assessment_id", assessmentId).eq("is_active", true).limit(1),
    ]).then(([a, c, p, d, v, s]) => {
      setAssessment(a.data);
      setChecks(c.data || []);
      setPolicyItems(p.data || []);
      setDeptGrid(d.data || []);
      setVersions(v.data || []);
      if (s.data && s.data.length > 0) setShareCode(s.data[0].share_code);
      setLoading(false);
    });
  }, [assessmentId]);

  const specialStatus = (assessment?.special_status as unknown as SpecialStatus) || {};

  // Compute domain scores
  const domainScores: DomainScore[] = DOMAINS.map((domain) => {
    const enabled = (() => {
      if (domain.conditional === "children") return !!specialStatus.children;
      if (domain.conditional === "consentMgr") return !!specialStatus.consentMgr;
      return true;
    })();

    if (!enabled) return { domain: domain.code, name: domain.name, items: 0, yes: 0, partial: 0, no: 0, na: domain.items.length, score: 0, penalty: domain.penalty };

    let totalWeight = 0;
    let weightedScore = 0;
    let yes = 0, partial = 0, no = 0, na = 0;

    domain.items.forEach((item) => {
      if (domain.sdfOnly?.includes(item.id) && !specialStatus.sdf) { na++; return; }
      const check = checks.find((c) => c.check_id === item.id);
      const pct = getStatusPct(check?.status || null);
      if (pct === null) { na++; return; }
      const mult = getRiskMultiplier(item.risk);
      totalWeight += mult;
      weightedScore += (pct / 100) * mult;
      if (pct === 100) yes++;
      else if (pct === 50) partial++;
      else no++;
    });

    const score = totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 100) : 0;
    return { domain: domain.code, name: domain.name, items: domain.items.length, yes, partial, no, na, score, penalty: domain.penalty };
  });

  // Overall score
  const totalWeight = domainScores.reduce((sum, d) => {
    const domain = DOMAINS.find((dd) => dd.code === d.domain)!;
    return sum + domain.items.reduce((s, item) => {
      if (domain.sdfOnly?.includes(item.id) && !specialStatus.sdf) return s;
      const check = checks.find((c) => c.check_id === item.id);
      const pct = getStatusPct(check?.status || null);
      if (pct === null) return s;
      return s + getRiskMultiplier(item.risk);
    }, 0);
  }, 0);

  const totalWeightedScore = domainScores.reduce((sum, d) => {
    const domain = DOMAINS.find((dd) => dd.code === d.domain)!;
    return sum + domain.items.reduce((s, item) => {
      if (domain.sdfOnly?.includes(item.id) && !specialStatus.sdf) return s;
      const check = checks.find((c) => c.check_id === item.id);
      const pct = getStatusPct(check?.status || null);
      if (pct === null) return s;
      return s + (pct / 100) * getRiskMultiplier(item.risk);
    }, 0);
  }, 0);

  const overallScore = totalWeight > 0 ? Math.round((totalWeightedScore / totalWeight) * 100) : 0;

  const getBand = (score: number) => {
    if (score >= 85) return { label: "COMPLIANT", color: "text-emerald", bg: "bg-emerald/10", emoji: "🟢" };
    if (score >= 70) return { label: "SUBSTANTIALLY READY", color: "text-emerald", bg: "bg-emerald/10", emoji: "🟡" };
    if (score >= 50) return { label: "PARTIAL GAPS", color: "text-amber", bg: "bg-amber/10", emoji: "🟠" };
    if (score >= 25) return { label: "MAJOR NON-COMPLIANCE", color: "text-risk-critical", bg: "bg-risk-critical/10", emoji: "🔴" };
    if (score > 0) return { label: "CRITICAL EXPOSURE", color: "text-muted-foreground", bg: "bg-muted", emoji: "⚫" };
    return { label: "PENDING", color: "text-muted-foreground", bg: "bg-muted", emoji: "⬜" };
  };

  const band = getBand(overallScore);
  const totalAssessed = domainScores.reduce((s, d) => s + d.yes + d.partial + d.no, 0);
  const totalYes = domainScores.reduce((s, d) => s + d.yes, 0);
  const totalPartial = domainScores.reduce((s, d) => s + d.partial, 0);
  const totalNo = domainScores.reduce((s, d) => s + d.no, 0);
  const p1Count = checks.filter((c) => c.priority === "P1–Immediate").length;

  const policyCurrentCount = policyItems.filter((p) => p.status === "Current").length;
  const policyMissingCount = policyItems.filter((p) => p.status === "Missing").length;

  const deptCompliant = deptGrid.filter((d) => d.status === "Yes").length;
  const deptTotal = deptGrid.filter((d) => d.status && d.status !== "N/A").length;

  const evidenceVerified = checks.filter((c) => c.evidence_status === "Verified–Seen").length;
  const evidenceStated = checks.filter((c) => c.evidence_status === "Stated–Not Verified").length;
  const evidenceNA = checks.filter((c) => c.evidence_status === "Not Available").length;

  const saveVersion = async () => {
    if (!assessmentId || !user) return;
    const versionNumber = (versions[0]?.version_number || 0) + 1;
    const snapshot = { assessment, checks, policyItems, deptGrid };
    const { error } = await supabase.from("assessment_versions").insert({
      assessment_id: assessmentId,
      version_number: versionNumber,
      snapshot_data: snapshot as unknown as Json,
      created_by: user.id,
    });
    if (error) { toast.error("Failed to save version"); return; }
    toast.success(`Version ${versionNumber} saved`);
    const { data } = await supabase.from("assessment_versions").select("*").eq("assessment_id", assessmentId).order("version_number", { ascending: false });
    setVersions(data || []);
  };

  const shareReport = async () => {
    if (!assessmentId || !user) return;
    const code = Array.from({ length: 8 }, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 36)]).join("");
    const { error } = await supabase.from("shared_reports").insert({
      assessment_id: assessmentId,
      share_code: code,
      shared_by: user.id,
    });
    if (error) { toast.error("Failed to share"); return; }
    setShareCode(code);
    toast.success("Report shared!");
  };

  const markComplete = async () => {
    if (!assessmentId) return;
    await supabase.from("assessments").update({ status: "Completed" }).eq("id", assessmentId);
    setAssessment((a) => a ? { ...a, status: "Completed" } : a);
    toast.success("Assessment marked as complete");
  };

  const handleExportPPT = async () => {
    const narrative = `DPDP Rapid Assessment (v3.0) for ${assessment?.org_name || "—"} covering ${totalAssessed} of 84 items across 14 domains. Weighted score: ${overallScore}% (${band.label}). ${totalYes} compliant, ${totalPartial} partial, ${totalNo} non-compliant. Evidence verified for ${evidenceVerified} items. Policy stack: ${policyCurrentCount} of 37 current; ${policyMissingCount} missing. P1 items: ${p1Count}. Dept grid: ${deptCompliant}/${deptTotal} compliant.`;
    toast.info("Generating presentation...");
    try {
      await exportDashboardToPPT({
        orgName: assessment?.org_name || "",
        overallScore,
        bandLabel: band.label,
        totalAssessed,
        totalYes,
        totalPartial,
        totalNo,
        p1Count,
        policyCurrentCount,
        policyMissingCount,
        deptCompliant,
        deptTotal,
        evidenceVerified,
        evidenceStated,
        evidenceNA,
        domainScores,
        penaltyMap,
        narrative,
      });
      toast.success("Presentation downloaded!");
    } catch (e: any) {
      toast.error("Export failed: " + e.message);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading dashboard...</div>;

  const penaltyMap = [
    { category: "Security safeguards breach", penalty: "₹250 Cr", domains: "E, K" },
    { category: "Breach notification failure", penalty: "₹200 Cr", domains: "F" },
    { category: "Children's data non-compliance", penalty: "₹200 Cr", domains: "I" },
    { category: "Processor obligation failures", penalty: "₹250 Cr", domains: "J, K" },
    { category: "Notice/consent/rights/governance", penalty: "₹50 Cr", domains: "A–D, G–H, L–O" },
  ];

  const chartData = domainScores.map((d) => ({ name: d.domain, score: d.score }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold bg-primary/20 text-primary px-2 py-1 rounded">PHASE 6</span>
          <h1 className="text-2xl font-bold">Compliance Dashboard</h1>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={handleExportPPT}><Download className="h-4 w-4 mr-2" /> Download PPT</Button>
          <Button variant="outline" onClick={saveVersion}><Save className="h-4 w-4 mr-2" /> Save Version</Button>
          <Button variant="outline" onClick={shareReport}><Share2 className="h-4 w-4 mr-2" /> Share Report</Button>
          <Button className="gradient-primary" onClick={markComplete}><CheckCircle2 className="h-4 w-4 mr-2" /> Mark Complete</Button>
        </div>
      </div>

      {/* Share Code Banner */}
      {shareCode && (
        <div className="flex items-center justify-between p-4 rounded-lg gradient-primary">
          <div className="flex items-center gap-3">
            <Share2 className="h-5 w-5" />
            <span className="font-medium">Share Code:</span>
            <span className="font-mono font-bold text-lg tracking-wider">{shareCode}</span>
          </div>
          <Button size="sm" variant="secondary" onClick={() => { navigator.clipboard.writeText(shareCode); toast.success("Copied!"); }}>
            <Copy className="h-4 w-4 mr-1" /> Copy
          </Button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className={`border-border ${band.bg}`}>
          <CardContent className="pt-6 text-center">
            <p className="text-4xl font-bold">{overallScore}%</p>
            <p className={`text-sm font-bold mt-1 ${band.color}`}>{band.emoji} {band.label}</p>
            <p className="text-xs text-muted-foreground mt-1">Weighted Score</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold">{totalAssessed}/92</p>
            <p className="text-xs text-muted-foreground mt-1">Items Assessed</p>
            <p className="text-xs mt-1">
              <span className="text-emerald">{totalYes}Y</span> / <span className="text-amber">{totalPartial}P</span> / <span className="text-risk-critical">{totalNo}N</span>
            </p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-risk-critical">{p1Count}</p>
            <p className="text-xs text-muted-foreground mt-1">P1 Urgent Items</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold">{policyCurrentCount}/37</p>
            <p className="text-xs text-muted-foreground mt-1">Policy Stack Current</p>
            <p className="text-xs text-risk-critical mt-1">{policyMissingCount} missing</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold">{deptCompliant}/{deptTotal}</p>
            <p className="text-xs text-muted-foreground mt-1">Dept Grid Health</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border bg-card">
          <CardHeader><CardTitle className="text-sm">Domain Scores</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fill: "hsl(213,31%,91%)", fontSize: 12 }} />
                <YAxis tick={{ fill: "hsl(215,20%,55%)", fontSize: 11 }} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(222,47%,8%)", border: "1px solid hsl(222,30%,18%)", borderRadius: 8, color: "hsl(213,31%,91%)" }} />
                <Bar dataKey="score" fill="hsl(239,84%,67%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader><CardTitle className="text-sm">Radar View</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={chartData}>
                <PolarGrid stroke="hsl(222,30%,18%)" />
                <PolarAngleAxis dataKey="name" tick={{ fill: "hsl(213,31%,91%)", fontSize: 11 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "hsl(215,20%,55%)", fontSize: 10 }} />
                <Radar name="Score" dataKey="score" stroke="hsl(239,84%,67%)" fill="hsl(239,84%,67%)" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Domain Breakdown */}
      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-sm">Domain Breakdown</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs">
                  <th className="text-left p-3">Domain</th>
                  <th className="text-center p-3">Items</th>
                  <th className="text-center p-3">Yes</th>
                  <th className="text-center p-3">Partial</th>
                  <th className="text-center p-3">No</th>
                  <th className="text-center p-3">N/A</th>
                  <th className="text-center p-3">Score</th>
                  <th className="text-center p-3">Penalty</th>
                </tr>
              </thead>
              <tbody>
                {domainScores.map((d) => {
                  const b = getBand(d.score);
                  return (
                    <tr key={d.domain} className="border-b border-border/50">
                      <td className="p-3"><span className="font-mono text-primary mr-2">{d.domain}</span>{d.name}</td>
                      <td className="text-center p-3">{d.items}</td>
                      <td className="text-center p-3 text-emerald">{d.yes}</td>
                      <td className="text-center p-3 text-amber">{d.partial}</td>
                      <td className="text-center p-3 text-risk-critical">{d.no}</td>
                      <td className="text-center p-3 text-muted-foreground">{d.na}</td>
                      <td className="text-center p-3"><span className={`font-bold ${b.color}`}>{d.score}%</span></td>
                      <td className="text-center p-3 font-mono text-xs text-penalty-red">{d.penalty}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Penalty Map */}
      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-risk-critical" /> Penalty Exposure Map</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs">
                <th className="text-left p-3">Violation Category</th>
                <th className="text-center p-3">Max Penalty</th>
                <th className="text-center p-3">Domains</th>
              </tr>
            </thead>
            <tbody>
              {penaltyMap.map((p) => (
                <tr key={p.category} className="border-b border-border/50">
                  <td className="p-3">{p.category}</td>
                  <td className="text-center p-3 font-mono font-bold text-penalty-red">{p.penalty}</td>
                  <td className="text-center p-3 font-mono text-primary">{p.domains}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Evidence + Version History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border bg-card">
          <CardHeader><CardTitle className="text-sm">Evidence Verification</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between"><span className="text-sm">Verified–Seen</span><span className="font-bold text-emerald">{evidenceVerified}</span></div>
            <div className="flex justify-between"><span className="text-sm">Stated–Not Verified</span><span className="font-bold text-amber">{evidenceStated}</span></div>
            <div className="flex justify-between"><span className="text-sm">Not Available</span><span className="font-bold text-risk-critical">{evidenceNA}</span></div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader><CardTitle className="text-sm">Version History</CardTitle></CardHeader>
          <CardContent>
            {versions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No versions saved yet.</p>
            ) : (
              <div className="space-y-2">
                {versions.map((v) => (
                  <div key={v.id} className="flex items-center justify-between p-2 bg-secondary/30 rounded">
                    <span className="text-sm font-mono">v{v.version_number}</span>
                    <span className="text-xs text-muted-foreground">{new Date(v.created_at).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Narrative */}
      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-sm">Auto-Generated Narrative</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">
            DPDP Rapid Assessment (v3.0) for <strong className="text-foreground">{assessment?.org_name || "—"}</strong> covering{" "}
            <strong className="text-foreground">{totalAssessed}</strong> of 84 items across 14 domains.
            Weighted score: <strong className={band.color}>{overallScore}% ({band.label})</strong>.{" "}
            {totalYes} compliant, {totalPartial} partial, {totalNo} non-compliant.
            Evidence verified for {evidenceVerified} items.
            Policy stack: {policyCurrentCount} of 37 current; {policyMissingCount} missing.
            P1 items: {p1Count}. Dept grid: {deptCompliant}/{deptTotal} compliant.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
