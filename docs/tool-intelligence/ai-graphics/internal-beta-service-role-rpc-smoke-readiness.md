# AI Graphics Internal Beta Service-Role RPC Smoke Readiness

Decision: `ai_graphics_internal_beta_service_role_rpc_smoke_readiness_contract_prepared_live_smoke_blocked`

Status: `service_role_rpc_smoke_harness_prepared_live_smoke_blocked`

This packet prepares the non-production smoke harness for the AI graphics
service-role RPC layer. It does not run the smoke, apply migrations, write
Supabase rows, dispatch workers, or execute tools.

## Source Evidence

- Source queue transaction decision:
  `ai_graphics_internal_beta_service_role_queue_transaction_readiness_contract_prepared_with_no_write_rpc_envelope`
- Source RPC implementation decision:
  `ai_graphics_internal_beta_service_role_rpc_implementation_readiness_contract_prepared_with_static_migration`
- Static migration:
  `supabase/migrations/202606260002_ai_graphics_tool_runtime_service_role_rpcs.sql`
- Backend adapter:
  `server/services/ai-graphics-tool-runtime-queue-service.ts`
- Source packet mode:
  `--internal-beta-service-role-queue-transaction-readiness-packet`
- The source packet must already report
  `service_role_queue_transaction_envelope_prepared_live_writes_blocked` with
  all 21 transaction records ready, exactly eight GPU worker transaction
  records for the heavy/model tools, `gpuRuntimeShouldStartNow=false`, and
  false runtime, beta, and production gates. Static migration apply,
  non-production service-role credentials, fixture IDs, and live smoke
  execution remain separate future-only gates.

## Tools Covered

The smoke harness covers all 21 AI graphics tools:

- `torch_torchvision`
- `transformers`
- `sam2`
- `birefnet`
- `real_esrgan`
- `kornia`
- `rembg`
- `transparent_background`
- `d3`
- `echarts`
- `vega_lite`
- `vega`
- `satori`
- `svgdotjs_svg_js`
- `viz_js`
- `lottie_web`
- `animejs`
- `three_js`
- `pixi_js`
- `konva`
- `babylonjs`

All eight heavy/model tools remain targeted to GPU runtime profiles; none are
retargeted to CPU runtime. GPU startup remains on demand only for future
accepted GPU tool-call jobs and is not started by this readiness packet.

## Capabilities Covered

- `chart_overlay`
- `data_visualization`
- `svg_graphics`
- `diagram_graphics`
- `animation_overlay`
- `canvas_scene`
- `webgl_3d_scene`
- `background_removal`
- `subject_segmentation`
- `upscaling`
- `tensor_image_ops`
- `model_runtime_foundation`

## RPCs Covered

- `enqueue_ai_graphics_tool_runtime_jobs`
- `claim_ai_graphics_tool_runtime_job`
- `record_ai_graphics_worker_event`
- `record_ai_graphics_audit_event`

The dry readiness command validates the backend adapter in mock mode only. The
future live smoke command is prepared but must be run only after the static
migration is applied to a disposable local or staging Supabase database.

The mock adapter also rejects malformed runtime-queue jobs before any RPC call:

- non-canonical tools outside the 21 AI graphics records
- mismatched `productionToolId` aliases
- capability IDs that do not belong to the canonical tool record

## Prepared Commands

Dry readiness:

```bash
npm run --silent ai-graphics:internal-beta-service-role-rpc-smoke-readiness
```

Diagnostics:

```bash
npm run --silent ai-graphics:internal-beta-service-role-rpc-smoke-readiness:diagnostics
```

Future non-production live smoke:

```bash
REEDITPRO_CONFIRM_AI_GRAPHICS_SERVICE_ROLE_RPC_SMOKE=true \
REEDITPRO_AI_GRAPHICS_SERVICE_ROLE_RPC_SMOKE_ENV=local \
npm run --silent ai-graphics:internal-beta-service-role-rpc-smoke-readiness -- \
  --execute-live-smoke \
  --smoke-env local \
  --workspace-id <id> \
  --project-id <id> \
  --approved-plan-snapshot-id <id> \
  --credit-reservation-id <id> \
  --idempotency-key <key>
```

