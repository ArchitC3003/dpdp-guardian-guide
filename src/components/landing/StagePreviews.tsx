import type { CSSProperties } from "react";
import type { StageKey } from "./stages";

const v = (vars: Record<string, string | number>) => vars as CSSProperties;

/** One obligation, shown as it passes through each stage. All content is illustrative. */
export const OBLIGATION = "Tell people when their data is breached.";

function Know() {
  return (
    <div className="lp-clear">
      <div className="lp-fog" aria-hidden="true">
        {[96, 88, 99, 74, 92, 81, 95, 60, 90, 70].map((w, i) => <i key={i} style={v({ "--w": `${w}%` })} />)}
      </div>
      <p className="lp-say">If personal data leaks, tell the regulator and every person affected.</p>
    </div>
  );
}

function Assess() {
  return (
    <div className="lp-ask">
      <strong>When personal data is breached, do you tell the people affected?</strong>
      <div className="lp-opts"><span>Always</span><span className="lp-picked">Sometimes</span><span>Not yet</span></div>
      <span className="lp-gap">Gap found: no set process</span>
    </div>
  );
}

function Build() {
  return (
    <div className="lp-doc">
      <h4>Breach response procedure</h4>
      <i style={v({ "--i": 0, "--w": "94%" })} /><i style={v({ "--i": 1, "--w": "82%" })} />
      <span className="lp-doc-line">Notify the regulator and each affected person.</span>
      <i style={v({ "--i": 4, "--w": "90%" })} /><i style={v({ "--i": 5, "--w": "58%" })} />
    </div>
  );
}

function Execute() {
  const rows: [string, string, boolean][] = [
    ["Approve the breach response procedure", "Legal", true],
    ["Keep the notification contact list current", "IT", true],
    ["Run a breach response drill", "Security", false],
  ];
  return (
    <div className="lp-ctl">
      {rows.map(([task, owner, done], i) => (
        <div key={task} style={v({ "--i": i })}>
          <span className={`lp-box${done ? " lp-box-done" : ""}`} aria-label={done ? "Done" : "Open"} role="img" />
          <span>{task}</span>
          <span className="lp-own">{owner}</span>
        </div>
      ))}
    </div>
  );
}

function Manage() {
  return (
    <div className="lp-board">
      <b>Gap</b><b>In progress</b><b>Met</b>
      <span>Vendor contracts</span><span>Retention schedule</span><span>Consent records</span>
      <span className="lp-me">Breach notice</span>
    </div>
  );
}

function Improve() {
  const rows: [string, string][] = [
    ["The drill found an out-of-date contact list", "Next: fix and re-run"],
    ["The regulator changed the notice format", "Next: update in Build"],
  ];
  return (
    <div className="lp-ctl lp-ctl-next">
      {rows.map(([finding, next], i) => (
        <div key={finding} style={v({ "--i": i })}><span>{finding}</span><span className="lp-own">{next}</span></div>
      ))}
    </div>
  );
}

const PREVIEWS: Record<StageKey, () => JSX.Element> = { know: Know, assess: Assess, build: Build, execute: Execute, manage: Manage, improve: Improve };

export function StagePreview({ stage }: { stage: StageKey }) {
  const Preview = PREVIEWS[stage];
  return <div className="lp-pv"><Preview /></div>;
}
