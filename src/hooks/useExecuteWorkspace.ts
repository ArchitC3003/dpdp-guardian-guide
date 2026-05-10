import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ExecuteWorkspace } from "@/types/execute";

export function useExecuteWorkspace(id?: string) {
  const [workspace, setWorkspace] = useState<ExecuteWorkspace | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("execute_workspaces")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (active) {
        setWorkspace((data as unknown as ExecuteWorkspace) ?? null);
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id]);

  return { workspace, loading };
}

export function useExecuteWorkspaces() {
  const [items, setItems] = useState<ExecuteWorkspace[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("execute_workspaces")
        .select("*")
        .order("created_at", { ascending: false });
      if (active) {
        setItems((data as unknown as ExecuteWorkspace[]) ?? []);
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);
  return { items, loading };
}