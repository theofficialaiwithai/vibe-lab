import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ExternalLink, ChevronDown, ChevronUp, Lock } from "lucide-react";
import Layout from "@/components/Layout";
import { sql } from "@/lib/db";
import { ALL_RESOURCES } from "@/lib/data/resources";
import type { Resource } from "@/lib/data/resources";
import type { CategoryScore, Level } from "@/lib/data/scoring";
import type { CategoryId } from "@/lib/data/questions";

// ── Types ─────────────────────────────────────────────────────────
type PhaseNum = 1 | 2 | 3;

type ProfileData = {
  main_goal: string;
  time_per_week: string;
  learning_style: string;
  current_status: string;
  current_level: number;
  current_phase: number;
};

type AssessmentData = {
  score: number;
  category_scores: CategoryScore[];
};

type HubResource = Resource & { phase: PhaseNum };

// ── Phase metadata ────────────────────────────────────────────────
const PHASES: { num: PhaseNum; title: string; subtitle: string }[] = [
  { num: 1, title: "Foundation", subtitle: "Get your first thing live" },
  { num: 2, title: "Stack Up",   subtitle: "Build with a real stack" },
  { num: 3, title: "Ship It",    subtitle: "Product thinking, validate, launch" },
];

// ── Resource → phase mapping ──────────────────────────────────────
const PHASE_MAP: Record<string, PhaseNum> = {
  // Phase 1 — Foundation
  "yt-claude-cowork": 1,
  "yt-replit-agent": 1,
  "yt-vercel-netlify": 1,
  "yt-netlify-deploy": 1,
  "yt-cloudflare-pages": 1,
  "yt-clerk-auth": 1,
  "yt-supabase-full": 1,
  "yt-codex-vibe": 1,
  "cs-prd-assistant": 1,
  "cs-code-build-copilot": 1,
  "cs-replit-copilot": 1,
  "st-replit": 1,
  "st-clerk": 1,
  "st-supabase": 1,
  "st-vercel": 1,
  "st-netlify": 1,
  "st-dribbble": 1,
  "st-ideabrowser": 1,
  // Phase 2 — Stack Up
  "yt-claude-code-4hr": 2,
  "yt-neon-postgres": 2,
  "cs-automation-architect": 2,
  "st-neon": 2,
  "st-claude-code": 2,
  "st-codex": 2,
  "st-cloudflare": 2,
  "st-21st": 2,
  "st-mobbin": 2,
  // Phase 3 — Ship It
  "yt-advanced-claude-code": 3,
  "cs-mcp-assistant": 3,
  "cs-openclaw-assistant": 3,
  "cs-routines-creator": 3,
};

// ── Placeholder resources for thin phases ─────────────────────────
const PLACEHOLDERS: HubResource[] = [
  {
    id: "ph-first-deploy",
    title: "Ship Your First Project in 30 Minutes",
    description: "A hands-on walkthrough of the fastest path from idea to live URL — using Replit + Vercel with zero config.",
    url: "#",
    type: "video",
    level: "beginner",
    categories: ["deployment"],
    meta: "Coming soon",
    phase: 1,
  },
  {
    id: "ph-ai-prompt-patterns",
    title: "AI Prompt Patterns That Actually Work",
    description: "The 5 prompting patterns that consistently produce buildable code from Claude, Codex, and Replit Agent.",
    url: "#",
    type: "video",
    level: "beginner",
    categories: ["ai-tools"],
    meta: "Coming soon",
    phase: 1,
  },
  {
    id: "ph-stack-setup",
    title: "Full-Stack Setup: Neon + Clerk + Vercel",
    description: "Wire up a production-ready stack from scratch — database, auth, and deployment — in one afternoon.",
    url: "#",
    type: "video",
    level: "intermediate",
    categories: ["auth-data", "deployment"],
    meta: "Coming soon",
    phase: 2,
  },
  {
    id: "ph-validate-idea",
    title: "Validate Before You Build",
    description: "Use Ideabrowser, landing pages, and AI to test demand for your idea before writing a single line of code.",
    url: "#",
    type: "skill",
    level: "advanced",
    categories: ["product"],
    meta: "Coming soon",
    phase: 3,
  },
];

