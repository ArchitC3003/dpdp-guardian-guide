import { useState, useCallback, useRef } from "react";
import { Bot, FileText, Shield, Sparkles, Lock, ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import AssessmentRepoGenerator from "@/components/policy-builder/AssessmentRepoGenerator";
import HowToGuide from "@/components/policy-builder/HowToGuide";
import DocumentConfigSection from "@/components/policy-builder/DocumentConfigSection";
import FullWidthChat from "@/components/policy-builder/FullWidthChat";
import FullWidthPreview from "@/components/policy-builder/FullWidthPreview";
import { DocumentConfig, ChatMessage, DOCUMENT_TYPES } from "@/components/policy-builder/types";
import { streamPolicyChat } from "@/components/policy-builder/streamChat";
import { generateMockResponse } from "@/components/policy-builder/mockResponses";
import { OrgContext, DEFAULT_ORG_CONTEXT } from "@/components/policy-builder/orgContextTypes";
import { usePolicyVersioning } from "@/hooks/usePolicyVersioning";
import { usePermissions } from "@/hooks/usePermissions";
import { toast } from "sonner";

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
  const [orgContext, setOrgContext] = useState<OrgContext>(DEFAULT_ORG_CONTEXT);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [latestResponse, setLatestResponse] = useState<string | null>(null);
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [aiMode, setAiMode] = useState<"live" | "demo">("live");
  const abortRef = useRef<AbortController | null>(null);
  const { canGenerate, canExport, canEdit, userRoleLabel } = usePermissions();

  const {
    currentDoc,
    versions,
    auditLog,
    loading: versionsLoading,
    saveDocument,
    changeStatus,
    loadVersions,
    loadAuditLog,
    restoreVersion,
    logExport,
  } = usePolicyVersioning();

  const autoSave = useCallback(
    async (content: string, mode: "live" | "demo") => {
      try {
        await saveDocument(content, config, mode);
      } catch {
        // Graceful — don't block the user
      }
    },
    [saveDocument, config]
  );

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

      const apiMessages = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: text.trim() },
      ];

      const assistantId = crypto.randomUUID();
      let assistantContent = "";

      const controller = new AbortController();
      abortRef.current = controller;

      streamPolicyChat({
        messages: apiMessages,
        config,
        orgContext,
        signal: controller.signal,
        onDelta: (chunk) => {
          assistantContent += chunk;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant" && last.id === assistantId) {
              return prev.map((m, i) =>
                i === prev.length - 1 ? { ...m, content: assistantContent } : m
              );
            }
            return [
              ...prev,
              {
                id: assistantId,
                role: "assistant",
                content: assistantContent,
                timestamp: new Date(),
              },
            ];
          });
          setLatestResponse(assistantContent);
        },
        onDone: () => {
          setIsTyping(false);
          abortRef.current = null;
          if (assistantContent) {
            setLatestResponse(assistantContent);
            setPreviewExpanded(true);
            setAiMode("live");
            autoSave(assistantContent, "live");
          }
        },
        onError: (error) => {
          setIsTyping(false);
          abortRef.current = null;

          if (!assistantContent) {
            setAiMode("demo");
            const mockContent = generateMockResponse(text.trim(), config);
            const mockMsg: ChatMessage = {
              id: assistantId,
              role: "assistant",
              content: mockContent,
              timestamp: new Date(),
            };
            setMessages((prev) => {
              const filtered = prev.filter((m) => m.id !== assistantId);
              return [...filtered, mockMsg];
            });
            setLatestResponse(mockContent);
            setPreviewExpanded(true);
            autoSave(mockContent, "demo");
            toast.warning("AI is running in demo mode. Live AI generation will resume when available.", { duration: 6000 });
          } else {
            toast.error(error);
          }
        },
      });
    },
    [config, orgContext, isTyping, messages, autoSave]
  );

  const handleGenerate = () => {
    const docLabel =
      DOCUMENT_TYPES.find((d) => d.value === config.documentType)?.label ?? "Policy Document";
    sendMessage(`Generate a comprehensive ${docLabel} for our organization.`);
  };

  const handleClearChat = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setMessages([]);
    setLatestResponse(null);
    setPreviewExpanded(false);
    setIsTyping(false);
  };

  const handleSaveToRepo = async () => {
    if (!latestResponse) return;
    await saveDocument(latestResponse, config, aiMode);
    toast.success("Saved to repository");
  };

  const handleExport = (format: string) => {
    logExport(format);
    toast.info(`${format} export coming soon`);
  };

  const handleViewVersion = (content: string) => {
    setLatestResponse(content);
  };

  const handleRestoreVersion = async (versionId: string) => {
    const content = await restoreVersion(versionId);
    if (content) {
      setLatestResponse(content);
    }
  };

  return (
    <div className="flex flex-col min-h-screen w-full">
      {/* Sticky Page Header */}
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

      {/* Mode Tabs */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <Tabs defaultValue="builder" className="space-y-6">
            <TabsList className="h-10">
              <TabsTrigger value="builder" className="gap-1.5 text-xs">
                <Bot className="h-3.5 w-3.5" /> Policy & SOP Builder
              </TabsTrigger>
              <TabsTrigger value="repo-gen" className="gap-1.5 text-xs">
                <ClipboardList className="h-3.5 w-3.5" /> Assessment Repository Generator
              </TabsTrigger>
            </TabsList>

            <TabsContent value="builder" className="space-y-8 mt-0">
              <HowToGuide />
              <Separator />
              <DocumentConfigSection
                config={config}
                onChange={setConfig}
                onGenerate={canGenerate ? handleGenerate : undefined}
                orgContext={orgContext}
                onOrgContextChange={setOrgContext}
              />
              <Separator />
              {!canGenerate && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 flex items-center gap-2">
                  <Lock className="h-4 w-4 text-amber-400 shrink-0" />
                  <p className="text-xs text-amber-300">
                    You have view-only access ({userRoleLabel}). Contact your GRC Manager to request document generation.
                  </p>
                </div>
              )}
              {canGenerate && (
                <FullWidthChat
                  messages={messages}
                  isTyping={isTyping}
                  onSend={sendMessage}
                  onClear={handleClearChat}
                  activeFrameworks={config.frameworks}
                  aiMode={aiMode}
                />
              )}
              {!canGenerate && messages.length > 0 && (
                <FullWidthChat
                  messages={messages}
                  isTyping={false}
                  onSend={() => {}}
                  onClear={() => {}}
                  activeFrameworks={config.frameworks}
                  aiMode={aiMode}
                />
              )}
              <Separator />
              <FullWidthPreview
                config={config}
                latestResponse={latestResponse}
                isExpanded={previewExpanded}
                onToggle={() => setPreviewExpanded(!previewExpanded)}
                currentDoc={currentDoc}
                versions={versions}
                auditLog={auditLog}
                versionsLoading={versionsLoading}
                onStatusChange={changeStatus}
                onLoadVersions={loadVersions}
                onLoadAuditLog={loadAuditLog}
                onViewVersion={handleViewVersion}
                onRestoreVersion={handleRestoreVersion}
                onSaveToRepo={handleSaveToRepo}
                onExport={handleExport}
              />
            </TabsContent>

            <TabsContent value="repo-gen" className="mt-0">
              <AssessmentRepoGenerator />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
