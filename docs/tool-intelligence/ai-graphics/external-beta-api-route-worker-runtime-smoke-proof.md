# AI Graphics External-Beta API Route Worker Runtime Smoke Proof

Decision: `ai_graphics_external_beta_api_route_worker_runtime_smoke_proof_prepared_with_runtime_blocks`

This packet validates a saved private non-production worker-runtime smoke result. It accepts one authorized worker-runtime smoke result only when the saved evidence matches the worker-runtime smoke authorization candidate and proves the worker lease lifecycle, worker dispatch, private sandbox, telemetry, QA, cost, rollback, and cleanup boundaries.

The validator itself does not run the smoke. It does not create worker leases, dispatch workers, execute tools, write private artifacts, execute Tool Routes, start browser/WebGL/canvas runtime, start GPU runtime, call providers/models, mutate Supabase/GCS, create signed URLs, create public artifacts, unlock external beta traffic, or unlock production.

## Accepted Saved Evidence

- One private non-production worker-runtime smoke result.
- One worker lease created and released.
- One worker dispatch.
- Zero tool executions.
- Zero private artifact writes.
- Zero route executions.
- Zero provider/model executions.
- For CPU/static tools, no GPU startup.
- For GPU/model tools, GPU startup only for the accepted job, followed by GPU release and idle-after-cleanup evidence.
- Private artifact sandbox, telemetry, QA, cost, rollback, and secret-redaction evidence.

## Runtime Blocks By Validator

- Running the worker-runtime smoke
- Creating worker leases
- Dispatching workers
- Executing tools
- Writing private artifacts
- Executing Tool Routes
- Calling providers/models
- Starting browser/WebGL/canvas runtime
- Starting GPU runtime by this validator
- Downloading or loading model weights
- Media processing
- Supabase/GCS mutation
- Signed URL creation
- Public artifact creation
- External beta traffic enablement
- Production unlock

## Booleans

- `agentCanSelectForPlanning=true`
- `agentCanExecuteToolsNow=false`
- `workerRuntimeSmokeProofAcceptedWithProvidedEvidence=true`
- `workerRuntimeSmokeExecutedByValidator=false`
- `workerLeaseCreatedByValidator=false`
- `workerDispatchPerformedByValidator=false`
- `toolExecutionPerformed=false`
- `privateArtifactWritePerformed=false`
- `gpuRuntimePerformedByValidator=false`
- `gpuRuntimeShouldStartNow=false`
- `runtimeReadyNow=false`
- `externalBetaReadyNow=false`
- `productionReadyNow=false`

Next gap: bind accepted worker-runtime smoke proof to a per-tool callable result gate. Tool execution still requires explicit private non-production execution proof, QA, rollback, cost, artifact, and owner go/no-go before external beta traffic.
