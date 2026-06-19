import { useState } from "react";
import { useUser } from "@clerk/react";
import Layout from "@/components/Layout";

const ADMIN_EMAIL = "aihemeson@gmail.com";

// ── Types ─────────────────────────────────────────────────────────
type QuestionEdit = {
  category: "ux-design" | "ai-tools";
  questionId: string;
  currentOptionText: string;
  suggestedOptionText: string;
  reason: string;
};

type ClassifyResponse = {
  category: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  bestSuitedFor: string;
  resourceSnippet: string;
  suggestedQuestionEdits: QuestionEdit[];
};

// ── Shared styles ─────────────────────────────────────────────────
const card: React.CSSProperties = {
  backgroundColor: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 16,
  padding: 24,
  marginBottom: 20,
};

const label: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  color: "var(--foreground)",
  marginBottom: 6,
  fontFamily: "monospace",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  backgroundColor: "var(--background)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--foreground)",
  fontSize: 14,
  padding: "10px 12px",
  fontFamily: "inherit",
  marginBottom: 16,
};

const btnPrimary: React.CSSProperties = {
  backgroundColor: "var(--primary)",
  color: "#fff",
  fontWeight: 700,
  fontSize: 14,
  padding: "11px 24px",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
};

const btnDisabled: React.CSSProperties = {
  ...btnPrimary,
  opacity: 0.45,
  cursor: "not-allowed",
};

const btnOutline: React.CSSProperties = {
  backgroundColor: "var(--surface)",
  color: "var(--foreground)",
  fontWeight: 600,
  fontSize: 13,
  padding: "7px 14px",
  borderRadius: 6,
  border: "1px solid var(--border)",
  cursor: "pointer",
};

const levelBadge = (level: string): React.CSSProperties => {
  const color =
    level === "Beginner"
      ? "#22c55e"
      : level === "Intermediate"
        ? "var(--primary)"
        : "#f97316";
  return {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: 999,
    backgroundColor: `${color}22`,
    border: `1px solid ${color}55`,
    color,
    fontSize: 11,
    fontFamily: "monospace",
    fontWeight: 700,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    marginLeft: 8,
  };
};

// ── Copy button ───────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button onClick={handleCopy} style={btnOutline}>
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

// ── Not authorized ────────────────────────────────────────────────
function NotAuthorized() {
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
        <p style={{ color: "var(--foreground)", opacity: 0.5, fontSize: 16 }}>
          Not authorized.
        </p>
      </div>
    </Layout>
  );
}

