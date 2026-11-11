import type { ReactNode } from "react";
import { Link } from "react-router-dom";

const ACCENT = "#2f7a57";
const STUDS = Array.from({ length: 12 }, (_, i) => (i * Math.PI) / 6);
const SPOKES = [0, 120, 240].map((deg) => (deg * Math.PI) / 180);
const at = (r: number, a: number) => `${(12 + r * Math.cos(a)).toFixed(2)} ${(12 + r * Math.sin(a)).toFixed(2)}`;

/** The PrivcybHub mark: a wheel, for the thing that sets a programme in motion. Drawn on a 24-unit grid around its centre. */
export function WheelMark({ size = 26, color = ACCENT }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" aria-hidden="true">
      <circle cx={12} cy={12} r={7.4} />
      <circle cx={12} cy={12} r={2.1} />
      <path d={SPOKES.map((a) => `M${at(2.1, a)} L${at(7.4, a)}`).join(" ")} />
      <path d={STUDS.map((a) => `M${at(8.6, a)} L${at(10.4, a)}`).join(" ")} />
    </svg>
  );
}

interface BrandLogoProps {
  to?: string;
  showVersion?: boolean;
  /** Overrides for surfaces with their own palette and type, such as the landing page. */
  accent?: string;
  color?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  /** Replaces the still wheel, for a surface that animates it. */
  mark?: ReactNode;
}

/** The PrivcybHub mark and wordmark, shared by the landing page and the public Learn pages so they stay identical. */
export function BrandLogo({ to = "/", showVersion = true, accent = ACCENT, color = "#111827", fontFamily = "'Syne', sans-serif", fontSize = 15, fontWeight = 700, mark }: BrandLogoProps) {
  return (
    <Link to={to} aria-label="PrivcybHub home" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color }}>
      {mark ?? <WheelMark color={accent} />}
      <span style={{ fontFamily, fontWeight, fontSize, letterSpacing: "-0.01em" }}>PrivcybHub</span>
      {showVersion && (
        <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 10, fontWeight: 700, color: accent, background: "#dfeee6", borderRadius: 99, padding: "2px 8px" }}>v3.0</span>
      )}
    </Link>
  );
}
