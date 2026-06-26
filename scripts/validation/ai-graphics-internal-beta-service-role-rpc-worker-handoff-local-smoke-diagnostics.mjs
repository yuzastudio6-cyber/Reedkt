import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const runScriptName = 'ai-graphics:internal-beta-service-role-rpc-worker-handoff-local-smoke'
const runScriptCommand =
  'tsx server/cli/ai-graphics-internal-beta-service-role-rpc-worker-handoff-local-smoke.ts'
const diagnosticScriptName =
  'ai-graphics:internal-beta-service-role-rpc-worker-handoff-local-smoke:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-internal-beta-service-role-rpc-worker-handoff-local-smoke-diagnostics.mjs'

const docsJsonFile =
  'docs/tool-intelligence/ai-graphics/internal-beta-service-role-rpc-worker-handoff-local-smoke-proof.json'
const docsMdFile =
  'docs/tool-intelligence/ai-graphics/internal-beta-service-role-rpc-worker-handoff-local-smoke-proof.md'
const sourceAdapterDocsFile =
  'docs/tool-intelligence/ai-graphics/internal-beta-service-role-rpc-adapter-local-smoke-proof.json'
const sourceLocalSmokeDocsFile =
  'docs/tool-intelligence/ai-graphics/internal-beta-service-role-rpc-local-smoke-proof.json'
const sourceSmokeReadinessDocsFile =
  'docs/tool-intelligence/ai-graphics/internal-beta-service-role-rpc-smoke-readiness.json'
const sourceImplementationDocsFile =
  'docs/tool-intelligence/ai-graphics/internal-beta-service-role-rpc-implementation-readiness.json'
const runScriptFile =
  'server/cli/ai-graphics-internal-beta-service-role-rpc-worker-handoff-local-smoke.ts'
const serviceFile = 'server/services/ai-graphics-tool-runtime-queue-service.ts'
const dispatcherFile = 'server/workers/production/production-worker-dispatcher.ts'
const idempotencyFile = 'server/workers/production/production-worker-idempotency.ts'

const requiredRpcs = [
  'enqueue_ai_graphics_tool_runtime_jobs',
  'claim_ai_graphics_tool_runtime_job',
  'record_ai_graphics_worker_event',
  'record_ai_graphics_audit_event',
]

const trueBooleans = [
  'internalBetaServiceRoleRpcWorkerHandoffLocalSmokeProofCompleted',
  'sourceServiceRoleRpcAdapterLocalSmokeProofAccepted',
  'sourceServiceRoleRpcLocalSmokeProofAccepted',
  'sourceServiceRoleRpcSmokeReadinessAccepted',
  'sourceServiceRoleRpcImplementationReadinessAccepted',
  'all21ToolsClaimedThroughServiceRoleRpc',
  'all21ToolsMappedToWorkerBoundaryPayloads',
  'all21WorkerBoundaryHandoffProbesCompleted',
  'all12CapabilitiesCoveredByWorkerBoundaryPayloads',
  'backendServiceAdapterExercised',
  'localSupabaseHttpRpcExercised',
  'productionWorkerDispatcherBoundaryExercised',
  'workerIdempotencyKeysBuiltFromPayloads',
  'localRpcFunctionsPresent',
  'postgrestSchemaReloadNotified',
  'localAdapterEnqueuePassed',
  'localRpcClaimPassedForAll21Tools',
  'mockSafeWorkerBoundaryProbePassedForAll21Tools',
  'localWorkerEventPassedForAll21Tools',
  'localAuditPassed',
  'localWorkerHandoffCleanupPassed',
  'privateArtifactManifestGuardUsed',
  'reservedCreditReservationGuardUsed',
  'approvedSnapshotGuardUsed',
  'gpuHeavyToolsTargetGpuRuntime',
  'agentCanSelectForPlanning',
]

