#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-PRIVATE-ARTIFACT-STORAGE-ACCESS-GUARDED-REMOTE-WRITE-1'
const dir = 'docs/external-beta/private-artifact-storage-access-guarded-remote-write-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${dir}/source-audit.md`,
  `${dir}/validation-results.md`,
  `${dir}/readiness-gate.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/runtime-validation-record.json`,
  'docs/activation-phase-rp-external-beta-private-artifact-storage-access-guarded-remote-write-1-results.md',
  'docs/external-beta/current-readiness-rollup-1/readiness-gate.md',
  'docs/external-beta/current-readiness-rollup-1/source-of-truth-audit.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'docs/external-beta/current-readiness-rollup-1/rollup-record.json',
  'docs/activation-phase-rp-external-product-beta-current-readiness-rollup-1-results.md',
  'docs/production-beta-blocker-inventory.md',
  'scripts/validation/rp-external-beta-private-artifact-storage-access-guarded-remote-write-1-confirmed.mjs',
  'scripts/validation/rp-external-beta-private-artifact-storage-access-guarded-remote-write-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-job-queue-lease-event-guarded-remote-write-1-diagnostics.mjs',
  'package.json',
]

const allowedChangedFiles = new Set(requiredFiles)

const requiredText = [
  packet,
  'completed_private_artifact_storage_access_guarded_remote_write_readback',
  'completed_guarded_generated_private_storage_object_write_read_delete_and_transaction_rolled_back_artifact_metadata_readback',
  'Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`',
  'storage object residue count: `0`',
  'private bucket public count: `0`',
  'artifact metadata rollback residue count: `0`',
  'signed URL creation: `false`',
  'public artifact creation: `false`',
  'generated private storage JSON fixture created, read, deleted, and verified absent',
  'transaction-rolled-back `storage_object_records`, `artifact_manifests`, and `artifact_manifest_items` metadata fixture',
  'blocked_external_product_beta_pending_remaining_runtime_gates_after_private_artifact_storage_access_remote_write_readback',
  'RP-EXTERNAL-BETA-SERVICE-ROLE-ROUTE-RUNTIME-VALIDATION-1',
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
  /serviceRoleRouteExecution"?\s*:\s*true/i,
  /routeExecution"?\s*:\s*true/i,
  /workerExecution"?\s*:\s*true/i,
  /workerDispatch"?\s*:\s*true/i,
  /persistentWorkerLeaseClaim"?\s*:\s*true/i,
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
if (record.decision !== 'completed_private_artifact_storage_access_guarded_remote_write_readback') fail('record decision mismatch')
if (record.execution !== 'completed_guarded_generated_private_storage_object_write_read_delete_and_transaction_rolled_back_artifact_metadata_readback') fail('record execution mismatch')
if (record.target?.projectRef !== 'wmyyttnynmteqgcdishd') fail('target ref mismatch')
if (!record.run?.runId) fail('missing run id')
if (!record.run?.reportSha256 || !record.run?.manifestSha256) fail('missing artifact checksums')
if (!record.run?.storageReadbackSha256 || !record.run?.metadataReadbackSha256 || !record.run?.rollbackResidueSha256) fail('missing readback checksums')
if (record.bucketReadback?.presentPrivateBucketCount !== 8) fail('private bucket count mismatch')
if (record.bucketReadback?.publicExpectedBucketCount !== 0) fail('public bucket count mismatch')
if (record.bucketReadback?.anonStorageObjectPolicyCount !== 0) fail('anonymous storage policy count mismatch')
if (record.storageWriteReadback?.bucket !== 'previews') fail('storage bucket mismatch')
if (record.storageWriteReadback?.uploadCompleted !== true) fail('storage upload not completed')
if (record.storageWriteReadback?.readbackCompleted !== true) fail('storage readback not completed')
if (record.storageWriteReadback?.checksumMatched !== true) fail('storage checksum mismatch')
if (record.storageWriteReadback?.cleanupCompleted !== true) fail('storage cleanup not completed')
if (record.storageWriteReadback?.postDeleteReadbackBlocked !== true) fail('storage post-delete readback mismatch')
if (record.storageWriteReadback?.signedUrlCreated !== false) fail('signed URL flag mismatch')
if (record.storageWriteReadback?.publicArtifactCreated !== false) fail('public artifact flag mismatch')

for (const key of ['storageObjectRecordInserted', 'artifactManifestInserted', 'artifactManifestItemInserted', 'auditEventInserted']) {
  if (record.metadataReadback?.[key] !== 1) fail(`${key} readback mismatch`)
}
if (record.metadataReadback?.storageObjectBucket !== 'previews') fail('metadata storage bucket mismatch')
if (record.metadataReadback?.storageObjectPurpose !== 'preview_render') fail('metadata storage purpose mismatch')
if (record.metadataReadback?.storageObjectStatus !== 'ready') fail('metadata storage status mismatch')
if (record.metadataReadback?.artifactManifestRole !== 'preview') fail('artifact manifest role mismatch')
if (record.metadataReadback?.artifactManifestStatus !== 'ready') fail('artifact manifest status mismatch')
if (record.metadataReadback?.artifactManifestItemRole !== 'preview') fail('artifact manifest item role mismatch')
for (const [key, value] of Object.entries(record.validation?.rollbackResidueCounts ?? {})) {
  if (value !== 0) fail(`rollback residue count not zero: ${key}`)
}
if (record.validation?.storageObjectResidueCount !== 0) fail('storage object residue count mismatch')
if (record.readiness?.serviceRoleRouteExecution !== 'not_run_pending_route_specific_guarded_write_validation') fail('service-role route readiness mismatch')
if (record.readiness?.remotionPrivatePreviewExport !== 'blocked_pending_render_worker_runtime_validation') fail('Remotion readiness mismatch')
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
  'serviceRoleRouteExecution',
  'routeExecution',
  'workerExecution',
  'workerDispatch',
  'persistentWorkerLeaseClaim',
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
if (safety.serviceRoleSecretPayloadAccess !== 'guarded_ephemeral_storage_service_role_key_payload_only') fail('service-role secret access scope mismatch')
if (safety.remoteSupabaseMutation !== 'guarded_generated_private_storage_object_fixture_and_transaction_rolled_back_artifact_metadata_fixture_only') fail('remote Supabase mutation scope mismatch')
if (safety.sqlMutation !== 'guarded_transaction_rolled_back_generated_private_artifact_metadata_fixture_only') fail('SQL mutation scope mismatch')
if (safety.storageObjectCreation !== 'guarded_generated_private_storage_json_fixture_created_then_deleted') fail('storage object creation scope mismatch')
if (safety.storageObjectRead !== 'guarded_generated_private_storage_json_fixture_readback_only') fail('storage object read scope mismatch')
if (safety.storageObjectDelete !== 'guarded_generated_private_storage_json_fixture_cleanup') fail('storage object delete scope mismatch')
if (safety.storageObjectResidueCount !== 0) fail('storage object residue safety mismatch')

const rollup = JSON.parse(read('docs/external-beta/current-readiness-rollup-1/rollup-record.json'))
if (rollup.decision !== 'blocked_external_product_beta_pending_remaining_runtime_gates_after_private_artifact_storage_access_remote_write_readback') fail('rollup decision mismatch')
if (rollup.mainSupabaseTarget?.privateArtifactStorageAccess !== 'completed_private_artifact_storage_access_guarded_remote_write_readback') fail('rollup private artifact status mismatch')
if (rollup.mainSupabaseTarget?.privateArtifactStorageObjectResidueCount !== 0) fail('rollup storage residue mismatch')
if (rollup.mainSupabaseTarget?.privateArtifactMetadataRollbackResidueCount !== 0) fail('rollup metadata residue mismatch')
if (rollup.mainSupabaseTarget?.privateArtifactBucketPublicCount !== 0) fail('rollup public bucket count mismatch')
if (!rollup.requiredNextOwnerDecision?.includes('RP-EXTERNAL-BETA-SERVICE-ROLE-ROUTE-RUNTIME-VALIDATION-1')) fail('rollup next milestone mismatch')
if (rollup.safety?.storageObjectCreation !== 'guarded_generated_private_storage_json_fixture_created_then_deleted') fail('rollup storage creation scope mismatch')
if (rollup.safety?.signedUrlCreation !== false) fail('rollup signed URL flag mismatch')
if (rollup.safety?.publicArtifactCreation !== false) fail('rollup public artifact flag mismatch')
if (rollup.safety?.persistentRowsCreated !== false) fail('rollup persistent rows flag mismatch')

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-external-beta-private-artifact-storage-access-guarded-remote-write-1-confirmed'] !==
  'node scripts/validation/rp-external-beta-private-artifact-storage-access-guarded-remote-write-1-confirmed.mjs'
) {
  fail('missing confirmed runner package script')
}
if (
  packageJson.scripts?.['rp-external-beta-private-artifact-storage-access-guarded-remote-write-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-private-artifact-storage-access-guarded-remote-write-1-diagnostics.mjs'
) {
  fail('missing diagnostics package script')
}

execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

for (const file of changedFiles()) {
  if (!allowedChangedFiles.has(file)) {
    fail(`changed file is outside private-artifact storage access scope: ${file}`)
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
