import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import { useUser, SignInButton } from "@clerk/react";
import { toast } from "sonner";
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

type AggRating = { avg: number; total: number };

type ChallengeStep = "choose" | "confirm" | "success";
type ChallengeMode = "usecases" | "custom";

// ── Level metadata ─────────────────────────────────────────────────
const LEVEL_BADGES: Record<number, { title: string; emoji: string; nextTitle?: string; nextEmoji?: string }> = {
  1: { title: "Vibe Starter",   emoji: "⚡", nextTitle: "Vibe Builder",   nextEmoji: "🔥" },
  2: { title: "Vibe Builder",   emoji: "🔥", nextTitle: "Vibe Architect", nextEmoji: "🏆" },
  3: { title: "Vibe Architect", emoji: "🏆" },
};

// ── Phase metadata ────────────────────────────────────────────────
const PHASES: { num: PhaseNum; title: string; subtitle: string }[] = [
  { num: 1, title: "Foundation", subtitle: "Get your first thing live" },
  { num: 2, title: "Stack Up",   subtitle: "Build with a real stack" },
  { num: 3, title: "Ship It",    subtitle: "Product thinking, validate, launch" },
];

// ── Build Challenge use cases per level × phase ───────────────────
const BUILD_CASES: Record<number, Record<PhaseNum, string[]>> = {
  1: {
    1: [
      "Build a personal portfolio site",
      "Create a landing page for a product idea",
      "Build a simple lead capture form with email notification",
      "Set up an automated social post scheduler",
      "Build a basic AI chatbot for a topic you know well",
      "Create a newsletter signup page with a welcome email",
    ],
    2: [
      "Build a full CRUD app with a database",
      "Create a client dashboard with login and data",
      "Build a multi-step form with results",
      "Set up a Zapier automation that saves data to a spreadsheet",
      "Build an internal tool for a repetitive task you do",
      "Create an API that returns personalized recommendations",
    ],
    3: [
      "Launch a product with a waitlist and onboarding flow",
      "Build and publish a Cowork plugin",
      "Ship a SaaS with Stripe payment integration",
      "Create a content pipeline that runs automatically",
      "Build a multi-agent workflow that replaces a manual process",
      "Launch a productized service with a booking and delivery flow",
    ],
  },
  2: {
    1: [
      "Add authentication and a database to an existing project",
      "Build a CRUD app with real persistent storage",
      "Create a REST API with Express, Hono, or Fastify",
      "Add a Stripe payment flow to a landing page",
      "Build a dashboard that reads from a live database",
      "Migrate an app from local state to a serverless database",
    ],
    2: [
      "Build a multi-step form with email notifications and saved results",
      "Create a client portal with row-level data access",
      "Set up a full CI/CD pipeline from commit to production",
      "Build a webhook-driven automation with n8n or Make",
      "Create an internal admin tool for managing users or data",
      "Build a real-time feature using Supabase Realtime or Pusher",
    ],
    3: [
      "Ship a SaaS with Stripe subscriptions and usage limits",
      "Build a content management system for a real client",
      "Launch a product with analytics and error monitoring wired up",
      "Create a full API with authentication and rate limiting",
      "Build and deploy a complete multi-step onboarding flow",
      "Ship a production app with a custom domain and <500ms response times",
    ],
  },
  3: {
    1: [
      "Build an LLM-powered tool that replaces a manual workflow",
      "Create a custom MCP server that extends Claude Code",
      "Build an autonomous agent with memory and tool use",
      "Design and ship a production-grade RAG pipeline",
      "Build an AI API that other developers can integrate with",
      "Create a multi-agent system using Claude Code sub-agents",
    ],
    2: [
      "Scale an existing app to handle 10k+ concurrent users",
      "Build an event-driven microservices architecture",
      "Create a real-time collaboration feature using WebSockets",
      "Design and implement a monitoring stack with alerting",
      "Build a multi-tenant platform with isolated namespaces",
      "Create a developer-facing API with documentation and rate limiting",
    ],
    3: [
      "Productize an AI workflow and charge for it",
      "Build and launch a developer tool with a public API",
      "Create a system that generates revenue without your involvement",
      "Design an AI agent that manages a business process end-to-end",
      "Build, launch, and get your first paying user",
      "Write and publish a technical case study of something you shipped",
    ],
  },
};

// ── Deterministic confetti (phase challenge) ──────────────────────
const CONFETTI_COLORS = ["#6366f1", "#f59e0b", "#22c55e", "#f87171", "#a78bfa", "#34d399"];
const CONFETTI_PIECES = Array.from({ length: 32 }, (_, i) => ({
  id: i,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  left: `${(i * 3.25) % 100}%`,
  delay: `${(i * 0.055) % 0.85}s`,
  duration: `${0.65 + (i * 0.035) % 0.55}s`,
  size: 5 + (i % 5),
  rot: i % 2 === 0 ? "360deg" : "-360deg",
}));

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
  // Phase 1 — new tools
  "st-bolt": 1,
  "st-lovable": 1,
  "st-bubble": 1,
  "st-softr": 1,
  "st-glide": 1,
  "st-ui8": 1,
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
  // Phase 2 — new tools
  "st-shadcn": 2,
  "st-spline": 2,
  "st-v0": 2,
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
    url: "#", type: "video", level: "beginner", categories: ["deployment"], meta: "Coming soon", phase: 1,
  },
  {
    id: "ph-ai-prompt-patterns",
    title: "AI Prompt Patterns That Actually Work",
    description: "The 5 prompting patterns that consistently produce buildable code from Claude, Codex, and Replit Agent.",
    url: "#", type: "video", level: "beginner", categories: ["ai-tools"], meta: "Coming soon", phase: 1,
  },
  {
    id: "ph-stack-setup",
    title: "Full-Stack Setup: Neon + Clerk + Vercel",
    description: "Wire up a production-ready stack from scratch — database, auth, and deployment — in one afternoon.",
    url: "#", type: "video", level: "intermediate", categories: ["auth-data", "deployment"], meta: "Coming soon", phase: 2,
  },
  {
    id: "ph-validate-idea",
    title: "Validate Before You Build",
    description: "Use Ideabrowser, landing pages, and AI to test demand for your idea before writing a single line of code.",
    url: "#", type: "skill", level: "advanced", categories: ["product"], meta: "Coming soon", phase: 3,
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

/** Returns all hub resources annotated with a phase number from PHASE_MAP. */
function buildHubResources(): HubResource[] {
  const mapped = ALL_RESOURCES.map((r) => ({
    ...r,
    phase: (PHASE_MAP[r.id] ?? levelToPhase(r.level)) as PhaseNum,
  }));
  const all = [...mapped, ...PLACEHOLDERS];
  const p1 = all.filter((r) => r.phase === 1).length;
  const p2 = all.filter((r) => r.phase === 2).length;
  const p3 = all.filter((r) => r.phase === 3).length;
  console.log(`[buildHubResources] total=${all.length} | Phase1=${p1} Phase2=${p2} Phase3=${p3}`);
  return all;
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
    if (ls === "Watching videos") {
      if (a.type === "video" && b.type !== "video") return -1;
      if (b.type === "video" && a.type !== "video") return 1;
    } else if (ls === "Building things" || ls === "Being guided step by step") {
      if (a.type === "skill" && b.type !== "skill") return -1;
      if (b.type === "skill" && a.type !== "skill") return 1;
    }
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
      <div style={{ minHeight: "calc(100vh - 56px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          border: "3px solid var(--border)", borderTopColor: "var(--primary)",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </Layout>
  );
}

// ── Star rating (user's own) ──────────────────────────────────────
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
            background: "none", border: "none",
            cursor: locked ? "default" : "pointer",
            fontSize: 17, padding: "0 1px",
            color: n <= (hover || rating) ? "#f59e0b" : "rgba(255,255,255,0.15)",
            transition: "color 0.1s", lineHeight: 1,
          }}
        >★</button>
      ))}
    </div>
  );
}

