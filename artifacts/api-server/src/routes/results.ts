import { Router, type IRouter } from "express";
import pg from "pg";

const router: IRouter = Router();
const { Pool } = pg;

function getPool() {
  return new Pool({ connectionString: process.env.DATABASE_URL });
}

router.post("/results", async (req, res) => {
  const { scores, overall_score, level, user_id } = req.body as {
    scores: unknown;
    overall_score: number;
    level: string;
    user_id?: string | null;
  };

  if (!scores || overall_score == null || !level) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const pool = getPool();
  try {
    const result = await pool.query<{ share_token: string }>(
      `INSERT INTO assessment_results (user_id, scores, overall_score, level)
       VALUES ($1, $2, $3, $4)
       RETURNING share_token`,
      [user_id ?? null, JSON.stringify(scores), overall_score, level]
    );
    res.json({ share_token: result.rows[0].share_token });
  } catch (err) {
    req.log.error(err, "Failed to save assessment result");
    res.status(500).json({ error: "Failed to save result" });
  } finally {
    await pool.end();
  }
});

router.get("/results/:token", async (req, res) => {
  const { token } = req.params;

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(token)) {
    res.status(400).json({ error: "Invalid token format" });
    return;
  }

  const pool = getPool();
  try {
    const result = await pool.query(
      `SELECT scores, overall_score, level, share_token
       FROM assessment_results
       WHERE share_token = $1`,
      [token]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Result not found" });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    req.log.error(err, "Failed to fetch assessment result");
    res.status(500).json({ error: "Failed to fetch result" });
  } finally {
    await pool.end();
  }
});

export default router;
