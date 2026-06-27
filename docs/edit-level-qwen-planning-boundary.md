# Edit Level Qwen Planning Boundary

Status: RP-EDITLEVEL-07 boundary.

RP-EDITLEVEL-07 is a mock/local Qwen planning policy layer. It is not a runtime planner implementation.

## Allowed

- Type contracts for Qwen planning profile metadata.
- Deterministic rules and summaries.
- Browser-safe UI adapter models.
- Backend mock services, contracts, scenarios, and orchestrator exports.
- Visible Qwen planning summaries in existing Edit Level UI surfaces.
- Smoke and focused Playwright coverage.

## Forbidden In This Milestone

- No Qwen call.
- No Qwen2.5-VL call.
- No DeepSeek call.
- No provider call.
- No real planner execution.
- No edit plan creation.
- No worker job creation.
- No render/export.
- No progress execution.
- No Supabase read/write/migration.
- No file-byte read.
- No external URL fetch.
- No credit reservation or spend.
- No `ChatNativeEditor` modification.

Boundary terms for smoke coverage: no Qwen call, no Qwen2.5-VL call, no DeepSeek call, no provider call, no real planner, no edit plan creation, estimate-only policy, and no credit operation.

## Missing Legacy Files

The checkout still lacks several requested legacy or future planning surfaces, including Qwen role/marker/runtime docs, `src/components/projects/*`, `src/components/projects/brief/*`, project production-plan docs, `docs/reeditpro-*` status docs, and internal-testing scenarios. RP07 documents this instead of creating placeholders.

Next milestone: `RP-EDITLEVEL-08 - Level-Aware QA Gates`.
