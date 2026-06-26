import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const runScriptName = 'ai-graphics:internal-beta-service-role-rpc-adapter-local-smoke'
const runScriptCommand =
  'tsx server/cli/ai-graphics-internal-beta-service-role-rpc-adapter-local-smoke.ts'
const diagnosticScriptName =
  'ai-graphics:internal-beta-service-role-rpc-adapter-local-smoke:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-internal-beta-service-role-rpc-adapter-local-smoke-diagnostics.mjs'

const docsJsonFile =
  'docs/tool-intelligence/ai-graphics/internal-beta-service-role-rpc-adapter-local-smoke-proof.json'
const docsMdFile =
  'docs/tool-intelligence/ai-graphics/internal-beta-service-role-rpc-adapter-local-smoke-proof.md'
const sourceLocalSmokeDocsFile =
  'docs/tool-intelligence/ai-graphics/internal-beta-service-role-rpc-local-smoke-proof.json'
const sourceSmokeReadinessDocsFile =
  'docs/tool-intelligence/ai-graphics/internal-beta-service-role-rpc-smoke-readiness.json'
const sourceImplementationDocsFile =
  'docs/tool-intelligence/ai-graphics/internal-beta-service-role-rpc-implementation-readiness.json'
const runScriptFile = 'server/cli/ai-graphics-internal-beta-service-role-rpc-adapter-local-smoke.ts'
const serviceFile = 'server/services/ai-graphics-tool-runtime-queue-service.ts'

const requiredRpcs = [
  'enqueue_ai_graphics_tool_runtime_jobs',
  'claim_ai_graphics_tool_runtime_job',
  'record_ai_graphics_worker_event',
  'record_ai_graphics_audit_event',
]

const trueBooleans = [
  'internalBetaServiceRoleRpcAdapterLocalSmokeProofCompleted',
  'sourceServiceRoleRpcLocalSmokeProofAccepted',
  'sourceServiceRoleRpcSmokeReadinessAccepted',
  'sourceServiceRoleRpcImplementationReadinessAccepted',
  'all21ToolsSubmittedThroughAdapter',
  'all12CapabilitiesCoveredBySubmittedPayloads',
  'backendServiceAdapterExercised',
  'localSupabaseHttpRpcExercised',
  'localRpcFunctionsPresent',
  'postgrestSchemaReloadNotified',
  'localAdapterEnqueuePassed',
  'localAdapterClaimPassed',
  'localAdapterWorkerEventPassed',
  'localAdapterAuditPassed',
  'localAdapterCleanupPassed',
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
      REEDITPRO_CONFIRM_AI_GRAPHICS_RPC_ADAPTER_LOCAL_SMOKE: '',
    },
    maxBuffer: 64 * 1024 * 1024,
  }).trim()
}

for (const file of [
  docsJsonFile,
  docsMdFile,
  sourceLocalSmokeDocsFile,
  sourceSmokeReadinessDocsFile,
  sourceImplementationDocsFile,
  runScriptFile,
  serviceFile,
  'package.json',
  'docs/production-beta-readiness-scorecard.md',
]) {
  read(file)
}

