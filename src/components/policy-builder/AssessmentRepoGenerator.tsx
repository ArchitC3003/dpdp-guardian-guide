import { useState, useMemo } from "react";
import { repositoryPhases, RepositoryItem } from "@/data/repositoryData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Building2, Search, Star, FileCheck, Download, Save, BookOpen,
  ChevronRight, Sparkles, FileText, ClipboardList, FolderOpen,
  RefreshCw, Upload, ExternalLink, ChevronDown, Circle, Lock, Shield
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useArtefactContext, ArtefactFile } from "@/hooks/useArtefactContext";
import { exportToDOCX, exportToPDF, ExportDocument } from "@/utils/exportUtils";
import { supabase } from "@/integrations/supabase/client";
import ArtefactIndexPanel from "./ArtefactIndexPanel";
import OrgProfileForm from "./OrgProfileForm";
import ComplianceProfileSummary from "./ComplianceProfileSummary";
import { OrgContext, DEFAULT_ORG_CONTEXT, SDF_OPTIONS, GEOGRAPHY_OPTIONS, MATURITY_OPTIONS, ORG_SIZE_OPTIONS } from "./orgContextTypes";

const CRITICAL_IDS = new Set([
  "p1-1", "p1-4", "p2-1", "p2-4", "p2-7", "p2-11", "p2-13", "p2-19", "p3-a1", "p2-14",
]);

function getMaturityLanguage(level: string): string {
  switch (level) {
    case "initial": return "shall establish";
    case "developing": return "is in the process of establishing";
    case "defined": return "has established";
    case "managed": return "maintains and monitors";
    case "optimising": return "continuously improves";
    default: return "shall establish";
  }
}

