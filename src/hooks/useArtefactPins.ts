import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useArtefactPins() {
  const { user } = useAuth();
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPins = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from("artefact_pins")
      .select("artefact_id, pin_type")
      .eq("user_id", user.id);

    if (data) {
      setPinnedIds(new Set(data.filter(p => p.pin_type === "pin").map(p => p.artefact_id)));
      setRecentIds(data.filter(p => p.pin_type === "recent").map(p => p.artefact_id));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchPins(); }, [fetchPins]);

  const togglePin = useCallback(async (artefactId: string) => {
    if (!user) return;
    const isPinned = pinnedIds.has(artefactId);
    if (isPinned) {
      await supabase.from("artefact_pins").delete()
        .eq("user_id", user.id).eq("artefact_id", artefactId).eq("pin_type", "pin");
      setPinnedIds(prev => { const n = new Set(prev); n.delete(artefactId); return n; });
    } else {
      await supabase.from("artefact_pins").upsert({
        user_id: user.id, artefact_id: artefactId, pin_type: "pin"
      }, { onConflict: "user_id,artefact_id,pin_type" });
      setPinnedIds(prev => new Set(prev).add(artefactId));
    }
  }, [user, pinnedIds]);

  const trackRecent = useCallback(async (artefactId: string) => {
    if (!user) return;
    await supabase.from("artefact_pins").upsert({
      user_id: user.id, artefact_id: artefactId, pin_type: "recent", created_at: new Date().toISOString()
    }, { onConflict: "user_id,artefact_id,pin_type" });
    setRecentIds(prev => [artefactId, ...prev.filter(id => id !== artefactId)].slice(0, 10));
  }, [user]);

  return { pinnedIds, recentIds, togglePin, trackRecent, loading };
}
