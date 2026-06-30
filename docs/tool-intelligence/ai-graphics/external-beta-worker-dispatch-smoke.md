# AI Graphics External-Beta Worker Dispatch Smoke

Decision: `ai_graphics_external_beta_worker_dispatch_smoke_prepared_with_runtime_blocks`

This is a controlled external-beta worker dispatch smoke for AI graphics. It exercises the production worker dispatcher in `dry_run` metadata handoff mode for all 21 AI graphics tools, creates and releases in-memory leases, and records dispatcher events. It does not execute tools, create artifacts, start GPU runtime, mutate Supabase/GCS, create signed URLs, create public artifacts, or unlock external beta/production.

## Current Result

- Tools covered: `21`
- Product-facing capabilities covered: `12`
- GPU runtime targeted tools: `8`
- Source dispatch readiness accepted in committed docs: `false`
- Source runtime queue service proof bridge accepted in committed docs: `false`
- Source service-role queue smoke authorization accepted in committed docs: `false`
- Source route-bound operator preflight accepted in committed docs: `false`
- Mock dispatcher smoke completed in committed docs: `false`
- Live worker leases created now: `0`
- Live worker dispatches now: `0`
- Live tool executions now: `0`
- GPU runtime should start now: `false`
- External-beta-ready now: `0`
- Production-ready now: `0`

## Accepted Smoke Path

The CLI can report `external_beta_worker_dispatch_smoke_completed_without_tool_execution` only when all of these are supplied:

1. `--external-beta-worker-dispatch-readiness-packet`
2. `--external-beta-worker-dispatch-smoke-ref`
3. `--external-beta-worker-dispatch-smoke-telemetry-ref`
4. `--external-beta-worker-dispatch-smoke-lease-audit-ref`
5. `--external-beta-worker-dispatch-smoke-cleanup-ref`

The accepted source readiness packet must already show 21 worker dispatch-readiness records, 12 capability scenarios, 8 GPU-targeted tools, a preserved 21-tool runtime queue service proof bridge, the service-role queue smoke authorization ref, the route-bound operator preflight accepted for all 21 tools, zero live worker leases, zero live worker dispatches, zero tool executions, and no GPU startup.

## What The Smoke Proves

- The production worker gates accept all 21 AI graphics dry-run metadata handoff payloads.
- The dispatcher creates an in-memory lease for each tool and releases it.
- Each route stays `mockOnly=true` and uses the AI graphics tool-call handoff path.
- The source runtime queue service proof bridge remains present on all 21 smoke records.
- The source service-role queue smoke authorization remains present on all 21 smoke records.
- The source route-bound operator preflight remains present on all 21 smoke records.
- `toolRunResults`, artifact records, and quality-gate results remain empty.
- The eight GPU/model tools remain GPU-targeted, but `gpuRuntimeShouldStartNow=false`.

## Runtime Boundary

This smoke is not external beta execution. It does not create live worker leases, dispatch live workers, execute tools, execute Tool Routes, call providers/models, start browser/WebGL/canvas runtime, start GPU/model runtime, download model weights, process media, mutate Supabase/GCS, create signed URLs, create public artifacts, unlock external beta traffic, or unlock production.

GPU stays off unless a later accepted worker job actually leases a GPU-targeted tool after native runtime proof and all external beta execution gates pass.
