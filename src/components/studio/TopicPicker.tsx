import { Star, X } from "lucide-react";
import type { Domain } from "@/hooks/useContentTaxonomy";
import { MAX_TOPICS_PER_POST, domainNumber, setPrimaryTopic, toggleTopic, type TopicFiling } from "@/lib/content";

type Props = {
  domains: Domain[];
  filing: TopicFiling;
  onChange: (f: TopicFiling) => void;
  /** Shown to publishers only: adds a topic under the given domain. */
  onAddTopic?: (domainCode: string) => void;
};

/** Files a post under one primary topic and any number of cross-listed topics, in any domain. */
export function TopicPicker({ domains, filing, onChange, onAddTopic }: Props) {
  const byId = new Map(domains.flatMap((d) => d.topics.map((t) => [t.id, { topic: t, domain: d }] as const)));
  const picked = filing.topicIds.map((id) => byId.get(id)).filter(Boolean) as { topic: Domain["topics"][number]; domain: Domain }[];
  const full = filing.topicIds.length >= MAX_TOPICS_PER_POST;

  return (
    <div className="space-y-3">
      {picked.length === 0 ? (
        <p className="text-xs text-muted-foreground border border-dashed border-border rounded-md p-3">Not filed yet. Pick the topic this belongs to; the first one becomes its home, and any others cross-list it.</p>
      ) : (
        <ul className="space-y-1">
          {picked.map(({ topic, domain }) => {
            const primary = filing.primaryId === topic.id;
            return (
              <li key={topic.id} className={`flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs ${primary ? "border-primary bg-primary/10" : "border-border"}`}>
                <span className="font-mono text-muted-foreground">{domainNumber(domain.number)}</span>
                <span className="flex-1 min-w-0 truncate"><span className="font-medium">{topic.name}</span><span className="text-muted-foreground"> · {domain.name}</span></span>
                {primary ? <span className="flex items-center gap-1 text-primary font-medium"><Star className="h-3 w-3 fill-current" />Home</span>
                  : <button type="button" className="text-primary hover:underline" onClick={() => onChange(setPrimaryTopic(filing, topic.id))}>Make home</button>}
                <button type="button" aria-label={`Remove ${topic.name}`} className="text-muted-foreground hover:text-foreground" onClick={() => onChange(toggleTopic(filing, topic.id))}><X className="h-3.5 w-3.5" /></button>
              </li>
            );
          })}
        </ul>
      )}
      <p className="text-[11px] text-muted-foreground">{filing.topicIds.length} of {MAX_TOPICS_PER_POST} topics. The home topic decides where the post lives; the rest list it there too.</p>
      <div className="rounded-md border border-border divide-y divide-border">
        {domains.map((d) => {
          const n = d.topics.filter((t) => filing.topicIds.includes(t.id)).length;
          return (
            <details key={d.code} open={n > 0}>
              <summary className="flex items-center gap-2 px-3 py-2 text-xs cursor-pointer select-none">
                <span className="font-mono text-primary">{domainNumber(d.number)}</span>
                <span className="font-medium flex-1">{d.name}</span>
                {n > 0 && <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[11px]">{n}</span>}
              </summary>
              <div className="flex flex-wrap gap-1 px-3 pb-3">
                {d.topics.map((t) => {
                  const on = filing.topicIds.includes(t.id);
                  return (
                    <button key={t.id} type="button" aria-pressed={on} disabled={!on && full} onClick={() => onChange(toggleTopic(filing, t.id))}
                      className={`text-[11px] rounded-full border px-2 py-0.5 disabled:opacity-40 ${on ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>{t.name}</button>
                  );
                })}
                {onAddTopic && <button type="button" className="text-[11px] text-primary px-2 py-0.5" onClick={() => onAddTopic(d.code)}>+ New topic</button>}
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
