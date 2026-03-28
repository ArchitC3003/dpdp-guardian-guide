import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { Badge } from "@/components/ui/badge";
import {
  Cog, LayoutDashboard, ClipboardList, FolderOpen, Building2,
  FileText, Search, Grid3X3, Paperclip, BarChart3, LogOut,
  Settings2, Bot, Users, BookMarked, Shield, ScrollText,
  Scale, AlertTriangle, FileSearch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NavItem = { title: string; subtitle: string; url: string; icon: any };

const overviewNav: NavItem[] = [
  { title: "Dashboard", subtitle: "Compliance overview & risk summary", url: "/dashboard", icon: LayoutDashboard },
];

const assessNav: NavItem[] = [
  { title: "Assessments", subtitle: "Run & manage gap assessments", url: "/assessments", icon: ClipboardList },
  { title: "Templates & Reference", subtitle: "Requirement templates & checklists", url: "/repository", icon: FolderOpen },
];

const buildNav: NavItem[] = [
  { title: "Policy Builder", subtitle: "AI-powered policy & SOP generator", url: "/policy-sop-builder", icon: Bot },
  { title: "Policy Register", subtitle: "Policy lifecycle management", url: "/policy-library", icon: BookMarked },
  { title: "Organisation Documents", subtitle: "Org documents & evidence library", url: "/artefacts", icon: Building2 },
];

const privacyOpsNav: NavItem[] = [
  { title: "Consent Ledger", subtitle: "Consent receipts & records", url: "/consent/ledger", icon: ScrollText },
  { title: "Notice Manager", subtitle: "Create & publish privacy notices", url: "/consent/notices", icon: FileText },
  { title: "Rights Desk", subtitle: "Data principal rights requests", url: "/consent/rights-desk", icon: Scale },
  { title: "Grievances", subtitle: "Complaints & grievance redressal", url: "/consent/grievances", icon: AlertTriangle },
  { title: "Audit Log", subtitle: "Tamper-evident event log", url: "/consent/audit-log", icon: FileSearch },
];

const myPrivacyNav: NavItem[] = [
  { title: "Privacy Preferences", subtitle: "Manage your consent & data rights", url: "/privacy-preferences", icon: Shield },
];

const adminNav: NavItem[] = [
  { title: "User Management", subtitle: "Manage team roles & access", url: "/settings/users", icon: Users },
  { title: "AI Configuration", subtitle: "Manage AI prompts & models", url: "/admin/ai-config", icon: Bot },
  { title: "Settings", subtitle: "Account & app configuration", url: "/settings", icon: Settings2 },
];

const getPhases = (fwCount: number) => [
  { title: "① Org Profile", url: "org-profile", icon: Building2 },
  { title: "② Policy Matrix", url: "policy-matrix", icon: FileText },
  { title: fwCount > 1 ? `③ Assessment (${fwCount} frameworks)` : "③ Rapid Assessment", url: "rapid-assessment", icon: Search },
  { title: "④ Dept Grid", url: "dept-grid", icon: Grid3X3 },
  { title: "⑤ File References", url: "file-references", icon: Paperclip },
  { title: "⑥ Dashboard", url: "dashboard", icon: BarChart3 },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { profile, signOut } = useAuth();
  const { userRoleLabel, userRoleColor, canManageUsers } = usePermissions();
  const location = useLocation();

  const assessmentMatch = location.pathname.match(/\/assessment\/([^/]+)/);
  const assessmentId = assessmentMatch?.[1];

  const [frameworkCount, setFrameworkCount] = useState(0);

  useEffect(() => {
    if (!assessmentId) { setFrameworkCount(0); return; }
    (async () => {
      const { data } = await supabase
        .from("assessments")
        .select("framework_ids")
        .eq("id", assessmentId)
        .single();
      const ids = (data?.framework_ids as string[] | null) ?? [];
      setFrameworkCount(ids.length);
    })();
  }, [assessmentId]);

  const renderNavItem = (item: NavItem) => (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton asChild>
        <NavLink to={item.url} end={item.url === "/dashboard" || item.url === "/assessments"} className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-accent text-primary font-medium">
          <item.icon className="h-4 w-4 mr-2 shrink-0 self-start mt-0.5" />
          {!collapsed && (
            <div className="flex flex-col">
              <span>{item.title}</span>
              <span className="text-[10px] text-muted-foreground leading-tight">{item.subtitle}</span>
            </div>
          )}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  const renderSection = (label: string, items: NavItem[]) => (
    <SidebarGroup key={label}>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>{items.map(renderNavItem)}</SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Logo */}
        <div className="p-4 flex items-center gap-2 border-b border-border">
          <Cog className="h-7 w-7 text-primary shrink-0" />
          {!collapsed && (
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-gradient">PrivcybHub</span>
              <span className="text-[10px] font-mono bg-primary/20 text-primary px-1.5 py-0.5 rounded">v3.0</span>
            </div>
          )}
        </div>

        {renderSection("Overview", overviewNav)}
        {renderSection("Assess", assessNav)}
        {renderSection("Build", buildNav)}
        {canManageUsers && renderSection("Privacy Operations", privacyOpsNav)}
        {renderSection("My Privacy", myPrivacyNav)}
        {canManageUsers && renderSection("Administration", adminNav)}

        {/* Assessment Phases */}
        {assessmentId && (
          <SidebarGroup>
            <SidebarGroupLabel>Assessment Phases</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {getPhases(frameworkCount).map((phase) => (
                  <SidebarMenuItem key={phase.url}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={`/assessment/${assessmentId}/${phase.url}`}
                        className="hover:bg-sidebar-accent"
                        activeClassName="bg-sidebar-accent text-primary font-medium"
                      >
                        <phase.icon className="h-4 w-4 mr-2 shrink-0" />
                        {!collapsed && <span className="text-sm">{phase.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-border p-3">
        {!collapsed && profile && (
          <div className="mb-2 space-y-1">
            <p className="text-sm font-medium truncate">{profile.full_name || "User"}</p>
            <p className="text-xs text-muted-foreground truncate">{profile.organisation}</p>
            <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0", userRoleColor)}>
              {userRoleLabel}
            </Badge>
          </div>
        )}
        <Button variant="ghost" size="sm" className="w-full justify-start text-sidebar-foreground hover:text-destructive" onClick={signOut}>
          <LogOut className="h-4 w-4 mr-2 shrink-0" />
          {!collapsed && "Sign Out"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
