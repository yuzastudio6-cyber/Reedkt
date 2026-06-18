# Implementation Prompt: WORKER_AI_GRAPHICS_METADATA_JOB_PAYLOAD_SHAPE_QA_REVIEW

## Prompt Summary

Create a QA/review-only Worker Runtime packet from
`origin/codex/rp-worker-ai-graphics-metadata-job-payload-shape-approval`, branch
`codex/rp-worker-ai-graphics-metadata-job-payload-shape-qa-review`, and draft PR
`[worker] AI graphics metadata job payload shape QA review`.

## Required Source Evidence

- PR #482 Worker job payload shape approval at `15615ae99f0968b84cb63b615ce4243771fda45d`.
- PR #480 Worker handoff QA at `034ad49c1f7504dacfa6864aa21bb8cf09e90c0d`.
- PR #478 Worker handoff approval at `33c3b945f0d40e9c4531783a9a5f07adee174108`.
- PR #476 owner approval at `51207f974ea35f6ab4f46b2465110d743ecc36fa`.
- PR #473 gate-status QA result `tool_route_ai_graphics_metadata_local_fixture_gate_status_qa_passed_with_warnings`.
- PR #471 gate status with `dryRunPassedClaimed=false` and `generatedLocalFixturePassedClaimed=false`.
- PR #464 run id `ai-graphics-local-fixture-validation-local-static`.
- PR #462/#458/#457/#456/#454 Tool Route and AI graphics source chain.
- PR #414/#409/#404/#398 merged Tool Route context.
- PR #164 Track B policy context only.

## Implementation Record

- Worktree: `/private/tmp/reeditpro-worker-ai-graphics-metadata-job-payload-shape-qa-review`.
- Branch: `codex/rp-worker-ai-graphics-metadata-job-payload-shape-qa-review`.
- Decision: `worker_ai_graphics_metadata_job_payload_shape_qa_passed_with_warnings`.
- Next lane: `WORKER_AI_GRAPHICS_METADATA_JOB_PAYLOAD_SCHEMA_VALIDATION_APPROVAL`.
- PR link/check status: pending PR creation.

## Scope Boundary

No worker execution, job claim, lease mutation, queue execution, route execution,
actual tool execution, provider/model runtime, browser/WebGL/canvas runtime,
resvg rasterization, Remotion render/export, Supabase mutation, SQL execution,
GCS/storage transfer, signed URL creation, public artifact creation, raw prompt
execution, internal beta unlock, external beta unlock, production unlock, or
broad service-role handler was enabled.
