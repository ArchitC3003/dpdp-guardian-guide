import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DOMAINS, type Domain } from "@/data/assessmentDomains";
import { RiskBadge } from "@/components/RiskBadge";
import { ArrowRight } from "lucide-react";
import type { Json } from "@/integrations/supabase/types";

interface CheckRow {
  id?: string;
  check_id: string;
  domain: string;
  status: string | null;
  evidence_status: string | null;
  priority: string | null;
  observation: string | null;
}

interface SpecialStatus {
  sdf?: boolean;
  consentMgr?: boolean;
  children?: boolean;
  [key: string]: boolean | undefined;
}

export default function PhaseRapidAssessment() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const [selectedDomain, setSelectedDomain] = useState("A");
  const [checks, setChecks] = useState<Record<string, CheckRow>>({});
  const [specialStatus, setSpecialStatus] = useState<SpecialStatus>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!assessmentId) return;
    // Load checks
    supabase.from("assessment_checks").select("*").eq("assessment_id", assessmentId)
      .then(({ data }) => {
        const map: Record<string, CheckRow> = {};
        (data || []).forEach((d) => { map[d.check_id] = d; });
        setChecks(map);
      });
    // Load special status
    supabase.from("assessments").select("special_status").eq("id", assessmentId).single()
      .then(({ data }) => {
        if (data?.special_status) setSpecialStatus(data.special_status as unknown as SpecialStatus);
      });
  }, [assessmentId]);

  const isDomainEnabled = (domain: Domain) => {
    if (domain.conditional === "children") return !!specialStatus.children;
    if (domain.conditional === "consentMgr") return !!specialStatus.consentMgr;
    if (domain.conditional === "processor") return true; // No specific flag for this in special_status
    return true;
  };

  const getDomainProgress = (domain: Domain) => {
    const total = domain.items.length;
    const answered = domain.items.filter((i) => checks[i.id]?.status).length;
    return total > 0 ? Math.round((answered / total) * 100) : 0;
  };

  const updateCheck = useCallback(async (checkId: string, domain: string, field: string, value: string) => {
    if (!assessmentId) return;
    const existing = checks[checkId];
    const updated = { ...existing, check_id: checkId, domain, [field]: value };
    setChecks((prev) => ({ ...prev, [checkId]: updated }));

    setSaving(true);
    if (existing?.id) {
      await supabase.from("assessment_checks").update({ [field]: value }).eq("id", existing.id);
    } else {
      const { data } = await supabase
        .from("assessment_checks")
        .insert({ assessment_id: assessmentId, check_id: checkId, domain, [field]: value })
        .select()
        .single();
      if (data) setChecks((prev) => ({ ...prev, [checkId]: { ...updated, id: data.id } }));
    }
    setSaving(false);
  }, [assessmentId, checks]);

  const currentDomain = DOMAINS.find((d) => d.code === selectedDomain)!;
  const enabled = isDomainEnabled(currentDomain);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold bg-primary/20 text-primary px-2 py-1 rounded">PHASE 3</span>
          <h1 className="text-2xl font-bold">Rapid Assessment</h1>
          {saving && <span className="text-xs text-muted-foreground">Saving...</span>}
        </div>
        <Button onClick={() => navigate(`/assessment/${assessmentId}/dept-grid`)} className="gradient-primary">
          Next Phase <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      <div className="flex gap-4">
        {/* Domain Picker */}
        <div className="w-[220px] shrink-0">
          <ScrollArea className="h-[calc(100vh-220px)]">
            <div className="space-y-1 pr-2">
              {DOMAINS.map((d) => {
                const en = isDomainEnabled(d);
                const progress = getDomainProgress(d);
                return (
                  <button
                    key={d.code}
                    onClick={() => setSelectedDomain(d.code)}
                    disabled={!en}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedDomain === d.code
                        ? "bg-primary/10 border border-primary"
                        : en
                        ? "bg-secondary/30 hover:bg-secondary/50 border border-transparent"
                        : "opacity-40 cursor-not-allowed border border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-sm text-primary">{d.code}</span>
                      {d.conditional && !en && (
                        <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">Conditional</span>
                      )}
                    </div>
                    <p className="text-xs font-medium truncate">{d.name}</p>
                    <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">{progress}% complete</p>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Assessment Items */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Domain Header */}
          <Card className="border-border bg-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-mono font-bold text-primary">{currentDomain.code}</span>
                  <div>
                    <h2 className="text-lg font-bold">{currentDomain.name}</h2>
                    <p className="text-xs text-muted-foreground">{currentDomain.section}</p>
                  </div>
                </div>
                <span className="text-sm font-mono font-bold bg-penalty-red/10 text-penalty-red px-3 py-1.5 rounded-lg">
                  {currentDomain.penalty}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          {!enabled ? (
            <Card className="border-border bg-card">
              <CardContent className="py-12 text-center text-muted-foreground">
                This domain is conditional and currently disabled. Enable the relevant special status flag in Phase 1.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {currentDomain.items.map((item) => {
                const isSdfOnly = currentDomain.sdfOnly?.includes(item.id);
                if (isSdfOnly && !specialStatus.sdf) return null;

                const check = checks[item.id] || { check_id: item.id, domain: currentDomain.code, status: null, evidence_status: null, priority: null, observation: null };
                return (
                  <Card key={item.id} className="border-border bg-card">
                    <CardContent className="pt-5 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-sm font-bold text-primary">{item.id}</span>
                            <RiskBadge risk={item.risk} />
                            {isSdfOnly && (
                              <span className="text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded">SDF Only</span>
                            )}
                          </div>
                          <p className="text-sm">{item.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">Evidence: {item.evidence}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <Select value={check.status || ""} onValueChange={(v) => updateCheck(item.id, currentDomain.code, "status", v)}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                          <SelectContent>
                            {["Yes", "Partial", "No", "N/A"].map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={check.evidence_status || ""} onValueChange={(v) => updateCheck(item.id, currentDomain.code, "evidence_status", v)}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Evidence" /></SelectTrigger>
                          <SelectContent>
                            {["Verified–Seen", "Stated–Not Verified", "Not Available"].map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={check.priority || ""} onValueChange={(v) => updateCheck(item.id, currentDomain.code, "priority", v)}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Priority" /></SelectTrigger>
                          <SelectContent>
                            {["P1–Immediate", "P2–30 Days", "P3–90 Days"].map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          className="h-8 text-xs"
                          value={check.observation || ""}
                          onChange={(e) => updateCheck(item.id, currentDomain.code, "observation", e.target.value)}
                          placeholder="Observation..."
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
