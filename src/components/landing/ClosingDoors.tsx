import { Link } from "react-router-dom";
import { BrandLogo } from "@/components/BrandLogo";
import { LANDING_LOGO } from "./LandingNav";

/** Two ways in: read without an account, or sign in and start working. */
export function ClosingDoors({ onStart }: { onStart: () => void }) {
  return (
    <section className="lp-close lp-on-band">
      <div className="lp-wrap">
        <div className="lp-door">
          <h3>Read the regulation.</h3>
          <p>Plain-language regulatory information for anyone. No account needed.</p>
          <Link className="lp-btn" to="/learn">Open the Learn hub</Link>
        </div>
        <div className="lp-door">
          <h3>Put it to work.</h3>
          <p>Sign in, find where you stand and build what is missing.</p>
          <button type="button" className="lp-btn lp-btn-primary" onClick={onStart}>Start an assessment</button>
        </div>
      </div>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="lp-foot">
      <div className="lp-wrap">
        <BrandLogo showVersion={false} {...LANDING_LOGO} />
        <nav aria-label="Legal">
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
        </nav>
      </div>
    </footer>
  );
}
