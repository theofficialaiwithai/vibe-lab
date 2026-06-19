import { useState, useEffect } from "react";
import { useUser } from "@clerk/react";
import Layout from "@/components/Layout";
import { sql } from "@/lib/db";

const ADMIN_EMAIL = "aihemeson@gmail.com";

type Submission = {
  id: string;
  user_id: string | null;
  email: string | null;
  level: string;
  challenge_type: string;
  description: string;
  ai_feedback: string | null;
  status: string;
  review_note: string | null;
  submitted_at: string;
};

const LEVEL_LABELS: Record<string, string> = {
  beginner: "Vibe Starter",
  intermediate: "Vibe Builder",
  advanced: "Vibe Architect",
};

const card: React.CSSProperties = {
  backgroundColor: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: 20,
};

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; color: string; border: string }> = {
    "needs-human-review": { bg: "rgba(251,191,36,0.12)", color: "#fbbf24", border: "rgba(251,191,36,0.3)" },
    "changes-requested":  { bg: "rgba(239,68,68,0.12)",  color: "#f87171", border: "rgba(239,68,68,0.3)"  },
    "auto-approved":      { bg: "rgba(34,197,94,0.12)",  color: "#22c55e", border: "rgba(34,197,94,0.3)"  },
  };
  const s = styles[status] ?? { bg: "rgba(255,255,255,0.06)", color: "var(--foreground)", border: "var(--border)" };
  return (
    <span style={{
      display: "inline-block", padding: "2px 10px", borderRadius: 999,
      fontSize: 11, fontFamily: "monospace", fontWeight: 700, textTransform: "uppercase",
      letterSpacing: "0.06em", backgroundColor: s.bg, color: s.color,
      border: `1px solid ${s.border}`,
    }}>
      {status}
    </span>
  );
}