const falseBooleans = [
  'serviceRoleKeyCommitted',
  'persistentSmokeFixtureRowsCreated',
  'agentCanExecuteToolsNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'workerQueueApprovedNow',
  'liveProductionWorkerDispatchApprovedNow',
  'toolExecutionApprovedNow',
  'providerRuntimeApprovedNow',
  'browserWebglCanvasRuntimeApprovedNow',
  'gpuRuntimeApprovedNow',
  'runtimeReadyNow',
  'internalBetaReadyNow',
  'externalBetaReadyNow',
  'productionReadyNow',
  'dependencyInstallPerformed',
  'packageLockMutationPerformed',
  'toolExecutionPerformed',
  'workerExecutionPerformed',
  'routeExecutionPerformed',
  'liveProductionWorkerDispatchPerformed',
  'providerRuntimePerformed',
  'browserWebglCanvasRuntimePerformed',
  'gpuRuntimePerformed',
  'modelWeightsDownloaded',
  'modelWeightsLoaded',
  'mediaProcessingPerformed',
  'gcsUploadPerformed',
  'publicArtifactCreated',
  'signedUrlCreated',
]

const failures = []

function fail(message) {
  failures.push(message)
}

function read(filePath) {
  if (!fs.existsSync(filePath)) {
    fail(`missing_file:${filePath}`)
    return ''
  }
  return fs.readFileSync(filePath, 'utf8')
}

function json(filePath) {
  try {
    return JSON.parse(read(filePath))
  } catch (error) {
    fail(`invalid_json:${filePath}:${error.message}`)
    return {}
  }
}

function git(args) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
    maxBuffer: 64 * 1024 * 1024,
  }).trim()
}

function runNpm(scriptName, args = []) {
  return execFileSync('npm', ['run', '--silent', scriptName, '--', ...args], {
    encoding: 'utf8',
    env: {
      ...process.env,
      REEDITPRO_CONFIRM_AI_GRAPHICS_RPC_WORKER_HANDOFF_LOCAL_SMOKE: '',
    },
    maxBuffer: 64 * 1024 * 1024,
  }).trim()
}

for (const file of [
  docsJsonFile,
  docsMdFile,
  sourceAdapterDocsFile,
  sourceLocalSmokeDocsFile,
  sourceSmokeReadinessDocsFile,
  sourceImplementationDocsFile,
  runScriptFile,
  serviceFile,
  dispatcherFile,
  idempotencyFile,
  'package.json',
  'docs/production-beta-readiness-scorecard.md',
]) {
  read(file)
}

