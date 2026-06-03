import { QUESTIONS } from "./questions";
import type { CategoryId } from "./questions";

export type Level = "beginner" | "intermediate" | "advanced";
export type Answers = Record<string, number>;

export type CategoryScore = {
  id: CategoryId;
  label: string;
  short: string;
  score: number;
};

export type Result = {
  scores: CategoryScore[];
  overall: number;
  level: Level;
  weakest: CategoryId[];
};

const CATEGORY_META: Record<CategoryId, { label: string; short: string }> = {
  "ai-tools":   { label: "AI Coding Tools",      short: "AI Tools"   },
  "deployment": { label: "Deployment & Hosting",  short: "Deployment" },
  "auth-data":  { label: "Auth & Data",           short: "Auth/Data"  },
  "ux-design":  { label: "UX Design Sourcing",    short: "UX Design"  },
  "product":    { label: "Product Thinking",      short: "Product"    },
};

const CATEGORY_IDS: CategoryId[] = ["ai-tools", "deployment", "auth-data", "ux-design", "product"];

export function scoreAnswers(answers: Answers): Result {
  const scores: CategoryScore[] = CATEGORY_IDS.map((id) => {
    const qs = QUESTIONS.filter((q) => q.category === id);
    const max = qs.length * 3;
    const got = qs.reduce((sum, q) => sum + (answers[q.id] ?? 0), 0);
    const score = max === 0 ? 0 : Math.round((got / max) * 100);
    return { id, score, ...CATEGORY_META[id] };
  });
  const overall = Math.round(scores.reduce((s, c) => s + c.score, 0) / scores.length);
  const level: Level = overall < 40 ? "beginner" : overall < 75 ? "intermediate" : "advanced";
  const weakest = [...scores].sort((a, b) => a.score - b.score).slice(0, 2).map((s) => s.id);
  return { scores, overall, level, weakest };
}

export function levelTagline(level: Level): string {
  if (level === "beginner") return "You're at the start of the curve. Pick a stack and ship your first thing.";
  if (level === "intermediate") return "You can build. Now sharpen your tools and tighten the loop.";
  return "You're operating like a product engineer. Time to compound — automate your own workflow.";
}

export function levelLabel(level: Level): string {
  if (level === "beginner") return "Vibe Starter";
  if (level === "intermediate") return "Vibe Builder";
  return "Vibe Architect";
}
