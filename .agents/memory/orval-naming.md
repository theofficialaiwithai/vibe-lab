---
name: OpenAPI schema naming vs orval-generated names
description: Orval auto-names zod schemas from operationId; component schema names must not clash or TS2308 fires.
---

**Rule:** When naming `components/schemas` in the OpenAPI spec, never use the same name that orval would auto-derive from an operationId.

**Why:** Orval generates zod schemas named `{OperationId}Response`, `{OperationId}Body`, etc. If a component schema has the same name, the generated barrel re-exports the same name twice → TS2308 duplicate export error. Orval also regenerates `lib/api-zod/src/index.ts` on every codegen run, so hand-editing that file as a workaround won't stick.

**How to apply:** Use domain-specific component schema names (e.g. `AssessmentInput`, `ShareTokenPayload`, `AssessmentResultData`) instead of operation-derived names (e.g. `SaveResultResponse`, `GetResultResponse`).
