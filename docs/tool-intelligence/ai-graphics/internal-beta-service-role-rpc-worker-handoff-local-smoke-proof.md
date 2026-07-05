# AI Graphics Internal Beta Service-Role RPC Worker-Handoff Local Smoke Proof

Decision: `ai_graphics_internal_beta_service_role_rpc_worker_handoff_local_smoke_passed_with_cleanup`

Status: `worker_handoff_local_smoke_passed_with_cleanup_no_tool_execution`

This packet proves the next backend boundary after the service-role RPC adapter:
local RPC queue jobs can be claimed, translated into production worker payloads,
and accepted by the mock-safe in-memory production worker dispatcher boundary.
It covers all 21 AI graphics tools and all 12 product-facing capabilities. It
does not execute tools, live workers, Tool Routes, providers/models,
browser/WebGL/canvas runtime, GPU/model runtime, media processing, GCS, signed
URLs, public artifacts, internal beta, external beta, or production.

## Source Evidence

- Source PR: #862 `[tools] AI graphics tool call readiness contract`
- Source decision:
  `ai_graphics_internal_beta_service_role_rpc_adapter_local_smoke_passed_with_cleanup`
- Source adapter proof:
  `docs/tool-intelligence/ai-graphics/internal-beta-service-role-rpc-adapter-local-smoke-proof.json`
- Source evidence policy:
  committed adapter proof or `--internal-beta-service-role-rpc-adapter-local-smoke-proof-packet`.
  The source packet must report adapter cleanup pass, all 21 tools represented,
  all 12 product-facing capabilities represented, exactly 8 future accepted-job
  GPU runtime targets, `gpuRuntimeShouldStartNow=false`, false runtime/beta/
  production gates, and no tool execution. Worker-handoff smoke execution still requires explicit local confirmation and local service-role credentials.
- Source migration:
  `supabase/migrations/202606260002_ai_graphics_tool_runtime_service_role_rpcs.sql`
- Worker-handoff smoke package script:
  `ai-graphics:internal-beta-service-role-rpc-worker-handoff-local-smoke`
- Worker-handoff smoke diagnostic:
  `ai-graphics:internal-beta-service-role-rpc-worker-handoff-local-smoke:diagnostics`
- Worker-handoff smoke command:
  `SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_SERVICE_ROLE_KEY=<local-service-role-jwt> REEDITPRO_CONFIRM_AI_GRAPHICS_RPC_WORKER_HANDOFF_LOCAL_SMOKE=true REEDITPRO_AI_GRAPHICS_RPC_WORKER_HANDOFF_LOCAL_SMOKE_ENV=local npm run --silent ai-graphics:internal-beta-service-role-rpc-worker-handoff-local-smoke -- --execute-local-worker-handoff-smoke`

## Local Database Evidence

- Environment: `local`
- Supabase URL: `http://127.0.0.1:54321`
- Service-role key committed: false
- Local service-role JWT generated in process: true
- RPC functions present before worker-handoff smoke: 4
- `approved_plan_snapshot_id` columns present before worker-handoff smoke: 2
- Workspace/project fixture roots available: 4
- PostgREST schema reload notified before worker-handoff smoke: true

## Worker-Handoff Smoke Coverage

- Tools submitted to adapter enqueue: 21
- Job IDs returned: 21
- Inserted job count returned: 21
- RPC worker claims returned: 21
- Worker-boundary handoff probes completed: 21
- Worker events returned: 21
- Audit event returned: true
- GPU handoff tools: 8
- Render handoff tools: 11
- CPU analysis handoff tools: 2
- Service-role RPCs exercised:
  - `enqueue_ai_graphics_tool_runtime_jobs`
  - `claim_ai_graphics_tool_runtime_job`
  - `record_ai_graphics_worker_event`
  - `record_ai_graphics_audit_event`
- Backend service adapter exercised:
  `server/services/ai-graphics-tool-runtime-queue-service.ts`
- Production worker dispatcher boundary exercised:
  `server/workers/production/production-worker-dispatcher.ts`
- Worker idempotency key builder exercised:
  `server/workers/production/production-worker-idempotency.ts`
- Approved plan snapshot fixture created: true
- Credit reservation fixture created: true
- Private artifact manifest refs only: true
- GPU-heavy tools target GPU runtime in worker payloads: true
- GPU runtime start allowed for accepted-job tools: 8
- GPU runtime should start now: false
- Tool execution performed by smoke: false
- Live production worker dispatch performed: false

## Dispatcher Boundary Evidence

