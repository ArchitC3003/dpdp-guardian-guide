import { ReactNode } from "react";
import { Helmet } from "react-helmet-async";
import { usePublishedGovDoc } from "@/hooks/usePublishedGovDoc";
import { GovDocumentView } from "./GovDocumentView";
import { publicPath } from "@/lib/governance";

/** Shows the published version of a document; falls back to `fallback` when none is published yet. */
export function PublishedPolicy({ slug, fallback }: { slug: string; fallback: ReactNode }) {
  const { data, isLoading } = usePublishedGovDoc(slug);
  if (isLoading) return <div className="min-h-screen bg-background" />;
  if (!data) return <>{fallback}</>;
  const url = `https://privcybhub.com${publicPath(slug)}`;
  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-12">
      <Helmet>
        <title>{`${data.title} — PrivcybHub`}</title>
        <link rel="canonical" href={url} />
        <meta property="og:title" content={`${data.title} — PrivcybHub`} />
        <meta property="og:url" content={url} />
      </Helmet>
      <GovDocumentView title={data.title} version={data.version} effectiveDate={data.effective_date} intro={data.intro} sections={data.sections} />
      <p className="max-w-3xl mx-auto mt-12 text-sm text-muted-foreground"><a href="/" className="text-primary hover:underline">← Back to PrivcybHub</a></p>
    </div>
  );
}