// ── Aggregate rating display ──────────────────────────────────────
function AggRatingDisplay({ agg }: { agg: AggRating | undefined }) {
  if (!agg || agg.total === 0) {
    return <span style={{ fontSize: 11, color: "var(--foreground)", opacity: 0.3, fontFamily: "monospace" }}>No ratings yet</span>;
  }
  return (
    <span style={{ fontSize: 12, color: "var(--foreground)", opacity: 0.55, fontFamily: "monospace" }}>
      ⭐ {agg.avg.toFixed(1)} · {agg.total} {agg.total === 1 ? "rating" : "ratings"}
    </span>
  );
}

// ── Resource card ─────────────────────────────────────────────────
function ResourceCard({ resource, completed, rating, aggRating, locked, onComplete, onRate }: {
  resource: HubResource; completed: boolean; rating: number;
  aggRating: AggRating | undefined; locked: boolean;
  onComplete: () => void; onRate: (n: number) => void;
}) {
  const [installOpen, setInstallOpen] = useState(false);
  const installText = resource.type === "skill" ? (INSTALL_INSTRUCTIONS[resource.id] ?? null) : null;
  const isPlaceholder = resource.url === "#";

  const TYPE_BADGE: Record<string, { bg: string; color: string; label: string }> = {
    video: { bg: "rgba(239,68,68,0.12)",   color: "#f87171",       label: "Video" },
    skill: { bg: "rgba(99,102,241,0.12)",  color: "var(--primary)", label: "Cowork Skill" },
    tool:  { bg: "rgba(34,197,94,0.12)",   color: "#22c55e",        label: "Tool" },
  };
  const badge = TYPE_BADGE[resource.type] ?? TYPE_BADGE.tool;

  return (
    <div style={{
      backgroundColor: "var(--surface)",
      border: `1px solid ${completed ? "rgba(34,197,94,0.35)" : "var(--border)"}`,
      borderRadius: 14, padding: 20, opacity: locked ? 0.45 : 1,
      display: "flex", flexDirection: "column", gap: 12,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{
            display: "inline-block",
            backgroundColor: badge.bg, color: badge.color,
            fontSize: 10, fontWeight: 700, padding: "2px 8px",
            borderRadius: 999, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8,
          }}>{badge.label}</span>
          <p style={{ fontWeight: 700, fontSize: 15, color: "#ffffff", lineHeight: 1.3, marginBottom: 0 }}>
            {resource.title}
          </p>
        </div>
        {completed && (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            backgroundColor: "rgba(34,197,94,0.12)", color: "#22c55e",
            fontSize: 11, fontWeight: 700, padding: "3px 10px",
            borderRadius: 999, whiteSpace: "nowrap", flexShrink: 0,
          }}>✓ Done</span>
        )}
      </div>

      <p style={{ fontSize: 13, color: "var(--foreground)", opacity: 0.65, lineHeight: 1.6, margin: 0 }}>
        {resource.description}
      </p>

      {resource.meta && !isPlaceholder && (
        <span style={{
          display: "inline-block", fontFamily: "monospace", fontSize: 11,
          backgroundColor: "rgba(255,255,255,0.05)", color: "var(--foreground)",
          opacity: 0.5, padding: "2px 8px", borderRadius: 999,
        }}>{resource.meta}</span>
      )}

      {installText && (
        <div>
          <button
            onClick={() => setInstallOpen((o) => !o)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: 4,
              color: "var(--primary)", fontSize: 12, fontWeight: 600, padding: 0,
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
              borderRadius: 8, padding: "10px 14px",
              fontFamily: "monospace", fontSize: 12,
              color: "var(--foreground)", opacity: 0.8, lineHeight: 1.7,
            }}>{installText}</div>
          )}
        </div>
      )}

      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 10, paddingTop: 8, borderTop: "1px solid var(--border)",
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <StarRating rating={rating} onRate={onRate} locked={locked} />
            {rating > 0 && (
              <span style={{ fontSize: 10, color: "var(--foreground)", opacity: 0.35, fontFamily: "monospace" }}>
                your rating
              </span>
            )}
          </div>
          <AggRatingDisplay agg={aggRating} />
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {!isPlaceholder && (
            <a
              href={resource.url} target="_blank" rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                color: "var(--foreground)", opacity: 0.5, fontSize: 12, textDecoration: "none",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.5")}
            >
              Open <ExternalLink size={11} />
            </a>
          )}

          {!locked && (
            <button
              onClick={onComplete} disabled={completed}
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                backgroundColor: completed ? "rgba(34,197,94,0.12)" : "var(--primary)",
                color: completed ? "#22c55e" : "#ffffff",
                border: completed ? "1px solid rgba(34,197,94,0.3)" : "none",
                fontSize: 12, fontWeight: 600, padding: "6px 14px",
                borderRadius: 7, cursor: completed ? "default" : "pointer",
                whiteSpace: "nowrap", transition: "all 0.15s",
              }}
            >
              {completed ? "Completed ✓" : "Mark Complete"}
            </button>
          )}

          {locked && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--foreground)", opacity: 0.3, fontSize: 12 }}>
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
          height: "100%", width: `${pct}%`,
          backgroundColor: pct === 100 ? "#22c55e" : "var(--primary)",
          borderRadius: 3, transition: "width 0.4s ease, background-color 0.3s",
        }} />
      </div>
      <span style={{ fontSize: 12, fontFamily: "monospace", color: "var(--foreground)", opacity: 0.5, flexShrink: 0 }}>
        {completed}/{total}
      </span>
    </div>
  );
}

