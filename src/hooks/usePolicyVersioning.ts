import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DocumentConfig, DOCUMENT_TYPES, FRAMEWORKS } from "@/components/policy-builder/types";
import { toast } from "sonner";

const DOC_REF_MAP: Record<string, string> = {
  "info-security-policy": "POL-ISP-001",
  "data-privacy-policy": "POL-DPP-001",
  "acceptable-use-policy": "POL-AUP-001",
  "incident-response-policy": "POL-IRP-001",
  "business-continuity-policy": "POL-BCP-001",
  "vendor-risk-policy": "POL-VRM-001",
  "access-control-policy": "POL-ACP-001",
  "data-classification-policy": "POL-DCP-001",
  "sop-incident-response": "SOP-IR-001",
  "sop-breach-notification": "SOP-DBN-001",
  "sop-access-provisioning": "SOP-AP-001",
  "sop-vuln-management": "SOP-VM-001",
  "sop-third-party-onboarding": "SOP-TPO-001",
};

export interface PolicyDocument {
  id: string;
  title: string;
  document_type: string;
  document_ref: string;
  current_version: string;
  status: string;
  classification: string;
  created_at: string;
  updated_at: string;
}

export interface PolicyVersion {
  id: string;
  document_id: string;
  version: string;
  content: string;
  change_summary: string | null;
  generated_by: string;
  ai_model: string | null;
  created_at: string;
  is_current: boolean;
}

export interface AuditEntry {
  id: string;
  action: string;
  action_detail: string | null;
  performed_by_name: string | null;
  performed_at: string;
}

function incrementVersion(current: string, isMajor: boolean): string {
  const [major, minor] = current.split(".").map(Number);
  if (isMajor) return `${major + 1}.0`;
  const newMinor = minor + 1;
  if (newMinor >= 10) return `${major + 1}.0`;
  return `${major}.${newMinor}`;
}

