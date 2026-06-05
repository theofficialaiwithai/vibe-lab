import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--border)",
        padding: "24px",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <span
          style={{
            fontFamily: "monospace",
            fontSize: 12,
            color: "var(--muted)",
          }}
        >
          VIBE LAB © 2026
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Link
            to="/assessment"
            style={{
              fontFamily: "monospace",
              fontSize: 12,
              color: "var(--muted)",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--foreground)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
          >
            Assessment
          </Link>
          <Link
            to="/resources"
            style={{
              fontFamily: "monospace",
              fontSize: 12,
              color: "var(--muted)",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--foreground)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
          >
            Resources
          </Link>
        </div>
      </div>
    </footer>
  );
}