The future smoke command requires `SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY` in a backend-only environment and is blocked in
production.

## Required Fixtures

- `workspace_id`
- `project_id`
- `approved_plan_snapshot_id` with immutable active snapshot status
- `credit_reservation_id` with active/approved status
- `private://` artifact manifest references
- idempotency key namespace for the smoke run

## Runtime Boundary

Allowed now:

- prepare service-role RPC smoke inputs
- validate the backend adapter in mock mode
- document the non-production command and fixture requirements
- keep agent selection at planning/study metadata only

Blocked now:

- production Supabase mutation
- live service-role RPC smoke
- SQL or migration apply
- tool execution
- Tool Route execution
- worker execution
- production worker dispatch
- provider/model execution
- browser/WebGL/canvas runtime
- GPU/model runtime
- model weight download or load
- media processing
- GCS mutation
- signed URL creation
- public artifact creation
- internal beta, external beta, or production unlock

## Counts

- Tools covered: 21
- Product-facing capabilities covered: 12
- RPC smoke cases prepared: 21
- RPC smoke cases ready with provided evidence: 21
- Service-role RPCs covered: 4
- GPU runtime targeted tools: 8
- GPU runtime start allowed for future accepted job tools: 8
- Live service-role RPC smokes now: 0
- Live migration applies now: 0
- Live tool executions now: 0
- Internal beta ready tools now: 0
- External beta ready tools now: 0
- Production ready tools now: 0

## Required Booleans

- `internalBetaServiceRoleRpcSmokeReadinessPrepared`: true
- `sourceServiceRoleQueueTransactionReadinessAccepted`: true
- `sourceServiceRoleRpcImplementationReadinessAccepted`: true
- `all21ToolsCovered`: true
- `all12CapabilitiesCovered`: true
- `all21RpcSmokeCasesPrepared`: true
- `all21RpcSmokeCasesReadyWithProvidedEvidence`: true
- `backendServiceAdapterMockValidated`: true
- `mockAdapterCanonicalRegistryValidation`: true
- `mockAdapterRejectedNonCanonicalTool`: true
- `mockAdapterRejectedProductionToolMismatch`: true
- `mockAdapterRejectedCapabilityMismatch`: true
- `liveSmokeCommandPrepared`: true
- `staticMigrationRequiredBeforeLiveSmoke`: true
- `nonProductionEnvironmentRequired`: true
- `serviceRoleCredentialsRequired`: true
- `approvedSnapshotFixtureRequired`: true
- `creditReservationFixtureRequired`: true
- `privateArtifactManifestOnly`: true
- `gpuHeavyToolsTargetGpuRuntime`: true
- `agentCanSelectForPlanning`: true
- `serviceRoleRpcSmokeApprovedNow`: false
- `serviceRoleRpcMigrationAppliedNow`: false
- `serviceRoleSupabaseWritesApprovedNow`: false
- `agentCanExecuteToolsNow`: false
- `routeExecutionApprovedNow`: false
- `workerExecutionApprovedNow`: false
- `workerQueueApprovedNow`: false
- `backendQueueSubmissionApprovedNow`: false
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
- `backendQueueSubmissionPerformed`: false
- `supabaseMutationPerformed`: false
- `serviceRoleTransactionPerformed`: false
- `serviceRoleRpcSmokePerformed`: false
- `serviceRoleMigrationApplyPerformed`: false
- `productionWorkerDispatchPerformed`: false
- `providerRuntimePerformed`: false
- `browserWebglCanvasRuntimePerformed`: false
- `gpuRuntimePerformed`: false
- `modelWeightsDownloaded`: false
- `modelWeightsLoaded`: false
- `mediaProcessingPerformed`: false
- `gcsUploadPerformed`: false
- `publicArtifactCreated`: false
- `signedUrlCreated`: false

## Next Milestones

1. Apply the static service-role RPC migration only in a disposable local or
   staging Supabase database and capture rollback evidence.
2. Run the prepared service-role RPC smoke command with explicit
   non-production fixture IDs and service-role credentials.
3. Verify enqueue, claim, worker-event, and audit-event readback while keeping
   tool execution disabled.
4. Bind the worker dispatcher to `claim_ai_graphics_tool_runtime_job` only
   after the non-production smoke passes.
