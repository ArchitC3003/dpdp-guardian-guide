import { DocumentConfig, FRAMEWORKS, DOCUMENT_TYPES, MATURITY_LEVELS } from "./types";
import { OrgContext } from "./orgContextTypes";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-policy`;

export interface StreamChatOptions {
  messages: Msg[];
  config: DocumentConfig;
  orgContext?: OrgContext;
  assessmentGaps?: string[];
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
  signal?: AbortSignal;
}

export async function streamPolicyChat({
  messages,
  config,
  orgContext,
  onDelta,
  onDone,
  onError,
  signal,
}: StreamChatOptions) {
  const frameworkLabels = config.frameworks
    .map((f) => FRAMEWORKS.find((fw) => fw.value === f)?.label)
    .filter(Boolean);
  const docLabel =
    DOCUMENT_TYPES.find((d) => d.value === config.documentType)?.label ?? "Policy Document";
  const maturityLabel = MATURITY_LEVELS[config.maturity] ?? "Defined";

  const lastMessage = messages[messages.length - 1];
  const conversationHistory = messages.slice(0, -1);

  try {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        documentType: docLabel,
        frameworks: frameworkLabels.join(", ") || "NIST CSF 2.0",
        orgName: orgContext?.orgName || config.orgName || config.industry,
        industry: orgContext?.industry || config.industry,
        industryVerticals: orgContext?.industries || (orgContext?.industry ? [orgContext.industry] : [config.industry].filter(Boolean)),
        orgSize: orgContext?.orgSize || config.orgSize,
        maturityLevel: orgContext?.maturityLevel || maturityLabel,
        userMessage: lastMessage?.content || "",
        conversationHistory,
        // Extended org context
        sdfClassification: orgContext?.sdfClassification || config.sdfClassification || "",
        geographies: orgContext?.geographies || config.geographies || "",
        processingActivities: orgContext?.processingActivities || config.processingActivities || [],
        personalDataTypes: orgContext?.personalDataTypes || [],
        sector: orgContext?.sector || config.sector || "",
        dpoName: orgContext?.dpoName || config.dpoName || "",
        date: orgContext?.date || config.date || "",
        additionalContext: orgContext?.additionalContext || "",
        structuredContext: orgContext?.structuredContext || {},
      }),
      signal,
    });

    if (!resp.ok) {
      let errorMsg = "Failed to connect to AI service.";
      try {
        const errorData = await resp.json();
        errorMsg = errorData.error || errorMsg;
      } catch {
        // ignore parse error
      }

      if (resp.status === 429) {
        onError("Rate limit exceeded. Please wait a moment and try again.");
      } else if (resp.status === 402) {
        onError("AI usage credits exhausted. Please add credits in Settings → Workspace → Usage.");
      } else {
        onError(errorMsg);
      }
      return;
    }

    if (!resp.body) {
      onError("No response body received.");
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    // Final flush
    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {
          /* ignore partial leftovers */
        }
      }
    }

    onDone();
  } catch (e: any) {
    if (e.name === "AbortError") {
      onDone();
      return;
    }
    console.error("Stream error:", e);
    onError(e.message || "Connection failed. Please try again.");
  }
}
