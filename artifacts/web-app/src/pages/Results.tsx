import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import Layout from "@/components/Layout";
import { levelLabel, levelTagline } from "@/lib/data/scoring";
import type { Result, CategoryScore, Level } from "@/lib/data/scoring";
import type { CategoryId } from "@/lib/data/questions";

// ── Stack recommendations ──────────────────────────────────────────
const STACKS: Record<Level, { name: string; tools: string; reason: string; firstStep: string; link: string }> = {
  beginner: {
    name: "Starter Stack",
    tools: "Replit",
    reason: "No setup required — build and deploy in one place. Perfect for your first shipped project.",
    firstStep: "Watch: How to Build Apps with Replit AI Agent",
    link: "https://www.youtube.com/watch?v=DaXQ5L7r7Lg",
  },
  intermediate: {
    name: "Core Stack",
    tools: "Vercel + Supabase + Clerk",
    reason: "You're ready for a real stack with best-in-class tools for each layer.",
    firstStep: "Watch: Deploy Vibe Coding Projects for Free",
    link: "https://www.youtube.com/watch?v=85JVKjW-uG0",
  },
  advanced: {
    name: "Power Stack",
    tools: "Vercel + Neon + Clerk + Claude Code",
    reason: "The full stack for intentional, high-velocity builders. Pair with Cowork Skills.",
    firstStep: "Watch: Advanced Claude Code",
    link: "https://youtu.be/UPtmKh1vMN8",
  },
};

// ── Weakest-area recommendations ──────────────────────────────────
const WEAK_REC: Record<CategoryId, { title: string; action: string; link: string; skill: string }> = {
  "ai-tools": {
    title: "AI Coding Tools",
    action: "Start with the Claude Code 4 Hour Course",
    link: "https://youtu.be/QoQBzR1NIqI",
    skill: "Install: code-build-copilot skill",
  },
  "deployment": {
    title: "Deployment & Hosting",
    action: "Watch: Deploy Vibe Coding Projects for Free",
    link: "https://www.youtube.com/watch?v=85JVKjW-uG0",
    skill: "Try: Vercel — connect a GitHub repo",
  },
  "auth-data": {
    title: "Auth & Data",
    action: "Watch: Supabase Full Course 2025",
    link: "https://www.youtube.com/watch?v=kyphLGnSz6Q",
    skill: "Install: mcp-assistant skill",
  },
  "ux-design": {
    title: "UX Design Sourcing",
    action: "Explore Mobbin + 21st.dev before your next build",
    link: "https://mobbin.com",
    skill: "Reference: Dribbble for layout inspiration",
  },
  "product": {
    title: "Product Thinking",
    action: "Install the PRD Assistant skill",
    link: "https://github.com/theofficialaiwithai/cowork-skills/tree/main/skills/prd-assistant",
    skill: "Validate first: browse Ideabrowser",
  },
};

// ── Score colour ──────────────────────────────────────────────────
function scoreColor(score: number): string {
  if (score >= 70) return "var(--success)";
  if (score >= 40) return "var(--primary)";
  return "#f97316";
}

// ── Shared style helpers ──────────────────────────────────────────
const pillStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "6px 14px",
  borderRadius: 999,
  backgroundColor: "rgba(99,102,241,0.10)",
  border: "1px solid rgba(99,102,241,0.20)",
  color: "var(--primary)",
  fontSize: 11,
  fontFamily: "monospace",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const card: React.CSSProperties = {
  backgroundColor: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 16,
  padding: 24,
};

const btnPrimary: React.CSSProperties = {
  display: "inline-block",
  backgroundColor: "var(--primary)",
  color: "#ffffff",
  fontWeight: 700,
  fontSize: 15,
  padding: "13px 28px",
  borderRadius: 8,
  textDecoration: "none",
};

const btnOutline: React.CSSProperties = {
  display: "inline-block",
  backgroundColor: "var(--surface)",
  color: "#ffffff",
  fontWeight: 700,
  fontSize: 15,
  padding: "13px 28px",
  borderRadius: 8,
  textDecoration: "none",
  border: "1px solid var(--border)",
};

