import { useState, useCallback } from "react";
import { PanelRightOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import DocumentConfigPanel from "@/components/policy-builder/DocumentConfigPanel";
import ChatWorkspace from "@/components/policy-builder/ChatWorkspace";
import DocumentPreviewPanel from "@/components/policy-builder/DocumentPreviewPanel";
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
  const [previewOpen, setPreviewOpen] = useState(true);
  const [latestResponse, setLatestResponse] = useState<string | null>(null);

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
        setPreviewOpen(true);
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

  return (
    <div className="flex h-[calc(100vh-2rem)] w-full overflow-hidden">
      <DocumentConfigPanel config={config} onChange={setConfig} onGenerate={handleGenerate} />
      <ChatWorkspace messages={messages} isTyping={isTyping} onSend={sendMessage} />
      {!previewOpen && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 z-10"
          onClick={() => setPreviewOpen(true)}
        >
          <PanelRightOpen className="h-4 w-4" />
        </Button>
      )}
      <DocumentPreviewPanel
        config={config}
        latestResponse={latestResponse}
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  );
}
