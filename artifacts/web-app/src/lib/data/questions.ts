export type CategoryId = "ai-tools" | "deployment" | "auth-data" | "ux-design" | "product";

export type Question = {
  id: string;
  category: CategoryId;
  prompt: string;
  options: { label: string; score: number }[];
};

export const QUESTIONS: Question[] = [
  // AI App Builders
  { id: "ai5", category: "ai-tools", prompt: "AI-powered app builders (bolt.new, Lovable, Replit Agent) — have you shipped with one?", options: [{ label: "Haven't tried any", score: 0 }, { label: "Made a prototype but didn't ship", score: 1 }, { label: "Shipped something real with one", score: 2 }, { label: "Use AI builders as a core part of how I build", score: 3 }] },

  // AI Coding Tools
  { id: "ai1", category: "ai-tools", prompt: "How comfortable are you with Claude Code, Codex, or a similar terminal-native AI coding agent?", options: [{ label: "Haven't used one yet", score: 0 }, { label: "Tried it on a small task", score: 1 }, { label: "Ship features with it weekly", score: 2 }, { label: "Run multi-agent / sub-agent setups", score: 3 }] },
  { id: "ai2", category: "ai-tools", prompt: "MCP (Model Context Protocol) servers — what's your relationship?", options: [{ label: "Never heard of MCP", score: 0 }, { label: "Heard of it, never wired one up", score: 1 }, { label: "Use community MCP servers regularly", score: 2 }, { label: "Have written or extended my own", score: 3 }] },
  { id: "ai3", category: "ai-tools", prompt: "When the agent goes off the rails, what do you usually do?", options: [{ label: "Start over with a new prompt", score: 0 }, { label: "Rewrite the request more carefully", score: 1 }, { label: "Reset context and reload a planning doc", score: 2 }, { label: "Edit context window + tools mid-run", score: 3 }] },
  { id: "ai4", category: "ai-tools", prompt: "Do you use reusable prompt routines / skills / sub-agents?", options: [{ label: "I write each prompt from scratch", score: 0 }, { label: "I keep a notes file of good prompts", score: 1 }, { label: "I have a small library of reusable skills", score: 2 }, { label: "I compose skills + sub-agents into pipelines", score: 3 }] },

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

  // UX Design
  { id: "ux1", category: "ux-design", prompt: "Where do you go for UI inspiration before building a screen?", options: [{ label: "I let the AI pick", score: 0 }, { label: "Google image search", score: 1 }, { label: "Dribbble / Mobbin / specific apps", score: 2 }, { label: "I keep my own reference library", score: 3 }] },
  { id: "ux2", category: "ux-design", prompt: "Component libraries — what do you reach for?", options: [{ label: "Whatever the AI generates from scratch", score: 0 }, { label: "shadcn/ui or v0 defaults", score: 1 }, { label: "shadcn + 21st.dev + custom variants", score: 2 }, { label: "I maintain my own design system / tokens", score: 3 }] },
  { id: "ux3", category: "ux-design", prompt: "Typography, spacing, color — how intentional are your choices?", options: [{ label: "I use whatever's default", score: 0 }, { label: "I pick a palette and one font", score: 1 }, { label: "I work from a system (scales, tokens)", score: 2 }, { label: "I design like a brand, not a screen", score: 3 }] },
  { id: "ux4", category: "ux-design", prompt: "3D and interactive design tools (Spline, Rive, Three.js) — have you shipped interactive visuals?", options: [{ label: "Haven't explored this area", score: 0 }, { label: "Played with one but not shipped", score: 1 }, { label: "Added motion or 3D to a live project", score: 2 }, { label: "Routinely ship interactive or 3D-driven UIs", score: 3 }] },

  // Product Thinking
  { id: "p1", category: "product", prompt: "Before building, do you write a PRD or spec?", options: [{ label: "No, I just start", score: 0 }, { label: "A few bullet points", score: 1 }, { label: "A real PRD with users + scope", score: 2 }, { label: "PRD + edge cases + success metrics", score: 3 }] },
  { id: "p2", category: "product", prompt: "How do you decide what to build next?", options: [{ label: "Whatever sounds fun", score: 0 }, { label: "Personal pain points", score: 1 }, { label: "Validated signals (Ideabrowser, X, niches)", score: 2 }, { label: "Distribution-first — I pick where I can win", score: 3 }] },
  { id: "p3", category: "product", prompt: "When something is half-built, do you ship it?", options: [{ label: "I usually abandon it", score: 0 }, { label: "I ship to friends sometimes", score: 1 }, { label: "I ship publicly and iterate", score: 2 }, { label: "I ship a v0.1 the same week I start", score: 3 }] },
];
