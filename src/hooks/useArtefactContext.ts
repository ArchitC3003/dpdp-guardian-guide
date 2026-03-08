import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ArtefactFile {
  id: string;
  file_name: string;
  file_path: string;
  folder: string;
  description: string | null;
  uploaded_at: string;
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
      if (tw.includes(qw) || qw.includes(tw)) {
        matches++;
        break;
      }
    }
  }
  return qWords.length > 0 ? matches / qWords.length : 0;
}

export function useArtefactContext() {
  const [artefactFiles, setArtefactFiles] = useState<ArtefactFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchArtefacts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("artefact_files")
      .select("*")
      .order("uploaded_at", { ascending: false });

    if (!error && data) {
      setArtefactFiles(data);
      setLastUpdated(new Date());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchArtefacts();

    const channel = supabase
      .channel("artefact-files-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "artefact_files" },
        () => {
          fetchArtefacts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchArtefacts]);

  const artefactCount = artefactFiles.length;

  const artefactsByFolder = useMemo(() => {
    const grouped: Record<string, ArtefactFile[]> = {};
    for (const f of artefactFiles) {
      if (!grouped[f.folder]) grouped[f.folder] = [];
      grouped[f.folder].push(f);
    }
    return grouped;
  }, [artefactFiles]);

  const getRelevantArtefacts = useCallback(
    (requirementText: string): { file: ArtefactFile; score: number; matchLevel: "green" | "amber" | "grey" }[] => {
      if (!requirementText || artefactFiles.length === 0) return [];

      const results: { file: ArtefactFile; score: number; matchLevel: "green" | "amber" | "grey" }[] = [];

      for (const file of artefactFiles) {
        const nameScore = fuzzyMatch(requirementText, file.file_name);
        const descScore = file.description ? fuzzyMatch(requirementText, file.description) : 0;
        const score = Math.max(nameScore, descScore);

        if (score >= 0.3) {
          results.push({
            file,
            score,
            matchLevel: score >= 0.7 ? "green" : "amber",
          });
        }
      }

      return results.sort((a, b) => b.score - a.score).slice(0, 5);
    },
    [artefactFiles]
  );

  const getDownloadUrl = useCallback((filePath: string) => {
    const { data } = supabase.storage
      .from("artefact-files")
      .getPublicUrl(filePath);
    return data?.publicUrl || "";
  }, []);

  return {
    artefactFiles,
    artefactCount,
    artefactsByFolder,
    lastUpdated,
    loading,
    getRelevantArtefacts,
    getDownloadUrl,
    refresh: fetchArtefacts,
  };
}
