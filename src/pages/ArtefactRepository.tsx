import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Search, LayoutGrid, List, SlidersHorizontal, FolderOpen, Archive,
  Info, Pin, Clock, Sparkles, X, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useArtefactContext } from "@/hooks/useArtefactContext";
import { useArtefactPins } from "@/hooks/useArtefactPins";
import { AdminUploadPanel } from "@/components/AdminUploadPanel";
import { KMAdminPanel } from "@/components/km/KMAdminPanel";
import { ArtefactCard, type ArtefactFileExtended } from "@/components/artefacts/ArtefactCard";
import { ArtefactDetailPanel } from "@/components/artefacts/ArtefactDetailPanel";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const FOLDERS = [
  { key: "Checklist", label: "Checklist", icon: "✅" },
  { key: "Policies", label: "Policies", icon: "📋" },
  { key: "Infographics", label: "Infographics", icon: "📊" },
  { key: "Agreement Templates", label: "Agreement Templates", icon: "📄" },
];

export default function ArtefactRepository() {
  const { isAdmin } = useIsAdmin();
  const {
    artefactFiles, filteredFiles, artefactCount, artefactsByFolder,
    allTags, allFrameworks, commentCounts, loading, filters, setFilters, refresh
  } = useArtefactContext();
  const { pinnedIds, recentIds, togglePin, trackRecent } = useArtefactPins();

  const [view, setView] = useState<"grid" | "list">("grid");
  const [selectedFile, setSelectedFile] = useState<ArtefactFileExtended | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Personalized sections
  const pinnedFiles = useMemo(() =>
    artefactFiles.filter(f => pinnedIds.has(f.id)),
    [artefactFiles, pinnedIds]
  );
  const recentFiles = useMemo(() =>
    recentIds.map(id => artefactFiles.find(f => f.id === id)).filter(Boolean) as ArtefactFileExtended[],
    [artefactFiles, recentIds]
  );

  const handleDownload = async (file: ArtefactFileExtended) => {
    const { data, error } = await supabase.storage.from("artefact-files").download(file.file_path);
    if (error || !data) { toast.error("Failed to download file."); return; }
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.file_name;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded "${file.file_name}"`);
  };

  const handleDelete = async (file: ArtefactFileExtended) => {
    if (!confirm(`Delete "${file.file_name}"?`)) return;
    await supabase.storage.from("artefact-files").remove([file.file_path]);
    const { error } = await supabase.from("artefact_files").delete().eq("id", file.id);
    if (error) toast.error("Failed to delete file.");
    else { toast.success(`Deleted "${file.file_name}"`); refresh(); }
  };

  const openDetail = (file: ArtefactFileExtended) => {
    setSelectedFile(file);
    setDetailOpen(true);
    trackRecent(file.id);
  };

  const activeFilterCount = [filters.folder, filters.framework, filters.search].filter(Boolean).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Artefact Repository</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Organisation-wide compliance documents — {artefactCount} artefacts
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && <AdminUploadPanel onUploaded={refresh} />}
        </div>
      </div>

      {/* Privacy Banner */}
      <div className="flex items-center gap-2.5 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2">
        <Info className="h-4 w-4 text-primary shrink-0" />
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Your Data, Your Control</span> — All documents are private to your workspace. Never shared with other organisations.
        </p>
      </div>

      {/* Search & Filters Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, tags, framework..."
            className="pl-9 h-9"
            value={filters.search || ""}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
          {filters.search && (
            <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setFilters(prev => ({ ...prev, search: "" }))}>
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        <Button variant="outline" size="sm" className="gap-1.5 h-9"
          onClick={() => setFiltersOpen(!filtersOpen)}>
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
          {activeFilterCount > 0 && (
            <Badge className="h-5 w-5 p-0 justify-center text-[10px] bg-primary text-primary-foreground">{activeFilterCount}</Badge>
          )}
        </Button>

        <Select value={filters.sort || "date"} onValueChange={(v) => setFilters(prev => ({ ...prev, sort: v as any }))}>
          <SelectTrigger className="h-9 w-[130px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Sort: Date</SelectItem>
            <SelectItem value="name">Sort: Name</SelectItem>
            <SelectItem value="size">Sort: Size</SelectItem>
          </SelectContent>
        </Select>

        <ToggleGroup type="single" value={view} onValueChange={(v) => v && setView(v as "grid" | "list")} className="border border-border rounded-md">
          <ToggleGroupItem value="grid" className="h-9 w-9 p-0"><LayoutGrid className="h-4 w-4" /></ToggleGroupItem>
          <ToggleGroupItem value="list" className="h-9 w-9 p-0"><List className="h-4 w-4" /></ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Filter chips row */}
      {filtersOpen && (
        <div className="flex flex-wrap gap-3 p-3 bg-card border border-border rounded-xl">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Type</label>
            <Select value={filters.folder || "__all"} onValueChange={(v) => setFilters(prev => ({ ...prev, folder: v === "__all" ? undefined : v }))}>
              <SelectTrigger className="h-8 w-[160px]"><SelectValue placeholder="All types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">All Types</SelectItem>
                {FOLDERS.map(f => <SelectItem key={f.key} value={f.key}>{f.icon} {f.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Framework</label>
            <Select value={filters.framework || "__all"} onValueChange={(v) => setFilters(prev => ({ ...prev, framework: v === "__all" ? undefined : v }))}>
              <SelectTrigger className="h-8 w-[160px]"><SelectValue placeholder="All frameworks" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">All Frameworks</SelectItem>
                {allFrameworks.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" className="self-end h-8 text-xs"
              onClick={() => setFilters({ sort: filters.sort, sortDir: filters.sortDir })}>
              Clear All
            </Button>
          )}
        </div>
      )}

      {/* Active filter badges */}
      {(filters.folder || filters.framework) && !filtersOpen && (
        <div className="flex gap-2">
          {filters.folder && (
            <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, folder: undefined }))}>
              {filters.folder} <X className="h-3 w-3" />
            </Badge>
          )}
          {filters.framework && (
            <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, framework: undefined }))}>
              {filters.framework} <X className="h-3 w-3" />
            </Badge>
          )}
        </div>
      )}

      {/* Stats pills */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="px-3 py-1.5 text-sm font-medium gap-1.5">
          <Archive className="h-3.5 w-3.5" /> {artefactCount} Total
        </Badge>
        {FOLDERS.map(f => (
          <Badge key={f.key} variant="outline"
            className={`px-3 py-1.5 text-sm cursor-pointer hover:bg-accent/50 transition-colors ${filters.folder === f.key ? "bg-primary/10 border-primary/30 text-primary" : ""}`}
            onClick={() => setFilters(prev => ({ ...prev, folder: prev.folder === f.key ? undefined : f.key }))}>
            <span>{f.icon}</span> {(artefactsByFolder[f.key] || []).length}
          </Badge>
        ))}
      </div>

      {/* Personalized Dashboard */}
      {(pinnedFiles.length > 0 || recentFiles.length > 0) && (
        <Collapsible open={dashboardOpen} onOpenChange={setDashboardOpen}>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors">
            <ChevronDown className={`h-4 w-4 transition-transform ${dashboardOpen ? "" : "-rotate-90"}`} />
            My Dashboard
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              {/* Pinned */}
              {pinnedFiles.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Pin className="h-3.5 w-3.5" /> Pinned ({pinnedFiles.length})
                  </h3>
                  <div className="space-y-1.5">
                    {pinnedFiles.slice(0, 5).map(f => (
                      <div key={f.id} className="flex items-center gap-2 p-2 rounded-lg border border-border hover:bg-accent/30 cursor-pointer transition-colors"
                        onClick={() => openDetail(f)}>
                        <span className="text-sm font-medium truncate flex-1">{f.file_name}</span>
                        <Badge variant="outline" className="text-[10px] shrink-0">{f.folder}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Recent */}
              {recentFiles.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> Recently Viewed
                  </h3>
                  <div className="space-y-1.5">
                    {recentFiles.slice(0, 5).map(f => (
                      <div key={f.id} className="flex items-center gap-2 p-2 rounded-lg border border-border hover:bg-accent/30 cursor-pointer transition-colors"
                        onClick={() => openDetail(f)}>
                        <span className="text-sm font-medium truncate flex-1">{f.file_name}</span>
                        <Badge variant="outline" className="text-[10px] shrink-0">{f.folder}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Non-admin notice */}
      {!isAdmin && (
        <div className="flex items-center gap-2.5 rounded-lg border border-border bg-muted/10 px-4 py-2.5">
          <Info className="h-4 w-4 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground">
            Documents are managed by your Admin. Contact them to add or update files.
          </p>
        </div>
      )}

      {/* KM Admin Panel */}
      {isAdmin && <KMAdminPanel files={artefactFiles as any} isAdmin={isAdmin} />}

      {/* Main Content */}
      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Loading artefacts...</div>
      ) : filteredFiles.length === 0 ? (
        <div className="text-center py-16">
          <Archive className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">
            {filters.search || filters.folder || filters.framework
              ? "No artefacts match your filters."
              : "No artefacts uploaded yet."}
          </p>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredFiles.map(file => (
            <ArtefactCard
              key={file.id}
              file={file}
              isPinned={pinnedIds.has(file.id)}
              commentCount={commentCounts[file.id] || 0}
              isAdmin={isAdmin}
              onPin={togglePin}
              onDownload={handleDownload}
              onDelete={handleDelete}
              onClick={openDetail}
            />
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground text-xs bg-muted/20">
                <th className="py-2.5 px-3">Document</th>
                <th className="py-2.5 px-3 w-28">Type</th>
                <th className="py-2.5 px-3 w-28 hidden md:table-cell">Framework</th>
                <th className="py-2.5 px-3 w-36 hidden lg:table-cell">Tags</th>
                <th className="py-2.5 px-3 w-28">Date</th>
                <th className="py-2.5 px-3 w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFiles.map((file, i) => (
                <tr key={file.id}
                  className={`border-b border-border/30 hover:bg-accent/20 cursor-pointer transition-colors ${i % 2 === 0 ? "bg-muted/5" : ""}`}
                  onClick={() => openDetail(file)}>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      {pinnedIds.has(file.id) && <Pin className="h-3 w-3 text-primary shrink-0" />}
                      <span className="font-medium truncate">{file.file_name}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <Badge variant="outline" className="text-[10px]">{file.folder}</Badge>
                  </td>
                  <td className="py-2.5 px-3 hidden md:table-cell text-xs text-muted-foreground">{file.framework || "—"}</td>
                  <td className="py-2.5 px-3 hidden lg:table-cell">
                    <div className="flex gap-1">
                      {(file.tags || []).slice(0, 2).map(t => (
                        <Badge key={t} variant="outline" className="text-[9px] px-1 py-0">{t}</Badge>
                      ))}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-xs text-muted-foreground">{new Date(file.uploaded_at).toLocaleDateString()}</td>
                  <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => togglePin(file.id)}>
                        <Pin className={`h-3.5 w-3.5 ${pinnedIds.has(file.id) ? "text-primary fill-primary" : ""}`} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDownload(file)}>
                        <Archive className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Panel */}
      <ArtefactDetailPanel
        file={selectedFile}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        isAdmin={isAdmin}
        onDownload={handleDownload}
        onDelete={handleDelete}
        onRefresh={refresh}
      />
    </div>
  );
}