// ── Phase complete banner ─────────────────────────────────────────
function PhaseCompleteBanner({
  onStartChallenge,
  challengeStarted,
}: {
  onStartChallenge: () => void;
  challengeStarted: boolean;
}) {
  return (
    <div style={{
      marginTop: 32, borderRadius: 16, padding: 2,
      background: "linear-gradient(135deg, rgba(34,197,94,0.6) 0%, rgba(16,185,129,0.4) 100%)",
    }}>
      <div style={{ backgroundColor: "var(--background)", borderRadius: 14, padding: "28px 32px", textAlign: "center" }}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>🎉</div>
        <h3 style={{ fontSize: 20, fontWeight: 800, color: "#ffffff", marginBottom: 8 }}>
          Resources Complete!
        </h3>
        <p style={{ fontSize: 14, color: "var(--foreground)", opacity: 0.6, marginBottom: 20, lineHeight: 1.6 }}>
          You've worked through everything in this phase. Ready to put it into practice?
        </p>
        <button
          type="button"
          onClick={challengeStarted ? undefined : onStartChallenge}
          disabled={challengeStarted}
          style={{
            display: "inline-flex", alignItems: "center",
            backgroundColor: "#22c55e", color: "#ffffff",
            fontWeight: 700, fontSize: 14, padding: "12px 24px",
            borderRadius: 9, border: "none",
            cursor: challengeStarted ? "default" : "pointer",
            opacity: challengeStarted ? 0.75 : 1,
          }}
        >
          {challengeStarted ? "Build Challenge below ↓" : "Ready for your Build Challenge? →"}
        </button>
      </div>
    </div>
  );
}

// ── Phase challenge confetti ──────────────────────────────────────
function Confetti() {
  return (
    <div style={{ position: "relative", height: 60, overflow: "hidden", pointerEvents: "none", marginBottom: 8 }}>
      <style>{`
        @keyframes cfFall {
          0%   { transform: translateY(-8px) rotate(0deg);   opacity: 1; }
          100% { transform: translateY(72px) rotate(var(--r)); opacity: 0; }
        }
      `}</style>
      {CONFETTI_PIECES.map((p) => (
        <div key={p.id} style={{
          position: "absolute", top: 0, left: p.left,
          width: p.size, height: p.size,
          backgroundColor: p.color,
          borderRadius: p.id % 4 === 0 ? "50%" : 2,
          "--r": p.rot,
          animation: `cfFall ${p.duration} ${p.delay} ease-in both`,
        } as React.CSSProperties} />
      ))}
    </div>
  );
}

// ── Path selector card ────────────────────────────────────────────
function PathCard({ emoji, title, description, onClick }: {
  emoji: string; title: string; description: string; onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: hovered ? "rgba(99,102,241,0.08)" : "var(--surface)",
        border: `1px solid ${hovered ? "rgba(99,102,241,0.4)" : "var(--border)"}`,
        borderRadius: 14, padding: "22px 20px", textAlign: "left", cursor: "pointer",
        transition: "all 0.15s", display: "flex", flexDirection: "column", gap: 10,
      }}
    >
      <span style={{ fontSize: 28 }}>{emoji}</span>
      <span style={{ fontSize: 15, fontWeight: 700, color: "#ffffff", display: "block" }}>{title}</span>
      <span style={{ fontSize: 13, color: "var(--foreground)", opacity: 0.6, lineHeight: 1.5 }}>{description}</span>
    </button>
  );
}

// ── Use case selection card ───────────────────────────────────────
function UseCaseCard({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const active = hovered || selected;
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: active ? "rgba(99,102,241,0.10)" : "var(--surface)",
        border: `1px solid ${selected ? "var(--primary)" : active ? "rgba(99,102,241,0.35)" : "var(--border)"}`,
        borderRadius: 10, padding: "14px 16px", cursor: "pointer", textAlign: "left",
        color: active ? "#ffffff" : "var(--foreground)",
        fontSize: 14, fontWeight: active ? 600 : 400, lineHeight: 1.45,
        width: "100%", transition: "all 0.15s",
        display: "flex", alignItems: "flex-start", gap: 8,
      }}
    >
      <span style={{ color: "var(--primary)", opacity: selected ? 1 : 0, flexShrink: 0, marginTop: 1, transition: "opacity 0.1s" }}>✓</span>
      <span>{label}</span>
    </button>
  );
}

