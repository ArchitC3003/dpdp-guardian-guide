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
import { Plus, BookOpen, Edit2, ChevronRight, Upload, Loader2, Download, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { parsePack, validatePack, downloadTemplate, type ParsedPack, type ValidationResult } from "@/utils/assessmentPackParser";

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

  // Pack import states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [packDialog, setPackDialog] = useState(false);
  const [packStep, setPackStep] = useState<1 | 2 | 3>(1);
  const [packMode, setPackMode] = useState<"create" | "populate">("create");
  const [populateTargetId, setPopulateTargetId] = useState<string>("");
  const [packFile, setPackFile] = useState<File | null>(null);
  const [parsedPack, setParsedPack] = useState<ParsedPack | null>(null);
  const [validation, setValidation] = useState<ValidationResult>({ errors: [], warnings: [] });
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState("");

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

  /* ── Pack Upload ──────────────────────────────────────── */
  const openPackDialog = () => {
    setPackStep(1);
    setPackMode("create");
    setPopulateTargetId("");
    setPackFile(null);
    setParsedPack(null);
    setValidation({ errors: [], warnings: [] });
    setPackDialog(true);
  };

  const handlePackFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPackFile(file);
    e.target.value = "";
  };

  const goToPreview = async () => {
    if (!packFile) { toast.error("Please select an XLSX file"); return; }
    if (packMode === "populate" && !populateTargetId) { toast.error("Select a framework to populate"); return; }
    try {
      const parsed = await parsePack(packFile);
      const existingCodes = frameworks.map(f => f.short_code.toUpperCase());
      const result = validatePack(parsed, packMode, existingCodes);
      setParsedPack(parsed);
      setValidation(result);
      setPackStep(2);
    } catch (err: any) {
      toast.error(err.message || "Failed to parse XLSX");
    }
  };

  const executePackImport = async () => {
    if (!parsedPack) return;
    if (validation.errors.length > 0) { toast.error("Please fix validation errors first"); return; }

    setImporting(true);
    setPackStep(3);
    try {
      // 1. Resolve framework_id
      let frameworkId: string;
      let frameworkName: string;
      if (packMode === "create") {
        setImportProgress("Creating framework…");
        const { data: newFw, error: fwErr } = await supabase
          .from("assessment_frameworks")
          .insert({
            name: parsedPack.info.name!,
            short_code: parsedPack.info.short_code!.toUpperCase(),
            version: parsedPack.info.version || "1.0",
            jurisdiction: parsedPack.info.jurisdiction || "Global",
            regulatory_body: parsedPack.info.regulatory_body || null,
            description: parsedPack.info.description || null,
            effective_date: parsedPack.info.effective_date || null,
            colour: parsedPack.info.colour || "#3B82F6",
            icon_name: parsedPack.info.icon_name || "Shield",
            is_active: true,
            is_default: false,
          })
          .select("id, name")
          .single();
        if (fwErr) throw fwErr;
        frameworkId = newFw.id;
        frameworkName = newFw.name;
      } else {
        const tgt = frameworks.find(f => f.id === populateTargetId);
        if (!tgt) throw new Error("Target framework not found");
        frameworkId = tgt.id;
        frameworkName = tgt.name;
      }

      // 2. Group checklist by domain & insert domains
      setImportProgress("Importing domains…");
      const domainMap = new Map<string, { name: string; section_ref?: string; penalty_ref?: string; description?: string; rows: typeof parsedPack.checklist }>();
      parsedPack.checklist.forEach(r => {
        if (!domainMap.has(r.domain_code)) {
          domainMap.set(r.domain_code, {
            name: r.domain_name,
            section_ref: r.section_ref,
            penalty_ref: r.penalty_ref,
            description: r.domain_description,
            rows: [],
          });
        }
        domainMap.get(r.domain_code)!.rows.push(r);
      });

      const domainIdByCode = new Map<string, string>();
      let domainOrder = 0;
      let domainsCreated = 0;
      for (const [code, info] of domainMap) {
        // Check if domain already exists for this framework
        const { data: existing } = await supabase
          .from("framework_domains")
          .select("id")
          .eq("framework_id", frameworkId)
          .eq("code", code)
          .maybeSingle();
        if (existing) {
          domainIdByCode.set(code, existing.id);
        } else {
          const { data: dom, error: dErr } = await supabase
            .from("framework_domains")
            .insert({
              framework_id: frameworkId,
              code,
              name: info.name,
              section_ref: info.section_ref || null,
              penalty_ref: info.penalty_ref || null,
              description: info.description || null,
              display_order: domainOrder,
              is_active: true,
            })
            .select("id")
            .single();
          if (dErr) throw dErr;
          domainIdByCode.set(code, dom.id);
          domainsCreated++;
        }
        domainOrder++;
      }

      // 3. Insert requirements
      setImportProgress("Importing requirements…");
      const reqRows = parsedPack.checklist.map((r, i) => ({
        domain_id: domainIdByCode.get(r.domain_code)!,
        item_code: r.item_code,
        description: r.description,
        guidance: r.guidance || null,
        risk_level: r.risk_level || "standard",
        evidence_type: r.evidence_type || "Document",
        sdf_only: r.sdf_only ?? false,
        display_order: i,
        is_active: true,
      }));
      let reqsCreated = 0;
      if (reqRows.length > 0) {
        const { data: insertedReqs, error: rErr } = await supabase
          .from("framework_requirements")
          .insert(reqRows)
          .select("id");
        if (rErr && rErr.code !== "23505") throw rErr;
        reqsCreated = insertedReqs?.length ?? 0;
      }

      // 4. Insert artefacts
      let artefactsCreated = 0;
      if (parsedPack.artefacts.length > 0) {
        setImportProgress("Importing artefacts…");
        const artRows = parsedPack.artefacts.map((a, i) => ({
          framework_id: frameworkId,
          category_code: a.category_code,
          category_name: a.category_name,
          item_code: a.item_code,
          artefact_name: a.artefact_name,
          display_order: i,
          is_active: true,
        }));
        const { error: aErr } = await supabase.from("framework_policy_artefacts").insert(artRows);
        if (aErr && aErr.code !== "23505") throw aErr;
        artefactsCreated = artRows.length;
      }

      // 5. Insert dept controls
      let controlsCreated = 0;
      if (parsedPack.deptControls.length > 0) {
        setImportProgress("Importing dept controls…");
        const ctrlRows = parsedPack.deptControls.map((c, i) => ({
          framework_id: frameworkId,
          control_id: c.control_id,
          control_description: c.control_description,
          risk_level: c.risk_level || "standard",
          display_order: i,
          is_active: true,
        }));
        const { error: cErr } = await supabase.from("framework_dept_controls").insert(ctrlRows);
        if (cErr && cErr.code !== "23505") throw cErr;
        controlsCreated = ctrlRows.length;
      }

      // 6. Insert special flags
      let flagsCreated = 0;
      if (parsedPack.flags.length > 0) {
        setImportProgress("Importing special flags…");
        const flagRows = parsedPack.flags.map((f, i) => ({
          framework_id: frameworkId,
          flag_key: f.flag_key,
          flag_label: f.flag_label,
          flag_hint: f.flag_hint || null,
          triggers_domain: f.triggers_domain || null,
          triggers_requirement: f.triggers_requirement || null,
          display_order: i,
          is_active: true,
        }));
        const { error: fErr } = await supabase.from("framework_special_flags").insert(flagRows);
        if (fErr && fErr.code !== "23505") throw fErr;
        flagsCreated = flagRows.length;
      }

      // 7. Default template + link (only for create-new)
      if (packMode === "create") {
        setImportProgress("Setting up template…");
        const { data: tpl } = await supabase
          .from("assessment_templates")
          .insert({
            name: `${frameworkName} — Default`,
            description: `Default assessment template for ${frameworkName}`,
            template_type: "single",
            is_active: true,
            is_default: false,
          })
          .select("id")
          .single();
        if (tpl) {
          await supabase.from("assessment_template_frameworks").insert({
            template_id: tpl.id,
            framework_id: frameworkId,
          });
        }
      }

      toast.success(
        `Imported ${frameworkName}: ${domainsCreated} domains, ${reqsCreated} requirements, ${artefactsCreated} artefacts, ${controlsCreated} controls, ${flagsCreated} flags`,
      );
      setPackDialog(false);
      await fetchFrameworks();
      // Auto-select imported framework
      const refetched = await supabase.from("assessment_frameworks").select("*").eq("id", frameworkId).single();
      if (refetched.data) setSelectedFw(refetched.data);
    } catch (err: any) {
      toast.error(err.message || "Import failed");
      setPackStep(2);
    } finally {
      setImporting(false);
      setImportProgress("");
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
          <CardHeader className="py-3 px-4 flex-row items-center justify-between space-y-0 gap-1">
            <CardTitle className="text-sm font-semibold">Frameworks</CardTitle>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" className="h-8 px-2" onClick={downloadTemplate} title="Download XLSX template">
                <Download className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="outline" className="h-8 px-2" onClick={openPackDialog}>
                <Upload className="h-3 w-3 mr-1" /> Upload Pack
              </Button>
              <Button size="sm" className="h-8 px-2" onClick={() => { setEditingFw({}); setFwDialog(true); }}>
                <Plus className="h-3 w-3 mr-1" /> Add
              </Button>
            </div>
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

      {/* ─── Pack Upload Dialog (3-step) ────────────────── */}
      <Dialog open={packDialog} onOpenChange={(o) => !importing && setPackDialog(o)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Upload Assessment Pack
              <Badge variant="outline" className="ml-2 text-xs">Step {packStep} of 3</Badge>
            </DialogTitle>
            <DialogDescription>
              {packStep === 1 && "Upload a 4-sheet XLSX (Framework Info, Checklist, Artefacts, Dept Controls)."}
              {packStep === 2 && "Review parsed data and validation results before importing."}
              {packStep === 3 && "Importing into the database…"}
            </DialogDescription>
          </DialogHeader>

          {/* ── Step 1: Upload ─────────────────────────── */}
          {packStep === 1 && (
            <div className="space-y-4 py-2 flex-1">
              <RadioGroup value={packMode} onValueChange={(v) => setPackMode(v as "create" | "populate")} className="flex gap-6">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="create" id="m-create" />
                  <Label htmlFor="m-create">Create New Framework</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="populate" id="m-pop" />
                  <Label htmlFor="m-pop">Populate Existing Framework</Label>
                </div>
              </RadioGroup>

              {packMode === "populate" && (
                <div>
                  <Label className="text-xs">Target Framework</Label>
                  <Select value={populateTargetId} onValueChange={setPopulateTargetId}>
                    <SelectTrigger><SelectValue placeholder="Choose framework…" /></SelectTrigger>
                    <SelectContent>
                      {frameworks.map(f => (
                        <SelectItem key={f.id} value={f.id}>{f.name} ({f.short_code})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div
                className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-muted/30 cursor-pointer transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium">{packFile ? packFile.name : "Click to select an .xlsx file"}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {packFile ? `${(packFile.size / 1024).toFixed(1)} KB` : "Or drag & drop here"}
                </p>
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handlePackFileSelect} />
              </div>

              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 rounded-md p-3">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>Sheets expected: <code>Framework_Info</code>, <code>Checklist</code>, <code>Artefacts</code>, <code>Dept_Controls</code>. Use Download Template above to get started.</span>
              </div>
            </div>
          )}

          {/* ── Step 2: Preview ────────────────────────── */}
          {packStep === 2 && parsedPack && (
            <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
              {parsedPack.info.name && (
                <div className="flex items-center gap-3 text-sm bg-muted/30 rounded-md p-3">
                  <span className="h-2 w-2 rounded-full" style={{ background: parsedPack.info.colour || "#3B82F6" }} />
                  <strong>{parsedPack.info.name}</strong>
                  {parsedPack.info.short_code && <Badge variant="outline" className="text-[10px]">{parsedPack.info.short_code}</Badge>}
                  {parsedPack.info.jurisdiction && <span className="text-xs text-muted-foreground">· {parsedPack.info.jurisdiction}</span>}
                  {parsedPack.info.version && <span className="text-xs text-muted-foreground">· v{parsedPack.info.version}</span>}
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="border rounded-md p-3">
                  <div className="text-xs text-muted-foreground">Checklist</div>
                  <div className="text-lg font-bold">
                    {new Set(parsedPack.checklist.map(c => c.domain_code)).size} dom · {parsedPack.checklist.length} req
                  </div>
                </div>
                <div className="border rounded-md p-3">
                  <div className="text-xs text-muted-foreground">Artefacts</div>
                  <div className="text-lg font-bold">
                    {new Set(parsedPack.artefacts.map(a => a.category_code)).size} cat · {parsedPack.artefacts.length} item
                  </div>
                </div>
                <div className="border rounded-md p-3">
                  <div className="text-xs text-muted-foreground">Dept Controls</div>
                  <div className="text-lg font-bold">{parsedPack.deptControls.length} ctrl</div>
                </div>
                <div className="border rounded-md p-3">
                  <div className="text-xs text-muted-foreground">Special Flags</div>
                  <div className="text-lg font-bold">{parsedPack.flags.length} flag</div>
                </div>
              </div>

              {(validation.errors.length > 0 || validation.warnings.length > 0) && (
                <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
                  {validation.errors.map((e, i) => (
                    <div key={`e-${i}`} className="flex items-start gap-2 text-xs bg-destructive/10 text-destructive rounded-md p-2">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" /><span>{e}</span>
                    </div>
                  ))}
                  {validation.warnings.map((w, i) => (
                    <div key={`w-${i}`} className="flex items-start gap-2 text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-md p-2">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" /><span>{w}</span>
                    </div>
                  ))}
                </div>
              )}

              <Tabs defaultValue="checklist" className="flex-1 overflow-hidden flex flex-col">
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="checklist">Checklist ({parsedPack.checklist.length})</TabsTrigger>
                  <TabsTrigger value="artefacts">Artefacts ({parsedPack.artefacts.length})</TabsTrigger>
                  <TabsTrigger value="controls">Controls ({parsedPack.deptControls.length})</TabsTrigger>
                  <TabsTrigger value="flags">Flags ({parsedPack.flags.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="checklist" className="flex-1 overflow-hidden mt-2">
                  <ScrollArea className="h-[260px] border rounded-md">
                    <Table>
                      <TableHeader><TableRow>
                        <TableHead className="text-xs">Domain</TableHead>
                        <TableHead className="text-xs">Item</TableHead>
                        <TableHead className="text-xs">Description</TableHead>
                        <TableHead className="text-xs">Risk</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {parsedPack.checklist.slice(0, 20).map((r, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-xs"><Badge variant="outline" className="text-[10px] font-mono">{r.domain_code}</Badge> {r.domain_name}</TableCell>
                            <TableCell className="text-xs font-mono">{r.item_code}</TableCell>
                            <TableCell className="text-xs max-w-[300px] truncate">{r.description}</TableCell>
                            <TableCell className="text-xs"><Badge variant="outline" className={cn("text-[10px]", riskColor[r.risk_level] || riskColor.standard)}>{r.risk_level}</Badge></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {parsedPack.checklist.length > 20 && <p className="text-xs text-muted-foreground text-center py-2">… and {parsedPack.checklist.length - 20} more</p>}
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="artefacts" className="flex-1 overflow-hidden mt-2">
                  <ScrollArea className="h-[260px] border rounded-md">
                    <Table>
                      <TableHeader><TableRow>
                        <TableHead className="text-xs">Category</TableHead>
                        <TableHead className="text-xs">Code</TableHead>
                        <TableHead className="text-xs">Name</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {parsedPack.artefacts.slice(0, 20).map((a, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-xs">{a.category_name}</TableCell>
                            <TableCell className="text-xs font-mono">{a.item_code}</TableCell>
                            <TableCell className="text-xs">{a.artefact_name}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="controls" className="flex-1 overflow-hidden mt-2">
                  <ScrollArea className="h-[260px] border rounded-md">
                    <Table>
                      <TableHeader><TableRow>
                        <TableHead className="text-xs">ID</TableHead>
                        <TableHead className="text-xs">Description</TableHead>
                        <TableHead className="text-xs">Risk</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {parsedPack.deptControls.slice(0, 20).map((c, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-xs font-mono">{c.control_id}</TableCell>
                            <TableCell className="text-xs">{c.control_description}</TableCell>
                            <TableCell className="text-xs"><Badge variant="outline" className={cn("text-[10px]", riskColor[c.risk_level] || riskColor.standard)}>{c.risk_level}</Badge></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="flags" className="flex-1 overflow-hidden mt-2">
                  <ScrollArea className="h-[260px] border rounded-md">
                    <Table>
                      <TableHeader><TableRow>
                        <TableHead className="text-xs">Key</TableHead>
                        <TableHead className="text-xs">Label</TableHead>
                        <TableHead className="text-xs">Hint</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {parsedPack.flags.map((f, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-xs font-mono">{f.flag_key}</TableCell>
                            <TableCell className="text-xs">{f.flag_label}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{f.flag_hint || "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* ── Step 3: Executing ──────────────────────── */}
          {packStep === 3 && (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm font-medium">{importProgress || "Importing…"}</p>
              <p className="text-xs text-muted-foreground">Please don't close this window.</p>
            </div>
          )}

          <DialogFooter>
            {packStep === 1 && (
              <>
                <Button variant="outline" onClick={() => setPackDialog(false)}>Cancel</Button>
                <Button onClick={goToPreview} disabled={!packFile}>Next →</Button>
              </>
            )}
            {packStep === 2 && (
              <>
                <Button variant="outline" onClick={() => setPackStep(1)}>← Back</Button>
                <Button onClick={executePackImport} disabled={validation.errors.length > 0 || importing}>
                  {validation.errors.length > 0 ? (
                    <><AlertCircle className="h-3 w-3 mr-1" /> Fix Errors First</>
                  ) : (
                    <><CheckCircle2 className="h-3 w-3 mr-1" /> Import →</>
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
