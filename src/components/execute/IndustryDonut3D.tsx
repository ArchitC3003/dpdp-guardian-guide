import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { ExposureLevel, SunburstNode } from "@/types/execute";

export interface DonutSegment {
  node: SunburstNode;
  name: string;
  count: number;
  share: number;
  exposure: ExposureLevel;
  color: string;
}

const RANK: Record<ExposureLevel, number> = { Low: 0, Medium: 1, High: 2 };
// Base HSL per DPDP exposure band; shades vary per sector within a band.
const BAND: Record<ExposureLevel, [number, number]> = { High: [0, 78], Medium: [38, 92], Low: [142, 65] };

function collectLeaves(n: SunburstNode, out: SunburstNode[] = []) {
  if (n.industry) out.push(n);
  (n.children ?? []).forEach((c) => collectLeaves(c, out));
  return out;
}

export function buildDonutSegments(tree: SunburstNode): DonutSegment[] {
  const clusters = tree.children ?? [];
  const raw = clusters.map((c) => {
    const leaves = collectLeaves(c);
    const exposure = leaves.reduce<ExposureLevel>(
      (m, l) => (RANK[l.industry!.DPDP_Exposure] > RANK[m] ? l.industry!.DPDP_Exposure : m),
      "Low",
    );
    return { node: c, name: c.name, count: leaves.length, exposure };
  });
  const total = raw.reduce((s, r) => s + r.count, 0) || 1;
  const bandIdx: Record<ExposureLevel, number> = { Low: 0, Medium: 0, High: 0 };
  const bandSize: Record<ExposureLevel, number> = { Low: 0, Medium: 0, High: 0 };
  raw.forEach((r) => bandSize[r.exposure]++);
  return raw.map((r) => {
    const [h, s] = BAND[r.exposure];
    const i = bandIdx[r.exposure]++;
    const n = Math.max(bandSize[r.exposure] - 1, 1);
    const l = 38 + (i / n) * 24;
    return { ...r, share: r.count / total, color: `hsl(${h}, ${s}%, ${l.toFixed(0)}%)` };
  });
}

const INNER = 1.3;
const OUTER = 2.4;
const DEPTH = 0.3;
const LIFT = 0.15;

function Slice({
  seg, start, end, hovered, selected, onOver, onOut, onPick,
}: {
  seg: DonutSegment; start: number; end: number; hovered: boolean; selected: boolean;
  onOver: () => void; onOut: () => void; onPick: (additive: boolean) => void;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const mid = (start + end) / 2;
  const geom = useMemo(() => {
    const pad = 0.012;
    const a0 = start + pad, a1 = end - pad;
    const s = new THREE.Shape();
    s.moveTo(Math.cos(a0) * OUTER, Math.sin(a0) * OUTER);
    s.absarc(0, 0, OUTER, a0, a1, false);
    s.lineTo(Math.cos(a1) * INNER, Math.sin(a1) * INNER);
    s.absarc(0, 0, INNER, a1, a0, true);
    s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: DEPTH, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2, curveSegments: 48 });
  }, [start, end]);
  useEffect(() => () => geom.dispose(), [geom]);

  useFrame((_, dt) => {
    if (!ref.current) return;
    const target = hovered ? LIFT : 0;
    const k = 1 - Math.exp(-12 * Math.min(dt, 0.05));
    ref.current.position.x += (Math.cos(mid) * target - ref.current.position.x) * k;
    ref.current.position.y += (Math.sin(mid) * target - ref.current.position.y) * k;
  });

  return (
    <mesh
      ref={ref}
      geometry={geom}
      onPointerOver={(e) => { e.stopPropagation(); onOver(); }}
      onPointerOut={(e) => { e.stopPropagation(); onOut(); }}
      onClick={(e) => { e.stopPropagation(); onPick(e.nativeEvent.metaKey || e.nativeEvent.ctrlKey); }}
    >
      <meshStandardMaterial
        color={seg.color}
        roughness={0.45}
        metalness={0.1}
        emissive={seg.color}
        emissiveIntensity={hovered ? 0.35 : selected ? 0.2 : 0.04}
      />
      {hovered && (
        <Html position={[Math.cos(mid) * (OUTER + 0.3), Math.sin(mid) * (OUTER + 0.3), DEPTH + 0.2]} center style={{ pointerEvents: "none" }}>
          <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg whitespace-nowrap">
            <p className="font-semibold">{seg.name}</p>
            <p className="font-mono text-muted-foreground">{(seg.share * 100).toFixed(1)}% share · {seg.count} sub-sectors</p>
            <p>DPDP exposure: <span className="font-semibold">{seg.exposure}</span></p>
          </div>
        </Html>
      )}
    </mesh>
  );
}

function Donut({ segments, selectedIds, onSelect }: {
  segments: DonutSegment[]; selectedIds: Set<string>; onSelect: (n: SunburstNode, additive: boolean) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const [hover, setHover] = useState<number | null>(null);
  useFrame((_, dt) => {
    if (group.current && hover === null) group.current.rotation.z += Math.min(dt, 0.05) * 0.12;
  });
  useEffect(() => {
    document.body.style.cursor = hover !== null ? "pointer" : "";
    return () => { document.body.style.cursor = ""; };
  }, [hover]);

  let acc = 0;
  return (
    <group ref={group} rotation={[-Math.PI / 2, 0, 0]}>
      {segments.map((seg, i) => {
        const start = acc * Math.PI * 2;
        acc += seg.share;
        const end = acc * Math.PI * 2;
        const ids = seg.node.leafIds ?? [];
        return (
          <Slice
            key={seg.name}
            seg={seg}
            start={start}
            end={end}
            hovered={hover === i}
            selected={ids.some((id) => selectedIds.has(id))}
            onOver={() => setHover(i)}
            onOut={() => setHover((h) => (h === i ? null : h))}
            onPick={(add) => onSelect(seg.node, add)}
          />
        );
      })}
    </group>
  );
}

const TILT = (25 * Math.PI) / 180;
const DIST = 7;

export function IndustryDonut3D({ segments, selectedIds, onSelect }: {
  segments: DonutSegment[]; selectedIds: Set<string>; onSelect: (n: SunburstNode, additive: boolean) => void;
}) {
  return (
    <div className="relative h-[560px] w-full" data-scene-ready>
      <Canvas camera={{ position: [0, Math.sin(TILT) * DIST, Math.cos(TILT) * DIST], fov: 45 }} dpr={[1, 2]}>
        <ambientLight intensity={0.55} />
        <directionalLight position={[4, 8, 5]} intensity={1.1} />
        <Suspense fallback={null}>
          <Donut segments={segments} selectedIds={selectedIds} onSelect={onSelect} />
        </Suspense>
      </Canvas>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <p className="text-3xl font-bold">{segments.length}</p>
          <p className="text-[10px] font-mono uppercase text-muted-foreground">sectors</p>
        </div>
      </div>
    </div>
  );
}
