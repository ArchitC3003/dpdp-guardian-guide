import { Link } from "react-router-dom";
import { FONT_BODY } from "@/lib/content";

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: FONT_BODY }}>
      <header className="border-b border-border sticky top-0 z-30 bg-background/90 backdrop-blur">
        <nav className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between" aria-label="Main">
          <Link to="/" className="font-bold tracking-tight">PrivcybHub</Link>
          <div className="flex items-center gap-6 text-sm">
            <Link to="/learn" className="text-muted-foreground hover:text-foreground">Learn</Link>
            <Link to="/auth" className="rounded-md bg-primary text-primary-foreground px-4 py-2 font-medium">Sign in</Link>
          </div>
        </nav>
      </header>
      <main>{children}</main>
      <footer className="border-t border-border mt-20">
        <div className="max-w-6xl mx-auto px-5 py-10 text-sm text-muted-foreground flex flex-wrap gap-6 justify-between">
          <span>© {new Date().getFullYear()} PrivcybHub, Pune, India</span>
          <div className="flex gap-5">
            <Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><Link to="/privacy-preferences">Privacy preferences</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
