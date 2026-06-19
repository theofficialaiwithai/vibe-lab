import type { Level } from "./scoring";

export type Challenge = {
  id: string;
  level: Level;
  title: string;
  description: string;
};

export const CHALLENGES: Challenge[] = [
  // Vibe Starter
  {
    id: "starter-1",
    level: "beginner",
    title: "Landing Page",
    description:
      "Build a simple landing page for an idea you have, with one working contact form",
  },
  {
    id: "starter-2",
    level: "beginner",
    title: "UI Clone",
    description:
      "Clone the UI of an app you like using AI tools — no need to wire up real data",
  },
  // Vibe Builder
  {
    id: "builder-1",
    level: "intermediate",
    title: "CRUD App",
    description:
      "Build a small app with one database table and basic create/read/update/delete",
  },
  {
    id: "builder-2",
    level: "intermediate",
    title: "Add Auth",
    description:
      "Add sign-in to an existing project and gate one page behind it",
  },
  // Vibe Architect
  {
    id: "architect-1",
    level: "advanced",
    title: "Ship It",
    description:
      "Ship a small project to a real URL with a working database and one third-party integration (auth, payments, or email)",
  },
  {
    id: "architect-2",
    level: "advanced",
    title: "Automate It",
    description:
      "Take an existing prototype and add one automated feature — a cron job, webhook, or AI-powered step",
  },
];

export function getChallengesForLevel(level: Level): Challenge[] {
  return CHALLENGES.filter((c) => c.level === level);
}
