import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Html, Lightformer, Sparkles, Float } from "@react-three/drei";
import * as THREE from "three";
import { ArrowLeft } from "lucide-react";
import type { ExposureLevel, SunburstNode } from "@/types/execute";
import { BAND, buildLeafSegments, type DonutSegment } from "./lotusSegments";

/* ---------- Lotus feel constants ---------- */
const BASE_LEN = 1.2;      // shortest petal
const LEN_GAIN = 1.6;      // extra length per unit of risk (0.3–1)
const OPEN = 1.05;         // resting tilt from vertical (rad)
const BLOOM = 0.35;        // extra opening on hover
const LIFT = 0.18;         // outward slide on hover
const SPIN = 0.09;         // auto-rotate rad/s
const BUD = 0.15;          // tilt a petal starts from, so each lotus opens like a bud

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

function Petal({ seg, angle, width, delay, hovered, picked, dim, drillable, onOver, onOut, onPick }: {
  seg: DonutSegment; angle: number; width: number; delay: number; hovered: boolean; picked: number; dim: boolean;
  drillable: boolean; onOver: () => void; onOut: () => void; onPick: () => void;
}) {
  const selected = picked > 0;
  const len = BASE_LEN + seg.risk * LEN_GAIN;
  const geom = useMemo(() => petalGeometry(len, width), [len, width]);
  useEffect(() => () => geom.dispose(), [geom]);
  const slide = useRef<THREE.Group>(null);
  const tilt = useRef<THREE.Group>(null);
  const mat = useRef<THREE.MeshPhysicalMaterial>(null);
  const age = useRef(0);

  useFrame((_, dt) => {
    const step = Math.min(dt, 0.05);
    age.current += step;
    // Staggered bloom: each petal waits its turn, then opens from the bud.
    const k = age.current < delay ? 0 : 1 - Math.exp(-(age.current < delay + 0.6 ? 6 : 10) * step);
    if (slide.current) {
      const out = hovered ? LIFT : selected ? LIFT * 0.6 : 0;
      slide.current.position.z += (out - slide.current.position.z) * k;
    }
    if (tilt.current) {
      const target = -(OPEN + (hovered ? BLOOM : selected ? 0.25 : 0));
      tilt.current.rotation.x += (target - tilt.current.rotation.x) * k;
    }
    if (mat.current) {
      const e = hovered ? 0.7 : selected ? 0.6 : dim ? 0.02 : 0.12;
      mat.current.emissiveIntensity += (e - mat.current.emissiveIntensity) * k;
      const o = dim && !selected ? 0.35 : 1;
      mat.current.opacity += (o - mat.current.opacity) * k;
    }
  });

  const tip = len * 0.9;
  const whole = seg.count === 1;
  return (
    <group rotation={[0, angle, 0]}>
      <group ref={slide}>
        <group ref={tilt} position={[0, 0, 0.35]} rotation={[-BUD, 0, 0]}>
          <mesh
            geometry={geom}
            castShadow
            onPointerOver={(e) => { e.stopPropagation(); onOver(); }}
            onPointerOut={(e) => { e.stopPropagation(); onOut(); }}
            onClick={(e) => { e.stopPropagation(); onPick(); }}
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
              <sphereGeometry args={[0.09, 16, 16]} />
              <meshBasicMaterial color="#5eead4" toneMapped={false} />
            </mesh>
          )}
          {selected && !hovered && (
            <Html position={[0, tip, 0.3]} center pointerEvents="none" zIndexRange={[10, 0]}>
              <div className="whitespace-nowrap rounded-full border border-primary/50 bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground shadow-lg">
                {whole ? "✓" : `✓ ${picked}/${seg.count}`}
              </div>
            </Html>
          )}
          {hovered && (
            <Html position={[0, tip, 0.3]} center pointerEvents="none" zIndexRange={[20, 0]}>
              <div className="min-w-[180px] max-w-[240px] rounded-xl border border-primary/40 bg-popover/90 px-3.5 py-2.5 text-xs text-popover-foreground shadow-2xl backdrop-blur-md">
                <p className="text-[10px] font-mono uppercase tracking-widest text-primary">{whole ? "Sub-sector" : "Sector"}</p>
                <p className="text-sm font-semibold leading-tight">{seg.name}</p>
                {seg.subtitle && <p className="mt-0.5 text-[11px] text-muted-foreground">{seg.subtitle}</p>}
                <div className="mt-2 flex items-center justify-between gap-3 font-mono">
                  <span className="text-muted-foreground">
                    {whole ? "DPDP exposure" : `${seg.count} sub-sectors${selected ? ` · ${picked} picked` : ""}`}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ background: seg.color, boxShadow: `0 0 8px ${seg.color}` }} />
                    {seg.exposure}
                  </span>
                </div>
                <p className="mt-2 border-t border-border/60 pt-1.5 text-[10px] text-muted-foreground">
                  {drillable ? "Click to open its sub-sectors" : `Click to ${selected ? "remove" : "add"}`}
                </p>
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

