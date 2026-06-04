import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import Layout from "@/components/Layout";
import { VIDEOS, COWORK_SKILLS, STACK } from "@/lib/data/resources";
import { levelLabel } from "@/lib/data/scoring";
import type { Level } from "@/lib/data/scoring";
import type { Resource } from "@/lib/data/resources";
import PersonalizedHub from "./PersonalizedHub";

type Tab = "all" | "videos" | "skills" | "stack";
type LevelFilter = "all" | Level;

// ── Style helpers ─────────────────────────────────────────────────
const surface: React.CSSProperties = {
  backgroundColor: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 12,
};

const pillBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: 999,
  fontWeight: 600,
  cursor: "pointer",
  border: "none",
  transition: "opacity 0.15s",
};

const activeTab: React.CSSProperties = {
  ...pillBase,
  backgroundColor: "var(--primary)",
  color: "#ffffff",
  padding: "8px 18px",
  fontSize: 14,
};

const inactiveTab: React.CSSProperties = {
  ...pillBase,
  backgroundColor: "var(--surface)",
  border: "1px solid var(--border)",
  color: "var(--foreground)",
  opacity: 0.6,
  padding: "8px 18px",
  fontSize: 14,
};

const activeLevel: React.CSSProperties = {
  ...pillBase,
  backgroundColor: "var(--primary)",
  color: "#ffffff",
  padding: "5px 14px",
  fontSize: 12,
};

const inactiveLevel: React.CSSProperties = {
  ...pillBase,
  backgroundColor: "var(--surface)",
  border: "1px solid var(--border)",
  color: "var(--foreground)",
  opacity: 0.6,
  padding: "5px 14px",
  fontSize: 12,
};

const externalBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  backgroundColor: "var(--primary)",
  color: "#ffffff",
  fontWeight: 600,
  fontSize: 13,
  padding: "7px 14px",
  borderRadius: 7,
  textDecoration: "none",
  whiteSpace: "nowrap",
  flexShrink: 0,
};

function LevelBadge({ level }: { level: Level }) {
  const colors: Record<Level, string> = {
    beginner: "rgba(34,197,94,0.15)",
    intermediate: "rgba(99,102,241,0.15)",
    advanced: "rgba(249,115,22,0.15)",
  };
  const text: Record<Level, string> = {
    beginner: "#22c55e",
    intermediate: "var(--primary)",
    advanced: "#f97316",
  };
  return (
    <span
      style={{
        display: "inline-block",
        backgroundColor: colors[level],
        color: text[level],
        fontSize: 11,
        fontWeight: 700,
        padding: "3px 10px",
        borderRadius: 999,
        textTransform: "capitalize",
        letterSpacing: "0.04em",
        whiteSpace: "nowrap",
      }}
    >
      {level}
    </span>
  );
}

function CountBadge({ n }: { n: number }) {
  return (
    <span
      style={{
        backgroundColor: "rgba(99,102,241,0.15)",
        color: "var(--primary)",
        fontSize: 12,
        fontWeight: 700,
        padding: "2px 10px",
        borderRadius: 999,
        marginLeft: 10,
      }}
    >
      {n}
    </span>
  );
}

function CategoryPills({ categories }: { categories: string[] }) {
  const labels: Record<string, string> = {
    "ai-tools": "AI Tools",
    "deployment": "Deployment",
    "auth-data": "Auth & Data",
    "ux-design": "UX Design",
    "product": "Product",
  };
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
      {categories.map((c) => (
        <span
          key={c}
          style={{
            fontSize: 11,
            padding: "2px 8px",
            borderRadius: 999,
            backgroundColor: "rgba(255,255,255,0.06)",
            color: "var(--foreground)",
            opacity: 0.55,
          }}
        >
          {labels[c] ?? c}
        </span>
      ))}
    </div>
  );
}

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div style={{ textAlign: "center", padding: "40px 0", color: "var(--foreground)", opacity: 0.45 }}>
      <p style={{ marginBottom: 12, fontSize: 15 }}>No resources match this filter.</p>
      <button
        onClick={onClear}
        style={{
          background: "none",
          border: "none",
          color: "var(--primary)",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
          textDecoration: "underline",
        }}
      >
        Clear filters
      </button>
    </div>
  );
}

function SectionRule() {
  return <hr style={{ borderTop: "1px solid var(--border)", margin: "40px 0" }} />;
}

