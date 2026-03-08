import { useLocation, useNavigate, useParams } from "react-router-dom";
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
import { Cog, LayoutDashboard, ClipboardList, Share2, FolderOpen, Building2, FileText, Search, Grid3X3, Paperclip, BarChart3, LogOut, Settings2, Bot, Users, BookMarked } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const mainNav = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Assessments", url: "/assessments", icon: ClipboardList },
  { title: "Shared Reports", url: "/shared", icon: Share2 },
  { title: "Assessment Repository", url: "/repository", icon: FolderOpen },
  { title: "Artefact Repository", url: "/artefacts", icon: Building2 },
  { title: "Policy & SOP Builder", url: "/policy-sop-builder", icon: Bot },
  { title: "Policy Library", url: "/policy-library", icon: BookMarked },
  { title: "Settings", url: "/settings", icon: Settings2 },
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
  const navigate = useNavigate();

  const assessmentMatch = location.pathname.match(/\/assessment\/([^/]+)/);
  const assessmentId = assessmentMatch?.[1];

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
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-accent text-primary font-medium">
                      <item.icon className="h-4 w-4 mr-2 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {/* User Management — admin only */}
              {canManageUsers && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/settings/users" className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-accent text-primary font-medium">
                      <Users className="h-4 w-4 mr-2 shrink-0" />
                      {!collapsed && <span>User Management</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
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
