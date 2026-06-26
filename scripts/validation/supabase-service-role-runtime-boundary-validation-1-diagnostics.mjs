#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'

const packet = 'SUPABASE-SERVICE-ROLE-RUNTIME-BOUNDARY-VALIDATION-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const reportPath =
  'docs/activation-supabase-service-role-runtime-boundary-validation-1-reports/service_role_runtime_boundary_validation_report.json'
const manifestPath =
  'docs/activation-supabase-service-role-runtime-boundary-validation-1-reports/service_role_runtime_boundary_validation_manifest.json'

const requiredFiles = [
  'docs/supabase-worker-runtime/supabase-service-role-runtime-boundary-validation-1.md',
  'docs/supabase-worker-runtime/supabase-service-role-runtime-boundary-validation-1-record.json',
  'docs/activation-phase-supabase-service-role-runtime-boundary-validation-1-results.md',
  reportPath,
  manifestPath,
  'docs/implementation-prompts/prompt-rp-internal-beta-approved-snapshot-service-role-persistence-implementation-1.md',
  'docs/implementation-prompts/prompt-supabase-service-role-runtime-boundary-validation-1.md',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-isolated-target-readback-1.md',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-isolated-target-readback-1-record.json',
  'docs/product-internal-beta-readiness-aggregation.md',
  'docs/production-beta-blocker-inventory.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'implementation-status-and-next-phase.md',
  'scripts/validation/supabase-service-role-runtime-boundary-validation-1.mjs',
  'scripts/validation/supabase-service-role-runtime-boundary-validation-1-diagnostics.mjs',
  'package.json',
]

const packetFiles = [
  'docs/supabase-worker-runtime/supabase-service-role-runtime-boundary-validation-1.md',
  'docs/supabase-worker-runtime/supabase-service-role-runtime-boundary-validation-1-record.json',
  'docs/activation-phase-supabase-service-role-runtime-boundary-validation-1-results.md',
  'docs/implementation-prompts/prompt-rp-internal-beta-approved-snapshot-service-role-persistence-implementation-1.md',
]

const allowedChangedFiles = new Set([
  ...requiredFiles,
  'scripts/validation/supabase-worker-runtime-transactional-rpc-isolated-target-readback-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-isolated-target-migration-chain-apply-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-isolated-target-creation-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs',
])

const requiredText = [
  packet,
  'completed_service_role_runtime_boundary_validation',
  'completed_guarded_secret_metadata_and_static_backend_boundary_validation_no_service_role_payload_or_runtime_execution',
  'REEDITPRO_CONFIRM_SUPABASE_SERVICE_ROLE_RUNTIME_BOUNDARY_VALIDATION=true',
  'reeditpro-clean-staging-isolated-v1',
  'fajinbvwhcjnutkaumkm',
  'REEDITPRO_CLEAN_STAGING_SUPABASE_DB_URL',
  'SUPABASE_ACCESS_TOKEN',
  'Secret Manager metadata read: `true`',
  'Secret Manager payload access: `false`',
  'Service-role secret payload access: `false`',
  'Credential payload printed: `false`',
  'Credential payload persisted in repo: `false`',
  'Remote Supabase command: `false`',
  'SQL execution: `false`',
  'SQL mutation: `none`',
  'RPC execution: `false`',
  'Service-role route execution: `false`',
  'Worker execution: `false`',
  'Worker dispatch: `false`',
  'Worker lease claim: `false`',
  'Storage object creation: `false`',
  'Storage object read: `false`',
  'Signed URL creation: `false`',
  'Public artifact creation: `false`',
  'Internal beta unlocked: `false`',
  'External beta unlocked: `false`',
  'Production unlocked: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'ready_for_separate_service_role_persistence_implementation_no_supabase_write',
  'RP-INTERNAL-BETA-APPROVED-SNAPSHOT-SERVICE-ROLE-PERSISTENCE-IMPLEMENTATION-1',
  'PR #577',
]

