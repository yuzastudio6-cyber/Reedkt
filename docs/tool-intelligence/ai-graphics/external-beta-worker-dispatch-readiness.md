# AI Graphics External-Beta Worker Dispatch Readiness

Decision: `ai_graphics_external_beta_worker_dispatch_readiness_prepared_with_runtime_blocks`

This gate is the next external-beta step after the service-role queue smoke proof. It validates that a saved, non-production queue-smoke proof can be bound to worker lease and dispatch readiness records for all 21 AI graphics tools without creating live worker leases, dispatching workers, executing tools, starting GPU runtime, or unlocking beta/production.

## Current Result

- Tools covered: `21`
- Product-facing capabilities covered: `12`
- GPU runtime targeted tools: `8`
- Source queue-smoke proof accepted in committed docs: `false`
- Source service-role queue-smoke authorization accepted in committed docs: `false`
- Source route-bound operator preflight accepted in committed docs: `false`
- Worker dispatch readiness records prepared with provided evidence in committed docs: `0`
- Live worker leases created now: `0`
- Live worker dispatches now: `0`
- Live tool executions now: `0`
- GPU runtime should start now: `false`
- External-beta-ready now: `0`
- Production-ready now: `0`

## Accepted Evidence Path

The gate can report `external_beta_worker_dispatch_readiness_prepared_with_runtime_blocks` only when all of these are supplied:

1. `--external-beta-service-role-queue-smoke-proof-packet`
2. `--external-beta-worker-lease-policy-ref`
3. `--external-beta-worker-dispatch-policy-ref`
4. `--external-beta-worker-idempotency-namespace-ref`
5. `--external-beta-worker-telemetry-ref`
6. `--external-beta-gpu-on-demand-policy-ref`
7. `--external-beta-private-artifact-policy-ref`

The accepted source proof must show 21 queue writes, 21 worker-claim rows, the service-role queue smoke authorization chain accepted with provided evidence for all 21 tools, the route-bound operator preflight accepted with provided evidence for all 21 tools, a private service-role queue smoke authorization ref, the runtime queue service proof bridge accepted with provided evidence for all 21 tools, zero worker dispatches, zero tool executions, zero persisted fixture rows after cleanup, and zero external-beta/production-ready tools.

The source proof must also carry the source gateway runtime-admission map. The current accepted map marks `d3` as `sourceGatewayRuntimeAdmissionMode=cpu_static_first_cohort` and keeps the remaining accepted tools on `all_tools_external_beta`, so dispatch readiness can separate CPU/static first-cohort jobs from GPU/model worker lanes. A smoke proof packet with the runtime queue service proof bridge stripped is rejected before worker dispatch readiness records are accepted with provided evidence.

## GPU Boundary

GPU remains on-demand only. The eight GPU/model tools can be marked `gpuRuntimeStartAllowedForAcceptedExternalBetaJob=true` only after accepted queue-smoke proof and worker dispatch controls are present. Even then, this gate keeps `gpuRuntimeShouldStartNow=false`, `gpuRuntimePerformed=false`, `workerDispatchPerformed=false`, and `toolExecutionPerformed=false`.

This means GPU should not run while nobody is using the tool. GPU starts only later, for an accepted worker job that leases a GPU-targeted tool and has the required runtime proof.

## Runtime Boundary

This readiness gate does not submit backend queues, create worker leases, dispatch workers, execute tools, execute Tool Routes, call providers/models, start browser/WebGL/canvas runtime, start GPU/model runtime, download model weights, process media, mutate Supabase/GCS, create signed URLs, create public artifacts, unlock external beta traffic, or unlock production.

## Next External Beta Gap

Run the external-beta service-role queue smoke in a non-production Supabase project, validate the saved result with `ai-graphics:external-beta-service-role-queue-smoke-proof`, then use this gate to prepare controlled worker lease/dispatch proof. The follow-up proof should create and release leases without executing tools.
