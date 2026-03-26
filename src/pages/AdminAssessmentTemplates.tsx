import { useState, useEffect, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, LayoutTemplate, Copy, Edit2, ToggleLeft, Shield, Layers, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface Framework {
  id: string;
  name: string;
  short_code: string;
  jurisdiction: string;
  is_active: boolean;
  domain_count: number;
  requirement_count: number;
}

interface Template {
  id: string;
  name: string;
  description: string | null;
  template_type: string;
  is_default: boolean;
  is_active: boolean;
  framework_ids: string[];
  framework_count: number;
  requirement_count: number;
}

export default function AdminAssessmentTemplates() {
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formType, setFormType] = useState("single");
  const [selectedFrameworkIds, setSelectedFrameworkIds] = useState<string[]>([]);

  const fetchFrameworks = useCallback(async () => {
    const { data: fws } = await supabase
      .from("assessment_frameworks")
      .select("id, name, short_code, jurisdiction, is_active")
      .eq("is_active", true)
      .order("name");

    if (!fws) return;

    // Get domain and requirement counts per framework
    const { data: domains } = await supabase
      .from("framework_domains")
      .select("id, framework_id")
      .eq("is_active", true);

    const { data: reqs } = await supabase
      .from("framework_requirements")
      .select("id, domain_id")
      .eq("is_active", true);

    const domainsByFw: Record<string, string[]> = {};
    (domains || []).forEach((d) => {
      if (!domainsByFw[d.framework_id]) domainsByFw[d.framework_id] = [];
      domainsByFw[d.framework_id].push(d.id);
    });

    const reqsByDomain: Record<string, number> = {};
    (reqs || []).forEach((r) => {
      reqsByDomain[r.domain_id] = (reqsByDomain[r.domain_id] || 0) + 1;
    });

    const enriched: Framework[] = fws.map((fw) => {
      const domIds = domainsByFw[fw.id] || [];
      const reqCount = domIds.reduce((sum, did) => sum + (reqsByDomain[did] || 0), 0);
      return { ...fw, domain_count: domIds.length, requirement_count: reqCount };
    });

    setFrameworks(enriched);
  }, []);

  const fetchTemplates = useCallback(async () => {
    const { data: tpls } = await supabase
      .from("assessment_templates")
      .select("*")
      .order("is_default", { ascending: false });

    if (!tpls) return;

    const { data: links } = await supabase
      .from("assessment_template_frameworks")
      .select("template_id, framework_id");

    const { data: domains } = await supabase
      .from("framework_domains")
      .select("id, framework_id")
      .eq("is_active", true);

    const { data: reqs } = await supabase
      .from("framework_requirements")
      .select("id, domain_id")
      .eq("is_active", true);

    const domainsByFw: Record<string, string[]> = {};
    (domains || []).forEach((d) => {
      if (!domainsByFw[d.framework_id]) domainsByFw[d.framework_id] = [];
      domainsByFw[d.framework_id].push(d.id);
    });

    const reqsByDomain: Record<string, number> = {};
    (reqs || []).forEach((r) => {
      reqsByDomain[r.domain_id] = (reqsByDomain[r.domain_id] || 0) + 1;
    });

    const linksByTpl: Record<string, string[]> = {};
    (links || []).forEach((l) => {
      if (!linksByTpl[l.template_id]) linksByTpl[l.template_id] = [];
      linksByTpl[l.template_id].push(l.framework_id);
    });

    const enriched: Template[] = tpls.map((t) => {
      const fwIds = linksByTpl[t.id] || [];
      let reqCount = 0;
      fwIds.forEach((fid) => {
        const domIds = domainsByFw[fid] || [];
        domIds.forEach((did) => { reqCount += reqsByDomain[did] || 0; });
      });
      return {
        id: t.id,
        name: t.name,
        description: t.description,
        template_type: t.template_type,
        is_default: t.is_default,
        is_active: t.is_active,
        framework_ids: fwIds,
        framework_count: fwIds.length,
        requirement_count: reqCount,
      };
    });

    setTemplates(enriched);
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchFrameworks();
      fetchTemplates();
    }
  }, [isAdmin, fetchFrameworks, fetchTemplates]);

  if (adminLoading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const openCreate = () => {
    setEditingTemplate(null);
    setFormName("");
    setFormDesc("");
    setFormType("single");
    setSelectedFrameworkIds([]);
    setDialogOpen(true);
  };

  const openEdit = (t: Template) => {
    setEditingTemplate(t);
    setFormName(t.name);
    setFormDesc(t.description || "");
    setFormType(t.template_type);
    setSelectedFrameworkIds(t.framework_ids);
    setDialogOpen(true);
  };

  const toggleFramework = (fwId: string) => {
    setSelectedFrameworkIds((prev) =>
      prev.includes(fwId) ? prev.filter((id) => id !== fwId) : [...prev, fwId]
    );
  };

  const previewStats = () => {
    let domains = 0;
    let requirements = 0;
    selectedFrameworkIds.forEach((fid) => {
      const fw = frameworks.find((f) => f.id === fid);
      if (fw) {
        domains += fw.domain_count;
        requirements += fw.requirement_count;
      }
    });
    return { domains, requirements };
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      toast.error("Template name is required");
      return;
    }

    if (editingTemplate) {
      const { error } = await supabase
        .from("assessment_templates")
        .update({ name: formName, description: formDesc || null, template_type: formType })
        .eq("id", editingTemplate.id);
      if (error) { toast.error(error.message); return; }

      // Replace framework links
      await supabase.from("assessment_template_frameworks").delete().eq("template_id", editingTemplate.id);
      if (selectedFrameworkIds.length > 0) {
        await supabase.from("assessment_template_frameworks").insert(
          selectedFrameworkIds.map((fid) => ({ template_id: editingTemplate.id, framework_id: fid }))
        );
      }
      toast.success("Template updated");
    } else {
      const { data, error } = await supabase
        .from("assessment_templates")
        .insert({ name: formName, description: formDesc || null, template_type: formType })
        .select("id")
        .single();
      if (error || !data) { toast.error(error?.message || "Failed to create"); return; }

      if (selectedFrameworkIds.length > 0) {
        await supabase.from("assessment_template_frameworks").insert(
          selectedFrameworkIds.map((fid) => ({ template_id: data.id, framework_id: fid }))
        );
      }
      toast.success("Template created");
    }

    setDialogOpen(false);
    fetchTemplates();
  };

  const handleClone = async (t: Template) => {
    const { data, error } = await supabase
      .from("assessment_templates")
      .insert({ name: `Copy of ${t.name}`, description: t.description, template_type: t.template_type })
      .select("id")
      .single();
    if (error || !data) { toast.error(error?.message || "Clone failed"); return; }

    if (t.framework_ids.length > 0) {
      await supabase.from("assessment_template_frameworks").insert(
        t.framework_ids.map((fid) => ({ template_id: data.id, framework_id: fid }))
      );
    }
    toast.success("Template cloned");
    fetchTemplates();
  };

  const handleToggleActive = async (t: Template) => {
    const { error } = await supabase
      .from("assessment_templates")
      .update({ is_active: !t.is_active })
      .eq("id", t.id);
    if (error) { toast.error(error.message); return; }
    toast.success(t.is_active ? "Template deactivated" : "Template activated");
    fetchTemplates();
  };

  const stats = previewStats();

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LayoutTemplate className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Assessment Templates</h1>
            <p className="text-sm text-muted-foreground">Configure assessment frameworks & templates</p>
          </div>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Create Template
        </Button>
      </div>

      {/* Template Grid */}
      {templates.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <LayoutTemplate className="h-10 w-10 mb-3 opacity-40" />
            <p className="text-sm">No templates yet. Create one to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => (
            <Card key={t.id} className={cn("transition-all", !t.is_active && "opacity-50")}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{t.name}</CardTitle>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge variant={t.template_type === "composite" ? "default" : "secondary"} className="text-[10px]">
                      {t.template_type === "composite" ? "Composite" : "Single"}
                    </Badge>
                    {t.is_default && (
                      <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
                        Default
                      </Badge>
                    )}
                  </div>
                </div>
                {t.description && (
                  <CardDescription className="text-xs line-clamp-2">{t.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="pb-3">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Shield className="h-3.5 w-3.5" />
                    {t.framework_count} framework{t.framework_count !== 1 ? "s" : ""}
                  </span>
                  <span className="flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5" />
                    {t.requirement_count} requirements
                  </span>
                </div>
                {!t.is_active && (
                  <Badge variant="outline" className="mt-2 text-[10px] text-destructive border-destructive/40">
                    Inactive
                  </Badge>
                )}
              </CardContent>
              <CardFooter className="border-t border-border pt-3 gap-2">
                <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => openEdit(t)}>
                  <Edit2 className="h-3.5 w-3.5" /> Edit
                </Button>
                <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => handleClone(t)}>
                  <Copy className="h-3.5 w-3.5" /> Clone
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn("gap-1 text-xs ml-auto", t.is_active ? "text-destructive" : "text-primary")}
                  onClick={() => handleToggleActive(t)}
                >
                  <ToggleLeft className="h-3.5 w-3.5" />
                  {t.is_active ? "Deactivate" : "Activate"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Edit Template" : "Create Template"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. DPDP Full Assessment" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} rows={2} placeholder="Optional description" />
            </div>
            <div className="space-y-1.5">
              <Label>Template Type</Label>
              <Select value={formType} onValueChange={setFormType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single Framework</SelectItem>
                  <SelectItem value="composite">Composite (Multi-Framework)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Frameworks</Label>
              <ScrollArea className="h-48 rounded-md border border-border p-2">
                {frameworks.map((fw) => (
                  <label
                    key={fw.id}
                    className="flex items-center gap-3 py-2 px-2 rounded-md hover:bg-muted/50 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedFrameworkIds.includes(fw.id)}
                      onCheckedChange={() => toggleFramework(fw.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{fw.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {fw.short_code} · {fw.jurisdiction} · {fw.domain_count} domains · {fw.requirement_count} reqs
                      </p>
                    </div>
                  </label>
                ))}
                {frameworks.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">No active frameworks found</p>
                )}
              </ScrollArea>
            </div>

            {/* Preview */}
            {selectedFrameworkIds.length > 0 && (
              <div className="rounded-md border border-border bg-muted/30 p-3">
                <p className="text-xs font-medium text-foreground mb-1">Selection Preview</p>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Shield className="h-3.5 w-3.5" /> {selectedFrameworkIds.length} framework{selectedFrameworkIds.length !== 1 ? "s" : ""}
                  </span>
                  <span className="flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5" /> {stats.domains} domains
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" /> {stats.requirements} requirements
                  </span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editingTemplate ? "Save Changes" : "Create Template"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
