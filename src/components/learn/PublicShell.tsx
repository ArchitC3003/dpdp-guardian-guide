import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BrandLogo } from "@/components/BrandLogo";
import { FONT_BODY, LEARN_NAV_MIN_ITEMS, isLive } from "@/lib/content";

export function PublicShell({ children }: { children: React.ReactNode }) {
  const [showLearn, setShowLearn] = useState(false);
  useEffect(() => {
    supabase.from("content_posts").select("status,published_at,scheduled_for").in("status", ["published", "scheduled"]).neq("content_type", "landing").limit(200)
      .then(({ data }) => setShowLearn((data || []).filter((r) => isLive(r)).length >= LEARN_NAV_MIN_ITEMS));
  }, []);
  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: FONT_BODY }}>
      <header className="sticky top-0 z-30 border-b border-black/5 bg-white/90 backdrop-blur-xl">
        <nav className="lrn-wrap flex items-center justify-between py-[18px]" aria-label="Main">
          <BrandLogo />
          <div className="flex items-center gap-2 text-[13px]">
            {showLearn && <Link to="/learn" className="glass-hover rounded-md px-3.5 py-2.5 font-medium text-muted-foreground hover:text-foreground">Learn</Link>}
            <Link to="/auth" className="glow-hover rounded-[7px] bg-primary text-primary-foreground px-[18px] py-[9px] font-semibold">Sign in</Link>
          </div>
        </nav>
      </header>
      <main>{children}</main>
      <footer className="border-t border-border mt-20">
        <div className="lrn-wrap py-10 text-sm text-muted-foreground flex flex-wrap gap-6 justify-between">
          <span>© {new Date().getFullYear()} PrivcybHub, Pune, India</span>
          <div className="flex gap-5">
            <Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><Link to="/privacy-preferences">Privacy preferences</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
