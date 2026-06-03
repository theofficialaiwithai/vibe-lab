import { Link } from "react-router-dom";
import Layout from "@/components/Layout";

const CATEGORY_CARDS = [
  { num: "01", title: "AI Coding Tools", desc: "Claude Code, Codex, Replit Agent — and how to orchestrate them." },
  { num: "02", title: "Deployment & Hosting", desc: "Vercel, Cloudflare, Netlify. From local to live URL." },
  { num: "03", title: "Auth & Data", desc: "Clerk, Supabase, Neon. RLS and real data." },
  { num: "04", title: "UX Design Sourcing", desc: "Mobbin, Dribbble, 21st.dev. An eye for what ships." },
  { num: "05", title: "Product Thinking", desc: "PRDs, validation, Ideabrowser. Build what people want." },
];

const STACK_TOOLS = [
  "Vercel", "Supabase", "Clerk",
  "Neon", "21st.dev", "Cloudflare",
  "Mobbin", "Dribbble", "Ideabrowser",
];

const HUB_CARDS = [
  { label: "Video Tutorials", heading: "Hours of Claude Code masterclasses, distilled." },
  { label: "Cowork Skills", heading: "Reusable agent skills for PRDs, MCP, automation, and more." },
  { label: "Vibe Stack", heading: "The vetted tools: Vercel, Supabase, Clerk, Replit, Mobbin." },
];

function ProgressBar({ label, pct }: { label: string; pct: number }) {
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: "var(--foreground)", opacity: 0.6 }}>{label}</span>
        <span style={{ fontSize: 12, color: "var(--foreground)", opacity: 0.6, fontFamily: "monospace" }}>{pct}%</span>
      </div>
      <div style={{ height: 4, backgroundColor: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            backgroundColor: "var(--primary)",
            borderRadius: 2,
            transition: "width 0.6s ease",
          }}
        />
      </div>
    </div>
  );
}

const section: React.CSSProperties = {
  padding: "96px 24px",
  maxWidth: 1200,
  margin: "0 auto",
};

const btnPrimary: React.CSSProperties = {
  display: "inline-block",
  backgroundColor: "var(--primary)",
  color: "#ffffff",
  fontWeight: 700,
  fontSize: 15,
  padding: "14px 28px",
  borderRadius: 8,
  textDecoration: "none",
  whiteSpace: "nowrap",
};

const btnOutline: React.CSSProperties = {
  display: "inline-block",
  backgroundColor: "var(--surface)",
  color: "#ffffff",
  fontWeight: 700,
  fontSize: 15,
  padding: "14px 28px",
  borderRadius: 8,
  textDecoration: "none",
  border: "1px solid var(--border)",
  whiteSpace: "nowrap",
};

