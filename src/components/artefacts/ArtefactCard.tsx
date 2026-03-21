import { FileText, FileSpreadsheet, FileImage, File, Pin, PinOff, Download, MessageSquare, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

export interface ArtefactFileExtended {
  id: string;
  file_name: string;
  file_path: string;
  folder: string;
  description: string | null;
  uploaded_at: string;
  tags: string[] | null;
  framework: string | null;
  author: string | null;
  file_size: number | null;
  mime_type: string | null;
  version_number: number | null;
  parent_id: string | null;
  is_current_version: boolean | null;
  collection: string | null;
}

const FOLDER_COLORS: Record<string, string> = {
  Checklist: "bg-accent text-accent-foreground",
  Policies: "bg-primary/15 text-primary",
  Infographics: "bg-amber/15 text-amber-700",
  "Agreement Templates": "bg-secondary/20 text-secondary-foreground",
};

function getFileIcon(fileName: string, mimeType?: string | null) {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  if (["pdf"].includes(ext)) return <FileText className="h-8 w-8 text-destructive" />;
  if (["doc", "docx"].includes(ext)) return <FileText className="h-8 w-8 text-primary" />;
  if (["xls", "xlsx", "csv"].includes(ext)) return <FileSpreadsheet className="h-8 w-8 text-emerald-600" />;
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext) || mimeType?.startsWith("image"))
    return <FileImage className="h-8 w-8 text-purple-500" />;
  if (["ppt", "pptx"].includes(ext)) return <FileText className="h-8 w-8 text-orange-500" />;
  return <File className="h-8 w-8 text-muted-foreground" />;
}

function formatSize(bytes: number | null) {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

interface ArtefactCardProps {
  file: ArtefactFileExtended;
  isPinned: boolean;
  commentCount: number;
  isAdmin: boolean;
  onPin: (id: string) => void;
  onDownload: (file: ArtefactFileExtended) => void;
  onDelete: (file: ArtefactFileExtended) => void;
  onClick: (file: ArtefactFileExtended) => void;
}

export function ArtefactCard({ file, isPinned, commentCount, isAdmin, onPin, onDownload, onDelete, onClick }: ArtefactCardProps) {
  const tags = file.tags || [];
  const visibleTags = tags.slice(0, 3);
  const extraCount = tags.length - 3;

  return (
    <div
      className="group relative bg-card border border-border rounded-xl p-4 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer flex flex-col gap-3"
      onClick={() => onClick(file)}
    >
      {/* Icon + Title */}
      <div className="flex items-start gap-3">
        <div className="shrink-0 p-2 rounded-lg bg-muted/30">
          {getFileIcon(file.file_name, file.mime_type)}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-sm leading-tight line-clamp-2 text-foreground">{file.file_name}</h4>
          {file.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{file.description}</p>
          )}
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5">
        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${FOLDER_COLORS[file.folder] || "bg-muted/20 text-muted-foreground"}`}>
          {file.folder}
        </Badge>
        {file.framework && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20">
            {file.framework}
          </Badge>
        )}
        {visibleTags.map((tag) => (
          <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0 bg-accent/50 text-accent-foreground border-accent">
            {tag}
          </Badge>
        ))}
        {extraCount > 0 && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">+{extraCount}</Badge>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>{formatDistanceToNow(new Date(file.uploaded_at), { addSuffix: true })}</span>
          {file.file_size && <span>• {formatSize(file.file_size)}</span>}
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onPin(file.id); }}>
            {isPinned ? <PinOff className="h-3.5 w-3.5 text-primary" /> : <Pin className="h-3.5 w-3.5" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onDownload(file); }}>
            <Download className="h-3.5 w-3.5" />
          </Button>
          {commentCount > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <MessageSquare className="h-3 w-3" /> {commentCount}
            </span>
          )}
          {isAdmin && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(file); }}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