// ── Build Challenge component ─────────────────────────────────────
function BuildChallenge({
  phase,
  shareId,
  currentLevel,
  onComplete,
  onGraduate,
}: {
  phase: PhaseNum;
  shareId: string;
  currentLevel: number;
  onComplete: (newUnlocked: PhaseNum) => void;
  onGraduate: (newLevel: number | null) => void;
}) {
  const [mode, setMode] = useState<ChallengeMode | null>(null);
  const [selectedCase, setSelectedCase] = useState<string | null>(null);
  const [customText, setCustomText] = useState("");
  const [step, setStep] = useState<ChallengeStep>("choose");
  const [submitting, setSubmitting] = useState(false);

  const isLastPhase = phase === 3;
  const nextPhase = Math.min(3, phase + 1) as PhaseNum;
  const challengeData = selectedCase ?? customText;
  const canContinue = mode === "usecases" ? !!selectedCase : customText.length >= 20;

  // Use cases for this level + phase
  const levelCases = BUILD_CASES[currentLevel]?.[phase] ?? BUILD_CASES[1][phase];

  async function handleBuildItClick() {
    if (!canContinue) return;
    setSubmitting(true);
    const useCase = mode === "usecases" ? challengeData : null;
    const customDesc = mode === "custom" ? challengeData : null;
    const newPhase = isLastPhase ? (phase as PhaseNum) : nextPhase;

    try {
      const updates: Promise<unknown>[] = [
        sql`
          INSERT INTO user_build_projects (share_id, level, phase, use_case, custom_description)
          VALUES (${shareId}, ${currentLevel}, ${phase}, ${useCase}, ${customDesc})
          ON CONFLICT (share_id, level, phase) DO UPDATE
            SET use_case = ${useCase}, custom_description = ${customDesc}
        `,
      ];

      if (isLastPhase) {
        // Graduation: bump level (max 3), reset phase to 1
        updates.push(sql`
          UPDATE user_profiles
          SET current_level = CASE WHEN current_level < 3 THEN current_level + 1 ELSE current_level END,
              current_phase  = CASE WHEN current_level < 3 THEN 1 ELSE current_phase END
          WHERE share_id = ${shareId}
        `);
      } else {
        updates.push(sql`
          UPDATE user_profiles
          SET current_phase = GREATEST(current_phase, ${newPhase})
          WHERE share_id = ${shareId}
        `);
      }

      await Promise.all(updates);

      // Notify parent — order matters: onComplete first (updates completedChallengePhases),
      // then onGraduate (may reset level state). React 18 batches both.
      onComplete(newPhase);
      if (isLastPhase) {
        const newLevel = currentLevel < 3 ? currentLevel + 1 : null;
        onGraduate(newLevel);
      }
      setStep("success");
    } catch (err) {
      console.error("Challenge submit failed:", err);
      toast.error("Couldn't save — check your connection");
    } finally {
      setSubmitting(false);
    }
  }

  const wrap: React.CSSProperties = {
    marginTop: 32, borderRadius: 20, padding: 2, scrollMarginTop: 80,
    background: "linear-gradient(135deg, rgba(99,102,241,0.5) 0%, rgba(139,92,246,0.35) 50%, rgba(99,102,241,0.15) 100%)",
  };
  const inner: React.CSSProperties = {
    backgroundColor: "var(--background)", borderRadius: 18, padding: "36px 32px",
  };
  const continueBtn = (enabled: boolean): React.CSSProperties => ({
    backgroundColor: enabled ? "var(--primary)" : "var(--border)",
    color: enabled ? "#ffffff" : "var(--foreground)",
    fontWeight: 700, fontSize: 15, padding: "12px 28px",
    borderRadius: 10, border: "none",
    cursor: enabled ? "pointer" : "not-allowed",
    opacity: enabled ? 1 : 0.45, transition: "all 0.15s",
  });

  // ── Success screen ──
  if (step === "success") {
    return (
      <div id="build-challenge" style={wrap}>
        <div style={{ ...inner, textAlign: "center" }}>
          <Confetti />
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
          <h3 style={{ fontSize: 24, fontWeight: 800, color: "#ffffff", marginBottom: 8 }}>
            Phase {phase} Complete!
          </h3>
          <p style={{ fontSize: 16, color: "var(--foreground)", opacity: 0.65, lineHeight: 1.65, marginBottom: 24 }}>
            {isLastPhase
              ? "You've finished all three phases. Your graduation moment is loading…"
              : `Phase ${nextPhase} is now unlocked. Click the tab above to begin.`}
          </p>
          {!isLastPhase && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              backgroundColor: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)",
              color: "#22c55e", fontSize: 14, fontWeight: 700,
              padding: "8px 20px", borderRadius: 999,
            }}>
              ✅ Phase {nextPhase} unlocked
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Confirm screen ──
  if (step === "confirm") {
    const words = challengeData.split(" ");
    const preview = words.slice(0, 8).join(" ") + (words.length > 8 ? "..." : "");
    const message = isLastPhase
      ? "Amazing work. Go build it — this is what all three phases have been building toward."
      : mode === "usecases"
        ? `Great choice. Go build it — then come back to unlock Phase ${nextPhase}.`
        : `Love it. Go build "${preview}" — then come back to unlock Phase ${nextPhase}.`;

    return (
      <div id="build-challenge" style={wrap}>
        <div style={inner}>
          <p style={{ fontFamily: "monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--primary)", marginBottom: 16 }}>
            🏗️ Phase {phase} Build Challenge
          </p>

          <div style={{
            backgroundColor: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.18)",
            borderRadius: 12, padding: "14px 18px", marginBottom: 24,
          }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#ffffff", margin: 0 }}>
              {mode === "usecases" ? selectedCase : customText}
            </p>
          </div>

          <p style={{ fontSize: 16, color: "var(--foreground)", opacity: 0.75, lineHeight: 1.65, marginBottom: 28 }}>
            {message}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button
              onClick={() => void handleBuildItClick()}
              disabled={submitting}
              style={{
                backgroundColor: submitting ? "var(--border)" : "#22c55e",
                color: "#ffffff", fontWeight: 700, fontSize: 15,
                padding: "14px 28px", borderRadius: 10, border: "none",
                cursor: submitting ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "background-color 0.15s",
              }}
            >
              {submitting
                ? "Saving..."
                : isLastPhase
                  ? "I've shipped it! 🚀"
                  : `I've built it — unlock Phase ${nextPhase} →`}
            </button>
            <button
              onClick={() => setStep("choose")}
              style={{
                background: "none", border: "none", color: "var(--foreground)",
                opacity: 0.4, fontSize: 13, cursor: "pointer", padding: "4px 0",
                textDecoration: "underline", textUnderlineOffset: 3,
              }}
            >
              ← Go back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Choose screen ──
  return (
    <div id="build-challenge" style={wrap}>
      <div style={inner}>
        <p style={{ fontFamily: "monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--primary)", marginBottom: 12 }}>
          🏗️ Phase {phase} Build Challenge
        </p>
        <h3 style={{ fontSize: 22, fontWeight: 800, color: "#ffffff", marginBottom: 8, letterSpacing: "-0.01em", lineHeight: 1.25 }}>
          Before you unlock the next phase, put what you learned into action. Build something real.
        </h3>
        <p style={{ fontSize: 14, color: "var(--foreground)", opacity: 0.55, marginBottom: 28, lineHeight: 1.6 }}>
          Pick a use case or describe your own project.
        </p>

        {/* Mode selector */}
        {!mode && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14 }}>
            <PathCard
              emoji="🎯"
              title="Choose a use case"
              description="Pick from 6 project ideas matched to this phase."
              onClick={() => setMode("usecases")}
            />
            <PathCard
              emoji="✍️"
              title="Describe your own"
              description="Already have something in mind? Tell us what you're building."
              onClick={() => setMode("custom")}
            />
          </div>
        )}

        {/* Use case path */}
        {mode === "usecases" && (
          <div>
            <button
              onClick={() => { setMode(null); setSelectedCase(null); }}
              style={{
                background: "none", border: "none", color: "var(--primary)",
                fontSize: 13, cursor: "pointer", padding: "0 0 16px",
                fontWeight: 600, display: "flex", alignItems: "center", gap: 4,
              }}
            >
              ← Back
            </button>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 10, marginBottom: 24 }}>
              {levelCases.map((uc) => (
                <UseCaseCard key={uc} label={uc} selected={selectedCase === uc} onClick={() => setSelectedCase(uc)} />
              ))}
            </div>
            <button
              disabled={!selectedCase}
              onClick={() => { if (selectedCase) setStep("confirm"); }}
              style={continueBtn(!!selectedCase)}
            >
              Continue →
            </button>
          </div>
        )}

        {/* Custom description path */}
        {mode === "custom" && (
          <div>
            <button
              onClick={() => { setMode(null); setCustomText(""); }}
              style={{
                background: "none", border: "none", color: "var(--primary)",
                fontSize: 13, cursor: "pointer", padding: "0 0 16px",
                fontWeight: 600, display: "flex", alignItems: "center", gap: 4,
              }}
            >
              ← Back
            </button>
            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="What are you building? Describe it in a few sentences."
              rows={4}
              style={{
                width: "100%", backgroundColor: "var(--surface)",
                border: `1px solid ${customText.length >= 20 ? "rgba(99,102,241,0.4)" : "var(--border)"}`,
                borderRadius: 10, padding: "14px 16px",
                color: "var(--foreground)", fontSize: 15, lineHeight: 1.6,
                resize: "vertical", fontFamily: "inherit",
                outline: "none", marginBottom: 6, boxSizing: "border-box",
                transition: "border-color 0.15s",
              }}
            />
            <p style={{ fontSize: 12, color: "var(--foreground)", opacity: 0.4, fontFamily: "monospace", marginBottom: 20, textAlign: "right" }}>
              {customText.length} / 20 min characters
            </p>
            <button
              disabled={customText.length < 20}
              onClick={() => { if (customText.length >= 20) setStep("confirm"); }}
              style={continueBtn(customText.length >= 20)}
            >
              Continue →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Already-submitted banner (persistent across sessions) ─────────
function ChallengeDoneBanner({ phase }: { phase: PhaseNum }) {
  const isLast = phase === 3;
  return (
    <div style={{
      marginTop: 32, borderRadius: 14, padding: "18px 24px",
      backgroundColor: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.25)",
      display: "flex", alignItems: "center", gap: 14,
    }}>
      <span style={{ fontSize: 22, flexShrink: 0 }}>✅</span>
      <div>
        <p style={{ fontSize: 14, fontWeight: 700, color: "#22c55e", marginBottom: 2 }}>
          Build Challenge submitted
        </p>
        <p style={{ fontSize: 13, color: "var(--foreground)", opacity: 0.55 }}>
          {isLast
            ? "All phases complete at this level — you've graduated."
            : `Phase ${phase + 1} has been unlocked.`}
        </p>
      </div>
    </div>
  );
}

// ── Graduation modal ──────────────────────────────────────────────
function GraduationScreen({
  fromLevel,
  shareId,
  onEnterHub,
}: {
  fromLevel: number;
  shareId: string;
  onEnterHub: () => void;
}) {
  const isFinal = fromLevel === 3;
  const fromBadge = LEVEL_BADGES[fromLevel];
  const nextBadge = !isFinal ? LEVEL_BADGES[fromLevel + 1] : null;

  // Fire canvas-confetti when modal opens
  useEffect(() => {
    const burst = (x: number, y: number, spread: number) =>
      void confetti({
        particleCount: 80,
        spread,
        origin: { x, y },
        colors: ["#6366f1", "#a78bfa", "#f59e0b", "#22c55e", "#f87171", "#34d399"],
        gravity: 0.9,
        scalar: 1.1,
      });

    // Centre burst
    burst(0.5, 0.55, 90);
    // Side bursts after a short delay
    const t = setTimeout(() => {
      burst(0.15, 0.5, 70);
      burst(0.85, 0.5, 70);
    }, 350);

    return () => clearTimeout(t);
  }, []);

  function handleShare() {
    const url = `${window.location.origin}/hub?id=${shareId}`;
    void navigator.clipboard.writeText(url).then(() => {
      toast.success("Hub URL copied to clipboard!");
    });
  }

  return (
    // Backdrop
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      backgroundColor: "rgba(0,0,0,0.72)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px",
      backdropFilter: "blur(6px)",
    }}>
      {/* Modal card */}
      <div style={{
        position: "relative",
        backgroundColor: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 24,
        padding: "52px 40px 44px",
        maxWidth: 500, width: "100%",
        textAlign: "center",
        boxShadow: "0 40px 100px rgba(0,0,0,0.7)",
        animation: "modalIn 0.35s cubic-bezier(0.34,1.4,0.64,1) both",
      }}>
        {/* Close X */}
        <button
          onClick={onEnterHub}
          aria-label="Close"
          style={{
            position: "absolute", top: 16, right: 16,
            background: "none", border: "none",
            color: "var(--foreground)", opacity: 0.35, cursor: "pointer",
            fontSize: 18, lineHeight: 1, padding: "4px 6px",
            borderRadius: 6, transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.35")}
        >
          ✕
        </button>

        {/* Badge */}
        <div style={{
          fontSize: 72, lineHeight: 1, marginBottom: 24,
          animation: "badgeBounce 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.05s both",
          display: "block",
        }}>
          {isFinal ? "🏆" : nextBadge?.emoji}
        </div>

        <h2 style={{
          fontSize: "clamp(22px, 5vw, 30px)", fontWeight: 800,
          color: "#ffffff", marginBottom: 12, letterSpacing: "-0.02em", lineHeight: 1.2,
        }}>
          {isFinal
            ? "You're a Vibe Architect. 🏆"
            : `You've graduated from ${fromBadge.title}! 🎓`}
        </h2>

        <p style={{
          fontSize: 16, color: "var(--foreground)", opacity: 0.65,
          lineHeight: 1.65, marginBottom: 36,
        }}>
          {isFinal
            ? "You've completed the full Vibe Lab journey. You didn't just learn — you built."
            : `You're now a ${nextBadge?.title}. Your new learning hub is ready.`}
        </p>

        {isFinal ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <button
              onClick={handleShare}
              style={{
                backgroundColor: "var(--primary)", color: "#ffffff",
                fontWeight: 700, fontSize: 16, padding: "14px 36px",
                borderRadius: 10, border: "none", cursor: "pointer", width: "100%",
              }}
            >
              Share your journey 🔗
            </button>
            <p style={{ fontSize: 12, color: "var(--foreground)", opacity: 0.3, fontFamily: "monospace" }}>
              Copies your hub URL to clipboard
            </p>
          </div>
        ) : (
          <button
            onClick={onEnterHub}
            style={{
              backgroundColor: "var(--primary)", color: "#ffffff",
              fontWeight: 700, fontSize: 16, padding: "14px 36px",
              borderRadius: 10, border: "none", cursor: "pointer", width: "100%",
            }}
          >
            Enter {nextBadge?.title} Hub →
          </button>
        )}
      </div>

      <style>{`
        @keyframes modalIn {
          0%   { transform: scale(0.88) translateY(12px); opacity: 0; }
          100% { transform: scale(1)    translateY(0);    opacity: 1; }
        }
        @keyframes badgeBounce {
          0%   { transform: scale(0.3) rotate(-12deg); opacity: 0; }
          60%  { transform: scale(1.15) rotate(4deg);  opacity: 1; }
          100% { transform: scale(1)   rotate(0deg);   opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────
export default function PersonalizedHub({ shareId }: { shareId: string }) {
  const navigate = useNavigate();
  const { isLoaded, isSignedIn } = useUser();

  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [assignedPhase, setAssignedPhase] = useState<PhaseNum>(1);
  const [unlockedPhase, setUnlockedPhase] = useState<PhaseNum>(1);
  const [completedChallengePhases, setCompletedChallengePhases] = useState<Set<number>>(new Set());

  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [aggRatings, setAggRatings] = useState<Record<string, AggRating>>({});

  const [activePhase, setActivePhase] = useState<PhaseNum>(1);
  const [showChallenge, setShowChallenge] = useState(false);
  const [lockedTooltipPhase, setLockedTooltipPhase] = useState<PhaseNum | null>(null);

  // Graduation state
  const [showGraduation, setShowGraduation] = useState(false);
  const [graduationFromLevel, setGraduationFromLevel] = useState<number>(1);

  // Reset challenge UI when switching phases
  useEffect(() => {
    setShowChallenge(false);
  }, [activePhase]);

  // Clear locked tooltip after 2.5s
  useEffect(() => {
    if (!lockedTooltipPhase) return;
    const t = setTimeout(() => setLockedTooltipPhase(null), 2500);
    return () => clearTimeout(t);
  }, [lockedTooltipPhase]);

  // ── Load all data on mount ──────────────────────────────────────
  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    async function load() {
      try {
        const [assessmentRows, profileRows, completedRows, ratingRows, aggRows, buildProjectRows] = await Promise.all([
          sql`SELECT score, category_scores FROM assessment_results WHERE share_id = ${shareId} LIMIT 1`,
          sql`SELECT main_goal, time_per_week, learning_style, current_status, current_level, current_phase
              FROM user_profiles WHERE share_id = ${shareId} LIMIT 1`,
          sql`SELECT resource_id FROM user_resource_progress WHERE share_id = ${shareId}`,
          sql`SELECT resource_id, rating FROM resource_ratings WHERE share_id = ${shareId}`,
          sql`SELECT resource_id,
                     ROUND(AVG(rating)::numeric, 1)::float AS avg_rating,
                     COUNT(*)::int AS total_ratings
              FROM resource_ratings
              GROUP BY resource_id`,
          sql`SELECT phase FROM user_build_projects WHERE share_id = ${shareId} AND level = (
                SELECT current_level FROM user_profiles WHERE share_id = ${shareId} LIMIT 1
              )`,
        ]);

        if (cancelled) return;

        if (profileRows.length === 0) {
          navigate("/personalize", { replace: true });
          return;
        }

        const a = assessmentRows[0] as AssessmentData | undefined;
        const p = profileRows[0] as ProfileData;

        if (a) setAssessment(a);
        setProfile(p);

        // Hub level from profile
        const hubLevel = Math.min(3, Math.max(1, p.current_level)) as number;
        setCurrentLevel(hubLevel);

        // Completion map
        const cMap: Record<string, boolean> = {};
        for (const row of completedRows) cMap[(row as { resource_id: string }).resource_id] = true;
        setCompleted(cMap);

        // This-user ratings
        const rMap: Record<string, number> = {};
        for (const row of ratingRows) {
          const r = row as { resource_id: string; rating: number };
          rMap[r.resource_id] = r.rating;
        }
        setRatings(rMap);

        // Global aggregate ratings
        const aMap: Record<string, AggRating> = {};
        for (const row of aggRows) {
          const r = row as { resource_id: string; avg_rating: number; total_ratings: number };
          aMap[r.resource_id] = { avg: r.avg_rating, total: r.total_ratings };
        }
        setAggRatings(aMap);

        // Completed challenge phases for current level
        const cpSet = new Set<number>();
        for (const row of buildProjectRows) cpSet.add((row as { phase: number }).phase);
        setCompletedChallengePhases(cpSet);

        // Phase unlock: max of (derived from assessment) and (profile.current_phase)
        const derived = a ? derivePhase(a.score, p.current_status) : 1 as PhaseNum;
        const unlocked = Math.min(3, Math.max(derived, p.current_phase)) as PhaseNum;
        setAssignedPhase(derived);
        setUnlockedPhase(unlocked);
        setActivePhase(derived);
      } catch (err) {
        console.error("Failed to load hub data:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [shareId, navigate, isLoaded, isSignedIn]);

  // ── Mark complete ───────────────────────────────────────────────
  function handleComplete(resourceId: string) {
    setCompleted((prev) => ({ ...prev, [resourceId]: true }));
    void sql`
      INSERT INTO user_resource_progress (share_id, resource_id)
      VALUES (${shareId}, ${resourceId})
      ON CONFLICT (share_id, resource_id) DO NOTHING
    `.catch((err) => {
      console.error("Failed to save completion:", err);
      toast.error("Couldn't save — check your connection");
    });
  }

  // ── Rate resource ───────────────────────────────────────────────
  function handleRate(resourceId: string, newRating: number) {
    const prevRating = ratings[resourceId] ?? 0;
    setRatings((prev) => ({ ...prev, [resourceId]: newRating }));
    setAggRatings((prev) => {
      const existing = prev[resourceId];
      if (!existing) return { ...prev, [resourceId]: { avg: newRating, total: 1 } };
      const wasRated = prevRating > 0;
      if (wasRated) {
        const newAvg = (existing.avg * existing.total - prevRating + newRating) / existing.total;
        return { ...prev, [resourceId]: { avg: Math.round(newAvg * 10) / 10, total: existing.total } };
      }
      const newTotal = existing.total + 1;
      const newAvg = (existing.avg * existing.total + newRating) / newTotal;
      return { ...prev, [resourceId]: { avg: Math.round(newAvg * 10) / 10, total: newTotal } };
    });
    void sql`
      INSERT INTO resource_ratings (share_id, resource_id, rating)
      VALUES (${shareId}, ${resourceId}, ${newRating})
      ON CONFLICT (share_id, resource_id) DO UPDATE SET rating = ${newRating}
    `.catch((err) => {
      console.error("Failed to save rating:", err);
      toast.error("Couldn't save — check your connection");
    });
  }

  // ── Graduation handler ──────────────────────────────────────────
  function handleGraduate(newLevel: number | null) {
    console.log("[Graduation] triggered — fromLevel:", currentLevel, "→ newLevel:", newLevel);
    const fromLv = currentLevel;

    if (newLevel !== null) {
      // Update local state for the new level
      setCurrentLevel(newLevel);
      setUnlockedPhase(1 as PhaseNum);
      setAssignedPhase(1 as PhaseNum);
      setActivePhase(1 as PhaseNum);
      setCompletedChallengePhases(new Set());
      setShowChallenge(false);
    }

    setGraduationFromLevel(fromLv);
    setShowGraduation(true);
  }

  // ── Auth / loading guards ───────────────────────────────────────
  if (!isLoaded || loading) return <Spinner />;

  if (!isSignedIn) {
    return (
      <Layout>
        <div style={{
          minHeight: "calc(100vh - 56px)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          textAlign: "center", padding: "40px 24px",
        }}>
          <div style={{ maxWidth: 480 }}>
            <div style={{ fontSize: 40, marginBottom: 20 }}>🔒</div>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: "#ffffff", marginBottom: 12, letterSpacing: "-0.01em" }}>
              Sign in to view your hub
            </h2>
            <p style={{ color: "var(--foreground)", opacity: 0.6, fontSize: 16, lineHeight: 1.65, marginBottom: 32 }}>
              Your personalized learning hub is waiting. Create a free account or sign in to continue.
            </p>
            <SignInButton mode="modal">
              <button style={{
                backgroundColor: "var(--primary)", color: "#ffffff",
                fontWeight: 700, fontSize: 16, padding: "14px 32px",
                borderRadius: 10, border: "none", cursor: "pointer",
              }}>
                Sign in to continue →
              </button>
            </SignInButton>
          </div>
        </div>
      </Layout>
    );
  }

  if (!profile) return <Spinner />;

  // ── Derived values ───────────────────────────────────────────────
  const score = assessment?.score ?? 0;
  const categoryScores = assessment?.category_scores ?? [];
  const weakest = [...categoryScores]
    .sort((a, b) => a.score - b.score)
    .slice(0, 2)
    .map((s) => s.id) as CategoryId[];

  const levelBadge = LEVEL_BADGES[currentLevel] ?? LEVEL_BADGES[1];
  const ALL_HUB = buildHubResources();

  // Overall journey progress: Phase N of 9
  const journeyPhase = (currentLevel - 1) * 3 + activePhase;
  const journeyPct = Math.round((journeyPhase / 9) * 100);

  const surface: React.CSSProperties = {
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 14,
  };

  return (
    <>
      {/* Graduation screen overlay */}
      {showGraduation && (
        <GraduationScreen
          fromLevel={graduationFromLevel}
          shareId={shareId}
          onEnterHub={() => setShowGraduation(false)}
        />
      )}

      <Layout>
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "48px 24px 100px" }}>

          {/* ── Header ── */}
          <div style={{ marginBottom: 40 }}>
            {/* Level badge + level/phase indicator */}
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                backgroundColor: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)",
                color: "var(--primary)", fontSize: 12, fontWeight: 700,
                padding: "4px 12px", borderRadius: 999, letterSpacing: "0.04em",
              }}>
                {levelBadge.emoji} {levelBadge.title}
              </span>
              <span style={{
                display: "inline-flex", alignItems: "center",
                color: "var(--foreground)", opacity: 0.45,
                fontSize: 12, fontFamily: "monospace", letterSpacing: "0.04em",
              }}>
                Level {currentLevel} · Phase {activePhase}
              </span>
            </div>

            <h1 style={{ fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 800, color: "#ffffff", lineHeight: 1.15, marginBottom: 8 }}>
              Your Personalized Hub
            </h1>
            <p style={{ fontSize: 16, color: "var(--foreground)", opacity: 0.55, marginBottom: 20 }}>
              Curated for your goal:{" "}
              <strong style={{ color: "var(--foreground)", opacity: 0.9 }}>{profile.main_goal}</strong>
              {" · "}{profile.time_per_week}/week
            </p>

            {/* Journey progress — "Phase N of 9" */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1, maxWidth: 280, height: 5, backgroundColor: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{
                  height: "100%", width: `${journeyPct}%`,
                  backgroundColor: "var(--primary)", borderRadius: 3, transition: "width 0.5s ease",
                }} />
              </div>
              <span style={{ fontSize: 12, fontFamily: "monospace", color: "var(--foreground)", opacity: 0.4, whiteSpace: "nowrap" }}>
                Phase {journeyPhase} of 9 in your journey
              </span>
            </div>
          </div>

          {/* ── Phase tabs ── */}
          <div style={{ display: "flex", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
            {PHASES.map(({ num, title, subtitle }) => {
              const isActive = activePhase === num;
              const isLocked = num > unlockedPhase;
              const phaseResources = filterPhaseResources(ALL_HUB, num, profile, weakest);
              const phaseCompleted = phaseResources.filter((r) => completed[r.id]).length;
              const phaseComplete = phaseResources.length > 0 && phaseCompleted === phaseResources.length;
              const challengeSubmitted = completedChallengePhases.has(num);

              return (
                <button
                  key={num}
                  onClick={() => {
                    if (isLocked) {
                      setLockedTooltipPhase(num);
                    } else {
                      setLockedTooltipPhase(null);
                      setActivePhase(num);
                    }
                  }}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "flex-start",
                    gap: 2, padding: "12px 18px", borderRadius: 12,
                    border: isActive ? "1px solid rgba(99,102,241,0.6)" : isLocked ? "1px solid rgba(255,255,255,0.06)" : "1px solid var(--border)",
                    backgroundColor: isActive ? "rgba(99,102,241,0.10)" : isLocked ? "rgba(255,255,255,0.02)" : "var(--surface)",
                    cursor: isLocked ? "not-allowed" : "pointer",
                    opacity: isLocked ? 0.45 : 1,
                    transition: "all 0.15s", textAlign: "left", minWidth: 140,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {isLocked && <Lock size={11} color="var(--foreground)" opacity={0.5} />}
                    {challengeSubmitted && !isLocked && <span style={{ fontSize: 11 }}>✅</span>}
                    {phaseComplete && !challengeSubmitted && !isLocked && <span style={{ fontSize: 11 }}>🎉</span>}
                    <span style={{
                      fontFamily: "monospace", fontSize: 10,
                      textTransform: "uppercase", letterSpacing: "0.08em",
                      color: isActive ? "var(--primary)" : "var(--foreground)",
                      opacity: isActive ? 1 : 0.45,
                    }}>
                      Phase {num}
                    </span>
                    {!isLocked && (
                      <span style={{ fontSize: 10, fontFamily: "monospace", color: "var(--foreground)", opacity: 0.35 }}>
                        {phaseCompleted}/{phaseResources.length}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: isActive ? "#ffffff" : "var(--foreground)", opacity: isActive ? 1 : 0.7 }}>
                    {title}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--foreground)", opacity: 0.4, lineHeight: 1.4 }}>
                    {subtitle}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Locked phase tooltip */}
          {lockedTooltipPhase && (
            <div style={{
              marginBottom: 24,
              backgroundColor: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8, padding: "10px 16px",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <Lock size={13} color="var(--foreground)" opacity={0.4} />
              <span style={{ fontSize: 13, color: "var(--foreground)", opacity: 0.55 }}>
                Finish your Phase {lockedTooltipPhase - 1} Build Challenge to unlock Phase {lockedTooltipPhase}
              </span>
            </div>
          )}

          {!lockedTooltipPhase && <div style={{ marginBottom: 24 }} />}

          {/* ── Active phase content ── */}
          {PHASES.filter((p) => p.num === activePhase).map(({ num, title, subtitle }) => {
            const resources = filterPhaseResources(ALL_HUB, num, profile, weakest);
            const doneCount = resources.filter((r) => completed[r.id]).length;
            const isLocked = num > unlockedPhase;
            const phaseComplete = resources.length > 0 && doneCount === resources.length;
            const challengeSubmitted = completedChallengePhases.has(num);
            console.log(`[Phase ${num}] resources: ${resources.length}, done: ${doneCount}, phaseComplete: ${phaseComplete}, challengeSubmitted: ${challengeSubmitted}, isLocked: ${isLocked}`);

            // ── Locked phase content ──
            if (isLocked) {
              const prevPhase = (num - 1) as PhaseNum;
              return (
                <div key={num} style={{ textAlign: "center", padding: "60px 24px" }}>
                  <div style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    width: 64, height: 64, borderRadius: "50%",
                    backgroundColor: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    marginBottom: 20,
                  }}>
                    <Lock size={28} color="var(--foreground)" opacity={0.3} />
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: "var(--foreground)", opacity: 0.5, marginBottom: 8 }}>
                    Complete Phase {prevPhase} to unlock
                  </h3>
                  <p style={{ fontSize: 14, color: "var(--foreground)", opacity: 0.35, lineHeight: 1.6 }}>
                    Finish your Phase {prevPhase} Build Challenge to unlock this phase.
                  </p>
                </div>
              );
            }

            return (
              <div key={num}>
                {/* Phase header card */}
                <div style={{ ...surface, padding: "20px 24px", marginBottom: 24 }}>
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    flexWrap: "wrap", gap: 12, marginBottom: 12,
                  }}>
                    <div>
                      <p style={{
                        fontFamily: "monospace", fontSize: 10,
                        textTransform: "uppercase", letterSpacing: "0.1em",
                        color: "var(--primary)", marginBottom: 4,
                      }}>Phase {num}</p>
                      <h2 style={{ fontSize: 22, fontWeight: 800, color: "#ffffff", marginBottom: 2 }}>{title}</h2>
                      <p style={{ fontSize: 14, color: "var(--foreground)", opacity: 0.5 }}>{subtitle}</p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                      {num === assignedPhase && !phaseComplete && (
                        <span style={{
                          display: "inline-flex", alignItems: "center",
                          backgroundColor: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)",
                          color: "var(--primary)", fontSize: 11, fontWeight: 700,
                          padding: "4px 10px", borderRadius: 999, whiteSpace: "nowrap",
                        }}>Your starting point</span>
                      )}
                      {phaseComplete && !challengeSubmitted && (
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          backgroundColor: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)",
                          color: "#22c55e", fontSize: 11, fontWeight: 700,
                          padding: "4px 10px", borderRadius: 999, whiteSpace: "nowrap",
                        }}>🎉 Resources Complete</span>
                      )}
                      {challengeSubmitted && (
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          backgroundColor: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)",
                          color: "#22c55e", fontSize: 11, fontWeight: 700,
                          padding: "4px 10px", borderRadius: 999, whiteSpace: "nowrap",
                        }}>✅ Phase Complete</span>
                      )}
                    </div>
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
                        aggRating={aggRatings[r.id]}
                        locked={false}
                        onComplete={() => handleComplete(r.id)}
                        onRate={(n) => handleRate(r.id, n)}
                      />
                    ))}
                  </div>
                )}

                {/* Phase complete banner — stays visible after challenge is started */}
                {phaseComplete && !challengeSubmitted && (
                  <PhaseCompleteBanner
                    challengeStarted={showChallenge}
                    onStartChallenge={() => {
                      setShowChallenge(true);
                      requestAnimationFrame(() =>
                        requestAnimationFrame(() => {
                          document.getElementById("build-challenge")?.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          });
                        })
                      );
                    }}
                  />
                )}

                {/* Build Challenge — stays mounted through success step */}
                {showChallenge && !challengeSubmitted && (
                  <BuildChallenge
                    phase={num}
                    shareId={shareId}
                    currentLevel={currentLevel}
                    onComplete={(newUnlocked) => {
                      setCompletedChallengePhases((prev) => new Set([...prev, num]));
                      setUnlockedPhase((prev) => Math.max(prev, newUnlocked) as PhaseNum);
                    }}
                    onGraduate={handleGraduate}
                  />
                )}

                {/* Persistent done banner on subsequent loads */}
                {challengeSubmitted && !showChallenge && <ChallengeDoneBanner phase={num} />}
              </div>
            );
          })}

        </div>
      </Layout>
    </>
  );
}
