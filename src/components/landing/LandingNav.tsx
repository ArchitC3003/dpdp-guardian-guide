import { Link } from "react-router-dom";
import { BrandLogo } from "@/components/BrandLogo";

export const LANDING_LOGO = { accent: "#d9623f", color: "#1b2420", fontFamily: "'Newsreader', Georgia, serif", fontSize: 22, fontWeight: 500 } as const;

export function LandingNav({ onStart }: { onStart: () => void }) {
  return (
    <nav className="lp-nav" aria-label="Main">
      <div className="lp-wrap">
        <BrandLogo showVersion={false} {...LANDING_LOGO} />
        <div className="lp-nav-links">
          <Link className="lp-link" to="/learn">Learn</Link>
          <Link className="lp-link" to="/auth">Sign in</Link>
          <button type="button" className="lp-btn lp-btn-primary lp-btn-sm" onClick={onStart}>Start an assessment</button>
        </div>
      </div>
    </nav>
  );
}
