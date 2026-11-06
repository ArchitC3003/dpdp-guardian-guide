import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Html, Lightformer, Sparkles, Float } from "@react-three/drei";
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
// Base HSL per DPDP exposure band (cyber palette); shades vary per sector within a band.
const BAND: Record<ExposureLevel, [number, number]> = { High: [350, 82], Medium: [36, 95], Low: [162, 72] };

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
    const l = 42 + (i / n) * 22;
    return { ...r, share: r.count / total, color: `hsl(${h}, ${s}%, ${l.toFixed(0)}%)` };
  });
}

/* ---------- Lotus feel constants ---------- */
const BASE_LEN = 1.5;      // shortest petal
const LEN_GAIN = 9;        // extra length per unit share
const OPEN = 1.05;         // resting tilt from vertical (rad)
const BLOOM = 0.35;        // extra opening on hover
const LIFT = 0.18;         // outward slide on hover
const SPIN = 0.09;         // auto-rotate rad/s

function petalGeometry(len: number, width: number) {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(width, len * 0.25, width * 0.9, len * 0.75, 0, len);
  s.bezierCurveTo(-width * 0.9, len * 0.75, -width, len * 0.25, 0, 0);
  const g = new THREE.ExtrudeGeometry(s, {
    depth: 0.03, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 3, curveSegments: 32,
  });
  // Cup the petal: curve its surface along width and length.
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i);
    const t = y / len;
    p.setZ(i, p.getZ(i) + (x * x) * 0.55 - Math.sin(t * Math.PI) * 0.12 + t * t * 0.25);
  }
  g.computeVertexNormals();
  return g;
}

function Petal({ seg, angle, width, hovered, selected, dim, onOver, onOut, onPick }: {
  seg: DonutSegment; angle: number; width: number; hovered: boolean; selected: boolean; dim: boolean;
  onOver: () => void; onOut: () => void; onPick: (additive: boolean) => void;
}) {
  const len = BASE_LEN + seg.share * LEN_GAIN;
  const geom = useMemo(() => petalGeometry(len, width), [len, width]);
  useEffect(() => () => geom.dispose(), [geom]);
  const slide = useRef<THREE.Group>(null);
  const tilt = useRef<THREE.Group>(null);
  const mat = useRef<THREE.MeshPhysicalMaterial>(null);

  useFrame((_, dt) => {
    const k = 1 - Math.exp(-10 * Math.min(dt, 0.05));
    if (slide.current) slide.current.position.z += ((hovered ? LIFT : 0) - slide.current.position.z) * k;
    if (tilt.current) {
      const target = -(OPEN + (hovered ? BLOOM : selected ? 0.15 : 0));
      tilt.current.rotation.x += (target - tilt.current.rotation.x) * k;
    }
    if (mat.current) {
      const e = hovered ? 0.7 : selected ? 0.45 : dim ? 0.02 : 0.12;
      mat.current.emissiveIntensity += (e - mat.current.emissiveIntensity) * k;
      const o = dim ? 0.45 : 1;
      mat.current.opacity += (o - mat.current.opacity) * k;
    }
  });

  const tip = len * 0.9;
  return (
    <group rotation={[0, angle, 0]}>
      <group ref={slide}>
        <group ref={tilt} position={[0, 0, 0.35]} rotation={[-OPEN, 0, 0]}>
          <mesh
            geometry={geom}
            castShadow
            onPointerOver={(e) => { e.stopPropagation(); onOver(); }}
            onPointerOut={(e) => { e.stopPropagation(); onOut(); }}
            onClick={(e) => { e.stopPropagation(); onPick(e.nativeEvent.metaKey || e.nativeEvent.ctrlKey); }}
          >
            <meshPhysicalMaterial
              ref={mat}
              color={seg.color}
              emissive={seg.color}
              emissiveIntensity={0.12}
              roughness={0.28}
              metalness={0.05}
              clearcoat={1}
              clearcoatRoughness={0.15}
              sheen={1}
              sheenColor={seg.color}
              iridescence={0.35}
              transparent
              side={THREE.DoubleSide}
            />
          </mesh>
          {selected && (
            <mesh position={[0, tip, 0.12]}>
              <sphereGeometry args={[0.07, 16, 16]} />
              <meshBasicMaterial color="#5eead4" toneMapped={false} />
            </mesh>
          )}
          {hovered && (
            <Html position={[0, tip, 0.3]} center style={{ pointerEvents: "none" }} zIndexRange={[20, 0]}>
              <div className="min-w-[180px] rounded-xl border border-primary/40 bg-popover/90 px-3.5 py-2.5 text-xs text-popover-foreground shadow-2xl backdrop-blur-md">
                <p className="text-[10px] font-mono uppercase tracking-widest text-primary">Sector</p>
                <p className="text-sm font-semibold leading-tight">{seg.name}</p>
                <div className="mt-2 flex items-center justify-between gap-3 font-mono">
                  <span className="text-muted-foreground">{(seg.share * 100).toFixed(1)}% · {seg.count} sub</span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ background: seg.color, boxShadow: `0 0 8px ${seg.color}` }} />
                    {seg.exposure}
                  </span>
                </div>
              </div>
            </Html>
          )}
        </group>
      </group>
    </group>
  );
}