// ── Category progress row ─────────────────────────────────────────
function CategoryRow({ cat }: { cat: CategoryScore }) {
  const color = scoreColor(cat.score);
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 14, color: "var(--foreground)", fontWeight: 500 }}>{cat.label}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color, fontFamily: "monospace" }}>{cat.score}%</span>
      </div>
      <div style={{ height: 4, backgroundColor: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${cat.score}%`, backgroundColor: color, borderRadius: 2 }} />
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────
export default function Results() {
  const navigate = useNavigate();
  const [result, setResult] = useState<Result | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("vibelab:result");
      if (raw) setResult(JSON.parse(raw) as Result);
    } catch {
      // malformed JSON — leave result null
    }
    setLoaded(true);
  }, []);

  // Not yet checked storage
  if (!loaded) return null;

  // Fallback: no data
  if (!result) {
    return (
      <Layout>
        <div
          style={{
            minHeight: "calc(100vh - 56px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
            textAlign: "center",
            padding: "40px 24px",
          }}
        >
          <p style={{ color: "var(--foreground)", opacity: 0.6, fontSize: 18 }}>No result found.</p>
          <Link to="/assessment" style={btnPrimary}>Take the Assessment →</Link>
        </div>
      </Layout>
    );
  }

  const stack = STACKS[result.level as Level];
  const radarData = result.scores.map((s) => ({ subject: s.short, score: s.score, fullMark: 100 }));

  return (
    <Layout>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "60px 24px 100px" }}>

        {/* ── BLOCK 1: Header ── */}
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ marginBottom: 20 }}>
            <span style={pillStyle}>{levelLabel(result.level as Level)}</span>
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "#ffffff", marginBottom: 12 }}>
            Your Vibe Quotient
          </h1>
          <div style={{ fontSize: 72, fontWeight: 800, color: "var(--primary)", lineHeight: 1, marginBottom: 16 }}>
            {result.overall}%
          </div>
          <p style={{ color: "var(--foreground)", opacity: 0.6, fontSize: 17, lineHeight: 1.6, maxWidth: 520, margin: "0 auto" }}>
            {levelTagline(result.level as Level)}
          </p>
        </div>

        {/* ── BLOCK 2: Radar Chart ── */}
        <div style={{ ...card, marginBottom: 24 }}>
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={radarData} margin={{ top: 16, right: 32, bottom: 16, left: 32 }}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: "var(--foreground)", fontSize: 13, opacity: 0.8 }}
              />
              <Radar
                dataKey="score"
                stroke="var(--primary)"
                fill="var(--primary)"
                fillOpacity={0.15}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* ── BLOCK 3: Category Scores ── */}
        <div style={{ ...card, marginBottom: 24 }}>
          {result.scores.map((cat) => (
            <CategoryRow key={cat.id} cat={cat} />
          ))}
        </div>

        {/* ── BLOCK 4: Recommended Stack ── */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#ffffff", marginBottom: 16 }}>
            Your Recommended Stack
          </h2>
          <div
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid rgba(99,102,241,0.30)",
              borderRadius: 16,
              padding: 24,
            }}
          >
            <p style={{ fontFamily: "monospace", fontSize: 11, color: "var(--foreground)", opacity: 0.5, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
              {stack.name}
            </p>
            <p style={{ fontSize: 22, fontWeight: 700, color: "#ffffff", marginBottom: 12 }}>{stack.tools}</p>
            <p style={{ color: "var(--foreground)", opacity: 0.65, fontSize: 15, lineHeight: 1.6, marginBottom: 16 }}>
              {stack.reason}
            </p>
            <a
              href={stack.link}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--primary)", fontSize: 14, fontWeight: 600, textDecoration: "none" }}
            >
              ▶ {stack.firstStep}
            </a>
          </div>
        </div>

        {/* ── BLOCK 5: Weakest Area Callouts ── */}
        <div style={{ marginBottom: 56 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#ffffff", marginBottom: 16 }}>
            Your Biggest Opportunities
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            {result.weakest.map((catId) => {
              const rec = WEAK_REC[catId as CategoryId];
              if (!rec) return null;
              return (
                <div key={catId} style={{ ...card, borderRadius: 12 }}>
                  <p style={{ fontWeight: 700, fontSize: 15, color: "#ffffff", marginBottom: 12 }}>{rec.title}</p>
                  <a
                    href={rec.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "var(--primary)", fontSize: 14, fontWeight: 500, textDecoration: "none", display: "block", marginBottom: 10 }}
                  >
                    → {rec.action}
                  </a>
                  <p style={{ fontSize: 12, color: "var(--foreground)", opacity: 0.45, fontFamily: "monospace" }}>
                    {rec.skill}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── BLOCK 6: CTA Row ── */}
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 12, color: "var(--foreground)", opacity: 0.4, fontFamily: "monospace", marginBottom: 20 }}>
            Your results are saved locally in your browser.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/hub" style={btnPrimary}>Browse Your Hub →</Link>
            <button
              onClick={() => navigate("/assessment")}
              style={{ ...btnOutline, cursor: "pointer" }}
            >
              Retake Assessment
            </button>
          </div>
        </div>

      </div>
    </Layout>
  );
}
