import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Database, RefreshCw, Tag, Calendar, Globe, Link, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ArtefactFile {
  id: string;
  folder: string;
  file_name: string;
  file_path: string;
  description: string;
  uploaded_at: string;
}

interface KMIndexStatus {
  [fileId: string]: "indexed" | "pending" | "not-indexed";
}

interface Props {
  files: ArtefactFile[];
  isAdmin: boolean;
}

const JURISDICTION_OPTIONS = ["India/DPDP", "India/IT Act", "India/CERT-In", "India/Sector", "EU/GDPR", "International"];
const FRAMEWORK_OPTIONS = ["DPDP Act 2023", "IT Act 2000", "GDPR", "ISO 27701", "NIST PF", "PCI-DSS", "CERT-In Directions"];

export function KMAdminPanel({ files, isAdmin }: Props) {
  const [indexStatuses, setIndexStatuses] = useState<KMIndexStatus>({});
  const [reindexing, setReindexing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<ArtefactFile | null>(null);
  const [kmMeta, setKmMeta] = useState({
    industryVerticals: "",
    subSectors: "",
    jurisdictions: [] as string[],
    frameworks: [] as string[],
    sourceAuthority: "",
    sourceUrl: "",
    effectiveDate: "",
  });

  if (!isAdmin) return null;

  const handleAddToKMIndex = async (file: ArtefactFile) => {
    setIndexStatuses((prev) => ({ ...prev, [file.id]: "pending" }));

    try {
      // Download file content for indexing
      const { data: fileData } = await supabase.storage
        .from("artefact-files")
        .download(file.file_path);

      let content = file.description || file.file_name;
      if (fileData) {
        try {
          content = await fileData.text();
          if (content.length > 5000) content = content.substring(0, 5000);
        } catch {
          content = file.description || file.file_name;
        }
      }

      const { error } = await supabase.from("km_artefact_index" as any).insert({
        title: file.file_name,
        content,
        doc_type: file.folder.toLowerCase(),
        industry_verticals: kmMeta.industryVerticals
          ? kmMeta.industryVerticals.split(",").map((s: string) => s.trim())
          : [],
        sub_sectors: kmMeta.subSectors
          ? kmMeta.subSectors.split(",").map((s: string) => s.trim())
          : [],
        jurisdictions: kmMeta.jurisdictions,
        frameworks: kmMeta.frameworks,
        source_authority: kmMeta.sourceAuthority || "Internal",
        source_url: kmMeta.sourceUrl || "",
        effective_date: kmMeta.effectiveDate || null,
      });

      if (error) throw error;

      setIndexStatuses((prev) => ({ ...prev, [file.id]: "indexed" }));
      toast.success(`"${file.file_name}" added to Knowledge Index`);
    } catch (e: any) {
      console.error("KM index error:", e);
      setIndexStatuses((prev) => ({ ...prev, [file.id]: "not-indexed" }));
      toast.error("Failed to add to Knowledge Index");
    }
  };

  const handleReindexAll = async () => {
    setReindexing(true);
    try {
      const { data, error } = await supabase.functions.invoke("km-indexer", {
        body: { trigger: "manual" },
      });
      if (error) throw error;
      toast.success(`Re-indexing complete: ${data?.processed_count || 0} items processed`);
    } catch (e: any) {
      console.error("Re-index error:", e);
      toast.error("Re-indexing failed");
    } finally {
      setReindexing(false);
    }
  };

  const getStatusBadge = (fileId: string) => {
    const status = indexStatuses[fileId] || "not-indexed";
    switch (status) {
      case "indexed":
        return <Badge className="text-[8px] px-1.5 py-0 bg-emerald-500/20 text-emerald-600 border-emerald-500/30">✅ Indexed</Badge>;
      case "pending":
        return <Badge className="text-[8px] px-1.5 py-0 bg-amber-500/20 text-amber-600 border-amber-500/30">⏳ Pending</Badge>;
      default:
        return <Badge variant="outline" className="text-[8px] px-1.5 py-0">⬜ Not Indexed</Badge>;
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3 pt-4 px-5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            Knowledge Management Index
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={handleReindexAll}
            disabled={reindexing}
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${reindexing ? "animate-spin" : ""}`} />
            {reindexing ? "Re-indexing..." : "Re-Index All"}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Add artefacts to the KM Index for AI-powered context enrichment
        </p>
      </CardHeader>
      <CardContent className="px-5 pb-4">
        <div className="space-y-2">
          {files.slice(0, 20).map((file) => (
            <div key={file.id} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-xs truncate">{file.file_name}</span>
                {getStatusBadge(file.id)}
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] text-primary shrink-0"
                    onClick={() => setSelectedFile(file)}
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    Add to KM
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-sm">KM Metadata — {file.file_name}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                        <Globe className="h-3 w-3 inline mr-1" />Industry Verticals (comma-separated)
                      </label>
                      <Input
                        className="h-8 text-xs"
                        value={kmMeta.industryVerticals}
                        onChange={(e) => setKmMeta({ ...kmMeta, industryVerticals: e.target.value })}
                        placeholder="Healthcare/Healthtech, BFSI"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground block mb-1">Sub-Sectors (comma-separated)</label>
                      <Input
                        className="h-8 text-xs"
                        value={kmMeta.subSectors}
                        onChange={(e) => setKmMeta({ ...kmMeta, subSectors: e.target.value })}
                        placeholder="Telemedicine, Hospital"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground block mb-1">Jurisdictions</label>
                      <div className="flex flex-wrap gap-1">
                        {JURISDICTION_OPTIONS.map((j) => (
                          <button
                            key={j}
                            onClick={() =>
                              setKmMeta({
                                ...kmMeta,
                                jurisdictions: kmMeta.jurisdictions.includes(j)
                                  ? kmMeta.jurisdictions.filter((x) => x !== j)
                                  : [...kmMeta.jurisdictions, j],
                              })
                            }
                            className={`text-[9px] px-2 py-0.5 rounded-full border ${
                              kmMeta.jurisdictions.includes(j)
                                ? "bg-primary/15 border-primary/40 text-primary"
                                : "border-border text-muted-foreground"
                            }`}
                          >
                            {j}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground block mb-1">Frameworks</label>
                      <div className="flex flex-wrap gap-1">
                        {FRAMEWORK_OPTIONS.map((f) => (
                          <button
                            key={f}
                            onClick={() =>
                              setKmMeta({
                                ...kmMeta,
                                frameworks: kmMeta.frameworks.includes(f)
                                  ? kmMeta.frameworks.filter((x) => x !== f)
                                  : [...kmMeta.frameworks, f],
                              })
                            }
                            className={`text-[9px] px-2 py-0.5 rounded-full border ${
                              kmMeta.frameworks.includes(f)
                                ? "bg-primary/15 border-primary/40 text-primary"
                                : "border-border text-muted-foreground"
                            }`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                          <User className="h-3 w-3 inline mr-1" />Source Authority
                        </label>
                        <Input
                          className="h-8 text-xs"
                          value={kmMeta.sourceAuthority}
                          onChange={(e) => setKmMeta({ ...kmMeta, sourceAuthority: e.target.value })}
                          placeholder="MEITY, Internal"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                          <Calendar className="h-3 w-3 inline mr-1" />Effective Date
                        </label>
                        <Input
                          type="date"
                          className="h-8 text-xs"
                          value={kmMeta.effectiveDate}
                          onChange={(e) => setKmMeta({ ...kmMeta, effectiveDate: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                        <Link className="h-3 w-3 inline mr-1" />Source URL
                      </label>
                      <Input
                        className="h-8 text-xs"
                        value={kmMeta.sourceUrl}
                        onChange={(e) => setKmMeta({ ...kmMeta, sourceUrl: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                    <Button
                      className="w-full"
                      size="sm"
                      onClick={() => {
                        if (selectedFile) handleAddToKMIndex(selectedFile);
                      }}
                    >
                      Add to Knowledge Index
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
