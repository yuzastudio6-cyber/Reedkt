import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const scriptName = 'ai-graphics:internal-beta-service-role-rpc-implementation-readiness:diagnostics'
const scriptCommand =
  'node scripts/validation/ai-graphics-internal-beta-service-role-rpc-implementation-readiness-diagnostics.mjs'

const migrationFile = 'supabase/migrations/202606260002_ai_graphics_tool_runtime_service_role_rpcs.sql'
const docsJsonFile =
  'docs/tool-intelligence/ai-graphics/internal-beta-service-role-rpc-implementation-readiness.json'
const docsMdFile =
  'docs/tool-intelligence/ai-graphics/internal-beta-service-role-rpc-implementation-readiness.md'
const serviceFile = 'server/services/ai-graphics-tool-runtime-queue-service.ts'
const sourceDocsFile =
  'docs/tool-intelligence/ai-graphics/internal-beta-service-role-queue-transaction-readiness.json'

const allTools = [
  'torch_torchvision',
  'transformers',
  'sam2',
  'birefnet',
  'real_esrgan',
  'kornia',
  'rembg',
  'transparent_background',
  'd3',
  'echarts',
  'vega_lite',
  'vega',
  'satori',
  'svgdotjs_svg_js',
  'viz_js',
  'lottie_web',
  'animejs',
  'three_js',
  'pixi_js',
  'konva',
  'babylonjs',
]

const capabilities = [
  'chart_overlay',
  'data_visualization',
  'svg_graphics',
  'diagram_graphics',
  'animation_overlay',
  'canvas_scene',
  'webgl_3d_scene',
  'background_removal',
  'subject_segmentation',
  'upscaling',
  'tensor_image_ops',
  'model_runtime_foundation',
]

const requiredRpcs = [
  'enqueue_ai_graphics_tool_runtime_jobs',
  'claim_ai_graphics_tool_runtime_job',
  'record_ai_graphics_worker_event',
  'record_ai_graphics_audit_event',
]

const trueBooleans = [
  'internalBetaServiceRoleRpcImplementationReadinessPrepared',
  'sourceServiceRoleQueueTransactionReadinessAccepted',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'aiGraphicsJobTypeEnumPrepared',
  'approvedSnapshotColumnsPrepared',
  'serviceRoleRpcMigrationPrepared',
  'backendServiceAdapterPrepared',
  'serviceRoleOnlyExecuteGrantsPrepared',
  'approvedSnapshotCreditReservationGuardsPrepared',
  'privateArtifactManifestGuardPrepared',
  'gpuHeavyToolsTargetGpuRuntime',
  'agentCanSelectForPlanning',
]

