import ReactMarkdown from "react-markdown";
import { slugify, FONT_DISPLAY } from "@/lib/content";

const text = (c: any): string => (Array.isArray(c) ? c.map(text).join("") : typeof c === "string" ? c : c?.props ? text(c.props.children) : "");

export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      components={{
        h2: ({ children }) => <h2 id={slugify(text(children))} className="text-3xl font-semibold mt-12 mb-4 scroll-mt-24" style={{ fontFamily: FONT_DISPLAY }}>{children}</h2>,
        h3: ({ children }) => <h3 id={slugify(text(children))} className="text-xl font-semibold mt-8 mb-3 scroll-mt-24">{children}</h3>,
        p: ({ children }) => <p className="leading-8 text-foreground/85 my-4">{children}</p>,
        ul: ({ children }) => <ul className="list-disc pl-6 my-4 space-y-2 text-foreground/85">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-6 my-4 space-y-2 text-foreground/85">{children}</ol>,
        a: ({ href, children }) => <a href={href} className="text-primary underline underline-offset-4" rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}>{children}</a>,
        blockquote: ({ children }) => <blockquote className="border-l-4 border-primary bg-primary/5 px-5 py-2 my-6 rounded-r">{children}</blockquote>,
        code: ({ children }) => <code className="font-mono text-sm bg-muted px-1.5 py-0.5 rounded">{children}</code>,
        img: ({ src, alt }) => <img src={src} alt={alt || ""} loading="lazy" className="rounded-lg my-6 w-full" />,
        table: ({ children }) => <div className="overflow-x-auto my-6"><table className="w-full text-sm border border-border">{children}</table></div>,
        th: ({ children }) => <th className="border border-border px-3 py-2 text-left bg-muted">{children}</th>,
        td: ({ children }) => <td className="border border-border px-3 py-2">{children}</td>,
      }}
    >{children}</ReactMarkdown>
  );
}
