import { useState, useCallback } from "react";
import { Bot, FileText, Shield, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import HowToGuide from "@/components/policy-builder/HowToGuide";
import DocumentConfigSection from "@/components/policy-builder/DocumentConfigSection";
import FullWidthChat from "@/components/policy-builder/FullWidthChat";
import FullWidthPreview from "@/components/policy-builder/FullWidthPreview";
import { DocumentConfig, ChatMessage, DOCUMENT_TYPES } from "@/components/policy-builder/types";
import { generateMockResponse } from "@/components/policy-builder/mockResponses";

const DEFAULT_CONFIG: DocumentConfig = {
  documentType: "info-security-policy",
  frameworks: ["nist-csf-2"],
  industry: "Technology",
  orgSize: "enterprise",
  maturity: 2,
  outputFormat: "docx",
  classification: "confidential",
};

export default function PolicySopBuilder() {
  const [config, setConfig] = useState<DocumentConfig>(DEFAULT_CONFIG);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [latestResponse, setLatestResponse] = useState<string | null>(null);
  const [previewExpanded, setPreviewExpanded] = useState(false);

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim() || isTyping) return;
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: text.trim(),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsTyping(true);

      setTimeout(() => {
        const responseContent = generateMockResponse(text, config);
        const aiMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: responseContent,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMsg]);
        setLatestResponse(responseContent);
        setPreviewExpanded(true);
        setIsTyping(false);
      }, 1500);
    },
    [config, isTyping]
  );

  const handleGenerate = () => {
    const docLabel =
      DOCUMENT_TYPES.find((d) => d.value === config.documentType)?.label ?? "Policy Document";
    sendMessage(`Generate a comprehensive ${docLabel} for our organization.`);
  };

  const handleClearChat = () => {
    setMessages([]);
    setLatestResponse(null);
    setPreviewExpanded(false);
  };

  return (
    <div className="flex flex-col min-h-screen w-full">
      {/* SECTION 1 — Sticky Page Header */}
      <div className="sticky top-0 z-30 bg-card border-b border-border" style={{ borderBottomWidth: 2, borderImage: "linear-gradient(to right, hsl(161 93% 30%), hsl(158 64% 51%), transparent) 1" }}>
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/20 flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground">Policy & SOP Builder</h1>
              <p className="text-[11px] text-muted-foreground">AI-Powered Compliance Document Generator</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] border-primary/30 text-primary gap-1">
              <FileText className="h-3 w-3" /> 13 Document Types
            </Badge>
            <Badge variant="outline" className="text-[10px] border-primary/30 text-primary gap-1">
              <Shield className="h-3 w-3" /> 7 Frameworks
            </Badge>
            <Badge variant="outline" className="text-[10px] border-primary/30 text-primary gap-1">
              <Sparkles className="h-3 w-3" /> NIST-Aligned
            </Badge>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-6 space-y-8">
          <HowToGuide />
          <Separator />
          <DocumentConfigSection config={config} onChange={setConfig} onGenerate={handleGenerate} />
          <Separator />
          <FullWidthChat
            messages={messages}
            isTyping={isTyping}
            onSend={sendMessage}
            onClear={handleClearChat}
            activeFrameworks={config.frameworks}
          />
          <Separator />
          <FullWidthPreview
            config={config}
            latestResponse={latestResponse}
            isExpanded={previewExpanded}
            onToggle={() => setPreviewExpanded(!previewExpanded)}
          />
        </div>
      </div>
    </div>
  );
}