const pkg = json('package.json')
const docs = json(docsJsonFile)
const sourceLocalSmokeDocs = json(sourceLocalSmokeDocsFile)
const sourceSmokeReadinessDocs = json(sourceSmokeReadinessDocsFile)
const sourceImplementationDocs = json(sourceImplementationDocsFile)
const markdown = read(docsMdFile)
const runScript = read(runScriptFile)
const service = read(serviceFile)
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (pkg.scripts?.[runScriptName] !== runScriptCommand) fail(`missing_package_script:${runScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail(`missing_package_script:${diagnosticScriptName}`)
}

if (docs.decision !== 'ai_graphics_internal_beta_service_role_rpc_adapter_local_smoke_passed_with_cleanup') {
  fail(`unexpected_decision:${docs.decision}`)
}
if (docs.status !== 'adapter_local_smoke_passed_with_cleanup_no_tool_execution') {
  fail(`unexpected_status:${docs.status}`)
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
  if (!docs.adapterSmokeCoverage?.serviceRoleRpcsExercised?.includes(rpc)) fail(`docs_missing_rpc:${rpc}`)
  if (!runScript.includes(rpc)) fail(`run_script_missing_rpc:${rpc}`)
  if (!service.includes(rpc)) fail(`service_missing_rpc:${rpc}`)
}

for (const token of [
  'createAiGraphicsToolRuntimeQueueService',
  'buildAiGraphicsServiceRoleRpcSmokeJobs',
  'createSupabaseAdminClient',
  'REEDITPRO_CONFIRM_AI_GRAPHICS_RPC_ADAPTER_LOCAL_SMOKE',
  '--execute-local-adapter-smoke',
  'AI graphics RPC adapter local smoke is blocked in production.',
  "smokeEnv !== 'local'",
  "notify pgrst, 'reload schema'",
  'set local session_replication_role = replica',
  'jobsSubmittedToAdapter',
  'insertedJobCount',
  'fixtureRowsPersistedAfterCleanup',
]) {
  if (!runScript.includes(token)) fail(`run_script_missing_token:${token}`)
}

if (docs.localDatabaseEvidence?.serviceRoleKeyCommitted !== false) fail('docs_service_role_key_committed_not_false')
if (docs.localDatabaseEvidence?.localServiceRoleJwtGeneratedInProcess !== true) {
  fail('docs_local_service_role_jwt_not_generated_in_process')
}
if (docs.localDatabaseEvidence?.rpcFunctionsPresentBeforeAdapterSmoke !== 4) {
  fail(`docs_rpc_presence:${docs.localDatabaseEvidence?.rpcFunctionsPresentBeforeAdapterSmoke}`)
}
if (docs.localDatabaseEvidence?.approvedPlanSnapshotColumnsPresentBeforeAdapterSmoke !== 2) {
  fail(`docs_snapshot_columns:${docs.localDatabaseEvidence?.approvedPlanSnapshotColumnsPresentBeforeAdapterSmoke}`)
}
if (docs.localDatabaseEvidence?.postgrestSchemaReloadNotified !== true) fail('docs_postgrest_reload_not_notified')

if (docs.adapterSmokeCoverage?.toolsSubmittedToAdapterEnqueue !== 21) {
  fail(`docs_tools_submitted:${docs.adapterSmokeCoverage?.toolsSubmittedToAdapterEnqueue}`)
}
if (docs.adapterSmokeCoverage?.jobsInsertedThenCleanedUp !== 21) {
  fail(`docs_jobs_inserted_cleaned:${docs.adapterSmokeCoverage?.jobsInsertedThenCleanedUp}`)
}
if (docs.adapterSmokeCoverage?.jobIdsReturned !== 21) fail(`docs_job_ids:${docs.adapterSmokeCoverage?.jobIdsReturned}`)
if (docs.adapterSmokeCoverage?.workerClaimsInsertedThenCleanedUp !== 1) {
  fail(`docs_claims:${docs.adapterSmokeCoverage?.workerClaimsInsertedThenCleanedUp}`)
}
if (docs.adapterSmokeCoverage?.backendServiceAdapterExercised !== serviceFile) {
  fail(`docs_service_adapter:${docs.adapterSmokeCoverage?.backendServiceAdapterExercised}`)
}
if (docs.adapterSmokeCoverage?.toolExecutionPerformedBySmoke !== false) fail('docs_tool_execution_by_smoke_not_false')
if (docs.cleanupEvidence?.cleanupRequiredBecauseApprovedSnapshotsAreImmutable !== true) {
  fail('docs_cleanup_immutability_missing')
}
if (docs.cleanupEvidence?.cleanupMode !== 'local_only_trigger_bypass_for_prefixed_smoke_fixtures') {
  fail(`docs_cleanup_mode:${docs.cleanupEvidence?.cleanupMode}`)
}
if (docs.cleanupEvidence?.fixtureRowsPersistedAfterCleanup !== 0) {
  fail(`docs_fixture_rows_after_cleanup:${docs.cleanupEvidence?.fixtureRowsPersistedAfterCleanup}`)
}

if (docs.counts?.totalAiGraphicsTools !== 21) fail(`docs_total_tools:${docs.counts?.totalAiGraphicsTools}`)
if (docs.counts?.totalProductFacingCapabilities !== 12) {
  fail(`docs_total_capabilities:${docs.counts?.totalProductFacingCapabilities}`)
}
if (docs.counts?.serviceRoleRpcsExercised !== 4) fail(`docs_rpc_count:${docs.counts?.serviceRoleRpcsExercised}`)
if (docs.counts?.adapterEnqueueJobPayloadsSubmitted !== 21) {
  fail(`docs_adapter_payloads:${docs.counts?.adapterEnqueueJobPayloadsSubmitted}`)
}
if (docs.counts?.adapterInsertedJobCount !== 21) fail(`docs_inserted_count:${docs.counts?.adapterInsertedJobCount}`)
if (docs.counts?.fixtureRowsPersistedAfterCleanup !== 0) {
  fail(`docs_count_fixture_rows:${docs.counts?.fixtureRowsPersistedAfterCleanup}`)
}
for (const countKey of [
  'toolExecutionsNow',
  'routeExecutionsNow',
  'workerExecutionsNow',
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
  if (docs.booleans?.[key] !== true) fail(`docs_true_boolean_not_true:${key}`)
}
for (const key of falseBooleans) {
  if (docs.booleans?.[key] !== false) fail(`docs_false_boolean_not_false:${key}`)
}

let defaultOutput = {}
try {
  defaultOutput = JSON.parse(runNpm(runScriptName))
} catch (error) {
  fail(`default_adapter_smoke_contract_failed:${error.message}`)
}
if (defaultOutput.status !== 'adapter_local_smoke_prepared_not_executed') {
  fail(`default_output_status:${defaultOutput.status}`)
}
if (defaultOutput.adapterLocalSmokeExecutedNow !== false) fail('default_output_executed_without_confirmation')
if (defaultOutput.toolExecutionPerformed !== false) fail('default_output_tool_execution_not_false')

for (const token of [
  'ai_graphics_internal_beta_service_role_rpc_adapter_local_smoke_passed_with_cleanup',
  '`ai-graphics:internal-beta-service-role-rpc-adapter-local-smoke`',
  'Tools submitted to adapter enqueue: 21',
  'Fixture rows persisted after cleanup: 0',
  '`agentCanExecuteToolsNow`: false',
  '`runtimeReadyNow`: false',
  '`productionReadyNow`: false',
]) {
  if (!markdown.includes(token)) fail(`markdown_missing_token:${token}`)
}
if (!scorecard.includes('ai_graphics_internal_beta_service_role_rpc_adapter_local_smoke_passed_with_cleanup')) {
  fail('scorecard_missing_adapter_local_smoke_proof')
}

const forbiddenPatterns = [
  /SUPABASE_SERVICE_ROLE_KEY=[A-Za-z0-9._-]{20,}/i,
  /agentCanExecuteToolsNow["'`:\s=]+true/i,
  /routeExecutionApprovedNow["'`:\s=]+true/i,
  /workerExecutionApprovedNow["'`:\s=]+true/i,
  /toolExecutionApprovedNow["'`:\s=]+true/i,
  /runtimeReadyNow["'`:\s=]+true/i,
  /internalBetaReadyNow["'`:\s=]+true/i,
  /externalBetaReadyNow["'`:\s=]+true/i,
  /productionReadyNow["'`:\s=]+true/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
]
for (const [label, content] of Object.entries({
  docs: JSON.stringify(docs),
  markdown,
  runScript,
})) {
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(content)) fail(`forbidden_runtime_claim:${label}:${pattern}`)
  }
}

try {
  const basePkg = JSON.parse(git(['show', `${baseRef}:package.json`]))
  for (const key of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
    if (JSON.stringify(basePkg[key] ?? {}) !== JSON.stringify(pkg[key] ?? {})) {
      fail(`package_dependency_section_changed:${key}`)
    }
  }
} catch (error) {
  fail(`package_dependency_compare_failed:${error.message}`)
}

try {
  const lockDiff = git(['diff', '--name-only', baseRef, '--', 'package-lock.json'])
  if (lockDiff.trim()) fail('package_lock_changed')
} catch (error) {
  fail(`package_lock_diff_failed:${error.message}`)
}

const packageDiff = git(['diff', '--unified=0', baseRef, '--', 'package.json'])
const allowedPackageAdditions = new Set([
  '+    "ai-graphics:internal-beta-service-role-rpc-implementation-readiness:diagnostics": "node scripts/validation/ai-graphics-internal-beta-service-role-rpc-implementation-readiness-diagnostics.mjs",',
  '+    "ai-graphics:internal-beta-service-role-rpc-smoke-readiness": "tsx server/cli/ai-graphics-internal-beta-service-role-rpc-smoke-readiness.ts",',
  '+    "ai-graphics:internal-beta-service-role-rpc-smoke-readiness:diagnostics": "node scripts/validation/ai-graphics-internal-beta-service-role-rpc-smoke-readiness-diagnostics.mjs",',
  '+    "ai-graphics:internal-beta-service-role-rpc-local-smoke": "node scripts/validation/ai-graphics-internal-beta-service-role-rpc-local-smoke.mjs",',
  '+    "ai-graphics:internal-beta-service-role-rpc-local-smoke:diagnostics": "node scripts/validation/ai-graphics-internal-beta-service-role-rpc-local-smoke-diagnostics.mjs",',
  `+    "${runScriptName}": "${runScriptCommand}",`,
  `+    "${diagnosticScriptName}": "${diagnosticScriptCommand}",`,
  '+    "ai-graphics:internal-beta-service-role-rpc-worker-handoff-local-smoke": "tsx server/cli/ai-graphics-internal-beta-service-role-rpc-worker-handoff-local-smoke.ts",',
  '+    "ai-graphics:internal-beta-service-role-rpc-worker-handoff-local-smoke:diagnostics": "node scripts/validation/ai-graphics-internal-beta-service-role-rpc-worker-handoff-local-smoke-diagnostics.mjs",',
])
for (const line of packageDiff.split('\n')) {
  if (!line || line.startsWith('+++') || line.startsWith('---') || line.startsWith('@@')) continue
  if (line.startsWith('+') && allowedPackageAdditions.has(line)) continue
  if (line.startsWith('+') || line.startsWith('-')) fail(`unexpected_package_json_diff:${line}`)
}

try {
  const trackedLocalArtifacts = git(['ls-files', '.local-artifacts'])
  if (trackedLocalArtifacts.trim()) fail(`local_artifacts_tracked:${trackedLocalArtifacts}`)
} catch (error) {
  fail(`local_artifacts_scan_failed:${error.message}`)
}

const generatedPathPattern = /(^|\/)(render|renders|media|canvas|webgl|public|signed-url|signed-urls|gcs)(\/|$)/i
try {
  const changedFiles = git(['diff', '--name-only', baseRef]).split('\n').filter(Boolean)
  for (const file of changedFiles) {
    if (generatedPathPattern.test(file)) fail(`generated_output_path_changed:${file}`)
  }
} catch (error) {
  fail(`generated_output_scan_failed:${error.message}`)
}

if (failures.length > 0) {
  console.error([
    'AI graphics internal beta service-role RPC adapter local smoke diagnostics failed:',
    ...failures.map((failure) => `- ${failure}`),
  ].join('\n'))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision: docs.decision,
  status: docs.status,
  toolsSubmittedToAdapterEnqueue: docs.adapterSmokeCoverage.toolsSubmittedToAdapterEnqueue,
  adapterInsertedJobCount: docs.counts.adapterInsertedJobCount,
  serviceRoleRpcsExercised: docs.counts.serviceRoleRpcsExercised,
  fixtureRowsPersistedAfterCleanup: docs.counts.fixtureRowsPersistedAfterCleanup,
  toolExecutionsNow: docs.counts.toolExecutionsNow,
  agentCanExecuteToolsNow: docs.booleans.agentCanExecuteToolsNow,
  runtimeReadyNow: docs.booleans.runtimeReadyNow,
  productionReadyNow: docs.booleans.productionReadyNow,
}, null, 2))
