#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-ISOLATED-TARGET-READBACK-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const reportPath = 'docs/activation-supabase-worker-runtime-transactional-rpc-isolated-target-readback-1-reports/worker_runtime_transactional_rpc_isolated_target_readback_report.json'
const manifestPath = 'docs/activation-supabase-worker-runtime-transactional-rpc-isolated-target-readback-1-reports/worker_runtime_transactional_rpc_isolated_target_readback_manifest.json'

const requiredFiles = [
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-isolated-target-readback-1.md',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-isolated-target-readback-1-record.json',
  'docs/activation-phase-supabase-worker-runtime-transactional-rpc-isolated-target-readback-1-results.md',
  reportPath,
  manifestPath,
  'docs/implementation-prompts/prompt-supabase-service-role-runtime-boundary-validation-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-isolated-target-migration-chain-apply-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-isolated-target-migration-chain-apply-1-record.json',
  'docs/product-internal-beta-readiness-aggregation.md',
  'docs/production-beta-blocker-inventory.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'implementation-status-and-next-phase.md',
  'scripts/validation/supabase-worker-runtime-transactional-rpc-isolated-target-readback-1.mjs',
  'scripts/validation/supabase-worker-runtime-transactional-rpc-isolated-target-readback-1-diagnostics.mjs',
  'package.json',
]

const packetFiles = [
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-isolated-target-readback-1.md',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-isolated-target-readback-1-record.json',
  'docs/activation-phase-supabase-worker-runtime-transactional-rpc-isolated-target-readback-1-results.md',
  'docs/implementation-prompts/prompt-supabase-service-role-runtime-boundary-validation-1.md',
]

const allowedChangedFiles = new Set([
  ...packetFiles,
  reportPath,
  manifestPath,
  'docs/product-internal-beta-readiness-aggregation.md',
  'docs/production-beta-blocker-inventory.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'implementation-status-and-next-phase.md',
  'scripts/validation/supabase-worker-runtime-transactional-rpc-isolated-target-readback-1.mjs',
  'scripts/validation/supabase-worker-runtime-transactional-rpc-isolated-target-readback-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-isolated-target-migration-chain-apply-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-isolated-target-creation-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs',
  'package.json',
])

const requiredText = [
  packet,
  'completed_worker_runtime_transactional_rpc_isolated_target_readback',
  'completed_guarded_readonly_worker_rpc_catalog_readback_no_runtime_execution',
  'REEDITPRO_CONFIRM_SUPABASE_WORKER_RUNTIME_TRANSACTIONAL_RPC_ISOLATED_TARGET_READBACK=true',
  'reeditpro-clean-staging-isolated-v1',
  'fajinbvwhcjnutkaumkm',
  'REEDITPRO_CLEAN_STAGING_SUPABASE_DB_URL',
  'psql readonly worker_runtime catalog query [db-url redacted]',
  'RPC execution: `false`',
  'Worker execution: `false`',
  'Worker dispatch: `false`',
  'Worker lease claim: `false`',
  'Service-role route execution: `false`',
  'SQL mutation: `none`',
  'Internal beta unlocked: `false`',
  'External beta unlocked: `false`',
  'Production unlocked: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'SUPABASE-SERVICE-ROLE-RUNTIME-BOUNDARY-VALIDATION-1',
  'PR #577',
]