const falseBooleans = [
  'serviceRoleRpcMigrationAppliedNow',
  'serviceRoleQueueTransactionApprovedNow',
  'serviceRoleSupabaseWritesApprovedNow',
  'agentCanExecuteToolsNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'workerQueueApprovedNow',
  'backendQueueSubmissionApprovedNow',
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
  'backendQueueSubmissionPerformed',
  'supabaseMutationPerformed',
  'serviceRoleTransactionPerformed',
  'serviceRoleMigrationApplyPerformed',
  'productionWorkerDispatchPerformed',
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

for (const file of [
  migrationFile,
  docsJsonFile,
  docsMdFile,
  serviceFile,
  sourceDocsFile,
  'package.json',
  'docs/production-beta-readiness-scorecard.md',
]) {
  read(file)
}

const pkg = json('package.json')
const docs = json(docsJsonFile)
const sourceDocs = json(sourceDocsFile)
const migration = read(migrationFile)
const markdown = read(docsMdFile)
const service = read(serviceFile)
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (pkg.scripts?.[scriptName] !== scriptCommand) fail(`missing_package_script:${scriptName}`)
if (sourceDocs.decision !== 'ai_graphics_internal_beta_service_role_queue_transaction_readiness_contract_prepared_with_no_write_rpc_envelope') {
  fail(`unexpected_source_decision:${sourceDocs.decision}`)
}
if (docs.decision !== 'ai_graphics_internal_beta_service_role_rpc_implementation_readiness_contract_prepared_with_static_migration') {
  fail(`unexpected_decision:${docs.decision}`)
}
if (docs.status !== 'static_service_role_rpc_migration_prepared_not_applied') {
  fail(`unexpected_status:${docs.status}`)
}
if (docs.migrationFile !== migrationFile) fail(`docs_migration_file:${docs.migrationFile}`)
if (docs.serviceAdapter !== serviceFile) fail(`docs_service_file:${docs.serviceAdapter}`)
if (docs.migrationVersion !== '202606260002') fail(`docs_migration_version:${docs.migrationVersion}`)
if (docs.migrationVersionCollisionAvoidance?.renumberedFrom !== '202606260001') {
  fail(`docs_collision_renumbered_from:${docs.migrationVersionCollisionAvoidance?.renumberedFrom}`)
}
if (docs.migrationVersionCollisionAvoidance?.renumberedTo !== '202606260002') {
  fail(`docs_collision_renumbered_to:${docs.migrationVersionCollisionAvoidance?.renumberedTo}`)
}
if (docs.migrationVersionCollisionAvoidance?.observedLocalCollisionName !== 'public_production_edit_session_brief_qwen_gates') {
  fail(`docs_collision_name:${docs.migrationVersionCollisionAvoidance?.observedLocalCollisionName}`)
}
if (docs.migrationVersionCollisionAvoidance?.liveRpcFunctionsPresentBeforeApply !== false) {
  fail(`docs_collision_rpc_presence:${docs.migrationVersionCollisionAvoidance?.liveRpcFunctionsPresentBeforeApply}`)
}
for (const token of [
  'Migration version: `202606260002`',
  'Renumbered from: `202606260001`',
  '`public_production_edit_session_brief_qwen_gates`',
  'four AI graphics service-role RPC functions absent before apply',
]) {
  if (!markdown.includes(token)) fail(`markdown_missing_collision_token:${token}`)
}

for (const tool of allTools) {
  if (!docs.toolsCovered?.includes(tool)) fail(`docs_missing_tool:${tool}`)
  if (!markdown.includes(`\`${tool}\``)) fail(`markdown_missing_tool:${tool}`)
}
for (const capability of capabilities) {
  if (!docs.capabilitiesCovered?.includes(capability)) fail(`docs_missing_capability:${capability}`)
  if (!markdown.includes(`\`${capability}\``)) fail(`markdown_missing_capability:${capability}`)
}
for (const rpc of requiredRpcs) {
  if (!docs.serviceRoleRpcsPrepared?.includes(rpc)) fail(`docs_missing_rpc:${rpc}`)
  if (!migration.includes(`function public.${rpc}`)) fail(`migration_missing_function:${rpc}`)
  if (!migration.includes(`grant execute on function public.${rpc}`)) fail(`migration_missing_service_role_grant:${rpc}`)
  if (!migration.includes(`revoke execute on function public.${rpc}`)) fail(`migration_missing_revoke:${rpc}`)
  if (!service.includes(rpc)) fail(`service_missing_rpc_call:${rpc}`)
}

for (const token of [
  "alter type public.job_type add value if not exists 'ai_graphics_tool_runtime'",
  'add column if not exists approved_plan_snapshot_id uuid references public.approved_plan_snapshots',
  'job_batches_approved_plan_snapshot_id_idx',
  'jobs_approved_plan_snapshot_id_idx',
  "'ai_graphics_tool_runtime'::public.job_type",
  'public.active_worker_claim_exists',
  'private://%',
  'signed.?url',
  'public://',
  'https?://',
  'gcs://',
  'toolExecutionPerformed',
]) {
  if (!migration.includes(token)) fail(`migration_missing_token:${token}`)
}

for (const token of [
  'createAiGraphicsToolRuntimeQueueService',
  'enqueueToolRuntimeJobs',
  'claimToolRuntimeJob',
  'recordWorkerEvent',
  'recordAuditEvent',
  "context.clients.admin.rpc('enqueue_ai_graphics_tool_runtime_jobs'",
  "context.clients.admin.rpc('claim_ai_graphics_tool_runtime_job'",
  "context.clients.admin.rpc('record_ai_graphics_worker_event'",
  "context.clients.admin.rpc('record_ai_graphics_audit_event'",
  'mockOnly',
  'privateArtifactManifestRef.startsWith',
]) {
  if (!service.includes(token)) fail(`service_missing_token:${token}`)
}

if (docs.databaseChangesPrepared?.jobTypeEnumValuePrepared !== 'ai_graphics_tool_runtime') {
  fail(`docs_job_type_enum:${docs.databaseChangesPrepared?.jobTypeEnumValuePrepared}`)
}
if (docs.counts?.totalAiGraphicsTools !== 21) fail(`docs_total_tools:${docs.counts?.totalAiGraphicsTools}`)
if (docs.counts?.totalProductFacingCapabilities !== 12) {
  fail(`docs_total_capabilities:${docs.counts?.totalProductFacingCapabilities}`)
}
if (docs.counts?.serviceRoleRpcsPrepared !== 4) fail(`docs_rpc_count:${docs.counts?.serviceRoleRpcsPrepared}`)
if (docs.counts?.staticMigrationFilesPrepared !== 1) {
  fail(`docs_migration_count:${docs.counts?.staticMigrationFilesPrepared}`)
}
if (docs.counts?.backendServiceAdaptersPrepared !== 1) {
  fail(`docs_service_count:${docs.counts?.backendServiceAdaptersPrepared}`)
}
for (const countKey of [
  'liveMigrationAppliesNow',
  'liveServiceRoleTransactionsNow',
  'liveJobRowsInsertedNow',
  'liveWorkerClaimRowsInsertedNow',
  'liveToolExecutionsNow',
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

if (!scorecard.includes('ai_graphics_internal_beta_service_role_rpc_implementation_readiness_contract_prepared_with_static_migration')) {
  fail('scorecard_missing_service_role_rpc_implementation_readiness')
}

const forbiddenPatterns = [
  /agentCanExecuteToolsNow["'`:\s=]+true/i,
  /routeExecutionApprovedNow["'`:\s=]+true/i,
  /workerExecutionApprovedNow["'`:\s=]+true/i,
  /toolExecutionApprovedNow["'`:\s=]+true/i,
  /serviceRoleRpcMigrationAppliedNow["'`:\s=]+true/i,
  /serviceRoleSupabaseWritesApprovedNow["'`:\s=]+true/i,
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
  service,
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
  `+    "${scriptName}": "${scriptCommand}",`,
  '+    "ai-graphics:internal-beta-service-role-rpc-smoke-readiness": "tsx server/cli/ai-graphics-internal-beta-service-role-rpc-smoke-readiness.ts",',
  '+    "ai-graphics:internal-beta-service-role-rpc-smoke-readiness:diagnostics": "node scripts/validation/ai-graphics-internal-beta-service-role-rpc-smoke-readiness-diagnostics.mjs",',
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
    'AI graphics internal beta service-role RPC implementation readiness diagnostics failed:',
    ...failures.map((failure) => `- ${failure}`),
  ].join('\n'))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision: docs.decision,
  status: docs.status,
  tools: docs.toolsCovered.length,
  capabilities: docs.capabilitiesCovered.length,
  serviceRoleRpcsPrepared: docs.counts.serviceRoleRpcsPrepared,
  staticMigrationFilesPrepared: docs.counts.staticMigrationFilesPrepared,
  backendServiceAdaptersPrepared: docs.counts.backendServiceAdaptersPrepared,
  liveMigrationAppliesNow: docs.counts.liveMigrationAppliesNow,
  liveServiceRoleTransactionsNow: docs.counts.liveServiceRoleTransactionsNow,
  liveToolExecutionsNow: docs.counts.liveToolExecutionsNow,
  serviceRoleRpcMigrationAppliedNow: docs.booleans.serviceRoleRpcMigrationAppliedNow,
  serviceRoleSupabaseWritesApprovedNow: docs.booleans.serviceRoleSupabaseWritesApprovedNow,
  agentCanExecuteToolsNow: docs.booleans.agentCanExecuteToolsNow,
  runtimeReadyNow: docs.booleans.runtimeReadyNow,
  productionReadyNow: docs.booleans.productionReadyNow,
}, null, 2))
