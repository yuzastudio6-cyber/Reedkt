import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const runScriptName = 'ai-graphics:internal-beta-service-role-rpc-local-smoke'
const runScriptCommand =
  'node scripts/validation/ai-graphics-internal-beta-service-role-rpc-local-smoke.mjs'
const diagnosticScriptName = 'ai-graphics:internal-beta-service-role-rpc-local-smoke:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-internal-beta-service-role-rpc-local-smoke-diagnostics.mjs'

const docsJsonFile =
  'docs/tool-intelligence/ai-graphics/internal-beta-service-role-rpc-local-smoke-proof.json'
const docsMdFile =
  'docs/tool-intelligence/ai-graphics/internal-beta-service-role-rpc-local-smoke-proof.md'
const sourceSmokeDocsFile =
  'docs/tool-intelligence/ai-graphics/internal-beta-service-role-rpc-smoke-readiness.json'
const sourceImplementationDocsFile =
  'docs/tool-intelligence/ai-graphics/internal-beta-service-role-rpc-implementation-readiness.json'
const runScriptFile = 'scripts/validation/ai-graphics-internal-beta-service-role-rpc-local-smoke.mjs'
const migrationFile = 'supabase/migrations/202606260002_ai_graphics_tool_runtime_service_role_rpcs.sql'

const requiredRpcs = [
  'enqueue_ai_graphics_tool_runtime_jobs',
  'claim_ai_graphics_tool_runtime_job',
  'record_ai_graphics_worker_event',
  'record_ai_graphics_audit_event',
]

const trueBooleans = [
  'internalBetaServiceRoleRpcLocalSmokeProofCompleted',
  'sourceServiceRoleRpcSmokeReadinessAccepted',
  'sourceServiceRoleRpcImplementationReadinessAccepted',
  'all21ToolsCoveredByReadinessEvidence',
  'all12CapabilitiesCoveredByReadinessEvidence',
  'localRpcMigrationApplied',
  'localRpcFunctionsPresent',
  'localRollbackFixtureSmokePassed',
  'localEnqueueRpcSmokePassed',
  'localClaimRpcSmokePassed',
  'localWorkerEventRpcSmokePassed',
  'localAuditRpcSmokePassed',
  'localSmokeFixtureRowsRolledBack',
  'privateArtifactManifestGuardUsed',
  'reservedCreditReservationGuardUsed',
  'approvedSnapshotGuardUsed',
  'agentCanSelectForPlanning',
]

const falseBooleans = [
  'persistentSmokeFixtureRowsCreated',
  'agentCanExecuteToolsNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'toolExecutionApprovedNow',
  'providerRuntimeApprovedNow',
  'browserWebglCanvasRuntimeApprovedNow',
  'gpuRuntimeApprovedNow',
  'gpuRuntimeShouldStartNow',
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
      REEDITPRO_CONFIRM_AI_GRAPHICS_LOCAL_RPC_SMOKE: '',
    },
    maxBuffer: 64 * 1024 * 1024,
  }).trim()
}

for (const file of [
  docsJsonFile,
  docsMdFile,
  sourceSmokeDocsFile,
  sourceImplementationDocsFile,
  runScriptFile,
  migrationFile,
  'package.json',
  'docs/production-beta-readiness-scorecard.md',
]) {
  read(file)
}

