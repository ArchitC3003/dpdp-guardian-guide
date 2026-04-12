import { useState, useEffect, useCallback, useRef } from "react";
import { Navigate } from "react-router-dom";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Plus, BookOpen, Shield, Edit2, Trash2, ChevronRight, Upload, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";

/* ─── Types ────────────────────────────────────────────── */
interface Framework {
  id: string;
  name: string;
  short_code: string;
  version: string;
  description: string | null;
  jurisdiction: string;
  regulatory_body: string | null;
  effective_date: string | null;
  icon_name: string;
  colour: string;
  is_active: boolean;
  is_default: boolean;
}

interface Domain {
  id: string;
  framework_id: string;
  code: string;
  name: string;
  section_ref: string | null;
  penalty_ref: string | null;
  description: string | null;
  display_order: number;
  conditional_flag: string | null;
  is_active: boolean;
}

interface Requirement {
  id: string;
  domain_id: string;
  item_code: string;
  description: string;
  guidance: string | null;
  risk_level: string;
  evidence_type: string;
  sdf_only: boolean;
  display_order: number;
  is_active: boolean;
}

/* ─── Risk badge helper ────────────────────────────────── */
const riskColor: Record<string, string> = {
  critical: "bg-red-500/15 text-red-400 border-red-500/30",
  high: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  standard: "bg-muted text-muted-foreground border-border",
};

