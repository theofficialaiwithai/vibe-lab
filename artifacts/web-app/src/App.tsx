import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { ClerkProvider, SignIn, SignUp } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import Home from "@/pages/Home";
import Assessment from "@/pages/Assessment";
import Results from "@/pages/Results";
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

const clerkAppearance = {
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
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
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "rounded-2xl w-[440px] max-w-full overflow-hidden",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: { color: "#ffffff" },
    headerSubtitle: { color: "rgba(240,240,245,0.55)" },
    socialButtonsBlockButtonText: { color: "#f0f0f5" },
    formFieldLabel: { color: "#f0f0f5" },
    footerActionLink: { color: "#6366f1" },
    footerActionText: { color: "rgba(240,240,245,0.55)" },
    dividerText: { color: "rgba(240,240,245,0.4)" },
    identityPreviewEditButton: { color: "#6366f1" },
    formFieldSuccessText: { color: "#22c55e" },
    alertText: { color: "#f0f0f5" },
    logoBox: {},
    logoImage: {},
    socialButtonsBlockButton: {},
    formButtonPrimary: {},
    formFieldInput: {},
    footerAction: {},
    dividerLine: {},
    alert: {},
    otpCodeFieldInput: {},
    formFieldRow: {},
    main: {},
  },
};

function SignInPage() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--background)",
        padding: "0 24px",
      }}
    >
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
      />
    </div>
  );
}

function SignUpPage() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--background)",
        padding: "0 24px",
      }}
    >
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
      />
    </div>
  );
}

function ClerkProviderWithRoutes() {
  const navigate = useNavigate();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey!}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
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
          <Route path="/hub" element={<Hub />} />
          <Route path="/sign-in/*" element={<SignInPage />} />
          <Route path="/sign-up/*" element={<SignUpPage />} />
        </Routes>
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