// ── Video card ─────────────────────────────────────────────────────
function VideoCard({ r }: { r: Resource }) {
  return (
    <div
      style={{
        ...surface,
        padding: 20,
        display: "flex",
        justifyContent: "space-between",
        gap: 20,
        alignItems: "flex-start",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 700, fontSize: 15, color: "#ffffff", marginBottom: 6 }}>{r.title}</p>
        <p style={{ fontSize: 13, color: "var(--foreground)", opacity: 0.6, lineHeight: 1.55, marginBottom: 8 }}>
          {r.description}
        </p>
        {r.meta && (
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 11,
              backgroundColor: "rgba(255,255,255,0.06)",
              color: "var(--foreground)",
              opacity: 0.55,
              padding: "2px 8px",
              borderRadius: 999,
            }}
          >
            {r.meta}
          </span>
        )}
        <CategoryPills categories={r.categories} />
      </div>
      <div
        style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10, flexShrink: 0 }}
      >
        <LevelBadge level={r.level} />
        <a href={r.url} target="_blank" rel="noopener noreferrer" style={externalBtn}>
          Watch <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
}

// ── Skill card ─────────────────────────────────────────────────────
function SkillCard({ r }: { r: Resource }) {
  return (
    <div
      style={{
        ...surface,
        padding: 20,
        display: "flex",
        justifyContent: "space-between",
        gap: 20,
        alignItems: "flex-start",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 700, fontSize: 15, color: "#ffffff", marginBottom: 6 }}>{r.title}</p>
        <p style={{ fontSize: 13, color: "var(--foreground)", opacity: 0.6, lineHeight: 1.55, marginBottom: 8 }}>
          {r.description}
        </p>
        {r.meta && (
          <p style={{ fontFamily: "monospace", fontSize: 11, color: "var(--foreground)", opacity: 0.4, fontStyle: "italic" }}>
            {r.meta}
          </p>
        )}
        <CategoryPills categories={r.categories} />
      </div>
      <div
        style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10, flexShrink: 0 }}
      >
        <LevelBadge level={r.level} />
        <a href={r.url} target="_blank" rel="noopener noreferrer" style={externalBtn}>
          View on GitHub <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
}

// ── Stack tool card ────────────────────────────────────────────────
function ToolCard({ r }: { r: Resource }) {
  return (
    <div
      style={{
        ...surface,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: 10,
      }}
    >
      <p style={{ fontWeight: 700, fontSize: 15, color: "#ffffff" }}>{r.title}</p>
      <p style={{ fontSize: 13, color: "var(--foreground)", opacity: 0.6, lineHeight: 1.5 }}>
        {r.description}
      </p>
      <LevelBadge level={r.level} />
      <a
        href={r.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: "var(--primary)",
          fontSize: 13,
          fontWeight: 600,
          textDecoration: "none",
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          marginTop: "auto",
        }}
      >
        Visit <ExternalLink size={11} />
      </a>
    </div>
  );
}

// ── Route switcher ─────────────────────────────────────────────────
export default function Hub() {
  const [searchParams] = useSearchParams();
  const shareId = searchParams.get("id");
  if (shareId) return <PersonalizedHub shareId={shareId} />;
  return <ResourceDirectory />;
}

