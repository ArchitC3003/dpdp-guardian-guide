import { useState, useRef, useEffect } from "react";
import {
  Bot,
  SendHorizonal,
  Sparkles,
  Shield,
  Scale,
  Copy,
  Download,
  Save,
  RefreshCw,
  FileText,
  AlertOctagon,
  Lock,
  Users,
  Key,
  Bell,
  PlusCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ChatMessage, FRAMEWORKS } from "./types";
import { toast } from "sonner";

interface Props {
  messages: ChatMessage[];
  isTyping: boolean;
  onSend: (text: string) => void;
  onClear: () => void;
  activeFrameworks: string[];
  aiMode?: "live" | "demo";
}

const QUICK_STARTERS = [
  { icon: FileText, text: "Draft an Information Security Policy — NIST CSF 2.0 + ISO 27001" },
  { icon: AlertOctagon, text: "Create Incident Response SOP — NIST SP 800-61 workflow" },
  { icon: Lock, text: "Generate Data Privacy Policy — DPDP Act 2023 + GDPR" },
  { icon: Users, text: "Build Vendor Risk Management Policy — Third-party due diligence" },
  { icon: Key, text: "Draft Access Control Policy — RBAC + Zero Trust principles" },
  { icon: Bell, text: "Data Breach Notification SOP — Regulatory timelines + obligations" },
];

/* ── Render control refs as teal badges ── */
function processInlineContent(html: string): string {
  // Bold
  let out = html.replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground">$1</strong>');
  // Control refs → badges
  out = out.replace(
    /\[([A-Z][^\]]+)\]/g,
    '<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono bg-primary/15 text-primary border border-primary/20 mx-0.5 whitespace-nowrap">$1</span>'
  );
  return out;
}

function renderMarkdown(content: string) {
  const lines = content.split("\n");
  return lines.map((line, i) => {
    // Section headings with teal left border
    if (line.startsWith("# "))
      return <h2 key={i} className="text-base font-bold text-foreground mt-5 mb-2 pl-3 border-l-2 border-primary">{line.slice(2)}</h2>;
    if (line.startsWith("## "))
      return <h3 key={i} className="text-sm font-bold text-foreground mt-4 mb-1.5 pl-3 border-l-2 border-primary/60">{line.slice(3)}</h3>;
    if (line.startsWith("### "))
      return (
        <h4 key={i} className="text-xs font-bold text-foreground mt-3 mb-1 pl-3 border-l-2 border-primary/40 flex items-center gap-1.5">
          <FileText className="h-3 w-3 text-primary/60 shrink-0" />
          {line.slice(4)}
        </h4>
      );
    if (line.startsWith("---")) return <Separator key={i} className="my-3" />;
    if (line.trim() === "") return <div key={i} className="h-1.5" />;

    // Tables
    if (line.startsWith("|")) {
      if (line.replace(/[|\-\s]/g, "") === "") return null;
      const cells = line.split("|").filter(Boolean).map((c) => c.trim());
      const nextLine = lines[i + 1] || "";
      const isHeader = nextLine.replace(/[|\-\s]/g, "") === "";
      return (
        <div
          key={i}
          className={cn(
            "grid gap-2 text-[11px] px-2 py-1 rounded",
            isHeader ? "font-bold text-foreground bg-muted/10" : "text-foreground/80"
          )}
          style={{ gridTemplateColumns: `repeat(${Math.min(cells.length, 6)}, minmax(0, 1fr))` }}
        >
          {cells.map((cell, ci) => (
            <span key={ci} dangerouslySetInnerHTML={{ __html: processInlineContent(cell) }} />
          ))}
        </div>
      );
    }

    const processed = processInlineContent(line);

    // Sub-clauses
    if (line.match(/^\s*[a-f]\)/)) {
      return <p key={i} className="text-xs text-foreground/80 pl-6 py-0.5" dangerouslySetInnerHTML={{ __html: "• " + processed.replace(/^\s*[a-f]\)\s*/, "") }} />;
    }
    if (line.match(/^\s*-\s/)) {
      return <p key={i} className="text-xs text-foreground/80 pl-5 py-0.5" dangerouslySetInnerHTML={{ __html: "• " + processed.replace(/^\s*-\s/, "") }} />;
    }

    return <p key={i} className="text-xs text-foreground/80 py-0.5 leading-relaxed" dangerouslySetInnerHTML={{ __html: processed }} />;
  });
}

