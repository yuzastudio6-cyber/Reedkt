#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-APPROVED-SNAPSHOT-ROUTE-WRITE-RUNTIME-VALIDATION-1'
const dir = 'docs/external-beta/approved-snapshot-route-write-runtime-validation-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${dir}/source-audit.md`,
  `${dir}/validation-results.md`,
  `${dir}/readiness-gate.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/runtime-validation-record.json`,
  'docs/activation-phase-rp-external-beta-approved-snapshot-route-write-runtime-validation-1-results.md',
  'docs/external-beta/current-readiness-rollup-1/readiness-gate.md',
  'docs/external-beta/current-readiness-rollup-1/source-of-truth-audit.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'docs/external-beta/current-readiness-rollup-1/rollup-record.json',
  'docs/activation-phase-rp-external-product-beta-current-readiness-rollup-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-product-beta-current-readiness-rollup-1-next.md',
  'docs/production-beta-blocker-inventory.md',
  'server/middleware/auth.ts',
  'server/services/approved-snapshot-service.ts',
  'server/validation/approval-schemas.ts',
  'scripts/validation/rp-external-beta-approved-snapshot-route-write-runtime-validation-1-confirmed.mjs',
  'scripts/validation/rp-external-beta-approved-snapshot-route-write-runtime-validation-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs',
  'package.json',
]

const allowedChangedFiles = new Set(requiredFiles)

const requiredText = [
  packet,
  'completed_approved_snapshot_route_write_runtime_validation',
  'completed_guarded_in_process_approved_snapshot_route_write_readback_and_cleanup',
  'Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`',
  'POST /v1/edit-plans/:editPlanId/approved-snapshots',
  'route write fixture cleanup residue count: `0`',
  'validation cleanup status: `validation_ephemeral`',
  'validation cleanup immutable: `false`',
  'uuid_validation_auth_context_for_guarded_in_process_route_harness_only',
  'validation-only ephemeral cleanup path',
  'editPlanVersionId',
  'editSessionId',
  'RP-EXTERNAL-BETA-REMOTION-PRIVATE-PREVIEW-EXPORT-RUNTIME-VALIDATION-1',
  'blocked_external_product_beta_pending_remaining_runtime_gates_after_approved_snapshot_route_write_validation',
  'Product-ready end-to-end local OSS tools: `0`',
  'Internal beta unlocked: `false`',
  'External beta unlocked: `false`',
  'Production unlocked: `false`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'PR #577 remains open/draft/blocked and excluded',
  'fajinbvwhcjnutkaumkm` remains historical/context-only and is not used as the ReeditPro target',
]

const forbiddenPatterns = [
  /external beta (?:status|unlock|unlocked):\s*`?(ready|unlocked|approved|true|yes)`?/i,
  /internal beta (?:status|unlock|unlocked):\s*`?(ready|unlocked|approved|true|yes)`?/i,
  /production (?:status|unlock|unlocked):\s*`?(ready|unlocked|approved|true|yes)`?/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /frontendServiceRoleCredentialExposure"?\s*:\s*true/i,
  /serviceRoleSecretPayloadPrinted"?\s*:\s*true/i,
  /serviceRoleSecretPayloadPersistedInRepo"?\s*:\s*true/i,
  /databaseUrlPrinted"?\s*:\s*true/i,
  /databaseUrlPersistedInRepo"?\s*:\s*true/i,
  /supabaseUrlPrinted"?\s*:\s*true/i,
  /supabaseUrlPersistedInRepo"?\s*:\s*true/i,
  /persistentRowsCreated"?\s*:\s*true/i,
  /migrationApply"?\s*:\s*true/i,
  /workerExecution"?\s*:\s*true/i,
  /workerDispatch"?\s*:\s*true/i,
  /persistentWorkerLeaseClaim"?\s*:\s*true/i,
  /storageObjectCreation"?\s*:\s*true/i,
  /storageObjectRead"?\s*:\s*true/i,
  /signedUrlCreation"?\s*:\s*true/i,
  /publicArtifactCreation"?\s*:\s*true/i,
  /persistentCreditMutation"?\s*:\s*true/i,
  /persistentCreditReservationCreation"?\s*:\s*true/i,
  /creditSpend"?\s*:\s*true/i,
  /persistentJobEnqueue"?\s*:\s*true/i,
  /persistentJobEventWrite"?\s*:\s*true/i,
  /providerCall"?\s*:\s*true/i,
  /modelCall"?\s*:\s*true/i,
  /renderExport"?\s*:\s*true/i,
  /previewRenderExecution"?\s*:\s*true/i,
  /mediaProcessing"?\s*:\s*true/i,
  /privateMediaProcessing"?\s*:\s*true/i,
  /userMediaProcessing"?\s*:\s*true/i,
  /packageLockMutation"?\s*:\s*true/i,
  /dependency mutation:\s*`?true`?/i,
]

