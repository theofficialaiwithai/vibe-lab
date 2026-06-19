import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useUser, SignInButton } from "@clerk/react";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import Layout from "@/components/Layout";
import BuildChallenge from "@/components/BuildChallenge";
import { levelLabel, levelTagline, isBorderline } from "@/lib/data/scoring";
import type { Result, CategoryScore, Level } from "@/lib/data/scoring";
import type { CategoryId } from "@/lib/data/questions";
import { sql } from "@/lib/db";

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

// ── Level confirmation helpers ────────────────────────────────────
const LEVELS: Level[] = ["beginner", "intermediate", "advanced"];

function shiftLevel(l: Level, dir: "accurate" | "up" | "down"): Level {
  if (dir === "accurate") return l;
  const idx = LEVELS.indexOf(l);
  return dir === "up" ? LEVELS[Math.min(idx + 1, 2)] : LEVELS[Math.max(idx - 1, 0)];
}

function readConfirmedLevel(fallback: Level): Level {
  try {
    const raw = localStorage.getItem("vibelab:result");
    if (raw) {
      const saved = JSON.parse(raw) as { confirmedLevel?: Level };
      if (saved.confirmedLevel) return saved.confirmedLevel;
    }
  } catch { /* ignore */ }
  return fallback;
}

// ── Level confirmation component ──────────────────────────────────
function LevelConfirmation({
  aiLevel,
  overall: _overall,
  borderline,
  onConfirm,
}: {
  aiLevel: Level;
  overall: number;
  borderline: boolean;
  onConfirm: (level: Level) => void;
}) {
  const [choice, setChoice] = useState<"accurate" | "up" | "down" | null>(null);
  const [feedback, setFeedback] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmedLevel, setConfirmedLevel] = useState<Level>(aiLevel);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("vibelab:result");
      if (!raw) return;
      const saved = JSON.parse(raw) as {
        confirmedLevel?: Level;
        aiRecommendedLevel?: Level;
        userFeedbackText?: string;
      };
      if (!saved.confirmedLevel) return;
      setConfirmedLevel(saved.confirmedLevel);
      setFeedback(saved.userFeedbackText ?? "");
      setConfirmed(true);
      const ai = saved.aiRecommendedLevel ?? aiLevel;
      const aIdx = LEVELS.indexOf(ai);
      const cIdx = LEVELS.indexOf(saved.confirmedLevel);
      setChoice(aIdx === cIdx ? "accurate" : cIdx > aIdx ? "up" : "down");
    } catch { /* ignore */ }
  }, [aiLevel]);

  function handleConfirm() {
    const newLevel = shiftLevel(aiLevel, choice!);
    setConfirmedLevel(newLevel);
    setConfirmed(true);
    setEditing(false);
    try {
      const raw = localStorage.getItem("vibelab:result");
      const saved = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
      localStorage.setItem(
        "vibelab:result",
        JSON.stringify({
          ...saved,
          confirmedLevel: newLevel,
          aiRecommendedLevel: aiLevel,
          userFeedbackText: feedback.trim() || undefined,
          levelConfirmedAt: new Date().toISOString(),
        }),
      );
    } catch { /* ignore */ }
    onConfirm(newLevel);
  }

  const choiceBtn = (value: "accurate" | "up" | "down", label: string) => (
    <button
      key={value}
      onClick={() => setChoice(value)}
      style={{
        padding: "9px 16px",
        borderRadius: 8,
        border: `1px solid ${choice === value ? "var(--primary)" : "var(--border)"}`,
        backgroundColor: choice === value ? "rgba(99,102,241,0.15)" : "var(--surface)",
        color: choice === value ? "var(--primary)" : "var(--foreground)",
        fontSize: 13,
        fontWeight: choice === value ? 700 : 400,
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );

  if (confirmed && !editing) {
    return (
      <div
        style={{
          ...card,
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <span style={{ fontSize: 14, color: "var(--foreground)" }}>
          You confirmed: <strong style={{ color: "#fff" }}>{levelLabel(confirmedLevel)}</strong> ✓
        </span>
        <button
          onClick={() => { setEditing(true); }}
          style={{
            background: "none",
            border: "none",
            color: "var(--primary)",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
            padding: 0,
            flexShrink: 0,
          }}
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <div style={{ ...card, marginBottom: 24 }}>
      <p style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: borderline ? 6 : 16 }}>
        We&apos;re recommending{" "}
        <span style={{ color: "var(--primary)" }}>{levelLabel(aiLevel)}</span>{" "}
        based on your answers.
      </p>
      {borderline && (
        <p style={{ fontSize: 13, color: "var(--foreground)", opacity: 0.6, marginBottom: 16 }}>
          Your score was close to the next tier — this one could go either way.
        </p>
      )}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {choiceBtn("accurate", "✅ That's accurate")}
        {choiceBtn("up", "⬆️ I'm more advanced than this")}
        {choiceBtn("down", "⬇️ I'm earlier than this")}
      </div>
      <textarea
        placeholder="Anything feel off? (optional)"
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        rows={2}
        style={{
          marginTop: 14,
          width: "100%",
          boxSizing: "border-box",
          backgroundColor: "var(--background)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          color: "var(--foreground)",
          fontSize: 13,
          padding: "10px 12px",
          resize: "vertical",
          fontFamily: "inherit",
        }}
      />
      <button
        onClick={handleConfirm}
        disabled={choice === null}
        style={{
          marginTop: 12,
          padding: "10px 22px",
          borderRadius: 8,
          backgroundColor: choice === null ? "rgba(99,102,241,0.25)" : "var(--primary)",
          color: "#fff",
          border: "none",
          fontSize: 14,
          fontWeight: 700,
          cursor: choice === null ? "not-allowed" : "pointer",
          opacity: choice === null ? 0.5 : 1,
        }}
      >
        Confirm
      </button>
    </div>
  );
}

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

// ── Share-id detection (nanoid(8) — anything that isn't "local") ──
const isShareId = (token: string) => token !== "local";

// ── View Resources button ─────────────────────────────────────────
function ViewResourcesButton() {
  return (
    <Link to="/resources" style={btnOutline}>
      View Resources
    </Link>
  );
}

// ── Results body (shared between local and remote) ────────────────
function ResultsBody({ result, token }: { result: Result; token: string }) {
  const navigate = useNavigate();
  const { isSignedIn, user } = useUser();
  const userEmail = user?.emailAddresses[0]?.emailAddress;
  const userId = user?.id;
  const [confirmedLevel, setConfirmedLevel] = useState<Level>(() =>
    readConfirmedLevel(result.level as Level),
  );
  const stack = STACKS[confirmedLevel];
  const radarData = result.scores.map((s) => ({ subject: s.short, score: s.score, fullMark: 100 }));
  const isShareable = isShareId(token);

  // Check whether user already has a personalization profile
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isShareable || !isSignedIn) { setHasProfile(false); return; }
    let cancelled = false;
    sql`SELECT id FROM user_profiles WHERE share_id = ${token} LIMIT 1`
      .then((rows) => { if (!cancelled) setHasProfile(rows.length > 0); })
      .catch(() => { if (!cancelled) setHasProfile(false); });
    return () => { cancelled = true; };
  }, [token, isShareable, isSignedIn]);

  function goToPersonalize() {
    if (isShareable) sessionStorage.setItem("vibelab:share_id", token);
    navigate("/personalize");
  }

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

        {/* ── BLOCK 1b: Level Confirmation ── */}
        <LevelConfirmation
          aiLevel={result.level as Level}
          overall={result.overall}
          borderline={isBorderline(result.overall)}
          onConfirm={(level) => {
            setConfirmedLevel(level);
            // fire-and-forget — never blocks the UI
            void fetch("/api/send-milestone-email", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...(userEmail ? { email: userEmail } : {}),
                confirmedLevel: level,
                ...(result.weakest[0] ? { weakestCategory: result.weakest[0] } : {}),
              }),
            }).catch(() => { /* silently ignore network errors */ });
          }}
        />

        {/* ── BLOCK 1c: Build Challenge ── */}
        <BuildChallenge
          confirmedLevel={confirmedLevel}
          weakestCategory={result.weakest[0]}
          userEmail={userEmail}
          userId={userId}
        />

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

        {/* ── BLOCK 6: Personalized Hub CTA ── */}
        <div
          style={{
            marginBottom: 32,
            borderRadius: 20,
            padding: 2,
            background: "linear-gradient(135deg, rgba(99,102,241,0.6) 0%, rgba(139,92,246,0.4) 50%, rgba(99,102,241,0.2) 100%)",
          }}
        >
          <div
            style={{
              backgroundColor: "var(--background)",
              borderRadius: 18,
              padding: "40px 32px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "5px 12px",
                borderRadius: 999,
                backgroundColor: "rgba(99,102,241,0.12)",
                border: "1px solid rgba(99,102,241,0.25)",
                color: "var(--primary)",
                fontSize: 11,
                fontFamily: "monospace",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: 20,
              }}
            >
              Personalized for you
            </div>
            <h2
              style={{
                fontSize: "clamp(22px, 4vw, 28px)",
                fontWeight: 800,
                color: "#ffffff",
                marginBottom: 12,
                letterSpacing: "-0.01em",
                lineHeight: 1.2,
              }}
            >
              Want a learning hub built just for you?
            </h2>
            <p
              style={{
                color: "var(--foreground)",
                opacity: 0.6,
                fontSize: 16,
                lineHeight: 1.65,
                maxWidth: 440,
                margin: "0 auto 28px",
              }}
            >
              {isSignedIn
                ? "Answer 4 quick questions and we'll build your personalized path to becoming a Vibe Architect."
                : "Create a free account to save your results and get your personalized hub."}
            </p>

            {!isSignedIn ? (
              // Not signed in — show sign-up prompt
              <SignInButton mode="modal">
                <button
                  style={{
                    backgroundColor: "var(--primary)",
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: 16,
                    padding: "14px 32px",
                    borderRadius: 10,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Create free account →
                </button>
              </SignInButton>
            ) : hasProfile === null ? (
              // Signed in — still checking for existing profile
              <div
                style={{
                  display: "inline-block",
                  backgroundColor: "var(--primary)",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: 16,
                  padding: "14px 32px",
                  borderRadius: 10,
                  opacity: 0.5,
                  cursor: "default",
                }}
              >
                Loading...
              </div>
            ) : hasProfile ? (
              <Link
                to={`/hub?id=${token}`}
                style={{
                  display: "inline-block",
                  backgroundColor: "var(--primary)",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: 16,
                  padding: "14px 32px",
                  borderRadius: 10,
                  textDecoration: "none",
                }}
              >
                Go to My Hub →
              </Link>
            ) : (
              <button
                onClick={goToPersonalize}
                style={{
                  backgroundColor: "var(--primary)",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: 16,
                  padding: "14px 32px",
                  borderRadius: 10,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Build My Hub →
              </button>
            )}
          </div>
        </div>

        {/* ── BLOCK 7: Secondary CTA Row ── */}
        <div style={{ textAlign: "center" }}>
          {!isShareable && (
            <p style={{ fontSize: 12, color: "var(--foreground)", opacity: 0.4, fontFamily: "monospace", marginBottom: 20 }}>
              Your results are saved locally in your browser.
            </p>
          )}
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <ViewResourcesButton />
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

// ── Spinner ───────────────────────────────────────────────────────
function Spinner() {
  return (
    <Layout>
      <div
        style={{
          minHeight: "calc(100vh - 56px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: "3px solid var(--border)",
            borderTopColor: "var(--primary)",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </Layout>
  );
}

// ── Remote result loader ──────────────────────────────────────────
function RemoteResult({ token }: { token: string }) {
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const rows = await sql`
          SELECT score, category_scores
          FROM assessment_results
          WHERE share_id = ${token}
          LIMIT 1
        `;
        if (cancelled) return;
        if (rows.length === 0) {
          setNotFound(true);
          return;
        }
        const row = rows[0] as { score: number; category_scores: CategoryScore[] };
        const scores = row.category_scores as CategoryScore[];
        const overall = row.score;
        const level: Level = overall < 40 ? "beginner" : overall < 75 ? "intermediate" : "advanced";
        const weakest = [...scores]
          .sort((a, b) => a.score - b.score)
          .slice(0, 2)
          .map((s) => s.id) as CategoryId[];
        setResult({ overall, level, scores, weakest });
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [token]);

  if (loading) return <Spinner />;

  if (notFound || !result) {
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
          <p style={{ color: "var(--foreground)", opacity: 0.6, fontSize: 18 }}>This result couldn't be found.</p>
          <Link to="/assessment" style={btnPrimary}>Take the assessment to get your results →</Link>
        </div>
      </Layout>
    );
  }

  return <ResultsBody result={result} token={token} />;
}

// ── Main page ─────────────────────────────────────────────────────
export default function Results() {
  const { token = "local" } = useParams<{ token: string }>();

  // share_id (nanoid) → fetch from Neon
  if (isShareId(token)) {
    return <RemoteResult token={token} />;
  }

  // "local" token → read from localStorage
  return <LocalResult />;
}

function LocalResult() {
  const navigate = useNavigate();
  const { isLoaded: authLoaded, isSignedIn } = useUser();
  const [result, setResult] = useState<Result | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load result from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("vibelab:result");
      if (raw) setResult(JSON.parse(raw) as Result);
    } catch {
      // malformed JSON — leave result null
    }
    setLoaded(true);
  }, []);

  // After sign-in, auto-save any pending result to Neon and redirect to the real share URL
  useEffect(() => {
    if (!authLoaded || !isSignedIn) return;
    const pending = sessionStorage.getItem("vibelab:pending_result");
    if (!pending) return;
    setSaving(true);
    void (async () => {
      try {
        const { answers, score, scores } = JSON.parse(pending) as {
          answers: Record<string, unknown>;
          score: number;
          scores: unknown;
        };
        const shareId = nanoid(8);
        await sql`
          INSERT INTO assessment_results (share_id, score, category_scores, answers)
          VALUES (${shareId}, ${score}, ${JSON.stringify(scores)}, ${JSON.stringify(answers)})
        `;
        sessionStorage.removeItem("vibelab:pending_result");
        navigate(`/results/${shareId}`, { replace: true });
      } catch (err) {
        console.error("Auto-save failed:", err);
        setSaving(false);
        toast.error("Couldn't save your results — please try again");
      }
    })();
  }, [authLoaded, isSignedIn, navigate]);

  if (saving) return <Spinner />;
  if (!loaded) return null;

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

  return (
    <>
      <ResultsBody result={result} token="local" />
      {/* navigate used in ResultsBody via its own useNavigate — preserve the local navigate for the outer wrapper */}
      <div style={{ display: "none" }} onClick={() => navigate("/assessment")} />
    </>
  );
}