function MessageToolbar({ content }: { content: string }) {
  const actions = [
    { icon: Copy, label: "Copy", action: () => { navigator.clipboard.writeText(content); toast.success("Copied"); } },
    { icon: Download, label: "DOCX", action: () => toast.info("DOCX export coming soon") },
    { icon: Download, label: "PDF", action: () => toast.info("PDF export coming soon") },
    { icon: Save, label: "Save", action: () => toast.info("Save to repository coming soon") },
    { icon: RefreshCw, label: "Regenerate", action: () => toast.info("Regenerate coming soon") },
  ];
  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 mt-3 pt-2 border-t border-border/50">
        {actions.map((btn) => (
          <Tooltip key={btn.label}>
            <TooltipTrigger asChild>
              <button
                onClick={btn.action}
                className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors"
              >
                <btn.icon className="h-3 w-3" />
                {btn.label}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[10px]">{btn.label}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}

export default function FullWidthChat({ messages, isTyping, onSend, onClear, activeFrameworks, aiMode = "live" }: Props) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const MAX_CHARS = 2000;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;
    onSend(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const hasConversation = messages.length > 0;
  const activeFrameworkLabels = activeFrameworks
    .map((f) => FRAMEWORKS.find((fw) => fw.value === f)?.label)
    .filter(Boolean);

  return (
    <section className="space-y-3">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
        AI Chat Workspace
      </p>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Top bar */}
        <div className="px-6 py-3 border-b border-border flex items-center justify-between bg-card">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-foreground">Policy & SOP Architect</h2>
                {aiMode === "live" ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live AI
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-amber-500/15 text-amber-400 border border-amber-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Demo Mode
                  </span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">Powered by NIST Repository & Global Compliance Frameworks</p>
            </div>
          </div>
          {hasConversation && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 gap-1.5"
              onClick={onClear}
            >
              <PlusCircle className="h-3.5 w-3.5" />
              New Chat
            </Button>
          )}
        </div>

        {/* Scrollable Chat Area */}
        <div ref={scrollRef} className="max-h-[600px] overflow-y-auto">
          <div className="p-6 space-y-4">
            {!hasConversation && (
              <>
                {/* Welcome Card */}
                <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 to-accent/10 p-6 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <h2 className="text-sm font-bold text-foreground">Enterprise Policy & SOP Intelligence Engine</h2>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
                    Generate board-ready, audit-proof compliance documents aligned to NIST, ISO 27001, DPDP Act and global frameworks. Trusted by Fortune 100 GRC teams and top-tier law firms.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { icon: Shield, label: "Multi-Framework Aligned" },
                      { icon: Scale, label: "Audit-Ready Output" },
                      { icon: Bot, label: "Legal-Grade Drafting" },
                    ].map((badge) => (
                      <Badge key={badge.label} variant="outline" className="text-[10px] border-primary/30 text-primary gap-1">
                        <badge.icon className="h-3 w-3" />
                        {badge.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Quick Starters */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-3">Quick Prompt Starters</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {QUICK_STARTERS.map((prompt) => (
                      <button
                        key={prompt.text}
                        onClick={() => onSend(prompt.text)}
                        className="flex items-start gap-2.5 text-left px-4 py-3 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 text-xs text-foreground/80 transition-all leading-relaxed"
                      >
                        <prompt.icon className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{prompt.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Messages */}
            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[85%] rounded-xl", msg.role === "user"
                  ? "bg-primary text-primary-foreground px-5 py-3 rounded-br-sm"
                  : "bg-background border border-border px-5 py-4 rounded-bl-sm"
                )}>
                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="text-[9px] bg-primary/20 text-primary border-0 px-1.5 py-0">AI</Badge>
                      <span className="text-[10px] font-semibold text-foreground">Policy & SOP Architect</span>
                      <span className="text-[9px] text-muted-foreground">
                        {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  )}
                  {msg.role === "user" ? (
                    <p className="text-xs whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div>{renderMarkdown(msg.content)}</div>
                  )}
                  {msg.role === "assistant" && <MessageToolbar content={msg.content} />}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-background border border-border rounded-xl px-5 py-4 rounded-bl-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="text-[9px] bg-primary/20 text-primary border-0 px-1.5 py-0">AI</Badge>
                    <span className="text-[10px] font-semibold text-foreground">Policy & SOP Architect</span>
                  </div>
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-border bg-card">
          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="relative">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value.slice(0, MAX_CHARS))}
                onKeyDown={handleKeyDown}
                placeholder="Describe your organization, industry, specific requirements, or ask to refine a specific clause..."
                className="min-h-[72px] resize-none pr-14 text-xs"
                disabled={isTyping}
                rows={3}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isTyping}
                className="absolute bottom-2 right-2 h-9 w-9 bg-primary hover:bg-primary/90"
              >
                <SendHorizonal className="h-4 w-4" />
              </Button>
            </div>
            {activeFrameworkLabels.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[9px] text-muted-foreground">Active frameworks:</span>
                {activeFrameworkLabels.map((fw) => (
                  <Badge key={fw} variant="outline" className="text-[9px] px-1.5 py-0 border-primary/20 text-primary">
                    {fw}
                  </Badge>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-[9px] text-muted-foreground">
                  AI responses reference NIST, ISO, DPDP Act, GDPR source controls. Always review with qualified legal counsel.
                </p>
                <Badge variant="outline" className="text-[8px] px-1.5 py-0 border-primary/20 text-muted-foreground gap-1 shrink-0">
                  <Sparkles className="h-2.5 w-2.5 text-primary" />
                  Powered by Gemini 1.5
                </Badge>
              </div>
              <span className="text-[9px] text-muted-foreground tabular-nums">{input.length}/{MAX_CHARS}</span>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
