import { useState, useEffect } from "react";
import type { Level } from "@/lib/data/scoring";
import { levelLabel } from "@/lib/data/scoring";
import { getChallengesForLevel } from "@/lib/data/challenges";

// ── Persisted submission state ────────────────────────────────────
type SubmissionStatus = "auto-approved" | "needs-human-review" | "changes-requested";

type StoredSubmission = {
  id: number;
  status: SubmissionStatus;
  feedback: string;
  reviewNote?: string | null;
};

function readSubmission(): StoredSubmission | null {
  try {
    const raw = localStorage.getItem("vibelab:challenge-submission");
    return raw ? (JSON.parse(raw) as StoredSubmission) : null;
  } catch { return null; }
}

function writeSubmission(s: StoredSubmission): void {
  try { localStorage.setItem("vibelab:challenge-submission", JSON.stringify(s)); } catch { /* ignore */ }
}

// ── Shared style ──────────────────────────────────────────────────
const card: React.CSSProperties = {
  backgroundColor: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 16,
  padding: 24,
  marginBottom: 24,
};

// ── BuildChallenge ────────────────────────────────────────────────
export default function BuildChallenge({
  confirmedLevel,
  weakestCategory,
  userEmail,
  userId,
}: {
  confirmedLevel: Level;
  weakestCategory?: string;
  userEmail?: string;
  userId?: string;
}) {
  const [tab, setTab] = useState<"examples" | "custom">("examples");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [customText, setCustomText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submission, setSubmission] = useState<StoredSubmission | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  // On mount: restore stored submission and refresh status if it was flagged
  useEffect(() => {
    const stored = readSubmission();
    if (!stored) return;
    setSubmission(stored);

    if (stored.status === "needs-human-review" || stored.status === "changes-requested") {
      setCheckingStatus(true);
      fetch(`/api/challenge-status?id=${stored.id}`)
        .then(r => r.json() as Promise<{ status: string; ai_feedback: string; review_note: string | null }>)
        .then(data => {
          const updated: StoredSubmission = {
            id: stored.id,
            status: data.status as SubmissionStatus,
            feedback: data.ai_feedback,
            reviewNote: data.review_note,
          };
          writeSubmission(updated);
          setSubmission(updated);
        })
        .catch(() => { /* keep stored state on network error */ })
        .finally(() => setCheckingStatus(false));
    }
  }, []);

  const challenges = getChallengesForLevel(confirmedLevel);
  const selected = challenges.find((c) => c.id === selectedId);

  const canSubmit =
    !loading &&
    !submission &&
    (tab === "examples" ? selectedId !== null : customText.trim().length > 0);

  async function handleSubmit() {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);

    const isCustom = tab === "custom";
    const description = isCustom ? customText.trim() : (selected?.description ?? "");

    try {
      const res = await fetch("/api/submit-challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(userId ? { userId } : {}),
          ...(userEmail ? { email: userEmail } : {}),
          level: confirmedLevel,
          challengeType: isCustom ? "custom" : "use-case",
          ...(isCustom ? {} : { challengeId: selectedId }),
          description,
          ...(weakestCategory ? { weakestCategory } : {}),
        }),
      });

      const data = (await res.json()) as {
        feedback: string;
        status: SubmissionStatus;
        id?: number;
        error?: string;
      };

      if (!res.ok) {
        setError(data.error ?? `Request failed (${res.status})`);
        return;
      }

      const newSubmission: StoredSubmission = {
        id: data.id ?? 0,
        status: data.status,
        feedback: data.feedback,
      };
      writeSubmission(newSubmission);
      setSubmission(newSubmission);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }

  // ── Submission result display ─────────────────────────────────────
  if (checkingStatus && !submission) {
    return (
      <div style={card}>
        <p style={{ fontSize: 13, color: "var(--foreground)", opacity: 0.5 }}>
          Checking your submission status…
        </p>
      </div>
    );
  }

  if (submission) {
    const isApproved = submission.status === "auto-approved";
    const isChangesRequested = submission.status === "changes-requested";

    const borderColor = isApproved
      ? "rgba(34,197,94,0.3)"
      : isChangesRequested
      ? "rgba(239,68,68,0.3)"
      : "rgba(251,191,36,0.3)";

    const bgColor = isApproved
      ? "rgba(34,197,94,0.07)"
      : isChangesRequested
      ? "rgba(239,68,68,0.07)"
      : "rgba(251,191,36,0.07)";

    const badgeText = isApproved
      ? "✅ Approved, go build it"
      : isChangesRequested
      ? "🔴 Changes requested"
      : "🟡 Under review";

    const badgeBg = isApproved
      ? "rgba(34,197,94,0.15)"
      : isChangesRequested
      ? "rgba(239,68,68,0.15)"
      : "rgba(251,191,36,0.15)";

    const badgeColor = isApproved ? "#22c55e" : isChangesRequested ? "#f87171" : "#fbbf24";
    const badgeBorder = isApproved
      ? "rgba(34,197,94,0.3)"
      : isChangesRequested
      ? "rgba(239,68,68,0.3)"
      : "rgba(251,191,36,0.3)";

    return (
      <div style={card}>
        <p style={{ fontSize: 12, fontFamily: "monospace", color: "var(--foreground)", opacity: 0.45, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
          {levelLabel(confirmedLevel)} · Build Challenge
        </p>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 16 }}>
          Put it into practice
        </h2>
        <div style={{ padding: "16px 18px", borderRadius: 10, border: `1px solid ${borderColor}`, backgroundColor: bgColor }}>
          <div style={{ marginBottom: 10 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700,
              fontFamily: "monospace", backgroundColor: badgeBg, color: badgeColor,
              border: `1px solid ${badgeBorder}`,
            }}>
              {checkingStatus ? "Refreshing…" : badgeText}
            </span>
          </div>
          <p style={{ fontSize: 14, color: "var(--foreground)", lineHeight: 1.65, margin: 0, opacity: 0.85 }}>
            {submission.feedback}
          </p>
          {isChangesRequested && submission.reviewNote && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(239,68,68,0.2)" }}>
              <p style={{ fontSize: 12, fontFamily: "monospace", color: "#f87171", opacity: 0.7, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Feedback from Adamma
              </p>
              <p style={{ fontSize: 13, color: "var(--foreground)", lineHeight: 1.6, margin: 0 }}>
                {submission.reviewNote}
              </p>
            </div>
          )}
          {submission.status === "needs-human-review" && !checkingStatus && (
            <p style={{ marginTop: 10, fontSize: 12, color: "var(--foreground)", opacity: 0.5 }}>
              You'll hear back soon. Check this page again after a day or so.
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Submission form ───────────────────────────────────────────────
  return (
    <div style={card}>
      <p style={{ fontSize: 12, fontFamily: "monospace", color: "var(--foreground)", opacity: 0.45, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
        {levelLabel(confirmedLevel)} · Build Challenge
      </p>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 20 }}>
        Put it into practice
      </h2>

      {/* Tab toggle */}
      <div style={{ display: "flex", gap: 4, backgroundColor: "var(--background)", borderRadius: 10, padding: 4, marginBottom: 20 }}>
        {(["examples", "custom"] as const).map((id) => (
          <button
            key={id}
            onClick={() => { setTab(id); setSelectedId(null); setError(null); }}
            style={{
              flex: 1, padding: "9px 0", borderRadius: 8, border: "none",
              cursor: "pointer", fontSize: 13, fontWeight: 600,
              backgroundColor: tab === id ? "var(--primary)" : "transparent",
              color: tab === id ? "#fff" : "var(--foreground)",
            }}
          >
            {id === "examples" ? "Pick from examples" : "Describe your own"}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "examples" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          {challenges.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              style={{
                textAlign: "left", padding: "14px 16px", borderRadius: 10,
                border: `1px solid ${selectedId === c.id ? "var(--primary)" : "var(--border)"}`,
                backgroundColor: selectedId === c.id ? "rgba(99,102,241,0.12)" : "var(--background)",
                cursor: "pointer",
                transition: "border-color 0.15s, background-color 0.15s",
              }}
            >
              <p style={{ fontSize: 13, fontWeight: 700, color: selectedId === c.id ? "var(--primary)" : "#fff", marginBottom: 4 }}>
                {c.title}
              </p>
              <p style={{ fontSize: 13, color: "var(--foreground)", opacity: 0.65, lineHeight: 1.5, margin: 0 }}>
                {c.description}
              </p>
            </button>
          ))}
        </div>
      ) : (
        <textarea
          placeholder="What are you building?"
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          rows={3}
          style={{
            width: "100%", boxSizing: "border-box",
            backgroundColor: "var(--background)", border: "1px solid var(--border)",
            borderRadius: 8, color: "var(--foreground)", fontSize: 14,
            padding: "10px 12px", resize: "vertical", fontFamily: "inherit", marginBottom: 20,
          }}
        />
      )}

      <button
        onClick={() => void handleSubmit()}
        disabled={!canSubmit}
        style={{
          padding: "10px 24px", borderRadius: 8, border: "none",
          backgroundColor: canSubmit ? "var(--primary)" : "rgba(99,102,241,0.25)",
          color: "#fff", fontWeight: 700, fontSize: 14,
          cursor: canSubmit ? "pointer" : "not-allowed", opacity: canSubmit ? 1 : 0.5,
        }}
      >
        {loading ? "Reviewing…" : "Submit"}
      </button>

      {error && (
        <p style={{ marginTop: 12, fontSize: 13, color: "#f87171", lineHeight: 1.5 }}>
          {error}
        </p>
      )}
    </div>
  );
}