// ── Resource directory (the /resources page) ───────────────────────
function ResourceDirectory() {
  const [tab, setTab] = useState<Tab>("all");
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");
  const [resultLevel, setResultLevel] = useState<Level | undefined>(undefined);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("vibelab:result");
      if (raw) {
        const parsed = JSON.parse(raw) as { level?: Level };
        if (parsed.level) {
          setResultLevel(parsed.level);
          setLevelFilter(parsed.level);
        }
      }
    } catch {
      // ignore malformed JSON
    }
  }, []);

  function clearFilters() {
    setTab("all");
    setLevelFilter("all");
  }

  // Filter helper
  function filterByLevel<T extends Resource>(items: T[]): T[] {
    if (levelFilter === "all") return items;
    return items.filter((r) => r.level === levelFilter);
  }

  const visibleVideos = filterByLevel(VIDEOS);
  const visibleSkills = filterByLevel(COWORK_SKILLS);
  const visibleStack = filterByLevel(STACK);

  const showVideos = tab === "all" || tab === "videos";
  const showSkills = tab === "all" || tab === "skills";
  const showStack = tab === "all" || tab === "stack";

  // Group stack by group field
  const stackGroups = visibleStack.reduce<Record<string, typeof visibleStack>>((acc, tool) => {
    const g = (tool as typeof tool & { group: string }).group;
    if (!acc[g]) acc[g] = [];
    acc[g].push(tool);
    return acc;
  }, {});

  const TABS: { id: Tab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "videos", label: "Videos" },
    { id: "skills", label: "Skills" },
    { id: "stack", label: "Stack" },
  ];

  const LEVELS: { id: LevelFilter; label: string }[] = [
    { id: "all", label: "All Levels" },
    { id: "beginner", label: "Beginner" },
    { id: "intermediate", label: "Intermediate" },
    { id: "advanced", label: "Advanced" },
  ];

  return (
    <Layout>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "60px 24px 100px" }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 40 }}>
          <h1
            style={{ fontSize: 40, fontWeight: 800, color: "#ffffff", marginBottom: 12, lineHeight: 1.15 }}
          >
            Resources
          </h1>
          <p
            style={{ fontSize: 17, color: "var(--foreground)", opacity: 0.6, lineHeight: 1.6, maxWidth: 640, marginBottom: 16 }}
          >
            The signal amidst the noise. Zero-fluff tutorials, Cowork skills, and a vetted stack — filtered by your level.
          </p>

          {resultLevel && levelFilter !== "all" && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  backgroundColor: "rgba(99,102,241,0.10)",
                  border: "1px solid rgba(99,102,241,0.25)",
                  color: "var(--primary)",
                  fontSize: 13,
                  fontWeight: 600,
                  padding: "5px 14px",
                  borderRadius: 999,
                }}
              >
                Showing resources for your level: {levelLabel(resultLevel)}
                <button
                  onClick={() => setLevelFilter("all")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--primary)",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 700,
                    padding: 0,
                    opacity: 0.7,
                  }}
                >
                  × reset
                </button>
              </span>
            </div>
          )}
        </div>

        {/* ── Filter bar ── */}
        <div style={{ marginBottom: 40 }}>
          {/* Row 1: Type tabs */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={tab === t.id ? activeTab : inactiveTab}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Row 2: Level filter */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {LEVELS.map((l) => (
              <button
                key={l.id}
                onClick={() => setLevelFilter(l.id)}
                style={levelFilter === l.id ? activeLevel : inactiveLevel}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Section A: Videos ── */}
        {showVideos && (
          <div>
            <h2
              style={{ fontSize: 22, fontWeight: 700, color: "#ffffff", marginBottom: 6, display: "flex", alignItems: "center" }}
            >
              📺 Video Tutorials
              <CountBadge n={visibleVideos.length} />
            </h2>
            <div style={{ marginBottom: 20 }} />
            {visibleVideos.length === 0 ? (
              <EmptyState onClear={clearFilters} />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {visibleVideos.map((r) => <VideoCard key={r.id} r={r} />)}
              </div>
            )}
          </div>
        )}

        {/* ── Divider ── */}
        {tab === "all" && <SectionRule />}

        {/* ── Section B: Cowork Skills ── */}
        {showSkills && (
          <div>
            <h2
              style={{ fontSize: 22, fontWeight: 700, color: "#ffffff", marginBottom: 6, display: "flex", alignItems: "center" }}
            >
              🛠️ Cowork Skills
              <CountBadge n={visibleSkills.length} />
            </h2>
            <p style={{ fontSize: 14, color: "var(--foreground)", opacity: 0.5, marginBottom: 20, lineHeight: 1.55 }}>
              Installable agent skills for Claude Code and Cowork. Each one activates automatically when you describe what you need.
            </p>
            {visibleSkills.length === 0 ? (
              <EmptyState onClear={clearFilters} />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {visibleSkills.map((r) => <SkillCard key={r.id} r={r} />)}
              </div>
            )}
          </div>
        )}

        {/* ── Divider ── */}
        {tab === "all" && <SectionRule />}

        {/* ── Section C: Vibe Stack ── */}
        {showStack && (
          <div>
            <h2
              style={{ fontSize: 22, fontWeight: 700, color: "#ffffff", marginBottom: 20, display: "flex", alignItems: "center" }}
            >
              ⚡ Vibe Stack
              <CountBadge n={visibleStack.length} />
            </h2>
            {visibleStack.length === 0 ? (
              <EmptyState onClear={clearFilters} />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                {Object.entries(stackGroups).map(([group, tools]) => (
                  <div key={group}>
                    <p
                      style={{
                        fontFamily: "monospace",
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color: "var(--foreground)",
                        opacity: 0.4,
                        marginBottom: 14,
                      }}
                    >
                      {group}
                    </p>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                        gap: 14,
                      }}
                    >
                      {tools.map((r) => <ToolCard key={r.id} r={r} />)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </Layout>
  );
}
