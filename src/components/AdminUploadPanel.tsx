import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const FOLDERS = [
  { key: "Checklist", label: "Checklist" },
  { key: "Policies", label: "Policies" },
  { key: "Infographics", label: "Infographics" },
  { key: "Agreement Templates", label: "Agreement Templates" },
];

const FRAMEWORKS = [
  "DPDP Act 2023", "GDPR", "ISO 27701", "ISO 27001", "NIST CSF", "CERT-In Guidelines",
  "SOC 2", "HIPAA", "PCI DSS", "Other"
];

interface AdminUploadPanelProps {
  onUploaded: () => void;
}

export function AdminUploadPanel({ onUploaded }: AdminUploadPanelProps) {
  const [folder, setFolder] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [framework, setFramework] = useState("");
  const [author, setAuthor] = useState("");
  const [uploading, setUploading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return toast.error("Please select a file.");
    if (!folder) return toast.error("Please select a folder.");

    setUploading(true);
    const storagePath = `${folder}/${Date.now()}_${file.name}`;

    const { error: storageErr } = await supabase.storage
      .from("artefact-files")
      .upload(storagePath, file);

    if (storageErr) {
      toast.error("Storage upload failed: " + storageErr.message);
      setUploading(false);
      return;
    }

    const parsedTags = tags.split(",").map(t => t.trim()).filter(Boolean);

    const { error: dbErr } = await supabase.from("artefact_files").insert({
      file_name: file.name,
      file_path: storagePath,
      folder,
      description: description || null,
      tags: parsedTags,
      framework: framework || null,
      author: author || null,
      file_size: file.size,
      mime_type: file.type || null,
    });

    if (dbErr) {
      toast.error("Failed to save record: " + dbErr.message);
    } else {
      toast.success(`"${file.name}" uploaded to ${folder}`);
      setDescription("");
      setTags("");
      setFramework("");
      setAuthor("");
      setFolder("");
      if (fileRef.current) fileRef.current.value = "";
      onUploaded();
    }
    setUploading(false);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Upload Artefact
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="bg-card border border-border rounded-xl p-4 mt-3 space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Upload className="h-4 w-4 text-primary" />
            Upload New Artefact
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Folder *</label>
              <Select value={folder} onValueChange={setFolder}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select folder" /></SelectTrigger>
                <SelectContent>
                  {FOLDERS.map((f) => (
                    <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Framework</label>
              <Select value={framework} onValueChange={setFramework}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select framework" /></SelectTrigger>
                <SelectContent>
                  {FRAMEWORKS.map((f) => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Author</label>
              <Input className="h-9" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author name" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Description</label>
              <Input className="h-9" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description" maxLength={200} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Tags (comma-separated)</label>
              <Input className="h-9" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g. consent, breach, HR" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">File *</label>
              <input
                ref={fileRef}
                type="file"
                className="block w-full text-sm text-muted-foreground file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.gif,.webp"
              />
            </div>
          </div>
          <Button onClick={handleUpload} disabled={uploading} size="sm" className="h-9">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
            Upload
          </Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
