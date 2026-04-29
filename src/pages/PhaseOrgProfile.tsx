import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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

type DpdpRole = "data_fiduciary" | "joint_data_fiduciary" | "data_processor" | "dual_role";

interface RoleTile {
  role: DpdpRole;
  title: string;
  descriptor: string;
  badgeLabel: string;
  colour: string; // hex
  implication: string;
  isJoint: boolean;
  isDual: boolean;
}

const ROLE_TILES: RoleTile[] = [
  {
    role: "data_fiduciary",
    title: "We decide what personal data to collect and why",
    descriptor: "You alone determine the purpose and means of processing (Sec 2(i))",
    badgeLabel: "Data Fiduciary",
    colour: "#3B82F6", // blue
    implication: "Primary obligations apply — consent, notice, grievance redressal, and data principal rights.",
    isJoint: false,
    isDual: false,
  },
  {
    role: "joint_data_fiduciary",
    title: "We process data jointly with another organisation",
    descriptor: "Two or more entities together determine the purpose and means (Sec 2(i) — 'in conjunction')",
    badgeLabel: "Joint Data Fiduciary",
    colour: "#14B8A6", // teal
    implication: "Obligations apply jointly. Define inter-se responsibilities with your co-fiduciary via agreement.",
    isJoint: true,
    isDual: false,
  },
  {
    role: "data_processor",
    title: "We process data strictly on a client's instructions",
    descriptor: "A Data Fiduciary tells you what to do with their data — you have no say in purpose (Sec 2(n))",
    badgeLabel: "Data Processor",
    colour: "#F59E0B", // amber
    implication: "You must act only on documented instructions. Fiduciary obligations do not apply to you.",
    isJoint: false,
    isDual: false,
  },
  {
    role: "dual_role",
    title: "We do both — control some data and process others' data",
    descriptor: "E.g., a SaaS platform that is a Fiduciary for its own users but a Processor for enterprise clients",
    badgeLabel: "Dual Role",
    colour: "#A855F7", // purple
    implication: "Fiduciary obligations apply to data you control; Processor obligations apply to client data. Maintain clear separation.",
    isJoint: false,
    isDual: true,
  },
];

export default function PhaseOrgProfile() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [saving, setSaving] = useState(false);
  const [triedAdvance, setTriedAdvance] = useState(false);

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

  const selectRole = (tile: RoleTile) => {
    if (!assessment) return;
    const updates: Partial<Assessment> = {
      dpdp_role: tile.role,
      is_joint_fiduciary: tile.isJoint,
      is_dual_role: tile.isDual,
      role_identified_at: new Date().toISOString(),
    } as any;
    setAssessment({ ...assessment, ...updates } as Assessment);
    setTriedAdvance(false);
    save(updates);
  };

  const handleNext = () => {
    if (!assessment?.dpdp_role) {
      setTriedAdvance(true);
      toast.error("Please identify your organisation's data role to continue.");
      return;
    }
    navigate(`/assessment/${assessmentId}/policy-matrix`);
  };

  if (!assessment) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;

  const specialStatus = (assessment.special_status as unknown as SpecialStatus) || {};
  const currentRole = (assessment as any).dpdp_role as DpdpRole | null | undefined;
  const currentTile = ROLE_TILES.find((t) => t.role === currentRole) || null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold bg-primary/20 text-primary px-2 py-1 rounded">PHASE 1</span>
          <h1 className="text-2xl font-bold">Organisation Profile</h1>
          {saving && <span className="text-xs text-muted-foreground">Saving...</span>}
        </div>
        <Button onClick={handleNext} className="gradient-primary">
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

      {/* Data Role Identification */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Data Role Identification</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Your role under the DPDP Act determines which obligations apply to you. Select the statement that best describes how your organisation handles personal data.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ROLE_TILES.map((tile) => {
              const selected = currentRole === tile.role;
              return (
                <button
                  key={tile.role}
                  onClick={() => selectRole(tile)}
                  className={`flex items-start gap-3 p-4 rounded-lg border transition-colors text-left ${
                    selected
                      ? "border-primary bg-primary/5"
                      : "border-border bg-secondary/30 hover:border-muted-foreground/30"
                  }`}
                >
                  <div
                    className={`mt-1 h-4 w-4 rounded-full border flex-shrink-0 flex items-center justify-center ${
                      selected ? "border-primary" : "border-muted-foreground/40"
                    }`}
                  >
                    {selected && <span className="h-2 w-2 rounded-full bg-primary" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{tile.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{tile.descriptor}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {currentTile && (
            <div
              className="mt-4 flex items-start gap-3 p-3 rounded-lg border"
              style={{
                borderColor: `${currentTile.colour}66`,
                backgroundColor: `${currentTile.colour}14`,
              }}
            >
              <Badge
                className="border"
                style={{
                  backgroundColor: `${currentTile.colour}26`,
                  color: currentTile.colour,
                  borderColor: `${currentTile.colour}66`,
                }}
              >
                {currentTile.badgeLabel}
              </Badge>
              <p className="text-xs text-muted-foreground flex-1">{currentTile.implication}</p>
            </div>
          )}

          {triedAdvance && !currentRole && (
            <p className="mt-3 text-xs text-muted-foreground">
              Please identify your organisation's data role to continue.
            </p>
          )}
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
