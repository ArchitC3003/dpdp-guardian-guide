import { useRef, type CSSProperties } from "react";
import { useInView } from "framer-motion";

const LINES: [string, string, string][] = [
  ["Regulation is", "written for lawyers", "written for practitioners."],
  ["It lives", "across every regulator's site", "in one repository."],
  ["Compliance runs", "on spreadsheets", "as one programme."],
];

/** The problem and the intent, set as an edited draft: the old state struck through, the new one written in. */
export function WhySection() {
  const ref = useRef<HTMLElement>(null);
  const seen = useInView(ref, { once: true, amount: 0.35 });
  return (
    <section ref={ref} className={`lp-why${seen ? " lp-play" : ""}`}>
      <div className="lp-wrap">
        {LINES.map(([lead, before, after], i) => (
          <p key={lead} className="lp-why-line" style={{ "--i": i } as CSSProperties}>
            {lead} <s>{before}</s> <ins>{after}</ins>
          </p>
        ))}
        <p className="lp-intent">That is why we are building PrivcybHub: a single source for privacy and cyber security regulation, translated into obligations your organisation can act on.</p>
      </div>
    </section>
  );
}
