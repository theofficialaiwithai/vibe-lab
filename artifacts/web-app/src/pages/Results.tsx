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
import { STACK, VIDEOS } from "@/lib/data/resources";
import type { Resource } from "@/lib/data/resources";

// ── Category → STACK group mapping ───────────────────────────────
const CAT_TO_GROUPS: Record<CategoryId, string[]> = {
  "ai-tools":   ["Vibe Coding"],
  "deployment": ["Deployment", "No-Code"],
  "auth-data":  ["Authentication", "Database"],
  "ux-design":  ["UX Design"],
  "product":    ["Product Ideas", "No-Code"],
};

const CAT_LABEL: Record<CategoryId, string> = {
  "ai-tools":   "AI Coding Tools",
  "deployment": "Deployment & Hosting",
  "auth-data":  "Auth & Data",
  "ux-design":  "UX Design Sourcing",
  "product":    "Product Thinking",
};

// ── Resource feedback (vibelab:resource-feedback in localStorage) ─
type ResourceFeedback = Record<string, "know" | "not-relevant">;

function readFeedback(): ResourceFeedback {
  try {
    const raw = localStorage.getItem("vibelab:resource-feedback");
    return raw ? (JSON.parse(raw) as ResourceFeedback) : {};
  } catch { return {}; }
}

function writeFeedback(id: string, value: "know" | "not-relevant"): ResourceFeedback {
  const next = { ...readFeedback(), [id]: value };
  try { localStorage.setItem("vibelab:resource-feedback", JSON.stringify(next)); } catch { /* ignore */ }
  return next;
}

// ── Stack pick helpers ────────────────────────────────────────────
const LEVEL_ORDER: Level[] = ["beginner", "intermediate", "advanced"];
function lvlIdx(l: Level) { return LEVEL_ORDER.indexOf(l); }
function atOrBelow(rl: Level, ul: Level) { return lvlIdx(rl) <= lvlIdx(ul); }
function oneTierUp(l: Level): Level { return LEVEL_ORDER[Math.min(lvlIdx(l) + 1, 2)]; }

type StackPick = { tool: (typeof STACK)[number]; isStretch: boolean };

function pickStackTools(
  effectiveLevel: Level,
  weakCats: CategoryId[],
  allCats: CategoryId[],
  fb: ResourceFeedback,
): StackPick[] {
  const usable = (id: string) => fb[id] !== "not-relevant" && fb[id] !== "know";
  const used = new Set<string>();
  const picks: StackPick[] = [];

  for (const cat of weakCats.slice(0, 2)) {
    const groups = CAT_TO_GROUPS[cat] ?? [];
    STACK
      .filter(r =>
        groups.includes(r.group) &&
        r.categories.includes(cat) &&
        atOrBelow(r.level, effectiveLevel) &&
        usable(r.id) && !used.has(r.id)
      )
      .slice(0, 2)
      .forEach(r => { picks.push({ tool: r, isStretch: false }); used.add(r.id); });
  }

  const stretchLevel = oneTierUp(effectiveLevel);
  const weakSet = new Set(weakCats);
  for (const cat of allCats.filter(c => !weakSet.has(c)).slice(0, 3)) {
    const groups = CAT_TO_GROUPS[cat] ?? [];
    const candidates = STACK.filter(r =>
      groups.includes(r.group) &&
      r.categories.includes(cat) &&
      atOrBelow(r.level, stretchLevel) &&
      usable(r.id) && !used.has(r.id)
    );
    const pick = candidates.find(r => r.level === stretchLevel) ?? candidates[0];
    if (pick) { picks.push({ tool: pick, isStretch: true }); used.add(pick.id); }
  }

  return picks;
}

function pickOpportunityResources(
  cat: CategoryId,
  effectiveLevel: Level,
  fb: ResourceFeedback,
): Resource[] {
  const usable = (id: string) => fb[id] !== "not-relevant" && fb[id] !== "know";
  const nearLevel = oneTierUp(effectiveLevel);
  const candidates = ([...VIDEOS, ...STACK] as Resource[]).filter(r =>
    r.categories.includes(cat) && atOrBelow(r.level, nearLevel) && usable(r.id)
  );
  const videos = candidates.filter(r => r.type === "video");
  const tools = candidates.filter(r => r.type === "tool");
  if (videos.length > 0 && tools.length > 0) return [videos[0], tools[0]];
  return candidates.slice(0, 2);
}

