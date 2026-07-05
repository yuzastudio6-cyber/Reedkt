# AI Graphics Production Launch Controls

Decision: `ai_graphics_production_launch_controls_prepared_with_runtime_blocks`

This packet defines the production launch control contract for the 21 AI
graphics tools and 12 product-facing capabilities. It is a production evidence
gate only. It records which private/backend controls must exist before a later
final production go/no-go packet can be considered.

## Required Private Evidence

The evaluator accepts only `private://`, `backend://`, or
`production-evidence://` references for:

- production owner approval.
- production support runbook.
- production incident response.
- production rollback and kill-switch plan.
- production cost and concurrency ceiling.
- production monitoring and alerting.
- production post-launch review.
- production credit ledger and approved snapshot controls.
- production Tool Route deployment evidence.
- production Worker deployment evidence.
- production privacy and retention controls.
- production private artifact controls.
- production canary cohort.

HTTP, HTTPS, GCS, S3, signed URL, public artifact, and public-path references
are rejected by the controls evaluator.

## Acceptance Shape

- Required control refs: 13.
- Default accepted control refs: 0.
- Accepted private-evidence control refs: 13.
- AI graphics tools covered: 21.
- Product-facing capabilities covered: 12.
- GPU/model runtime targeted tools: 8.
- GPU runtime policy: on-demand only.
- Agent can select for planning: true.
- Agent can execute tools now: false.
- GPU runtime should start now: false.
- Production ready now: false.

## No Runtime Unlock

This packet does not execute tools, execute routes, enqueue workers, dispatch
workers, call providers/models, run browser/WebGL/canvas runtime, start GPU or
model runtime, download or load model weights, process media, mutate
Supabase/GCS, create signed URLs, create public artifacts, enable production
traffic, or mark production ready.

## Next Gate

After all private production launch controls are accepted, the production launch
readiness gap shrinks to final go/no-go and explicit traffic cutover approval.
Those later gates must still keep GPU runtime on-demand only and must not start
GPU unless a future accepted worker/tool job calls a GPU/model tool.
