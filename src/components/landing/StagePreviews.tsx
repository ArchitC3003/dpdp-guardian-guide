import type { CSSProperties } from "react";
import type { StageKey } from "./stages";

const v = (vars: Record<string, string | number>) => vars as CSSProperties;

/** One obligation, shown as it passes through each stage. All content is illustrative. */
export const OBLIGATION = "Notify the regulator and affected individuals of a personal data breach.";

function Know() {
  return (
    <div className="lp-clear">
      <div className="lp-fog" aria-hidden="true">
        {[96, 88, 99, 74, 92, 81, 95, 60, 90, 70].map((w, i) => <i key={i} style={v({ "--w": `${w}%` })} />)}
      </div>
      <p className="lp-say">On a personal data breach, notify the regulator and the affected individuals.</p>
    </div>
  );
}

function Assess() {
  return (
    <div className="lp-ask">
      <strong>Is there a documented process to notify affected individuals of a personal data breach?</strong>
      <div className="lp-opts"><span>Implemented</span><span className="lp-picked">Partially implemented</span><span>Not implemented</span></div>
      <span className="lp-gap">Gap identified: process not documented</span>
    </div>
  );
}

function Build() {
  return (
    <div className="lp-doc">
      <h4>Incident response procedure</h4>
      <i style={v({ "--i": 0, "--w": "94%" })} /><i style={v({ "--i": 1, "--w": "82%" })} />
      <span className="lp-doc-line">Notify the regulator and affected individuals.</span>
      <i style={v({ "--i": 4, "--w": "90%" })} /><i style={v({ "--i": 5, "--w": "58%" })} />
    </div>
  );
}

function Execute() {
  const rows: [string, string, boolean][] = [
    ["Approve the incident response procedure", "Legal", true],
    ["Maintain the breach notification contact register", "IT", true],
    ["Conduct a breach response tabletop exercise", "Security", false],
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
      <b>Gap</b><b>In remediation</b><b>Compliant</b>
      <span>Processor contracts</span><span>Retention schedule</span><span>Consent records</span>
      <span className="lp-me">Breach notification</span>
    </div>
  );
}

function Improve() {
  const rows: [string, string][] = [
    ["Tabletop exercise found an outdated contact register", "Corrective action: update and retest"],
    ["Regulator revised the notification format", "Corrective action: revise the procedure"],
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