// ── Relevance feedback buttons ────────────────────────────────────
function FeedbackButtons({
  resourceId,
  feedback,
  onFeedback,
}: {
  resourceId: string;
  feedback: ResourceFeedback;
  onFeedback: (id: string, value: "know" | "not-relevant") => void;
}) {
  const current = feedback[resourceId];
  const isKnow = current === "know";
  const isNR = current === "not-relevant";
  return (
    <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
      <button
        onClick={() => onFeedback(resourceId, "know")}
        style={{
          padding: "3px 10px", borderRadius: 999, fontFamily: "inherit", fontSize: 11, cursor: "pointer",
          border: `1px solid ${isKnow ? "rgba(34,197,94,0.4)" : "var(--border)"}`,
          backgroundColor: isKnow ? "rgba(34,197,94,0.10)" : "transparent",
          color: isKnow ? "#22c55e" : "var(--foreground)",
          opacity: isNR ? 0.35 : 1,
        }}
      >
        👍 Already know this
      </button>
      <button
        onClick={() => onFeedback(resourceId, "not-relevant")}
        style={{
          padding: "3px 10px", borderRadius: 999, fontFamily: "inherit", fontSize: 11, cursor: "pointer",
          border: `1px solid ${isNR ? "rgba(239,68,68,0.4)" : "var(--border)"}`,
          backgroundColor: isNR ? "rgba(239,68,68,0.10)" : "transparent",
          color: isNR ? "#f87171" : "var(--foreground)",
          opacity: isKnow ? 0.35 : 1,
        }}
      >
        👎 Not relevant
      </button>
    </div>
  );
}

// ── Category score overrides ──────────────────────────────────────
type CategoryOverride = { aiScore: number; adjustedScore: number; adjustedAt: string };
type CategoryOverrides = Record<string, CategoryOverride>;

function readOverrides(): CategoryOverrides {
  try {
    const raw = localStorage.getItem("vibelab:categoryOverrides");
    return raw ? (JSON.parse(raw) as CategoryOverrides) : {};
  } catch { return {}; }
}
function writeOverrides(v: CategoryOverrides): void {
  try { localStorage.setItem("vibelab:categoryOverrides", JSON.stringify(v)); } catch { /* ignore */ }
}

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

