import { Link } from "react-router-dom";

export default function Nav() {
  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        backgroundColor: "var(--background)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 24px",
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            textDecoration: "none",
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              backgroundColor: "var(--primary)",
              display: "inline-block",
              borderRadius: 2,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              color: "#ffffff",
              fontWeight: 700,
              fontSize: 14,
              letterSpacing: "0.1em",
            }}
          >
            VIBE LAB
          </span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <Link
            to="/assessment"
            style={{
              color: "var(--foreground)",
              opacity: 0.6,
              fontSize: 11,
              fontFamily: "monospace",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}
          >
            Assessment
          </Link>
          <Link
            to="/hub"
            style={{
              color: "var(--foreground)",
              opacity: 0.6,
              fontSize: 11,
              fontFamily: "monospace",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}
          >
            Hub
          </Link>
          <Link
            to="/assessment"
            style={{
              backgroundColor: "var(--primary)",
              color: "#ffffff",
              fontSize: 12,
              fontWeight: 600,
              padding: "6px 14px",
              borderRadius: 6,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            Publish ▶
          </Link>
        </div>
      </div>
    </nav>
  );
}
