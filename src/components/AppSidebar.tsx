import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
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
import { Cog, LayoutDashboard, ClipboardList, Share2, FolderOpen, Building2, FileText, Search, Grid3X3, Paperclip, BarChart3, LogOut, Settings2, Bot, Users, BookMarked, Shield, ScrollText, Scale, AlertTriangle, FileSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const mainNav = [
  { title: "Dashboard", subtitle: "Compliance overview & risk summary", url: "/dashboard", icon: LayoutDashboard },
  { title: "Assessments", subtitle: "Run DPDP gap & risk assessments", url: "/assessments", icon: ClipboardList },
  { title: "Shared Reports", subtitle: "Export & share compliance reports", url: "/shared", icon: Share2 },
  { title: "Assessment Repository", subtitle: "88 DPDP requirements with AI templates", url: "/repository", icon: FolderOpen },
  { title: "Artefact Repository", subtitle: "Org documents — Admin managed", url: "/artefacts", icon: Building2 },
  { title: "Policy & SOP Builder", subtitle: "AI-powered policy & SOP generator", url: "/policy-sop-builder", icon: Bot },
  { title: "Policy Register", subtitle: "Official policy lifecycle register", url: "/policy-library", icon: BookMarked },
  { title: "Settings", subtitle: "App configuration & preferences", url: "/settings", icon: Settings2 },
];

const consentUserNav = [
  { title: "Privacy Preferences", subtitle: "Manage consent & exercise rights", url: "/privacy-preferences", icon: Shield },
];

const consentAdminNav = [
  { title: "Consent Ledger", subtitle: "All consent receipts", url: "/consent/ledger", icon: ScrollText },
  { title: "Notice Manager", subtitle: "Create & publish notices", url: "/consent/notices", icon: FileText },
  { title: "Rights Desk", subtitle: "Data principal rights requests", url: "/consent/rights-desk", icon: Scale },
  { title: "Grievance Console", subtitle: "Complaints & grievances", url: "/consent/grievances", icon: AlertTriangle },
  { title: "Audit Log", subtitle: "Tamper-evident event log", url: "/consent/audit-log", icon: FileSearch },
];

const phases = [
  { title: "① Org Profile", url: "org-profile", icon: Building2 },
  { title: "② Policy Matrix", url: "policy-matrix", icon: FileText },
  { title: "③ Rapid Assessment", url: "rapid-assessment", icon: Search },
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

  const renderNavItem = (item: { title: string; subtitle: string; url: string; icon: any }) => (
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

        {/* Main Nav */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map(renderNavItem)}
              {canManageUsers && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink to="/settings/users" className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-accent text-primary font-medium">
                        <Users className="h-4 w-4 mr-2 shrink-0 self-start mt-0.5" />
                        {!collapsed && (
                          <div className="flex flex-col">
                            <span>User Management</span>
                            <span className="text-[10px] text-muted-foreground leading-tight">Manage team roles & access</span>
                          </div>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink to="/admin/ai-config" className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-accent text-primary font-medium">
                        <Bot className="h-4 w-4 mr-2 shrink-0 self-start mt-0.5" />
                        {!collapsed && (
                          <div className="flex flex-col">
                            <span>AI Configuration</span>
                            <span className="text-[10px] text-muted-foreground leading-tight">Manage AI prompts & training</span>
                          </div>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Consent & Rights — User Facing */}
        <SidebarGroup>
          <SidebarGroupLabel>Consent & Rights</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {consentUserNav.map(renderNavItem)}
              {canManageUsers && consentAdminNav.map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Assessment Phases */}
        {assessmentId && (
          <SidebarGroup>
            <SidebarGroupLabel>Assessment Phases</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {phases.map((phase) => (
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
