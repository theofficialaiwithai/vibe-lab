import type { VercelRequest, VercelResponse } from "@vercel/node";
import Anthropic from "@anthropic-ai/sdk";

// Context snapshot of the current STACK shape and question options.
// Update these strings when resources.ts or questions.ts change significantly.
const STACK_CONTEXT = `
The STACK resource array uses these StackGroup values:
  "Deployment"   — hosting/deploy tools (Vercel, Netlify, Cloudflare)
  "Authentication" — auth tools (Clerk)
  "Database"     — database tools (Neon, Supabase)
  "UX Design"    — design inspiration and component sources (Dribbble, Mobbin, shadcn/ui, UI8, Uiverse, Spline, etc.)
  "Vibe Coding"  — AI coding tools and editors (Claude Code, Replit, bolt.new, Cursor, VS Code, Gemini, Google AI Studio, etc.)
  "Product Ideas" — product research (Ideabrowser)
  "No-Code"      — no-code builders (Bubble, Softr, Glide)

Level values (lowercase): "beginner" | "intermediate" | "advanced"

CategoryId values for the categories array: "ai-tools" | "deployment" | "auth-data" | "ux-design" | "product"

Example resource object (exact TypeScript shape):
{ id: "st-cursor", title: "Cursor", description: "AI-native code editor with Claude and GPT built in. The next step for builders who've outgrown no-code tools.", url: "https://cursor.com", type: "tool", level: "beginner", categories: ["ai-tools"], group: "Vibe Coding" }

The "type" field for STACK entries is always "tool".
Generate an id using the pattern "st-<lowercased-kebab-name>".
The description should be 1–2 punchy sentences, third-person, tool-forward (not "best suited for" framing).
`;

const QUESTIONS_CONTEXT = `
Current ux-design question option text (score 0→3 for each question):
- ux1 (UI inspiration source):
    0: "I don't really look at design references — I just start building"
    1: "I occasionally browse Dribbble or Behance but don't apply what I see"
    2: "I actively reference Mobbin, Siteinspire, or Collect UI before most builds"
    3: "I keep a curated personal library and pull from it every session"
- ux2 (component libraries):
    0: "Whatever the AI generates from scratch"
    1: "shadcn/ui or v0 defaults — I pick what's quickest"
    2: "Pre-built UI kits or component sets (UI8, Uiverse, 21st.dev) instead of designing from scratch"
    3: "I maintain my own design system with tokens shared across projects"
- ux3 (typography/spacing/color):
    0: "I use whatever's default"
    1: "I pick a palette and one font, usually whatever looks decent"
    2: "I work from a system — type scales, spacing tokens, consistent color roles"
    3: "I design like a brand: every screen references the same set of decisions"
- ux4 (interactive/3D design):
    0: "Haven't explored this area"
    1: "I've played with Spline or a similar tool but never shipped it"
    2: "I've added motion or a 3D element to a live project"
    3: "I routinely ship interactive or Spline-driven 3D UIs as part of my builds"

Current ai-tools question option text (score 0→3 for each question):
- ai5 (AI app builders):
    0: "Haven't tried any"
    1: "Made a prototype but didn't ship"
    2: "Shipped something real with one"
    3: "Use AI builders as my primary tool, or have graduated to Cursor / Claude Code for more control"
- ai1 (AI coding agents/editors):
    0: "Haven't used one yet — I rely on chat-based AI only"
    1: "Tried Cursor or an AI extension in VS Code but only on small tasks"
    2: "Ship features weekly using Cursor or Claude Code from my editor"
    3: "Run multi-agent or sub-agent setups, composing tools like Cursor + Claude Code together"
- ai2 (MCP servers):
    0: "Never heard of MCP"
    1: "Heard of it, never wired one up"
    2: "Use community MCP servers regularly"
    3: "Have written or extended my own"
- ai3 (when agent fails):
    0: "Start over with a new prompt"
    1: "Rewrite the request more carefully"
    2: "Reset context, reload a planning doc, or try a different model (e.g. Gemini vs Claude)"
    3: "Edit the context window + tools mid-run, or spin up a sub-agent to isolate the failure"
- ai4 (reusable prompts/skills):
    0: "I write each prompt from scratch every time"
    1: "I keep a notes file of prompts that worked"
    2: "I have a library of reusable skills, Cursor rules, or VS Code snippets"
    3: "I compose skills + sub-agents into multi-step pipelines"
`;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { name, url, note } = req.body as {
    name?: string;
    url?: string;
    note?: string;
  };

  if (!name || !url) {
    res.status(400).json({ error: "name and url are required" });
    return;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(500).json({ error: "ANTHROPIC_API_KEY is not configured" });
    return;
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `You are a resource curator for Vibe Lab, a platform that helps people learn to build with AI.

${STACK_CONTEXT}

${QUESTIONS_CONTEXT}

A new tool has been submitted for classification:
- Name: ${name}
- URL: ${url}
${note ? `- Note from submitter: ${note}` : ""}

Return ONLY valid JSON — no markdown, no code fences, no explanation. Use this exact shape:
{
  "category": "<one StackGroup value from the list above>",
  "level": "Beginner" | "Intermediate" | "Advanced",
  "bestSuitedFor": "<one sentence describing who benefits most from this tool>",
  "resourceSnippet": "<ready-to-paste TypeScript object literal matching the exact STACK entry shape, as a single-line string>",
  "suggestedQuestionEdits": [
    {
      "category": "ux-design" | "ai-tools",
      "questionId": "<e.g. ux1, ai3>",
      "currentOptionText": "<verbatim current option text>",
      "suggestedOptionText": "<updated text that naturally weaves in this tool as a concrete example>",
      "reason": "<one sentence explaining why this option should mention the tool>"
    }
  ]
}

Only include entries in suggestedQuestionEdits if this tool is a strong fit as a named example in one of the existing answer options — it must make the option more concrete, not just longer. Return an empty array if no edits are warranted.`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const block = message.content[0];
    const raw = block?.type === "text" ? block.text.trim() : "";

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      res.status(500).json({
        error: "Claude returned a response that could not be parsed as JSON",
        raw,
      });
      return;
    }

    res.status(200).json(parsed);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: `Anthropic API call failed: ${msg}` });
  }
}
