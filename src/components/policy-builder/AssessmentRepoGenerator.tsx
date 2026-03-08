import { useState, useMemo } from "react";
import { repositoryPhases, RepositoryItem } from "@/data/repositoryData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Building2, Search, Star, FileCheck, Download, Save, BookOpen,
  ChevronRight, Sparkles, FileText, ClipboardList
} from "lucide-react";
import { toast } from "sonner";

const PHASE_LABELS: Record<number, string> = {
  1: "Org Profile",
  2: "Policy Matrix",
  3: "Rapid Assessment",
  4: "Dept Grid",
  5: "File References",
  6: "Dashboard Reports",
};

const CRITICAL_IDS = new Set([
  "p1-1", "p1-4", "p2-1", "p2-4", "p2-7", "p2-11", "p2-13", "p2-19", "p3-1", "p2-14",
]);

interface OrgContext {
  orgName: string;
  industry: string;
  dpoName: string;
  date: string;
}

function fillTemplate(template: string, ctx: OrgContext): string {
  return template
    .replace(/\[Organisation Name\]/g, ctx.orgName || "[Organisation Name]")
    .replace(/\[Date\]/g, ctx.date || "[Date]")
    .replace(/\[DPO Name\]/g, ctx.dpoName || "[DPO Name]")
    .replace(/\[Industry\]/g, ctx.industry || "[Industry]")
    .replace(/\[Effective Date\]/g, ctx.date || "[Date]");
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

  const handleGenerate = () => {
    if (!selectedItem) return;
    if (!orgCtx.orgName.trim()) {
      toast.error("Please enter your Organisation Name");
      return;
    }
    const filled = fillTemplate(selectedItem.templateContent, orgCtx);
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

  return (
    <div className="space-y-6">
      {/* How-To Guide */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3 pt-4 px-5">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-primary">
            <BookOpen className="h-4 w-4" /> How to Use the Assessment Repository Generator
          </CardTitle>
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
          {/* Phase Tabs */}
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

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Filter by name or DPDP section..."
              className="pl-8 h-9 text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Requirement Cards */}
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
        </div>
      </div>
    </div>
  );
}
