import { openConsentPreferences } from "@/lib/consent";
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
          <p>Regulatory guidance and analysis, open to everyone. No account required.</p>
          <Link className="lp-btn" to="/learn">Open the Learn hub</Link>
        </div>
        <div className="lp-door">
          <h3>Operationalise it.</h3>
          <p>Sign in to assess your compliance posture and remediate the gaps.</p>
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
          <button type="button" onClick={openConsentPreferences}>Privacy choices</button>
        </nav>
      </div>
    </footer>
  );
}
