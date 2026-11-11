import { Link } from "react-router-dom";
import { m, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { BrandLogo, WheelMark } from "@/components/BrandLogo";

const WHEEL_GREEN = "#2f7a57";
export const LANDING_LOGO = { accent: WHEEL_GREEN, color: "#1b2420", fontFamily: "'Newsreader', Georgia, serif", fontSize: 22, fontWeight: 500 } as const;

/** The wheel turns as the page scrolls: it is what sets the programme in motion. */
function TurningWheel() {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const rotate = useTransform(scrollY, (y) => (reduce ? 0 : y * 0.12));
  return <m.span style={{ rotate, display: "flex" }}><WheelMark color={WHEEL_GREEN} /></m.span>;
}

export function LandingNav({ onStart }: { onStart: () => void }) {
  return (
    <nav className="lp-nav" aria-label="Main">
      <div className="lp-wrap">
        <BrandLogo showVersion={false} {...LANDING_LOGO} mark={<TurningWheel />} />
        <div className="lp-nav-links">
          <Link className="lp-link" to="/learn">Learn</Link>
          <Link className="lp-link" to="/auth">Sign in</Link>
          <button type="button" className="lp-btn lp-btn-primary lp-btn-sm" onClick={onStart}>Start an assessment</button>
        </div>
      </div>
    </nav>
  );
}