function Core({ pulse }: { pulse: boolean }) {
  const ring = useRef<THREE.Mesh>(null);
  const orb = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ring.current) ring.current.rotation.z = t * 0.6;
    if (orb.current) orb.current.scale.setScalar(1 + Math.sin(t * 2) * 0.05 + (pulse ? 0.08 : 0));
  });
  return (
    <group>
      <mesh ref={orb} position={[0, 0.35, 0]}>
        <icosahedronGeometry args={[0.42, 4]} />
        <meshPhysicalMaterial color="#14b8a6" emissive="#10b981" emissiveIntensity={1.4} roughness={0.1} clearcoat={1} toneMapped={false} />
      </mesh>
      <mesh ref={ring} position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.7, 0.018, 12, 96]} />
        <meshBasicMaterial color="#5eead4" toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.0, 1.04, 96]} />
        <meshBasicMaterial color="#10b981" transparent opacity={0.5} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Lotus({ segments, selectedIds, onSelect, hover, setHover }: {
  segments: DonutSegment[]; selectedIds: Set<string>; onSelect: (n: SunburstNode, additive: boolean) => void;
  hover: number | null; setHover: (fn: (h: number | null) => number | null) => void;
}) {
  const group = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (group.current && hover === null) group.current.rotation.y += Math.min(dt, 0.05) * SPIN;
  });
  useEffect(() => {
    document.body.style.cursor = hover !== null ? "pointer" : "";
    return () => { document.body.style.cursor = ""; };
  }, [hover]);

  const n = segments.length || 1;
  const width = Math.min(0.75, (Math.PI * 2 * 0.9) / n * 1.6);
  return (
    <group ref={group}>
      <Core pulse={hover !== null} />
      {segments.map((seg, i) => {
        const ids = seg.node.leafIds ?? [];
        return (
          <Petal
            key={seg.name}
            seg={seg}
            angle={(i / n) * Math.PI * 2}
            width={width}
            hovered={hover === i}
            dim={hover !== null && hover !== i}
            selected={ids.some((id) => selectedIds.has(id))}
            onOver={() => setHover(() => i)}
            onOut={() => setHover((h) => (h === i ? null : h))}
            onPick={(add) => onSelect(seg.node, add)}
          />
        );
      })}
    </group>
  );
}

const TILT = (32 * Math.PI) / 180;
const DIST = 8.5;

export function IndustryDonut3D({ segments, selectedIds, onSelect }: {
  segments: DonutSegment[]; selectedIds: Set<string>; onSelect: (n: SunburstNode, additive: boolean) => void;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const counts = useMemo(() => {
    const c: Record<ExposureLevel, number> = { High: 0, Medium: 0, Low: 0 };
    segments.forEach((s) => c[s.exposure]++);
    return c;
  }, [segments]);
  const active = hover !== null ? segments[hover] : null;

  return (
    <div
      className="relative h-[600px] w-full overflow-hidden rounded-xl border border-primary/20"
      style={{
        background:
          "radial-gradient(ellipse at 50% 55%, hsl(var(--primary) / 0.18), transparent 60%), radial-gradient(ellipse at 50% 120%, hsl(var(--accent) / 0.25), transparent 55%), hsl(var(--background))",
      }}
      data-scene-ready
    >
      {/* grid backdrop */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />
      <Canvas shadows camera={{ position: [0, Math.sin(TILT) * DIST + 1.5, Math.cos(TILT) * DIST], fov: 42 }} dpr={[1, 2]} gl={{ alpha: true, antialias: true }}>
        <ambientLight intensity={0.35} />
        <directionalLight position={[4, 9, 5]} intensity={1.3} castShadow shadow-mapSize={[1024, 1024]} />
        <pointLight position={[0, 1.2, 0]} intensity={6} distance={6} color="#14b8a6" />
        <Environment resolution={256}>
          <Lightformer intensity={2} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} />
          <Lightformer intensity={1.2} color="#2dd4bf" position={[-6, 2, 0]} rotation-y={Math.PI / 2} scale={[12, 2, 1]} />
          <Lightformer intensity={0.8} color="#fbbf24" position={[6, 1, 2]} rotation-y={-Math.PI / 2} scale={[8, 2, 1]} />
        </Environment>
        <Sparkles count={70} scale={[10, 4, 10]} size={2.2} speed={0.3} color="#5eead4" opacity={0.6} />
        <Suspense fallback={null}>
          <Float speed={1.2} rotationIntensity={0.08} floatIntensity={0.25}>
            <group position={[0, -0.6, 0]}>
              <Lotus segments={segments} selectedIds={selectedIds} onSelect={onSelect} hover={hover} setHover={setHover} />
            </group>
          </Float>
        </Suspense>
        <ContactShadows position={[0, -1.1, 0]} opacity={0.55} scale={14} blur={2.6} far={4} color="#022c22" />
      </Canvas>

      {/* HUD */}
      <div className="pointer-events-none absolute left-4 top-4 space-y-1">
        <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-primary">Sector Lotus</p>
        <p className="text-xl font-bold leading-none">{active ? active.name : `${segments.length} sectors`}</p>
        <p className="text-[11px] font-mono text-muted-foreground">
          {active ? `${(active.share * 100).toFixed(1)}% share · ${active.exposure} DPDP exposure` : "Petal length = share of sub-sectors"}
        </p>
      </div>
      <div className="pointer-events-none absolute right-4 top-4 flex gap-2">
        {(["High", "Medium", "Low"] as ExposureLevel[]).map((lvl) => (
          <div key={lvl} className="rounded-lg border border-border/60 bg-card/60 px-2.5 py-1.5 text-center backdrop-blur">
            <p className="text-base font-bold leading-none" style={{ color: `hsl(${BAND[lvl][0]}, ${BAND[lvl][1]}%, 58%)` }}>{counts[lvl]}</p>
            <p className="mt-0.5 text-[9px] font-mono uppercase tracking-wider text-muted-foreground">{lvl}</p>
          </div>
        ))}
      </div>
      <p className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        Click a petal to select · ⌘/Ctrl for multi-select
      </p>
    </div>
  );
}