const forbiddenChangedFilePatterns = [
  /^package-lock\.json$/,
  /^supabase\//,
  /^docker\//,
  /^src\//,
  /^server\/routes\//,
  /^server\/workers\//,
  /^server\/providers\//,
  /^\.dockerignore$/,
  /requirements.*\.txt$/,
  /^node_modules\//,
  /^dist/,
  /^tmp\//,
  /\.(mp4|mov|mkv|webm|srt|mp3|wav|png|jpg|jpeg)$/i,
]

function fail(message) {
  console.error(`${packet} diagnostics failed: ${message}`)
  process.exit(1)
}

function read(file) {
  if (!fs.existsSync(file)) fail(`missing required file: ${file}`)
  return fs.readFileSync(file, 'utf8')
}

function gitLines(args) {
  const output = execFileSync('git', args, { env: gitEnv, encoding: 'utf8' }).trim()
  return output ? output.split('\n').filter(Boolean) : []
}

function changedFiles() {
  return [
    ...new Set([
      ...gitLines(['diff', '--name-only', 'HEAD']),
      ...gitLines(['diff', '--cached', '--name-only']),
      ...gitLines(['ls-files', '--others', '--exclude-standard']),
    ]),
  ]
}

for (const file of requiredFiles) read(file)

const corpus = requiredFiles.map((file) => read(file)).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched: ${pattern}`)
}

const authSource = read('server/middleware/auth.ts')
if (!authSource.includes('REEDITPRO_ROUTE_VALIDATION_AUTH_USER_ID')) fail('missing validation auth user env guard')
if (!authSource.includes('env.allowMockWithoutSupabase')) fail('validation auth must stay behind explicit mock-without-Supabase mode')
if (!authSource.includes('mock-user-runtime')) fail('default mock auth fallback missing')

const serviceSource = read('server/services/approved-snapshot-service.ts')
if (!serviceSource.includes('REEDITPRO_ROUTE_VALIDATION_EPHEMERAL_APPROVED_SNAPSHOT')) fail('missing ephemeral snapshot cleanup guard')
if (!serviceSource.includes("context.env.nodeEnv === 'test'")) fail('ephemeral snapshot cleanup must require NODE_ENV=test')
if (!serviceSource.includes('validationEphemeralApprovedSnapshotRouteWrite')) fail('missing request-body ephemeral cleanup marker')
if (!serviceSource.includes('edit_plan_version_id')) fail('approved snapshot service must write edit plan version id')
if (!serviceSource.includes('edit_session_id')) fail('approved snapshot service must write edit session id')

const schemaSource = read('server/validation/approval-schemas.ts')
if (!schemaSource.includes('editSessionId')) fail('schema missing editSessionId')
if (!schemaSource.includes('editPlanVersionId')) fail('schema missing editPlanVersionId')

const record = JSON.parse(read(`${dir}/runtime-validation-record.json`))
if (record.packet !== packet) fail('record packet mismatch')
if (record.decision !== 'completed_approved_snapshot_route_write_runtime_validation') fail('record decision mismatch')
if (record.execution !== 'completed_guarded_in_process_approved_snapshot_route_write_readback_and_cleanup') fail('record execution mismatch')
if (record.target?.projectRef !== 'wmyyttnynmteqgcdishd') fail('target ref mismatch')
if (record.run?.runId !== '2026-06-27T02-22-16-532Z-97b253a9') fail('run id mismatch')
if (record.run?.reportSha256 !== 'b2ca9e8ec9493060d631bd9387438b123eab6002db7c061c058edda736759441') fail('report checksum mismatch')
if (record.run?.manifestSha256 !== 'f2ff4e97b33d013f0864362a5272b24390153f5de9563ed52457ab55ead9b0c0') fail('manifest checksum mismatch')
if (record.routeReadback?.method !== 'POST') fail('route method mismatch')
if (record.routeReadback?.path !== '/v1/edit-plans/:editPlanId/approved-snapshots') fail('route path mismatch')
if (record.routeReadback?.httpStatus !== 201) fail('route status mismatch')
if (record.routeReadback?.ok !== true) fail('route ok mismatch')
if (record.routeReadback?.snapshotStatus !== 'approved') fail('snapshot status mismatch')
if (record.routeReadback?.validationCleanupStatus !== 'validation_ephemeral') fail('validation cleanup status mismatch')
if (record.routeReadback?.validationCleanupImmutable !== false) fail('validation cleanup immutable mismatch')
if (record.routeReadback?.idempotencyMethod !== 'POST') fail('idempotency method mismatch')
if (record.databaseReadback?.approvedSnapshotCount !== 1) fail('database approved snapshot count mismatch')
if (record.databaseReadback?.idempotencyKeyCount !== 1) fail('database idempotency count mismatch')
for (const key of ['workspaceIdMatches', 'projectIdMatches', 'editPlanIdMatches', 'editPlanVersionIdMatches', 'creditEstimateIdMatches', 'creditApprovalIdMatches', 'creditReservationIdMatches', 'approvedByUserIdMatches', 'idempotencyUserMatches', 'idempotencyWorkspaceMatches']) {
  if (record.databaseReadback?.[key] !== true) fail(`database readback mismatch: ${key}`)
}
for (const [key, value] of Object.entries(record.cleanupResidueReadback ?? {})) {
  if (value !== 0) fail(`cleanup residue mismatch: ${key}`)
}
if (record.routeAuthMode !== 'uuid_validation_auth_context_for_guarded_in_process_route_harness_only') fail('route auth mode mismatch')
if (record.routeRuntime?.appFactory !== 'createReeditProApiApp') fail('app factory mismatch')
if (record.routeRuntime?.serviceFactory !== 'createApprovedSnapshotService') fail('service factory mismatch')
if (record.routeRuntime?.routeWriteExecution !== 'guarded_in_process_approved_snapshot_create_route_only') fail('route write execution scope mismatch')
if (record.routeRuntime?.validationOnlyEphemeralSnapshotCleanup !== true) fail('ephemeral cleanup flag mismatch')
if (record.routeRuntime?.immutableSnapshotBehaviorSource !== 'RP-EXTERNAL-BETA-APPROVED-SNAPSHOT-PERSISTENCE-GUARDED-REMOTE-WRITE-1') fail('immutability source mismatch')
if (record.readiness?.approvedSnapshotRouteWriteRuntimeValidation !== 'completed_approved_snapshot_route_write_runtime_validation') fail('route write readiness mismatch')
if (record.readiness?.externalProductBeta !== 'blocked_pending_remaining_runtime_gates_after_approved_snapshot_route_write_validation') fail('external beta readiness mismatch')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')

const safety = record.safety ?? {}
const falseFlags = [
  'databaseUrlPrinted',
  'databaseUrlPersistedInRepo',
  'supabaseUrlPrinted',
  'supabaseUrlPersistedInRepo',
  'serviceRoleSecretPayloadPrinted',
  'serviceRoleSecretPayloadPersistedInRepo',
  'frontendServiceRoleCredentialExposure',
  'persistentRowsCreated',
  'migrationApply',
  'workerExecution',
  'workerDispatch',
  'persistentWorkerLeaseClaim',
  'storageObjectCreation',
  'storageObjectRead',
  'storageObjectDelete',
  'signedUrlCreation',
  'publicArtifactCreation',
  'creditMutation',
  'persistentCreditMutation',
  'persistentCreditReservationCreation',
  'creditSpend',
  'jobEnqueue',
  'persistentJobEnqueue',
  'jobEventWrite',
  'persistentJobEventWrite',
  'providerCall',
  'modelCall',
  'renderExport',
  'previewRenderExecution',
  'mediaProcessing',
  'privateMediaProcessing',
  'userMediaProcessing',
  'internalBetaUnlock',
  'externalBetaUnlock',
  'productionUnlock',
]
for (const key of falseFlags) {
  if (safety[key] !== false) fail(`safety flag must be false: ${key}`)
}
if (safety.serviceRoleSecretPayloadAccess !== 'guarded_ephemeral_route_runtime_service_role_key_payload_only') fail('service-role secret access scope mismatch')
if (safety.remoteSupabaseMutation !== 'guarded_generated_approved_snapshot_route_fixture_created_read_deleted_with_residue_zero') fail('remote Supabase mutation scope mismatch')
if (safety.sqlMutation !== 'guarded_generated_approved_snapshot_route_fixture_setup_and_cleanup_only') fail('SQL mutation scope mismatch')
if (safety.routeWriteExecution !== 'guarded_in_process_approved_snapshot_create_route_only') fail('route write safety scope mismatch')
if (safety.validationOnlyEphemeralSnapshotCleanup !== true) fail('validation cleanup safety mismatch')
if (safety.storageObjectResidueCount !== 0) fail('storage residue mismatch')

const rollup = JSON.parse(read('docs/external-beta/current-readiness-rollup-1/rollup-record.json'))
if (rollup.decision !== 'blocked_external_product_beta_pending_remaining_runtime_gates_after_approved_snapshot_route_write_validation') fail('rollup decision mismatch')
if (rollup.mainSupabaseTarget?.serviceRoleRouteWriteValidation !== 'completed_approved_snapshot_route_write_runtime_validation') fail('rollup route write status mismatch')
if (rollup.mainSupabaseTarget?.serviceRoleRouteWriteFixtureResidueCount !== 0) fail('rollup route write residue mismatch')
if (!rollup.requiredNextOwnerDecision?.includes('RP-EXTERNAL-BETA-REMOTION-PRIVATE-PREVIEW-EXPORT-RUNTIME-VALIDATION-1')) fail('rollup next milestone mismatch')
if (rollup.safety?.routeWriteExecution !== 'guarded_in_process_approved_snapshot_create_route_only') fail('rollup route write safety mismatch')
if (rollup.safety?.routeWriteFixtureResidueCount !== 0) fail('rollup route write residue mismatch')

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-external-beta-approved-snapshot-route-write-runtime-validation-1-confirmed'] !==
  'tsx scripts/validation/rp-external-beta-approved-snapshot-route-write-runtime-validation-1-confirmed.mjs'
) {
  fail('missing confirmed runner package script')
}
if (
  packageJson.scripts?.['rp-external-beta-approved-snapshot-route-write-runtime-validation-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-approved-snapshot-route-write-runtime-validation-1-diagnostics.mjs'
) {
  fail('missing diagnostics package script')
}

execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

for (const file of changedFiles()) {
  if (!allowedChangedFiles.has(file)) fail(`changed file is outside approved snapshot route write validation scope: ${file}`)
  for (const pattern of forbiddenChangedFilePatterns) {
    if (pattern.test(file)) fail(`forbidden changed file: ${file}`)
  }
  if (file.includes('/._') || file.startsWith('._') || file.includes('.DS_Store')) fail(`metadata artifact changed: ${file}`)
  if (file.startsWith('.env') || file.includes('/.env')) fail(`env file changed: ${file}`)
  const text = read(file)
  if (/sbp_[A-Za-z0-9_./=-]+/.test(text)) fail(`Supabase access token leaked in ${file}`)
  if (/https:\/\/[a-z0-9-]+\.supabase\.co/i.test(text)) fail(`Supabase URL leaked in ${file}`)
  const dbUrlRedacted = text.replaceAll('postgresql://[redacted]', '').replaceAll('postgres://[REDACTED]', '')
  if (/\bpostgres(?:ql)?:\/\/\S+/i.test(dbUrlRedacted)) fail(`DB URL leaked in ${file}`)
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(text)) fail(`forbidden claim in ${file}: ${pattern}`)
  }
}

console.log(`${packet} diagnostics passed`)
