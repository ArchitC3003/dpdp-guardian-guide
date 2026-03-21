import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Download, Share2, Trash2, Send, FileText, Clock, MessageSquare, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import type { ArtefactFileExtended } from "./ArtefactCard";

interface ArtefactDetailPanelProps {
  file: ArtefactFileExtended | null;
  open: boolean;
  onClose: () => void;
  isAdmin: boolean;
  onDownload: (file: ArtefactFileExtended) => void;
  onDelete: (file: ArtefactFileExtended) => void;
  onRefresh: () => void;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
}

export function ArtefactDetailPanel({ file, open, onClose, isAdmin, onDownload, onDelete, onRefresh }: ArtefactDetailPanelProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [versions, setVersions] = useState<ArtefactFileExtended[]>([]);
  const [editTags, setEditTags] = useState("");
  const [editFramework, setEditFramework] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!file || !open) return;
    // Load comments
    supabase.from("artefact_comments").select("*").eq("artefact_id", file.id).order("created_at", { ascending: true })
      .then(({ data }) => setComments((data as Comment[]) || []));
    // Load versions
    const parentId = file.parent_id || file.id;
    supabase.from("artefact_files").select("*").or(`id.eq.${parentId},parent_id.eq.${parentId}`).order("version_number", { ascending: false })
      .then(({ data }) => setVersions((data as ArtefactFileExtended[]) || []));
    // Init edit fields
    setEditTags((file.tags || []).join(", "));
    setEditFramework(file.framework || "");
    setEditDesc(file.description || "");
    setEditing(false);
  }, [file, open]);

  const addComment = async () => {
    if (!newComment.trim() || !user || !file) return;
    const { error } = await supabase.from("artefact_comments").insert({
      artefact_id: file.id, user_id: user.id, content: newComment.trim()
    });
    if (error) { toast.error("Failed to add comment"); return; }
    setNewComment("");
    const { data } = await supabase.from("artefact_comments").select("*").eq("artefact_id", file.id).order("created_at", { ascending: true });
    setComments((data as Comment[]) || []);
  };

  const deleteComment = async (commentId: string) => {
    await supabase.from("artefact_comments").delete().eq("id", commentId);
    setComments(prev => prev.filter(c => c.id !== commentId));
  };

  const saveMetadata = async () => {
    if (!file) return;
    const tags = editTags.split(",").map(t => t.trim()).filter(Boolean);
    const { error } = await supabase.from("artefact_files").update({
      tags, framework: editFramework || null, description: editDesc || null
    }).eq("id", file.id);
    if (error) { toast.error("Failed to save"); return; }
    toast.success("Metadata updated");
    setEditing(false);
    onRefresh();
  };

  const copyShareLink = () => {
    if (!file) return;
    const { data } = supabase.storage.from("artefact-files").getPublicUrl(file.file_path);
    navigator.clipboard.writeText(data?.publicUrl || "");
    toast.success("Link copied to clipboard");
  };

  if (!file) return null;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-lg pr-8">{file.file_name}</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Meta badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-primary/10 text-primary">{file.folder}</Badge>
            {file.framework && <Badge variant="outline" className="bg-accent text-accent-foreground">{file.framework}</Badge>}
            {file.author && <Badge variant="outline">{file.author}</Badge>}
            {file.version_number && <Badge variant="outline">v{file.version_number}</Badge>}
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground">{file.description || "No description"}</p>

          {/* Tags */}
          {(file.tags || []).length > 0 && (
            <div className="flex flex-wrap gap-1">
              {(file.tags || []).map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
              ))}
            </div>
          )}

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div>Uploaded: {new Date(file.uploaded_at).toLocaleDateString()}</div>
            {file.file_size && <div>Size: {(file.file_size / 1024).toFixed(1)} KB</div>}
            {file.mime_type && <div>Type: {file.mime_type}</div>}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button size="sm" onClick={() => onDownload(file)}><Download className="h-4 w-4 mr-1" /> Download</Button>
            <Button size="sm" variant="outline" onClick={copyShareLink}><Copy className="h-4 w-4 mr-1" /> Copy Link</Button>
            {isAdmin && (
              <Button size="sm" variant="destructive" onClick={() => { onDelete(file); onClose(); }}>
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            )}
          </div>

          {/* Tabs */}
          <Tabs defaultValue="versions" className="mt-2">
            <TabsList className="w-full">
              <TabsTrigger value="versions" className="flex-1"><Clock className="h-3.5 w-3.5 mr-1" /> Versions</TabsTrigger>
              <TabsTrigger value="comments" className="flex-1"><MessageSquare className="h-3.5 w-3.5 mr-1" /> Comments ({comments.length})</TabsTrigger>
              {isAdmin && <TabsTrigger value="edit" className="flex-1"><FileText className="h-3.5 w-3.5 mr-1" /> Edit</TabsTrigger>}
            </TabsList>

            <TabsContent value="versions" className="space-y-2 mt-3">
              {versions.length <= 1 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">Only one version available.</p>
              ) : (
                versions.map(v => (
                  <div key={v.id} className={`flex items-center justify-between p-2 rounded-lg border ${v.id === file.id ? "border-primary bg-primary/5" : "border-border"}`}>
                    <div>
                      <span className="text-sm font-medium">v{v.version_number || 1}</span>
                      <span className="text-xs text-muted-foreground ml-2">{formatDistanceToNow(new Date(v.uploaded_at), { addSuffix: true })}</span>
                    </div>
                    {v.is_current_version && <Badge className="text-[10px]">Current</Badge>}
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="comments" className="space-y-3 mt-3">
              {comments.length === 0 && <p className="text-xs text-muted-foreground py-4 text-center">No comments yet.</p>}
              {comments.map(c => (
                <div key={c.id} className="p-2 rounded-lg bg-muted/20 border border-border/50">
                  <p className="text-sm">{c.content}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</span>
                    {(c.user_id === user?.id || isAdmin) && (
                      <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={() => deleteComment(c.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              <div className="flex gap-2">
                <Input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment..." className="h-8 text-sm" onKeyDown={(e) => e.key === "Enter" && addComment()} />
                <Button size="sm" className="h-8" onClick={addComment}><Send className="h-3.5 w-3.5" /></Button>
              </div>
            </TabsContent>

            {isAdmin && (
              <TabsContent value="edit" className="space-y-3 mt-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                  <Textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="text-sm" rows={2} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Tags (comma-separated)</label>
                  <Input value={editTags} onChange={(e) => setEditTags(e.target.value)} className="h-8 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Framework</label>
                  <Input value={editFramework} onChange={(e) => setEditFramework(e.target.value)} className="h-8 text-sm" />
                </div>
                <Button size="sm" onClick={saveMetadata}>Save Changes</Button>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
