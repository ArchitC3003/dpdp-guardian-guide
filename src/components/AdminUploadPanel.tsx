import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const FOLDERS = [
  { key: "Checklist", label: "Checklist" },
  { key: "Policies", label: "Policies" },
  { key: "Infographics", label: "Infographics" },
  { key: "Agreement Templates", label: "Agreement Templates" },
];

interface AdminUploadPanelProps {
  onUploaded: () => void;
}

export function AdminUploadPanel({ onUploaded }: AdminUploadPanelProps) {
  const [folder, setFolder] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
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

    const { error: dbErr } = await supabase.from("artefact_files").insert({
      file_name: file.name,
      file_path: storagePath,
      folder,
      description: description || null,
    });

    if (dbErr) {
      toast.error("Failed to save record: " + dbErr.message);
    } else {
      toast.success(`"${file.name}" uploaded to ${folder}`);
      setDescription("");
      setFolder("");
      if (fileRef.current) fileRef.current.value = "";
      onUploaded();
    }
    setUploading(false);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
        <Upload className="h-4 w-4 text-primary" />
        Admin: Upload Artefact
      </h3>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[160px]">
          <label className="text-xs text-muted-foreground mb-1 block">Folder</label>
          <Select value={folder} onValueChange={setFolder}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Select folder" />
            </SelectTrigger>
            <SelectContent>
              {FOLDERS.map((f) => (
                <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="text-xs text-muted-foreground mb-1 block">Description (optional)</label>
          <Input
            className="h-9"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description"
            maxLength={200}
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs text-muted-foreground mb-1 block">File</label>
          <input
            ref={fileRef}
            type="file"
            className="block w-full text-sm text-muted-foreground file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.gif,.webp"
          />
        </div>
        <Button onClick={handleUpload} disabled={uploading} size="sm" className="h-9">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
          Upload
        </Button>
      </div>
    </div>
  );
}
