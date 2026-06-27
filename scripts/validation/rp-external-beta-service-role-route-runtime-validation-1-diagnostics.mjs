#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-SERVICE-ROLE-ROUTE-RUNTIME-VALIDATION-1'
const dir = 'docs/external-beta/service-role-route-runtime-validation-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${dir}/source-audit.md`,
  `${dir}/validation-results.md`,
  `${dir}/readiness-gate.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/runtime-validation-record.json`,
  'docs/activation-phase-rp-external-beta-service-role-route-runtime-validation-1-results.md',
  'docs/external-beta/current-readiness-rollup-1/readiness-gate.md',
  'docs/external-beta/current-readiness-rollup-1/source-of-truth-audit.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'docs/external-beta/current-readiness-rollup-1/rollup-record.json',
  'docs/activation-phase-rp-external-product-beta-current-readiness-rollup-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-product-beta-current-readiness-rollup-1-next.md',
  'docs/production-beta-blocker-inventory.md',
  'scripts/validation/rp-external-beta-service-role-route-runtime-validation-1-confirmed.mjs',
  'scripts/validation/rp-external-beta-service-role-route-runtime-validation-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-private-artifact-storage-access-guarded-remote-write-1-diagnostics.mjs',
  'package.json',
]

const allowedChangedFiles = new Set(requiredFiles)

