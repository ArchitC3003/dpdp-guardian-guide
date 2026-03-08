import { supabase } from "@/integrations/supabase/client";
import { DocumentConfig, FRAMEWORKS, DOCUMENT_TYPES, MATURITY_LEVELS } from "./types";

type Msg = { role: "user" | "assistant"; content: string };

export interface StreamChatOptions {
  messages: Msg[];
  config: DocumentConfig;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
  signal?: AbortSignal;
}

export async function streamPolicyChat({
  messages,
  config,
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

  // The last message is the current user message
  const lastMessage = messages[messages.length - 1];
  const conversationHistory = messages.slice(0, -1);

  try {
    // Check for abort before calling
    if (signal?.aborted) {
      onDone();
      return;
    }

    const { data, error } = await supabase.functions.invoke("generate-policy", {
      body: {
        documentType: docLabel,
        frameworks: frameworkLabels.join(", ") || "NIST CSF 2.0",
        orgName: config.industry, // org context
        industry: config.industry,
        orgSize: config.orgSize,
        maturityLevel: maturityLabel,
        userMessage: lastMessage?.content || "",
        conversationHistory,
      },
    });

    if (signal?.aborted) {
      onDone();
      return;
    }

    if (error) {
      onError(error.message || "Failed to connect to AI service.");
      return;
    }

    if (data?.error) {
      onError(data.error);
      return;
    }

    const content = data?.content;
    if (!content) {
      onError("No content received from AI service.");
      return;
    }

    // Simulate streaming by delivering content in chunks for smooth UX
    const chunkSize = 20;
    for (let i = 0; i < content.length; i += chunkSize) {
      if (signal?.aborted) {
        onDone();
        return;
      }
      const chunk = content.slice(i, i + chunkSize);
      onDelta(chunk);
      // Small delay to create streaming effect
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    onDone();
  } catch (e: any) {
    if (e.name === "AbortError") {
      onDone();
      return;
    }
    console.error("Generate policy error:", e);
    onError(e.message || "Connection failed. Please try again.");
  }
}
