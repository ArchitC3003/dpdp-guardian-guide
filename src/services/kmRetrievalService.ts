import { supabase } from "@/integrations/supabase/client";
import { REGULATORY_SOURCE_MAP, type RegulatorySourceEntry } from "@/data/regulatorySourceMap";
import { normaliseIndustry } from "@/utils/industryNormaliser";

export interface KMContext {
  artefacts: KMArtefact[];
  regulatorySources: RegulatorySource[];
  subSectorInsights: string;
  sensitiveDataFlags: string[];
  personalDataTypes: string[];
  processingActivities: string[];
  frameworksCovered: string[];
  mandatoryCompliances: string[];
  recommendedFrameworks: string[];
  knowledgeSnapshotDate: string;
  queryId: string;
}

export interface KMArtefact {
  id: string;
  title: string;
  content: string;
  docType: string;
  sourceAuthority: string;
  sourceUrl: string;
  version: string;
  similarity: number;
}

export interface RegulatorySource {
  framework: string;
  authority: string;
  sourceUrl: string;
  description: string;
  jurisdiction: string;
}

/** Instant sync filter over static regulatory source map */
export function getRegulatorySources(
  industries: string[],
  jurisdictions?: string[]
): RegulatorySource[] {
  const seen = new Set<string>();
  return REGULATORY_SOURCE_MAP.filter((src) => {
    const industryMatch =
      src.industryVertical === "All" ||
      industries.some(
        (ind) =>
          ind === src.industryVertical ||
          src.industryVertical.toLowerCase().includes(ind.toLowerCase()) ||
          ind.toLowerCase().includes(src.industryVertical.toLowerCase())
      );
    const jurisdictionMatch = !jurisdictions || jurisdictions.length === 0 ||
      jurisdictions.some((j) => src.jurisdiction.toLowerCase().includes(j.toLowerCase()));
    return industryMatch && jurisdictionMatch;
  })
    .filter((src) => {
      const key = `${src.framework}|${src.authority}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((src) => ({
      framework: src.framework,
      authority: src.authority,
      sourceUrl: src.sourceUrl,
      description: src.description,
      jurisdiction: src.jurisdiction,
    }));
}

/** Search KM artefacts via edge function */
export async function searchKMArtefacts(
  queryText: string,
  industries: string[],
  maxResults: number = 5
): Promise<KMArtefact[]> {
  try {
    const { data, error } = await supabase.functions.invoke("km-search", {
      body: { queryText, industries, maxResults },
    });
    if (error || !data?.artefacts) return [];
    return data.artefacts;
  } catch {
    return [];
  }
}

/** Full KM context retrieval — orchestrator */
export async function getKMContext(
  industries: string[],
  subSector: string,
  contextType: "data-mapping" | "policy-gen" | "dpia" | "chatbot"
): Promise<KMContext> {
  const queryId = crypto.randomUUID();

  // 1. Instant regulatory sources
  const regulatorySources = getRegulatorySources(industries);

  // 2. Search artefact index
  const semanticQuery = `${industries.join(", ")} ${subSector} personal data types processing activities privacy compliance ${contextType}`;
  const artefacts = await searchKMArtefacts(semanticQuery, industries);

  // 3. AI enrichment
  let aiData: any = {};
  try {
    const { data, error } = await supabase.functions.invoke("km-ai-enrichment", {
      body: {
        industries,
        subSector,
        contextType,
        regulatorySources: regulatorySources.slice(0, 8),
        artefactSnippets: artefacts
          .slice(0, 5)
          .map((a) => ({ title: a.title, content: a.content.substring(0, 400) })),
      },
    });
    if (!error && data) aiData = data;
  } catch {
    // Graceful fallback — AI enrichment failed, continue with static data
  }

  // 4. Log query (fire and forget)
  supabase
    .from("km_query_log" as any)
    .insert({
      query_type: contextType,
      industries,
      sub_sector: subSector,
      artefacts_used: artefacts.map((a) => a.id),
      sources_used: regulatorySources.map((s) => s.authority),
      generated_output_preview: (aiData?.subSectorInsights || "").substring(0, 200),
    })
    .then(() => {});

  return {
    artefacts,
    regulatorySources,
    subSectorInsights: aiData?.subSectorInsights || "",
    sensitiveDataFlags: aiData?.sensitiveDataFlags || [],
    personalDataTypes: aiData?.personalDataTypes || [],
    processingActivities: aiData?.processingActivities || [],
    frameworksCovered: [...new Set(regulatorySources.map((s) => s.framework))],
    mandatoryCompliances: aiData?.mandatoryCompliances || [],
    recommendedFrameworks: aiData?.recommendedFrameworks || [],
    knowledgeSnapshotDate: new Date().toISOString().split("T")[0],
    queryId,
  };
}
