import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import type { SunburstNode } from "@/types/execute";
import { SunburstChart } from "./SunburstChart";
import { buildDonutSegments } from "./lotusSegments";

const IndustryDonut3D = lazy(() => import("./IndustryDonut3D").then((m) => ({ default: m.IndustryDonut3D })));

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch {
    return false;
  }
}

interface Props {
  tree: SunburstNode;
  selectedIds: Set<string>;
  onHover: (node: SunburstNode | null, breadcrumb: string[]) => void;
  onClick: (node: SunburstNode, additive: boolean) => void;
  /** Add or remove every sub-sector under a node. */
  onToggleAll: (node: SunburstNode) => void;
  /** Sector ids to keep lit (e.g. search matches); null = no highlight. */
  highlightIds?: Set<string> | null;
}

/** 3D lotus on capable desktops; falls back to the 2D sunburst when WebGL is missing or width < 768px. */
export function IndustryChart({ tree, selectedIds, onHover, onClick, onToggleAll, highlightIds = null }: Props) {
  const segments = useMemo(() => buildDonutSegments(tree), [tree]);
  const [use3D, setUse3D] = useState(false);

  useEffect(() => {
    const gl = hasWebGL();
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setUse3D(gl && mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const fallback = <SunburstChart tree={tree} selectedIds={selectedIds} onHover={onHover} onClick={onClick} size={640} />;

  return (
    <div className="space-y-4">
      {use3D ? (
        <Suspense fallback={fallback}>
          <IndustryDonut3D
            segments={segments}
            selectedIds={selectedIds}
            onSelect={onClick}
            onToggleAll={onToggleAll}
            onHover={onHover}
            highlightIds={highlightIds}
          />
        </Suspense>
      ) : (
        <div className="overflow-x-auto">{fallback}</div>
      )}

      {use3D && (
        <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px]" aria-hidden="true">
          {segments.map((s) => (
            <li key={s.name} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
              <span>{s.name}</span>
              <span className="font-mono text-muted-foreground">{s.exposure}</span>
            </li>
          ))}
        </ul>
      )}

      <table className="sr-only">
        <caption>Industry sectors by number of sub-sectors and DPDP exposure</caption>
        <thead>
          <tr><th scope="col">Sector</th><th scope="col">Sub-sectors</th><th scope="col">DPDP exposure</th></tr>
        </thead>
        <tbody>
          {segments.map((s) => (
            <tr key={s.name}>
              <th scope="row">{s.name}</th>
              <td>{s.count}</td>
              <td>{s.exposure}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
