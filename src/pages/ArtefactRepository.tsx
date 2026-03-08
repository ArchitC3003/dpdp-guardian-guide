import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FolderOpen, FileText, Download, ChevronDown, ChevronRight, Archive, Trash2, Info, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { AdminUploadPanel } from "@/components/AdminUploadPanel";

const FOLDERS = [
  { key: "Checklist", label: "Checklist", icon: "✅", description: "Compliance checklists and verification documents" },
  { key: "Policies", label: "Policies", icon: "📋", description: "Privacy policies, data governance policies, and procedures" },
  { key: "Infographics", label: "Infographics", icon: "📊", description: "Visual guides and compliance infographics" },
  { key: "Agreement Templates", label: "Agreement Templates", icon: "📄", description: "DPA, consent, and data sharing agreement templates" },
];

interface ArtefactFile {
  id: string;
  folder: string;
  file_name: string;
  file_path: string;
  description: string;
  uploaded_at: string;
}

export default function ArtefactRepository() {
  const [files, setFiles] = useState<ArtefactFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(FOLDERS.map((f) => f.key)));
  const { isAdmin } = useIsAdmin();

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    const { data, error } = await supabase
      .from("artefact_files")
      .select("*")
      .order("uploaded_at", { ascending: false });

    if (error) {
      toast.error("Failed to load artefacts.");
    } else {
      setFiles((data as ArtefactFile[]) || []);
    }
    setLoading(false);
  };

  const handleDownload = async (file: ArtefactFile) => {
    const { data, error } = await supabase.storage
      .from("artefact-files")
      .download(file.file_path);

    if (error || !data) {
      toast.error("Failed to download file.");
      return;
    }

    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.file_name;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded "${file.file_name}"`);
  };

  const handleDelete = async (file: ArtefactFile) => {
    if (!confirm(`Delete "${file.file_name}"?`)) return;
    await supabase.storage.from("artefact-files").remove([file.file_path]);
    const { error } = await supabase.from("artefact_files").delete().eq("id", file.id);
    if (error) toast.error("Failed to delete file.");
    else { toast.success(`Deleted "${file.file_name}"`); fetchFiles(); }
  };

  const toggleFolder = (key: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const getFilesForFolder = (folder: string) => files.filter((f) => f.folder === folder);

  const totalFiles = files.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary">Artefact Repository</h1>
        <p className="text-muted-foreground">
          Download compliance artefacts, templates, checklists, and policies for DPDP Act implementation
        </p>
      </div>

      {/* Privacy Notice Banner */}
      <div className="flex items-center gap-2.5 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5">
        <Info className="h-4 w-4 text-primary shrink-0" />
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Your Data, Your Control</span> — All documents in this repository are private to your workspace. They are never shared with other organisations. Delete any document at any time using the trash icon.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Documents</p>
              <p className="text-3xl font-bold mt-1">{totalFiles}</p>
            </div>
            <Archive className="h-8 w-8 text-primary opacity-50" />
          </div>
        </div>
        {FOLDERS.map((folder) => (
          <div key={folder.key} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{folder.label}</p>
                <p className="text-3xl font-bold mt-1">{getFilesForFolder(folder.key).length}</p>
              </div>
              <span className="text-2xl opacity-50">{folder.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Admin Upload */}
      {isAdmin && <AdminUploadPanel onUploaded={fetchFiles} />}

      {/* Folders */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading artefacts...</div>
      ) : (
        <div className="space-y-3">
          {FOLDERS.map((folder) => {
            const folderFiles = getFilesForFolder(folder.key);
            const isExpanded = expandedFolders.has(folder.key);

            return (
              <div key={folder.key} className="bg-card border border-border rounded-xl overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/30 transition-colors"
                  onClick={() => toggleFolder(folder.key)}
                >
                  <div className="flex items-center gap-3">
                    <FolderOpen className="h-5 w-5 text-amber-400 shrink-0" />
                    <span className="text-lg">{folder.icon}</span>
                    <span className="font-semibold">{folder.label}</span>
                    <Badge className="bg-primary/20 text-primary border-primary/30">
                      {folderFiles.length}
                    </Badge>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4">
                    <p className="text-xs text-muted-foreground mb-3">{folder.description}</p>
                    {folderFiles.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        No documents available in this folder yet.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border text-left text-muted-foreground text-xs">
                              <th className="py-2 px-2 w-10">#</th>
                              <th className="py-2 px-2">Document Name</th>
                              <th className="py-2 px-2 w-48">Description</th>
                              <th className="py-2 px-2 w-40">Uploaded</th>
                              <th className="py-2 px-2 w-32">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {folderFiles.map((file, i) => (
                              <tr
                                key={file.id}
                                className={`border-b border-border/30 ${i % 2 === 0 ? "bg-muted/20" : ""}`}
                              >
                                <td className="py-2.5 px-2 text-muted-foreground">{i + 1}</td>
                                <td className="py-2.5 px-2">
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-primary shrink-0" />
                                    <span className="font-medium">{file.file_name}</span>
                                  </div>
                                </td>
                                <td className="py-2.5 px-2 text-muted-foreground text-xs">
                                  {file.description || "—"}
                                </td>
                                <td className="py-2.5 px-2 text-muted-foreground text-xs">
                                  {new Date(file.uploaded_at).toLocaleDateString()}
                                </td>
                                <td className="py-2.5 px-2 flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs text-primary hover:text-primary/80 hover:bg-primary/10"
                                    onClick={() => handleDownload(file)}
                                  >
                                    <Download className="h-3.5 w-3.5 mr-1" />
                                    Download
                                  </Button>
                                  {isAdmin && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 text-xs text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                                      onClick={() => handleDelete(file)}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
