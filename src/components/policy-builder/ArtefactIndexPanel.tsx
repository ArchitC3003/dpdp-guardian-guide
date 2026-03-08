import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { X, RefreshCw, FolderOpen, FileText, Download, Database } from "lucide-react";
import type { ArtefactFile } from "@/hooks/useArtefactContext";

interface ArtefactIndexPanelProps {
  artefactsByFolder: Record<string, ArtefactFile[]>;
  artefactCount: number;
  lastUpdated: Date | null;
  getDownloadUrl: (path: string) => string;
  onClose: () => void;
  onRefresh: () => void;
  loading: boolean;
}

export default function ArtefactIndexPanel({
  artefactsByFolder,
  artefactCount,
  lastUpdated,
  getDownloadUrl,
  onClose,
  onRefresh,
  loading,
}: ArtefactIndexPanelProps) {
  const folders = Object.keys(artefactsByFolder).sort();

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2 pt-4 px-5 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Database className="h-4 w-4 text-primary" />
          Indexed Artefacts
          <Badge variant="outline" className="text-[9px] px-1.5">{artefactCount} total</Badge>
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onRefresh} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="p-0">
        <ScrollArea className="h-[300px]">
          {folders.length === 0 ? (
            <div className="p-5 text-center text-xs text-muted-foreground">
              No artefacts indexed yet. Upload documents to the Artefact Repository.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {folders.map((folder) => (
                <div key={folder} className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FolderOpen className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-semibold text-foreground">{folder}</span>
                    <Badge variant="outline" className="text-[8px] px-1 py-0">{artefactsByFolder[folder].length}</Badge>
                  </div>
                  <div className="space-y-1 ml-5">
                    {artefactsByFolder[folder].map((file) => (
                      <div key={file.id} className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="truncate text-foreground">{file.file_name}</span>
                        </div>
                        <a
                          href={getDownloadUrl(file.file_path)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80 shrink-0 ml-2"
                        >
                          <Download className="h-3 w-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        {lastUpdated && (
          <div className="px-4 py-2 border-t border-border">
            <p className="text-[9px] text-muted-foreground">Last synced: {lastUpdated.toLocaleString()}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
