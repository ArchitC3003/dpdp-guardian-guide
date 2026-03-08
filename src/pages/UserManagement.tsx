import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions, ROLE_LABELS, ROLE_COLORS, AppRoleKey } from "@/hooks/usePermissions";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Users, UserPlus, Shield, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserRow {
  id: string;
  full_name: string | null;
  organisation: string | null;
  job_title: string | null;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  email: string | null;
  role: AppRoleKey;
}

const ASSIGNABLE_ROLES: { value: AppRoleKey; label: string }[] = [
  { value: "admin", label: "Super Admin" },
  { value: "moderator", label: "GRC Manager" },
  { value: "user", label: "Reviewer" },
  { value: "auditor", label: "Auditor" },
];

export default function UserManagement() {
  const { user } = useAuth();
  const { canManageUsers, loading: permLoading } = usePermissions();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AppRoleKey>("moderator");
  const [inviting, setInviting] = useState(false);

  const fetchUsers = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [{ data: profiles }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("user_roles").select("*"),
      ]);

      const roleMap = new Map<string, AppRoleKey>();
      roles?.forEach((r: any) => {
        const current = roleMap.get(r.user_id);
        const priority: AppRoleKey[] = ["admin", "moderator", "auditor", "user"];
        if (!current || priority.indexOf(r.role) < priority.indexOf(current)) {
          roleMap.set(r.user_id, r.role);
        }
      });

      const enriched: UserRow[] = (profiles ?? []).map((p: any) => ({
        id: p.id,
        full_name: p.full_name,
        organisation: p.organisation,
        job_title: p.job_title,
        is_active: p.is_active ?? true,
        last_login: p.last_login,
        created_at: p.created_at,
        email: null,
        role: roleMap.get(p.id) || "user",
      }));

      setUsers(enriched);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      toast.error("Failed to load users");
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!permLoading && canManageUsers) {
      fetchUsers();
    }
  }, [permLoading, canManageUsers, fetchUsers]);

  const handleRoleChange = async (userId: string, newRole: AppRoleKey) => {
    try {
      // Delete existing roles for user
      await supabase.from("user_roles").delete().eq("user_id", userId);
      // Insert new role
      await supabase.from("user_roles").insert({ user_id: userId, role: newRole });
      toast.success(`Role updated to ${ROLE_LABELS[newRole]}`);
      fetchUsers();
    } catch {
      toast.error("Failed to update role");
    }
  };

  const handleToggleActive = async (userId: string, currentlyActive: boolean) => {
    await supabase
      .from("profiles")
      .update({ is_active: !currentlyActive })
      .eq("id", userId);
    toast.success(currentlyActive ? "User deactivated" : "User activated");
    fetchUsers();
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      // Use edge function for admin invite (since we can't call auth.admin from client)
      const { error } = await supabase.functions.invoke("admin-invite-user", {
        body: { email: inviteEmail.trim(), role: inviteRole },
      });
      if (error) throw error;
      toast.success(`Invitation sent to ${inviteEmail}`);
      setShowInvite(false);
      setInviteEmail("");
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Failed to send invite");
    }
    setInviting(false);
  };

  if (permLoading) {
    return <p className="text-sm text-muted-foreground p-6">Loading...</p>;
  }

  if (!canManageUsers) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="h-16 w-16 rounded-xl bg-muted/20 flex items-center justify-center">
          <Lock className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Access Restricted</h2>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          User management is only available to Super Admins. Contact your administrator for access.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
            <Users className="h-7 w-7" /> User Management
          </h1>
          <p className="text-muted-foreground">Manage team members, roles, and permissions</p>
        </div>
        <Button onClick={() => setShowInvite(true)} className="gap-2">
          <UserPlus className="h-4 w-4" /> Invite User
        </Button>
      </div>

      {/* Role Legend */}
      <div className="flex flex-wrap gap-2">
        {ASSIGNABLE_ROLES.map((r) => (
          <Badge key={r.value} variant="outline" className={cn("text-[10px]", ROLE_COLORS[r.value])}>
            <Shield className="h-3 w-3 mr-1" /> {r.label}
          </Badge>
        ))}
      </div>

      {/* Users Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Organisation</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Loading users...
                  </TableCell>
                </TableRow>
              )}
              {!loading && users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No users found
                  </TableCell>
                </TableRow>
              )}
              {users.map((u) => (
                <TableRow key={u.id} className={!u.is_active ? "opacity-50" : ""}>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{u.full_name || "—"}</p>
                      {u.job_title && (
                        <p className="text-[10px] text-muted-foreground">{u.job_title}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={u.role}
                      onValueChange={(val) => handleRoleChange(u.id, val as AppRoleKey)}
                      disabled={u.id === user?.id}
                    >
                      <SelectTrigger className="h-7 w-[140px] text-[10px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ASSIGNABLE_ROLES.map((r) => (
                          <SelectItem key={r.value} value={r.value} className="text-xs">
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-sm">{u.organisation || "—"}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[9px]",
                        u.is_active
                          ? "border-emerald-500/30 text-emerald-400"
                          : "border-red-500/30 text-red-400"
                      )}
                    >
                      {u.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell>
                    {u.id !== user?.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[10px] h-7"
                        onClick={() => handleToggleActive(u.id, u.is_active)}
                      >
                        {u.is_active ? "Deactivate" : "Activate"}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an invitation email to add a new team member to your organisation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Role
              </label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as AppRoleKey)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSIGNABLE_ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()} className="w-full">
              {inviting ? "Sending..." : "Send Invitation"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
