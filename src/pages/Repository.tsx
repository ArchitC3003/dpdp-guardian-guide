import { useState, useMemo, useRef } from "react";
import { repositoryPhases, type RepositoryItem } from "@/data/repositoryData";
import { Search, ChevronDown, ChevronRight, FolderOpen, FileText, Download, Copy, CheckCircle, Clock, Circle, Upload, Trash2, File } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const STATUS_STYLES: Record<string, string> = {
  "not-started": "bg-slate-600/20 text-slate-400 border border-slate-600/30",
  "in-progress": "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  "completed": "bg-green-500/20 text-green-400 border border-green-500/30",
};

const STATUS_DOT: Record<string, string> = {
  "not-started": "bg-slate-400",
  "in-progress": "bg-yellow-400",
  "completed": "bg-green-400",
};

const STATUS_LABELS: Record<string, string> = {
  "not-started": "Not Started",
  "in-progress": "In Progress",
  "completed": "Completed",
};

const ACCEPTED_FILE_TYPES = ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

interface UploadedFile {
  name: string;
  path: string;
}

function ItemTable({
  items,
  itemStatuses,
  itemNotes,
  uploadedFiles,
  uploadingId,
  onStatusChange,
  onNotesChange,
  onViewTemplate,
  onUploadFile,
  onDeleteFile,
  onDownloadFile,
}: {
  items: RepositoryItem[];
  itemStatuses: Record<string, string>;
  itemNotes: Record<string, string>;
  uploadedFiles: Record<string, UploadedFile>;
  uploadingId: string | null;
  onStatusChange: (id: string, status: string) => void;
  onNotesChange: (id: string, notes: string) => void;
  onViewTemplate: (item: RepositoryItem) => void;
  onUploadFile: (itemId: string, file: File) => void;
  onDeleteFile: (itemId: string) => void;
  onDownloadFile: (itemId: string) => void;
}) {
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700/50 text-left text-muted-foreground text-xs">
            <th className="py-2 px-2 w-10">#</th>
            <th className="py-2 px-2">Requirement</th>
            <th className="py-2 px-2 w-28">DPDP Ref</th>
            <th className="py-2 px-2 w-32">Template</th>
            <th className="py-2 px-2 w-48">Upload</th>
            <th className="py-2 px-2 w-36">Status</th>
            <th className="py-2 px-2 w-40">Notes</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => {
            const status = itemStatuses[item.id] ?? item.status;
            const notes = itemNotes[item.id] ?? item.notes;
            const uploaded = uploadedFiles[item.id];
            const isUploading = uploadingId === item.id;
            return (
              <tr key={item.id} className={`border-b border-slate-700/30 ${i % 2 === 0 ? "bg-slate-800/30" : ""}`}>
                <td className="py-2.5 px-2 text-muted-foreground">{i + 1}</td>
                <td className="py-2.5 px-2 font-medium">{item.requirement}</td>
                <td className="py-2.5 px-2">
                  <Badge variant="outline" className="text-xs font-mono">{item.dpdpRef}</Badge>
                </td>
                <td className="py-2.5 px-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary hover:text-primary/80 hover:bg-primary/10 h-7 text-xs"
                    onClick={() => onViewTemplate(item)}
                  >
                    <FileText className="h-3.5 w-3.5 mr-1" />
                    View Template
                  </Button>
                </td>
                <td className="py-2.5 px-2">
                  {uploaded ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        className="flex items-center gap-1 text-xs text-primary hover:underline truncate max-w-[120px]"
                        onClick={() => onDownloadFile(item.id)}
                        title={uploaded.name}
                      >
                        <File className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{uploaded.name}</span>
                      </button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                        onClick={() => onDeleteFile(item.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <input
                        type="file"
                        accept={ACCEPTED_FILE_TYPES}
                        className="hidden"
                        ref={(el) => { fileInputRefs.current[item.id] = el; }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) onUploadFile(item.id, file);
                          e.target.value = "";
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/30"
                        disabled={isUploading}
                        onClick={() => fileInputRefs.current[item.id]?.click()}
                      >
                        <Upload className="h-3.5 w-3.5 mr-1" />
                        {isUploading ? "Uploading..." : "Upload"}
                      </Button>
                    </>
                  )}
                </td>
                <td className="py-2.5 px-2">
                  <Select value={status} onValueChange={(v) => onStatusChange(item.id, v)}>
                    <SelectTrigger className="h-7 text-xs w-32 border-slate-700/50 bg-transparent">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          <span className="flex items-center gap-1.5">
                            <span className={`h-2 w-2 rounded-full ${STATUS_DOT[value]}`} />
                            {label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="py-2.5 px-2">
                  <Textarea
                    className="h-7 min-h-[28px] text-xs resize-none border-slate-700/50 bg-transparent py-1"
                    placeholder="Add notes..."
                    value={notes}
                    onChange={(e) => onNotesChange(item.id, e.target.value)}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function Repository() {
  const { session } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [phaseFilter, setPhaseFilter] = useState("all");
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(() => new Set(repositoryPhases.map((p) => p.id)));
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(() => {
    const domains = new Set<string>();
    repositoryPhases.find((p) => p.phase === 3)?.items.forEach((item) => {
      if (item.domain) domains.add(item.domain);
    });
    return domains;
  });
  const [selectedItem, setSelectedItem] = useState<RepositoryItem | null>(null);
  const [itemStatuses, setItemStatuses] = useState<Record<string, string>>({});
  const [itemNotes, setItemNotes] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, UploadedFile>>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const userId = session?.user?.id;

  const getStatus = (item: RepositoryItem) => (itemStatuses[item.id] ?? item.status) as string;

  const handleUploadFile = async (itemId: string, file: File) => {
    if (!userId) {
      toast.error("You must be signed in to upload files.");
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error("File size must be under 10MB.");
      return;
    }

    const allowed = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowed.includes(file.type)) {
      toast.error("Only PDF and Word documents are allowed.");
      return;
    }

    setUploadingId(itemId);
    const ext = file.name.split(".").pop();
    const filePath = `${userId}/${itemId}.${ext}`;

    const { error } = await supabase.storage
      .from("repository-files")
      .upload(filePath, file, { upsert: true });

    if (error) {
      toast.error("Upload failed: " + error.message);
    } else {
      setUploadedFiles((prev) => ({ ...prev, [itemId]: { name: file.name, path: filePath } }));
      toast.success(`"${file.name}" uploaded successfully.`);
    }
    setUploadingId(null);
  };

  const handleDeleteFile = async (itemId: string) => {
    const uploaded = uploadedFiles[itemId];
    if (!uploaded) return;

    const { error } = await supabase.storage
      .from("repository-files")
      .remove([uploaded.path]);

    if (error) {
      toast.error("Failed to delete file: " + error.message);
    } else {
      setUploadedFiles((prev) => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
      toast.success("File deleted.");
    }
  };

  const handleDownloadFile = async (itemId: string) => {
    const uploaded = uploadedFiles[itemId];
    if (!uploaded) return;

    const { data, error } = await supabase.storage
      .from("repository-files")
      .download(uploaded.path);

    if (error || !data) {
      toast.error("Failed to download file.");
      return;
    }

    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = uploaded.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredPhases = useMemo(() => {
    return repositoryPhases
      .filter((p) => phaseFilter === "all" || String(p.phase) === phaseFilter)
      .map((phase) => {
        const filtered = phase.items.filter((item) => {
          const query = searchQuery.toLowerCase();
          const matchesSearch = !query || item.requirement.toLowerCase().includes(query) || item.templateTitle.toLowerCase().includes(query);
          const status = getStatus(item);
          const matchesStatus = statusFilter === "all" || status === statusFilter;
          return matchesSearch && matchesStatus;
        });
        return { ...phase, items: filtered };
      })
      .filter((p) => p.items.length > 0);
  }, [searchQuery, statusFilter, phaseFilter, itemStatuses]);

  const stats = useMemo(() => {
    const all = filteredPhases.flatMap((p) => p.items);
    return {
      total: all.length,
      completed: all.filter((i) => getStatus(i) === "completed").length,
      inProgress: all.filter((i) => getStatus(i) === "in-progress").length,
      notStarted: all.filter((i) => getStatus(i) === "not-started").length,
    };
  }, [filteredPhases, itemStatuses]);

  const togglePhase = (id: string) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleDomain = (domain: string) => {
    setExpandedDomains((prev) => {
      const next = new Set(prev);
      next.has(domain) ? next.delete(domain) : next.add(domain);
      return next;
    });
  };

  const handleCopy = async (item: RepositoryItem) => {
    await navigator.clipboard.writeText(item.templateContent);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = (item: RepositoryItem) => {
    const blob = new Blob([item.templateContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${item.templateTitle}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statCards = [
    { label: "Total Requirements", value: stats.total, icon: FileText, color: "text-primary" },
    { label: "Completed", value: stats.completed, icon: CheckCircle, color: "text-green-400" },
    { label: "In Progress", value: stats.inProgress, icon: Clock, color: "text-yellow-400" },
    { label: "Not Started", value: stats.notStarted, icon: Circle, color: "text-slate-400" },
  ];

  const getDomainGroups = (items: RepositoryItem[]) => {
    const groups: Record<string, RepositoryItem[]> = {};
    items.forEach((item) => {
      const domain = item.domain || "Other";
      if (!groups[domain]) groups[domain] = [];
      groups[domain].push(item);
    });
    return Object.entries(groups);
  };

  const sharedTableProps = {
    itemStatuses,
    itemNotes,
    uploadedFiles,
    uploadingId,
    onStatusChange: (id: string, s: string) => setItemStatuses((prev) => ({ ...prev, [id]: s })),
    onNotesChange: (id: string, n: string) => setItemNotes((prev) => ({ ...prev, [id]: n })),
    onViewTemplate: setSelectedItem,
    onUploadFile: handleUploadFile,
    onDeleteFile: handleDeleteFile,
    onDownloadFile: handleDownloadFile,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Assessment Repository</h1>
          <p className="text-muted-foreground">Requirement-wise checklists and downloadable artefact templates for DPDP Act, 2023 compliance</p>
        </div>
        <Button variant="outline" className="shrink-0">
          <Download className="h-4 w-4 mr-2" /> Export Checklist
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search requirements..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="not-started">Not Started</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={phaseFilter} onValueChange={setPhaseFilter}>
          <SelectTrigger className="w-[240px]"><SelectValue placeholder="Phase" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Phases</SelectItem>
            {repositoryPhases.map((p) => (
              <SelectItem key={p.phase} value={String(p.phase)}>Phase {p.phase}: {p.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-3xl font-bold mt-1">{s.value}</p>
              </div>
              <s.icon className={`h-8 w-8 ${s.color} opacity-50`} />
            </div>
          </div>
        ))}
      </div>

      {/* Phase Accordions */}
      <div className="space-y-3">
        {filteredPhases.map((phase) => {
          const isExpanded = expandedPhases.has(phase.id);
          return (
            <div key={phase.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-700/30 transition-colors"
                onClick={() => togglePhase(phase.id)}
              >
                <div className="flex items-center gap-3">
                  <FolderOpen className="h-5 w-5 text-amber-400 shrink-0" />
                  <span className="font-semibold">Phase {phase.phase} – {phase.title}</span>
                  <Badge className="bg-primary/20 text-primary border-primary/30">{phase.items.length}</Badge>
                </div>
                {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              </button>
              {isExpanded && (
                <div className="px-4 pb-4">
                  {phase.phase === 3 ? (
                    getDomainGroups(phase.items).map(([domain, items]) => {
                      const domainExpanded = expandedDomains.has(domain);
                      return (
                        <div key={domain} className="mt-3 first:mt-0">
                          <button
                            className="flex items-center gap-2 mb-2 hover:opacity-80 transition-opacity"
                            onClick={() => toggleDomain(domain)}
                          >
                            <FolderOpen className="h-4 w-4 text-primary" />
                            <span className="text-sm font-semibold text-muted-foreground">{domain}</span>
                            <Badge variant="outline" className="text-xs">{items.length}</Badge>
                            {domainExpanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                          </button>
                          {domainExpanded && (
                            <ItemTable items={items} {...sharedTableProps} />
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <ItemTable items={phase.items} {...sharedTableProps} />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Template Modal */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        {selectedItem && (
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedItem.templateTitle}</DialogTitle>
              <DialogDescription>DPDP Act Reference: {selectedItem.dpdpRef}</DialogDescription>
            </DialogHeader>
            <div className="bg-slate-900 rounded-lg p-4 mt-2">
              <pre className="whitespace-pre-wrap font-mono text-sm text-slate-300">{selectedItem.templateContent}</pre>
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => handleCopy(selectedItem)}>
                <Copy className="h-4 w-4 mr-1" />
                {copiedId === selectedItem.id ? "Copied!" : "Copy to Clipboard"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleDownload(selectedItem)}>
                <Download className="h-4 w-4 mr-1" />
                Download as .txt
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
