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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ChatMessage, QUICK_PROMPTS } from "./types";
import { toast } from "sonner";
import { exportToDOCX, exportToPDF, ExportDocument } from "@/utils/exportUtils";

interface Props {
  messages: ChatMessage[];
  isTyping: boolean;
  onSend: (text: string) => void;
}

function renderMarkdown(content: string) {
  const lines = content.split("\n");
  return lines.map((line, i) => {
    // Headings
    if (line.startsWith("# ")) return <h2 key={i} className="text-lg font-bold text-foreground mt-4 mb-2">{line.slice(2)}</h2>;
    if (line.startsWith("## ")) return <h3 key={i} className="text-sm font-bold text-foreground mt-3 mb-1.5">{line.slice(3)}</h3>;
    if (line.startsWith("### ")) return <h4 key={i} className="text-xs font-bold text-foreground mt-2 mb-1">{line.slice(4)}</h4>;
    if (line.startsWith("---")) return <Separator key={i} className="my-2" />;
    if (line.trim() === "") return <div key={i} className="h-1.5" />;

    // Table rows
    if (line.startsWith("|")) {
      if (line.replace(/[|\-\s]/g, "") === "") return null; // separator row
      const cells = line.split("|").filter(Boolean).map((c) => c.trim());
      const isHeader = lines[i + 1]?.replace(/[|\-\s]/g, "") === "";
      return (
        <div key={i} className={cn("grid gap-2 text-[10px] px-1 py-0.5", `grid-cols-${Math.min(cells.length, 6)}`)}>
          {cells.map((cell, ci) => (
            <span key={ci} className={cn(isHeader ? "font-bold text-foreground" : "text-foreground/80")}>
              {cell}
            </span>
          ))}
        </div>
      );
    }

    // Bold + control references
    let processed = line.replace(
      /\*\*(.+?)\*\*/g,
      '<strong class="text-foreground">$1</strong>'
    );
    processed = processed.replace(
      /\[([A-Z][^\]]+)\]/g,
      '<span class="text-primary text-[10px] font-mono">[$1]</span>'
    );

    // List items
    if (line.match(/^\s*[a-d]\)/)) {
      return <p key={i} className="text-xs text-foreground/80 pl-4 py-0.5" dangerouslySetInnerHTML={{ __html: processed }} />;
    }
    if (line.match(/^\s*-\s/)) {
      return <p key={i} className="text-xs text-foreground/80 pl-3 py-0.5" dangerouslySetInnerHTML={{ __html: "• " + processed.replace(/^\s*-\s/, "") }} />;
    }

    return <p key={i} className="text-xs text-foreground/80 py-0.5" dangerouslySetInnerHTML={{ __html: processed }} />;
  });
}

function MessageToolbar({ content }: { content: string }) {
  const handleExport = async (fmt: "docx" | "pdf") => {
    const exportDoc: ExportDocument = {
      title: "Policy Document",
      documentRef: "POL-GEN-001",
      version: "1.0",
      status: "Draft",
      classification: "Confidential",
      effectiveDate: new Date().toISOString().split("T")[0],
      reviewDate: new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0],
      selectedFrameworks: [],
      industryVertical: "General",
      orgSize: "enterprise",
      content,
    };
    try {
      toast.success(`Downloading ${fmt.toUpperCase()}...`);
      if (fmt === "docx") await exportToDOCX(exportDoc);
      else await exportToPDF(exportDoc);
    } catch {
      toast.error(`${fmt.toUpperCase()} export failed`);
    }
  };

  return (
    <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/50">
      {[
        { icon: Copy, label: "Copy", action: () => { navigator.clipboard.writeText(content); toast.success("Copied to clipboard"); } },
        { icon: Download, label: "DOCX", action: () => handleExport("docx") },
        { icon: Download, label: "PDF", action: () => handleExport("pdf") },
        { icon: Save, label: "Save", action: () => toast.info("Save to repository coming soon") },
        { icon: RefreshCw, label: "Regenerate", action: () => toast.info("Regenerate coming soon") },
      ].map((btn) => (
        <button
          key={btn.label}
          onClick={btn.action}
          className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors"
        >
          <btn.icon className="h-3 w-3" />
          {btn.label}
        </button>
      ))}
    </div>
  );
}

export default function ChatWorkspace({ messages, isTyping, onSend }: Props) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const MAX_CHARS = 2000;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
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

  return (
    <div className="flex-1 flex flex-col h-full min-w-0">
      {/* Top bar */}
      <div className="px-5 py-3 border-b border-border flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
          <Bot className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-foreground">Policy &amp; SOP Architect</h1>
          <p className="text-[10px] text-muted-foreground">Powered by NIST Repository &amp; Global Compliance Frameworks</p>
        </div>
      </div>

      {/* Chat Area */}
      <ScrollArea className="flex-1">
        <div className="p-5 space-y-4 max-w-3xl mx-auto">
          {!hasConversation && (
            <>
              {/* Welcome Card */}
              <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 to-accent/10 p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="text-sm font-bold text-foreground">Enterprise Policy &amp; SOP Intelligence Engine</h2>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
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

              {/* Quick Prompts */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Quick Starters</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => onSend(prompt)}
                      className="text-left px-3 py-2.5 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 text-xs text-foreground/80 transition-all leading-relaxed"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Messages */}
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[90%] rounded-xl", msg.role === "user"
                ? "bg-primary text-primary-foreground px-4 py-3 rounded-br-sm"
                : "bg-card border border-border px-4 py-3 rounded-bl-sm"
              )}>
                {msg.role === "assistant" && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="h-5 w-5 rounded bg-primary/20 flex items-center justify-center">
                      <Bot className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-[10px] font-semibold text-primary">AI Policy Architect</span>
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
              <div className="bg-card border border-border rounded-xl px-4 py-3 rounded-bl-sm">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="h-5 w-5 rounded bg-primary/20 flex items-center justify-center">
                    <Bot className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-[10px] font-semibold text-primary">AI Policy Architect</span>
                </div>
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t border-border">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-1.5">
          <div className="relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, MAX_CHARS))}
              onKeyDown={handleKeyDown}
              placeholder="Describe your organization, industry, specific requirements, or ask to refine a specific clause..."
              className="min-h-[72px] resize-none pr-12 text-xs"
              disabled={isTyping}
              rows={3}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isTyping}
              className="absolute bottom-2 right-2 h-8 w-8"
            >
              <SendHorizonal className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[9px] text-muted-foreground">
              AI responses reference NIST, ISO, DPDP Act, GDPR source controls. Always review with qualified legal counsel.
            </p>
            <span className="text-[9px] text-muted-foreground tabular-nums">{input.length}/{MAX_CHARS}</span>
          </div>
        </form>
      </div>
    </div>
  );
}