// ── Category progress row (supports user override) ────────────────
function CategoryRow({
  cat,
  override,
  onSave,
  onReset,
}: {
  cat: CategoryScore;
  override?: CategoryOverride;
  onSave: (catId: string, adjusted: number) => void;
  onReset: (catId: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(cat.score);

  const displayScore = override?.adjustedScore ?? cat.score;
  const color = scoreColor(displayScore);

  const ghostBtn: React.CSSProperties = {
    background: "none", border: "none", padding: 0,
    cursor: "pointer", fontSize: 12, fontFamily: "inherit",
  };

  if (editing) {
    return (
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, alignItems: "baseline" }}>
          <span style={{ fontSize: 14, color: "var(--foreground)", fontWeight: 500 }}>{cat.label}</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: scoreColor(draft), fontFamily: "monospace" }}>{draft}%</span>
        </div>
        <input
          type="range" min={0} max={100} value={draft}
          onChange={(e) => setDraft(Number(e.target.value))}
          style={{ width: "100%", marginBottom: 10, accentColor: "var(--primary)" }}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => { onSave(cat.id, draft); setEditing(false); }}
            style={{
              padding: "5px 14px", borderRadius: 6, border: "none", fontFamily: "inherit",
              backgroundColor: "var(--primary)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            Save
          </button>
          <button
            onClick={() => { setDraft(override?.adjustedScore ?? cat.score); setEditing(false); }}
            style={{
              padding: "5px 14px", borderRadius: 6, border: "1px solid var(--border)", fontFamily: "inherit",
              backgroundColor: "transparent", color: "var(--foreground)", fontSize: 13, cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 14, color: "var(--foreground)", fontWeight: 500 }}>{cat.label}</span>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          {override ? (
            <>
              <span style={{ fontSize: 14, fontWeight: 700, color, fontFamily: "monospace" }}>
                Your estimate: {override.adjustedScore}%
              </span>
              <span style={{ fontSize: 11, color: "var(--foreground)", opacity: 0.4, fontFamily: "monospace" }}>
                (AI: {cat.score}%)
              </span>
              <button
                onClick={() => onReset(cat.id)}
                style={{ ...ghostBtn, color: "var(--foreground)", opacity: 0.5 }}
              >
                Reset
              </button>
            </>
          ) : (
            <span style={{ fontSize: 14, fontWeight: 700, color, fontFamily: "monospace" }}>{cat.score}%</span>
          )}
        </div>
      </div>
      <div style={{ height: 4, backgroundColor: "var(--border)", borderRadius: 2, overflow: "hidden", marginBottom: 6 }}>
        <div style={{ height: "100%", width: `${displayScore}%`, backgroundColor: color, borderRadius: 2, transition: "width 0.3s" }} />
      </div>
      {!override && (
        <button
          onClick={() => { setDraft(cat.score); setEditing(true); }}
          style={{ ...ghostBtn, color: "var(--foreground)", opacity: 0.35, fontSize: 11 }}
        >
          Doesn't feel right?
        </button>
      )}
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
  const [feedback, setFeedback] = useState<ResourceFeedback>(() => readFeedback());
  function handleFeedback(id: string, value: "know" | "not-relevant") {
    setFeedback(writeFeedback(id, value));
  }

  const [overrides, setOverrides] = useState<CategoryOverrides>(() => readOverrides());
  function handleOverrideSave(catId: string, adjustedScore: number) {
    const aiScore = result.scores.find(s => s.id === catId)?.score ?? adjustedScore;
    const next: CategoryOverrides = { ...overrides, [catId]: { aiScore, adjustedScore, adjustedAt: new Date().toISOString() } };
    writeOverrides(next);
    setOverrides(next);
  }
  function handleOverrideReset(catId: string) {
    const next = { ...overrides };
    delete next[catId];
    writeOverrides(next);
    setOverrides(next);
  }

  const effectiveScores = result.scores.map(s => ({
    ...s,
    score: overrides[s.id]?.adjustedScore ?? s.score,
  }));
  const effectiveWeakest = [...effectiveScores]
    .sort((a, b) => a.score - b.score)
    .slice(0, 2)
    .map(s => s.id as CategoryId);

  const allCatIds = result.scores.map(s => s.id as CategoryId);
  const radarData = effectiveScores.map((s) => ({ subject: s.short, score: s.score, fullMark: 100 }));
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
            <CategoryRow
              key={cat.id}
              cat={cat}
              override={overrides[cat.id]}
              onSave={handleOverrideSave}
              onReset={handleOverrideReset}
            />
          ))}
        </div>

        {/* ── BLOCK 4: Recommended Stack ── */}
        {(() => {
          const stackPicks = pickStackTools(confirmedLevel, effectiveWeakest, allCatIds, feedback);
          return (
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: "#ffffff", marginBottom: 16 }}>
                Your Recommended Stack
              </h2>
              {stackPicks.length === 0 ? (
                <div style={{ ...card, color: "var(--foreground)", opacity: 0.55, fontSize: 14 }}>
                  You've hidden all current suggestions — open the Hub for more resources.
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
                  {stackPicks.map(({ tool, isStretch }) => (
                    <div
                      key={tool.id}
                      style={{
                        backgroundColor: "var(--surface)",
                        border: `1px solid ${isStretch ? "rgba(139,92,246,0.30)" : "rgba(99,102,241,0.30)"}`,
                        borderRadius: 12,
                        padding: 16,
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                        <a
                          href={tool.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: 14, fontWeight: 700, color: "#fff", textDecoration: "none" }}
                        >
                          {tool.title} ↗
                        </a>
                        <span style={{
                          flexShrink: 0,
                          fontSize: 10,
                          fontFamily: "monospace",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 999,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          backgroundColor: isStretch ? "rgba(139,92,246,0.14)" : "rgba(99,102,241,0.12)",
                          color: isStretch ? "#a78bfa" : "var(--primary)",
                          border: `1px solid ${isStretch ? "rgba(139,92,246,0.28)" : "rgba(99,102,241,0.25)"}`,
                        }}>
                          {isStretch ? "Stretch" : tool.level}
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: "var(--foreground)", opacity: 0.6, lineHeight: 1.55, margin: 0, flex: 1 }}>
                        {tool.description}
                      </p>
                      <FeedbackButtons resourceId={tool.id} feedback={feedback} onFeedback={handleFeedback} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* ── BLOCK 5: Biggest Opportunities ── */}
        {(() => {
          const typeIcon = (type: string) => type === "video" ? "▶" : "🔧";
          const weakCats = effectiveWeakest;
          const sections = weakCats.slice(0, 2).map(cat => ({
            cat,
            label: CAT_LABEL[cat] ?? cat,
            resources: pickOpportunityResources(cat, confirmedLevel, feedback),
          }));
          return (
            <div style={{ marginBottom: 56 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: "#ffffff", marginBottom: 16 }}>
                Your Biggest Opportunities
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
                {sections.map(({ cat, label, resources }) => (
                  <div key={cat} style={{ ...card, borderRadius: 12 }}>
                    <p style={{ fontWeight: 700, fontSize: 15, color: "#ffffff", marginBottom: 14 }}>{label}</p>
                    {resources.length === 0 ? (
                      <p style={{ fontSize: 13, color: "var(--foreground)", opacity: 0.45, margin: 0 }}>
                        No suggestions remaining — open the Hub for more.
                      </p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        {resources.map((r, i) => (
                          <div
                            key={r.id}
                            style={{
                              paddingBottom: i < resources.length - 1 ? 14 : 0,
                              borderBottom: i < resources.length - 1 ? "1px solid var(--border)" : "none",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
                              <span style={{ fontSize: 11, opacity: 0.4 }}>{typeIcon(r.type)}</span>
                              <a
                                href={r.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: "var(--primary)", fontSize: 13, fontWeight: 600, textDecoration: "none" }}
                              >
                                {r.title} ↗
                              </a>
                              {r.meta && (
                                <span style={{ fontSize: 10, color: "var(--foreground)", opacity: 0.35, fontFamily: "monospace" }}>
                                  {r.meta}
                                </span>
                              )}
                            </div>
                            <p style={{ fontSize: 12, color: "var(--foreground)", opacity: 0.6, lineHeight: 1.5, margin: 0 }}>
                              {r.description}
                            </p>
                            <FeedbackButtons resourceId={r.id} feedback={feedback} onFeedback={handleFeedback} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

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