const forbiddenPatterns = [
  /secretManagerPayloadAccess"?\s*:\s*true/i,
  /serviceRoleSecretPayloadAccess"?\s*:\s*true/i,
  /credentialPayloadPrinted"?\s*:\s*true/i,
  /credentialPayloadPersistedInRepo"?\s*:\s*true/i,
  /remoteSupabaseCommand"?\s*:\s*true/i,
  /remoteSupabaseMutation"?\s*:\s*true/i,
  /sqlExecution"?\s*:\s*true/i,
  /sqlMutation"?\s*:\s*true/i,
  /rpcExecution"?\s*:\s*true/i,
  /serviceRoleRouteExecution"?\s*:\s*true/i,
  /routeExecution"?\s*:\s*true/i,
  /workerExecution"?\s*:\s*true/i,
  /workerDispatch"?\s*:\s*true/i,
  /workerLeaseClaim"?\s*:\s*true/i,
  /storageObjectCreation"?\s*:\s*true/i,
  /storageObjectRead"?\s*:\s*true/i,
  /signedUrlCreation"?\s*:\s*true/i,
  /publicArtifactCreation"?\s*:\s*true/i,
  /internalBetaUnlock"?\s*:\s*true/i,
  /externalBetaUnlock"?\s*:\s*true/i,
  /productionUnlock"?\s*:\s*true/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
]

const secretPatterns = [
  [/sbp_[A-Za-z0-9_./=-]+/, 'Supabase access token leaked'],
  [/\bpostgres(?:ql)?:\/\/\S+/i, 'database URL leaked'],
  [/https:\/\/[a-z0-9-]+\.supabase\.co/i, 'Supabase URL leaked'],
  [/"db_pass"\s*:\s*"[^"]+"/i, 'database password leaked'],
  [/"jwt_secret"\s*:\s*"[^"]+"/i, 'JWT secret leaked'],
]

function fail(message) {
  console.error(`${packet} diagnostics failed: ${message}`)
  process.exit(1)
}

function read(file) {
  if (!fs.existsSync(file)) fail(`missing required file: ${file}`)
  return fs.readFileSync(file, 'utf8')
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
}

function gitLines(args) {
  return execFileSync('git', args, { env: gitEnv, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean)
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

const corpus = requiredFiles
  .filter((file) => !file.startsWith('scripts/validation/') && file !== 'package.json')
  .map((file) => read(file))
  .join('\n')

for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}

const packetCorpus = packetFiles.map((file) => read(file)).join('\n')
for (const pattern of forbiddenPatterns) {
  if (pattern.test(packetCorpus)) fail(`forbidden claim matched in packet docs: ${pattern}`)
}

const record = JSON.parse(read('docs/supabase-worker-runtime/supabase-service-role-runtime-boundary-validation-1-record.json'))
if (record.packet !== packet) fail('record packet mismatch')
if (record.decision !== 'completed_service_role_runtime_boundary_validation') fail('record decision mismatch')
if (record.execution !== 'completed_guarded_secret_metadata_and_static_backend_boundary_validation_no_service_role_payload_or_runtime_execution') fail('record execution mismatch')
if (record.target?.projectRef !== 'fajinbvwhcjnutkaumkm') fail('target project ref mismatch')
if (record.secretManagerMetadata?.metadataRead !== true) fail('secret metadata read must be true')
if (record.secretManagerMetadata?.payloadAccess !== false) fail('secret payload access must be false')
if (record.secretManagerMetadata?.cleanDbUrlSecret?.version !== '2') fail('clean DB URL secret version mismatch')
if (record.secretManagerMetadata?.cleanDbUrlSecret?.state !== 'ENABLED') fail('clean DB URL secret version must be enabled')
if (record.secretManagerMetadata?.supabaseAccessTokenSecret?.latestVersion !== '5') fail('access token version mismatch')
if (record.secretManagerMetadata?.supabaseAccessTokenSecret?.state !== 'ENABLED') fail('access token latest version must be enabled')
if (record.staticBoundary?.scaffoldRouteCount !== 8) fail('scaffold route count mismatch')
if (record.staticBoundary?.scaffoldBoundaryTokensPresent !== true) fail('scaffold boundary token mismatch')
if (!Array.isArray(record.staticBoundary?.scaffoldUnsafeMatches) || record.staticBoundary.scaffoldUnsafeMatches.length !== 0) fail('scaffold unsafe matches must be empty')
if (record.staticBoundary?.guardBoundaryTokensPresent !== true) fail('guard boundary token mismatch')
if (record.staticBoundary?.credentialBoundaryTokensPresent !== true) fail('credential boundary token mismatch')
if (record.staticBoundary?.orchestratorBoundaryTokensPresent !== true) fail('orchestrator boundary token mismatch')
if (!Array.isArray(record.staticBoundary?.frontendServiceRoleExposure) || record.staticBoundary.frontendServiceRoleExposure.length !== 0) fail('frontend service-role exposure must be empty')
if (record.staticBoundary?.routeHandlerRegistration !== 0) fail('route handler registration must remain 0')
if (record.staticBoundary?.mockHandlerRegistration !== 0) fail('mock handler registration must remain 0')
if (record.readiness?.approvedSnapshotServiceRolePersistence !== 'ready_for_separate_service_role_persistence_implementation_no_supabase_write') fail('approved snapshot persistence readiness mismatch')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.packageLock !== 'unchanged') fail('package-lock mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts mismatch')
if (record.nextMilestone !== 'RP-INTERNAL-BETA-APPROVED-SNAPSHOT-SERVICE-ROLE-PERSISTENCE-IMPLEMENTATION-1') fail('next milestone mismatch')