function SubmissionCard({
  sub,
  onAction,
}: {
  sub: Submission;
  onAction: (id: number, action: "approve" | "request-changes", note?: string) => Promise<void>;
}) {
  const [actioning, setActioning] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState("");
  const [done, setDone] = useState(false);

  async function handleApprove() {
    setActioning(true);
    await onAction(sub.id, "approve");
    setDone(true);
    setActioning(false);
  }

  async function handleRequestChanges() {
    if (!note.trim()) return;
    setActioning(true);
    await onAction(sub.id, "request-changes", note.trim());
    setDone(true);
    setActioning(false);
  }

  if (done) {
    return (
      <div style={{ ...card, opacity: 0.5 }}>
        <p style={{ fontSize: 13, color: "var(--foreground)", margin: 0 }}>
          #{sub.id} — reviewed ✓
        </p>
      </div>
    );
  }

  return (
    <div style={card}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, fontFamily: "monospace", color: "var(--foreground)", opacity: 0.4 }}>#{sub.id}</span>
          <StatusBadge status={sub.status} />
          <span style={{ fontSize: 12, fontFamily: "monospace", color: "var(--foreground)", opacity: 0.5 }}>
            {LEVEL_LABELS[sub.level] ?? sub.level} · {sub.challenge_type}
          </span>
        </div>
        <span style={{ fontSize: 11, color: "var(--foreground)", opacity: 0.35, fontFamily: "monospace" }}>
          {new Date(sub.submitted_at).toLocaleString()}
        </span>
      </div>

      {sub.email && (
        <p style={{ fontSize: 12, color: "var(--foreground)", opacity: 0.5, marginBottom: 8, fontFamily: "monospace" }}>
          {sub.email}
        </p>
      )}

      <p style={{ fontSize: 14, color: "#fff", lineHeight: 1.6, marginBottom: 12 }}>
        {sub.description}
      </p>

      {sub.ai_feedback && (
        <p style={{ fontSize: 12, color: "var(--foreground)", opacity: 0.55, lineHeight: 1.5, marginBottom: 14, fontStyle: "italic" }}>
          AI: {sub.ai_feedback}
        </p>
      )}

      {sub.review_note && (
        <div style={{ padding: "10px 14px", borderRadius: 8, backgroundColor: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", marginBottom: 14 }}>
          <p style={{ fontSize: 12, color: "#f87171", margin: 0 }}>Previous note: {sub.review_note}</p>
        </div>
      )}

      {!showNote ? (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={() => void handleApprove()}
            disabled={actioning}
            style={{
              padding: "8px 18px", borderRadius: 8, border: "none", cursor: actioning ? "default" : "pointer",
              backgroundColor: "rgba(34,197,94,0.85)", color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: "inherit",
              opacity: actioning ? 0.5 : 1,
            }}
          >
            {actioning ? "…" : "✓ Approve"}
          </button>
          <button
            onClick={() => setShowNote(true)}
            disabled={actioning}
            style={{
              padding: "8px 18px", borderRadius: 8, border: "1px solid var(--border)", cursor: actioning ? "default" : "pointer",
              backgroundColor: "transparent", color: "var(--foreground)", fontSize: 13, fontFamily: "inherit",
              opacity: actioning ? 0.5 : 1,
            }}
          >
            Request changes
          </button>
        </div>
      ) : (
        <div>
          <textarea
            placeholder="What should the user change or clarify?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            style={{
              width: "100%", boxSizing: "border-box", backgroundColor: "var(--background)",
              border: "1px solid var(--border)", borderRadius: 8, color: "var(--foreground)",
              fontSize: 13, padding: "10px 12px", resize: "vertical", fontFamily: "inherit", marginBottom: 10,
            }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => void handleRequestChanges()}
              disabled={actioning || !note.trim()}
              style={{
                padding: "8px 18px", borderRadius: 8, border: "none", cursor: actioning || !note.trim() ? "not-allowed" : "pointer",
                backgroundColor: "var(--primary)", color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: "inherit",
                opacity: actioning || !note.trim() ? 0.5 : 1,
              }}
            >
              {actioning ? "…" : "Send feedback"}
            </button>
            <button
              onClick={() => { setShowNote(false); setNote(""); }}
              style={{
                padding: "8px 18px", borderRadius: 8, border: "1px solid var(--border)", cursor: "pointer",
                backgroundColor: "transparent", color: "var(--foreground)", fontSize: 13, fontFamily: "inherit",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ChallengeReview() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  const isAdmin = isLoaded && isSignedIn &&
    user?.emailAddresses[0]?.emailAddress === ADMIN_EMAIL;

  useEffect(() => {
    if (!isAdmin) return;
    setLoading(true);
    sql`
      SELECT id, user_id, email, level_name AS level, challenge_type, description,
             ai_feedback, status, review_note, submitted_at
      FROM user_build_projects
      WHERE status IN ('needs-human-review', 'changes-requested')
      ORDER BY submitted_at DESC
    `
      .then((rows) => { setSubmissions(rows as Submission[]); })
      .catch(() => { /* leave empty */ })
      .finally(() => setLoading(false));
  }, [isAdmin]);

  async function handleAction(id: number, action: "approve" | "request-changes", note?: string) {
    setActionError(null);
    try {
      const res = await fetch("/api/review-challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, note }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setActionError(data.error ?? `Request failed (${res.status})`);
      }
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Network error");
    }
  }

  if (!isLoaded) return null;

  if (!isSignedIn || !isAdmin) {
    return (
      <Layout>
        <div style={{ maxWidth: 600, margin: "80px auto", padding: "0 24px", textAlign: "center" }}>
          <p style={{ color: "var(--foreground)", opacity: 0.5, fontSize: 16 }}>
            Not authorized.
          </p>
        </div>
      </Layout>
    );
  }

  const pending = submissions.filter(s => s.status === "needs-human-review");
  const changesRequested = submissions.filter(s => s.status === "changes-requested");

  return (
    <Layout>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "60px 24px 100px" }}>
        <p style={{ fontSize: 11, fontFamily: "monospace", color: "var(--foreground)", opacity: 0.4, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
          Admin
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fff", marginBottom: 32 }}>
          Build Challenge Review
        </h1>

        {actionError && (
          <div style={{ padding: "12px 16px", borderRadius: 8, backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", marginBottom: 24 }}>
            <p style={{ fontSize: 13, color: "#f87171", margin: 0 }}>{actionError}</p>
          </div>
        )}

        {loading ? (
          <p style={{ color: "var(--foreground)", opacity: 0.4, fontSize: 14 }}>Loading…</p>
        ) : submissions.length === 0 ? (
          <p style={{ color: "var(--foreground)", opacity: 0.4, fontSize: 14 }}>No submissions awaiting review.</p>
        ) : (
          <>
            {pending.length > 0 && (
              <section style={{ marginBottom: 40 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#fbbf24", marginBottom: 16 }}>
                  Needs Review ({pending.length})
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {pending.map(s => (
                    <SubmissionCard key={s.id} sub={s} onAction={handleAction} />
                  ))}
                </div>
              </section>
            )}

            {changesRequested.length > 0 && (
              <section>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#f87171", marginBottom: 16 }}>
                  Changes Requested ({changesRequested.length})
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {changesRequested.map(s => (
                    <SubmissionCard key={s.id} sub={s} onAction={handleAction} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
