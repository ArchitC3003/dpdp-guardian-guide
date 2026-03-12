import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { SessionTimeout } from "./SessionTimeout";
import { PrivacyAssistant } from "./PrivacyAssistant";

export function AppLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center border-b border-border px-4 shrink-0">
            <SidebarTrigger />
          </header>
          <main className="flex-1 overflow-auto">
            <div className="max-w-[1200px] mx-auto p-6 animate-fade-in">
              <Outlet />
            </div>
          </main>
          <footer className="border-t border-border px-6 py-3 flex items-center justify-center gap-4 text-xs text-muted-foreground shrink-0">
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Privacy Policy</a>
            <span>·</span>
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Terms of Service</a>
            <span>·</span>
            <span>© {new Date().getFullYear()} PrivcybHub</span>
          </footer>
        </div>
      </div>
      <SessionTimeout />
    </SidebarProvider>
  );
}
