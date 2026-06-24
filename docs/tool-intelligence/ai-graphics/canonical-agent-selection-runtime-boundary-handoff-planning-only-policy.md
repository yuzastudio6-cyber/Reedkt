# AI Graphics Runtime Boundary Handoff Planning-Only Policy

Decision: `ai_graphics_canonical_agent_selection_runtime_boundary_handoff_review_passed_with_warnings`

Canonical agent selection may read runtime-boundary metadata and may return planning/study metadata recommendations only.

## Handoff Contract

Allowed behavior:

- agent may read runtime-boundary metadata
- agent may select tools for planning/study only
- agent may rank tools
- agent may eliminate tools
- agent may explain missing proof
- agent may recommend preferred and fallback tools for planning
- agent may return next proof milestones
- agent may expose why execution is blocked

Blocked behavior:

- no tool execution
- no Tool Route execution
- no Worker execution
- no provider/model execution
- no browser/WebGL/canvas runtime
- no GPU/model runtime
- no model-weight download
- no media processing
- no Supabase mutation
- no SQL
- no GCS upload
- no signed URL
- no public artifact
- no beta unlock
- no production unlock

- Tool Route placeholder: future-only; routeExecutionApprovedNow remains false.
- Worker placeholder: future-only; workerExecutionApprovedNow remains false.
- Runtime proof placeholder: future-only; browser/WebGL/canvas and GPU/model runtime remain false.

## Safety Boundary

- Agent selection may consume runtime-boundary metadata only for planning/study metadata.
- CPU/static validated tools remain not agent-executable.
- Browser chart runtime remains future-only.
- Animation runtime remains future-only.
- Browser/canvas/WebGL runtime remains future-only.
- Model CPU/GPU runtime remains future-only.
- Tool Route handoff remains future-only.
- Worker handoff remains future-only.
- Public artifacts and signed URLs remain future-only.
- Track B remains under TRACK_B_MEDIA_OSS_STEWARD as evidence-only exclusion context.
- Track A render/export exclusion via PR #544 remains evidence-only context.
- Internal owner labels are not product-facing capability names.
- No E2E proof, runtime readiness, internal beta, external beta, or production readiness is approved.
