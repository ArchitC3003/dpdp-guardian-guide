import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { SPECIAL_STATUS_OPTIONS } from "@/data/assessmentDomains";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import type { Json } from "@/integrations/supabase/types";

type Assessment = Tables<"assessments">;

interface SpecialStatus {
  sdf: boolean;
  consentMgr: boolean;
  children: boolean;
  crossBorder: boolean;
  legacy: boolean;
  thirdSchedule: boolean;
  intermediary: boolean;
  startup: boolean;
  [key: string]: boolean;
}

export default function PhaseOrgProfile() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!assessmentId) return;
    supabase
      .from("assessments")
      .select("*")
      .eq("id", assessmentId)
      .single()
      .then(({ data }) => setAssessment(data));
  }, [assessmentId]);

  const save = useCallback(
    async (updates: Partial<Assessment>) => {
      if (!assessmentId) return;
      setSaving(true);
      await supabase.from("assessments").update(updates).eq("id", assessmentId);
      setSaving(false);
    },
    [assessmentId]
  );

  const updateField = (field: string, value: string) => {
    if (!assessment) return;
    const updated = { ...assessment, [field]: value } as Assessment;
    setAssessment(updated);
    save({ [field]: value } as any);
  };

  const toggleSpecial = (key: string) => {
    if (!assessment) return;
    const current = (assessment.special_status as unknown as SpecialStatus) || {};
    const updated = { ...current, [key]: !current[key] };
    setAssessment({ ...assessment, special_status: updated as unknown as Json });
    save({ special_status: updated as unknown as Json });
  };

  if (!assessment) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;

  const specialStatus = (assessment.special_status as unknown as SpecialStatus) || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold bg-primary/20 text-primary px-2 py-1 rounded">PHASE 1</span>
          <h1 className="text-2xl font-bold">Organisation Profile</h1>
          {saving && <span className="text-xs text-muted-foreground">Saving...</span>}
        </div>
        <Button onClick={() => navigate(`/assessment/${assessmentId}/policy-matrix`)} className="gradient-primary">
          Next Phase <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Org Details */}
      <Card className="border-border bg-card">
        <CardHeader><CardTitle>Organisation Details</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { field: "org_name", label: "Organisation Name" },
              { field: "org_industry", label: "Industry / Sector" },
              { field: "org_entity_type", label: "Entity Type", select: ["Pvt Ltd", "LLP", "Govt", "PSU", "Other"] },
              { field: "org_employees", label: "Total Employees" },
              { field: "org_data_subjects", label: "Data Subjects Volume" },
              { field: "org_locations", label: "Processing Locations" },
              { field: "org_regulators", label: "Sectoral Regulators" },
            ].map((f) => (
              <div key={f.field} className="space-y-2">
                <Label>{f.label}</Label>
                {f.select ? (
                  <Select
                    value={(assessment as any)[f.field] || ""}
                    onValueChange={(v) => updateField(f.field, v)}
                  >
                    <SelectTrigger><SelectValue placeholder={`Select ${f.label}`} /></SelectTrigger>
                    <SelectContent>
                      {f.select.map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={(assessment as any)[f.field] || ""}
                    onChange={(e) => updateField(f.field, e.target.value)}
                    placeholder={f.label}
                  />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Special Status */}
      <Card className="border-border bg-card">
        <CardHeader><CardTitle>Special Status Determination</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {SPECIAL_STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => toggleSpecial(opt.key)}
                className={`flex items-start gap-3 p-4 rounded-lg border transition-colors text-left ${
                  specialStatus[opt.key]
                    ? "border-primary bg-primary/5"
                    : "border-border bg-secondary/30 hover:border-muted-foreground/30"
                }`}
              >
                <Checkbox checked={specialStatus[opt.key] || false} className="mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{opt.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{opt.hint}</p>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
