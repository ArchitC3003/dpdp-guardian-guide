import { useState, useEffect, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
  Save, Plus, Trash2, TestTube, ThumbsUp, ThumbsDown, History,
  BookOpen, Shield, Sparkles, AlertTriangle, Settings2, Brain
} from "lucide-react";

const MODULES = ["policy-generator", "sop-builder", "assessment-repository"] as const;
type ModuleName = typeof MODULES[number];

const MODULE_LABELS: Record<ModuleName, string> = {
  "policy-generator": "Policy Generator",
  "sop-builder": "SOP Builder",
  "assessment-repository": "Assessment Repository",
};

const AVAILABLE_MODELS = [
  "google/gemini-2.5-flash",
  "google/gemini-2.5-pro",
  "google/gemini-2.5-flash-lite",
  "openai/gpt-5",
  "openai/gpt-5-mini",
];

const CONTEXT_VARIABLES = [
  { name: "{{org_name}}", desc: "Organisation name from profile" },
  { name: "{{sector}}", desc: "Industry sector (BFSI, Healthcare, etc.)" },
  { name: "{{org_size}}", desc: "Organisation size (Startup, SME, Enterprise)" },
  { name: "{{sdf_class}}", desc: "SDF classification under DPDP Act" },
  { name: "{{processing_activities}}", desc: "Data processing activities list" },
  { name: "{{jurisdiction}}", desc: "Operating jurisdictions/geographies" },
  { name: "{{frameworks}}", desc: "Selected compliance frameworks" },
  { name: "{{document_type}}", desc: "Type of document being generated" },
  { name: "{{maturity_level}}", desc: "Compliance maturity level (1-5)" },
  { name: "{{dpo_name}}", desc: "Data Protection Officer name" },
  { name: "{{effective_date}}", desc: "Document effective date" },
];

interface PromptConfig {
  id?: string;
  module_name: string;
  system_prompt: string;
  model: string;
  temperature: number;
  max_tokens: number;
  output_rules: string[];
  banned_phrases: string[];
  assessment_template: Record<string, any> | null;
  scoring_rubric: Record<string, any> | null;
}

interface TrainingExample {
  id?: string;
  module_name: string;
  input_context: string;
  expected_output: string;
  doc_type: string;
  is_active: boolean;
}

interface ClauseEntry {
  id?: string;
  framework_name: string;
  clause_ref: string;
  clause_text: string;
  is_active: boolean;
}

interface FeedbackEntry {
  id: string;
  module_name: string;
  prompt_version: string | null;
  rating: string;
  comment: string | null;
  created_at: string;
}

interface AuditEntry {
  id: string;
  module_name: string;
  changed_by: string | null;
  changed_at: string;
  change_summary: string | null;
}

const DEFAULT_CONFIG: PromptConfig = {
  module_name: "policy-generator",
  system_prompt: "",
  model: "google/gemini-2.5-flash",
  temperature: 0.3,
  max_tokens: 65536,
  output_rules: [],
  banned_phrases: ["[Organisation Name]", "[Insert", "[To be filled]", "[Date]", "lorem ipsum", "[TBD]"],
  assessment_template: null,
  scoring_rubric: null,
};

