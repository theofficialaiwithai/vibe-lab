import type { VercelRequest, VercelResponse } from "@vercel/node";
import { neon } from "@neondatabase/serverless";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { id, action, note } = req.body as {
    id?: number;
    action?: "approve" | "request-changes";
    note?: string;
  };

  if (!id || !action || !["approve", "request-changes"].includes(action)) {
    res.status(400).json({ error: "id and action ('approve' | 'request-changes') are required" });
    return;
  }

  if (action === "request-changes" && !note?.trim()) {
    res.status(400).json({ error: "note is required when requesting changes" });
    return;
  }

  const connStr = process.env.VITE_NEON_CONNECTION_STRING;
  if (!connStr) {
    res.status(500).json({ error: "Database not configured" });
    return;
  }

  const sql = neon(connStr);
  const newStatus = action === "approve" ? "auto-approved" : "changes-requested";

  try {
    if (action === "approve") {
      await sql`
        UPDATE user_build_projects
        SET status = ${newStatus}
        WHERE id = ${id}
      `;
    } else {
      await sql`
        UPDATE user_build_projects
        SET status = ${newStatus}, review_note = ${note!.trim()}
        WHERE id = ${id}
      `;
    }
    res.status(200).json({ ok: true, status: newStatus });
  } catch (err) {
    console.error("[review-challenge] DB update failed:", err);
    res.status(500).json({ error: "Database update failed" });
  }
}
