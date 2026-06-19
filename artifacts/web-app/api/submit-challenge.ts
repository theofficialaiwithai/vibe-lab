import type { VercelRequest, VercelResponse } from "@vercel/node";
import { neon } from "@neondatabase/serverless";
import Anthropic from "@anthropic-ai/sdk";

const LEVEL_LABELS: Record<string, string> = {
  beginner: "Vibe Starter",
  intermediate: "Vibe Builder",
  advanced: "Vibe Architect",
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { userId, email, level, challengeType, challengeId, description } =
    req.body as {
      userId?: string;
      email?: string;
      level?: string;
      challengeType?: "use-case" | "custom";
      challengeId?: string;
      description?: string;
    };

  if (!level || !challengeType || !description) {
    res.status(400).json({ error: "level, challengeType, and description are required" });
    return;
  }

  const connStr = process.env.VITE_NEON_CONNECTION_STRING;
  if (!connStr) {
    res.status(500).json({ error: "Database not configured" });
    return;
  }

  const sql = neon(connStr);

  // ── 1. Insert initial row ─────────────────────────────────────────
  let rowId: number | null = null;
  try {
    const rows = await sql`
      INSERT INTO user_build_projects
        (user_id, email, level, challenge_type, challenge_id, description, status)
      VALUES
        (${userId ?? null}, ${email ?? null}, ${level}, ${challengeType},
         ${challengeId ?? null}, ${description}, 'pending')
      RETURNING id
    `;
    rowId = (rows[0] as { id: number }).id;
  } catch (err) {
    console.error("[submit-challenge] DB insert failed:", err);
    res.status(500).json({ error: "Failed to save challenge" });
    return;
  }

  // ── 2. AI triage ─────────────────────────────────────────────────
  const levelLabel = LEVEL_LABELS[level] ?? level;
  const isPreVetted = challengeType === "use-case";

  let feedback =
    "Great choice — go build it. The best way to learn is to ship something real.";
  let status: "auto-approved" | "needs-human-review" = "auto-approved";

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

      const prompt = `You are a friendly build coach for Vibe Lab, a platform for AI-powered builders.

A user at the "${levelLabel}" level has submitted a build challenge.
Challenge type: ${isPreVetted ? "pre-vetted use-case (lean toward approving)" : "custom description (apply genuine judgment)"}
Description: "${description}"

Return ONLY valid JSON — no markdown, no code fences:
{
  "feedback": "<2-3 short, encouraging, specific sentences. For use-cases always approve. For custom, note if it's a good fit for their level. Be warm, not corporate.>",
  "status": "auto-approved" | "needs-human-review"
}

Use "needs-human-review" ONLY for custom descriptions that are vague (less than 10 words with no real scope), contradictory, or wildly mis-leveled (e.g. a Starter describing a multi-tenant SaaS with billing). Pre-vetted use-cases are always "auto-approved".`;

      const message = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 256,
        messages: [{ role: "user", content: prompt }],
      });

      const block = message.content[0];
      const raw = block?.type === "text" ? block.text.trim() : "";
      const parsed = JSON.parse(raw) as {
        feedback: string;
        status: "auto-approved" | "needs-human-review";
      };
      feedback = parsed.feedback;
      status = parsed.status;
    } catch (err) {
      console.error("[submit-challenge] AI triage failed — defaulting to auto-approved:", err);
      // Graceful fallback: don't block the user
    }
  }

  // ── 3. Update row with AI result ──────────────────────────────────
  if (rowId !== null) {
    try {
      await sql`
        UPDATE user_build_projects
        SET ai_feedback = ${feedback}, status = ${status}
        WHERE id = ${rowId}
      `;
    } catch (err) {
      console.error("[submit-challenge] DB update failed:", err);
      // Non-fatal — return the result anyway
    }
  }

  res.status(200).json({ feedback, status });
}
