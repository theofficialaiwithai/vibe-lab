import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, SignInButton } from "@clerk/react";
import Layout from "@/components/Layout";
import { sql } from "@/lib/db";

// ── Questions ─────────────────────────────────────────────────────
const QUESTIONS: { key: string; prompt: string; options: string[] }[] = [
  {
    key: "main_goal",
    prompt: "What's your main goal?",
    options: [
      "Build a product",
      "Automate my work",
      "Learn for a career",
      "Get freelance clients",
    ],
  },
  {
    key: "time_per_week",
    prompt: "How much time do you have per week?",
    options: ["Less than 2 hours", "2–5 hours", "5–10 hours", "10+ hours"],
  },
  {
    key: "learning_style",
    prompt: "How do you learn best?",
    options: [
      "Watching videos",
      "Building things",
      "Being guided step by step",
      "Reading docs",
    ],
  },
  {
    key: "current_status",
    prompt: "Where are you right now?",
    options: [
      "Never shipped anything",
      "Built something but never shipped it",
      "Shipped something before",
      "Actively building right now",
    ],
  },
];

type Answers = Record<string, string>;

// ── Styles ────────────────────────────────────────────────────────
const centered: React.CSSProperties = {
  minHeight: "calc(100vh - 56px)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "40px 24px",
};

export default function Personalize() {
  const navigate = useNavigate();
  const { isLoaded, isSignedIn } = useUser();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [building, setBuilding] = useState(false);
  const [visible, setVisible] = useState(true);
  const [shareId, setShareId] = useState<string | null>(null);

  useEffect(() => {
    const id = sessionStorage.getItem("vibelab:share_id");
    setShareId(id);
  }, []);

  async function handleSelect(value: string) {
    const q = QUESTIONS[step];
    const updated = { ...answers, [q.key]: value };
    setAnswers(updated);

    if (step < QUESTIONS.length - 1) {
      // Animate out → advance → animate in
      setVisible(false);
      setTimeout(() => {
        setStep((s) => s + 1);
        setVisible(true);
      }, 200);
    } else {
      // Final question — save and navigate
      setBuilding(true);
      try {
        if (shareId) {
          await sql`
            INSERT INTO user_profiles (
              share_id,
              main_goal,
              time_per_week,
              learning_style,
              current_status,
              current_level,
              current_phase
            ) VALUES (
              ${shareId},
              ${updated.main_goal},
              ${updated.time_per_week},
              ${updated.learning_style},
              ${updated.current_status},
              ${1},
              ${1}
            )
          `;
        }
      } catch (err) {
        console.error("Failed to save profile:", err);
      }
      navigate(shareId ? `/hub?id=${shareId}` : "/hub");
    }
  }

  function handleBack() {
    if (step === 0) {
      navigate(-1);
      return;
    }
    setVisible(false);
    setTimeout(() => {
      setStep((s) => s - 1);
      setVisible(true);
    }, 200);
  }

  // ── Auth gate ─────────────────────────────────────────────────────
  if (!isLoaded) {
    return (
      <Layout>
        <div style={centered}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            border: "3px solid var(--border)", borderTopColor: "var(--primary)",
            animation: "spin 0.8s linear infinite",
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </Layout>
    );
  }

  if (!isSignedIn) {
    return (
      <Layout>
        <div style={centered}>
          <div style={{ maxWidth: 480, textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 20 }}>🔒</div>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: "#ffffff", marginBottom: 12, letterSpacing: "-0.01em" }}>
              Sign in to personalize your hub
            </h2>
            <p style={{ color: "var(--foreground)", opacity: 0.6, fontSize: 16, lineHeight: 1.65, marginBottom: 32, maxWidth: 360, margin: "0 auto 32px" }}>
              Create a free account to answer 4 quick questions and build your personalized learning path.
            </p>
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
          </div>
        </div>
      </Layout>
    );
  }

  // ── Building state ────────────────────────────────────────────────
  if (building) {
    return (
      <Layout>
        <div style={centered}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 20,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: "3px solid var(--border)",
                borderTopColor: "var(--primary)",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <p
              style={{
                color: "var(--foreground)",
                opacity: 0.7,
                fontSize: 17,
                fontFamily: "monospace",
              }}
            >
              Building your hub...
            </p>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </Layout>
    );
  }

  const q = QUESTIONS[step];
  const progress = ((step) / QUESTIONS.length) * 100;

  return (
    <Layout>
      <div style={{ padding: "0 24px 80px" }}>

        {/* ── Progress bar ── */}
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
                transition: "width 0.35s ease",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingTop: 10,
            }}
          >
            {/* Back button */}
            <button
              onClick={handleBack}
              style={{
                background: "none",
                border: "none",
                color: "var(--foreground)",
                opacity: 0.45,
                fontSize: 12,
                fontFamily: "monospace",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                cursor: "pointer",
                padding: "2px 0",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.45")}
            >
              ← Back
            </button>

            {/* Step counter */}
            <span
              style={{
                fontSize: 11,
                fontFamily: "monospace",
                color: "var(--foreground)",
                opacity: 0.4,
              }}
            >
              Question {step + 1} of {QUESTIONS.length}
            </span>
          </div>
        </div>

        {/* ── Question + options ── */}
        <div
          style={{
            maxWidth: 640,
            margin: "56px auto 0",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(10px)",
            transition: "opacity 0.2s ease, transform 0.2s ease",
          }}
        >
          {/* Pill */}
          <div
            style={{
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
              marginBottom: 28,
            }}
          >
            Personalization
          </div>

          {/* Prompt */}
          <h2
            style={{
              fontSize: "clamp(22px, 4vw, 32px)",
              fontWeight: 800,
              lineHeight: 1.25,
              color: "#ffffff",
              textAlign: "center",
              marginBottom: 40,
              letterSpacing: "-0.01em",
            }}
          >
            {q.prompt}
          </h2>

          {/* Options */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              width: "100%",
            }}
          >
            {q.options.map((option) => (
              <OptionCard
                key={option}
                label={option}
                selected={answers[q.key] === option}
                onClick={() => void handleSelect(option)}
              />
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}

// ── Option card ───────────────────────────────────────────────────
function OptionCard({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const active = hovered || selected;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: active ? "rgba(99,102,241,0.08)" : "var(--surface)",
        border: `1px solid ${active ? "rgba(99,102,241,0.5)" : "var(--border)"}`,
        borderRadius: 12,
        padding: "18px 22px",
        cursor: "pointer",
        textAlign: "left",
        color: active ? "#ffffff" : "var(--foreground)",
        fontSize: 15,
        fontWeight: active ? 600 : 400,
        lineHeight: 1.45,
        width: "100%",
        transition: "all 0.15s ease",
      }}
    >
      {label}
    </button>
  );
}