export function usePolicyVersioning() {
  const { user, profile } = useAuth();
  const [currentDoc, setCurrentDoc] = useState<PolicyDocument | null>(null);
  const [versions, setVersions] = useState<PolicyVersion[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const userName = profile?.full_name || user?.email || "Unknown";

  const saveDocument = useCallback(
    async (content: string, config: DocumentConfig, aiMode: "live" | "demo") => {
      if (!user) return null;

      const docLabel = DOCUMENT_TYPES.find((d) => d.value === config.documentType)?.label ?? "Policy Document";
      const docRef = DOC_REF_MAP[config.documentType] ?? "POL-GEN-001";
      const docType = config.documentType.startsWith("sop-") ? "sop" : "policy";
      const frameworkLabels = config.frameworks
        .map((f) => FRAMEWORKS.find((fw) => fw.value === f)?.label)
        .filter(Boolean) as string[];

      try {
        // Check if document of this type already exists for user
        const { data: existing } = await supabase
          .from("policy_documents")
          .select("*")
          .eq("user_id", user.id)
          .eq("document_ref", docRef)
          .maybeSingle();

        if (existing) {
          // Increment version
          const newVersion = incrementVersion(existing.current_version, false);

          // Mark old versions as not current
          await supabase
            .from("policy_versions")
            .update({ is_current: false })
            .eq("document_id", existing.id);

          // Insert new version
          const { data: versionData } = await supabase
            .from("policy_versions")
            .insert({
              document_id: existing.id,
              version: newVersion,
              content,
              change_summary: "Regenerated via AI",
              generated_by: aiMode === "live" ? "AI" : "Demo",
              ai_model: aiMode === "live" ? "gemini-2.5-flash" : null,
              created_by: user.id,
              is_current: true,
            })
            .select()
            .single();

          // Update document
          await supabase
            .from("policy_documents")
            .update({
              current_version: newVersion,
              classification: config.classification,
              selected_frameworks: frameworkLabels,
              industry_vertical: config.industry,
              org_size: config.orgSize,
              maturity_level: config.maturity,
            })
            .eq("id", existing.id);

          // Audit log
          await supabase.from("policy_audit_log").insert({
            document_id: existing.id,
            version_id: versionData?.id,
            action: "Regenerated",
            action_detail: `Version ${newVersion} generated via ${aiMode === "live" ? "AI" : "Demo mode"}`,
            performed_by: user.id,
            performed_by_name: userName,
          });

          const updated = { ...existing, current_version: newVersion };
          setCurrentDoc(updated as PolicyDocument);
          return updated;
        } else {
          // Create new document
          const { data: docData } = await supabase
            .from("policy_documents")
            .insert({
              user_id: user.id,
              title: docLabel,
              document_type: docType,
              document_ref: docRef,
              current_version: "1.0",
              status: "Draft",
              classification: config.classification,
              selected_frameworks: frameworkLabels,
              industry_vertical: config.industry,
              org_size: config.orgSize,
              maturity_level: config.maturity,
              effective_date: new Date().toISOString().slice(0, 10),
              review_date: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
            })
            .select()
            .single();

          if (!docData) throw new Error("Failed to create document");

          // Insert first version
          const { data: versionData } = await supabase
            .from("policy_versions")
            .insert({
              document_id: docData.id,
              version: "1.0",
              content,
              change_summary: "Initial generation",
              generated_by: aiMode === "live" ? "AI" : "Demo",
              ai_model: aiMode === "live" ? "gemini-2.5-flash" : null,
              created_by: user.id,
              is_current: true,
            })
            .select()
            .single();

          // Audit log
          await supabase.from("policy_audit_log").insert({
            document_id: docData.id,
            version_id: versionData?.id,
            action: "Created",
            action_detail: `${docLabel} v1.0 created`,
            performed_by: user.id,
            performed_by_name: userName,
          });

          setCurrentDoc(docData as PolicyDocument);
          return docData;
        }
      } catch (err) {
        console.error("Save error:", err);
        // Graceful fallback — don't block the user
        return null;
      }
    },
    [user, userName]
  );

  const changeStatus = useCallback(
    async (newStatus: string) => {
      if (!currentDoc || !user) return;
      const oldStatus = currentDoc.status;
      try {
        await supabase
          .from("policy_documents")
          .update({ status: newStatus })
          .eq("id", currentDoc.id);

        await supabase.from("policy_audit_log").insert({
          document_id: currentDoc.id,
          action: "Status Changed",
          action_detail: `${oldStatus} → ${newStatus}`,
          performed_by: user.id,
          performed_by_name: userName,
        });

        setCurrentDoc({ ...currentDoc, status: newStatus });
        toast.success(`Status changed to ${newStatus}`);
      } catch {
        toast.error("Failed to update status");
      }
    },
    [currentDoc, user, userName]
  );

  const loadVersions = useCallback(async () => {
    if (!currentDoc) return;
    setLoading(true);
    const { data } = await supabase
      .from("policy_versions")
      .select("*")
      .eq("document_id", currentDoc.id)
      .order("created_at", { ascending: false });
    setVersions((data as PolicyVersion[]) ?? []);
    setLoading(false);
  }, [currentDoc]);

  const loadAuditLog = useCallback(async () => {
    if (!currentDoc) return;
    setLoading(true);
    const { data } = await supabase
      .from("policy_audit_log")
      .select("*")
      .eq("document_id", currentDoc.id)
      .order("performed_at", { ascending: false });
    setAuditLog((data as AuditEntry[]) ?? []);
    setLoading(false);
  }, [currentDoc]);

  const restoreVersion = useCallback(
    async (versionId: string): Promise<string | null> => {
      if (!currentDoc || !user) return null;
      try {
        const target = versions.find((v) => v.id === versionId);
        if (!target) return null;

        // Mark all as not current
        await supabase
          .from("policy_versions")
          .update({ is_current: false })
          .eq("document_id", currentDoc.id);

        // Create a new version copying the restored content
        const newVersion = incrementVersion(currentDoc.current_version, false);
        await supabase.from("policy_versions").insert({
          document_id: currentDoc.id,
          version: newVersion,
          content: target.content,
          change_summary: `Restored from v${target.version}`,
          generated_by: "User",
          created_by: user.id,
          is_current: true,
        });

        await supabase
          .from("policy_documents")
          .update({ current_version: newVersion })
          .eq("id", currentDoc.id);

        await supabase.from("policy_audit_log").insert({
          document_id: currentDoc.id,
          action: "Updated",
          action_detail: `Restored from v${target.version} → v${newVersion}`,
          performed_by: user.id,
          performed_by_name: userName,
        });

        setCurrentDoc({ ...currentDoc, current_version: newVersion });
        toast.success(`Restored to v${target.version} as v${newVersion}`);
        await loadVersions();
        return target.content;
      } catch {
        toast.error("Failed to restore version");
        return null;
      }
    },
    [currentDoc, user, userName, versions, loadVersions]
  );

  const logExport = useCallback(
    async (format: string) => {
      if (!currentDoc || !user) return;
      await supabase.from("policy_audit_log").insert({
        document_id: currentDoc.id,
        action: "Exported",
        action_detail: `Exported as ${format}`,
        performed_by: user.id,
        performed_by_name: userName,
      });
    },
    [currentDoc, user, userName]
  );

  return {
    currentDoc,
    versions,
    auditLog,
    loading,
    saveDocument,
    changeStatus,
    loadVersions,
    loadAuditLog,
    restoreVersion,
    logExport,
    setCurrentDoc,
  };
}