for (const key of [
  'secretManagerPayloadAccess',
  'serviceRoleSecretPayloadAccess',
  'credentialPayloadPrinted',
  'credentialPayloadPersistedInRepo',
  'remoteSupabaseCommand',
  'remoteSupabaseMutation',
  'sqlExecution',
  'sqlMutation',
  'rpcExecution',
  'serviceRoleRouteExecution',
  'routeExecution',
  'workerExecution',
  'workerDispatch',
  'workerLeaseClaim',
  'storageObjectCreation',
  'storageObjectRead',
  'signedUrlCreation',
  'publicArtifactCreation',
  'creditMutation',
  'creditReservationCreation',
  'jobEnqueue',
  'jobEventWrite',
  'providerCall',
  'modelCall',
  'renderExport',
  'internalBetaUnlock',
  'externalBetaUnlock',
  'productionUnlock',
]) {
  if (record.safety?.[key] !== false) fail(`${key} must remain false`)
}

const report = JSON.parse(read(reportPath))
if (report.packet !== packet) fail('report packet mismatch')
if (report.decision !== record.decision) fail('report decision mismatch')
if (report.runId !== record.evidence?.runId) fail('report run ID mismatch')
if (report.safety?.secretManagerMetadataRead !== true) fail('report secret metadata read must be true')
if (report.safety?.secretManagerPayloadAccess !== false) fail('report secret payload access must be false')
if (report.safety?.serviceRoleSecretPayloadAccess !== false) fail('report service-role payload access must be false')
if (report.safety?.remoteSupabaseCommand !== false) fail('report remote Supabase command must be false')
if (report.safety?.sqlExecution !== false) fail('report SQL execution must be false')
if (report.safety?.serviceRoleRouteExecution !== false) fail('report service-role route execution must be false')
if (report.safety?.workerExecution !== false) fail('report worker execution must be false')

const manifest = JSON.parse(read(manifestPath))
if (!manifest.artifacts?.some((artifact) => artifact.sha256 === record.evidence?.reportSha256)) fail('report checksum missing from manifest')
if (sha256(reportPath) !== record.evidence?.reportSha256) fail('report checksum mismatch')
if (sha256(manifestPath) !== record.evidence?.manifestSha256) fail('manifest checksum mismatch')

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['supabase-service-role:runtime-boundary-validation-1'] !==
  'node scripts/validation/supabase-service-role-runtime-boundary-validation-1.mjs'
) {
  fail('missing runner package script')
}
if (
  packageJson.scripts?.['supabase-service-role:runtime-boundary-validation-1:diagnostics'] !==
  'node scripts/validation/supabase-service-role-runtime-boundary-validation-1-diagnostics.mjs'
) {
  fail('missing diagnostics package script')
}

execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

for (const file of changedFiles()) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  if (file === 'package-lock.json') fail('package-lock changed')
  if (file.endsWith('.sql')) fail(`SQL file changed: ${file}`)
  if (file.startsWith('supabase/migrations/') || file.startsWith('supabase/functions/')) fail(`Supabase source changed: ${file}`)
  if (file.startsWith('server/') || file.startsWith('src/') || file.startsWith('docker/') || file.startsWith('database/')) fail(`runtime/source path changed: ${file}`)
  if (file.startsWith('.env') || file.includes('/.env')) fail(`env file changed: ${file}`)
  if (file.includes('/._') || file.startsWith('._') || file.includes('.DS_Store')) fail(`metadata artifact changed: ${file}`)
  const text = read(file)
    .replaceAll('postgresql://[redacted]', '')
    .replaceAll('https://[redacted].supabase.co', '')
    .replaceAll('db.[redacted].supabase.co', '')
    .replace(/\\bpostgres\(\?:ql\)\?:\\\/\\\/\\S\+/g, '')
    .replace(/postgres\(\?:ql\)\?:\\\/\\\/\\S\+/g, '')
  for (const [pattern, message] of secretPatterns) {
    if (pattern.test(text)) fail(`${message} in ${file}`)
  }
}

console.log(`${packet} diagnostics passed`)
console.log(`Decision: ${record.decision}`)
console.log(`Next milestone: ${record.nextMilestone}`)