function fillTemplate(
  template: string,
  ctx: OrgContext,
  matchedArtefacts: { file: ArtefactFile; score: number; matchLevel: string }[]
): string {
  let filled = template
    .replace(/\[Organisation Name\]/g, ctx.orgName || "[Organisation Name]")
    .replace(/\[Date\]/g, ctx.date || "[Date]")
    .replace(/\[DPO Name\]/g, ctx.dpoName || "[DPO Name]")
    .replace(/\[DPO Email\]/g, `dpo@${(ctx.orgName || "organisation").toLowerCase().replace(/\s+/g, "")}.com`)
    .replace(/\[DPO Phone\]/g, "[DPO Phone]")
    .replace(/\[Industry\]/g, ctx.industry || "[Industry]")
    .replace(/\[Effective Date\]/g, ctx.date || "[Date]")
    .replace(/\[Address\]/g, "[Registered Address]")
    .replace(/\[Version\]/g, "v1.0")
    .replace(/\[Year\]/g, new Date().getFullYear().toString());

  // Smart replacements based on expanded context

  // SDF Obligations
  const sdfBlock = ctx.sdfClassification === "sdf"
    ? `\n\nSIGNIFICANT DATA FIDUCIARY — ENHANCED OBLIGATIONS\n${"═".repeat(60)}\nAs a Significant Data Fiduciary under the DPDP Act 2023, ${ctx.orgName || "the Organisation"} is subject to enhanced obligations including:\n• Rule 5: Appointment of Data Protection Officer (DPO) resident in India\n• Rule 6: Periodic Data Protection Impact Assessment (DPIA)\n• Rule 9: Enhanced consent management and record-keeping\n• Rule 10: Verification of age and parental consent for children's data\n• Rule 12: Periodic audit by independent data auditor\n• Publication of Data Protection Impact Assessment summary on website\n`
    : `\n\nAs a Data Fiduciary under the DPDP Act 2023, ${ctx.orgName || "the Organisation"} shall comply with all applicable obligations under Sections 4–17.\n`;
  filled = filled.replace(/\[SDF_OBLIGATIONS\]/g, sdfBlock);

  // Processing Activities
  const activitiesList = ctx.processingActivities.length > 0
    ? ctx.processingActivities.map((a) => `• ${a}`).join("\n")
    : "• To be determined based on data mapping exercise";
  filled = filled.replace(/\[PROCESSING_ACTIVITIES_LIST\]/g, activitiesList);

  // Jurisdiction clause
  const geoLabel = GEOGRAPHY_OPTIONS.find((g) => g.value === ctx.geographies)?.label || "India Only";
  const jurisdictionClause = ctx.geographies === "india-only"
    ? `This document applies within the jurisdiction of India under the DPDP Act 2023 and DPDP Rules 2025.`
    : ctx.geographies === "india-eu"
    ? `This document applies under dual jurisdiction: India (DPDP Act 2023, DPDP Rules 2025) and European Union (GDPR, ePrivacy Directive). Standard Contractual Clauses (SCCs) shall govern cross-border transfers per DPDP Schedule 1.`
    : ctx.geographies === "india-us"
    ? `This document applies under dual jurisdiction: India (DPDP Act 2023) and United States (CCPA/CPRA as applicable). Cross-border transfer mechanisms per DPDP Schedule 1 shall be implemented.`
    : `This document applies under multi-jurisdictional scope: ${geoLabel}. Data transfer adequacy assessments per DPDP Schedule 1 are required for all cross-border transfers.`;
  filled = filled.replace(/\[JURISDICTION_CLAUSE\]/g, jurisdictionClause);

  // Sector-specific clause
  let sectorClause = "";
  if (ctx.industry?.includes("BFSI") || ctx.industry?.includes("Banking") || ctx.industry?.includes("Insurance")) {
    sectorClause = `\nSECTOR-SPECIFIC OVERLAY: BFSI\nThis policy incorporates requirements from RBI Master Directions on Information Technology Governance, Risk, Controls and Assurance Practices, SEBI Circular on Cyber Security & Cyber Resilience Framework, and IRDA Guidelines on Information and Cyber Security as applicable.\n`;
  } else if (ctx.industry?.includes("Health")) {
    sectorClause = `\nSECTOR-SPECIFIC OVERLAY: HEALTHCARE\nThis policy incorporates requirements from the Digital Information Security in Healthcare Act (DISHA) framework, National Health Authority (NHA) Digital Health Guidelines, and Ayushman Bharat Digital Mission (ABDM) data sharing protocols.\n`;
  }
  filled = filled.replace(/\[SECTOR_SPECIFIC_CLAUSE\]/g, sectorClause);

  // Maturity language
  filled = filled.replace(/\[MATURITY_LANGUAGE\]/g, getMaturityLanguage(ctx.maturityLevel));

  // Children's data clause
  const childrenClause = ctx.processingActivities.includes("Children's Data (under 18)")
    ? `\nCHILDREN'S DATA PROCESSING OBLIGATIONS\n${ctx.orgName || "The Organisation"} processes data of children (persons under 18 years of age) and is therefore subject to:\n• Section 9 of DPDP Act 2023: Verifiable consent from parent/lawful guardian before processing\n• Rule 10: Age verification mechanism proportionate to risk\n• Prohibition on tracking, behavioural monitoring, and targeted advertising directed at children\n• Data minimisation: only data reasonably necessary for the specific purpose\n`
    : `${ctx.orgName || "The Organisation"} does not currently process children's personal data. Should such processing commence, Section 9 and Rule 10 compliance shall be implemented prior to processing.`;
  filled = filled.replace(/\[CHILDREN_DATA_CLAUSE\]/g, childrenClause);

  // Cross-border clause
  const crossBorderClause = ctx.processingActivities.includes("Cross-border Data Transfers")
    ? `\nCROSS-BORDER DATA TRANSFER PROVISIONS\nAll cross-border transfers of personal data shall comply with:\n• DPDP Act 2023 Section 16: Transfer only to countries/territories notified under Schedule 1\n• Adequacy assessment documentation maintained and reviewed annually\n• Standard Contractual Clauses (SCCs) executed with all foreign data recipients\n• Transfer Impact Assessment (TIA) conducted before initiating new transfer arrangements\n`
    : `Cross-border data transfers are not currently within scope. Prior to any cross-border transfer, DPDP Section 16 and Schedule 1 compliance shall be established.`;
  filled = filled.replace(/\[CROSS_BORDER_CLAUSE\]/g, crossBorderClause);

  // Org size scope
  const sizeLabel = ORG_SIZE_OPTIONS.find((s) => s.value === ctx.orgSize)?.label || "Enterprise";
  filled = filled.replace(/\[ORG_SIZE_SCOPE\]/g, `Organisation Size: ${sizeLabel}`);

  // Add artefact references header
  if (matchedArtefacts.length > 0) {
    const header = `\n${"═".repeat(68)}\nARTEFACT REFERENCES\n${"═".repeat(68)}\n\nGenerated with reference to ${matchedArtefacts.length} artefact(s) from your Artefact Repository:\n${matchedArtefacts.map(a => `• ${a.file.file_name} (${a.file.folder})`).join("\n")}\n`;

    const policyArtefacts = matchedArtefacts.filter(a => a.file.folder === "Policies");
    const agreementArtefacts = matchedArtefacts.filter(a => a.file.folder === "Agreement Templates");

    let crossRefs = "";
    if (policyArtefacts.length > 0) {
      crossRefs += `\nSee also: ${policyArtefacts.map(a => `"${a.file.file_name}" in your Artefact Repository`).join("; ")}`;
    }
    if (agreementArtefacts.length > 0) {
      crossRefs += `\nOrganisation has existing template(s) on file: ${agreementArtefacts.map(a => a.file.file_name).join(", ")}`;
    }

    filled = filled + header + crossRefs;
  }

  return filled;
}

