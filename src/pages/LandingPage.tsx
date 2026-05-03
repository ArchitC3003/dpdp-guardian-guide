import React, { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  Info,
  ClipboardCheck,
  PenLine,
  Zap,
  LayoutGrid,
  BookOpen,
} from "lucide-react";

const C = {
  accent: "#059669",
  accentDark: "#047857",
  accentLight: "#d1fae5",
  accentLighter: "#ecfdf5",
  bg: "#ffffff",
  surface: "#f7faf9",
  dark: "#0b1210",
  text: "#111827",
  muted: "#6b7280",
  border: "#e5e7eb",
  borderLight: "#f3f4f6",
};

const FONT_DISPLAY = "'Cormorant Garamond', serif";
const FONT_BODY = "'Syne', sans-serif";

const STAGES = [
  { num: "01", name: "Know", desc: "Understand your obligations under the DPDP Act 2023", Icon: Info },
  { num: "02", name: "Assess", desc: "88-requirement gap assessment with automated domain scoring", Icon: ClipboardCheck },
  { num: "03", name: "Build", desc: "AI generates audit-ready policies calibrated to your exact profile", Icon: PenLine },
  { num: "04", name: "Execute", desc: "Deploy controls, assign owners, run evidence workflows", Icon: Zap },
  { num: "05", name: "Manage", desc: "Live dashboards, policy lifecycle, board-level reporting", Icon: LayoutGrid },
  { num: "06", name: "Learn", desc: "Regulatory updates, enforcement intelligence, maturity evolution", Icon: BookOpen },
];

const CAPS = [
  {
    Icon: ClipboardCheck,
    title: "Assessment Engine",
    body: "Work through 88 DPDP requirements across 15 domains with structured scoring, evidence capture, and owner assignment. Six-phase methodology — zero ambiguity, full defensibility.",
    tag: "ASSESS → EXECUTE",
  },
  {
    Icon: PenLine,
    title: "AI Policy Builder",
    body: "Audit-ready policies, SOPs, DPIAs, and notices — calibrated to your sector, SDF classification, and processing activities. No templates. No placeholders. No rework.",
    tag: "BUILD → MANAGE",
  },
  {
    Icon: LayoutGrid,
    title: "Compliance Dashboard",
    body: "Real-time posture scoring, domain-wise heatmaps, risk distribution analysis, and exportable board reports. Your compliance story, told clearly to every stakeholder.",
    tag: "MANAGE → LEARN",
  },
];

