# AI Graphics External-Beta Local Queue Storage

Decision: `ai_graphics_external_beta_local_queue_storage_mock_write_prepared_with_runtime_blocks`

This contract bridges the external-beta service-role queue transaction envelope into ReeditPro's existing `createJobService` boundary in forced mock mode. It proves that prepared `ai_graphics_tool_runtime` jobs can be shaped into backend job-service records without Supabase writes, worker claims, worker leases, dispatch, tool execution, or GPU startup.

## Current Result

- Tools covered: `21`
- Product-facing capabilities covered: `12`
- GPU runtime targeted tools: `8`
- All-tool local queue records ready with provided evidence in diagnostics: `21`
- GPU runtime start allowed for accepted external-beta job tools: `8`
- Local mock job batch records created in diagnostics: `21`
- Local mock job records created in diagnostics: `21`
- Live Supabase job writes now: `0`
- Live worker claim rows now: `0`
- Live worker leases created now: `0`
- Live worker dispatches now: `0`
- Live tool executions now: `0`
- GPU runtime should start now: `0`
- External-beta-ready now: `0`
- Production-ready now: `0`

## Queue Storage Rule

An external-beta service-role transaction envelope can become a local queue storage record with provided evidence only when:

1. The source external-beta service-role queue transaction packet is accepted.
2. A local queue storage ref, mock job service ref, schema ref, and isolation ref are present.
3. The existing `createJobService` boundary creates mock-only job batch and job records.
4. The job type remains `ai_graphics_tool_runtime`.
5. The job carries approved snapshot, credit reservation, private artifact manifest, worker type, runtime target, and source transaction metadata.

## GPU Boundary

GPU remains on-demand only. The eight GPU/model tools can carry `gpuRuntimeStartAllowedForAcceptedExternalBetaJob=true` for future accepted jobs, but `gpuRuntimeShouldStartNow=false`, `gpuRuntimePerformed=false`, `workerLeaseCreated=false`, and `workerDispatchPerformed=false` remain enforced. If no worker claim and dispatch occurs, no GPU runtime should be running.

## Runtime Boundary

This bridge creates mock-only local job-service records in diagnostics. It does not run service-role transactions, insert Supabase rows, create worker claims, create worker leases, dispatch workers, execute tools, start GPU runtime, call providers, create signed URLs, create public artifacts, process media, mutate Supabase/GCS, unlock external beta traffic, or unlock production.