const pkg = json('package.json')
const docs = json(docsJsonFile)
const sourceAdapterDocs = json(sourceAdapterDocsFile)
const sourceLocalSmokeDocs = json(sourceLocalSmokeDocsFile)
const sourceSmokeReadinessDocs = json(sourceSmokeReadinessDocsFile)
const sourceImplementationDocs = json(sourceImplementationDocsFile)
const markdown = read(docsMdFile)
const runScript = read(runScriptFile)
const service = read(serviceFile)
const dispatcher = read(dispatcherFile)
const idempotency = read(idempotencyFile)
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (pkg.scripts?.[runScriptName] !== runScriptCommand) fail(`missing_package_script:${runScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail(`missing_package_script:${diagnosticScriptName}`)
}

if (docs.decision !== 'ai_graphics_internal_beta_service_role_rpc_worker_handoff_local_smoke_passed_with_cleanup') {
  fail(`unexpected_decision:${docs.decision}`)
}
if (docs.status !== 'worker_handoff_local_smoke_passed_with_cleanup_no_tool_execution') {
  fail(`unexpected_status:${docs.status}`)
}
if (sourceAdapterDocs.decision !== 'ai_graphics_internal_beta_service_role_rpc_adapter_local_smoke_passed_with_cleanup') {
  fail(`unexpected_source_adapter_decision:${sourceAdapterDocs.decision}`)
}
if (sourceLocalSmokeDocs.decision !== 'ai_graphics_internal_beta_service_role_rpc_local_smoke_passed_with_rollback_fixtures') {
  fail(`unexpected_source_local_smoke_decision:${sourceLocalSmokeDocs.decision}`)
}
if (sourceSmokeReadinessDocs.decision !== 'ai_graphics_internal_beta_service_role_rpc_smoke_readiness_contract_prepared_live_smoke_blocked') {
  fail(`unexpected_source_smoke_readiness_decision:${sourceSmokeReadinessDocs.decision}`)
}
if (
  sourceImplementationDocs.decision !==
  'ai_graphics_internal_beta_service_role_rpc_implementation_readiness_contract_prepared_with_static_migration'
) {
  fail(`unexpected_source_implementation_decision:${sourceImplementationDocs.decision}`)
}

for (const rpc of requiredRpcs) {
  if (!docs.workerHandoffSmokeCoverage?.serviceRoleRpcsExercised?.includes(rpc)) fail(`docs_missing_rpc:${rpc}`)
  if (!runScript.includes(rpc)) fail(`run_script_missing_rpc:${rpc}`)
  if (!service.includes(rpc)) fail(`service_missing_rpc:${rpc}`)
}

for (const token of [
  'createAiGraphicsToolRuntimeQueueService',
  'dispatchProductionWorkerJob',
  'buildWorkerIdempotencyKey',
  'createProductionWorkerRuntimeState',
  'buildAiGraphicsServiceRoleRpcSmokeJobs',
  'REEDITPRO_CONFIRM_AI_GRAPHICS_RPC_WORKER_HANDOFF_LOCAL_SMOKE',
  '--execute-local-worker-handoff-smoke',
  'AI graphics RPC worker-handoff local smoke is blocked in production.',
  "smokeEnv !== 'local'",
  "notify pgrst, 'reload schema'",
  'set local session_replication_role = replica',
  'mock_safe',
  'workerBoundaryHandoffProbesCompleted',
  'liveProductionWorkerDispatchPerformed: false',
  'fixtureRowsPersistedAfterCleanup',
]) {
  if (!runScript.includes(token)) fail(`run_script_missing_token:${token}`)
}

for (const token of [
  'dispatchProductionWorkerJob',
  'job_claimed',
  'step_completed',
  'mock-safe dispatcher',
]) {
  if (!dispatcher.toLowerCase().includes(token.toLowerCase())) fail(`dispatcher_missing_token:${token}`)
}
if (!idempotency.includes('buildWorkerIdempotencyKey')) fail('idempotency_builder_missing')

if (docs.localDatabaseEvidence?.serviceRoleKeyCommitted !== false) fail('docs_service_role_key_committed_not_false')
if (docs.localDatabaseEvidence?.localServiceRoleJwtGeneratedInProcess !== true) {
  fail('docs_local_service_role_jwt_not_generated_in_process')
}
if (docs.localDatabaseEvidence?.rpcFunctionsPresentBeforeWorkerHandoffSmoke !== 4) {
  fail(`docs_rpc_presence:${docs.localDatabaseEvidence?.rpcFunctionsPresentBeforeWorkerHandoffSmoke}`)
}
if (docs.localDatabaseEvidence?.approvedPlanSnapshotColumnsPresentBeforeWorkerHandoffSmoke !== 2) {
  fail(`docs_snapshot_columns:${docs.localDatabaseEvidence?.approvedPlanSnapshotColumnsPresentBeforeWorkerHandoffSmoke}`)
}
if (docs.localDatabaseEvidence?.postgrestSchemaReloadNotified !== true) fail('docs_postgrest_reload_not_notified')

const coverage = docs.workerHandoffSmokeCoverage ?? {}
if (coverage.toolsSubmittedToAdapterEnqueue !== 21) fail(`docs_tools_submitted:${coverage.toolsSubmittedToAdapterEnqueue}`)
if (coverage.jobsInsertedThenCleanedUp !== 21) fail(`docs_jobs_inserted_cleaned:${coverage.jobsInsertedThenCleanedUp}`)
if (coverage.jobIdsReturned !== 21) fail(`docs_job_ids:${coverage.jobIdsReturned}`)
if (coverage.rpcWorkerClaimsInsertedThenCleanedUp !== 21) fail(`docs_claims:${coverage.rpcWorkerClaimsInsertedThenCleanedUp}`)
if (coverage.workerBoundaryHandoffProbesCompleted !== 21) {
  fail(`docs_handoff_probes:${coverage.workerBoundaryHandoffProbesCompleted}`)
}
if (coverage.workerEventsInsertedThenCleanedUp !== 21) fail(`docs_worker_events:${coverage.workerEventsInsertedThenCleanedUp}`)
if (coverage.auditEventInsertedThenCleanedUp !== true) fail('docs_audit_event_not_cleaned')
if (coverage.backendServiceAdapterExercised !== serviceFile) fail(`docs_service_adapter:${coverage.backendServiceAdapterExercised}`)
if (coverage.productionWorkerDispatcherBoundaryExercised !== dispatcherFile) {
  fail(`docs_dispatcher:${coverage.productionWorkerDispatcherBoundaryExercised}`)
}
if (coverage.workerIdempotencyKeyBuilderExercised !== idempotencyFile) {
  fail(`docs_idempotency:${coverage.workerIdempotencyKeyBuilderExercised}`)
}
if (coverage.gpuHandoffTools !== 8) fail(`docs_gpu_handoff_tools:${coverage.gpuHandoffTools}`)
if (coverage.renderHandoffTools !== 11) fail(`docs_render_handoff_tools:${coverage.renderHandoffTools}`)
if (coverage.cpuAnalysisHandoffTools !== 2) fail(`docs_cpu_handoff_tools:${coverage.cpuAnalysisHandoffTools}`)
if (coverage.liveProductionWorkerDispatchPerformed !== false) fail('docs_live_dispatch_not_false')
if (coverage.workerExecutionPerformedBySmoke !== false) fail('docs_worker_execution_by_smoke_not_false')
if (coverage.toolExecutionPerformedBySmoke !== false) fail('docs_tool_execution_by_smoke_not_false')

const dispatcherEvidence = docs.dispatcherBoundaryEvidence ?? {}
if (dispatcherEvidence.executionMode !== 'mock_safe') fail(`docs_execution_mode:${dispatcherEvidence.executionMode}`)
if (dispatcherEvidence.workerBoundaryDispatcherMode !== 'mock_safe_in_memory_only') {
  fail(`docs_dispatcher_mode:${dispatcherEvidence.workerBoundaryDispatcherMode}`)
}
if (dispatcherEvidence.dispatcherJobsCompleted !== 21) fail(`docs_dispatcher_jobs:${dispatcherEvidence.dispatcherJobsCompleted}`)
if (dispatcherEvidence.dispatcherHardGateBlocks !== 0) fail(`docs_hard_gate_blocks:${dispatcherEvidence.dispatcherHardGateBlocks}`)
if (dispatcherEvidence.dispatcherRoutesMockOnly !== true) fail('docs_dispatcher_routes_not_mock_only')
if (dispatcherEvidence.inMemoryDispatcherLeaseRecordsCreated !== 21) {
  fail(`docs_leases_created:${dispatcherEvidence.inMemoryDispatcherLeaseRecordsCreated}`)
}
if (dispatcherEvidence.inMemoryDispatcherLeaseRecordsReleased !== 21) {
  fail(`docs_leases_released:${dispatcherEvidence.inMemoryDispatcherLeaseRecordsReleased}`)
}
for (const key of [
  'dispatcherToolRunResultsCreated',
  'dispatcherArtifactRecordsCreated',
  'dispatcherQualityGateResultsCreated',
]) {
  if (dispatcherEvidence[key] !== 0) fail(`docs_dispatcher_count_not_zero:${key}:${dispatcherEvidence[key]}`)
}
if (dispatcherEvidence.productionWorkerDispatchApprovedNow !== false) {
  fail('docs_production_worker_dispatch_approved_not_false')
}
if (dispatcherEvidence.productionWorkerDispatchPerformed !== false) {
  fail('docs_production_worker_dispatch_performed_not_false')
}

if (docs.cleanupEvidence?.cleanupRequiredBecauseApprovedSnapshotsAreImmutable !== true) {
  fail('docs_cleanup_immutability_missing')
}
if (docs.cleanupEvidence?.cleanupMode !== 'local_only_trigger_bypass_for_prefixed_worker_handoff_smoke_fixtures') {
  fail(`docs_cleanup_mode:${docs.cleanupEvidence?.cleanupMode}`)
}
if (docs.cleanupEvidence?.auditEventsIncludedInCleanup !== true) fail('docs_audit_cleanup_not_true')
if (docs.cleanupEvidence?.jobEventsIncludedInCleanup !== true) fail('docs_job_event_cleanup_not_true')
if (docs.cleanupEvidence?.fixtureRowsPersistedAfterCleanup !== 0) {
  fail(`docs_fixture_rows_after_cleanup:${docs.cleanupEvidence?.fixtureRowsPersistedAfterCleanup}`)
}

if (docs.counts?.totalAiGraphicsTools !== 21) fail(`docs_total_tools:${docs.counts?.totalAiGraphicsTools}`)
if (docs.counts?.totalProductFacingCapabilities !== 12) {
  fail(`docs_total_capabilities:${docs.counts?.totalProductFacingCapabilities}`)
}
for (const [key, expected] of Object.entries({
  serviceRoleRpcsExercised: 4,
  adapterEnqueueJobPayloadsSubmitted: 21,
  adapterEnqueueJobIdsReturned: 21,
  adapterInsertedJobCount: 21,
  rpcWorkerClaimsReturned: 21,
  workerBoundaryHandoffProbesCompleted: 21,
  workerEventsReturned: 21,
  auditEventsReturned: 1,
  inMemoryDispatcherLeaseRecordsCreated: 21,
  inMemoryDispatcherLeaseRecordsReleased: 21,
  fixtureRowsPersistedAfterCleanup: 0,
})) {
  if (docs.counts?.[key] !== expected) fail(`docs_count:${key}:${docs.counts?.[key]}`)
}
for (const countKey of [
  'toolExecutionsNow',
  'routeExecutionsNow',
  'workerExecutionsNow',
  'liveProductionWorkerDispatchesNow',
  'providerExecutionsNow',
  'browserWebglCanvasRuntimeExecutionsNow',
  'gpuRuntimeExecutionsNow',
  'signedUrlsCreatedNow',
  'publicArtifactsCreatedNow',
  'internalBetaReadyNowTools',
  'externalBetaReadyNowTools',
  'productionReadyNowTools',
]) {
  if (docs.counts?.[countKey] !== 0) fail(`docs_count_not_zero:${countKey}:${docs.counts?.[countKey]}`)
}

for (const key of trueBooleans) {
  if (docs.booleans?.[key] !== true) fail(`required_true_boolean_not_true:${key}`)
}
for (const key of falseBooleans) {
  if (docs.booleans?.[key] !== false) fail(`required_false_boolean_not_false:${key}:${docs.booleans?.[key]}`)
}

for (const phrase of [
  'ai_graphics_internal_beta_service_role_rpc_worker_handoff_local_smoke_passed_with_cleanup',
  '`ai-graphics:internal-beta-service-role-rpc-worker-handoff-local-smoke`',
  'RPC worker claims returned: 21',
  'Worker-boundary handoff probes completed: 21',
  'Dispatcher hard gate blocks: 0',
  'Fixture rows persisted after cleanup: 0',
  'Tool execution performed by smoke: false',
  'Live production worker dispatch performed: false',
]) {
  if (!markdown.includes(phrase)) fail(`markdown_missing:${phrase}`)
}
if (!scorecard.includes(docs.decision)) fail('scorecard_missing_worker_handoff_decision')

const preparedOutput = JSON.parse(runNpm(runScriptName))
if (preparedOutput.status !== 'worker_handoff_local_smoke_prepared_not_executed') {
  fail(`prepared_output_status:${preparedOutput.status}`)
}
if (preparedOutput.workerHandoffLocalSmokeExecutedNow !== false) {
  fail('prepared_output_executed_not_false')
}
if (preparedOutput.toolsCoveredByWorkerHandoff !== 21) {
  fail(`prepared_output_tools:${preparedOutput.toolsCoveredByWorkerHandoff}`)
}
if (preparedOutput.liveProductionWorkerDispatchPerformed !== false) {
  fail('prepared_output_live_dispatch_not_false')
}
if (preparedOutput.toolExecutionPerformed !== false) fail('prepared_output_tool_execution_not_false')

const packageJsonDiff = git(['diff', '--unified=0', baseRef, '--', 'package.json']).split('\n')
const allowedPackageJsonDiff = new Set([
  `+    "${runScriptName}": "${runScriptCommand}",`,
  `+    "${diagnosticScriptName}": "${diagnosticScriptCommand}",`,
])
for (const line of packageJsonDiff) {
  if (line.startsWith('+++') || line.startsWith('---') || line.startsWith('@@')) continue
  if (line.startsWith('+') || line.startsWith('-')) {
    if (!allowedPackageJsonDiff.has(line)) fail(`unexpected_package_json_diff:${line}`)
  }
}

const packageLockDiff = git(['diff', '--name-only', baseRef, '--', 'package-lock.json'])
if (packageLockDiff.trim()) fail('package_lock_changed')

const trackedLocalArtifacts = git(['ls-files', '.local-artifacts'])
if (trackedLocalArtifacts.trim()) fail(`local_artifacts_tracked:${trackedLocalArtifacts}`)
const stagedLocalArtifacts = git(['diff', '--cached', '--name-only', '--', '.local-artifacts'])
if (stagedLocalArtifacts.trim()) fail(`local_artifacts_staged:${stagedLocalArtifacts}`)

const changedFiles = [
  ...git(['diff', '--name-only', baseRef]).split('\n').filter(Boolean),
  ...git(['ls-files', '--others', '--exclude-standard']).split('\n').filter(Boolean),
]
for (const file of changedFiles) {
  if (/(^|\/)(\.local-artifacts|dist|build|coverage|playwright-report|test-results|public\/artifacts|generated|renders?|screenshots?|canvas|webgl|media|videos?|images?)(\/|$)/i.test(file)) {
    fail(`generated_or_runtime_artifact_path_committed:${file}`)
  }
}

const changedText = changedFiles
  .filter((file) => (
    !file.startsWith('scripts/validation/') &&
    fs.existsSync(file) &&
    fs.statSync(file).isFile()
  ))
  .map((file) => `${file}\n${fs.readFileSync(file, 'utf8')}`)
  .join('\n')
for (const forbidden of [
  /SUPABASE_SERVICE_ROLE_KEY=[A-Za-z0-9._-]{40,}/i,
  /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
]) {
  if (forbidden.test(changedText)) fail(`forbidden_text_match:${forbidden}`)
}

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision: docs.decision,
  status: 'worker_handoff_local_smoke_passed_with_cleanup_no_tool_execution',
  toolsClaimedThroughRpc: docs.counts.rpcWorkerClaimsReturned,
  workerBoundaryHandoffProbesCompleted: docs.counts.workerBoundaryHandoffProbesCompleted,
  inMemoryDispatcherLeaseRecordsReleased: docs.counts.inMemoryDispatcherLeaseRecordsReleased,
  fixtureRowsPersistedAfterCleanup: docs.counts.fixtureRowsPersistedAfterCleanup,
  liveProductionWorkerDispatchPerformed: docs.booleans.liveProductionWorkerDispatchPerformed,
  toolExecutionPerformed: docs.booleans.toolExecutionPerformed,
  agentCanExecuteToolsNow: docs.booleans.agentCanExecuteToolsNow,
  runtimeReadyNow: docs.booleans.runtimeReadyNow,
  productionReadyNow: docs.booleans.productionReadyNow,
}, null, 2))
