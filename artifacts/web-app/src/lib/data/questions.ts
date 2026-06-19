export type CategoryId = "ai-tools" | "deployment" | "auth-data" | "ux-design" | "product";

export type Question = {
  id: string;
  category: CategoryId;
  prompt: string;
  options: { label: string; score: number }[];
};

export const QUESTIONS: Question[] = [
  // AI App Builders — updated: higher tier now explicitly names Cursor as the bridge from builders to code editors
  { id: "ai5", category: "ai-tools", prompt: "AI-powered app builders (bolt.new, Lovable, Replit Agent) — have you shipped with one?", options: [{ label: "Haven't tried any", score: 0 }, { label: "Made a prototype but didn't ship", score: 1 }, { label: "Shipped something real with one", score: 2 }, { label: "Use AI builders as my primary tool, or have graduated to Cursor / Claude Code for more control", score: 3 }] },

  // AI Coding Tools — updated: references Cursor, VS Code, and model-switching (Gemini vs Claude) as concrete examples
  { id: "ai1", category: "ai-tools", prompt: "How comfortable are you with AI coding agents or editors — Claude Code, Cursor, Codex?", options: [{ label: "Haven't used one yet — I rely on chat-based AI only", score: 0 }, { label: "Tried Cursor or an AI extension in VS Code but only on small tasks", score: 1 }, { label: "Ship features weekly using Cursor or Claude Code from my editor", score: 2 }, { label: "Run multi-agent or sub-agent setups, composing tools like Cursor + Claude Code together", score: 3 }] },
  { id: "ai2", category: "ai-tools", prompt: "MCP (Model Context Protocol) servers — what's your relationship?", options: [{ label: "Never heard of MCP", score: 0 }, { label: "Heard of it, never wired one up", score: 1 }, { label: "Use community MCP servers regularly", score: 2 }, { label: "Have written or extended my own", score: 3 }] },
  // updated: mid-tier now mentions switching models (Gemini vs Claude) as a debugging move
  { id: "ai3", category: "ai-tools", prompt: "When the agent goes off the rails, what do you usually do?", options: [{ label: "Start over with a new prompt", score: 0 }, { label: "Rewrite the request more carefully", score: 1 }, { label: "Reset context, reload a planning doc, or try a different model (e.g. Gemini vs Claude)", score: 2 }, { label: "Edit the context window + tools mid-run, or spin up a sub-agent to isolate the failure", score: 3 }] },
  // updated: mid-tier now references Cursor rules and VS Code snippets as concrete examples of reusable patterns
  { id: "ai4", category: "ai-tools", prompt: "Do you use reusable prompt routines, skills, or editor configurations?", options: [{ label: "I write each prompt from scratch every time", score: 0 }, { label: "I keep a notes file of prompts that worked", score: 1 }, { label: "I have a library of reusable skills, Cursor rules, or VS Code snippets", score: 2 }, { label: "I compose skills + sub-agents into multi-step pipelines", score: 3 }] },

  // Deployment
  { id: "dep1", category: "deployment", prompt: "Have you deployed a web app to a real URL someone else can visit?", options: [{ label: "Not yet", score: 0 }, { label: "Once or twice via a guided wizard", score: 1 }, { label: "Yes, comfortably (Vercel/Netlify/Replit)", score: 2 }, { label: "Yes, including custom domains + envs", score: 3 }] },
  { id: "dep2", category: "deployment", prompt: "Edge runtimes (Cloudflare Workers, Vercel Edge, etc.) — where are you?", options: [{ label: "Not sure what those are", score: 0 }, { label: "Heard of them", score: 1 }, { label: "Deployed something to the edge", score: 2 }, { label: "Design around edge constraints on purpose", score: 3 }] },
  { id: "dep3", category: "deployment", prompt: "How do you manage environment variables / secrets across environments?", options: [{ label: "I don't yet", score: 0 }, { label: "I paste them into the dashboard manually", score: 1 }, { label: "Separate dev / preview / prod values", score: 2 }, { label: "Rotated, scoped, audited", score: 3 }] },

  // No-Code Builders
  { id: "dep4", category: "deployment", prompt: "No-code app builders (Bubble, Softr, Glide) — have you shipped a product with one?", options: [{ label: "Never tried", score: 0 }, { label: "Made something for myself", score: 1 }, { label: "Shipped to real users", score: 2 }, { label: "Run a business or client project on one", score: 3 }] },

  // Auth & Data
  { id: "auth1", category: "auth-data", prompt: "Have you shipped real user authentication (signup, login, sessions)?", options: [{ label: "Not yet", score: 0 }, { label: "A demo / tutorial version", score: 1 }, { label: "Yes, with Clerk / Supabase / similar", score: 2 }, { label: "Yes, including OAuth + roles + magic links", score: 3 }] },
  { id: "auth2", category: "auth-data", prompt: "Row-level security (RLS) or per-user data access — how comfortable?", options: [{ label: "What's RLS?", score: 0 }, { label: "I know it exists", score: 1 }, { label: "I write basic 'own rows only' policies", score: 2 }, { label: "I model role-based access end-to-end", score: 3 }] },
  { id: "auth3", category: "auth-data", prompt: "Postgres / SQL schema design — where are you?", options: [{ label: "I avoid touching the schema", score: 0 }, { label: "I can add columns when prompted", score: 1 }, { label: "I design tables, indexes, foreign keys", score: 2 }, { label: "I think in migrations and constraints", score: 3 }] },
  { id: "auth4", category: "auth-data", prompt: "Storing files (images, uploads) for real users?", options: [{ label: "Never done it", score: 0 }, { label: "Used a tutorial setup", score: 1 }, { label: "Shipped with signed URLs + access rules", score: 2 }, { label: "Designed for multi-tenant + retention", score: 3 }] },

  // UX Design — updated to reflect expanded resource pool (Dribbble, Behance, Siteinspire, Collect UI, UI8, Uiverse, Spline)
  { id: "ux1", category: "ux-design", prompt: "Where do you go for UI inspiration before building a screen?", options: [{ label: "I don't really look at design references — I just start building", score: 0 }, { label: "I occasionally browse Dribbble or Behance but don't apply what I see", score: 1 }, { label: "I actively reference Mobbin, Siteinspire, or Collect UI before most builds", score: 2 }, { label: "I keep a curated personal library and pull from it every session", score: 3 }] },
  // updated: mid-tier now references UI8 / Uiverse as pre-built kit / component sources
  { id: "ux2", category: "ux-design", prompt: "Component libraries — what do you reach for?", options: [{ label: "Whatever the AI generates from scratch", score: 0 }, { label: "shadcn/ui or v0 defaults — I pick what's quickest", score: 1 }, { label: "Pre-built UI kits or component sets (UI8, Uiverse, 21st.dev) instead of designing from scratch", score: 2 }, { label: "I maintain my own design system with tokens shared across projects", score: 3 }] },
  // updated: top tier reflects brand-level intentionality; lower tiers stay realistic
  { id: "ux3", category: "ux-design", prompt: "Typography, spacing, color — how intentional are your choices?", options: [{ label: "I use whatever's default", score: 0 }, { label: "I pick a palette and one font, usually whatever looks decent", score: 1 }, { label: "I work from a system — type scales, spacing tokens, consistent color roles", score: 2 }, { label: "I design like a brand: every screen references the same set of decisions", score: 3 }] },
  // updated: explicitly names Spline as the concrete example for the advanced tier
  { id: "ux4", category: "ux-design", prompt: "Interactive and 3D design — have you shipped anything beyond flat UI?", options: [{ label: "Haven't explored this area", score: 0 }, { label: "I've played with Spline or a similar tool but never shipped it", score: 1 }, { label: "I've added motion or a 3D element to a live project", score: 2 }, { label: "I routinely ship interactive or Spline-driven 3D UIs as part of my builds", score: 3 }] },

  // Product Thinking
  { id: "p1", category: "product", prompt: "Before building, do you write a PRD or spec?", options: [{ label: "No, I just start", score: 0 }, { label: "A few bullet points", score: 1 }, { label: "A real PRD with users + scope", score: 2 }, { label: "PRD + edge cases + success metrics", score: 3 }] },
  { id: "p2", category: "product", prompt: "How do you decide what to build next?", options: [{ label: "Whatever sounds fun", score: 0 }, { label: "Personal pain points", score: 1 }, { label: "Validated signals (Ideabrowser, X, niches)", score: 2 }, { label: "Distribution-first — I pick where I can win", score: 3 }] },
  { id: "p3", category: "product", prompt: "When something is half-built, do you ship it?", options: [{ label: "I usually abandon it", score: 0 }, { label: "I ship to friends sometimes", score: 1 }, { label: "I ship publicly and iterate", score: 2 }, { label: "I ship a v0.1 the same week I start", score: 3 }] },
];
