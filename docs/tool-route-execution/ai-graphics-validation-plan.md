# AI Graphics Metadata Integration Validation Plan

Decision: `approved_with_warnings_for_tool_route_ai_graphics_metadata_integration`

## Required Static Validation

- `git diff --check`
- `npm ci`
- `npm run --silent tool-route:ai-graphics-metadata-integration-approval:diagnostics`
- `npm run --silent open-source-tool-stack:ai-tools-creative-graphics:route-manifest-integration-qa:diagnostics`
- `npm run --silent open-source-tool-stack:ai-tools-creative-graphics:route-manifest-integration-approval:diagnostics`
- inherited Batch 4, Batch 3, Batch 2, Batch 1, package-lock base fix, owner audit, central open-source audit, and AI tool-study diagnostics
- `npm run prod:readiness:summary`
- `npm run prod:beta:summary`
- `npm run lint`
- `npm run typecheck:server`
- `npx tsc -b`
- `npm run build`
- `npm run build:server`
- changed-file secret scan
- `git diff --cached --check`

## Validation Guardrails

Validation must not run dependency install mutation, new imports, new synthetic fixtures, route execution, actual tool execution, worker execution, provider/model calls, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, Supabase, SQL, GCS upload, signed URL creation, public artifact creation, raw prompt execution, beta, or production commands.
