import type { CategoryId } from "./questions";
import type { Level } from "./scoring";

export type Resource = {
  id: string;
  title: string;
  description: string;
  url: string;
  type: "video" | "skill" | "tool";
  level: Level;
  categories: CategoryId[];
  meta?: string;
};

const REPO = "https://github.com/theofficialaiwithai/cowork-skills/tree/main/skills";

export const COWORK_SKILLS: Resource[] = [
  { id: "cs-automation-architect", title: "Automation Architect", description: "Maps a fuzzy automation idea into concrete tools, triggers, and steps. Thinks in workflows, not features.", url: `${REPO}/automation-architect`, type: "skill", level: "intermediate", categories: ["ai-tools", "product"], meta: "Use when scoping a new automation before writing any code." },
  { id: "cs-code-build-copilot", title: "Code Build Copilot", description: "Takes a spec or PRD and plans the build top-down: stack, files, sequence of edits, tests.", url: `${REPO}/code-build-copilot`, type: "skill", level: "beginner", categories: ["ai-tools", "product"], meta: "Drop in at the start of any project so Claude builds from a plan." },
  { id: "cs-mcp-assistant", title: "MCP Assistant", description: "Helps you reason about Model Context Protocol servers — picking the right ones, wiring them into Claude Code, and debugging tool calls.", url: `${REPO}/mcp-assistant`, type: "skill", level: "advanced", categories: ["ai-tools"], meta: "Use when extending Claude Code with custom MCP servers." },
  { id: "cs-openclaw-assistant", title: "OpenClaw Assistant", description: "Orchestrates the OpenClaw multi-agent setup — coordinating sub-agents, managing context, and supervising long-running jobs.", url: `${REPO}/openclaw-assistant`, type: "skill", level: "advanced", categories: ["ai-tools"], meta: "Use when running OpenClaw and need a supervisor agent." },
  { id: "cs-prd-assistant", title: "PRD Assistant", description: "Turns a rough product idea into a complete PRD: problem, users, scope, success criteria, edge cases, and open questions.", url: `${REPO}/prd-assistant`, type: "skill", level: "beginner", categories: ["product"], meta: "Run this first on every new idea." },
  { id: "cs-replit-copilot", title: "Replit Copilot", description: "A Replit-tuned coding skill that knows the Replit Agent's quirks, deployment model, and prompt patterns that actually ship.", url: `${REPO}/replit-copilot`, type: "skill", level: "intermediate", categories: ["ai-tools", "deployment"], meta: "Use when prototyping or deploying inside Replit." },
  { id: "cs-routines-creator", title: "Routines Creator", description: "Designs reusable Claude routines — scoped prompt + tool combinations you can fire off as one command.", url: `${REPO}/routines-creator`, type: "skill", level: "advanced", categories: ["ai-tools", "product"], meta: "Use once you've noticed yourself repeating the same multi-step prompt." },
];

export const VIDEOS: Resource[] = [
  { id: "yt-claude-cowork", title: "Claude Cowork", description: "Intro walkthrough of Cowork-style prompting with Claude — how to set up agents that collaborate.", url: "https://youtu.be/SNo_recKZyY", type: "video", level: "beginner", categories: ["ai-tools"], meta: "YouTube · short" },
  { id: "yt-claude-code-4hr", title: "Claude Code — 4 Hour Course", description: "Comprehensive Claude Code course covering setup, tool use, MCP, planning workflows, and shipping a real project.", url: "https://youtu.be/QoQBzR1NIqI", type: "video", level: "beginner", categories: ["ai-tools", "deployment", "auth-data"], meta: "YouTube · 4 hours" },
  { id: "yt-advanced-claude-code", title: "Advanced Claude Code", description: "Deeper patterns: sub-agents, context engineering, custom routines, and Claude Code workflows for non-trivial codebases.", url: "https://youtu.be/UPtmKh1vMN8", type: "video", level: "advanced", categories: ["ai-tools", "product"], meta: "YouTube · long" },
  { id: "yt-vercel-netlify", title: "Deploy Vibe Coding Projects for Free — Vercel & Netlify", description: "Take your AI-generated projects from GitHub and deploy them live using Vercel or Netlify for free.", url: "https://www.youtube.com/watch?v=85JVKjW-uG0", type: "video", level: "beginner", categories: ["deployment"], meta: "YouTube · beginner" },
  { id: "yt-netlify-deploy", title: "How to Deploy a Website on Netlify (Free & Fast)", description: "Beginner-friendly walkthrough for deploying web projects on Netlify with a live demo.", url: "https://www.youtube.com/watch?v=FluBig_0Pls", type: "video", level: "beginner", categories: ["deployment"], meta: "YouTube · beginner" },
  { id: "yt-cloudflare-pages", title: "Cloudflare Pages Free Hosting", description: "Step-by-step guide to hosting your site on Cloudflare Pages for free with a custom domain.", url: "https://www.youtube.com/watch?v=PDB9Ka7LMsU", type: "video", level: "beginner", categories: ["deployment"], meta: "YouTube · beginner" },
  { id: "yt-clerk-auth", title: "Easy Authentication with Clerk and Next.js", description: "Step-by-step tutorial for adding login and user authentication using Clerk.", url: "https://www.youtube.com/watch?v=5RRnuuPCfQU", type: "video", level: "beginner", categories: ["auth-data"], meta: "YouTube · beginner" },
  { id: "yt-neon-postgres", title: "Getting Started with Neon in 10 Minutes", description: "Quick-start guide to creating and connecting a Neon serverless Postgres database.", url: "https://www.youtube.com/watch?v=OX2YykRyOE4", type: "video", level: "intermediate", categories: ["auth-data"], meta: "YouTube · 10 min" },
  { id: "yt-supabase-full", title: "Supabase Full Course 2025", description: "Covers setting up Supabase, building tables, auth, and row-level security in under 2 hours.", url: "https://www.youtube.com/watch?v=kyphLGnSz6Q", type: "video", level: "beginner", categories: ["auth-data"], meta: "YouTube · 1.5 hours" },
  { id: "yt-codex-vibe", title: "The Right Way to Vibe Code with OpenAI Codex", description: "Beginner tutorial showing how to build a complete project step by step using Codex.", url: "https://www.youtube.com/watch?v=V2N3amlXhOo", type: "video", level: "beginner", categories: ["ai-tools"], meta: "YouTube · beginner" },
  { id: "yt-replit-agent", title: "How to Build Apps with Replit AI Agent", description: "Step-by-step course covering how to set up Replit and build full apps using its AI agent.", url: "https://www.youtube.com/watch?v=DaXQ5L7r7Lg", type: "video", level: "beginner", categories: ["ai-tools", "deployment"], meta: "YouTube · beginner" },
];