// ── Main page ─────────────────────────────────────────────────────
export default function ResourceIntake() {
  const { isLoaded, isSignedIn, user } = useUser();

  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ClassifyResponse | null>(null);

  // Gate: wait for Clerk to load
  if (!isLoaded) return null;

  const userEmail = user?.emailAddresses[0]?.emailAddress ?? "";
  if (!isSignedIn || userEmail !== ADMIN_EMAIL) {
    return <NotAuthorized />;
  }

  async function handleClassify() {
    if (!name.trim() || !url.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/classify-resource", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), url: url.trim(), note: note.trim() || undefined }),
      });

      const data = (await res.json()) as ClassifyResponse & { error?: string };

      if (!res.ok) {
        setError(data.error ?? `Request failed with status ${res.status}`);
        return;
      }

      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = name.trim().length > 0 && url.trim().length > 0 && !loading;

  return (
    <Layout>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px 80px" }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 11,
              color: "var(--primary)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              opacity: 0.7,
            }}
          >
            Admin · Internal Tool
          </span>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#fff", marginTop: 8, marginBottom: 6 }}>
            Resource Intake Assistant
          </h1>
          <p style={{ fontSize: 14, color: "var(--foreground)", opacity: 0.5, lineHeight: 1.6 }}>
            Classify a new tool against the existing STACK categories and question bank.
          </p>
        </div>

        {/* Draft notice */}
        <div
          style={{
            backgroundColor: "rgba(251,191,36,0.08)",
            border: "1px solid rgba(251,191,36,0.25)",
            borderRadius: 10,
            padding: "12px 16px",
            marginBottom: 28,
            fontSize: 13,
            color: "rgba(251,191,36,0.9)",
            lineHeight: 1.5,
          }}
        >
          ⚠️ This is a draft tool. Nothing is saved automatically — copy what you approve into{" "}
          <code style={{ fontSize: 12, opacity: 0.85 }}>resources.ts</code> and{" "}
          <code style={{ fontSize: 12, opacity: 0.85 }}>questions.ts</code>.
        </div>

        {/* Form */}
        <div style={card}>
          <label style={label} htmlFor="ri-name">Tool Name</label>
          <input
            id="ri-name"
            type="text"
            placeholder="e.g. Framer"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={input}
          />

          <label style={label} htmlFor="ri-url">URL</label>
          <input
            id="ri-url"
            type="url"
            placeholder="https://..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            style={input}
          />

          <label style={label} htmlFor="ri-note">Optional Note</label>
          <textarea
            id="ri-note"
            placeholder="Any context that might help with classification — target audience, what makes it unique, etc."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            style={{ ...input, resize: "vertical", marginBottom: 20 }}
          />

          <button
            onClick={() => void handleClassify()}
            disabled={!canSubmit}
            style={canSubmit ? btnPrimary : btnDisabled}
          >
            {loading ? "Classifying…" : "Classify with AI"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              backgroundColor: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 10,
              padding: "14px 16px",
              marginBottom: 20,
              fontSize: 13,
              color: "#f87171",
            }}
          >
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <>
            {/* Classification summary */}
            <div style={card}>
              <p style={{ fontSize: 12, fontFamily: "monospace", color: "var(--foreground)", opacity: 0.45, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 16 }}>
                Classification Summary
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{result.category}</span>
                <span style={levelBadge(result.level)}>{result.level}</span>
              </div>
              <p style={{ fontSize: 14, color: "var(--foreground)", opacity: 0.75, lineHeight: 1.6, margin: 0 }}>
                {result.bestSuitedFor}
              </p>
            </div>

            {/* Resource snippet */}
            <div style={card}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <p style={{ fontSize: 12, fontFamily: "monospace", color: "var(--foreground)", opacity: 0.45, textTransform: "uppercase", letterSpacing: "0.07em", margin: 0 }}>
                  Resource Snippet
                </p>
                <CopyButton text={result.resourceSnippet} />
              </div>
              <pre
                style={{
                  backgroundColor: "var(--background)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "14px 16px",
                  fontSize: 12,
                  color: "var(--foreground)",
                  overflowX: "auto",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                  margin: 0,
                  lineHeight: 1.6,
                }}
              >
                {result.resourceSnippet}
              </pre>
            </div>

            {/* Question edits */}
            {result.suggestedQuestionEdits.length > 0 && (
              <div style={card}>
                <p style={{ fontSize: 12, fontFamily: "monospace", color: "var(--foreground)", opacity: 0.45, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 20 }}>
                  Suggested Question Edits ({result.suggestedQuestionEdits.length})
                </p>
                {result.suggestedQuestionEdits.map((edit, i) => (
                  <div
                    key={i}
                    style={{
                      borderTop: i > 0 ? "1px solid var(--border)" : "none",
                      paddingTop: i > 0 ? 20 : 0,
                      marginBottom: i < result.suggestedQuestionEdits.length - 1 ? 20 : 0,
                    }}
                  >
                    <div style={{ marginBottom: 12, display: "flex", gap: 8, alignItems: "center" }}>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: 11,
                          color: "var(--primary)",
                          backgroundColor: "rgba(99,102,241,0.12)",
                          padding: "2px 8px",
                          borderRadius: 4,
                          fontWeight: 700,
                        }}
                      >
                        {edit.category} · {edit.questionId}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 12,
                        marginBottom: 10,
                      }}
                    >
                      <div>
                        <p style={{ fontSize: 11, fontFamily: "monospace", color: "var(--foreground)", opacity: 0.4, marginBottom: 6, textTransform: "uppercase" }}>
                          Current
                        </p>
                        <div
                          style={{
                            backgroundColor: "rgba(239,68,68,0.07)",
                            border: "1px solid rgba(239,68,68,0.2)",
                            borderRadius: 8,
                            padding: "10px 12px",
                            fontSize: 13,
                            color: "var(--foreground)",
                            opacity: 0.8,
                            lineHeight: 1.5,
                          }}
                        >
                          {edit.currentOptionText}
                        </div>
                      </div>
                      <div>
                        <p style={{ fontSize: 11, fontFamily: "monospace", color: "var(--foreground)", opacity: 0.4, marginBottom: 6, textTransform: "uppercase" }}>
                          Suggested
                        </p>
                        <div
                          style={{
                            backgroundColor: "rgba(34,197,94,0.07)",
                            border: "1px solid rgba(34,197,94,0.2)",
                            borderRadius: 8,
                            padding: "10px 12px",
                            fontSize: 13,
                            color: "var(--foreground)",
                            lineHeight: 1.5,
                          }}
                        >
                          {edit.suggestedOptionText}
                        </div>
                      </div>
                    </div>
                    <p style={{ fontSize: 12, color: "var(--foreground)", opacity: 0.45, lineHeight: 1.5, margin: 0, fontStyle: "italic" }}>
                      {edit.reason}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {result.suggestedQuestionEdits.length === 0 && (
              <p style={{ fontSize: 13, color: "var(--foreground)", opacity: 0.4, textAlign: "center", padding: "8px 0 20px", fontFamily: "monospace" }}>
                No question edits suggested for this tool.
              </p>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
