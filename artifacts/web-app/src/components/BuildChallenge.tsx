import { useState } from "react";
import type { Level } from "@/lib/data/scoring";
import { levelLabel } from "@/lib/data/scoring";
import { getChallengesForLevel } from "@/lib/data/challenges";

// ── Types ─────────────────────────────────────────────────────────
type SubmitResponse = {
  feedback: string;
  status: "auto-approved" | "needs-human-review";
};

// ── Shared style constants ────────────────────────────────────────
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
  const [result, setResult] = useState<SubmitResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const challenges = getChallengesForLevel(confirmedLevel);
  const selected = challenges.find((c) => c.id === selectedId);

  const canSubmit =
    !loading &&
    !result &&
    (tab === "examples" ? selectedId !== null : customText.trim().length > 0);

  async function handleSubmit() {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);

    const isCustom = tab === "custom";
    const description = isCustom
      ? customText.trim()
      : (selected?.description ?? "");

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

      const data = (await res.json()) as SubmitResponse & { error?: string };

      if (!res.ok) {
        setError(data.error ?? `Request failed (${res.status})`);
        return;
      }

      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }

  const tabBtn = (
    id: "examples" | "custom",
    label: string,
  ): React.CSSProperties => ({
    flex: 1,
    padding: "9px 0",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    transition: "background-color 0.15s, color 0.15s",
    backgroundColor:
      tab === id ? "var(--primary)" : "transparent",
    color: tab === id ? "#fff" : "var(--foreground)",
  });
  void tabBtn; // referenced inline below

  return (
    <div style={card}>
      {/* Heading */}
      <p
        style={{
          fontSize: 12,
          fontFamily: "monospace",
          color: "var(--foreground)",
          opacity: 0.45,
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          marginBottom: 8,
        }}
      >
        {levelLabel(confirmedLevel)} · Build Challenge
      </p>
      <h2
        style={{
          fontSize: 18,
          fontWeight: 800,
          color: "#fff",
          marginBottom: 20,
        }}
      >
        Put it into practice
      </h2>

      {/* Tab toggle */}
      <div
        style={{
          display: "flex",
          gap: 4,
          backgroundColor: "var(--background)",
          borderRadius: 10,
          padding: 4,
          marginBottom: 20,
        }}
      >
        {(["examples", "custom"] as const).map((id) => (
          <button
            key={id}
            onClick={() => { setTab(id); setSelectedId(null); setResult(null); setError(null); }}
            disabled={!!result}
            style={{
              flex: 1,
              padding: "9px 0",
              borderRadius: 8,
              border: "none",
              cursor: result ? "default" : "pointer",
              fontSize: 13,
              fontWeight: 600,
              backgroundColor: tab === id ? "var(--primary)" : "transparent",
              color: tab === id ? "#fff" : "var(--foreground)",
              opacity: result && tab !== id ? 0.35 : 1,
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
              onClick={() => !result && setSelectedId(c.id)}
              disabled={!!result}
              style={{
                textAlign: "left",
                padding: "14px 16px",
                borderRadius: 10,
                border: `1px solid ${selectedId === c.id ? "var(--primary)" : "var(--border)"}`,
                backgroundColor:
                  selectedId === c.id
                    ? "rgba(99,102,241,0.12)"
                    : "var(--background)",
                cursor: result ? "default" : "pointer",
                transition: "border-color 0.15s, background-color 0.15s",
              }}
            >
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: selectedId === c.id ? "var(--primary)" : "#fff",
                  marginBottom: 4,
                }}
              >
                {c.title}
              </p>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--foreground)",
                  opacity: 0.65,
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
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
          disabled={!!result}
          rows={3}
          style={{
            width: "100%",
            boxSizing: "border-box",
            backgroundColor: "var(--background)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            color: "var(--foreground)",
            fontSize: 14,
            padding: "10px 12px",
            resize: "vertical",
            fontFamily: "inherit",
            marginBottom: 20,
            opacity: result ? 0.5 : 1,
          }}
        />
      )}

      {/* Submit */}
      {!result && (
        <button
          onClick={() => void handleSubmit()}
          disabled={!canSubmit}
          style={{
            padding: "10px 24px",
            borderRadius: 8,
            border: "none",
            backgroundColor:
              canSubmit ? "var(--primary)" : "rgba(99,102,241,0.25)",
            color: "#fff",
            fontWeight: 700,
            fontSize: 14,
            cursor: canSubmit ? "pointer" : "not-allowed",
            opacity: canSubmit ? 1 : 0.5,
          }}
        >
          {loading ? "Reviewing…" : "Submit"}
        </button>
      )}

      {/* Error */}
      {error && (
        <p
          style={{
            marginTop: 12,
            fontSize: 13,
            color: "#f87171",
            lineHeight: 1.5,
          }}
        >
          {error}
        </p>
      )}

      {/* Result */}
      {result && (
        <div
          style={{
            marginTop: 4,
            padding: "16px 18px",
            borderRadius: 10,
            border: `1px solid ${
              result.status === "auto-approved"
                ? "rgba(34,197,94,0.3)"
                : "rgba(251,191,36,0.3)"
            }`,
            backgroundColor:
              result.status === "auto-approved"
                ? "rgba(34,197,94,0.07)"
                : "rgba(251,191,36,0.07)",
          }}
        >
          {/* Status badge */}
          <div style={{ marginBottom: 10 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "3px 10px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 700,
                fontFamily: "monospace",
                backgroundColor:
                  result.status === "auto-approved"
                    ? "rgba(34,197,94,0.15)"
                    : "rgba(251,191,36,0.15)",
                color:
                  result.status === "auto-approved"
                    ? "var(--success, #22c55e)"
                    : "#fbbf24",
                border: `1px solid ${
                  result.status === "auto-approved"
                    ? "rgba(34,197,94,0.3)"
                    : "rgba(251,191,36,0.3)"
                }`,
              }}
            >
              {result.status === "auto-approved"
                ? "✅ Approved, go build it"
                : "🟡 Flagged for a quick review"}
            </span>
          </div>

          {/* Feedback text */}
          <p
            style={{
              fontSize: 14,
              color: "var(--foreground)",
              lineHeight: 1.65,
              margin: 0,
              opacity: 0.85,
            }}
          >
            {result.feedback}
          </p>
        </div>
      )}
    </div>
  );
}
