import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { GovDocument } from "@/lib/governance";

export function usePublishedGovDoc(slug: string | undefined) {
  return useQuery({
    queryKey: ["gov-doc", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase.from("site_governance_documents")
        .select("*").eq("slug", slug!).eq("status", "published").maybeSingle();
      if (error) throw error;
      return (data as unknown as GovDocument) ?? null;
    },
  });
}