- Execution mode: `mock_safe`
- Worker boundary dispatcher mode: `mock_safe_in_memory_only`
- Dispatcher jobs completed: 21
- Dispatcher hard gate blocks: 0
- Dispatcher routes mock-only: true
- In-memory dispatcher lease records created: 21
- In-memory dispatcher lease records released: 21
- Dispatcher tool-run results created: 0
- Dispatcher artifact records created: 0
- Dispatcher quality gate results created: 0
- Production worker dispatch approved now: false
- Production worker dispatch performed: false

## Cleanup Evidence

Approved plan snapshots are intentionally immutable once approved or locked, so
worker-handoff local-smoke cleanup uses a local-only trigger-bypass transaction
scoped to the `ai-graphics-rpc-worker-handoff-local-smoke:*` prefix and the
returned local job IDs. This cleanup is for disposable local smoke fixtures
only; it is not a runtime or production path.

- Cleanup mode: `local_only_trigger_bypass_for_prefixed_worker_handoff_smoke_fixtures`
- Cleanup scope: `ai-graphics-rpc-worker-handoff-local-smoke:*`
- Audit events included in cleanup: true
- Job events included in cleanup: true
- Fixture rows persisted after cleanup: 0
- Cleanup verified by independent SQL count: true

## Boolean State

- `internalBetaServiceRoleRpcWorkerHandoffLocalSmokeProofCompleted`: true
- `sourceServiceRoleRpcAdapterLocalSmokeProofAccepted`: true
- `sourceServiceRoleRpcLocalSmokeProofAccepted`: true
- `sourceServiceRoleRpcSmokeReadinessAccepted`: true
- `sourceServiceRoleRpcImplementationReadinessAccepted`: true
- `all21ToolsClaimedThroughServiceRoleRpc`: true
- `all21ToolsMappedToWorkerBoundaryPayloads`: true
- `all21WorkerBoundaryHandoffProbesCompleted`: true
- `all12CapabilitiesCoveredByWorkerBoundaryPayloads`: true
- `backendServiceAdapterExercised`: true
- `localSupabaseHttpRpcExercised`: true
- `productionWorkerDispatcherBoundaryExercised`: true
- `workerIdempotencyKeysBuiltFromPayloads`: true
- `localRpcFunctionsPresent`: true
- `postgrestSchemaReloadNotified`: true
- `localAdapterEnqueuePassed`: true
- `localRpcClaimPassedForAll21Tools`: true
- `mockSafeWorkerBoundaryProbePassedForAll21Tools`: true
- `localWorkerEventPassedForAll21Tools`: true
- `localAuditPassed`: true
- `localWorkerHandoffCleanupPassed`: true
- `privateArtifactManifestGuardUsed`: true
- `reservedCreditReservationGuardUsed`: true
- `approvedSnapshotGuardUsed`: true
- `gpuHeavyToolsTargetGpuRuntime`: true
- `agentCanSelectForPlanning`: true
- `serviceRoleKeyCommitted`: false
- `persistentSmokeFixtureRowsCreated`: false
- `agentCanExecuteToolsNow`: false
- `routeExecutionApprovedNow`: false
- `workerExecutionApprovedNow`: false
- `workerQueueApprovedNow`: false
- `liveProductionWorkerDispatchApprovedNow`: false
- `toolExecutionApprovedNow`: false
- `providerRuntimeApprovedNow`: false
- `browserWebglCanvasRuntimeApprovedNow`: false
- `gpuRuntimeApprovedNow`: false
- `gpuRuntimeShouldStartNow`: false
- `runtimeReadyNow`: false
- `internalBetaReadyNow`: false
- `externalBetaReadyNow`: false
- `productionReadyNow`: false
- `dependencyInstallPerformed`: false
- `packageLockMutationPerformed`: false
- `toolExecutionPerformed`: false
- `workerExecutionPerformed`: false
- `routeExecutionPerformed`: false
- `liveProductionWorkerDispatchPerformed`: false
- `providerRuntimePerformed`: false
- `browserWebglCanvasRuntimePerformed`: false
- `gpuRuntimePerformed`: false
- `modelWeightsDownloaded`: false
- `modelWeightsLoaded`: false
- `mediaProcessingPerformed`: false
- `gcsUploadPerformed`: false
- `publicArtifactCreated`: false
- `signedUrlCreated`: false

## Remaining Blocks

1. Run approved tool-specific runtime proofs through the worker boundary with
   private artifact manifests.
2. Approve a real worker queue transport and live worker lease policy per
   environment.
3. Keep internal beta, external beta, and production blocked until worker
   execution, tool execution, private artifacts, QA, rollback, and owner evidence
   pass.
