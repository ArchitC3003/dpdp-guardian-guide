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

export type Artefact = { code: string; label: string; kind: string; description: string | null; builder_type: string | null };
/** Artefacts readers can build. `available` is false when the table is not in the database yet. */
export function useArtefacts() {
  const [artefacts, setArtefacts] = useState<Artefact[]>([]);
  const [available, setAvailable] = useState(false);
  const reload = useCallback(async () => {
    const { data, error } = await db.from("content_artefacts").select("code,label,kind,description,builder_type").eq("is_active", true).order("display_order").order("label");
    if (error) { setAvailable(false); return; }
    setArtefacts(data || []); setAvailable(true);
  }, []);
  useEffect(() => { reload(); }, [reload]);
  const add = useCallback(async (row: { code: string; label: string; kind: string; description?: string }) => {
    const { error } = await db.from("content_artefacts").insert(row);
    if (!error) await reload();
    return error?.message as string | undefined;
  }, [reload]);
  return { artefacts, available, reload, add };
}

const POST_COLUMNS = "id,slug,title,excerpt,content_type,category,tags,frameworks,cover_image_url,published_at,scheduled_for,status,reading_minutes,featured";
/** Published and scheduled Learn posts for the public hub. "artefacts" is a newer column, so the query falls back if the database lacks it. */
export async function loadLivePosts(tag?: string) {
  const run = async (cols: string) => {
    let query = db.from("content_posts").select(cols).in("status", ["published", "scheduled"]).neq("content_type", "landing").order("updated_at", { ascending: false }).limit(200);
    if (tag) query = query.contains("tags", [tag]);
    return query;
  };
  let res = await run(`${POST_COLUMNS},artefacts`);
  if (res.error) res = await run(POST_COLUMNS);
  return (res.data || []) as Record<string, unknown>[];
}
