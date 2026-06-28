#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-STAGING-RLS-STORAGE-READBACK-1'
const packetDir = 'docs/external-beta/qwen-runtime-persistence-staging-rls-storage-readback-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/rls-storage-readback-result.md`,
  `${packetDir}/migration-drift-result.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/qwen-runtime-persistence-staging-rls-storage-readback-record.json`,
  'docs/activation-phase-rp-external-beta-qwen-runtime-persistence-staging-rls-storage-readback-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-qwen-runtime-persistence-staging-service-role-route-gate-1.md',
  'scripts/validation/rp-external-beta-qwen-runtime-persistence-staging-rls-storage-readback-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-qwen-runtime-persistence-staging-migration-apply-1-diagnostics.mjs',
  'package.json',
]

const sourceFiles = [
  'docs/external-beta/qwen-runtime-persistence-staging-migration-apply-1/qwen-runtime-persistence-staging-migration-apply-record.json',
  'supabase/migrations/20260628000100_qwen2_5_vl_backend_runtime_persistence.sql',
  'database/test-sql/022_qwen2_5_vl_backend_runtime_persistence_tests.sql',
]

const requiredText = [
  packet,
  'completed_qwen_runtime_persistence_staging_rls_storage_readback_validation',
  'completed_read_only_staging_rls_storage_readback_no_remote_mutation',
  'wmyyttnynmteqgcdishd',
  'Reeditpro',
  'staging',
  '#1499',
  '#1495',
  '#577',
  '10f9ee71e7d4ccd8f7750cc3d4983b13541f8467',
  'passed_read_only_rls_storage_catalog_readback',
  'remote_database_is_up_to_date',
  'Baseline runtime tables present | `13`',
  'Baseline runtime tables with RLS enabled | `13`',
  'Runtime table policy count | `23`',
  'Required ReEditPro private buckets | `8`',
  'Public ReEditPro buckets | `0`',
  'Storage object anon policies | `0`',
  '`worker-temp` normal-user policy mentions | `0`',
  'QWEN constraints | `6`',
  'QWEN indexes | `5`',
  '`storage_object_records` signed URL columns | `0`',
  '`signed_url_events` URL value columns | `0`',
  'Runtime raw prompt columns | `0`',
  'Remote mutation: `false`',
  'SQL mutation: `false`',
  'Migration apply: `false`',
  'QWEN runtime execution: `false`',
  'Provider/model calls: `false`',
  'Worker dispatch: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-STAGING-SERVICE-ROLE-ROUTE-GATE-1',
]

const allowedChangedFiles = new Set(requiredFiles)
allowedChangedFiles.add('docs/activation-phase-rp-external-beta-qwen-runtime-persistence-staging-rls-storage-readback-1-results.md')
for (const file of [
  'docs/external-beta/qwen-runtime-persistence-staging-service-role-route-gate-1/source-audit.md',
  'docs/external-beta/qwen-runtime-persistence-staging-service-role-route-gate-1/route-gate-contract.md',
  'docs/external-beta/qwen-runtime-persistence-staging-service-role-route-gate-1/confirmation-gate.md',
  'docs/external-beta/qwen-runtime-persistence-staging-service-role-route-gate-1/service-role-secret-boundary.md',
  'docs/external-beta/qwen-runtime-persistence-staging-service-role-route-gate-1/readiness-gate.md',
  'docs/external-beta/qwen-runtime-persistence-staging-service-role-route-gate-1/safety-boundary.md',
  'docs/external-beta/qwen-runtime-persistence-staging-service-role-route-gate-1/validation-results.md',
  'docs/external-beta/qwen-runtime-persistence-staging-service-role-route-gate-1/qwen-runtime-persistence-staging-service-role-route-gate-record.json',
  'docs/activation-phase-rp-external-beta-qwen-runtime-persistence-staging-service-role-route-gate-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-qwen-runtime-persistence-staging-service-role-route-gate-1.md',
  'docs/implementation-prompts/prompt-rp-external-beta-qwen-runtime-persistence-staging-service-role-route-gate-1-confirmed.md',
  'docs/production-beta-blocker-inventory.md',
  'scripts/validation/rp-external-beta-qwen-runtime-persistence-staging-service-role-route-gate-1-diagnostics.mjs',
]) {
  allowedChangedFiles.add(file)
}

