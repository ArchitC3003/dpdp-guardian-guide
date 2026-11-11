import { Link } from "react-router-dom";
import { TrailScene } from "./TrailScene";

export function Hero({ onStart, onStage }: { onStart: () => void; onStage: (index: number) => void }) {
  return (
    <section className="lp-hero">
      <div className="lp-hero-copy">
        <h1>From complexity <em>to confidence.</em></h1>
        <p className="lp-lede">PrivcybHub translates privacy and cyber security regulation into clear obligations, then into a compliance programme you can operate and evidence.</p>
        <div className="lp-actions">
          <button type="button" className="lp-btn lp-btn-primary" onClick={onStart}>Start an assessment</button>
          <Link className="lp-btn" to="/learn">Browse the regulations</Link>
        </div>
      </div>
      <TrailScene onStage={onStage} />
    </section>
  );
}