const forbiddenPatterns = [
  /credentialPayloadPrinted"?\s*:\s*true/i,
  /credentialPayloadPersistedInRepo"?\s*:\s*true/i,
  /remoteSupabaseMutation"?\s*:\s*true/i,
  /sqlMutation"?\s*:\s*true/i,
  /rpcExecution"?\s*:\s*true/i,
  /serviceRoleRouteExecution"?\s*:\s*true/i,
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

const record = JSON.parse(read('docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-isolated-target-readback-1-record.json'))
if (record.packet !== packet) fail('record packet mismatch')
if (record.decision !== 'completed_worker_runtime_transactional_rpc_isolated_target_readback') fail('record decision mismatch')
if (record.execution !== 'completed_guarded_readonly_worker_rpc_catalog_readback_no_runtime_execution') fail('record execution mismatch')
if (record.target?.projectRef !== 'fajinbvwhcjnutkaumkm') fail('target project ref mismatch')
if (record.readback?.schemaPresent !== true) fail('schema presence mismatch')
if (record.readback?.schemaServiceRoleUsage !== true) fail('service-role schema usage mismatch')
if (record.readback?.schemaAnonUsageBlocked !== true) fail('anon schema usage blocker mismatch')
if (record.readback?.schemaAuthenticatedUsageBlocked !== true) fail('authenticated schema usage blocker mismatch')
if (record.readback?.schemaPublicUsageBlocked !== true) fail('public schema usage blocker mismatch')
for (const key of [
  'missingFunctions',
  'nonSecurityDefinerFunctions',
  'functionsMissingServiceRoleExecute',
  'functionsExecutableByAnon',
  'functionsExecutableByAuthenticated',
  'functionsExecutableByPublic',
  'missingTables',
  'tablesMissingRls',
  'tablesMissingServiceRoleDml',
  'tablesSelectableByAnon',
  'tablesSelectableByAuthenticated',
  'tablesSelectableByPublic',
]) {
  if (!Array.isArray(record.readback?.[key]) || record.readback[key].length !== 0) fail(`${key} must be empty`)
}
if (record.safety?.secretManagerPayloadAccess !== true) fail('secret payload access must be true and guarded')
if (record.safety?.credentialPayloadPrinted !== false) fail('credential payload printed must be false')
if (record.safety?.credentialPayloadPersistedInRepo !== false) fail('credential payload persisted must be false')
if (record.safety?.remoteSupabaseReadCommand !== true) fail('remote read must be true')
if (record.safety?.remoteSupabaseMutation !== false) fail('remote mutation must be false')
if (record.safety?.sqlExecution !== true) fail('read-only SQL execution must be true')
if (record.safety?.sqlMutation !== false) fail('SQL mutation must be false')
if (record.safety?.rpcExecution !== false) fail('RPC execution must be false')
if (record.safety?.serviceRoleRouteExecution !== false) fail('service-role route execution must be false')
if (record.safety?.workerExecution !== false) fail('worker execution must be false')
if (record.safety?.workerDispatch !== false) fail('worker dispatch must be false')
if (record.safety?.workerLeaseClaim !== false) fail('worker lease claim must be false')
if (record.safety?.internalBetaUnlock !== false) fail('internal beta unlock must be false')
if (record.safety?.externalBetaUnlock !== false) fail('external beta unlock must be false')
if (record.safety?.productionUnlock !== false) fail('production unlock must be false')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.packageLock !== 'unchanged') fail('package-lock mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts mismatch')
if (record.nextMilestone !== 'SUPABASE-SERVICE-ROLE-RUNTIME-BOUNDARY-VALIDATION-1') fail('next milestone mismatch')

const report = JSON.parse(read(reportPath))
if (report.packet !== packet) fail('report packet mismatch')
if (report.decision !== record.decision) fail('report decision mismatch')
if (report.runId !== record.evidence?.runId) fail('report run ID mismatch')
if (report.safety?.credentialPayloadPrinted !== false) fail('report credential payload printed must be false')
if (report.safety?.credentialPayloadPersistedInRepo !== false) fail('report credential payload persisted must be false')
if (report.safety?.remoteSupabaseMutation !== false) fail('report remote mutation must be false')
if (report.safety?.sqlMutation !== false) fail('report SQL mutation must be false')
if (report.safety?.rpcExecution !== false) fail('report RPC execution must be false')
if (report.safety?.workerExecution !== false) fail('report worker execution must be false')

const manifest = JSON.parse(read(manifestPath))
if (!manifest.artifacts?.some((artifact) => artifact.sha256 === record.evidence?.reportSha256)) fail('report checksum missing from manifest')
if (!manifest.artifacts?.some((artifact) => artifact.sha256 === record.evidence?.manifestSha256)) fail('manifest checksum missing from manifest')

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['supabase-worker-runtime:transactional-rpc-isolated-target-readback-1'] !==
  'node scripts/validation/supabase-worker-runtime-transactional-rpc-isolated-target-readback-1.mjs'
) {
  fail('missing runner package script')
}
if (
  packageJson.scripts?.['supabase-worker-runtime:transactional-rpc-isolated-target-readback-1:diagnostics'] !==
  'node scripts/validation/supabase-worker-runtime-transactional-rpc-isolated-target-readback-1-diagnostics.mjs'
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
    .replaceAll('db.[redacted].supabase.co', '')
    .replaceAll('psql readonly worker_runtime catalog query [db-url redacted]', '')
  for (const [pattern, message] of secretPatterns) {
    if (pattern.test(text)) fail(`${message} in ${file}`)
  }
}

console.log(`${packet} diagnostics passed`)
console.log(`Decision: ${record.decision}`)
console.log(`Next milestone: ${record.nextMilestone}`)