export default function AdminAiConfig() {
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("policy-generator");
  const [configs, setConfigs] = useState<Record<string, PromptConfig>>({});
  const [examples, setExamples] = useState<TrainingExample[]>([]);
  const [clauses, setClauses] = useState<ClauseEntry[]>([]);
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [testOutput, setTestOutput] = useState("");
  const [testing, setTesting] = useState(false);
  const [newRule, setNewRule] = useState("");
  const [newBanned, setNewBanned] = useState("");
  const [testProfile, setTestProfile] = useState({
    orgName: "Acme Corp",
    sector: "BFSI",
    frameworks: "DPDP Act 2023, ISO 27001",
    orgSize: "Enterprise",
    documentType: "Information Security Policy",
  });

  // Load all data
  const loadData = useCallback(async () => {
    const [configRes, examplesRes, clausesRes, feedbackRes, auditRes] = await Promise.all([
      supabase.from("ai_prompt_config").select("*"),
      supabase.from("ai_training_examples").select("*").order("created_at", { ascending: false }),
      supabase.from("framework_clause_library").select("*").order("framework_name"),
      supabase.from("ai_output_feedback").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("ai_config_audit_log").select("*").order("changed_at", { ascending: false }).limit(50),
    ]);

    if (configRes.data) {
      const map: Record<string, PromptConfig> = {};
      for (const row of configRes.data) {
        map[row.module_name] = {
          id: row.id,
          module_name: row.module_name,
          system_prompt: row.system_prompt,
          model: row.model,
          temperature: Number(row.temperature),
          max_tokens: row.max_tokens,
          output_rules: Array.isArray(row.output_rules) ? row.output_rules as string[] : [],
          banned_phrases: Array.isArray(row.banned_phrases) ? row.banned_phrases as string[] : [],
          assessment_template: row.assessment_template as Record<string, any> | null,
          scoring_rubric: row.scoring_rubric as Record<string, any> | null,
        };
      }
      setConfigs(map);
    }
    if (examplesRes.data) setExamples(examplesRes.data as TrainingExample[]);
    if (clausesRes.data) setClauses(clausesRes.data as ClauseEntry[]);
    if (feedbackRes.data) setFeedback(feedbackRes.data as FeedbackEntry[]);
    if (auditRes.data) setAuditLog(auditRes.data as AuditEntry[]);
  }, []);

  useEffect(() => {
    if (isAdmin) loadData();
  }, [isAdmin, loadData]);

  const currentConfig = configs[activeTab] || { ...DEFAULT_CONFIG, module_name: activeTab };

  const updateConfig = (field: keyof PromptConfig, value: any) => {
    setConfigs(prev => ({
      ...prev,
      [activeTab]: { ...currentConfig, [field]: value },
    }));
  };

  const saveConfig = async () => {
    setSaving(true);
    const oldConfig = configs[activeTab];
    const payload = {
      module_name: activeTab,
      system_prompt: currentConfig.system_prompt,
      model: currentConfig.model,
      temperature: currentConfig.temperature,
      max_tokens: currentConfig.max_tokens,
      output_rules: currentConfig.output_rules,
      banned_phrases: currentConfig.banned_phrases,
      assessment_template: currentConfig.assessment_template,
      scoring_rubric: currentConfig.scoring_rubric,
      updated_by: user?.id || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = currentConfig.id
      ? await supabase.from("ai_prompt_config").update(payload).eq("id", currentConfig.id)
      : await supabase.from("ai_prompt_config").insert(payload);

    if (error) {
      toast.error("Save failed: " + error.message);
    } else {
      // Log audit
      await supabase.from("ai_config_audit_log").insert({
        module_name: activeTab,
        changed_by: user?.id || null,
        old_prompt: oldConfig?.system_prompt || null,
        new_prompt: currentConfig.system_prompt,
        change_summary: `Updated ${MODULE_LABELS[activeTab as ModuleName] || activeTab} config`,
      });
      toast.success("Configuration saved & published");
      await loadData();
    }
    setSaving(false);
  };

  // Training examples
  const addExample = async () => {
    const { error } = await supabase.from("ai_training_examples").insert({
      module_name: activeTab,
      input_context: "",
      expected_output: "",
      doc_type: "Policy",
      is_active: true,
      created_by: user?.id || null,
    });
    if (!error) { toast.success("Example added"); loadData(); }
  };

  const updateExample = async (id: string, field: string, value: any) => {
    await supabase.from("ai_training_examples").update({ [field]: value }).eq("id", id);
    loadData();
  };

  const deleteExample = async (id: string) => {
    await supabase.from("ai_training_examples").delete().eq("id", id);
    toast.success("Example removed");
    loadData();
  };

  // Clauses
  const addClause = async () => {
    const { error } = await supabase.from("framework_clause_library").insert({
      framework_name: "",
      clause_ref: "",
      clause_text: "",
      is_active: true,
    });
    if (!error) { toast.success("Clause added"); loadData(); }
  };

  const updateClause = async (id: string, field: string, value: any) => {
    await supabase.from("framework_clause_library").update({ [field]: value }).eq("id", id);
    loadData();
  };

  const deleteClause = async (id: string) => {
    await supabase.from("framework_clause_library").delete().eq("id", id);
    toast.success("Clause removed");
    loadData();
  };

  // Test prompt
  const handleTestGenerate = async () => {
    setTesting(true);
    setTestOutput("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("generate-policy", {
        body: {
          documentType: testProfile.documentType,
          frameworks: testProfile.frameworks,
          orgName: testProfile.orgName,
          industry: testProfile.sector,
          orgSize: testProfile.orgSize,
          maturityLevel: "defined",
          userMessage: `Generate a complete ${testProfile.documentType} for testing purposes.`,
          sdfClassification: "non-sdf",
          geographies: "India Only",
          processingActivities: ["General personal data processing"],
          sector: testProfile.sector,
          dpoName: "Test DPO",
          date: new Date().toISOString().split("T")[0],
        },
      });

      if (res.error) {
        setTestOutput("Error: " + (res.error.message || JSON.stringify(res.error)));
      } else if (typeof res.data === "string") {
        setTestOutput(res.data);
      } else {
        setTestOutput(JSON.stringify(res.data, null, 2));
      }
    } catch (e: any) {
      setTestOutput("Error: " + e.message);
    }
    setTesting(false);
  };

  const submitFeedback = async (rating: string, comment: string) => {
    await supabase.from("ai_output_feedback").insert({
      module_name: activeTab,
      prompt_version: currentConfig.id || "draft",
      rating,
      comment: comment || null,
    });
    toast.success("Feedback recorded");
    loadData();
  };

  if (adminLoading) return <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">Loading...</div>;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const moduleExamples = examples.filter(e => e.module_name === activeTab);

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            AI Configuration & Training Panel
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage AI prompts, training examples, model settings, and output quality rules
          </p>
        </div>
        <Badge variant="outline" className="bg-red-500/15 text-red-400 border-red-500/20">
          Super Admin Only
        </Badge>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="policy-generator" className="text-xs">Policy Generator</TabsTrigger>
          <TabsTrigger value="sop-builder" className="text-xs">SOP Builder</TabsTrigger>
          <TabsTrigger value="assessment-repository" className="text-xs">Assessment Repo</TabsTrigger>
          <TabsTrigger value="test-sandbox" className="text-xs">🧪 Test Sandbox</TabsTrigger>
          <TabsTrigger value="audit-log" className="text-xs">📋 Audit Log</TabsTrigger>
          <TabsTrigger value="feedback" className="text-xs">📊 Feedback</TabsTrigger>
        </TabsList>

        {/* Module Config Tabs */}
        {MODULES.map(mod => (
          <TabsContent key={mod} value={mod} className="space-y-6">
            {/* System Prompt Editor */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" /> System Prompt Editor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  rows={20}
                  value={currentConfig.system_prompt}
                  onChange={e => updateConfig("system_prompt", e.target.value)}
                  placeholder="Enter the system prompt for this module..."
                  className="font-mono text-xs"
                />
                <div className="flex justify-end">
                  <Button onClick={saveConfig} disabled={saving} size="sm">
                    <Save className="h-3.5 w-3.5 mr-1.5" />
                    {saving ? "Saving..." : "Save & Publish"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Context Variables */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" /> Available Context Variables
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {CONTEXT_VARIABLES.map(v => (
                    <div key={v.name} className="flex items-start gap-2 p-2 rounded border border-border bg-muted/30">
                      <code className="text-xs font-mono text-primary shrink-0">{v.name}</code>
                      <span className="text-[10px] text-muted-foreground">{v.desc}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI Model Settings */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-primary" /> AI Model Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Model</Label>
                    <Select value={currentConfig.model} onValueChange={v => updateConfig("model", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {AVAILABLE_MODELS.map(m => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Temperature: {currentConfig.temperature}</Label>
                    <Slider
                      value={[currentConfig.temperature * 100]}
                      onValueChange={([v]) => updateConfig("temperature", v / 100)}
                      min={0} max={100} step={5}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Max Tokens</Label>
                    <Input
                      type="number"
                      value={currentConfig.max_tokens}
                      onChange={e => updateConfig("max_tokens", parseInt(e.target.value) || 65536)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Training Examples */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Brain className="h-4 w-4 text-primary" /> Training Examples (Few-Shot)
                  </CardTitle>
                  <Button size="sm" variant="outline" onClick={addExample}>
                    <Plus className="h-3 w-3 mr-1" /> Add Example
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {moduleExamples.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">No training examples yet. Add one to improve AI output quality.</p>
                )}
                {moduleExamples.map(ex => (
                  <div key={ex.id} className="border border-border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Select value={ex.doc_type} onValueChange={v => updateExample(ex.id!, "doc_type", v)}>
                          <SelectTrigger className="w-32 h-7 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Policy">Policy</SelectItem>
                            <SelectItem value="SOP">SOP</SelectItem>
                            <SelectItem value="Assessment">Assessment</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex items-center gap-1.5">
                          <Switch checked={ex.is_active} onCheckedChange={v => updateExample(ex.id!, "is_active", v)} />
                          <span className="text-[10px] text-muted-foreground">{ex.is_active ? "Active" : "Inactive"}</span>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => deleteExample(ex.id!)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                    <div>
                      <Label className="text-xs">Input Context</Label>
                      <Textarea
                        rows={4}
                        value={ex.input_context}
                        onChange={e => updateExample(ex.id!, "input_context", e.target.value)}
                        className="text-xs mt-1"
                        placeholder="Describe the input scenario..."
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Expected Output</Label>
                      <Textarea
                        rows={6}
                        value={ex.expected_output}
                        onChange={e => updateExample(ex.id!, "expected_output", e.target.value)}
                        className="text-xs mt-1"
                        placeholder="Paste the ideal AI output..."
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Output Quality Rules */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" /> Output Quality Rules
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={newRule}
                    onChange={e => setNewRule(e.target.value)}
                    placeholder="Add a mandatory output rule..."
                    className="text-xs"
                    onKeyDown={e => {
                      if (e.key === "Enter" && newRule.trim()) {
                        updateConfig("output_rules", [...currentConfig.output_rules, newRule.trim()]);
                        setNewRule("");
                      }
                    }}
                  />
                  <Button size="sm" variant="outline" onClick={() => {
                    if (newRule.trim()) {
                      updateConfig("output_rules", [...currentConfig.output_rules, newRule.trim()]);
                      setNewRule("");
                    }
                  }}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <div className="space-y-1.5">
                  {currentConfig.output_rules.map((rule, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 p-2 rounded border border-border bg-muted/20 text-xs">
                      <span>{rule}</span>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => {
                        updateConfig("output_rules", currentConfig.output_rules.filter((_, j) => j !== i));
                      }}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Banned Phrases */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" /> Banned Phrases / Placeholder Sanitiser
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={newBanned}
                    onChange={e => setNewBanned(e.target.value)}
                    placeholder="Add a banned phrase..."
                    className="text-xs"
                    onKeyDown={e => {
                      if (e.key === "Enter" && newBanned.trim()) {
                        updateConfig("banned_phrases", [...currentConfig.banned_phrases, newBanned.trim()]);
                        setNewBanned("");
                      }
                    }}
                  />
                  <Button size="sm" variant="outline" onClick={() => {
                    if (newBanned.trim()) {
                      updateConfig("banned_phrases", [...currentConfig.banned_phrases, newBanned.trim()]);
                      setNewBanned("");
                    }
                  }}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {currentConfig.banned_phrases.map((phrase, i) => (
                    <Badge key={i} variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-xs cursor-pointer" onClick={() => {
                      updateConfig("banned_phrases", currentConfig.banned_phrases.filter((_, j) => j !== i));
                    }}>
                      {phrase} ×
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Assessment-specific sections */}
            {mod === "assessment-repository" && (
              <>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Assessment Template Builder</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      rows={10}
                      value={currentConfig.assessment_template ? JSON.stringify(currentConfig.assessment_template, null, 2) : ""}
                      onChange={e => {
                        try { updateConfig("assessment_template", JSON.parse(e.target.value)); } catch {}
                      }}
                      placeholder='{"sections": ["Scope", "Risk Identification", "Control Mapping", "Gap Analysis", "Recommendations"], "question_types": ["Yes/No", "Maturity Scale", "Evidence Based"]}'
                      className="font-mono text-xs"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Scoring Rubric Configuration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      rows={8}
                      value={currentConfig.scoring_rubric ? JSON.stringify(currentConfig.scoring_rubric, null, 2) : ""}
                      onChange={e => {
                        try { updateConfig("scoring_rubric", JSON.parse(e.target.value)); } catch {}
                      }}
                      placeholder='{"levels": {"Low": "Minimal risk, controls adequate", "Medium": "Some gaps, remediation within 90 days", "High": "Significant gaps, remediation within 30 days", "Critical": "Immediate action required"}}'
                      className="font-mono text-xs"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Framework Clause Library</CardTitle>
                      <Button size="sm" variant="outline" onClick={addClause}>
                        <Plus className="h-3 w-3 mr-1" /> Add Clause
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="max-h-[400px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">Framework</TableHead>
                            <TableHead className="text-xs">Clause Ref</TableHead>
                            <TableHead className="text-xs">Clause Text</TableHead>
                            <TableHead className="text-xs w-16">Active</TableHead>
                            <TableHead className="text-xs w-12"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {clauses.map(c => (
                            <TableRow key={c.id}>
                              <TableCell>
                                <Input className="text-xs h-7" value={c.framework_name} onChange={e => updateClause(c.id!, "framework_name", e.target.value)} />
                              </TableCell>
                              <TableCell>
                                <Input className="text-xs h-7" value={c.clause_ref} onChange={e => updateClause(c.id!, "clause_ref", e.target.value)} />
                              </TableCell>
                              <TableCell>
                                <Input className="text-xs h-7" value={c.clause_text} onChange={e => updateClause(c.id!, "clause_text", e.target.value)} />
                              </TableCell>
                              <TableCell>
                                <Switch checked={c.is_active} onCheckedChange={v => updateClause(c.id!, "is_active", v)} />
                              </TableCell>
                              <TableCell>
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => deleteClause(c.id!)}>
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        ))}

        {/* Test Sandbox */}
        <TabsContent value="test-sandbox" className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <TestTube className="h-4 w-4 text-primary" /> Prompt Testing Sandbox
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Org Name</Label>
                  <Input className="text-xs" value={testProfile.orgName} onChange={e => setTestProfile(p => ({ ...p, orgName: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Sector</Label>
                  <Input className="text-xs" value={testProfile.sector} onChange={e => setTestProfile(p => ({ ...p, sector: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Frameworks</Label>
                  <Input className="text-xs" value={testProfile.frameworks} onChange={e => setTestProfile(p => ({ ...p, frameworks: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Org Size</Label>
                  <Input className="text-xs" value={testProfile.orgSize} onChange={e => setTestProfile(p => ({ ...p, orgSize: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Document Type</Label>
                  <Input className="text-xs" value={testProfile.documentType} onChange={e => setTestProfile(p => ({ ...p, documentType: e.target.value }))} />
                </div>
              </div>
              <Button onClick={handleTestGenerate} disabled={testing}>
                <TestTube className="h-3.5 w-3.5 mr-1.5" />
                {testing ? "Generating..." : "Generate Test Output"}
              </Button>
            </CardContent>
          </Card>

          {testOutput && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Generated Output Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-[500px]">
                  <pre className="text-xs whitespace-pre-wrap font-mono bg-muted/30 p-4 rounded">{testOutput}</pre>
                </ScrollArea>
                <Separator className="my-4" />
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">Rate this output:</span>
                  <Button size="sm" variant="outline" onClick={() => submitFeedback("up", "")}>
                    <ThumbsUp className="h-3.5 w-3.5 mr-1" /> Good
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => submitFeedback("down", "")}>
                    <ThumbsDown className="h-3.5 w-3.5 mr-1" /> Poor
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Audit Log */}
        <TabsContent value="audit-log">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <History className="h-4 w-4 text-primary" /> Configuration Change History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Module</TableHead>
                    <TableHead className="text-xs">Summary</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLog.map(entry => (
                    <TableRow key={entry.id}>
                      <TableCell className="text-xs">{new Date(entry.changed_at).toLocaleString()}</TableCell>
                      <TableCell className="text-xs">{MODULE_LABELS[entry.module_name as ModuleName] || entry.module_name}</TableCell>
                      <TableCell className="text-xs">{entry.change_summary || "—"}</TableCell>
                    </TableRow>
                  ))}
                  {auditLog.length === 0 && (
                    <TableRow><TableCell colSpan={3} className="text-center text-xs text-muted-foreground py-6">No changes recorded yet</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feedback */}
        <TabsContent value="feedback">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Output Quality Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Module</TableHead>
                    <TableHead className="text-xs">Rating</TableHead>
                    <TableHead className="text-xs">Comment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feedback.map(f => (
                    <TableRow key={f.id}>
                      <TableCell className="text-xs">{new Date(f.created_at).toLocaleString()}</TableCell>
                      <TableCell className="text-xs">{MODULE_LABELS[f.module_name as ModuleName] || f.module_name}</TableCell>
                      <TableCell>
                        {f.rating === "up"
                          ? <ThumbsUp className="h-3.5 w-3.5 text-primary" />
                          : <ThumbsDown className="h-3.5 w-3.5 text-destructive" />
                        }
                      </TableCell>
                      <TableCell className="text-xs">{f.comment || "—"}</TableCell>
                    </TableRow>
                  ))}
                  {feedback.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-6">No feedback yet</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