export default function Home() {
  return (
    <Layout>
      {/* ── SECTION 1: HERO ── */}
      <div style={{ backgroundColor: "var(--background)", textAlign: "center" }}>
        <div style={{ ...section, paddingBottom: 112 }}>
          {/* Badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 40 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 14px",
                borderRadius: 999,
                backgroundColor: "rgba(99,102,241,0.10)",
                border: "1px solid rgba(99,102,241,0.20)",
                color: "var(--primary)",
                fontSize: 11,
                fontFamily: "monospace",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: "var(--primary)",
                  display: "inline-block",
                  animation: "pulse 2s infinite",
                }}
              />
              v1.0 — Now Booting
            </span>
          </div>

          {/* Headline */}
          <h1
            style={{
              fontSize: "clamp(48px, 8vw, 88px)",
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              marginBottom: 28,
            }}
          >
            <span style={{ color: "#ffffff", display: "block" }}>CODE AT THE</span>
            <span style={{ color: "var(--primary)", display: "block" }}>SPEED OF VIBE.</span>
          </h1>

          {/* Subtitle */}
          <p
            style={{
              color: "var(--foreground)",
              opacity: 0.6,
              fontSize: 18,
              lineHeight: 1.65,
              maxWidth: 600,
              margin: "0 auto 48px",
            }}
          >
            Transition from syntax-obsessed to product-obsessed. Measure your AI-native development skills and unlock your personalized growth path.
          </p>

          {/* CTAs */}
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/assessment" style={btnPrimary}>Start Skills Assessment</Link>
            <Link to="/hub" style={btnOutline}>Browse Resource Hub</Link>
          </div>
        </div>
      </div>

      {/* ── SECTION 2: VIBE QUOTIENT ── */}
      <div style={{ backgroundColor: "var(--background)" }}>
        <div style={section}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 24,
              alignItems: "start",
            }}
          >
            {/* Left card */}
            <div
              style={{
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 16,
                padding: 32,
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  fontFamily: "monospace",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--primary)",
                  marginBottom: 14,
                }}
              >
                Personalized Scoring
              </p>
              <h2 style={{ fontSize: 28, fontWeight: 700, color: "#ffffff", marginBottom: 14, lineHeight: 1.2 }}>
                The Vibe Quotient
              </h2>
              <p style={{ color: "var(--foreground)", opacity: 0.6, fontSize: 15, lineHeight: 1.65, marginBottom: 32 }}>
                A 5-minute diagnostic across the modern vibe-coding stack. We score you per skill, then build your hub around your weakest categories.
              </p>
              <ProgressBar label="AI Tool Proficiency" pct={88} />
              <ProgressBar label="Product Thinking" pct={72} />
            </div>

            {/* Right: 2×3 grid of category cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              {CATEGORY_CARDS.map((c) => (
                <div
                  key={c.num}
                  style={{
                    backgroundColor: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    padding: "20px 18px",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "monospace",
                      fontSize: 11,
                      color: "var(--primary)",
                      marginBottom: 8,
                      opacity: 0.8,
                    }}
                  >
                    {c.num}
                  </p>
                  <p style={{ fontWeight: 700, fontSize: 13, color: "#ffffff", marginBottom: 6, lineHeight: 1.3 }}>
                    {c.title}
                  </p>
                  <p style={{ fontSize: 12, color: "var(--foreground)", opacity: 0.5, lineHeight: 1.5 }}>
                    {c.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 3: CURATED HUB PREVIEW ── */}
      <div style={{ backgroundColor: "var(--background)" }}>
        <div style={section}>
          {/* Header row */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 16,
              marginBottom: 40,
            }}
          >
            <div>
              <h2 style={{ fontSize: 36, fontWeight: 800, color: "#ffffff", marginBottom: 10 }}>Curated Hub</h2>
              <p style={{ color: "var(--foreground)", opacity: 0.6, fontSize: 15, lineHeight: 1.6, maxWidth: 520 }}>
                The signal amidst the noise. Zero-fluff tutorials, Cowork skills, and a vetted stack — all filtered by your level.
              </p>
            </div>
            <Link
              to="/hub"
              style={{
                color: "var(--primary)",
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              View All Resources →
            </Link>
          </div>

          {/* Three cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 20,
            }}
          >
            {HUB_CARDS.map((c) => (
              <div
                key={c.label}
                style={{
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  padding: 28,
                  minHeight: 200,
                }}
              >
                <p
                  style={{
                    fontFamily: "monospace",
                    fontSize: 11,
                    color: "var(--foreground)",
                    opacity: 0.5,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 14,
                  }}
                >
                  {c.label}
                </p>
                <p style={{ fontWeight: 700, fontSize: 18, color: "#ffffff", lineHeight: 1.35 }}>{c.heading}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── SECTION 4: VIBE STACK GRID ── */}
      <div style={{ backgroundColor: "var(--background)" }}>
        <div style={{ ...section, textAlign: "center" }}>
          <p
            style={{
              fontFamily: "monospace",
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "var(--foreground)",
              opacity: 0.5,
              marginBottom: 12,
            }}
          >
            Verified tools for high-velocity building
          </p>
          <h2 style={{ fontSize: 36, fontWeight: 800, color: "#ffffff", marginBottom: 48 }}>The Vibe Stack</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 14,
              marginBottom: 40,
            }}
          >
            {STACK_TOOLS.map((tool) => (
              <div
                key={tool}
                style={{
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  padding: "20px 16px",
                  fontWeight: 600,
                  fontSize: 14,
                  color: "#ffffff",
                }}
              >
                {tool}
              </div>
            ))}
          </div>

          <Link
            to="/hub"
            style={{
              ...btnOutline,
              fontSize: 13,
              padding: "10px 24px",
            }}
          >
            + View All
          </Link>
        </div>
      </div>

      {/* Pulsing dot keyframe */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }
      `}</style>
    </Layout>
  );
}
