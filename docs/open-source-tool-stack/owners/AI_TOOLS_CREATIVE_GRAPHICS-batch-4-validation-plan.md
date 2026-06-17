# AI_TOOLS_CREATIVE_GRAPHICS Batch 4 Validation Plan

Decision: `approved_with_warnings_for_ai_graphics_batch_4_policy_and_handoff_review`

## Required Commands

- `git diff --check`
- `npm ci`
- `npm run --silent open-source-tool-stack:ai-tools-creative-graphics:batch-4-approval:diagnostics`
- inherited Batch 3 QA/import/synthetic/execution/approval diagnostics
- inherited Batch 2 QA/import/synthetic/execution/approval diagnostics
- inherited Batch 1 QA/import/synthetic/execution/package-lock/base-fix/approval diagnostics
- owner audit, open-source audit, and AI tool-study diagnostics
- `npm run prod:readiness:summary`
- `npm run prod:beta:summary`
- `npm run lint`
- `npm run typecheck:server || true`
- `npx tsc -b`
- `npm run build`
- `npm run build:server || true`
- changed-file secret scan
- `git diff --cached --check`

## Static Checks

The Batch 4 diagnostic must verify that `package-lock.json` is unchanged, dependency sections in `package.json` are unchanged, no `.local-artifacts` are committed, and no media/render/browser/canvas/WebGL/public artifact output is staged.

## Disallowed Validation

Do not run `npm install`, new package imports, Batch 4 synthetic fixtures, `@resvg/resvg-js` rasterization, Remotion render/export, route execution, worker execution, actual tool execution, provider/model calls, browser runtime, WebGL runtime, canvas runtime, Supabase, SQL, GCS upload, signed URL creation, public artifact creation, beta unlock, or production unlock.
