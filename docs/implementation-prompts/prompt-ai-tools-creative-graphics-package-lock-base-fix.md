# Prompt AI_TOOLS_CREATIVE_GRAPHICS Package-Lock Base Fix

Source prompt: `AI_TOOLS_CREATIVE_GRAPHICS_PACKAGE_LOCK_BASE_FIX`

Branch: `codex/rp-ai-tools-creative-graphics-package-lock-base-fix`

PR: pending

Decision: `package_lock_base_fix_passed_ready_for_ai_graphics_batch_1_execution_approval`

## Implementation Record

This implementation repairs the inherited `@emnapi/*` package-lock metadata mismatch blocking `npm ci` on the AI_TOOLS_CREATIVE_GRAPHICS Batch 1 approval stack.

The accepted repair is intentionally narrow:

- `package-lock.json` changed only for `@emnapi/*` entries required by existing optional/transitive dependencies.
- `package.json` changed only to add the package-lock base-fix diagnostic script.
- No `d3`, `echarts`, `vega`, or `vega_lite` dependency was added.
- No import smoke, proof, fixture, tool, route, worker, provider, Supabase, GCS, render/export, beta, or production path ran.

## Validation Note

`npm ci` failed before repair with the inherited `@emnapi/*` mismatch and passed after the minimal lockfile repair. Diagnostics, lint, typecheck, client build, server build, and readiness summaries passed; production/external beta remain globally blocked by existing readiness gates. Full validation status is recorded in `docs/prompt-ai-tools-creative-graphics-package-lock-base-fix-validation-results.md`.

## Next Prompt

`AI_TOOLS_CREATIVE_GRAPHICS_OPEN_SOURCE_TOOL_STACK_INSTALL_PROOF_BATCH_1_EXECUTION`

No AI graphics dependency install/proof execution, dependency install for `d3`, `echarts`, `vega`, or `vega_lite`, import smoke, synthetic fixture execution, E2E proof, tool execution, route execution, worker execution, provider/model call, media processing, audio processing, render/export, browser capture, map rendering, Supabase write, SQL execution, GCS upload, storage transfer, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, or production unlock was enabled.
