---
name: Clerk + React version conflict
description: @clerk/themes 2.x conflicts with @clerk/react 6.x; drop @clerk/themes and use appearance variables directly.
---

**Rule:** Do not install `@clerk/themes` alongside `@clerk/react` 6.x. They pull in incompatible versions of `@clerk/shared` (v3 vs v4), which causes a "multiple copies of React" runtime crash.

**Why:** `@clerk/themes@2.x` depends on `@clerk/shared@3.x`, while `@clerk/react@6.x` needs `@clerk/shared@4.x`. Two copies of `@clerk/shared` → two React instances → invalid hook calls.

**How to apply:** Use `appearance.variables` and `appearance.elements` directly on `<ClerkProvider>` to achieve a dark theme without importing `@clerk/themes`. The `cssLayerName: "clerk"` option in `appearance` still works fine.
