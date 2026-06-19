import type { VercelRequest, VercelResponse } from "@vercel/node";
import { neon } from "@neondatabase/serverless";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { id } = req.query;
  if (!id || Array.isArray(id)) {
    res.status(400).json({ error: "id query param is required" });
    return;
  }

  const connStr = process.env.VITE_NEON_CONNECTION_STRING;
  if (!connStr) {
    res.status(500).json({ error: "Database not configured" });
    return;
  }

  const sql = neon(connStr);

  try {
    const rows = await sql`
      SELECT id, status, ai_feedback, review_note
      FROM user_build_projects
      WHERE id = ${id}
      LIMIT 1
    `;
    if (rows.length === 0) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const row = rows[0] as {
      id: string;
      status: string;
      ai_feedback: string | null;
      review_note: string | null;
    };
    res.status(200).json({
      id: row.id,
      status: row.status,
      ai_feedback: row.ai_feedback ?? "",
      review_note: row.review_note ?? null,
    });
  } catch (err) {
    console.error("[challenge-status] DB query failed:", err);
    res.status(500).json({ error: "Database query failed" });
  }
}
