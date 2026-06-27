# AI Graphics Internal Beta Service-Role RPC Adapter Local Smoke Proof

Decision: `ai_graphics_internal_beta_service_role_rpc_adapter_local_smoke_passed_with_cleanup`

Status: `adapter_local_smoke_passed_with_cleanup_no_tool_execution`

This packet proves the backend service adapter path for the AI graphics
service-role RPC queue. The smoke creates local approved-plan and credit
fixtures, calls `server/services/ai-graphics-tool-runtime-queue-service.ts`
through a real local Supabase service-role admin client, submits all 21 AI
graphics job payloads to `enqueue_ai_graphics_tool_runtime_jobs`, claims one job,
records one worker event, records one audit event, and cleans up every prefixed
fixture row. It does not execute tools, workers, Tool Routes, providers/models,
browser/WebGL/canvas runtime, GPU/model runtime, media processing, GCS, signed
URLs, public artifacts, internal beta, external beta, or production.

## Source Evidence

- Source PR: #862 `[tools] AI graphics tool call readiness contract`
- Source decision:
  `ai_graphics_internal_beta_service_role_rpc_local_smoke_passed_with_rollback_fixtures`
- Source packet mode:
  `--internal-beta-service-role-rpc-local-smoke-proof-packet`
- The source packet must already report
  `local_rpc_smoke_passed_with_rollback_fixtures_no_tool_execution`, all 21
  tools represented by readiness evidence, all 12 capabilities represented,
  0 persistent fixture rows after rollback, `gpuRuntimeShouldStartNow=false`,
  and false runtime, beta, and production gates. Adapter smoke execution still
  requires explicit local confirmation and local service-role credentials.
- Source migration:
  `supabase/migrations/202606260002_ai_graphics_tool_runtime_service_role_rpcs.sql`
- Adapter smoke package script:
  `ai-graphics:internal-beta-service-role-rpc-adapter-local-smoke`
- Adapter smoke diagnostic:
  `ai-graphics:internal-beta-service-role-rpc-adapter-local-smoke:diagnostics`
- Adapter smoke command:
  `SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_SERVICE_ROLE_KEY=<local-service-role-jwt> REEDITPRO_CONFIRM_AI_GRAPHICS_RPC_ADAPTER_LOCAL_SMOKE=true REEDITPRO_AI_GRAPHICS_RPC_ADAPTER_LOCAL_SMOKE_ENV=local npm run --silent ai-graphics:internal-beta-service-role-rpc-adapter-local-smoke -- --execute-local-adapter-smoke`

## Local Database Evidence

- Environment: `local`
- Supabase URL: `http://127.0.0.1:54321`
- Service-role key committed: false
- Local service-role JWT generated in process: true
- RPC functions present before adapter smoke: 4
- `approved_plan_snapshot_id` columns present before adapter smoke: 2
- Workspace/project fixture roots available: 4
- PostgREST schema reload notified before adapter smoke: true

## Adapter Smoke Coverage

- Tools submitted to adapter enqueue: 21
- Job IDs returned: 21
- Inserted job count returned: 21
- Worker claims returned: 1
- Worker event returned: true
- Audit event returned: true
- Service-role RPCs exercised:
  - `enqueue_ai_graphics_tool_runtime_jobs`
  - `claim_ai_graphics_tool_runtime_job`
  - `record_ai_graphics_worker_event`
  - `record_ai_graphics_audit_event`
- Approved plan snapshot fixture created: true
- Credit reservation fixture created: true
- Private artifact manifest refs only: true
- GPU-heavy tools target GPU runtime in payloads: true
- GPU runtime start allowed for future accepted job tools: 8
- GPU runtime should start now: false
- Tool execution performed by smoke: false

## Cleanup Evidence

Approved plan snapshots are intentionally immutable once approved or locked, so
adapter-smoke cleanup uses a local-only trigger-bypass transaction scoped to the
`ai-graphics-adapter-local-rpc-smoke:*` prefix. This cleanup is for disposable
local smoke fixtures only; it is not a runtime or production path.

- Cleanup mode: `local_only_trigger_bypass_for_prefixed_smoke_fixtures`
- Cleanup scope: `ai-graphics-adapter-local-rpc-smoke:*`
- Fixture rows persisted after cleanup: 0
- Cleanup verified by independent SQL count: true

## Boolean State

- `internalBetaServiceRoleRpcAdapterLocalSmokeProofCompleted`: true
- `sourceServiceRoleRpcLocalSmokeProofAccepted`: true
- `sourceServiceRoleRpcSmokeReadinessAccepted`: true
- `sourceServiceRoleRpcImplementationReadinessAccepted`: true
- `all21ToolsSubmittedThroughAdapter`: true
- `all12CapabilitiesCoveredBySubmittedPayloads`: true
- `backendServiceAdapterExercised`: true
- `localSupabaseHttpRpcExercised`: true
- `localRpcFunctionsPresent`: true
- `postgrestSchemaReloadNotified`: true
- `localAdapterEnqueuePassed`: true
- `localAdapterClaimPassed`: true
- `localAdapterWorkerEventPassed`: true
- `localAdapterAuditPassed`: true
- `localAdapterCleanupPassed`: true
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

1. Bind a worker dispatcher to `claim_ai_graphics_tool_runtime_job` and prove
   claim-to-worker handoff without executing tools.
2. Run approved tool-specific runtime proofs through workers with private
   artifact manifests.
3. Keep internal beta, external beta, and production blocked until worker
   execution, tool execution, private artifacts, QA, rollback, and owner
   evidence pass.
