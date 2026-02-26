import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { POLICY_ITEMS } from "@/data/assessmentDomains";
import { ArrowRight, ChevronDown } from "lucide-react";
import { toast } from "sonner";

interface PolicyRow {
  id?: string;
  item_id: string;
  status: string | null;
  approved: string | null;
  review_cycle: string | null;
  observation: string | null;
}

export default function PhasePolicyMatrix() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState<Record<string, PolicyRow>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!assessmentId) return;
    supabase
      .from("policy_items")
      .select("*")
      .eq("assessment_id", assessmentId)
      .then(({ data }) => {
        const map: Record<string, PolicyRow> = {};
        (data || []).forEach((d) => { map[d.item_id] = d; });
        setItems(map);
      });
  }, [assessmentId]);

  const updateItem = useCallback(async (itemId: string, field: string, value: string) => {
    if (!assessmentId) return;
    const existing = items[itemId];
    const updated = { ...existing, item_id: itemId, [field]: value };
    setItems((prev) => ({ ...prev, [itemId]: updated }));

    setSaving(true);
    if (existing?.id) {
      await supabase.from("policy_items").update({ [field]: value }).eq("id", existing.id);
    } else {
      const { data } = await supabase
        .from("policy_items")
        .insert({ assessment_id: assessmentId, item_id: itemId, [field]: value })
        .select()
        .single();
      if (data) setItems((prev) => ({ ...prev, [itemId]: { ...updated, id: data.id } }));
    }
    setSaving(false);
  }, [assessmentId, items]);

  const categories = Object.entries(POLICY_ITEMS);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold bg-primary/20 text-primary px-2 py-1 rounded">PHASE 2</span>
          <div>
            <h1 className="text-2xl font-bold">Policy & Artefact Matrix</h1>
            <p className="text-sm text-muted-foreground">37 foundational documents — quick existence check</p>
          </div>
          {saving && <span className="text-xs text-muted-foreground">Saving...</span>}
        </div>
        <Button onClick={() => navigate(`/assessment/${assessmentId}/rapid-assessment`)} className="gradient-primary">
          Next Phase <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {categories.map(([key, cat]) => (
        <Collapsible key={key} defaultOpen>
          <Card className="border-border bg-card">
            <CollapsibleTrigger className="w-full">
              <CardHeader className="flex flex-row items-center justify-between cursor-pointer hover:bg-secondary/30 transition-colors rounded-t-lg">
                <CardTitle className="text-base">{key}. {cat.label} ({cat.items.length})</CardTitle>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground text-xs">
                        <th className="text-left p-3 w-16">ID</th>
                        <th className="text-left p-3">Artefact</th>
                        <th className="text-left p-3 w-32">Status</th>
                        <th className="text-left p-3 w-24">Approved</th>
                        <th className="text-left p-3 w-36">Review Cycle</th>
                        <th className="text-left p-3 w-48">Observation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cat.items.map((item) => {
                        const row = items[item.id] || { item_id: item.id, status: null, approved: null, review_cycle: null, observation: null };
                        return (
                          <tr key={item.id} className="border-b border-border/50 hover:bg-secondary/20">
                            <td className="p-3 font-mono text-xs text-primary">{item.id}</td>
                            <td className="p-3">{item.name}</td>
                            <td className="p-3">
                              <Select value={row.status || ""} onValueChange={(v) => updateItem(item.id, "status", v)}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                                <SelectContent>
                                  {["Current", "Outdated", "Draft", "Missing", "N/A"].map((s) => (
                                    <SelectItem key={s} value={s}>{s}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="p-3">
                              <Select value={row.approved || ""} onValueChange={(v) => updateItem(item.id, "approved", v)}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Yes">Yes</SelectItem>
                                  <SelectItem value="No">No</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="p-3">
                              <Select value={row.review_cycle || ""} onValueChange={(v) => updateItem(item.id, "review_cycle", v)}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                                <SelectContent>
                                  {["Annual", "Semi-Annual", "Quarterly", "Ad-hoc", "Not Defined"].map((s) => (
                                    <SelectItem key={s} value={s}>{s}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="p-3">
                              <Input
                                className="h-8 text-xs"
                                value={row.observation || ""}
                                onChange={(e) => updateItem(item.id, "observation", e.target.value)}
                                placeholder="Notes..."
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      ))}
    </div>
  );
}
