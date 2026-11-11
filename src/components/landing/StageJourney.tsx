import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { AnimatePresence, m, useInView, useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";
import { STAGES, isUpcoming, type Stage } from "./stages";
import { OBLIGATION, StagePreview } from "./StagePreviews";

const DESKTOP = "(min-width: 900px)";
const NAV_HEIGHT = 64;

function useDesktop() {
  const [desktop, setDesktop] = useState(() => typeof window !== "undefined" && window.matchMedia(DESKTOP).matches);
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP);
    const apply = () => setDesktop(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return desktop;
}

function Tag({ stage }: { stage: Stage }) {
  return <span className={`lp-tag${isUpcoming(stage.status) ? " lp-tag-soon" : ""}`}>{stage.status}</span>;
}

/** One stage: its line, its preview and its action. The preview plays once it is on screen. */
function StagePanel({ stage, onAction }: { stage: Stage; onAction: (stage: Stage) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { once: true, amount: 0.35 });
  return (
    <div ref={ref} className={`lp-stage${seen ? " lp-play" : ""}`} id={`stage-${stage.key}`}>
      <header><h3>{stage.name}</h3><Tag stage={stage} /><p>{stage.story}</p></header>
      <StagePreview stage={stage.key} />
      <footer>
        {stage.action ? (
          <>
            <button type="button" className="lp-btn lp-btn-primary lp-btn-sm" onClick={() => onAction(stage)}>{stage.action}</button>
            <span className="lp-route">{stage.open ? "Open access" : "Requires sign-in"}</span>
          </>
        ) : (
          <span className="lp-route">{stage.note}</span>
        )}
      </footer>
    </div>
  );
}

export interface StageJourneyHandle { goTo: (index: number) => void }

/**
 * The dark band. On wide screens it holds in place while the visitor scrolls through the six stages;
 * on narrow screens the stages are stacked and each preview plays as it comes into view.
 */
export const StageJourney = forwardRef<StageJourneyHandle, { onAction: (stage: Stage) => void }>(function StageJourney({ onAction }, handle) {
  const section = useRef<HTMLElement>(null);
  const desktop = useDesktop();
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({ target: section, offset: [`start ${NAV_HEIGHT}px`, "end end"] });
  useMotionValueEvent(scrollYProgress, "change", (p) => setActive(Math.min(STAGES.length - 1, Math.floor(p * STAGES.length))));

  const goTo = (index: number) => {
    const el = section.current;
    if (!el) return;
    const behavior: ScrollBehavior = reduce ? "auto" : "smooth";
    if (desktop) {
      const span = el.offsetHeight - (window.innerHeight - NAV_HEIGHT);
      window.scrollTo({ top: el.offsetTop - NAV_HEIGHT + (span * (index + 0.5)) / STAGES.length, behavior });
    } else {
      const target = document.getElementById(`stage-${STAGES[index].key}`);
      if (target) window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - NAV_HEIGHT - 12, behavior });
    }
  };
  useImperativeHandle(handle, () => ({ goTo }));

  const stage = STAGES[active];
  return (
    <section ref={section} className="lp-journey lp-on-band" id="journey" aria-label="The six stages">
      <div className="lp-pin">
        <div className="lp-wrap">
          <div className="lp-j-grid">
            <div className="lp-j-side">
              <h2>Trace one obligation from requirement to evidence.</h2>
              <div className="lp-j-list">
                <m.div className="lp-rail" style={{ scaleY: scrollYProgress }} />
                {STAGES.map((s, i) => (
                  <button key={s.key} type="button" aria-current={i === active ? "step" : undefined} onClick={() => goTo(i)}>
                    {s.name} <Tag stage={s} />
                  </button>
                ))}
              </div>
            </div>
            <div className="lp-j-main">
              <p className="lp-thread">The obligation <b>{OBLIGATION}</b></p>
              <div className="lp-panels">
                {desktop ? (
                  <AnimatePresence mode="wait" initial={false}>
                    <m.div key={stage.key} initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0, y: -10 }} transition={{ duration: 0.28, ease: "easeOut" }} style={{ position: "absolute", inset: 0, display: "flex" }}>
                      <StagePanel stage={stage} onAction={onAction} />
                    </m.div>
                  </AnimatePresence>
                ) : (
                  STAGES.map((s) => <StagePanel key={s.key} stage={s} onAction={onAction} />)
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});
