# AI Graphics Internal Beta Service-Role RPC Implementation Readiness

Decision: `ai_graphics_internal_beta_service_role_rpc_implementation_readiness_contract_prepared_with_static_migration`

Status: `static_service_role_rpc_migration_prepared_not_applied`

This packet converts the all-21 AI graphics service-role queue transaction envelope into a static database/backend implementation contract. It adds a reviewed Supabase migration file and backend service adapter, but it does not apply SQL, write Supabase rows, claim workers, dispatch workers, execute tools, create signed URLs, create public artifacts, unlock internal beta, unlock external beta, or unlock production.

## Source Evidence

- Source PR: #862 `[tools] AI graphics tool call readiness contract`
- Source decision: `ai_graphics_internal_beta_service_role_queue_transaction_readiness_contract_prepared_with_no_write_rpc_envelope`
- Source branch: `codex/rp-ai-graphics-tool-call-readiness-contract`

## Files

- Migration: `supabase/migrations/202606260002_ai_graphics_tool_runtime_service_role_rpcs.sql`
- Backend service adapter: `server/services/ai-graphics-tool-runtime-queue-service.ts`
- Diagnostic: `scripts/validation/ai-graphics-internal-beta-service-role-rpc-implementation-readiness-diagnostics.mjs`

## Migration Version Collision Avoidance

- Migration version: `202606260002`
- Renumbered from: `202606260001`
- Local preflight observed `202606260001` already recorded as `public_production_edit_session_brief_qwen_gates`.
- Local preflight found the four AI graphics service-role RPC functions absent before apply.
- Decision: keep the AI graphics RPC migration on a fresh version before any local or staging apply, so the install path cannot be skipped by a prior `202606260001` record.

## Tools Covered

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

## Prepared Database Contract

- Adds `ai_graphics_tool_runtime` to `public.job_type`.
- Adds `approved_plan_snapshot_id` to `public.job_batches`.
- Adds `approved_plan_snapshot_id` to `public.jobs`.
- Adds indexes for both approved snapshot columns.
- Defines `enqueue_ai_graphics_tool_runtime_jobs`.
- Defines `claim_ai_graphics_tool_runtime_job`.
- Defines `record_ai_graphics_worker_event`.
- Defines `record_ai_graphics_audit_event`.
- Revokes function execution from `public`, `anon`, and `authenticated`.
- Grants function execution only to `service_role`.

## Runtime Guards

- Enqueue requires immutable approved plan snapshot evidence.
- Enqueue requires reserved or partially spent credit reservation evidence.
- Enqueue requires `private://` artifact manifest references.
- Signed URLs, public URLs, raw GCS URLs, service-role secrets, provider keys, and authorization payloads are blocked from RPC metadata.
- Worker claim requires a queued `ai_graphics_tool_runtime` job with approved snapshot and credit reservation references.
- Worker event and audit helpers append sanitized metadata only.

## Backend Adapter

`server/services/ai-graphics-tool-runtime-queue-service.ts` provides:

- `enqueueToolRuntimeJobs`
- `claimToolRuntimeJob`
- `recordWorkerEvent`
- `recordAuditEvent`

In mock mode or without an admin client, each method returns mock-safe records and warnings. In live backend mode, each method calls the service-role RPC contract. The adapter does not execute tools by itself.

## Counts

- AI graphics tools covered: 21
- Product-facing capabilities covered: 12
- Service-role RPCs prepared: 4
- Static migration files prepared: 1
- Backend service adapters prepared: 1
- Live migration applies now: 0
- Live service-role transactions now: 0
- Live job rows inserted now: 0
- Live worker claim rows inserted now: 0
- Live tool executions now: 0
- Internal beta ready tools now: 0
- External beta ready tools now: 0
- Production ready tools now: 0

## Boolean State

- `internalBetaServiceRoleRpcImplementationReadinessPrepared`: true
- `sourceServiceRoleQueueTransactionReadinessAccepted`: true
- `all21ToolsCovered`: true
- `all12CapabilitiesCovered`: true
- `aiGraphicsJobTypeEnumPrepared`: true
- `approvedSnapshotColumnsPrepared`: true
- `serviceRoleRpcMigrationPrepared`: true
- `backendServiceAdapterPrepared`: true
- `serviceRoleOnlyExecuteGrantsPrepared`: true
- `approvedSnapshotCreditReservationGuardsPrepared`: true
- `privateArtifactManifestGuardPrepared`: true
- `gpuHeavyToolsTargetGpuRuntime`: true
- `agentCanSelectForPlanning`: true
- `serviceRoleRpcMigrationAppliedNow`: false
- `serviceRoleQueueTransactionApprovedNow`: false
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

1. Run the migration against a disposable local/staging Supabase database with rollback evidence.
2. Run a private queue-write smoke using service-role credentials in non-production only.
3. Bind worker dispatch to `claim_ai_graphics_tool_runtime_job` before any AI graphics tool execution.
4. Keep external beta and production blocked until live queue writes, worker claims, tool execution, private artifacts, QA, and rollback evidence are owner-approved.
