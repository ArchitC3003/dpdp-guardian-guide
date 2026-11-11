import { Link } from "react-router-dom";

const ACCENT = "#059669";

interface BrandLogoProps {
  to?: string;
  showVersion?: boolean;
  /** Overrides for surfaces with their own palette and type, such as the landing page. */
  accent?: string;
  color?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
}

/** The PrivcybHub mark and wordmark, shared by the landing page and the public Learn pages so they stay identical. */
export function BrandLogo({ to = "/", showVersion = true, accent = ACCENT, color = "#111827", fontFamily = "'Syne', sans-serif", fontSize = 15, fontWeight = 700 }: BrandLogoProps) {
  return (
    <Link to={to} aria-label="PrivcybHub home" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color }}>
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 2 L21 7 V17 L12 22 L3 17 V7 Z" fill={accent} fillOpacity={0.12} stroke={accent} strokeWidth={1.5} strokeLinejoin="round" />
      </svg>
      <span style={{ fontFamily, fontWeight, fontSize, letterSpacing: "-0.01em" }}>PrivcybHub</span>
      {showVersion && (
        <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 10, fontWeight: 700, color: accent, background: "#d1fae5", borderRadius: 99, padding: "2px 8px" }}>v3.0</span>
      )}
    </Link>
  );
}