export default function AssessmentRepoGenerator() {
  const [selectedPhase, setSelectedPhase] = useState("1");
  const [selectedItem, setSelectedItem] = useState<RepositoryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [orgCtx, setOrgCtx] = useState<OrgContext>(DEFAULT_ORG_CONTEXT);
  const [generatedIds, setGeneratedIds] = useState<Set<string>>(new Set());
  const [artefactPanelOpen, setArtefactPanelOpen] = useState(false);
  const [indexPanelOpen, setIndexPanelOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [consentModalOpen, setConsentModalOpen] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);

  const {
    artefactFiles,
    artefactCount,
    artefactsByFolder,
    lastUpdated,
    loading: artefactsLoading,
    getRelevantArtefacts,
    getDownloadUrl,
    refresh: refreshArtefacts,
  } = useArtefactContext();

  const totalItems = useMemo(
    () => repositoryPhases.reduce((sum, p) => sum + p.items.length, 0),
    []
  );

  const currentPhase = repositoryPhases.find((p) => String(p.phase) === selectedPhase);

  const filteredItems = useMemo(() => {
    if (!currentPhase) return [];
    if (!searchQuery.trim()) return currentPhase.items;
    const q = searchQuery.toLowerCase();
    return currentPhase.items.filter(
      (item) =>
        item.requirement.toLowerCase().includes(q) ||
        item.dpdpRef.toLowerCase().includes(q)
    );
  }, [currentPhase, searchQuery]);

  const matchedArtefacts = useMemo(() => {
    if (!selectedItem) return [];
    return getRelevantArtefacts(selectedItem.requirement + " " + selectedItem.templateTitle);
  }, [selectedItem, getRelevantArtefacts]);

  const handleGenerate = () => {
    if (!selectedItem) return;
    if (!orgCtx.orgName.trim()) {
      toast.error("Please enter your Organisation Name");
      return;
    }
    const filled = fillTemplate(selectedItem.templateContent, orgCtx, matchedArtefacts);
    setGeneratedContent(filled);
    setGeneratedIds((prev) => new Set(prev).add(selectedItem.id));
    toast.success(`Generated: ${selectedItem.templateTitle}`);
  };

  const handleSave = () => {
    toast.success("Saved to Policy Register");
  };

  const handleExport = async (fmt: string) => {
    if (!generatedContent || !selectedItem) return;
    const exportDoc: ExportDocument = {
      title: selectedItem.templateTitle,
      documentRef: selectedItem.dpdpRef,
      version: "1.0",
      status: "Draft",
      classification: "Confidential",
      effectiveDate: orgCtx.date || new Date().toISOString().split("T")[0],
      reviewDate: new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0],
      selectedFrameworks: ["DPDP Act 2023"],
      industryVertical: orgCtx.industry || "General",
      orgSize: orgCtx.orgSize || "enterprise",
      content: generatedContent,
    };
    try {
      toast.success(`Downloading ${fmt.toUpperCase()}...`);
      if (fmt === "docx") {
        await exportToDOCX(exportDoc);
      } else if (fmt === "pdf") {
        await exportToPDF(exportDoc);
      }
    } catch {
      toast.error(`${fmt.toUpperCase()} export failed`);
    }
  };

  const handleUploadToRepo = async () => {
    if (!generatedContent || !selectedItem) return;
    setUploading(true);

    try {
      const blob = new Blob([generatedContent], { type: "text/plain" });
      const fileName = `${selectedItem.templateTitle.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}.txt`;
      const storagePath = `Policies/${fileName}`;

      const { error: storageErr } = await supabase.storage
        .from("artefact-files")
        .upload(storagePath, blob);

      if (storageErr) {
        toast.error("Upload failed: " + storageErr.message);
        setUploading(false);
        return;
      }

      const { error: dbErr } = await supabase.from("artefact_files").insert({
        file_name: fileName,
        file_path: storagePath,
        folder: "Policies",
        description: `Generated from Assessment Repository: ${selectedItem.requirement} (${selectedItem.dpdpRef})`,
      });

      if (dbErr) {
        toast.error("Failed to save record: " + dbErr.message);
      } else {
        toast.success("Uploaded to Artefact Repository — Policies folder");
      }
    } catch (e) {
      toast.error("Upload failed");
    }
    setUploading(false);
  };

  return (
    <div className="space-y-6">
      {/* How-To Guide */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3 pt-4 px-5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-primary">
              <BookOpen className="h-4 w-4" /> How to Use the Assessment Repository Generator
            </CardTitle>
            <button
              onClick={() => setIndexPanelOpen(!indexPanelOpen)}
              className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-primary transition-colors cursor-pointer bg-background/50 rounded-full px-2.5 py-1 border border-border"
            >
              <Circle className="h-2 w-2 fill-emerald-500 text-emerald-500 animate-pulse" />
              Artefact Repository: {artefactCount} documents indexed
            </button>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-4">
          <div className="grid grid-cols-5 gap-3 text-[11px]">
            {[
              { step: 1, label: "Select your phase from the tabs below" },
              { step: 2, label: "Choose the requirement you need to fulfil" },
              { step: 3, label: "Complete your Organisation Profile on the right" },
              { step: 4, label: "Generate, review, and export the document" },
              { step: 5, label: "Upload to Assessment Repository to mark complete" },
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-1.5">
                <span className="shrink-0 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">
                  {s.step}
                </span>
                <span className="text-muted-foreground leading-tight">{s.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Artefact Index Panel */}
      {indexPanelOpen && (
        <ArtefactIndexPanel
          artefactsByFolder={artefactsByFolder}
          artefactCount={artefactCount}
          lastUpdated={lastUpdated}
          getDownloadUrl={getDownloadUrl}
          onClose={() => setIndexPanelOpen(false)}
          onRefresh={refreshArtefacts}
          loading={artefactsLoading}
        />
      )}

      {/* Progress */}
      <div className="flex items-center gap-3">
        <Progress value={(generatedIds.size / totalItems) * 100} className="flex-1 h-2" />
        <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
          {generatedIds.size} of {totalItems} generated
        </span>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-5">
        {/* Left Panel */}
        <div className="space-y-3">
          <Tabs value={selectedPhase} onValueChange={(v) => { setSelectedPhase(v); setSelectedItem(null); setGeneratedContent(null); }}>
            <TabsList className="grid grid-cols-6 h-9 w-full">
              {repositoryPhases.map((p) => (
                <TabsTrigger key={p.phase} value={String(p.phase)} className="text-[10px] px-1">
                  P{p.phase}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <p className="text-xs text-muted-foreground font-medium">
            {currentPhase?.icon} {currentPhase?.title} — {filteredItems.length} requirements
          </p>

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Filter by name or DPDP section..."
              className="pl-8 h-9 text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <ScrollArea className="h-[480px] pr-1">
            <div className="space-y-1.5">
              {filteredItems.map((item) => {
                const isSelected = selectedItem?.id === item.id;
                const isCritical = CRITICAL_IDS.has(item.id);
                const isGenerated = generatedIds.has(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => { setSelectedItem(item); setGeneratedContent(null); }}
                    className={`w-full text-left rounded-lg border p-3 transition-all text-xs ${
                      isSelected
                        ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                        : "border-border bg-card hover:border-primary/30 hover:bg-accent/30"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-primary/40 text-primary shrink-0">
                            {item.dpdpRef}
                          </Badge>
                          {isCritical && (
                            <Badge className="text-[9px] px-1.5 py-0 bg-amber-500/20 text-amber-600 border-amber-500/30">
                              <Star className="h-2.5 w-2.5 mr-0.5" /> Critical
                            </Badge>
                          )}
                          {isGenerated && (
                            <Badge className="text-[9px] px-1.5 py-0 bg-emerald-500/20 text-emerald-600 border-emerald-500/30">
                              <FileCheck className="h-2.5 w-2.5 mr-0.5" /> Generated
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] font-medium leading-snug line-clamp-2 text-foreground">
                          {item.requirement}
                        </p>
                      </div>
                      <ChevronRight className={`h-3.5 w-3.5 shrink-0 mt-1 transition-colors ${isSelected ? "text-primary" : "text-muted-foreground/40"}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {/* Compliance Profile Summary */}
          <ComplianceProfileSummary ctx={orgCtx} />

          {/* Org Profile Form */}
          <OrgProfileForm ctx={orgCtx} onChange={setOrgCtx} />

          {/* Artefact Context Panel */}
          {selectedItem && (
            <Collapsible open={artefactPanelOpen} onOpenChange={setArtefactPanelOpen}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="pb-2 pt-3 px-5 cursor-pointer hover:bg-accent/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xs font-semibold flex items-center gap-2">
                        <FolderOpen className="h-3.5 w-3.5 text-primary" />
                        Artefacts Found in Your Repository
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                          {matchedArtefacts.length}
                        </Badge>
                        {matchedArtefacts.length > 0 ? (
                          <Circle className="h-2 w-2 fill-emerald-500 text-emerald-500" />
                        ) : (
                          <Circle className="h-2 w-2 fill-muted-foreground/30 text-muted-foreground/30" />
                        )}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <button onClick={(e) => { e.stopPropagation(); refreshArtefacts(); }} className="text-muted-foreground hover:text-primary">
                          <RefreshCw className={`h-3 w-3 ${artefactsLoading ? "animate-spin" : ""}`} />
                        </button>
                        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${artefactPanelOpen ? "rotate-180" : ""}`} />
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="px-5 pb-4 pt-0">
                    {matchedArtefacts.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-[10px] text-muted-foreground italic">
                          These documents from your private workspace have been referenced to personalise this output
                        </p>
                        {matchedArtefacts.map((match) => (
                          <div key={match.file.id} className="flex items-center justify-between bg-accent/30 rounded-md px-3 py-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                              <div className="min-w-0">
                                <p className="text-[11px] font-medium truncate text-foreground">{match.file.file_name}</p>
                                <div className="flex items-center gap-1.5">
                                  <Badge variant="outline" className="text-[8px] px-1 py-0">{match.file.folder}</Badge>
                                  <span className="text-[9px] text-muted-foreground">
                                    {new Date(match.file.uploaded_at).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <a
                              href={getDownloadUrl(match.file.file_path)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:text-primary/80 shrink-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Download className="h-3.5 w-3.5" />
                            </a>
                          </div>
                        ))}
                        {lastUpdated && (
                          <p className="text-[9px] text-muted-foreground">
                            Last synced: {lastUpdated.toLocaleTimeString()}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-[10px] text-muted-foreground">
                        No matching artefacts found. Upload relevant documents to enrich future generations.
                      </p>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}

          {/* Selected Requirement + Generate */}
          {selectedItem ? (
            <Card className="border-primary/20">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Badge variant="outline" className="text-[10px] px-1.5 border-primary/40 text-primary mb-1">
                      {selectedItem.dpdpRef}
                    </Badge>
                    <h3 className="text-sm font-semibold text-foreground">{selectedItem.templateTitle}</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{selectedItem.requirement}</p>
                  </div>
                  <Button size="sm" onClick={handleGenerate} className="shrink-0 gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" /> Generate
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed border-muted-foreground/20">
              <CardContent className="p-8 text-center">
                <ClipboardList className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-xs text-muted-foreground">Select a requirement from the left panel to begin</p>
              </CardContent>
            </Card>
          )}

          {/* Preview */}
          {generatedContent && (
            <Card>
              <CardHeader className="pb-2 pt-4 px-5 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" /> Document Preview
                  <Badge variant="outline" className="text-[9px] ml-1 border-primary/30 text-primary">
                    {selectedItem?.dpdpRef}
                  </Badge>
                </CardTitle>
                <div className="flex gap-1.5">
                  <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={() => handleExport("docx")}>
                    <Download className="h-3 w-3" /> DOCX
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={() => handleExport("pdf")}>
                    <Download className="h-3 w-3" /> PDF
                  </Button>
                  <Button size="sm" className="h-7 text-[10px] gap-1" onClick={handleSave}>
                    <Save className="h-3 w-3" /> Save to Library
                  </Button>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                  <pre className="whitespace-pre-wrap text-xs leading-relaxed p-5 font-[family-name:var(--font-mono,_'JetBrains_Mono',_monospace)] text-foreground">
                    {generatedContent}
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Smart Suggestion: Save to Artefact Repository */}
          {generatedContent && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Lock className="h-3 w-3 text-primary" /> Save to My Artefact Repository
                  </p>
                  <p className="text-[10px] text-muted-foreground">Saved privately to your workspace only — never shared with other organisations</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 shrink-0"
                  onClick={() => { setConsentChecked(false); setConsentModalOpen(true); }}
                  disabled={uploading}
                >
                  <Lock className="h-3.5 w-3.5" />
                  {uploading ? "Saving..." : "Save to My Artefact Repository"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Consent Modal */}
          <Dialog open={consentModalOpen} onOpenChange={setConsentModalOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base">
                  <Shield className="h-4 w-4 text-primary" />
                  Save to Your Private Artefact Repository
                </DialogTitle>
                <DialogDescription className="sr-only">Privacy consent for saving document</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="flex items-start gap-2.5">
                  <Shield className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">Stored privately in your workspace — visible only to you and your organisation's admins</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <Shield className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">Never shared with other organisations or used to train shared models</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <Shield className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">You can delete this document from your Artefact Repository at any time</p>
                </div>
                <Separator />
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="consent-check"
                    checked={consentChecked}
                    onCheckedChange={(v) => setConsentChecked(v === true)}
                  />
                  <label htmlFor="consent-check" className="text-xs text-foreground cursor-pointer">
                    I understand this document will be stored in my private workspace
                  </label>
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="ghost" size="sm" onClick={() => setConsentModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={!consentChecked || uploading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                  onClick={async () => {
                    setConsentModalOpen(false);
                    await handleUploadToRepo();
                  }}
                >
                  <Save className="h-3.5 w-3.5" />
                  {uploading ? "Saving..." : "Save to Repository"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