/* ─── Page ─────────────────────────────────────────────── */
export default function AdminFrameworkManager() {
  const { isAdmin, loading: adminLoading } = useIsAdmin();

  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [selectedFw, setSelectedFw] = useState<Framework | null>(null);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);

  // Dialog states
  const [fwDialog, setFwDialog] = useState(false);
  const [domainDialog, setDomainDialog] = useState(false);
  const [reqDialog, setReqDialog] = useState(false);
  const [editingFw, setEditingFw] = useState<Partial<Framework>>({});
  const [editingDomain, setEditingDomain] = useState<Partial<Domain>>({});
  const [editingReq, setEditingReq] = useState<Partial<Requirement>>({});

  // Excel import states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importDialog, setImportDialog] = useState(false);
  const [importMode, setImportMode] = useState<"replace" | "append">("append");
  const [importing, setImporting] = useState(false);
  const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([]);
  const [parsedSummary, setParsedSummary] = useState({ domains: 0, requirements: 0, rows: 0 });

  /* ── Fetch frameworks ─────────────────────────────────── */
  const fetchFrameworks = useCallback(async () => {
    const { data, error } = await supabase
      .from("assessment_frameworks")
      .select("*")
      .order("name");
    if (error) { toast.error("Failed to load frameworks"); return; }
    setFrameworks(data ?? []);
  }, []);

  useEffect(() => { fetchFrameworks(); }, [fetchFrameworks]);

  /* ── Fetch domains for selected framework ─────────────── */
  const fetchDomains = useCallback(async (fwId: string) => {
    const { data, error } = await supabase
      .from("framework_domains")
      .select("*")
      .eq("framework_id", fwId)
      .order("display_order");
    if (error) { toast.error("Failed to load domains"); return; }
    setDomains(data ?? []);
    setSelectedDomain(null);
    setRequirements([]);
  }, []);

  useEffect(() => {
    if (selectedFw) fetchDomains(selectedFw.id);
    else { setDomains([]); setSelectedDomain(null); setRequirements([]); }
  }, [selectedFw, fetchDomains]);

  /* ── Fetch requirements for selected domain ───────────── */
  const fetchRequirements = useCallback(async (domainId: string) => {
    const { data, error } = await supabase
      .from("framework_requirements")
      .select("*")
      .eq("domain_id", domainId)
      .order("display_order");
    if (error) { toast.error("Failed to load requirements"); return; }
    setRequirements(data ?? []);
  }, []);

  useEffect(() => {
    if (selectedDomain) fetchRequirements(selectedDomain.id);
    else setRequirements([]);
  }, [selectedDomain, fetchRequirements]);

  /* ── Framework CRUD ───────────────────────────────────── */
  const saveFramework = async () => {
    const isNew = !editingFw.id;
    if (!editingFw.name || !editingFw.short_code) {
      toast.error("Name and short code are required"); return;
    }
    const payload = {
      name: editingFw.name,
      short_code: editingFw.short_code,
      version: editingFw.version || "1.0",
      description: editingFw.description || null,
      jurisdiction: editingFw.jurisdiction || "India",
      regulatory_body: editingFw.regulatory_body || null,
      icon_name: editingFw.icon_name || "Shield",
      colour: editingFw.colour || "#3B82F6",
      is_active: editingFw.is_active ?? true,
      is_default: editingFw.is_default ?? false,
    };

    if (isNew) {
      const { error } = await supabase.from("assessment_frameworks").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Framework created");
    } else {
      const { error } = await supabase.from("assessment_frameworks").update(payload).eq("id", editingFw.id!);
      if (error) { toast.error(error.message); return; }
      toast.success("Framework updated");
    }
    setFwDialog(false);
    fetchFrameworks();
  };

  const toggleFrameworkActive = async (fw: Framework) => {
    const { error } = await supabase
      .from("assessment_frameworks")
      .update({ is_active: !fw.is_active })
      .eq("id", fw.id);
    if (error) { toast.error(error.message); return; }
    fetchFrameworks();
    if (selectedFw?.id === fw.id) setSelectedFw({ ...fw, is_active: !fw.is_active });
  };

  /* ── Domain CRUD ──────────────────────────────────────── */
  const saveDomain = async () => {
    if (!selectedFw) return;
    const isNew = !editingDomain.id;
    if (!editingDomain.code || !editingDomain.name) {
      toast.error("Code and name are required"); return;
    }
    const payload = {
      framework_id: selectedFw.id,
      code: editingDomain.code,
      name: editingDomain.name,
      section_ref: editingDomain.section_ref || null,
      penalty_ref: editingDomain.penalty_ref || null,
      description: editingDomain.description || null,
      display_order: editingDomain.display_order ?? 0,
      conditional_flag: editingDomain.conditional_flag || null,
      is_active: editingDomain.is_active ?? true,
    };

    if (isNew) {
      const { error } = await supabase.from("framework_domains").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Domain created");
    } else {
      const { error } = await supabase.from("framework_domains").update(payload).eq("id", editingDomain.id!);
      if (error) { toast.error(error.message); return; }
      toast.success("Domain updated");
    }
    setDomainDialog(false);
    fetchDomains(selectedFw.id);
  };

  /* ── Requirement CRUD ─────────────────────────────────── */
  const saveRequirement = async () => {
    if (!selectedDomain) return;
    const isNew = !editingReq.id;
    if (!editingReq.item_code || !editingReq.description) {
      toast.error("Item code and description are required"); return;
    }
    const payload = {
      domain_id: selectedDomain.id,
      item_code: editingReq.item_code,
      description: editingReq.description,
      guidance: editingReq.guidance || null,
      risk_level: editingReq.risk_level || "standard",
      evidence_type: editingReq.evidence_type || "Document",
      sdf_only: editingReq.sdf_only ?? false,
      display_order: editingReq.display_order ?? 0,
      is_active: editingReq.is_active ?? true,
    };

    if (isNew) {
      const { error } = await supabase.from("framework_requirements").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Requirement created");
    } else {
      const { error } = await supabase.from("framework_requirements").update(payload).eq("id", editingReq.id!);
      if (error) { toast.error(error.message); return; }
      toast.success("Requirement updated");
    }
    setReqDialog(false);
    fetchRequirements(selectedDomain.id);
  };

  /* ── Excel Import ──────────────────────────────────────── */
  const normalizeHeader = (h: string) => h.trim().toLowerCase().replace(/[\s_-]+/g, "_");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" });
        if (rows.length === 0) { toast.error("No data rows found in spreadsheet"); return; }
        // Detect unique domains
        const headerMap: Record<string, string> = {};
        Object.keys(rows[0]).forEach(k => { headerMap[normalizeHeader(k)] = k; });
        const domainCodeKey = headerMap["domain_code"] || headerMap["domaincode"] || headerMap["domain"];
        const domainNameKey = headerMap["domain_name"] || headerMap["domainname"];
        if (!domainCodeKey) { toast.error("Missing 'Domain Code' column in spreadsheet"); return; }
        const uniqueDomains = new Set<string>();
        rows.forEach(r => { const code = String(r[domainCodeKey] || "").trim(); if (code) uniqueDomains.add(code); });
        setParsedRows(rows);
        setParsedSummary({ domains: uniqueDomains.size, requirements: rows.length, rows: rows.length });
        setImportDialog(true);
      } catch (err) {
        toast.error("Failed to parse file");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const executeImport = async () => {
    if (!selectedFw || parsedRows.length === 0) return;
    setImporting(true);
    try {
      const headerMap: Record<string, string> = {};
      Object.keys(parsedRows[0]).forEach(k => { headerMap[normalizeHeader(k)] = k; });
      const col = (row: Record<string, string>, ...keys: string[]) => {
        for (const k of keys) { const mapped = headerMap[k]; if (mapped && row[mapped]) return String(row[mapped]).trim(); }
        return "";
      };
      const validRisk = new Set(["critical", "high", "standard"]);
      const validEvidence = new Set(["Document", "Policy", "Process", "Technical", "Interview"]);
      const isTruthy = (v: string) => ["yes", "true", "1"].includes(v.toLowerCase());

      // If replace mode, delete existing domains (cascade will delete requirements)
      if (importMode === "replace") {
        const { error } = await supabase.from("framework_domains").delete().eq("framework_id", selectedFw.id);
        if (error) throw error;
      }

      // Group rows by domain
      const domainMap = new Map<string, { name: string; sectionRef: string; penaltyRef: string; desc: string; rows: Record<string, string>[] }>();
      parsedRows.forEach(r => {
        const code = col(r, "domain_code", "domaincode", "domain");
        if (!code) return;
        if (!domainMap.has(code)) {
          domainMap.set(code, {
            name: col(r, "domain_name", "domainname") || code,
            sectionRef: col(r, "section_ref", "sectionref", "section"),
            penaltyRef: col(r, "penalty_ref", "penaltyref", "penalty"),
            desc: col(r, "domain_description", "domaindescription"),
            rows: [],
          });
        }
        domainMap.get(code)!.rows.push(r);
      });

      let totalDomains = 0, totalReqs = 0;
      let domainOrder = 0;
      for (const [code, info] of domainMap) {
        // Insert domain
        const { data: domainData, error: domErr } = await supabase
          .from("framework_domains")
          .insert({
            framework_id: selectedFw.id,
            code,
            name: info.name,
            section_ref: info.sectionRef || null,
            penalty_ref: info.penaltyRef || null,
            description: info.desc || null,
            display_order: domainOrder++,
            is_active: true,
          })
          .select("id")
          .single();
        if (domErr) {
          if (importMode === "append" && domErr.code === "23505") {
            // Duplicate domain in append mode — fetch existing
            const { data: existing } = await supabase
              .from("framework_domains")
              .select("id")
              .eq("framework_id", selectedFw.id)
              .eq("code", code)
              .single();
            if (existing) {
              // Insert requirements under existing domain
              const reqs = info.rows.map((r, i) => {
                const riskRaw = col(r, "risk_level", "risklevel", "risk").toLowerCase();
                const evRaw = col(r, "evidence_type", "evidencetype", "evidence");
                return {
                  domain_id: existing.id,
                  item_code: col(r, "item_code", "itemcode", "requirement_code", "requirementcode", "code") || `${code}.${i + 1}`,
                  description: col(r, "description", "requirement", "requirement_description"),
                  guidance: col(r, "guidance", "notes") || null,
                  risk_level: validRisk.has(riskRaw) ? riskRaw : "standard",
                  evidence_type: validEvidence.has(evRaw) ? evRaw : "Document",
                  sdf_only: isTruthy(col(r, "sdf_only", "sdfonly", "sdf")),
                  display_order: i,
                  is_active: true,
                };
              });
              if (reqs.length > 0) {
                const { error: reqErr } = await supabase.from("framework_requirements").insert(reqs);
                if (reqErr && reqErr.code !== "23505") throw reqErr;
                totalReqs += reqs.length;
              }
            }
            continue;
          }
          throw domErr;
        }
        totalDomains++;
        // Insert requirements
        const reqs = info.rows.map((r, i) => {
          const riskRaw = col(r, "risk_level", "risklevel", "risk").toLowerCase();
          const evRaw = col(r, "evidence_type", "evidencetype", "evidence");
          return {
            domain_id: domainData.id,
            item_code: col(r, "item_code", "itemcode", "requirement_code", "requirementcode", "code") || `${code}.${i + 1}`,
            description: col(r, "description", "requirement", "requirement_description"),
            guidance: col(r, "guidance", "notes") || null,
            risk_level: validRisk.has(riskRaw) ? riskRaw : "standard",
            evidence_type: validEvidence.has(evRaw) ? evRaw : "Document",
            sdf_only: isTruthy(col(r, "sdf_only", "sdfonly", "sdf")),
            display_order: i,
            is_active: true,
          };
        });
        if (reqs.length > 0) {
          const { error: reqErr } = await supabase.from("framework_requirements").insert(reqs);
          if (reqErr) throw reqErr;
          totalReqs += reqs.length;
        }
      }

      toast.success(`Imported ${totalDomains} domains and ${totalReqs} requirements`);
      setImportDialog(false);
      fetchDomains(selectedFw.id);
    } catch (err: any) {
      toast.error(err.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  /* ── Guards ───────────────────────────────────────────── */
  if (adminLoading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <BookOpen className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Framework Manager</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-160px)]">
        {/* ─── LEFT: Frameworks ──────────────────────────── */}
        <Card className="flex flex-col">
          <CardHeader className="py-3 px-4 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold">Frameworks</CardTitle>
            <Button size="sm" onClick={() => { setEditingFw({}); setFwDialog(true); }}>
              <Plus className="h-3 w-3 mr-1" /> Add
            </Button>
          </CardHeader>
          <Separator />
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {frameworks.map(fw => (
                <button
                  key={fw.id}
                  onClick={() => setSelectedFw(fw)}
                  className={cn(
                    "w-full text-left rounded-md px-3 py-2.5 transition-colors",
                    selectedFw?.id === fw.id
                      ? "bg-primary/15 border border-primary/30"
                      : "hover:bg-muted/50 border border-transparent"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{fw.name}</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                          {fw.short_code}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-[9px] px-1 py-0">{fw.jurisdiction}</Badge>
                        <span className="text-[10px] text-muted-foreground">v{fw.version}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <Switch
                        checked={fw.is_active}
                        onCheckedChange={() => toggleFrameworkActive(fw)}
                        className="scale-75"
                        onClick={e => e.stopPropagation()}
                      />
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7"
                        onClick={e => { e.stopPropagation(); setEditingFw(fw); setFwDialog(true); }}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </button>
              ))}
              {frameworks.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">No frameworks yet</p>
              )}
            </div>
          </ScrollArea>
        </Card>

        {/* ─── MIDDLE: Domains ──────────────────────────── */}
        <Card className="flex flex-col">
          <CardHeader className="py-3 px-4 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold">
              {selectedFw ? `Domains — ${selectedFw.short_code}` : "Domains"}
            </CardTitle>
            {selectedFw && (
              <Button size="sm" onClick={() => { setEditingDomain({}); setDomainDialog(true); }}>
                <Plus className="h-3 w-3 mr-1" /> Add
              </Button>
            )}
          </CardHeader>
          <Separator />
          <ScrollArea className="flex-1">
            {!selectedFw ? (
              <p className="text-xs text-muted-foreground text-center py-8">Select a framework</p>
            ) : (
              <div className="p-2 space-y-1">
                {domains.map(d => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDomain(d)}
                    className={cn(
                      "w-full text-left rounded-md px-3 py-2.5 transition-colors",
                      selectedDomain?.id === d.id
                        ? "bg-primary/15 border border-primary/30"
                        : "hover:bg-muted/50 border border-transparent"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono shrink-0">{d.code}</Badge>
                          <span className="text-sm truncate">{d.name}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {d.section_ref && <span className="text-[10px] text-muted-foreground">§{d.section_ref}</span>}
                          <span className="text-[10px] text-muted-foreground">Order: {d.display_order}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7"
                          onClick={e => { e.stopPropagation(); setEditingDomain(d); setDomainDialog(true); }}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </button>
                ))}
                {domains.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-8">No domains yet</p>
                )}
              </div>
            )}
          </ScrollArea>
        </Card>

        {/* ─── RIGHT: Requirements ──────────────────────── */}
        <Card className="flex flex-col">
          <CardHeader className="py-3 px-4 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold">
              {selectedDomain ? `Requirements — ${selectedDomain.code}` : "Requirements"}
            </CardTitle>
            {selectedDomain && (
              <Button size="sm" onClick={() => { setEditingReq({}); setReqDialog(true); }}>
                <Plus className="h-3 w-3 mr-1" /> Add
              </Button>
            )}
          </CardHeader>
          <Separator />
          <ScrollArea className="flex-1">
            {!selectedDomain ? (
              <p className="text-xs text-muted-foreground text-center py-8">Select a domain</p>
            ) : (
              <div className="p-2 space-y-1">
                {requirements.map(r => (
                  <div
                    key={r.id}
                    className="rounded-md border border-border px-3 py-2.5 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono shrink-0">{r.item_code}</Badge>
                          <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0", riskColor[r.risk_level] || riskColor.standard)}>
                            {r.risk_level}
                          </Badge>
                          <Badge variant="secondary" className="text-[9px] px-1 py-0">{r.evidence_type}</Badge>
                          {r.sdf_only && <Badge className="text-[9px] px-1 py-0 bg-purple-500/15 text-purple-400 border-purple-500/30">SDF</Badge>}
                        </div>
                        <p className="text-xs text-foreground/80 leading-relaxed">{r.description}</p>
                      </div>
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7 shrink-0"
                        onClick={() => { setEditingReq(r); setReqDialog(true); }}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                {requirements.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-8">No requirements yet</p>
                )}
              </div>
            )}
          </ScrollArea>
        </Card>
      </div>

      {/* ─── Framework Dialog ───────────────────────────── */}
      <Dialog open={fwDialog} onOpenChange={setFwDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingFw.id ? "Edit Framework" : "Add Framework"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Name</Label><Input value={editingFw.name || ""} onChange={e => setEditingFw(p => ({ ...p, name: e.target.value }))} /></div>
              <div><Label>Short Code</Label><Input value={editingFw.short_code || ""} onChange={e => setEditingFw(p => ({ ...p, short_code: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Version</Label><Input value={editingFw.version || "1.0"} onChange={e => setEditingFw(p => ({ ...p, version: e.target.value }))} /></div>
              <div><Label>Jurisdiction</Label><Input value={editingFw.jurisdiction || "India"} onChange={e => setEditingFw(p => ({ ...p, jurisdiction: e.target.value }))} /></div>
            </div>
            <div><Label>Description</Label><Textarea rows={2} value={editingFw.description || ""} onChange={e => setEditingFw(p => ({ ...p, description: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Regulatory Body</Label><Input value={editingFw.regulatory_body || ""} onChange={e => setEditingFw(p => ({ ...p, regulatory_body: e.target.value }))} /></div>
              <div><Label>Colour</Label><Input type="color" value={editingFw.colour || "#3B82F6"} onChange={e => setEditingFw(p => ({ ...p, colour: e.target.value }))} className="h-10" /></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2"><Switch checked={editingFw.is_active ?? true} onCheckedChange={v => setEditingFw(p => ({ ...p, is_active: v }))} /><Label>Active</Label></div>
              <div className="flex items-center gap-2"><Switch checked={editingFw.is_default ?? false} onCheckedChange={v => setEditingFw(p => ({ ...p, is_default: v }))} /><Label>Default</Label></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFwDialog(false)}>Cancel</Button>
            <Button onClick={saveFramework}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Domain Dialog ──────────────────────────────── */}
      <Dialog open={domainDialog} onOpenChange={setDomainDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingDomain.id ? "Edit Domain" : "Add Domain"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Code</Label><Input value={editingDomain.code || ""} onChange={e => setEditingDomain(p => ({ ...p, code: e.target.value }))} placeholder="e.g. A" /></div>
              <div><Label>Display Order</Label><Input type="number" value={editingDomain.display_order ?? 0} onChange={e => setEditingDomain(p => ({ ...p, display_order: parseInt(e.target.value) || 0 }))} /></div>
            </div>
            <div><Label>Name</Label><Input value={editingDomain.name || ""} onChange={e => setEditingDomain(p => ({ ...p, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Section Ref</Label><Input value={editingDomain.section_ref || ""} onChange={e => setEditingDomain(p => ({ ...p, section_ref: e.target.value }))} /></div>
              <div><Label>Penalty Ref</Label><Input value={editingDomain.penalty_ref || ""} onChange={e => setEditingDomain(p => ({ ...p, penalty_ref: e.target.value }))} /></div>
            </div>
            <div><Label>Description</Label><Textarea rows={2} value={editingDomain.description || ""} onChange={e => setEditingDomain(p => ({ ...p, description: e.target.value }))} /></div>
            <div><Label>Conditional Flag</Label><Input value={editingDomain.conditional_flag || ""} onChange={e => setEditingDomain(p => ({ ...p, conditional_flag: e.target.value }))} placeholder="e.g. sdf, children" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDomainDialog(false)}>Cancel</Button>
            <Button onClick={saveDomain}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Requirement Dialog ─────────────────────────── */}
      <Dialog open={reqDialog} onOpenChange={setReqDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingReq.id ? "Edit Requirement" : "Add Requirement"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Item Code</Label><Input value={editingReq.item_code || ""} onChange={e => setEditingReq(p => ({ ...p, item_code: e.target.value }))} placeholder="e.g. A.1" /></div>
              <div><Label>Display Order</Label><Input type="number" value={editingReq.display_order ?? 0} onChange={e => setEditingReq(p => ({ ...p, display_order: parseInt(e.target.value) || 0 }))} /></div>
            </div>
            <div><Label>Description</Label><Textarea rows={3} value={editingReq.description || ""} onChange={e => setEditingReq(p => ({ ...p, description: e.target.value }))} /></div>
            <div><Label>Guidance</Label><Textarea rows={2} value={editingReq.guidance || ""} onChange={e => setEditingReq(p => ({ ...p, guidance: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Risk Level</Label>
                <Select value={editingReq.risk_level || "standard"} onValueChange={v => setEditingReq(p => ({ ...p, risk_level: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Evidence Type</Label>
                <Select value={editingReq.evidence_type || "Document"} onValueChange={v => setEditingReq(p => ({ ...p, evidence_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Document">Document</SelectItem>
                    <SelectItem value="Policy">Policy</SelectItem>
                    <SelectItem value="Process">Process</SelectItem>
                    <SelectItem value="Technical">Technical</SelectItem>
                    <SelectItem value="Interview">Interview</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2"><Switch checked={editingReq.sdf_only ?? false} onCheckedChange={v => setEditingReq(p => ({ ...p, sdf_only: v }))} /><Label>SDF Only</Label></div>
              <div className="flex items-center gap-2"><Switch checked={editingReq.is_active ?? true} onCheckedChange={v => setEditingReq(p => ({ ...p, is_active: v }))} /><Label>Active</Label></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReqDialog(false)}>Cancel</Button>
            <Button onClick={saveRequirement}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