const forbiddenChangedPrefixes = [
  'package-lock.json',
  'supabase/migrations/',
  'database/migration-drafts/',
  'database/test-sql/',
  'docker/',
  '.github/',
  '.dockerignore',
  'requirements',
  '.env',
  'dist/',
  'dist-server/',
  'node_modules/',
  'src/',
  'server/routes/',
  'server/workers/',
  'server/providers/',
  'media/',
  'public/',
]

const forbiddenClaims = [
  /\b(remote mutation|SQL mutation|migration apply|provider\/model call|provider call|model call|QWEN runtime execution|worker execution|worker dispatch|route execution|Cloud Run invocation|signed URL creation|public artifact creation|deployment|production|final export):\s*`?(true|enabled|completed|passed)\b/i,
  /\bProduct-ready end-to-end local OSS tools:\s*`?[1-9]/i,
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

for (const file of [...requiredFiles, ...sourceFiles]) read(file)

const corpus = requiredFiles.map((file) => read(file)).join('\n')
for (const text of requiredText) if (!corpus.includes(text)) fail(`missing required text: ${text}`)

const record = JSON.parse(read(`${packetDir}/qwen-runtime-persistence-staging-rls-storage-readback-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== 'completed_qwen_runtime_persistence_staging_rls_storage_readback_validation') fail('decision mismatch')
if (record.execution !== 'completed_read_only_staging_rls_storage_readback_no_remote_mutation') fail('execution mismatch')
if (record.integrationBase !== '10f9ee71e7d4ccd8f7750cc3d4983b13541f8467') fail('integration base mismatch')
if (record.sourceApplyPr !== 1499) fail('missing #1499 source')
if (record.sourceApplyMergeSha !== '10f9ee71e7d4ccd8f7750cc3d4983b13541f8467') fail('source apply merge sha mismatch')
if (record.sourceAlignmentPr !== 1495) fail('missing #1495 source')
if (record.excludedPr !== 577) fail('missing #577 exclusion')
if (record.target?.projectRef !== 'wmyyttnynmteqgcdishd') fail('target ref mismatch')
if (record.target?.projectName !== 'Reeditpro') fail('target name mismatch')
if (record.target?.environment !== 'staging') fail('target environment mismatch')

const readback = record.readback ?? {}
if (readback.result !== 'passed_read_only_rls_storage_catalog_readback') fail('readback result mismatch')
if (readback.commandClass !== 'psql_read_only_catalog_selects') fail('readback command class mismatch')
if (readback.baselineRuntimeTablesPresent !== 13) fail('baseline table count mismatch')
if (readback.baselineRuntimeTablesRlsEnabled !== 13) fail('RLS table count mismatch')
if (readback.runtimeTablePolicyCount !== 23) fail('runtime policy count mismatch')
if (readback.requiredPrivateBuckets !== 8) fail('private bucket count mismatch')
if (readback.publicReeditproBuckets !== 0) fail('public bucket count mismatch')
if (readback.storageObjectAuthenticatedPolicies !== 6) fail('authenticated storage policy count mismatch')
if (readback.storageObjectAnonPolicies !== 0) fail('anon storage policy count mismatch')
if (readback.workerTempUserPolicyMentions !== 0) fail('worker-temp user policy count mismatch')
if (readback.qwenConstraints !== 6) fail('QWEN constraint count mismatch')
if (readback.qwenIndexes !== 5) fail('QWEN index count mismatch')
if (readback.storageObjectSignedUrlColumns !== 0) fail('storage signed URL column count mismatch')
if (readback.signedUrlEventUrlValueColumns !== 0) fail('signed URL value column count mismatch')
if (readback.runtimeRawPromptColumns !== 0) fail('raw prompt column count mismatch')

if (!Array.isArray(readback.storagePolicies) || readback.storagePolicies.length !== 6) fail('storage policy list mismatch')
for (const policy of [
  'reeditpro_project_editors_update_source_and_thumbnails',
  'reeditpro_project_editors_update_workspace_source_and_thumbnail',
  'reeditpro_project_editors_upload_source_and_thumbnails',
  'reeditpro_project_editors_upload_workspace_source_and_thumbnail',
  'reeditpro_project_members_read_project_objects',
  'reeditpro_project_members_read_workspace_project_objects',
]) {
  if (!readback.storagePolicies.includes(policy)) fail(`missing storage policy: ${policy}`)
}

const drift = record.migrationDrift ?? {}
if (drift.result !== 'remote_database_is_up_to_date') fail('migration drift result mismatch')
if (drift.remoteMutation !== false) fail('drift remote mutation must be false')
if (drift.migrationApply !== false) fail('drift migration apply must be false')

const safety = record.safety ?? {}
if (safety.secretManagerPayloadAccess !== 'ephemeral_db_url_only_not_printed_or_persisted') fail('secret access scope mismatch')
for (const key of [
  'remoteSupabaseMutation',
  'sqlMutation',
  'remoteMigrationApply',
  'providerModelCalls',
  'qwenRuntimeExecution',
  'workerDispatch',
  'routeExecution',
  'mediaProcessing',
  'signedUrlCreation',
  'publicArtifactCreation',
  'broadExternalBetaUnlock',
  'productionFinalExportUnlock',
]) {
  if (safety[key] !== false) fail(`safety flag must be false: ${key}`)
}
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')
if (record.nextMilestone !== 'RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-STAGING-SERVICE-ROLE-ROUTE-GATE-1') fail('next milestone mismatch')

const packageJson = JSON.parse(read('package.json'))
if (packageJson.scripts?.['rp-external-beta-qwen-runtime-persistence-staging-rls-storage-readback-1:diagnostics'] !== 'node scripts/validation/rp-external-beta-qwen-runtime-persistence-staging-rls-storage-readback-1-diagnostics.mjs') fail('missing package diagnostics script')
execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

const applyRecord = JSON.parse(read('docs/external-beta/qwen-runtime-persistence-staging-migration-apply-1/qwen-runtime-persistence-staging-migration-apply-record.json'))
if (applyRecord.nextMilestone !== packet) fail('apply packet does not route to readback packet')
if (applyRecord.safety?.remoteSupabaseMutation !== true) fail('apply packet must record the prior bounded mutation')

const changed = [
  ...new Set([
    ...gitLines(['diff', '--name-only', 'HEAD']),
    ...gitLines(['diff', '--cached', '--name-only']),
    ...gitLines(['ls-files', '--others', '--exclude-standard']),
  ]),
]

for (const file of changed) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  for (const blocked of forbiddenChangedPrefixes) if (file === blocked || file.startsWith(blocked)) fail(`blocked file scope changed: ${file}`)
  if (file.includes('/._') || file.startsWith('._') || file.includes('.DS_Store')) fail(`metadata artifact changed: ${file}`)
  const text = read(file)
  if (/sbp_[A-Za-z0-9_./=-]+/.test(text)) fail(`Supabase access token leaked in ${file}`)
  if (/https:\/\/[a-z0-9-]+\.supabase\.co/i.test(text)) fail(`Supabase URL leaked in ${file}`)
  const redactedDbText = text.replaceAll('postgresql://[redacted]', '').replaceAll('postgres://[REDACTED]', '')
  if (/\bpostgres(?:ql)?:\/\/\S+/i.test(redactedDbText)) fail(`DB URL leaked in ${file}`)
  if (/\b(api[_-]?key|service[_-]?key|service[_-]?role[_-]?key|secret[_-]?key)\s*[:=]\s*['"][^'"]+['"]/i.test(text)) fail(`secret-like assignment in ${file}`)
  if (!file.startsWith('scripts/validation/')) {
    for (const pattern of forbiddenClaims) if (pattern.test(text)) fail(`forbidden claim in ${file}: ${pattern}`)
  }
}

console.log(`${packet} diagnostics passed`)
console.log('Decision: completed_qwen_runtime_persistence_staging_rls_storage_readback_validation')
console.log('Next milestone: RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-STAGING-SERVICE-ROLE-ROUTE-GATE-1')
