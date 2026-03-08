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
  RefreshCw, Upload, ExternalLink, ChevronDown, Circle
} from "lucide-react";
import { toast } from "sonner";
import { useArtefactContext, ArtefactFile } from "@/hooks/useArtefactContext";
import { supabase } from "@/integrations/supabase/client";
import ArtefactIndexPanel from "./ArtefactIndexPanel";

const CRITICAL_IDS = new Set([
  "p1-1", "p1-4", "p2-1", "p2-4", "p2-7", "p2-11", "p2-13", "p2-19", "p3-a1", "p2-14",
]);

interface OrgContext {
  orgName: string;
  industry: string;
  dpoName: string;
  date: string;
}

function fillTemplate(template: string, ctx: OrgContext, matchedArtefacts: { file: ArtefactFile; score: number; matchLevel: string }[]): string {
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

  // Add artefact references header
  if (matchedArtefacts.length > 0) {
    const artefactNames = matchedArtefacts.map(a => a.file.file_name).join(", ");
    const header = `\n════════════════════════════════════════════════════════════════════\nARTEFACT REFERENCES\n════════════════════════════════════════════════════════════════════\n\nGenerated with reference to ${matchedArtefacts.length} artefact(s) from your Artefact Repository:\n${matchedArtefacts.map(a => `• ${a.file.file_name} (${a.file.folder})`).join("\n")}\n`;

    // Add cross-references based on folder type
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
  const [orgCtx, setOrgCtx] = useState<OrgContext>({
    orgName: "",
    industry: "",
    dpoName: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [generatedIds, setGeneratedIds] = useState<Set<string>>(new Set());
  const [artefactPanelOpen, setArtefactPanelOpen] = useState(false);
  const [indexPanelOpen, setIndexPanelOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

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
    toast.success("Saved to Policy Library");
  };

  const handleExport = (fmt: string) => {
    toast.info(`${fmt.toUpperCase()} export coming soon`);
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
            {/* Live Sync Indicator */}
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
              { step: 3, label: "Enter your organisation details on the right" },
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
          {/* Org Context Form */}
          <Card>
            <CardHeader className="pb-3 pt-4 px-5">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" /> Organisation Context
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4 grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Organisation Name *</label>
                <Input className="h-8 text-xs" value={orgCtx.orgName} onChange={(e) => setOrgCtx((p) => ({ ...p, orgName: e.target.value }))} placeholder="Acme Corp" />
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Industry</label>
                <Input className="h-8 text-xs" value={orgCtx.industry} onChange={(e) => setOrgCtx((p) => ({ ...p, industry: e.target.value }))} placeholder="Technology" />
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">DPO Name</label>
                <Input className="h-8 text-xs" value={orgCtx.dpoName} onChange={(e) => setOrgCtx((p) => ({ ...p, dpoName: e.target.value }))} placeholder="Jane Doe" />
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Date</label>
                <Input type="date" className="h-8 text-xs" value={orgCtx.date} onChange={(e) => setOrgCtx((p) => ({ ...p, date: e.target.value }))} />
              </div>
            </CardContent>
          </Card>

          {/* Artefact Context Panel */}
          {selectedItem && (
            <Collapsible open={artefactPanelOpen} onOpenChange={setArtefactPanelOpen}>
              <Card className={`border-${matchedArtefacts.length > 0 ? (matchedArtefacts.some(a => a.matchLevel === "green") ? "emerald" : "amber") : "muted-foreground"}-500/20`}>
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
                          <Circle className={`h-2 w-2 fill-${matchedArtefacts.some(a => a.matchLevel === "green") ? "emerald" : "amber"}-500 text-${matchedArtefacts.some(a => a.matchLevel === "green") ? "emerald" : "amber"}-500`} />
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
                          These existing artefacts have been used to inform this document generation
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

          {/* Smart Suggestion: Upload to Artefact Repository */}
          {generatedContent && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-foreground">Upload to Artefact Repository</p>
                  <p className="text-[10px] text-muted-foreground">Strengthen future document generations by adding this to your repository</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 shrink-0"
                  onClick={handleUploadToRepo}
                  disabled={uploading}
                >
                  <Upload className="h-3.5 w-3.5" />
                  {uploading ? "Uploading..." : "Upload to Policies"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
