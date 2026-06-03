import type { ReactNode } from "react";
import Nav from "./Nav";
import Footer from "./Footer";

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Nav />
      <main style={{ paddingTop: 72, flex: 1 }}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
