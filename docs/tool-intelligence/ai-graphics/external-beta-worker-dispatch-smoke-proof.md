# AI Graphics External-Beta Worker Dispatch Smoke Proof

Decision: `ai_graphics_external_beta_worker_dispatch_smoke_proof_prepared_with_runtime_blocks`

This is a saved-result proof validator for the external-beta AI graphics worker dispatch smoke. It does not run workers. It accepts a saved smoke result only when that result proves all 21 AI graphics tools entered the production worker dispatcher through dry-run metadata handoff, all 12 product-facing capabilities were covered, every in-memory lease was released, and no tool execution or artifact path was created.

## Current Result

- Tools covered: `21`
- Product-facing capabilities covered: `12`
- GPU/model tools covered: `8`
- Source worker dispatch smoke accepted in committed docs: `false`
- Source runtime queue service proof bridge accepted in committed docs: `false`
- Source service-role queue smoke authorization accepted in committed docs: `false`
- Worker dispatch smoke proof accepted in committed docs: `false`
- Live worker leases created now: `0`
- Live worker dispatches now: `0`
- Live tool executions now: `0`
- GPU runtime should start now: `false`
- External-beta-ready now: `0`
- Production-ready now: `0`

## Accepted Proof Path

The CLI can report `external_beta_worker_dispatch_smoke_proof_accepted_with_runtime_blocks` only when all of these are supplied:

1. `--external-beta-worker-dispatch-smoke-result`
2. `--external-beta-worker-dispatch-smoke-evidence-ref`
3. `--external-beta-worker-dispatch-smoke-telemetry-ref`
4. `--external-beta-worker-dispatch-smoke-lease-audit-ref`
5. `--external-beta-worker-dispatch-smoke-cleanup-proof-ref`

The saved source result must have decision `external_beta_worker_dispatch_smoke_completed_without_tool_execution` and must preserve the 21-tool runtime queue service proof bridge and service-role queue smoke authorization ref from dispatch readiness.

## What The Proof Accepts

- `21` prepared and completed worker dispatch smoke jobs.
- `12` completed product-facing capability smoke scenarios.
- `8` GPU/model tools targeted to `gpu_ai_worker`.
- `21` in-memory leases created and `21` released.
- All routes stayed `mockOnly=true` and used AI graphics tool-call handoff metadata.
- The runtime queue service proof bridge is present on all 21 saved smoke records.
- The service-role queue smoke authorization is present on all 21 saved smoke records.
- `toolRunResults`, artifact records, and quality-gate result arrays stayed empty.
- `liveWorkerLeasesCreatedNow=0`, `liveWorkerDispatchesNow=0`, and `liveToolExecutionsNow=0`.

## Runtime Boundary

This proof is not external beta execution. The validator reads saved evidence only. It does not create live worker leases, dispatch production workers, execute Tool Routes, execute tools, call providers/models, start browser/WebGL/canvas runtime, start GPU/model runtime, download model weights, process media, mutate Supabase/GCS, create signed URLs, create public artifacts, unlock external beta traffic, or unlock production.

GPU remains on-demand only: it can start only for a later accepted worker/tool call after native runtime proof, private artifact policy, cost/rollback, and quality gates pass. No idle GPU runtime is approved.