function Lotus({ segments, selectedIds, highlightIds, drillable, hover, setHover, paused, onPick }: {
  segments: DonutSegment[]; selectedIds: Set<string>; highlightIds: Set<string> | null; drillable: boolean;
  hover: number | null; setHover: (fn: (h: number | null) => number | null) => void;
  paused: boolean; onPick: (seg: DonutSegment) => void;
}) {
  const group = useRef<THREE.Group>(null);
  // Spin only while nobody is pointing at the scene, so petals hold still to be clicked.
  useFrame((_, dt) => {
    if (group.current && !paused && hover === null) group.current.rotation.y += Math.min(dt, 0.05) * SPIN;
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
        const matched = !highlightIds || ids.some((id) => highlightIds.has(id));
        return (
          <Petal
            key={seg.name + i}
            seg={seg}
            angle={(i / n) * Math.PI * 2}
            width={width}
            delay={i * (0.5 / n)}
            hovered={hover === i}
            dim={hover !== null ? hover !== i : !matched}
            drillable={drillable}
            picked={ids.filter((id) => selectedIds.has(id)).length}
            onOver={() => setHover(() => i)}
            onOut={() => setHover((h) => (h === i ? null : h))}
            onPick={() => onPick(seg)}
          />
        );
      })}
    </group>
  );
}

const TILT = (32 * Math.PI) / 180;
const DIST = 8.5;

export function IndustryDonut3D({ segments, selectedIds, onSelect, onToggleAll, onHover, highlightIds = null }: {
  segments: DonutSegment[]; selectedIds: Set<string>;
  /** A sub-sector petal was clicked. */
  onSelect: (n: SunburstNode, additive: boolean) => void;
  /** Add or remove every sub-sector of the open cluster. */
  onToggleAll: (n: SunburstNode) => void;
  onHover?: (node: SunburstNode | null, breadcrumb: string[]) => void;
  highlightIds?: Set<string> | null;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const [pointerIn, setPointerIn] = useState(false);
  // The cluster whose sub-sectors are bloomed open; null = all sectors.
  const [focus, setFocus] = useState<SunburstNode | null>(null);
  const shown = useMemo(() => (focus ? buildLeafSegments(focus) : segments), [focus, segments]);

  useEffect(() => {
    if (!onHover) return;
    const seg = hover !== null ? shown[hover] : null;
    if (!seg) { onHover(null, []); return; }
    const crumb = focus ? [focus.name, seg.node.industry?.Sector_Group ?? ""].filter(Boolean) : [seg.name];
    onHover(seg.node, crumb);
  }, [hover, shown, focus, onHover]);

  const openCluster = (node: SunburstNode | null) => {
    setHover(null);
    setFocus(node);
    if (node && onHover) onHover(node, [node.name]);
  };

  useEffect(() => {
    if (!focus) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") openCluster(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus]);

  const counts = useMemo(() => {
    const c: Record<ExposureLevel, number> = { High: 0, Medium: 0, Low: 0 };
    shown.forEach((s) => c[s.exposure]++);
    return c;
  }, [shown]);
  const active = hover !== null ? shown[hover] : null;
  const focusIds = focus?.leafIds ?? [];
  const focusPicked = focusIds.filter((id) => selectedIds.has(id)).length;

  return (
    <div
      className="relative h-[600px] w-full overflow-hidden rounded-xl border border-primary/20"
      style={{
        background:
          "radial-gradient(ellipse at 50% 55%, hsl(var(--primary) / 0.18), transparent 60%), radial-gradient(ellipse at 50% 120%, hsl(var(--accent) / 0.25), transparent 55%), hsl(var(--background))",
      }}
      data-scene-ready
      onPointerEnter={() => setPointerIn(true)}
      onPointerLeave={() => setPointerIn(false)}
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
          <Float speed={1.2} rotationIntensity={0} floatIntensity={0.15}>
            <group position={[0, -0.6, 0]}>
              <Lotus
                key={focus?.name ?? "__all"}
                segments={shown}
                selectedIds={selectedIds}
                highlightIds={highlightIds}
                drillable={!focus}
                hover={hover}
                setHover={setHover}
                paused={pointerIn}
                onPick={(seg) => (focus ? onSelect(seg.node, true) : openCluster(seg.node))}
              />
            </group>
          </Float>
        </Suspense>
        <ContactShadows position={[0, -1.1, 0]} opacity={0.55} scale={14} blur={2.6} far={4} color="#022c22" />
      </Canvas>

      {/* HUD */}
      <div className="absolute left-4 top-4 space-y-1">
        {focus ? (
          <button
            onClick={() => openCluster(null)}
            className="mb-1 inline-flex items-center gap-1 rounded-full border border-primary/40 bg-card/70 px-2.5 py-1 text-[11px] font-medium text-primary backdrop-blur hover:bg-card"
          >
            <ArrowLeft className="h-3 w-3" /> All sectors
          </button>
        ) : (
          <p className="pointer-events-none text-[10px] font-mono uppercase tracking-[0.25em] text-primary">Sector Lotus</p>
        )}
        <p className="pointer-events-none text-xl font-bold leading-none">
          {active ? active.name : focus ? focus.name : `${segments.length} sectors`}
        </p>
        <p className="pointer-events-none text-[11px] font-mono text-muted-foreground">
          {active
            ? `${active.exposure} DPDP exposure`
            : focus
              ? `${focusIds.length} sub-sectors · ${focusPicked} picked`
              : "Petal length = data-protection risk"}
        </p>
        {focus && (
          <button
            onClick={() => onToggleAll(focus)}
            className="mt-1 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground shadow hover:bg-primary/90"
          >
            {focusPicked === focusIds.length ? `Remove all of ${focus.name}` : `Add all ${focusIds.length}`}
          </button>
        )}
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
        {focus ? "Click sub-sectors to add or remove · Esc to go back" : "Click a sector to open it · pick as many as apply"}
      </p>
    </div>
  );
}
