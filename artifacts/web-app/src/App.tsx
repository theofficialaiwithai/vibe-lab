import type { CSSProperties } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { ClerkProvider, SignIn, SignUp } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { Toaster } from "sonner";
import Home from "@/pages/Home";
import Assessment from "@/pages/Assessment";
import Results from "@/pages/Results";
import Personalize from "@/pages/Personalize";
import Hub from "@/pages/Hub";

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

// ── Shared localization (used by modal + pages) ───────────────────
const clerkLocalization = {
  signIn: {
    start: {
      title: "Sign in to Vibe Lab",
      subtitle: "to continue to Vibe Lab",
    },
  },
  signUp: {
    start: {
      title: "Create your Vibe Lab account",
      subtitle: "to start your Vibe Quotient journey",
    },
  },
};

// ── Shared design tokens ──────────────────────────────────────────
const sharedVariables = {
  colorPrimary: "#6366f1",
  colorForeground: "#f0f0f5",
  colorMutedForeground: "rgba(240,240,245,0.55)",
  colorDanger: "#ef4444",
  colorBackground: "#13131a",
  colorInput: "#1e1e2e",
  colorInputForeground: "#f0f0f5",
  colorNeutral: "#1e1e2e",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  borderRadius: "0.5rem",
};

const sharedElements = {
  rootBox: "w-full",
  socialButtonsBlockButtonText: { color: "#f0f0f5" },
  formFieldLabel: { color: "#f0f0f5" },
  footerActionLink: { color: "#6366f1" },
  footerActionText: { color: "rgba(240,240,245,0.55)" },
  dividerText: { color: "rgba(240,240,245,0.4)" },
  identityPreviewEditButton: { color: "#6366f1" },
  formFieldSuccessText: { color: "#22c55e" },
  alertText: { color: "#f0f0f5" },
  socialButtonsBlockButton: {},
  formButtonPrimary: {},
  formFieldInput: {},
  footerAction: {},
  dividerLine: {},
  alert: {},
  otpCodeFieldInput: {},
  formFieldRow: {},
  main: {},
};

// ── Modal appearance (logo + title inside card, used by <SignInButton>) ───
const clerkModalAppearance = {
  cssLayerName: "clerk",
  layout: {
    socialButtonsPlacement: "top" as const,
    socialButtonsVariant: "blockButton" as const,
  },
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: sharedVariables,
  elements: {
    ...sharedElements,
    cardBox: "rounded-2xl w-[440px] max-w-full overflow-hidden",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: { color: "#ffffff" },
    headerSubtitle: { color: "rgba(240,240,245,0.55)" },
    logoBox: {},
    logoImage: {},
  },
};

// ── Page appearance (Clerk header hidden, card transparent — we wrap it) ──
const clerkPageAppearance = {
  cssLayerName: "clerk",
  layout: {
    socialButtonsPlacement: "top" as const,
    socialButtonsVariant: "blockButton" as const,
  },
  variables: sharedVariables,
  elements: {
    ...sharedElements,
    rootBox: "w-full",
    cardBox: "w-full",
    // Make Clerk's own card shell invisible — our wrapper div is the card
    card: "!bg-transparent !shadow-none !border-0 !rounded-none",
    header: "!hidden",
    footer: "!bg-transparent !shadow-none !border-0",
    footerAction: {
      borderTop: "1px solid rgba(255,255,255,0.07)",
      paddingTop: "16px",
      marginTop: "4px",
    },
  },
};

// ── Logo icon matching the Login05 sun/gear design ────────────────
function VibeLabLogo() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", margin: "0 auto" }}
    >
      <rect width="40" height="40" rx="8" fill="#6366f1" />
      <rect x="10" y="10" width="8" height="8" rx="2" fill="white" />
      <rect x="22" y="10" width="8" height="8" rx="2" fill="white" opacity="0.6" />
      <rect x="10" y="22" width="8" height="8" rx="2" fill="white" opacity="0.6" />
      <rect x="22" y="22" width="8" height="8" rx="2" fill="white" />
    </svg>
  );
}

// ── Shared auth page wrapper with logo + title above card ─────────
function AuthHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div style={{ textAlign: "center", marginBottom: 20 }}>
      <VibeLabLogo />
      <h3
        style={{
          marginTop: 12,
          marginBottom: 4,
          fontSize: 18,
          fontWeight: 700,
          color: "#ffffff",
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </h3>
      <p style={{ margin: 0, fontSize: 14, color: "rgba(240,240,245,0.55)" }}>
        {subtitle}
      </p>
    </div>
  );
}

const pageWrap: CSSProperties = {
  minHeight: "100dvh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "var(--background)",
  padding: "40px 24px",
};

const pageInner: CSSProperties = {
  width: "100%",
  maxWidth: 480,
};

const authCard: CSSProperties = {
  backgroundColor: "#13131a",
  border: "1px solid rgba(255,255,255,0.09)",
  borderRadius: "12px",
  boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
  overflow: "hidden",
};

function SignInPage() {
  return (
    <div style={pageWrap}>
      <div style={pageInner}>
        <AuthHeader
          title="Sign in to Vibe Lab"
          subtitle="Welcome back — pick up where you left off."
        />
        <div style={authCard}>
          <SignIn
            routing="path"
            path={`${basePath}/sign-in`}
            signUpUrl={`${basePath}/sign-up`}
            appearance={clerkPageAppearance}
          />
        </div>
      </div>
    </div>
  );
}

function SignUpPage() {
  return (
    <div style={pageWrap}>
      <div style={pageInner}>
        <AuthHeader
          title="Create your Vibe Lab account"
          subtitle="Measure your Vibe Quotient and track your growth."
        />
        <div style={authCard}>
          <SignUp
            routing="path"
            path={`${basePath}/sign-up`}
            signInUrl={`${basePath}/sign-in`}
            appearance={clerkPageAppearance}
          />
        </div>
      </div>
    </div>
  );
}

function ClerkProviderWithRoutes() {
  const navigate = useNavigate();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey!}
      proxyUrl={clerkProxyUrl}
      appearance={clerkModalAppearance}
      localization={clerkLocalization}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      signInFallbackRedirectUrl={basePath || "/"}
      signUpFallbackRedirectUrl={basePath || "/"}
      routerPush={(to) => navigate(stripBase(to))}
      routerReplace={(to) => navigate(stripBase(to), { replace: true })}
    >
      <div className="min-h-screen bg-background text-foreground">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/assessment" element={<Assessment />} />
          <Route path="/results/:token" element={<Results />} />
          <Route path="/personalize" element={<Personalize />} />
          <Route path="/hub" element={<Hub />} />
          <Route path="/sign-in/*" element={<SignInPage />} />
          <Route path="/sign-up/*" element={<SignUpPage />} />
        </Routes>
        <Toaster theme="dark" position="bottom-right" richColors />
      </div>
    </ClerkProvider>
  );
}

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ClerkProviderWithRoutes />
    </BrowserRouter>
  );
}

export default App;
