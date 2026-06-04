import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import Layout from "@/components/Layout";
import { sql } from "@/lib/db";
import { QUESTIONS } from "@/lib/data/questions";
import { scoreAnswers } from "@/lib/data/scoring";
import type { Answers } from "@/lib/data/scoring";

const CATEGORY_LABELS: Record<string, string> = {
  "ai-tools":   "AI Coding Tools",
  "deployment": "Deployment & Hosting",
  "auth-data":  "Auth & Data",
  "ux-design":  "UX Design Sourcing",
  "product":    "Product Thinking",
};

const TOTAL = QUESTIONS.length;

const pillStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "6px 14px",
  borderRadius: 999,
  backgroundColor: "rgba(99,102,241,0.10)",
  border: "1px solid rgba(99,102,241,0.20)",
  color: "var(--primary)",
  fontSize: 11,
  fontFamily: "monospace",
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
};

export default function Assessment() {
  const navigate = useNavigate();
  const [step, setStep] = useState<number>(-1);
  const [answers, setAnswers] = useState<Answers>({});
  const [submitting, setSubmitting] = useState(false);

  async function finish(finalAnswers: Answers) {
    setSubmitting(true);
    const result = scoreAnswers(finalAnswers);

    // Always save locally as a safety net
    localStorage.setItem("vibelab:result", JSON.stringify(result));

    try {
      const shareId = nanoid(8);
      await sql`
        INSERT INTO assessment_results (share_id, score, category_scores, answers)
        VALUES (
          ${shareId},
          ${result.overall},
          ${JSON.stringify(result.scores)},
          ${JSON.stringify(finalAnswers)}
        )
      `;
      navigate(`/results/${shareId}`);
    } catch (err) {
      console.error("Neon save failed:", err);
      toast.error("Saved locally — share link unavailable");
      navigate("/results/local");
    }
  }

  function handleAnswer(questionId: string, score: number) {
    const updated = { ...answers, [questionId]: score };
    setAnswers(updated);
    if (step === TOTAL - 1) {
      void finish(updated);
    } else {
      setStep(step + 1);
    }
  }

  const centered: React.CSSProperties = {
    minHeight: "calc(100vh - 56px)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "40px 24px",
  };

  // ── SCREEN 3: SUBMITTING ──
  if (submitting) {
    return (
      <Layout>
        <div style={centered}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
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
            <p style={{ color: "var(--foreground)", opacity: 0.7, fontSize: 16, fontFamily: "monospace" }}>
              Calculating your Vibe Quotient...
            </p>
          </div>
          <style>{`
            @keyframes spin { to { transform: rotate(360deg); } }
          `}</style>
        </div>
      </Layout>
    );
  }

  // ── SCREEN 1: INTRO ──
  if (step === -1) {
    return (
      <Layout>
        <div style={centered}>
          <div style={{ maxWidth: 640 }}>
            <div style={{ marginBottom: 36 }}>
              <span style={pillStyle}>5 min · 17 questions · 5 skills</span>
            </div>

            <h1
              style={{
                fontSize: "clamp(36px, 6vw, 60px)",
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                marginBottom: 24,
              }}
            >
              <span style={{ color: "#ffffff", display: "block" }}>Let's measure your</span>
              <span style={{ color: "var(--primary)", display: "block" }}>Vibe Quotient.</span>
            </h1>

            <p
              style={{
                color: "var(--foreground)",
                opacity: 0.6,
                fontSize: 17,
                lineHeight: 1.65,
                marginBottom: 48,
                maxWidth: 520,
                margin: "0 auto 48px",
              }}
            >
              No grades. No judgment. Just an honest read on where you are across the modern vibe-coding stack — so your hub fits you.
            </p>

            <button
              onClick={() => setStep(0)}
              style={{
                backgroundColor: "var(--primary)",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: 17,
                padding: "16px 40px",
                borderRadius: 10,
                border: "none",
                cursor: "pointer",
              }}
            >
              Begin →
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // ── SCREEN 2: QUESTION ──
  const question = QUESTIONS[step];
  const progress = (step / TOTAL) * 100;

  return (
    <Layout>
      <div style={{ padding: "0 24px 80px" }}>
        {/* Progress bar */}
        <div
          style={{
            position: "sticky",
            top: 56,
            zIndex: 40,
            backgroundColor: "var(--background)",
            paddingBottom: 8,
          }}
        >
          <div style={{ height: 3, backgroundColor: "var(--border)", width: "100%" }}>
            <div
              style={{
                height: "100%",
                width: `${progress}%`,
                backgroundColor: "var(--primary)",
                transition: "width 0.3s ease",
              }}
            />
          </div>
          <div
            style={{
              textAlign: "right",
              paddingTop: 8,
              paddingRight: 4,
              fontSize: 11,
              fontFamily: "monospace",
              color: "var(--foreground)",
              opacity: 0.5,
            }}
          >
            Question {step + 1} of {TOTAL}
          </div>
        </div>

        {/* Question area */}
        <div
          style={{
            maxWidth: 700,
            margin: "48px auto 0",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* Category pill */}
          <div style={{ marginBottom: 28 }}>
            <span style={pillStyle}>{CATEGORY_LABELS[question.category] ?? question.category}</span>
          </div>

          {/* Prompt */}
          <p
            style={{
              fontSize: "clamp(20px, 3vw, 26px)",
              fontWeight: 700,
              lineHeight: 1.35,
              color: "#ffffff",
              maxWidth: 640,
              textAlign: "center",
              marginBottom: 40,
            }}
          >
            {question.prompt}
          </p>

          {/* Answer options */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              width: "100%",
              maxWidth: 560,
            }}
          >
            {question.options.map((option) => (
              <OptionCard
                key={option.label}
                label={option.label}
                onClick={() => handleAnswer(question.id, option.score)}
              />
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}

function OptionCard({ label, onClick }: { label: string; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: "var(--surface)",
        border: `1px solid ${hovered ? "rgba(99,102,241,0.5)" : "var(--border)"}`,
        borderRadius: 12,
        padding: "16px 20px",
        cursor: "pointer",
        textAlign: "left",
        color: "var(--foreground)",
        fontSize: 15,
        lineHeight: 1.45,
        width: "100%",
        transition: "border-color 0.15s ease",
      }}
    >
      {label}
    </button>
  );
}
