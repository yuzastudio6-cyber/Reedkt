# Implementation Prompt: WORKER_AI_GRAPHICS_METADATA_HANDOFF_APPROVAL

## Prompt Summary

Create a docs/static-diagnostics-only Worker Runtime handoff approval packet from `origin/codex/rp-tool-route-ai-graphics-metadata-local-fixture-gate-status-owner-approval`, branch `codex/rp-worker-ai-graphics-metadata-handoff-approval`, and draft PR `[worker] AI graphics metadata handoff approval`.

## Required Source Evidence

- PR #476 owner approval at `51207f974ea35f6ab4f46b2465110d743ecc36fa`.
- PR #473 QA result `tool_route_ai_graphics_metadata_local_fixture_gate_status_qa_passed_with_warnings`.
- PR #464 run id `ai-graphics-local-fixture-validation-local-static`.
- PR #462/#458/#457/#456/#454 Tool Route and AI graphics source chain.
- PR #414/#409/#404/#398 merged Tool Route context.
- PR #164 Track B policy context only.

## Implementation Record

- Worktree: `/private/tmp/reeditpro-worker-ai-graphics-metadata-handoff-approval`.
- Branch: `codex/rp-worker-ai-graphics-metadata-handoff-approval`.
- Decision: `worker_ai_graphics_metadata_handoff_approved_with_warnings`.
- Next lane: `WORKER_AI_GRAPHICS_METADATA_HANDOFF_QA_REVIEW`.
- PR link/check status: pending PR creation follow-up.
- Base gap: `docs/worker-runtime/` absent on the source branch.

## Scope Boundary

No worker execution, job claim, lease mutation, queue execution, route execution, actual tool execution, provider/model runtime, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, or broad service-role handler was enabled.
