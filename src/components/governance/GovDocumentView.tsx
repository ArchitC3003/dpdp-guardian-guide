import ReactMarkdown from "react-markdown";
import { AlertTriangle, Info } from "lucide-react";
import type { GovSection } from "@/lib/governance";

type Props = { title: string; version: string; effectiveDate: string | null; intro?: string | null; sections: GovSection[]; draft?: boolean };

function fmtDate(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
}

const md = "prose prose-sm md:prose-base max-w-none dark:prose-invert prose-p:text-muted-foreground prose-li:text-muted-foreground prose-a:text-primary";

export function GovDocumentView({ title, version, effectiveDate, intro, sections, draft }: Props) {
  return (
    <article className="max-w-3xl mx-auto space-y-8">
      <header>
        {draft && <p className="mb-2 inline-block rounded border border-border px-2 py-0.5 text-xs text-muted-foreground">Draft preview — not visible to the public</p>}
        <h1 className="text-3xl font-bold text-primary">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Version {version}{fmtDate(effectiveDate) ? ` · Effective ${fmtDate(effectiveDate)}` : ""}
        </p>
        {intro && <div className={`${md} mt-4`}><ReactMarkdown>{intro}</ReactMarkdown></div>}
      </header>
      {sections.length > 1 && (
        <nav aria-label="Contents" className="rounded-lg border border-border p-4">
          <p className="text-sm font-semibold mb-2">Contents</p>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            {sections.map((s) => <li key={s.id}><a href={`#s-${s.id}`} className="text-primary hover:underline">{s.heading}</a></li>)}
          </ol>
        </nav>
      )}
      {sections.map((s, i) => (
        <section key={s.id} id={`s-${s.id}`} className="space-y-3 scroll-mt-20">
          <h2 className="text-xl font-semibold">{i + 1}. {s.heading}</h2>
          <SectionBody s={s} />
        </section>
      ))}
    </article>
  );
}

function Note({ text }: { text?: string }) {
  return text ? <p className="text-sm text-muted-foreground">{text}</p> : null;
}

function SectionBody({ s }: { s: GovSection }) {
  switch (s.type) {
    case "markdown":
      return <div className={md}><ReactMarkdown>{s.body}</ReactMarkdown></div>;
    case "list":
      return (<><Note text={s.note} /><ul className="list-disc pl-5 space-y-1 text-muted-foreground">{s.items.filter((x) => x.trim()).map((x, i) => <li key={i}>{x}</li>)}</ul></>);
    case "key_value":
      return (<><Note text={s.note} /><dl className="grid sm:grid-cols-[minmax(0,12rem)_1fr] gap-x-4 gap-y-2 rounded-lg border border-border p-4">
        {s.fields.filter((f) => f.label.trim() || f.value.trim()).map((f, i) => (
          <div key={i} className="contents"><dt className="text-sm font-medium">{f.label}</dt><dd className="text-sm text-muted-foreground break-words">{f.value}</dd></div>
        ))}</dl></>);
    case "table":
      return (<><Note text={s.note} /><div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm"><thead className="bg-muted/50"><tr>{s.columns.map((c, i) => <th key={i} className="text-left font-medium p-2">{c}</th>)}</tr></thead>
          <tbody>{s.rows.map((r, ri) => <tr key={ri} className="border-t border-border">{s.columns.map((_, ci) => <td key={ci} className="p-2 text-muted-foreground align-top">{r[ci] ?? ""}</td>)}</tr>)}</tbody>
        </table></div></>);
    case "callout": {
      const Icon = s.tone === "warning" ? AlertTriangle : Info;
      return (<div className={`flex gap-3 rounded-lg border p-4 ${s.tone === "warning" ? "border-destructive/40 bg-destructive/5" : "border-primary/40 bg-primary/5"}`}>
        <Icon className={`h-5 w-5 shrink-0 ${s.tone === "warning" ? "text-destructive" : "text-primary"}`} />
        <div className={md}><ReactMarkdown>{s.body}</ReactMarkdown></div></div>);
    }
  }
}