export type StackGroup = "Deployment" | "Authentication" | "Database" | "UX Design" | "Vibe Coding" | "Product Ideas" | "No-Code";

export const STACK: (Resource & { group: StackGroup })[] = [
  { id: "st-vercel", title: "Vercel", description: "Zero-config deploys for Next.js & friends. The default for most vibe-coded apps.", url: "https://vercel.com", type: "tool", level: "beginner", categories: ["deployment"], group: "Deployment" },
  { id: "st-cloudflare", title: "Cloudflare", description: "Workers + Pages for edge-first apps. Fast, cheap, global.", url: "https://cloudflare.com", type: "tool", level: "intermediate", categories: ["deployment"], group: "Deployment" },
  { id: "st-netlify", title: "Netlify", description: "Friendly static + serverless host. Lowest friction for landing pages and small apps.", url: "https://netlify.com", type: "tool", level: "beginner", categories: ["deployment"], group: "Deployment" },
  { id: "st-clerk", title: "Clerk", description: "Drop-in auth with prebuilt UI, social logins, and orgs/teams. Easiest path to real auth.", url: "https://clerk.com", type: "tool", level: "beginner", categories: ["auth-data"], group: "Authentication" },
  { id: "st-neon", title: "Neon", description: "Serverless Postgres with branching. Great for prototyping schema changes without fear.", url: "https://neon.tech", type: "tool", level: "intermediate", categories: ["auth-data"], group: "Database" },
  { id: "st-supabase", title: "Supabase", description: "Postgres + auth + storage + edge functions in one. The default backend for vibe coding.", url: "https://supabase.com", type: "tool", level: "beginner", categories: ["auth-data"], group: "Database" },
  { id: "st-21st", title: "21st.dev", description: "Searchable library of pre-built, production-grade React + Tailwind components.", url: "https://21st.dev", type: "tool", level: "intermediate", categories: ["ux-design"], group: "UX Design" },
  { id: "st-dribbble", title: "Dribbble", description: "Visual inspiration for layouts, colors, and motion. Source mood boards fast.", url: "https://dribbble.com", type: "tool", level: "beginner", categories: ["ux-design"], group: "UX Design" },
  { id: "st-mobbin", title: "Mobbin", description: "Real screenshots from real apps. The reference library for shipped UX patterns.", url: "https://mobbin.com", type: "tool", level: "intermediate", categories: ["ux-design"], group: "UX Design" },
  { id: "st-claude-code", title: "Claude Code", description: "Terminal-native agent from Anthropic. The sharpest tool for serious building.", url: "https://www.anthropic.com/claude-code", type: "tool", level: "intermediate", categories: ["ai-tools"], group: "Vibe Coding" },
  { id: "st-codex", title: "Codex", description: "OpenAI's coding agent. Strong at large refactors and long-context work.", url: "https://openai.com/codex", type: "tool", level: "intermediate", categories: ["ai-tools"], group: "Vibe Coding" },
  { id: "st-replit", title: "Replit", description: "Browser-based agent + hosting. Lowest friction from idea to live URL.", url: "https://replit.com", type: "tool", level: "beginner", categories: ["ai-tools", "deployment"], group: "Vibe Coding" },
  { id: "st-ideabrowser", title: "Ideabrowser", description: "Curated, validated startup ideas with market signal. Fuel for what to build next.", url: "https://ideabrowser.com", type: "tool", level: "beginner", categories: ["product"], group: "Product Ideas" },
  // ── AI Builders ───────────────────────────────────────────────────
  { id: "st-bolt", title: "bolt.new", description: "Prompt your way to a full-stack app. Powered by AI, runs in the browser instantly.", url: "https://bolt.new", type: "tool", level: "beginner", categories: ["ai-tools", "deployment"], group: "Vibe Coding" },
  { id: "st-lovable", title: "Lovable", description: "Turn ideas into real products with AI. Design, build, and ship without a team.", url: "https://lovable.dev", type: "tool", level: "beginner", categories: ["ai-tools", "product"], group: "Vibe Coding" },
  { id: "st-v0", title: "v0", description: "Generate UI components from a prompt using Vercel's AI. Paste into any React app.", url: "https://v0.dev", type: "tool", level: "intermediate", categories: ["ux-design", "ai-tools"], group: "Vibe Coding" },
  // ── No-Code ───────────────────────────────────────────────────────
  { id: "st-bubble", title: "Bubble", description: "Build full-stack web apps without code. Includes database, logic, and UI in one platform.", url: "https://bubble.io", type: "tool", level: "beginner", categories: ["deployment", "product"], group: "No-Code" },
  { id: "st-softr", title: "Softr", description: "Turn your Airtable or Google Sheets into a web app or client portal in minutes.", url: "https://softr.io", type: "tool", level: "beginner", categories: ["deployment", "product"], group: "No-Code" },
  { id: "st-glide", title: "Glide", description: "Build mobile and web apps from a spreadsheet. No coding required.", url: "https://glideapps.com", type: "tool", level: "beginner", categories: ["deployment", "product"], group: "No-Code" },
  // ── UX / Design ───────────────────────────────────────────────────
  { id: "st-shadcn", title: "shadcn/ui", description: "Beautifully designed components you can copy and paste into your app. Built on Radix UI and Tailwind.", url: "https://ui.shadcn.com", type: "tool", level: "intermediate", categories: ["ux-design"], group: "UX Design" },
  { id: "st-ui8", title: "ui8.net", description: "Premium UI kits, templates, and design assets for builders who want polished results without designing from scratch.", url: "https://ui8.net", type: "tool", level: "intermediate", categories: ["ux-design"], group: "UX Design" },
  { id: "st-behance", title: "Behance", description: "Full creative case studies and design portfolios from professionals worldwide. Deep visual research before any build.", url: "https://www.behance.net", type: "tool", level: "beginner", categories: ["ux-design"], group: "UX Design" },
  { id: "st-collectui", title: "Collect UI", description: "Scrollable collection of UI patterns organized by component type. Quick inspiration before building any screen.", url: "https://collectui.com", type: "tool", level: "beginner", categories: ["ux-design"], group: "UX Design" },
  { id: "st-siteinspire", title: "Siteinspire", description: "Curated showcase of the best website design on the web. High-quality visual references for creative direction.", url: "https://www.siteinspire.com", type: "tool", level: "beginner", categories: ["ux-design"], group: "UX Design" },
  { id: "st-uiverse", title: "Uiverse", description: "Free, open-source UI components with live previews. Copy-paste into any project without designing from scratch.", url: "https://uiverse.io", type: "tool", level: "intermediate", categories: ["ux-design"], group: "UX Design" },
  { id: "st-spline", title: "Spline", description: "Design and ship interactive 3D experiences for the web. Adds depth and motion to projects that go beyond flat UI.", url: "https://spline.design", type: "tool", level: "advanced", categories: ["ux-design"], group: "UX Design" },
  // ── Vibe Coding ──────────────────────────────────────────────────
  { id: "st-cursor", title: "Cursor", description: "AI-native code editor with Claude and GPT built in. The next step for builders who've outgrown no-code tools.", url: "https://cursor.com", type: "tool", level: "beginner", categories: ["ai-tools"], group: "Vibe Coding" },
  { id: "st-vscode", title: "VS Code", description: "The standard code editor, supercharged with AI extensions. The entry point for hands-on building beyond no-code.", url: "https://code.visualstudio.com", type: "tool", level: "beginner", categories: ["ai-tools"], group: "Vibe Coding" },
  { id: "st-gemini", title: "Gemini", description: "Google's general-purpose AI assistant. Useful alongside Claude for comparing model outputs and exploring alternatives.", url: "https://gemini.google.com", type: "tool", level: "beginner", categories: ["ai-tools"], group: "Vibe Coding" },
  { id: "st-google-ai-studio", title: "Google AI Studio", description: "Test Gemini prompts and API calls directly in the browser. The fastest path from idea to a working Gemini integration.", url: "https://aistudio.google.com", type: "tool", level: "intermediate", categories: ["ai-tools"], group: "Vibe Coding" },
];

export const ALL_RESOURCES: Resource[] = [...COWORK_SKILLS, ...VIDEOS, ...STACK];
