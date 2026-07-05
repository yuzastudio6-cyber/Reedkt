# AI Graphics Internal Beta Service-Role RPC Local Smoke Proof

Decision: `ai_graphics_internal_beta_service_role_rpc_local_smoke_passed_with_rollback_fixtures`

Status: `local_rpc_smoke_passed_with_rollback_fixtures_no_tool_execution`

This packet records the first local Supabase smoke proof for the AI graphics
service-role RPC queue path. It applies the corrected local migration, runs one
rollback-only queue fixture through enqueue, claim, worker event, and audit RPCs,
and confirms that no smoke fixture rows persist after rollback. It does not
execute tools, workers, Tool Routes, providers/models, browser/WebGL/canvas
runtime, GPU/model runtime, media processing, GCS, signed URLs, public
artifacts, internal beta, external beta, or production.

## Source Evidence

- Source PR: #862 `[tools] AI graphics tool call readiness contract`
- Source decision:
  `ai_graphics_internal_beta_service_role_rpc_smoke_readiness_contract_prepared_live_smoke_blocked`
- Migration:
  `supabase/migrations/202606260002_ai_graphics_tool_runtime_service_role_rpcs.sql`
- Local smoke package script:
  `ai-graphics:internal-beta-service-role-rpc-local-smoke`
- Local smoke command:
  `REEDITPRO_CONFIRM_AI_GRAPHICS_LOCAL_RPC_SMOKE=true REEDITPRO_AI_GRAPHICS_LOCAL_RPC_SMOKE_ENV=local npm run --silent ai-graphics:internal-beta-service-role-rpc-local-smoke -- --execute-local-smoke`

## Local Database Evidence

- Environment: `local`
- Host: `127.0.0.1`
- Port: `54322`
- Database: `postgres`
- Existing collision observed: migration version `202606260001` was already
  recorded locally as `public_production_edit_session_brief_qwen_gates`.
- Corrected local migration applied:
  `202606260002_ai_graphics_tool_runtime_service_role_rpcs.sql`
- Manual local apply recorded in `supabase_migrations.schema_migrations`: false
- RPC functions present after apply:
  - `claim_ai_graphics_tool_runtime_job`
  - `enqueue_ai_graphics_tool_runtime_jobs`
  - `record_ai_graphics_audit_event`
  - `record_ai_graphics_worker_event`
- Job type enum present after apply: `ai_graphics_tool_runtime`
- `approved_plan_snapshot_id` columns present on `jobs` and `job_batches`: 2
- Workspace/project fixture roots available locally: 4

## Smoke Coverage

- AI graphics tools represented by readiness evidence: 21
- Product-facing capabilities represented by readiness evidence: 12
- Tool exercised by rollback smoke: `d3`
- Service-role RPCs exercised: 4
- Approved plan snapshot fixture created inside rollback: true
- Credit reservation fixture created inside rollback: true
- Private artifact manifest fixture:
  `private://ai-graphics/local-rpc-smoke/d3/manifest.json`
- Tool execution performed by smoke: false

## Smoke Result

- Local schema migrations applied now: 1
- Local rollback fixture transactions performed: 1
- Local job rows inserted then rolled back: 1
- Local worker claim rows inserted then rolled back: 1
- Local worker event rows inserted then rolled back: 3
- Local audit event rows inserted then rolled back: 2
- Persistent smoke fixture rows after rollback: 0
- Tool executions now: 0
- Route executions now: 0
- Worker executions now: 0
- Provider executions now: 0
- Browser/WebGL/canvas runtime executions now: 0
- GPU runtime executions now: 0
- Signed URLs created now: 0
- Public artifacts created now: 0

## Boolean State

- `internalBetaServiceRoleRpcLocalSmokeProofCompleted`: true
- `sourceServiceRoleRpcSmokeReadinessAccepted`: true
- `sourceServiceRoleRpcImplementationReadinessAccepted`: true
- `all21ToolsCoveredByReadinessEvidence`: true
- `all12CapabilitiesCoveredByReadinessEvidence`: true
- `localRpcMigrationApplied`: true
- `localRpcFunctionsPresent`: true
- `localRollbackFixtureSmokePassed`: true
- `localEnqueueRpcSmokePassed`: true
- `localClaimRpcSmokePassed`: true
- `localWorkerEventRpcSmokePassed`: true
- `localAuditRpcSmokePassed`: true
- `localSmokeFixtureRowsRolledBack`: true
- `privateArtifactManifestGuardUsed`: true
- `reservedCreditReservationGuardUsed`: true
- `approvedSnapshotGuardUsed`: true
- `agentCanSelectForPlanning`: true
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

1. Run the guarded service adapter smoke with committed non-production fixtures
   or fixture cleanup evidence.
2. Bind a worker dispatcher to `claim_ai_graphics_tool_runtime_job` and prove
   claim-to-worker handoff without executing tools.
3. Run tool-specific runtime proofs through approved workers with private
   artifact manifests.
4. Keep internal beta, external beta, and production blocked until tool
   execution, worker QA, private artifact handling, rollback, and owner evidence
   pass.