const STATS = [
  { num: "88", label: "Statutory Requirements", desc: "Mapped across 15 compliance domains", accent: true },
  { num: "13", label: "Regulatory Frameworks", desc: "DPDP, GDPR, CERT-In, SEBI and more" },
  { num: "6", label: "Programme Stages", desc: "Know through Learn — full lifecycle" },
  { num: "AI", label: "Policy Generation", desc: "Audit-ready documents, no placeholders" },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [navScrolled, setNavScrolled] = useState(false);
  const [activeStage, setActiveStage] = useState(0);
  const [hoverNode, setHoverNode] = useState<number | null>(null);
  const [hoverCap, setHoverCap] = useState<number | null>(null);
  const [hoverStat, setHoverStat] = useState<number | null>(null);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [primaryHover, setPrimaryHover] = useState<string | null>(null);
  const [outlineHover, setOutlineHover] = useState(false);
  const [signInHover, setSignInHover] = useState(false);
  const [navStartHover, setNavStartHover] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const capRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const i = Number((e.target as HTMLElement).dataset.i);
            setRevealed((prev) => {
              const next = new Set(prev);
              next.add(i);
              return next;
            });
          }
        });
      },
      { threshold: 0.12 }
    );
    capRefs.current.forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const goAuth = () => navigate(session ? "/dashboard" : "/auth");

  const heroPad = isMobile ? "120px 28px 60px" : "148px 60px 100px";
  const navPad = isMobile ? "16px 24px" : "18px 60px";
  const journeyPad = isMobile ? "60px 24px 70px" : "90px 60px 100px";
  const capsPad = isMobile ? "72px 24px" : "96px 60px";
  const ctaPad = isMobile ? "70px 24px 80px" : "80px 60px 96px";
  const footerPad = isMobile ? "24px" : "30px 60px";

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: FONT_BODY, minHeight: "100vh" }}>
      {/* NAV */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 200,
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: `1px solid ${C.borderLight}`,
          padding: navPad,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: navScrolled ? "0 2px 18px rgba(0,0,0,0.05)" : "none",
          transition: "box-shadow .25s ease",
        }}
      >
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: C.text }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2 L21 7 V17 L12 22 L3 17 V7 Z"
              fill={C.accent}
              fillOpacity={0.12}
              stroke={C.accent}
              strokeWidth={1.5}
              strokeLinejoin="round"
            />
          </svg>
          <span style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 15, letterSpacing: "-0.01em" }}>
            PrivcybHub
          </span>
          <span
            style={{
              fontFamily: FONT_BODY,
              fontSize: 10,
              fontWeight: 700,
              color: C.accent,
              background: C.accentLight,
              borderRadius: 99,
              padding: "2px 8px",
            }}
          >
            v3.0
          </span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => navigate("/auth")}
            onMouseEnter={() => setSignInHover(true)}
            onMouseLeave={() => setSignInHover(false)}
            style={{
              fontFamily: FONT_BODY,
              fontSize: 13,
              fontWeight: 500,
              color: C.muted,
              background: signInHover ? C.borderLight : "transparent",
              border: "none",
              borderRadius: 7,
              padding: "9px 14px",
              cursor: "pointer",
              transition: "background .2s ease",
            }}
          >
            Sign In
          </button>
          <button
            onClick={goAuth}
            onMouseEnter={() => setNavStartHover(true)}
            onMouseLeave={() => setNavStartHover(false)}
            style={{
              fontFamily: FONT_BODY,
              fontSize: 13,
              fontWeight: 600,
              color: "#fff",
              background: navStartHover ? C.accentDark : C.accent,
              border: "none",
              borderRadius: 7,
              padding: "9px 18px",
              cursor: "pointer",
              transition: "background .2s ease",
            }}
          >
            Start Assessment →
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          padding: heroPad,
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1.1fr 0.9fr",
          gap: isMobile ? 0 : 60,
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 12, marginBottom: 26 }}>
            <span style={{ display: "inline-block", width: 28, height: 1.5, background: C.accent }} />
            <span
              style={{
                fontFamily: FONT_BODY,
                fontSize: 11,
                fontWeight: 700,
                color: C.accent,
                textTransform: "uppercase",
                letterSpacing: "0.18em",
              }}
            >
              DPDP Act 2023 Compliance
            </span>
          </div>
          <h1
            style={{
              fontFamily: FONT_DISPLAY,
              fontWeight: 500,
              fontSize: "clamp(50px, 5.5vw, 76px)",
              lineHeight: 1.04,
              letterSpacing: "-0.03em",
              color: C.text,
              margin: "0 0 26px 0",
            }}
          >
            Compliance isn't a project. It's a{" "}
            <em style={{ fontStyle: "italic", color: C.accent }}>discipline.</em>
          </h1>
          <p
            style={{
              fontFamily: FONT_BODY,
              fontSize: 16,
              fontWeight: 400,
              color: C.muted,
              lineHeight: 1.75,
              maxWidth: 460,
              margin: "0 0 42px 0",
            }}
          >
            PrivcybHub gives Indian organisations the system, structure, and intelligence to own their DPDP programme — from{" "}
            <strong style={{ color: C.text, fontWeight: 600 }}>first assessment</strong> to{" "}
            <strong style={{ color: C.text, fontWeight: 600 }}>continuous readiness</strong>.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              onClick={goAuth}
              onMouseEnter={() => setPrimaryHover("hero")}
              onMouseLeave={() => setPrimaryHover(null)}
              style={{
                fontFamily: FONT_BODY,
                fontSize: 14,
                fontWeight: 600,
                color: "#fff",
                background: primaryHover === "hero" ? C.accentDark : C.accent,
                border: "none",
                borderRadius: 8,
                padding: "13px 26px",
                cursor: "pointer",
                transform: primaryHover === "hero" ? "translateY(-2px)" : "translateY(0)",
                boxShadow: primaryHover === "hero" ? "0 10px 28px rgba(5,150,105,.24)" : "none",
                transition: "all .25s ease",
              }}
            >
              Start Free Assessment →
            </button>
            <button
              onClick={() => {
                document.getElementById("journey")?.scrollIntoView({ behavior: "smooth" });
              }}
              onMouseEnter={() => setOutlineHover(true)}
              onMouseLeave={() => setOutlineHover(false)}
              style={{
                fontFamily: FONT_BODY,
                fontSize: 14,
                fontWeight: 500,
                color: C.text,
                background: outlineHover ? C.surface : "transparent",
                border: `1.5px solid ${outlineHover ? C.text : C.border}`,
                borderRadius: 8,
                padding: "13px 26px",
                cursor: "pointer",
                transition: "all .2s ease",
              }}
            >
              See How It Works
            </button>
          </div>
        </div>

        {!isMobile && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {STATS.map((s, i) => {
              const isAccent = !!s.accent;
              const hover = hoverStat === i;
              return (
                <div
                  key={i}
                  onMouseEnter={() => setHoverStat(i)}
                  onMouseLeave={() => setHoverStat(null)}
                  style={{
                    background: isAccent ? C.accent : C.bg,
                    border: `1.5px solid ${isAccent ? C.accent : hover ? "rgba(5,150,105,0.35)" : C.border}`,
                    borderRadius: 14,
                    padding: "24px 22px",
                    transform: hover ? "translateY(-3px)" : "translateY(0)",
                    boxShadow: hover && !isAccent ? "0 14px 30px rgba(0,0,0,.06)" : "none",
                    transition: "all .25s ease",
                  }}
                >
                  <div
                    style={{
                      fontFamily: FONT_DISPLAY,
                      fontWeight: 500,
                      fontSize: 44,
                      lineHeight: 1,
                      color: isAccent ? "#fff" : C.text,
                      marginBottom: 14,
                    }}
                  >
                    {s.num}
                  </div>
                  <div
                    style={{
                      fontFamily: FONT_BODY,
                      fontSize: 12,
                      fontWeight: 700,
                      color: isAccent ? "#fff" : C.text,
                      marginBottom: 6,
                      letterSpacing: "0.01em",
                    }}
                  >
                    {s.label}
                  </div>
                  <div
                    style={{
                      fontFamily: FONT_BODY,
                      fontSize: 11.5,
                      color: isAccent ? "rgba(255,255,255,0.7)" : C.muted,
                      lineHeight: 1.55,
                    }}
                  >
                    {s.desc}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* JOURNEY */}
      <section
        id="journey"
        style={{
          background: C.dark,
          padding: journeyPad,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 1,
            background: "linear-gradient(90deg, transparent, rgba(5,150,105,.3), transparent)",
          }}
        />
        <div style={{ maxWidth: 900, margin: "0 auto 70px", textAlign: "center" }}>
          <div
            style={{
              fontFamily: FONT_BODY,
              fontSize: 10.5,
              fontWeight: 700,
              color: C.accent,
              textTransform: "uppercase",
              letterSpacing: "0.22em",
              marginBottom: 18,
            }}
          >
            The Compliance Journey
          </div>
          <h2
            style={{
              fontFamily: FONT_DISPLAY,
              fontWeight: 500,
              fontSize: "clamp(34px, 3.8vw, 52px)",
              color: "#fff",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              margin: "0 0 20px 0",
            }}
          >
            Six stages. One <em style={{ fontStyle: "italic", color: C.accent }}>complete system.</em>
          </h2>
          <p
            style={{
              fontFamily: FONT_BODY,
              fontSize: 15,
              color: "rgba(255,255,255,0.45)",
              maxWidth: 500,
              margin: "0 auto",
              lineHeight: 1.75,
            }}
          >
            Most organisations jump straight to documentation. PrivcybHub structures your entire DPDP programme — from regulatory clarity to operational maturity.
          </p>
        </div>

        <div
          style={{
            position: "relative",
            maxWidth: 1100,
            margin: "0 auto",
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            gap: isMobile ? 18 : 0,
          }}
        >
          {!isMobile && (
            <div
              style={{
                position: "absolute",
                top: 27,
                left: "calc(8.33% + 28px)",
                right: "calc(8.33% + 28px)",
                height: 1,
                background:
                  "linear-gradient(90deg, rgba(5,150,105,.15), rgba(5,150,105,.4) 50%, rgba(5,150,105,.15))",
                zIndex: 0,
              }}
            />
          )}
          {STAGES.map((s, i) => {
            const active = activeStage === i || hoverNode === i;
            const Icon = s.Icon;
            return (
              <div
                key={s.num}
                onMouseEnter={() => {
                  setHoverNode(i);
                  setActiveStage(i);
                }}
                onMouseLeave={() => setHoverNode(null)}
                style={{
                  flex: isMobile ? "initial" : 1,
                  display: "flex",
                  flexDirection: isMobile ? "row" : "column",
                  alignItems: isMobile ? "flex-start" : "center",
                  gap: isMobile ? 16 : 0,
                  padding: isMobile ? 0 : "0 6px",
                  cursor: "pointer",
                  zIndex: 1,
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 14,
                    border: `1.5px solid ${active ? C.accent : "rgba(255,255,255,0.1)"}`,
                    background: active ? C.accent : "rgba(255,255,255,0.04)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: active ? "0 0 0 8px rgba(5,150,105,.12)" : "none",
                    transition: "all .3s ease",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={21} color={active ? "#fff" : "rgba(255,255,255,0.5)"} />
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: isMobile ? "flex-start" : "center",
                    textAlign: isMobile ? "left" : "center",
                    marginTop: isMobile ? 0 : 14,
                  }}
                >
                  <div
                    style={{
                      fontFamily: FONT_BODY,
                      fontSize: 10,
                      fontWeight: 700,
                      color: active ? C.accent : "rgba(5,150,105,0.6)",
                      letterSpacing: "0.22em",
                      marginBottom: 6,
                      transition: "color .25s ease",
                    }}
                  >
                    {s.num}
                  </div>
                  <div
                    style={{
                      fontFamily: FONT_BODY,
                      fontSize: 14,
                      fontWeight: 700,
                      color: "rgba(255,255,255,0.9)",
                      marginBottom: 6,
                    }}
                  >
                    {s.name}
                  </div>
                  <div
                    style={{
                      fontFamily: FONT_BODY,
                      fontSize: 11.5,
                      color: active ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.38)",
                      lineHeight: 1.65,
                      maxWidth: isMobile ? "100%" : 132,
                      textAlign: isMobile ? "left" : "center",
                      transition: "color .25s ease",
                    }}
                  >
                    {s.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CAPABILITIES */}
      <section style={{ maxWidth: 1240, margin: "0 auto", padding: capsPad }}>
        <div style={{ textAlign: "center", maxWidth: 760, margin: "0 auto 56px" }}>
          <div
            style={{
              fontFamily: FONT_BODY,
              fontSize: 10.5,
              fontWeight: 700,
              color: C.accent,
              textTransform: "uppercase",
              letterSpacing: "0.22em",
              marginBottom: 18,
            }}
          >
            What PrivcybHub Does
          </div>
          <h2
            style={{
              fontFamily: FONT_DISPLAY,
              fontWeight: 500,
              fontSize: "clamp(34px, 3.8vw, 52px)",
              color: C.text,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              margin: "0 0 18px 0",
            }}
          >
            Built for practitioners. Not <em style={{ fontStyle: "italic", color: C.accent }}>administrators.</em>
          </h2>
          <p
            style={{
              fontFamily: FONT_BODY,
              fontSize: 15,
              color: C.muted,
              maxWidth: 520,
              margin: "0 auto",
              lineHeight: 1.75,
            }}
          >
            Every feature moves you from uncertainty to documented, defensible compliance posture.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
            gap: 22,
          }}
        >
          {CAPS.map((c, i) => {
            const Icon = c.Icon;
            const hover = hoverCap === i;
            const isRevealed = revealed.has(i);
            return (
              <div
                key={i}
                ref={(el) => (capRefs.current[i] = el)}
                data-i={i}
                onMouseEnter={() => setHoverCap(i)}
                onMouseLeave={() => setHoverCap(null)}
                style={{
                  position: "relative",
                  border: `1.5px solid ${hover ? "rgba(5,150,105,0.25)" : C.border}`,
                  borderRadius: 16,
                  padding: "34px 30px",
                  background: C.bg,
                  overflow: "hidden",
                  transform: isRevealed ? (hover ? "translateY(-5px)" : "translateY(0)") : "translateY(20px)",
                  opacity: isRevealed ? 1 : 0,
                  boxShadow: hover ? "0 20px 48px rgba(0,0,0,.07)" : "none",
                  transition: `opacity .65s ease ${i * 100}ms, transform .65s ease ${i * 100}ms, border-color .25s ease, box-shadow .25s ease`,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: C.accent,
                    transform: hover ? "scaleX(1)" : "scaleX(0)",
                    transformOrigin: "left",
                    transition: "transform .35s ease",
                  }}
                />
                <div
                  style={{
                    width: 42,
                    height: 42,
                    background: C.accentLighter,
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 22,
                  }}
                >
                  <Icon size={18} color={C.accent} />
                </div>
                <h3
                  style={{
                    fontFamily: FONT_DISPLAY,
                    fontWeight: 500,
                    fontSize: 26,
                    color: C.text,
                    letterSpacing: "-0.01em",
                    margin: "0 0 12px 0",
                    lineHeight: 1.2,
                  }}
                >
                  {c.title}
                </h3>
                <p
                  style={{
                    fontFamily: FONT_BODY,
                    fontSize: 13.5,
                    color: C.muted,
                    lineHeight: 1.78,
                    margin: 0,
                  }}
                >
                  {c.body}
                </p>
                <div
                  style={{
                    fontFamily: FONT_BODY,
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: C.accent,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    marginTop: 22,
                  }}
                >
                  {c.tag}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          background: C.surface,
          borderTop: `1px solid ${C.border}`,
          padding: ctaPad,
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontFamily: FONT_DISPLAY,
            fontWeight: 500,
            fontSize: "clamp(38px, 4vw, 58px)",
            color: C.text,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            maxWidth: 640,
            margin: "0 auto 16px",
          }}
        >
          Your DPDP programme begins with one{" "}
          <em style={{ fontStyle: "italic", color: C.accent }}>honest assessment.</em>
        </h2>
        <p
          style={{
            fontFamily: FONT_BODY,
            fontSize: 15,
            color: C.muted,
            lineHeight: 1.7,
            margin: "0 auto 38px",
            maxWidth: 560,
          }}
        >
          Set up your organisation profile. Run your first gap assessment. Know exactly where you stand.
        </p>
        <button
          onClick={goAuth}
          onMouseEnter={() => setPrimaryHover("cta")}
          onMouseLeave={() => setPrimaryHover(null)}
          style={{
            fontFamily: FONT_BODY,
            fontSize: 14,
            fontWeight: 600,
            color: "#fff",
            background: primaryHover === "cta" ? C.accentDark : C.accent,
            border: "none",
            borderRadius: 8,
            padding: "13px 26px",
            cursor: "pointer",
            transform: primaryHover === "cta" ? "translateY(-2px)" : "translateY(0)",
            boxShadow: primaryHover === "cta" ? "0 10px 28px rgba(5,150,105,.24)" : "none",
            transition: "all .25s ease",
          }}
        >
          Get Started — It's Free →
        </button>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          padding: footerPad,
          borderTop: `1px solid ${C.borderLight}`,
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: isMobile ? 12 : 0,
        }}
      >
        <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: C.muted }}>
          © 2026 PrivcybHub. All rights reserved.
        </div>
        <div style={{ display: "flex", gap: 22 }}>
          {[
            { label: "Privacy Policy", to: "/privacy" },
            { label: "Terms of Service", to: "/terms" },
            { label: "Contact", to: "/privacy" },
          ].map((l) => (
            <Link
              key={l.label}
              to={l.to}
              style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: C.muted, textDecoration: "none" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = C.text)}
              onMouseLeave={(e) => (e.currentTarget.style.color = C.muted)}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </footer>
    </div>
  );
}