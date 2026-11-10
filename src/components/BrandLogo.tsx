import { Link } from "react-router-dom";

const ACCENT = "#059669";

/** The PrivcybHub mark and wordmark, shared by the landing page and the public Learn pages so they stay identical. */
export function BrandLogo({ to = "/", showVersion = true }: { to?: string; showVersion?: boolean }) {
  return (
    <Link to={to} aria-label="PrivcybHub home" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "#111827" }}>
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 2 L21 7 V17 L12 22 L3 17 V7 Z" fill={ACCENT} fillOpacity={0.12} stroke={ACCENT} strokeWidth={1.5} strokeLinejoin="round" />
      </svg>
      <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, letterSpacing: "-0.01em" }}>PrivcybHub</span>
      {showVersion && (
        <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 10, fontWeight: 700, color: ACCENT, background: "#d1fae5", borderRadius: 99, padding: "2px 8px" }}>v3.0</span>
      )}
    </Link>
  );
}
