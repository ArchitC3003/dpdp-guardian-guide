import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Role mapping:
 *   admin    → Super Admin
 *   moderator → GRC Manager
 *   user      → Reviewer
 *   auditor   → Auditor
 */

export type AppRoleKey = "admin" | "moderator" | "user" | "auditor";

const ROLE_LABELS: Record<AppRoleKey, string> = {
  admin: "Super Admin",
  moderator: "GRC Manager",
  user: "Reviewer",
  auditor: "Auditor",
};

const ROLE_COLORS: Record<AppRoleKey, string> = {
  admin: "bg-red-500/15 text-red-400 border-red-500/20",
  moderator: "bg-primary/15 text-primary border-primary/20",
  user: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  auditor: "bg-muted-foreground/15 text-muted-foreground border-muted-foreground/20",
};

interface Permissions {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
  canApprove: boolean;
  canManageUsers: boolean;
  canConfigureAI: boolean;
  canComment: boolean;
  canGenerate: boolean;
  canChangeStatus: boolean;
  maxStatus: string | null; // highest status this role can set
  userRole: AppRoleKey;
  userRoleLabel: string;
  userRoleColor: string;
  loading: boolean;
}

export function usePermissions(): Permissions {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRoleKey>("user");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole("user");
      setLoading(false);
      return;
    }

    // Check roles in priority order
    const checkRoles = async () => {
      setLoading(true);
      // Check admin first, then moderator, then auditor — default is 'user' (Reviewer)
      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (isAdmin) { setRole("admin"); setLoading(false); return; }

      const { data: isMod } = await supabase.rpc("has_role", { _user_id: user.id, _role: "moderator" });
      if (isMod) { setRole("moderator"); setLoading(false); return; }

      const { data: isAuditor } = await supabase.rpc("has_role", { _user_id: user.id, _role: "auditor" });
      if (isAuditor) { setRole("auditor"); setLoading(false); return; }

      setRole("user");
      setLoading(false);
    };

    checkRoles();
  }, [user]);

  const permissions = useMemo<Permissions>(() => {
    switch (role) {
      case "admin":
        return {
          canCreate: true,
          canEdit: true,
          canDelete: true,
          canExport: true,
          canApprove: true,
          canManageUsers: true,
          canConfigureAI: true,
          canComment: true,
          canGenerate: true,
          canChangeStatus: true,
          maxStatus: null, // no limit
          userRole: role,
          userRoleLabel: ROLE_LABELS[role],
          userRoleColor: ROLE_COLORS[role],
          loading,
        };
      case "moderator":
        return {
          canCreate: true,
          canEdit: true,
          canDelete: true,
          canExport: true,
          canApprove: true,
          canManageUsers: false,
          canConfigureAI: false,
          canComment: true,
          canGenerate: true,
          canChangeStatus: true,
          maxStatus: "Approved",
          userRole: role,
          userRoleLabel: ROLE_LABELS[role],
          userRoleColor: ROLE_COLORS[role],
          loading,
        };
      case "user": // Reviewer
        return {
          canCreate: false,
          canEdit: false,
          canDelete: false,
          canExport: false,
          canApprove: false,
          canManageUsers: false,
          canConfigureAI: false,
          canComment: true,
          canGenerate: false,
          canChangeStatus: true,
          maxStatus: "Under Review",
          userRole: role,
          userRoleLabel: ROLE_LABELS[role],
          userRoleColor: ROLE_COLORS[role],
          loading,
        };
      case "auditor":
        return {
          canCreate: false,
          canEdit: false,
          canDelete: false,
          canExport: true,
          canApprove: false,
          canManageUsers: false,
          canConfigureAI: false,
          canComment: false,
          canGenerate: false,
          canChangeStatus: false,
          maxStatus: null,
          userRole: role,
          userRoleLabel: ROLE_LABELS[role],
          userRoleColor: ROLE_COLORS[role],
          loading,
        };
    }
  }, [role, loading]);

  return permissions;
}

export { ROLE_LABELS, ROLE_COLORS };
