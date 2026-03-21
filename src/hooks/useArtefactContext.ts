import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ArtefactFileExtended } from "@/components/artefacts/ArtefactCard";

export type { ArtefactFileExtended as ArtefactFile };

export interface ArtefactFilters {
  search?: string;
  folder?: string;
  framework?: string;
  tags?: string[];
  dateRange?: { from?: Date; to?: Date };
  sort?: "name" | "date" | "size";
  sortDir?: "asc" | "desc";
}

function fuzzyMatch(query: string, target: string): number {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  if (t.includes(q) || q.includes(t)) return 1;
  const qWords = q.split(/[\s\-_.,/]+/).filter(Boolean);
  const tWords = t.split(/[\s\-_.,/]+/).filter(Boolean);
  let matches = 0;
  for (const qw of qWords) {
    if (qw.length < 3) continue;
    for (const tw of tWords) {
      if (tw.includes(qw) || qw.includes(tw)) { matches++; break; }
    }
  }
  return qWords.length > 0 ? matches / qWords.length : 0;
}

export function useArtefactContext() {
  const [artefactFiles, setArtefactFiles] = useState<ArtefactFileExtended[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [filters, setFilters] = useState<ArtefactFilters>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});

  const fetchArtefacts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("artefact_files")
      .select("*")
      .order("uploaded_at", { ascending: false });

    if (!error && data) {
      setArtefactFiles(data as ArtefactFileExtended[]);
      setLastUpdated(new Date());
      // Fetch comment counts
      const ids = data.map(d => d.id);
      if (ids.length > 0) {
        const { data: commentData } = await supabase
          .from("artefact_comments")
          .select("artefact_id");
        if (commentData) {
          const counts: Record<string, number> = {};
          for (const c of commentData) {
            counts[c.artefact_id] = (counts[c.artefact_id] || 0) + 1;
          }
          setCommentCounts(counts);
        }
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchArtefacts();
    const channel = supabase
      .channel("artefact-files-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "artefact_files" }, () => fetchArtefacts())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchArtefacts]);

  const filteredFiles = useMemo(() => {
    let result = artefactFiles;

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(f =>
        f.file_name.toLowerCase().includes(q) ||
        (f.description || "").toLowerCase().includes(q) ||
        (f.tags || []).some(t => t.toLowerCase().includes(q)) ||
        (f.framework || "").toLowerCase().includes(q)
      );
    }
    if (filters.folder) result = result.filter(f => f.folder === filters.folder);
    if (filters.framework) result = result.filter(f => f.framework === filters.framework);
    if (filters.tags && filters.tags.length > 0) {
      result = result.filter(f => filters.tags!.some(t => (f.tags || []).includes(t)));
    }

    const sort = filters.sort || "date";
    const dir = filters.sortDir || "desc";
    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sort === "name") cmp = a.file_name.localeCompare(b.file_name);
      else if (sort === "size") cmp = (a.file_size || 0) - (b.file_size || 0);
      else cmp = new Date(a.uploaded_at).getTime() - new Date(b.uploaded_at).getTime();
      return dir === "desc" ? -cmp : cmp;
    });

    return result;
  }, [artefactFiles, filters]);

  const artefactCount = artefactFiles.length;

  const artefactsByFolder = useMemo(() => {
    const grouped: Record<string, ArtefactFileExtended[]> = {};
    for (const f of artefactFiles) {
      if (!grouped[f.folder]) grouped[f.folder] = [];
      grouped[f.folder].push(f);
    }
    return grouped;
  }, [artefactFiles]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const f of artefactFiles) (f.tags || []).forEach(t => tagSet.add(t));
    return Array.from(tagSet).sort();
  }, [artefactFiles]);

  const allFrameworks = useMemo(() => {
    const set = new Set<string>();
    for (const f of artefactFiles) if (f.framework) set.add(f.framework);
    return Array.from(set).sort();
  }, [artefactFiles]);

  const getRelevantArtefacts = useCallback(
    (requirementText: string): { file: ArtefactFileExtended; score: number; matchLevel: "green" | "amber" | "grey" }[] => {
      if (!requirementText || artefactFiles.length === 0) return [];
      const results: { file: ArtefactFileExtended; score: number; matchLevel: "green" | "amber" | "grey" }[] = [];
      for (const file of artefactFiles) {
        const nameScore = fuzzyMatch(requirementText, file.file_name);
        const descScore = file.description ? fuzzyMatch(requirementText, file.description) : 0;
        const score = Math.max(nameScore, descScore);
        if (score >= 0.3) {
          results.push({ file, score, matchLevel: score >= 0.7 ? "green" : "amber" });
        }
      }
      return results.sort((a, b) => b.score - a.score).slice(0, 5);
    },
    [artefactFiles]
  );

  const getDownloadUrl = useCallback((filePath: string) => {
    const { data } = supabase.storage.from("artefact-files").getPublicUrl(filePath);
    return data?.publicUrl || "";
  }, []);

  return {
    artefactFiles,
    filteredFiles,
    artefactCount,
    artefactsByFolder,
    allTags,
    allFrameworks,
    commentCounts,
    lastUpdated,
    loading,
    filters,
    setFilters,
    getRelevantArtefacts,
    getDownloadUrl,
    refresh: fetchArtefacts,
  };
}
