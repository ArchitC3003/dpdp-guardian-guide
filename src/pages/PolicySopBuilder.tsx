import { useState, useRef, useEffect } from "react";
import { Bot, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const NIST_FRAMEWORKS = [
  { value: "csf2", label: "NIST CSF 2.0" },
  { value: "sp800-53", label: "NIST SP 800-53 Rev 5" },
  { value: "sp800-171", label: "NIST SP 800-171" },
  { value: "privacy", label: "NIST Privacy Framework" },
];

const frameworkLabel = (value: string) =>
  NIST_FRAMEWORKS.find((f) => f.value === value)?.label ?? value;

function generateMockResponse(userMessage: string, framework: string): string {
  const fw = frameworkLabel(framework);
  const lower = userMessage.toLowerCase();

  if (lower.includes("policy")) {
    return `Based on **${fw}**, here's a draft outline for your policy:\n\n**1. Purpose & Scope**\nDefine the objectives and boundaries of the policy aligned with ${fw} control families.\n\n**2. Roles & Responsibilities**\nAssign ownership to key stakeholders (CISO, DPO, IT Operations).\n\n**3. Policy Statements**\n- Data classification and handling requirements\n- Access control and authentication standards\n- Incident response and reporting obligations\n\n**4. Compliance & Review**\nEstablish a review cycle (annual recommended) and map controls back to ${fw} categories.\n\nWould you like me to expand on any specific section?`;
  }

  if (lower.includes("sop")) {
    return `Here's a draft SOP structure aligned with **${fw}**:\n\n**SOP Title:** [Your Procedure Name]\n\n**1. Objective**\nDescribe the purpose referencing applicable ${fw} controls.\n\n**2. Prerequisites**\nList tools, access permissions, and training requirements.\n\n**3. Step-by-Step Procedure**\n- Step 1: Identify applicable data assets\n- Step 2: Apply controls per ${fw} guidelines\n- Step 3: Document evidence and artifacts\n- Step 4: Verify and validate implementation\n\n**4. Escalation Path**\nDefine when and how to escalate issues.\n\n**5. Review Schedule**\nQuarterly review recommended per ${fw}.\n\nShall I tailor this to a specific domain?`;
  }

  return `Thank you for your input. Based on **${fw}**, I can help you:\n\n• **Draft a Policy** — covering governance, access control, risk management, or data protection\n• **Create an SOP** — step-by-step procedures for incident response, change management, or audit preparation\n\nPlease describe what specific policy or SOP you need, and I'll generate a tailored draft aligned with ${fw} controls and categories.`;
}

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Welcome to Policy & SOP Builder! I can help you draft Policies and Standard Operating Procedures based on NIST frameworks. Select a document type and describe your needs to get started.",
};

export default function PolicySopBuilder() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [framework, setFramework] = useState("csf2");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text.trim(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const reply: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: generateMockResponse(text, framework),
      };
      setMessages((prev) => [...prev, reply]);
      setIsTyping(false);
    }, 1200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] max-w-4xl mx-auto p-4 gap-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
          <Bot className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-foreground">
            Policy &amp; SOP Builder
          </h1>
          <p className="text-xs text-muted-foreground">
            AI-assisted document drafting
          </p>
        </div>
        <Select value={framework} onValueChange={setFramework}>
          <SelectTrigger className="w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {NIST_FRAMEWORKS.map((fw) => (
              <SelectItem key={fw.value} value={fw.value}>
                {fw.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Quick actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="rounded-full text-xs"
          onClick={() => sendMessage("Create Policy")}
        >
          📄 Create Policy
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full text-xs"
          onClick={() => sendMessage("Create SOP")}
        >
          📋 Create SOP
        </Button>
      </div>

      {/* Chat area */}
      <ScrollArea className="flex-1 border border-border rounded-lg bg-background p-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-xl px-4 py-3 text-sm whitespace-pre-wrap",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-card border border-border text-card-foreground rounded-bl-sm"
                )}
              >
                {msg.content.split("\n").map((line, i) => {
                  const bold = line.replace(
                    /\*\*(.+?)\*\*/g,
                    "<strong>$1</strong>"
                  );
                  return (
                    <span
                      key={i}
                      dangerouslySetInnerHTML={{
                        __html: (i > 0 ? "<br/>" : "") + bold,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-card border border-border rounded-xl px-4 py-3 text-sm text-muted-foreground rounded-bl-sm">
                <span className="animate-pulse">Generating response…</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe the policy or SOP you need…"
          className="flex-1"
          disabled={isTyping}
        />
        <Button type="submit" disabled={!input.trim() || isTyping} size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