const pkg = json('package.json')
const docs = json(docsJsonFile)
const sourceSmokeDocs = json(sourceSmokeDocsFile)
const sourceImplementationDocs = json(sourceImplementationDocsFile)
const markdown = read(docsMdFile)
const runScript = read(runScriptFile)
const migration = read(migrationFile)
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (pkg.scripts?.[runScriptName] !== runScriptCommand) fail(`missing_package_script:${runScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail(`missing_package_script:${diagnosticScriptName}`)
}

if (docs.decision !== 'ai_graphics_internal_beta_service_role_rpc_local_smoke_passed_with_rollback_fixtures') {
  fail(`unexpected_decision:${docs.decision}`)
}
if (docs.status !== 'local_rpc_smoke_passed_with_rollback_fixtures_no_tool_execution') {
  fail(`unexpected_status:${docs.status}`)
}
if (sourceSmokeDocs.decision !== 'ai_graphics_internal_beta_service_role_rpc_smoke_readiness_contract_prepared_live_smoke_blocked') {
  fail(`unexpected_source_smoke_decision:${sourceSmokeDocs.decision}`)
}
if (
  sourceImplementationDocs.decision !==
  'ai_graphics_internal_beta_service_role_rpc_implementation_readiness_contract_prepared_with_static_migration'
) {
  fail(`unexpected_source_implementation_decision:${sourceImplementationDocs.decision}`)
}
if (docs.migrationFile !== migrationFile) fail(`docs_migration_file:${docs.migrationFile}`)
if (docs.localSmokeScript !== runScriptFile) fail(`docs_local_smoke_script:${docs.localSmokeScript}`)

for (const rpc of requiredRpcs) {
  if (!docs.localDatabaseEvidence?.rpcFunctionsPresentAfterApply?.includes(rpc)) fail(`docs_missing_local_rpc:${rpc}`)
  if (!docs.localSmokeCoverage?.serviceRoleRpcsExercised?.includes(rpc)) fail(`docs_missing_exercised_rpc:${rpc}`)
  if (!runScript.includes(rpc)) fail(`run_script_missing_rpc:${rpc}`)
}

for (const token of [
  'REEDITPRO_CONFIRM_AI_GRAPHICS_LOCAL_RPC_SMOKE',
  '--execute-local-smoke',
  'AI graphics local service-role RPC smoke is blocked in production.',
  'local_rpc_smoke_passed_with_rollback_fixtures',
  'rollback;',
  'private://ai-graphics/local-rpc-smoke/d3/manifest.json',
  "'reserved'::public.credit_reservation_status",
  "'ai_graphics_tool_runtime'::public.job_type",
]) {
  if (!runScript.includes(token)) fail(`run_script_missing_token:${token}`)
}

if (!migration.includes("cr.status in ('reserved', 'partially_spent')")) {
  fail('migration_missing_reserved_partially_spent_guard')
}
if (migration.includes("'reserved', 'active', 'partially_spent'")) {
  fail('migration_uses_invalid_active_credit_reservation_status')
}

if (docs.localDatabaseEvidence?.correctedMigrationAppliedLocally !== true) {
  fail('docs_corrected_migration_not_applied_locally')
}
if (docs.localDatabaseEvidence?.schemaMigrationsRecordedByManualApply !== false) {
  fail('docs_schema_migrations_recorded_unexpectedly')
}
if (docs.localDatabaseEvidence?.jobTypeEnumValuePresentAfterApply !== 'ai_graphics_tool_runtime') {
  fail(`docs_job_type_after_apply:${docs.localDatabaseEvidence?.jobTypeEnumValuePresentAfterApply}`)
}
if (docs.localDatabaseEvidence?.approvedPlanSnapshotColumnsPresentAfterApply !== 2) {
  fail(`docs_approved_snapshot_columns:${docs.localDatabaseEvidence?.approvedPlanSnapshotColumnsPresentAfterApply}`)
}
if (docs.localSmokeCoverage?.toolsRepresentedByReadinessEvidence !== 21) {
  fail(`docs_tools_represented:${docs.localSmokeCoverage?.toolsRepresentedByReadinessEvidence}`)
}
if (!docs.localSmokeCoverage?.toolsExercisedByLocalSmoke?.includes('d3')) fail('docs_missing_d3_smoke_tool')
if (docs.localSmokeCoverage?.toolExecutionPerformedBySmoke !== false) fail('docs_smoke_tool_execution_not_false')

if (docs.counts?.totalAiGraphicsTools !== 21) fail(`docs_total_tools:${docs.counts?.totalAiGraphicsTools}`)
if (docs.counts?.totalProductFacingCapabilities !== 12) {
  fail(`docs_total_capabilities:${docs.counts?.totalProductFacingCapabilities}`)
}
if (docs.counts?.serviceRoleRpcsExercised !== 4) fail(`docs_rpc_count:${docs.counts?.serviceRoleRpcsExercised}`)
if (docs.counts?.localSchemaMigrationsAppliedNow !== 1) {
  fail(`docs_local_migrations:${docs.counts?.localSchemaMigrationsAppliedNow}`)
}
if (docs.counts?.localRollbackFixtureTransactionsPerformed !== 1) {
  fail(`docs_local_rollback_transactions:${docs.counts?.localRollbackFixtureTransactionsPerformed}`)
}
if (docs.counts?.persistentSmokeFixtureRowsAfterRollback !== 0) {
  fail(`docs_persistent_fixture_rows:${docs.counts?.persistentSmokeFixtureRowsAfterRollback}`)
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
  fail(`default_local_smoke_contract_failed:${error.message}`)
}
if (defaultOutput.status !== 'local_rpc_smoke_prepared_not_executed') {
  fail(`default_output_status:${defaultOutput.status}`)
}
if (defaultOutput.localRpcSmokeExecutedNow !== false) fail('default_output_executed_without_confirmation')
if (defaultOutput.toolExecutionPerformed !== false) fail('default_output_tool_execution_not_false')

for (const token of [
  'ai_graphics_internal_beta_service_role_rpc_local_smoke_passed_with_rollback_fixtures',
  '`ai-graphics:internal-beta-service-role-rpc-local-smoke`',
  'Persistent smoke fixture rows after rollback: 0',
  '`agentCanExecuteToolsNow`: false',
  '`runtimeReadyNow`: false',
  '`productionReadyNow`: false',
]) {
  if (!markdown.includes(token)) fail(`markdown_missing_token:${token}`)
}
if (!scorecard.includes('ai_graphics_internal_beta_service_role_rpc_local_smoke_passed_with_rollback_fixtures')) {
  fail('scorecard_missing_local_smoke_proof')
}

const forbiddenPatterns = [
  /agentCanExecuteToolsNow["'`:\s=]+true/i,
  /routeExecutionApprovedNow["'`:\s=]+true/i,
  /workerExecutionApprovedNow["'`:\s=]+true/i,
  /toolExecutionApprovedNow["'`:\s=]+true/i,
  /gpuRuntimeShouldStartNow["'`:\s=]+true/i,
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
  '+    "ai-graphics:external-beta-api-route-controlled-worker-runtime-proof": "tsx server/cli/ai-graphics-external-beta-api-route-controlled-worker-runtime-proof.ts",',
  '+    "ai-graphics:external-beta-api-route-controlled-worker-runtime-proof:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-controlled-worker-runtime-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-worker-artifact-tool-route-admission": "tsx server/cli/ai-graphics-external-beta-api-route-worker-artifact-tool-route-admission.ts",',
  '+    "ai-graphics:external-beta-api-route-worker-artifact-tool-route-admission:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-worker-artifact-tool-route-admission-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-worker-dispatch-handoff-proof": "tsx server/cli/ai-graphics-external-beta-api-route-worker-dispatch-handoff-proof.ts",',
  '+    "ai-graphics:external-beta-api-route-worker-dispatch-handoff-proof:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-worker-dispatch-handoff-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-queue-smoke-proof": "tsx server/cli/ai-graphics-external-beta-api-route-queue-smoke-proof.ts",',
  '+    "ai-graphics:external-beta-api-route-queue-smoke-proof:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-queue-smoke-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-service-role-queue-smoke-authorization": "tsx server/cli/ai-graphics-external-beta-service-role-queue-smoke-authorization.ts",',
  '+    "ai-graphics:external-beta-service-role-queue-smoke-authorization:diagnostics": "node scripts/validation/ai-graphics-external-beta-service-role-queue-smoke-authorization-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-live-enqueue-authorization": "tsx server/cli/ai-graphics-external-beta-live-enqueue-authorization.ts",',
  '+    "ai-graphics:external-beta-live-enqueue-authorization:diagnostics": "node scripts/validation/ai-graphics-external-beta-live-enqueue-authorization-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-controlled-runtime-execution-approval": "tsx server/cli/ai-graphics-external-beta-controlled-runtime-execution-approval.ts",',
  '+    "ai-graphics:external-beta-controlled-runtime-execution-approval:diagnostics": "node scripts/validation/ai-graphics-external-beta-controlled-runtime-execution-approval-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-candidate-evidence-assembly": "tsx server/cli/ai-graphics-external-beta-candidate-evidence-assembly.ts",',
  '+    "ai-graphics:external-beta-candidate-evidence-assembly:diagnostics": "node scripts/validation/ai-graphics-external-beta-candidate-evidence-assembly-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-launch-controls": "tsx server/cli/ai-graphics-external-beta-launch-controls.ts",',
  '+    "ai-graphics:external-beta-launch-controls:diagnostics": "node scripts/validation/ai-graphics-external-beta-launch-controls-diagnostics.mjs",',
  `+    "ai-graphics:external-beta-native-gpu-proof-operator-scaffold": "node --experimental-strip-types server/cli/ai-graphics-external-beta-native-gpu-proof-operator-scaffold.ts",`,
  `+    "ai-graphics:external-beta-native-gpu-proof-operator-scaffold:diagnostics": "node scripts/validation/ai-graphics-external-beta-native-gpu-proof-operator-scaffold-diagnostics.mjs",`,
  `+    "ai-graphics:external-beta-native-gpu-proof-cloud-run-job-scaffold": "node --experimental-strip-types server/cli/ai-graphics-external-beta-native-gpu-proof-cloud-run-job-scaffold.ts",`,
  `+    "ai-graphics:external-beta-native-gpu-proof-cloud-run-job-scaffold:diagnostics": "node scripts/validation/ai-graphics-external-beta-native-gpu-proof-cloud-run-job-scaffold-diagnostics.mjs",`,
  `+    "ai-graphics:external-beta-native-gpu-proof-cloud-run-result-collector": "node --experimental-strip-types server/cli/ai-graphics-external-beta-native-gpu-proof-cloud-run-result-collector.ts",`,
  `+    "ai-graphics:external-beta-native-gpu-proof-cloud-run-result-collector:diagnostics": "node scripts/validation/ai-graphics-external-beta-native-gpu-proof-cloud-run-result-collector-diagnostics.mjs",`,
  `+    "ai-graphics:external-beta-native-gpu-proof-operator-handoff": "tsx server/cli/ai-graphics-external-beta-native-gpu-proof-operator-handoff.ts",`,
  `+    "ai-graphics:external-beta-native-gpu-proof-operator-handoff:diagnostics": "node scripts/validation/ai-graphics-external-beta-native-gpu-proof-operator-handoff-diagnostics.mjs",`,
  '+    "ai-graphics:internal-beta-service-role-rpc-implementation-readiness:diagnostics": "node scripts/validation/ai-graphics-internal-beta-service-role-rpc-implementation-readiness-diagnostics.mjs",',
  '+    "ai-graphics:internal-beta-service-role-rpc-smoke-readiness": "tsx server/cli/ai-graphics-internal-beta-service-role-rpc-smoke-readiness.ts",',
  '+    "ai-graphics:internal-beta-service-role-rpc-smoke-readiness:diagnostics": "node scripts/validation/ai-graphics-internal-beta-service-role-rpc-smoke-readiness-diagnostics.mjs",',
  `+    "${runScriptName}": "${runScriptCommand}",`,
  `+    "${diagnosticScriptName}": "${diagnosticScriptCommand}",`,
  '+    "ai-graphics:internal-beta-service-role-rpc-adapter-local-smoke": "tsx server/cli/ai-graphics-internal-beta-service-role-rpc-adapter-local-smoke.ts",',
  '+    "ai-graphics:internal-beta-service-role-rpc-adapter-local-smoke:diagnostics": "node scripts/validation/ai-graphics-internal-beta-service-role-rpc-adapter-local-smoke-diagnostics.mjs",',
  '+    "ai-graphics:internal-beta-service-role-rpc-worker-handoff-local-smoke": "tsx server/cli/ai-graphics-internal-beta-service-role-rpc-worker-handoff-local-smoke.ts",',
  '+    "ai-graphics:internal-beta-service-role-rpc-worker-handoff-local-smoke:diagnostics": "node scripts/validation/ai-graphics-internal-beta-service-role-rpc-worker-handoff-local-smoke-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-evidence-admission-bundle": "tsx server/cli/ai-graphics-external-beta-evidence-admission-bundle.ts",',
  '+    "ai-graphics:external-beta-evidence-admission-bundle:diagnostics": "node scripts/validation/ai-graphics-external-beta-evidence-admission-bundle-diagnostics.mjs",',
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
    'AI graphics internal beta service-role RPC local smoke diagnostics failed:',
    ...failures.map((failure) => `- ${failure}`),
  ].join('\n'))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision: docs.decision,
  status: docs.status,
  tools: docs.counts.totalAiGraphicsTools,
  capabilities: docs.counts.totalProductFacingCapabilities,
  serviceRoleRpcsExercised: docs.counts.serviceRoleRpcsExercised,
  localSchemaMigrationsAppliedNow: docs.counts.localSchemaMigrationsAppliedNow,
  localRollbackFixtureTransactionsPerformed: docs.counts.localRollbackFixtureTransactionsPerformed,
  persistentSmokeFixtureRowsAfterRollback: docs.counts.persistentSmokeFixtureRowsAfterRollback,
  toolExecutionsNow: docs.counts.toolExecutionsNow,
  agentCanExecuteToolsNow: docs.booleans.agentCanExecuteToolsNow,
  runtimeReadyNow: docs.booleans.runtimeReadyNow,
  productionReadyNow: docs.booleans.productionReadyNow,
}, null, 2))