const requiredText = [
  packet,
  'completed_service_role_storage_object_metadata_read_route_runtime_validation',
  'completed_guarded_in_process_service_role_storage_object_metadata_read_route_validation',
  'Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`',
  'GET /v1/storage-objects/:storageObjectRecordId',
  'canonicalOnly: `true`',
  'signed URL creation: `false`',
  'public artifact creation: `false`',
  'route fixture cleanup residue count: `0`',
  'generated mock auth context for guarded in-process route harness only',
  'service-role route write validation remains blocked pending approved snapshot route write runtime validation',
  'blocked_external_product_beta_pending_remaining_runtime_gates_after_service_role_route_read_validation',
  'RP-EXTERNAL-BETA-APPROVED-SNAPSHOT-ROUTE-WRITE-RUNTIME-VALIDATION-1',
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
  /routeWriteExecution"?\s*:\s*true/i,
  /workerExecution"?\s*:\s*true/i,
  /workerDispatch"?\s*:\s*true/i,
  /persistentWorkerLeaseClaim"?\s*:\s*true/i,
  /storageObjectCreation"?\s*:\s*true/i,
  /storageObjectRead"?\s*:\s*true/i,
  /signedUrlCreation"?\s*:\s*true/i,
  /publicArtifactCreation"?\s*:\s*true/i,
  /persistentCreditMutation"?\s*:\s*true/i,
  /persistentCreditReservationCreation"?\s*:\s*true/i,
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
  /^supabase\/migrations\//,
  /^docker\//,
  /^src\//,
  /^server\/(?!.*smoke).*\.ts$/,
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

const record = JSON.parse(read(`${dir}/runtime-validation-record.json`))
if (record.packet !== packet) fail('record packet mismatch')
if (record.decision !== 'completed_service_role_storage_object_metadata_read_route_runtime_validation') fail('record decision mismatch')
if (record.execution !== 'completed_guarded_in_process_service_role_storage_object_metadata_read_route_validation') fail('record execution mismatch')
if (record.target?.projectRef !== 'wmyyttnynmteqgcdishd') fail('target ref mismatch')
if (!record.run?.runId) fail('missing run id')
if (!record.run?.reportSha256 || !record.run?.manifestSha256) fail('missing artifact checksums')
if (!record.run?.routeReadbackSha256 || !record.run?.fixtureSetupSha256 || !record.run?.cleanupResidueSha256) fail('missing route readback checksums')
if (record.routeReadback?.method !== 'GET') fail('route method mismatch')
if (record.routeReadback?.path !== '/v1/storage-objects/:storageObjectRecordId') fail('route path mismatch')
if (record.routeReadback?.httpStatus !== 200) fail('route status mismatch')
if (record.routeReadback?.ok !== true) fail('route ok mismatch')
if (record.routeReadback?.canonicalOnly !== true) fail('canonicalOnly mismatch')
if (record.routeReadback?.bucketName !== 'previews') fail('bucket mismatch')
if (record.routeReadback?.objectPurpose !== 'preview') fail('object purpose mismatch')
if (record.routeReadback?.databaseObjectPurpose !== 'preview_render') fail('database object purpose mismatch')
if (record.routeReadback?.status !== 'ready') fail('route object status mismatch')
if (record.routeReadback?.signedUrlReturned !== false) fail('signed URL return mismatch')
if (record.routeReadback?.publicArtifactCreated !== false) fail('public artifact flag mismatch')
if (record.routeAuthMode !== 'generated_mock_auth_context_for_guarded_in_process_route_harness_only') fail('route auth mode mismatch')
if (record.routeRuntime?.appFactory !== 'createReeditProApiApp') fail('app factory mismatch')
if (record.routeRuntime?.serviceFactory !== 'createUploadService') fail('service factory mismatch')
if (record.routeRuntime?.adminClient !== 'supabase_service_role_client_from_ephemeral_process_env') fail('admin client scope mismatch')
if (record.routeRuntime?.routeWriteExecution !== false) fail('route write execution flag mismatch')
if (record.cleanupResidueReadback?.workspaces !== 0) fail('workspace residue mismatch')
if (record.cleanupResidueReadback?.workspaceMembers !== 0) fail('workspace member residue mismatch')
if (record.cleanupResidueReadback?.projects !== 0) fail('project residue mismatch')
if (record.cleanupResidueReadback?.storageObjectRecords !== 0) fail('storage object record residue mismatch')
if (record.readiness?.serviceRoleRouteRuntimeValidation !== 'completed_service_role_storage_object_metadata_read_route_runtime_validation') fail('route readiness mismatch')
if (record.readiness?.serviceRoleRouteWriteValidation !== 'blocked_pending_approved_snapshot_route_write_runtime_validation') fail('route write readiness mismatch')
if (record.readiness?.externalProductBeta !== 'blocked_pending_remaining_runtime_gates_after_service_role_route_read_validation') fail('external beta readiness mismatch')
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
  'routeWriteExecution',
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
  'creditReservationCreation',
  'persistentCreditReservationCreation',
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
if (safety.remoteSupabaseMutation !== 'guarded_generated_route_metadata_fixture_created_read_deleted_with_residue_zero') fail('remote Supabase mutation scope mismatch')
if (safety.sqlMutation !== 'guarded_generated_route_fixture_setup_and_cleanup_only') fail('SQL mutation scope mismatch')
if (safety.serviceRoleRouteExecution !== 'guarded_in_process_storage_object_metadata_read_route_only') fail('service-role route execution scope mismatch')
if (safety.routeExecution !== 'guarded_in_process_get_storage_object_metadata_route_only') fail('route execution scope mismatch')
if (safety.storageObjectResidueCount !== 0) fail('storage residue mismatch')

const rollup = JSON.parse(read('docs/external-beta/current-readiness-rollup-1/rollup-record.json'))
if (rollup.decision !== 'blocked_external_product_beta_pending_remaining_runtime_gates_after_service_role_route_read_validation') fail('rollup decision mismatch')
if (rollup.mainSupabaseTarget?.serviceRoleRouteRuntimeValidation !== 'completed_service_role_storage_object_metadata_read_route_runtime_validation') fail('rollup route status mismatch')
if (rollup.mainSupabaseTarget?.serviceRoleRouteWriteValidation !== 'blocked_pending_approved_snapshot_route_write_runtime_validation') fail('rollup route write status mismatch')
if (rollup.mainSupabaseTarget?.serviceRoleRouteFixtureResidueCount !== 0) fail('rollup route residue mismatch')
if (!rollup.requiredNextOwnerDecision?.includes('RP-EXTERNAL-BETA-APPROVED-SNAPSHOT-ROUTE-WRITE-RUNTIME-VALIDATION-1')) fail('rollup next milestone mismatch')
if (rollup.safety?.serviceRoleRouteExecution !== 'guarded_in_process_storage_object_metadata_read_route_only') fail('rollup route execution scope mismatch')
if (rollup.safety?.routeWriteExecution !== false) fail('rollup route write flag mismatch')
if (rollup.safety?.signedUrlCreation !== false) fail('rollup signed URL flag mismatch')
if (rollup.safety?.publicArtifactCreation !== false) fail('rollup public artifact flag mismatch')
if (rollup.safety?.persistentRowsCreated !== false) fail('rollup persistent rows flag mismatch')

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-external-beta-service-role-route-runtime-validation-1-confirmed'] !==
  'tsx scripts/validation/rp-external-beta-service-role-route-runtime-validation-1-confirmed.mjs'
) {
  fail('missing confirmed runner package script')
}
if (
  packageJson.scripts?.['rp-external-beta-service-role-route-runtime-validation-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-service-role-route-runtime-validation-1-diagnostics.mjs'
) {
  fail('missing diagnostics package script')
}

execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

for (const file of changedFiles()) {
  if (!allowedChangedFiles.has(file)) {
    fail(`changed file is outside service-role route validation scope: ${file}`)
  }
  for (const pattern of forbiddenChangedFilePatterns) {
    if (pattern.test(file)) fail(`forbidden changed file: ${file}`)
  }
  const text = fs.existsSync(file) && fs.statSync(file).isFile() ? fs.readFileSync(file, 'utf8') : ''
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(text)) fail(`forbidden changed-file claim in ${file}: ${pattern}`)
  }
}

console.log(`${packet} diagnostics passed`)