// ── Cowork skill install instructions ─────────────────────────────
const INSTALL_INSTRUCTIONS: Record<string, string> = {
  "cs-prd-assistant":       "In Claude Code / Cowork: type /prd-assistant  ·  Or run: npx skills add prd-assistant",
  "cs-code-build-copilot":  "In Claude Code / Cowork: type /code-build-copilot  ·  Or run: npx skills add code-build-copilot",
  "cs-automation-architect":"In Claude Code / Cowork: type /automation-architect  ·  Or run: npx skills add automation-architect",
  "cs-mcp-assistant":       "In Claude Code / Cowork: type /mcp-assistant  ·  Or run: npx skills add mcp-assistant",
  "cs-openclaw-assistant":  "In Claude Code / Cowork: type /openclaw-assistant  ·  Or run: npx skills add openclaw-assistant",
  "cs-replit-copilot":      "In Claude Code / Cowork: type /replit-copilot  ·  Or run: npx skills add replit-copilot",
  "cs-routines-creator":    "In Claude Code / Cowork: type /routines-creator  ·  Or run: npx skills add routines-creator",
};

// ── Helpers ───────────────────────────────────────────────────────
function levelToPhase(level: Level): PhaseNum {
  if (level === "beginner") return 1;
  if (level === "intermediate") return 2;
  return 3;
}

function derivePhase(score: number, currentStatus: string): PhaseNum {
  if (
    score > 70 ||
    currentStatus === "Shipped something before" ||
    currentStatus === "Actively building right now"
  ) return 3;
  if (
    (score >= 40 && score <= 70) ||
    currentStatus === "Built something but never shipped it"
  ) return 2;
  return 1;
}

function getLevelInfo(score: number): { label: string; emoji: string } {
  if (score < 40) return { label: "Vibe Starter",   emoji: "🌱" };
  if (score < 75) return { label: "Vibe Builder",   emoji: "⚡" };
  return               { label: "Vibe Architect", emoji: "🚀" };
}

function buildHubResources(): HubResource[] {
  const mapped = ALL_RESOURCES.map((r) => ({
    ...r,
    phase: (PHASE_MAP[r.id] ?? levelToPhase(r.level)) as PhaseNum,
  }));
  return [...mapped, ...PLACEHOLDERS];
}

function filterPhaseResources(
  all: HubResource[],
  phase: PhaseNum,
  profile: ProfileData,
  weakest: CategoryId[],
): HubResource[] {
  const forPhase = all.filter((r) => r.phase === phase);

  const sorted = [...forPhase].sort((a, b) => {
    const ls = profile.learning_style;
    // Learning style preference
    if (ls === "Watching videos") {
      if (a.type === "video" && b.type !== "video") return -1;
      if (b.type === "video" && a.type !== "video") return 1;
    } else if (ls === "Building things" || ls === "Being guided step by step") {
      if (a.type === "skill" && b.type !== "skill") return -1;
      if (b.type === "skill" && a.type !== "skill") return 1;
    }
    // Weakest-category priority
    const aWeak = a.categories.some((c) => weakest.includes(c as CategoryId));
    const bWeak = b.categories.some((c) => weakest.includes(c as CategoryId));
    if (aWeak && !bWeak) return -1;
    if (bWeak && !aWeak) return 1;
    return 0;
  });

  const max = profile.time_per_week === "Less than 2 hours" ? 4 : 8;
  return sorted.slice(0, max);
}

