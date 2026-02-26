import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { POLICY_ITEMS } from "@/data/assessmentDomains";
import { ArrowRight, Plus, Trash2, Link } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type FileRef = Tables<"file_references">;

const allCategories = [
  ...Object.values(POLICY_ITEMS).flatMap((c) => c.items.map((i) => i.id)),
  "evidence",
  "other",
];

export default function PhaseFileReferences() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const [refs, setRefs] = useState<FileRef[]>([]);
  const [category, setCategory] = useState("");
  const [label, setLabel] = useState("");
  const [filePath, setFilePath] = useState("");

  useEffect(() => {
    if (!assessmentId) return;
    loadRefs();
  }, [assessmentId]);

  const loadRefs = async () => {
    const { data } = await supabase
      .from("file_references")
      .select("*")
      .eq("assessment_id", assessmentId!)
      .order("created_at", { ascending: false });
    setRefs(data || []);
  };

  const addRef = async () => {
    if (!assessmentId || !category || !label || !filePath) {
      toast.error("Fill all fields");
      return;
    }
    const { error } = await supabase
      .from("file_references")
      .insert({ assessment_id: assessmentId, category, label, file_path: filePath });
    if (error) { toast.error("Failed to add"); return; }
    toast.success("Reference added");
    setCategory(""); setLabel(""); setFilePath("");
    loadRefs();
  };

  const deleteRef = async (id: string) => {
    await supabase.from("file_references").delete().eq("id", id);
    toast.success("Deleted");
    loadRefs();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold bg-primary/20 text-primary px-2 py-1 rounded">PHASE 5</span>
          <h1 className="text-2xl font-bold">File References</h1>
        </div>
        <Button onClick={() => navigate(`/assessment/${assessmentId}/dashboard`)} className="gradient-primary">
          Next Phase <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Add Form */}
      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-base">Add External Reference</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent className="max-h-64">
                {allCategories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label" />
            <Input value={filePath} onChange={(e) => setFilePath(e.target.value)} placeholder="URL or file path" />
            <Button onClick={addRef} className="gradient-primary"><Plus className="h-4 w-4 mr-2" /> Add</Button>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card className="border-border bg-card">
        <CardContent className="pt-6">
          {refs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No file references yet.</p>
          ) : (
            <div className="space-y-2">
              {refs.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <div className="flex items-center gap-3 min-w-0">
                    <Link className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">{r.category}</span>
                    <span className="text-sm font-medium truncate">{r.label}</span>
                    <span className="text-xs font-mono text-muted-foreground truncate">{r.file_path}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                    <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => deleteRef(r.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
