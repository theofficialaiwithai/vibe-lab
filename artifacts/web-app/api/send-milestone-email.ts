import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Resend } from "resend";

const FROM = "onboarding@resend.dev";
const INTERNAL_TO = "aihemeson@gmail.com";

const LEVEL_LABELS: Record<string, string> = {
  beginner: "Vibe Starter",
  intermediate: "Vibe Builder",
  advanced: "Vibe Architect",
};

const CATEGORY_LABELS: Record<string, string> = {
  "ai-tools": "AI Coding Tools",
  "deployment": "Deployment & Hosting",
  "auth-data": "Auth & Data",
  "ux-design": "UX Design Sourcing",
  "product": "Product Thinking",
};

function userEmailHtml(levelLabel: string, categoryLabel: string | null, hubUrl: string): string {
  const categoryLine = categoryLabel
    ? `<p style="font-size:15px;line-height:1.7;color:rgba(240,240,245,0.75);margin:0;">
        Your biggest opportunity right now is <strong style="color:#ffffff;">${categoryLabel}</strong>.
        Head to your <a href="${hubUrl}" style="color:#6366f1;font-weight:600;text-decoration:none;">Vibe Lab Hub</a>
        and start there — it's where you'll level up fastest.
       </p>`
    : "";

  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:#0a0a0f;">
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:40px 24px;background-color:#13131a;">
    <div style="margin-bottom:24px;">
      <span style="display:inline-block;padding:4px 12px;border-radius:999px;background-color:rgba(99,102,241,0.15);border:1px solid rgba(99,102,241,0.3);color:#6366f1;font-size:11px;font-family:monospace;letter-spacing:0.08em;text-transform:uppercase;">${levelLabel}</span>
    </div>
    <h1 style="font-size:22px;font-weight:800;color:#ffffff;margin:0 0 16px;line-height:1.25;">
      You just confirmed your level. That matters.
    </h1>
    <p style="font-size:15px;line-height:1.7;color:rgba(240,240,245,0.75);margin:0 0 ${categoryLabel ? "16px" : "0"};">
      Most people skip right past the results page. You stopped, reflected on where you actually are, and owned it — that's the first real move of someone who builds with intention. Welcome to <strong style="color:#ffffff;">${levelLabel}</strong>.
    </p>
    ${categoryLine}
    <div style="margin-top:32px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.08);">
      <p style="font-size:12px;color:rgba(240,240,245,0.35);margin:0;">
        Vibe Lab · You're receiving this because you confirmed your level on vibelab.dev
      </p>
    </div>
  </div>
</body>
</html>`;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { email, confirmedLevel, weakestCategory } = req.body as {
    email?: string;
    confirmedLevel?: string;
    weakestCategory?: string;
  };

  if (!confirmedLevel) {
    res.status(400).json({ error: "confirmedLevel is required" });
    return;
  }

  if (!process.env.RESEND_API_KEY) {
    console.error("[send-milestone-email] RESEND_API_KEY is not set — skipping");
    res.status(200).json({ ok: true, skipped: true });
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const levelLabel = LEVEL_LABELS[confirmedLevel] ?? confirmedLevel;
  const categoryLabel = weakestCategory
    ? (CATEGORY_LABELS[weakestCategory] ?? weakestCategory)
    : null;

  // ── 1. User encouragement email (only when signed in) ────────────
  if (email) {
    const hubUrl = weakestCategory
      ? `https://vibelab.dev/hub?category=${encodeURIComponent(weakestCategory)}`
      : "https://vibelab.dev/hub";

    try {
      await resend.emails.send({
        from: FROM,
        to: email,
        subject: `You're a confirmed ${levelLabel} 🎉`,
        html: userEmailHtml(levelLabel, categoryLabel, hubUrl),
      });
    } catch (err) {
      console.error("[send-milestone-email] Failed to send user email:", err);
    }
  }

  // ── 2. Internal notification (always) ────────────────────────────
  const internalLines = [
    `Someone just confirmed their level as ${levelLabel}.`,
    categoryLabel ? `Weakest category: ${categoryLabel}.` : null,
    email ? `Signed in as: ${email}` : "Anonymous (not signed in).",
  ].filter(Boolean);

  try {
    await resend.emails.send({
      from: FROM,
      to: INTERNAL_TO,
      subject: `Vibe Lab milestone: ${levelLabel}`,
      text: internalLines.join(" "),
    });
  } catch (err) {
    console.error("[send-milestone-email] Failed to send internal email:", err);
  }

  // Never block the user — always 200
  res.status(200).json({ ok: true });
}