// ── Spinner ───────────────────────────────────────────────────────
function Spinner() {
  return (
    <Layout>
      <div style={{
        minHeight: "calc(100vh - 56px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          border: "3px solid var(--border)",
          borderTopColor: "var(--primary)",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </Layout>
  );
}

// ── Star rating ───────────────────────────────────────────────────
function StarRating({ rating, onRate, locked }: { rating: number; onRate: (n: number) => void; locked: boolean }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: "flex", gap: 1 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          disabled={locked}
          onClick={() => onRate(n)}
          onMouseEnter={() => !locked && setHover(n)}
          onMouseLeave={() => setHover(0)}
          style={{
            background: "none",
            border: "none",
            cursor: locked ? "default" : "pointer",
            fontSize: 17,
            padding: "0 1px",
            color: n <= (hover || rating) ? "#f59e0b" : "rgba(255,255,255,0.15)",
            transition: "color 0.1s",
            lineHeight: 1,
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

// ── Resource card ─────────────────────────────────────────────────
function ResourceCard({
  resource,
  completed,
  rating,
  locked,
  onComplete,
  onRate,
}: {
  resource: HubResource;
  completed: boolean;
  rating: number;
  locked: boolean;
  onComplete: () => void;
  onRate: (n: number) => void;
}) {
  const [installOpen, setInstallOpen] = useState(false);
  const installText = resource.type === "skill" ? (INSTALL_INSTRUCTIONS[resource.id] ?? null) : null;
  const isPlaceholder = resource.url === "#";

  const TYPE_BADGE: Record<string, { bg: string; color: string; label: string }> = {
    video: { bg: "rgba(239,68,68,0.12)", color: "#f87171", label: "Video" },
    skill: { bg: "rgba(99,102,241,0.12)", color: "var(--primary)", label: "Cowork Skill" },
    tool:  { bg: "rgba(34,197,94,0.12)",  color: "#22c55e",       label: "Tool" },
  };
  const badge = TYPE_BADGE[resource.type] ?? TYPE_BADGE.tool;

  return (
    <div
      style={{
        backgroundColor: "var(--surface)",
        border: `1px solid ${completed ? "rgba(34,197,94,0.35)" : "var(--border)"}`,
        borderRadius: 14,
        padding: 20,
        opacity: locked ? 0.5 : 1,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        position: "relative",
      }}
    >
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Type badge */}
          <span style={{
            display: "inline-block",
            backgroundColor: badge.bg,
            color: badge.color,
            fontSize: 10,
            fontWeight: 700,
            padding: "2px 8px",
            borderRadius: 999,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 8,
          }}>
            {badge.label}
          </span>
          {/* Title */}
          <p style={{ fontWeight: 700, fontSize: 15, color: "#ffffff", lineHeight: 1.3, marginBottom: 0 }}>
            {resource.title}
          </p>
        </div>

        {/* Completed badge */}
        {completed && (
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            backgroundColor: "rgba(34,197,94,0.12)",
            color: "#22c55e",
            fontSize: 11,
            fontWeight: 700,
            padding: "3px 10px",
            borderRadius: 999,
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}>
            ✓ Done
          </span>
        )}
      </div>

      {/* Description */}
      <p style={{ fontSize: 13, color: "var(--foreground)", opacity: 0.65, lineHeight: 1.6, margin: 0 }}>
        {resource.description}
      </p>

      {/* Meta */}
      {resource.meta && !isPlaceholder && (
        <span style={{
          display: "inline-block",
          fontFamily: "monospace",
          fontSize: 11,
          backgroundColor: "rgba(255,255,255,0.05)",
          color: "var(--foreground)",
          opacity: 0.5,
          padding: "2px 8px",
          borderRadius: 999,
        }}>
          {resource.meta}
        </span>
      )}

      {/* Install Instructions (Cowork Skills only) */}
      {installText && (
        <div>
          <button
            onClick={() => setInstallOpen((o) => !o)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              color: "var(--primary)",
              fontSize: 12,
              fontWeight: 600,
              padding: 0,
            }}
          >
            {installOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            Install Instructions
          </button>
          {installOpen && (
            <div style={{
              marginTop: 8,
              backgroundColor: "rgba(99,102,241,0.06)",
              border: "1px solid rgba(99,102,241,0.18)",
              borderRadius: 8,
              padding: "10px 14px",
              fontFamily: "monospace",
              fontSize: 12,
              color: "var(--foreground)",
              opacity: 0.8,
              lineHeight: 1.7,
            }}>
              {installText}
            </div>
          )}
        </div>
      )}

      {/* Bottom row: stars + actions */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 10,
        paddingTop: 4,
        borderTop: "1px solid var(--border)",
      }}>
        {/* Star rating */}
        <StarRating rating={rating} onRate={onRate} locked={locked} />

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* External link (not for placeholders) */}
          {!isPlaceholder && (
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                color: "var(--foreground)",
                opacity: 0.5,
                fontSize: 12,
                textDecoration: "none",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.5")}
            >
              Open <ExternalLink size={11} />
            </a>
          )}

          {/* Mark complete button */}
          {!locked && (
            <button
              onClick={onComplete}
              disabled={completed}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                backgroundColor: completed ? "rgba(34,197,94,0.12)" : "var(--primary)",
                color: completed ? "#22c55e" : "#ffffff",
                border: completed ? "1px solid rgba(34,197,94,0.3)" : "none",
                fontSize: 12,
                fontWeight: 600,
                padding: "6px 14px",
                borderRadius: 7,
                cursor: completed ? "default" : "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s",
              }}
            >
              {completed ? "Completed ✓" : "Mark Complete"}
            </button>
          )}

          {locked && (
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              color: "var(--foreground)",
              opacity: 0.3,
              fontSize: 12,
            }}>
              <Lock size={12} /> Locked
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Phase progress bar ────────────────────────────────────────────
function PhaseProgress({ completed, total }: { completed: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ flex: 1, height: 6, backgroundColor: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{
          height: "100%",
          width: `${pct}%`,
          backgroundColor: "var(--primary)",
          borderRadius: 3,
          transition: "width 0.4s ease",
        }} />
      </div>
      <span style={{ fontSize: 12, fontFamily: "monospace", color: "var(--foreground)", opacity: 0.5, flexShrink: 0 }}>
        {completed}/{total}
      </span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────
export default function PersonalizedHub({ shareId }: { shareId: string }) {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  // Interaction state — maps resource ID to state
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [ratings, setRatings] = useState<Record<string, number>>({});

  const [activePhase, setActivePhase] = useState<PhaseNum>(1);

  // ── Load data ───────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [assessmentRows, profileRows, completedRows, ratingRows] = await Promise.all([
          sql`SELECT score, category_scores FROM assessment_results WHERE share_id = ${shareId} LIMIT 1`,
          sql`SELECT main_goal, time_per_week, learning_style, current_status, current_level, current_phase FROM user_profiles WHERE share_id = ${shareId} LIMIT 1`,
          sql`SELECT resource_id FROM user_resource_progress WHERE share_id = ${shareId}`,
          sql`SELECT resource_id, rating FROM resource_ratings WHERE share_id = ${shareId}`,
        ]);

        if (cancelled) return;

        if (profileRows.length === 0) {
          // No profile → redirect to personalize
          navigate(`/personalize`, { replace: true });
          return;
        }

        const a = assessmentRows[0] as AssessmentData | undefined;
        const p = profileRows[0] as ProfileData;

        if (a) setAssessment(a);
        setProfile(p);

        // Build completed map
        const cMap: Record<string, boolean> = {};
        for (const row of completedRows) cMap[(row as { resource_id: string }).resource_id] = true;
        setCompleted(cMap);

        // Build ratings map
        const rMap: Record<string, number> = {};
        for (const row of ratingRows) {
          const r = row as { resource_id: string; rating: number };
          rMap[r.resource_id] = r.rating;
        }
        setRatings(rMap);

        // Set starting phase
        if (a) {
          const phase = derivePhase(a.score, p.current_status);
          setActivePhase(phase);
        }
      } catch (err) {
        console.error("Failed to load hub data:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [shareId, navigate]);

  // ── Mark complete (optimistic) ──────────────────────────────────
  function handleComplete(resourceId: string) {
    setCompleted((prev) => ({ ...prev, [resourceId]: true }));
    // Background sync
    void sql`
      INSERT INTO user_resource_progress (share_id, resource_id)
      VALUES (${shareId}, ${resourceId})
      ON CONFLICT (share_id, resource_id) DO NOTHING
    `.catch(console.error);
  }

  // ── Rate (optimistic) ───────────────────────────────────────────
  function handleRate(resourceId: string, rating: number) {
    setRatings((prev) => ({ ...prev, [resourceId]: rating }));
    // Background sync
    void sql`
      INSERT INTO resource_ratings (share_id, resource_id, rating)
      VALUES (${shareId}, ${resourceId}, ${rating})
      ON CONFLICT (share_id, resource_id) DO UPDATE SET rating = ${rating}
    `.catch(console.error);
  }

  if (loading) return <Spinner />;

  if (!profile) return <Spinner />; // redirect in-flight

  // ── Derived values ───────────────────────────────────────────────
  const score = assessment?.score ?? 0;
  const categoryScores = assessment?.category_scores ?? [];
  const weakest = [...categoryScores]
    .sort((a, b) => a.score - b.score)
    .slice(0, 2)
    .map((s) => s.id) as CategoryId[];
  const assignedPhase = derivePhase(score, profile.current_status);
  const levelInfo = getLevelInfo(score);

  const ALL_HUB = buildHubResources();

  // ── Styles ───────────────────────────────────────────────────────
  const surface: React.CSSProperties = {
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 14,
  };

  return (
    <Layout>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "48px 24px 100px" }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 40 }}>
          {/* Level badge */}
          <div style={{ marginBottom: 12 }}>
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              backgroundColor: "rgba(99,102,241,0.12)",
              border: "1px solid rgba(99,102,241,0.25)",
              color: "var(--primary)",
              fontSize: 12,
              fontWeight: 700,
              padding: "4px 12px",
              borderRadius: 999,
              letterSpacing: "0.04em",
            }}>
              {levelInfo.emoji} {levelInfo.label}
            </span>
          </div>

          <h1 style={{ fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 800, color: "#ffffff", lineHeight: 1.15, marginBottom: 8 }}>
            Your Personalized Hub
          </h1>
          <p style={{ fontSize: 16, color: "var(--foreground)", opacity: 0.55, marginBottom: 20 }}>
            Curated for your goal: <strong style={{ color: "var(--foreground)", opacity: 0.9 }}>{profile.main_goal}</strong>
            {" · "}
            {profile.time_per_week}/week
          </p>

          {/* Overall progress (all phases) */}
          {(() => {
            const total = ALL_HUB.length;
            const done = Object.values(completed).filter(Boolean).length;
            return (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1, maxWidth: 320, height: 6, backgroundColor: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${total === 0 ? 0 : (done / total) * 100}%`,
                    backgroundColor: "var(--primary)",
                    borderRadius: 3,
                    transition: "width 0.4s",
                  }} />
                </div>
                <span style={{ fontSize: 12, fontFamily: "monospace", color: "var(--foreground)", opacity: 0.45 }}>
                  {done} resources completed
                </span>
              </div>
            );
          })()}
        </div>

        {/* ── Phase tabs ── */}
        <div style={{ display: "flex", gap: 10, marginBottom: 32, flexWrap: "wrap" }}>
          {PHASES.map(({ num, title, subtitle }) => {
            const isActive = activePhase === num;
            const isLocked = num > assignedPhase;
            const phaseResources = filterPhaseResources(ALL_HUB, num, profile, weakest);
            const phaseCompleted = phaseResources.filter((r) => completed[r.id]).length;

            return (
              <button
                key={num}
                disabled={isLocked}
                onClick={() => !isLocked && setActivePhase(num)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 2,
                  padding: "12px 18px",
                  borderRadius: 12,
                  border: isActive
                    ? "1px solid rgba(99,102,241,0.6)"
                    : "1px solid var(--border)",
                  backgroundColor: isActive ? "rgba(99,102,241,0.10)" : "var(--surface)",
                  cursor: isLocked ? "not-allowed" : "pointer",
                  opacity: isLocked ? 0.4 : 1,
                  transition: "all 0.15s",
                  textAlign: "left",
                  minWidth: 140,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {isLocked && <Lock size={11} color="var(--foreground)" opacity={0.5} />}
                  <span style={{
                    fontFamily: "monospace",
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: isActive ? "var(--primary)" : "var(--foreground)",
                    opacity: isActive ? 1 : 0.45,
                  }}>
                    Phase {num}
                  </span>
                  {!isLocked && (
                    <span style={{
                      fontSize: 10,
                      fontFamily: "monospace",
                      color: "var(--foreground)",
                      opacity: 0.35,
                    }}>
                      {phaseCompleted}/{phaseResources.length}
                    </span>
                  )}
                </div>
                <span style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: isActive ? "#ffffff" : "var(--foreground)",
                  opacity: isActive ? 1 : 0.7,
                }}>
                  {title}
                </span>
                <span style={{
                  fontSize: 11,
                  color: "var(--foreground)",
                  opacity: 0.4,
                  lineHeight: 1.4,
                }}>
                  {subtitle}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Active phase content ── */}
        {PHASES.filter((p) => p.num === activePhase).map(({ num, title, subtitle }) => {
          const resources = filterPhaseResources(ALL_HUB, num, profile, weakest);
          const doneCount = resources.filter((r) => completed[r.id]).length;
          const isLocked = num > assignedPhase;

          return (
            <div key={num}>
              {/* Phase header */}
              <div style={{ ...surface, padding: "20px 24px", marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
                  <div>
                    <p style={{ fontFamily: "monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--primary)", marginBottom: 4 }}>
                      Phase {num}
                    </p>
                    <h2 style={{ fontSize: 22, fontWeight: 800, color: "#ffffff", marginBottom: 2 }}>
                      {title}
                    </h2>
                    <p style={{ fontSize: 14, color: "var(--foreground)", opacity: 0.5 }}>
                      {subtitle}
                    </p>
                  </div>
                  {num === assignedPhase && (
                    <span style={{
                      display: "inline-flex",
                      alignItems: "center",
                      backgroundColor: "rgba(99,102,241,0.12)",
                      border: "1px solid rgba(99,102,241,0.25)",
                      color: "var(--primary)",
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "4px 10px",
                      borderRadius: 999,
                      whiteSpace: "nowrap",
                    }}>
                      Your starting point
                    </span>
                  )}
                </div>
                <PhaseProgress completed={doneCount} total={resources.length} />
              </div>

              {/* Resource cards */}
              {resources.length === 0 ? (
                <p style={{ color: "var(--foreground)", opacity: 0.4, textAlign: "center", padding: "40px 0" }}>
                  No resources for this phase yet.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {resources.map((r) => (
                    <ResourceCard
                      key={r.id}
                      resource={r}
                      completed={!!completed[r.id]}
                      rating={ratings[r.id] ?? 0}
                      locked={isLocked}
                      onComplete={() => handleComplete(r.id)}
                      onRate={(n) => handleRate(r.id, n)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}

      </div>
    </Layout>
  );
}
