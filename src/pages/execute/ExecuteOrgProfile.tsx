import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FOOTPRINT_OPTIONS, EMPLOYEE_BANDS, PRINCIPALS_BANDS,
  GROUP_STRUCTURES, PRIMARY_ROLES,
  computeTriggeredFlags, computeCrosswalk,
} from "@/data/privcybhubIndustries";
import type { OrgProfileForm } from "@/types/execute";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowRight, Loader2 } from "lucide-react";

const empty: OrgProfileForm = {
  org_name: "", trade_name: "", group_structure: "",
  footprint: [], employee_band: "", principals_band: "", primary_role: "",
};

export default function ExecuteOrgProfile() {
  const navigate = useNavigate();
  const [form, setForm] = useState<OrgProfileForm>(empty);
  const [sectorIds, setSectorIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("execute.selectedSectors");
    if (!raw) { navigate("/execute/select"); return; }
    setSectorIds(JSON.parse(raw));
  }, [navigate]);

  const update = <K extends keyof OrgProfileForm>(k: K, v: OrgProfileForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const toggleFootprint = (f: string) =>
    setForm((s) => ({
      ...s,
      footprint: s.footprint.includes(f) ? s.footprint.filter((x) => x !== f) : [...s.footprint, f],
    }));

  const valid =
    form.org_name.trim() &&
    form.group_structure &&
    form.footprint.length > 0 &&
    form.employee_band &&
    form.principals_band &&
    form.primary_role;

  const submit = async () => {
    if (!valid) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Please sign in"); setSaving(false); return; }
    const flags = computeTriggeredFlags(sectorIds, form.footprint);
    const crosswalk = computeCrosswalk(sectorIds, form.footprint);
    const { data, error } = await supabase
      .from("execute_workspaces")
      .insert([{
        user_id: user.id,
        org_name: form.org_name,
        trade_name: form.trade_name || null,
        group_structure: form.group_structure,
        footprint: form.footprint,
        employee_band: form.employee_band,
        principals_band: form.principals_band,
        primary_role: form.primary_role,
        selected_sector_ids: sectorIds,
        triggered_flags: flags as never,
        crosswalk_summary: crosswalk as never,
      }])
      .select("id")
      .single();
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    sessionStorage.removeItem("execute.selectedSectors");
    toast.success("Workspace created");
    navigate(`/execute/workspace/${data.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        <div>
          <p className="text-xs font-mono text-muted-foreground">STEP 2 OF 3</p>
          <h1 className="text-2xl font-bold">Tell us about your organisation</h1>
          <p className="text-sm text-muted-foreground">
            We use this to compute your sensitive-data exposure and cross-border posture.
          </p>
        </div>

        <Card><CardContent className="p-6 space-y-5 animate-in fade-in duration-300">
          <h3 className="text-sm font-mono uppercase text-muted-foreground">Identity</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Legal entity name *</Label>
              <Input value={form.org_name} onChange={(e) => update("org_name", e.target.value)} placeholder="Acme Technologies Pvt. Ltd." />
            </div>
            <div className="space-y-1.5">
              <Label>Trade / brand name</Label>
              <Input value={form.trade_name} onChange={(e) => update("trade_name", e.target.value)} placeholder="Acme" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Group structure *</Label>
              <Select value={form.group_structure} onValueChange={(v) => update("group_structure", v as OrgProfileForm["group_structure"])}>
                <SelectTrigger><SelectValue placeholder="Choose…" /></SelectTrigger>
                <SelectContent>
                  {GROUP_STRUCTURES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent></Card>

        <Card><CardContent className="p-6 space-y-4 animate-in fade-in duration-300 delay-75">
          <h3 className="text-sm font-mono uppercase text-muted-foreground">Footprint *</h3>
          <div className="flex flex-wrap gap-2">
            {FOOTPRINT_OPTIONS.map((f) => {
              const checked = form.footprint.includes(f);
              return (
                <label key={f} className={`flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer transition-colors ${checked ? "border-primary bg-primary/10" : "border-border hover:bg-muted/40"}`}>
                  <Checkbox checked={checked} onCheckedChange={() => toggleFootprint(f)} />
                  <span className="text-sm">{f}</span>
                </label>
              );
            })}
          </div>
        </CardContent></Card>

        <Card><CardContent className="p-6 space-y-5 animate-in fade-in duration-300 delay-150">
          <h3 className="text-sm font-mono uppercase text-muted-foreground">Scale</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Employees *</Label>
              <Select value={form.employee_band} onValueChange={(v) => update("employee_band", v as OrgProfileForm["employee_band"])}>
                <SelectTrigger><SelectValue placeholder="Choose…" /></SelectTrigger>
                <SelectContent>{EMPLOYEE_BANDS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Data principals *</Label>
              <Select value={form.principals_band} onValueChange={(v) => update("principals_band", v as OrgProfileForm["principals_band"])}>
                <SelectTrigger><SelectValue placeholder="Choose…" /></SelectTrigger>
                <SelectContent>{PRINCIPALS_BANDS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Primary role *</Label>
              <Select value={form.primary_role} onValueChange={(v) => update("primary_role", v as OrgProfileForm["primary_role"])}>
                <SelectTrigger><SelectValue placeholder="Choose…" /></SelectTrigger>
                <SelectContent>{PRIMARY_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </CardContent></Card>

        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline">{sectorIds.length} sectors selected</Badge>
          </div>
          <Button onClick={submit} disabled={!valid || saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            Create workspace
          </Button>
        </div>
      </div>
    </div>
  );
}