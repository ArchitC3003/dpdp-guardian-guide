import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Topic = { id: string; domain_code: string; slug: string; name: string; display_order: number };
export type Domain = { code: string; number: number; name: string; topics: Topic[] };

// These tables are newer than the generated database types, so they are queried untyped.
const db = supabase as any;

/** Loads the Learn repository structure (domains with their topics). `available` is false when the tables are not in the database yet. */
export function useContentTaxonomy() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [available, setAvailable] = useState(true);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const [d, t] = await Promise.all([
      db.from("content_domains").select("code,number,name").eq("is_active", true).order("number"),
      db.from("content_topics").select("id,domain_code,slug,name,display_order").eq("is_active", true).order("display_order").order("name"),
    ]);
    if (d.error || t.error) { setAvailable(false); setLoading(false); return; }
    const topics = (t.data || []) as Topic[];
    setDomains((d.data || []).map((x: any) => ({ ...x, topics: topics.filter((y) => y.domain_code === x.code) })));
    setAvailable(true); setLoading(false);
  }, []);
  useEffect(() => { reload(); }, [reload]);

  const addTopic = useCallback(async (domainCode: string, name: string, slug: string) => {
    const { data, error } = await db.from("content_topics").insert({ domain_code: domainCode, name, slug }).select("id").single();
    if (!error) await reload();
    return { id: data?.id as string | undefined, error: error?.message as string | undefined };
  }, [reload]);

  return { domains, available, loading, reload, addTopic };
}

/** Topic filings for one post, primary first. */
export async function loadPostFiling(postId: string) {
  const { data, error } = await db.from("content_post_topics").select("topic_id,is_primary").eq("post_id", postId);
  if (error) return null;
  const rows = (data || []) as { topic_id: string; is_primary: boolean }[];
  return { topicIds: rows.map((r) => r.topic_id), primaryId: rows.find((r) => r.is_primary)?.topic_id ?? null };
}

/** Every filing row, for the studio list. */
export async function loadAllFilings() {
  const { data, error } = await db.from("content_post_topics").select("post_id,topic_id,is_primary").limit(5000);
  return error ? null : ((data || []) as { post_id: string; topic_id: string; is_primary: boolean }[]);
}
