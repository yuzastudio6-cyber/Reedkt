#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-INTERNAL-BETA-SUPABASE-TARGET-OWNER-DECISION-1'
const packetDir = 'docs/internal-beta/rp-internal-beta-supabase-target-owner-decision-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/owner-decision.md`,
  `${packetDir}/target-boundary.md`,
  `${packetDir}/remote-validation-planning-boundary.md`,
  `${packetDir}/secret-service-role-boundary.md`,
  `${packetDir}/readiness-gate.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/supabase-target-owner-decision-record.json`,
  'docs/activation-phase-rp-internal-beta-supabase-target-owner-decision-1-results.md',
  'docs/implementation-prompts/prompt-rp-internal-beta-supabase-target-rls-storage-validation-1r.md',
]

const relatedFiles = [
  'docs/internal-beta/rp-internal-beta-supabase-target-owner-input-1/supabase-target-owner-input-record.json',
  'docs/activation-phase-rp-internal-beta-supabase-target-owner-input-1-results.md',
  'docs/implementation-prompts/prompt-rp-internal-beta-supabase-target-owner-decision-1.md',
  'docs/supabase-approved-staging-target-reference.md',
  'docs/activation-phase-roadmap.md',
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
  'scripts/validation/rp-internal-beta-supabase-target-rls-storage-validation-1-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-supabase-target-owner-input-1-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-supabase-target-owner-decision-1-diagnostics.mjs',
]

const followOnSupabaseTargetRlsStorageValidation1rFiles = [
  'docs/internal-beta/rp-internal-beta-supabase-target-rls-storage-validation-1r/source-audit.md',
  'docs/internal-beta/rp-internal-beta-supabase-target-rls-storage-validation-1r/target-validation.md',
  'docs/internal-beta/rp-internal-beta-supabase-target-rls-storage-validation-1r/rls-readiness-review.md',
  'docs/internal-beta/rp-internal-beta-supabase-target-rls-storage-validation-1r/storage-readiness-review.md',
  'docs/internal-beta/rp-internal-beta-supabase-target-rls-storage-validation-1r/service-role-boundary.md',
  'docs/internal-beta/rp-internal-beta-supabase-target-rls-storage-validation-1r/confirmation-gate.md',
  'docs/internal-beta/rp-internal-beta-supabase-target-rls-storage-validation-1r/readiness-gate.md',
  'docs/internal-beta/rp-internal-beta-supabase-target-rls-storage-validation-1r/safety-boundary.md',
  'docs/internal-beta/rp-internal-beta-supabase-target-rls-storage-validation-1r/supabase-target-rls-storage-validation-1r-record.json',
  'docs/activation-phase-rp-internal-beta-supabase-target-rls-storage-validation-1r-results.md',
  'docs/implementation-prompts/prompt-rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed.md',
  'scripts/validation/rp-internal-beta-supabase-target-rls-storage-validation-1r-diagnostics.mjs',
]

const followOnSupabaseTargetRlsStorageValidation1rConfirmedFiles = [
  'docs/internal-beta/rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed/source-audit.md',
  'docs/internal-beta/rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed/confirmed-runner.md',
  'docs/internal-beta/rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed/readiness-gate.md',
  'docs/internal-beta/rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed/safety-boundary.md',
  'docs/internal-beta/rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed/confirmed-runner-record.json',
  'docs/activation-phase-rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed-results.md',
  'scripts/validation/rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed.mjs',
  'scripts/validation/rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-google-cloud-runtime-config-contract-1-diagnostics.mjs',
]

const requiredFiles = [...packetFiles, ...relatedFiles]
const allowedChangedFiles = new Set([
  ...packetFiles,
  ...relatedFiles,
  ...followOnSupabaseTargetRlsStorageValidation1rFiles,
  ...followOnSupabaseTargetRlsStorageValidation1rConfirmedFiles,
  'package.json',
])

const requiredText = [
  packet,
  'completed_source_derived_staging_supabase_target_owner_decision_for_guarded_validation_planning',
  'completed_docs_only_supabase_target_owner_decision_no_remote_execution',
  'Source merge: `803b7198410082c9e426b7fe0c3b05685eb15682`',
  'Prior packet: `RP-INTERNAL-BETA-SUPABASE-TARGET-OWNER-INPUT-1`',
  'Approved runtime target: `google_cloud_managed_runtime_target`',
  'Environment class: `google_cloud_managed_internal_beta`',
  'Approved non-production Supabase target: `wmyyttnynmteqgcdishd`',
  'Target name: `Reeditpro`',
  'Target class: `staging`',
  'Approval scope: `future_guarded_rls_storage_validation_planning_only`',
  'Remote Supabase target: `staging_named_for_guarded_validation_planning`',
  'Supabase target project: `wmyyttnynmteqgcdishd`',
  'Target adoption status: `source_derived_owner_decision_recorded`',
  'Remote mutation: `not_approved`',
  'SQL/migration apply: `not_approved`',
  'Remote validation approval: `guarded_prompt_required`',
  'SQL/advisor/storage readback approval: `not_approved_until_guarded_validation_prompt`',
  'Service-role secret payload access: `forbidden`',
  'Frontend service-role credential exposure: `forbidden`',
  'Public buckets/artifacts: `blocked`',
  'RLS validation: `not_run`',
  'Storage validation: `not_run`',
  'Service-role runtime: `blocked_pending_guarded_rls_storage_validation`',
  'Readiness: `ready_for_guarded_supabase_target_rls_storage_validation_1r`',
  'Internal beta end-to-end status: `not_ready_pending_guarded_supabase_rls_storage_validation_and_runtime_implementation`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Supabase remote environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  'RLS/storage remote validation: `not_run`',
  'Storage buckets created: `none`',
  'Storage objects created: `none`',
  'Remote Supabase mutation: `false`',
  'SQL execution: `false`',
  'Storage bucket creation: `false`',
  'Storage object creation: `false`',
  'Storage object read: `false`',
  'Service-role route execution: `false`',
  'Approved snapshot persistence: `false`',
  'Credit mutation: `false`',
  'Credit reservation creation: `false`',
  'Credit spend: `false`',
  'Job enqueue: `false`',
  'Job event write: `false`',
  'Worker lease claim: `false`',
  'Worker dispatch: `false`',
  'Worker execution: `false`',
  'Provider/model call: `false`',
  'Model call: `false`',
  'Raw prompt execution: `false`',
  'Remotion execution: `false`',
  'FFmpeg execution: `false`',
  'FFprobe execution: `false`',
  'Media processing: `false`',
  'Signed URL creation: `false`',
  'Public artifact creation: `false`',
  'Google Cloud API call: `false`',
  'Cloud Run service creation: `false`',
  'Cloud Run job creation: `false`',
  'Deployment: `false`',
  'Internal beta unlock: `false`',
  'External beta unlock: `false`',
  'Production unlock: `false`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'PR #212 records the human/product-approved non-secret staging target reference as `Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`.',
  'The cross-chat SOUND source path is not present in the current integration checkout, so it is not used as required source evidence for this packet.',
  'PR #818 is the internal-beta source-of-truth predecessor',
  '#577 remains open/draft/blocked and excluded as source-of-truth.',
  'Next recommended milestone: `RP-INTERNAL-BETA-SUPABASE-TARGET-RLS-STORAGE-VALIDATION-1R`',
  'No remote Supabase mutation, SQL execution, migration execution, RLS policy apply, storage bucket creation, storage object creation, storage object read, service-role secret payload access, service-role route execution, frontend service-role credential exposure, Google Cloud API call, Cloud Run service creation, Cloud Run job creation, Cloud Run deployment, IAM mutation, GCS bucket creation, GCS object access, provider call, model call, raw prompt execution, worker execution, worker dispatch, worker lease claim, route execution, browser capture, Remotion execution, FFmpeg execution, FFprobe execution, media processing, signed URL creation, public artifact creation, credit mutation, credit reservation creation, credit spend, job enqueue, job event write, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, final render/export, preview artifact creation, private media processing, user media processing, package installation beyond dependency validation, dependency mutation, package-lock mutation, Dockerfile change, requirements change, or broad service-role handler was enabled.',
]

const forbiddenClaims = [
  /Internal beta end-to-end status:\s*`?(ready|enabled|unlocked|passed)/i,
  /internal beta unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /external beta unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /production unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /Remote mutation:\s*`(?!not_approved`)/i,
  /SQL\/migration apply:\s*`(?!not_approved`)/i,
  /Remote validation approval:\s*`(?!guarded_prompt_required`)/i,
  /SQL\/advisor\/storage readback approval:\s*`(?!not_approved_until_guarded_validation_prompt`)/i,
  /Service-role secret payload access:\s*`(?!forbidden`|false)/i,
  /Frontend service-role credential exposure:\s*`(?!forbidden`|false)/i,
  /Public buckets\/artifacts:\s*`(?!blocked`)/i,
  /RLS validation:\s*`?(passed|completed|true|enabled)/i,
  /Storage validation:\s*`?(passed|completed|true|enabled)/i,
  /RLS\/storage remote validation:\s*`?(passed|completed|true|enabled)/i,
  /Remote Supabase mutation:\s*`?true/i,
  /Supabase remote environment touched:(?!\s*`?none`?)/i,
  /SQL execution:\s*`?true/i,
  /SQL executed:(?!\s*`?none`?)/i,
  /Migration deployed:(?!\s*`?no`?)/i,
  /migration execution:\s*`?(completed|enabled|true|passed)/i,
  /RLS policy apply:\s*`?(completed|enabled|true|passed)/i,
  /Storage bucket creation:\s*`?(true|completed|enabled|passed)/i,
  /Storage buckets created:(?!\s*`?none`?)/i,
  /Storage object (?:creation|read):\s*`?true/i,
  /Storage objects created:(?!\s*`?none`?)/i,
  /Service-role route execution:\s*`?(true|completed|enabled|passed)/i,
  /Approved snapshot persistence:\s*`?(true|completed|enabled|passed)/i,
  /Credit mutation:\s*`?true/i,
  /Credit reservation creation:\s*`?(true|completed|enabled|passed)/i,
  /Credit spend:\s*`?(true|completed|enabled|passed)/i,
  /Job enqueue:\s*`?(true|completed|enabled|passed)/i,
  /Job event write:\s*`?(true|completed|enabled|passed)/i,
  /Worker lease claim:\s*`?(true|completed|enabled|passed)/i,
  /Worker dispatch:\s*`?(true|completed|enabled|passed)/i,
  /Worker execution:(?!\s*`?(false|none|not_run)`?)/i,
  /Provider\/model call:\s*`?(true|completed|enabled|passed)/i,
  /Model call:\s*`?true/i,
  /Raw prompt execution:\s*`?true/i,
  /Remotion execution:\s*`?(true|completed|enabled|passed)/i,
  /FFmpeg execution:\s*`?(true|completed|enabled|passed)/i,
  /FFprobe execution:\s*`?(true|completed|enabled|passed)/i,
  /Media processing:\s*`?(true|completed|enabled|passed)/i,
  /Signed URL creation:\s*`?true/i,
  /Public artifact creation:\s*`?true/i,
  /Google Cloud API call:\s*`?(true|completed|enabled|passed)/i,
  /Cloud Run service creation:\s*`?(true|completed|enabled|passed)/i,
  /Cloud Run job creation:\s*`?(true|completed|enabled|passed)/i,
  /deployment:\s*`?(completed|enabled|true|passed)/i,
  /package-lock:\s*`?changed/i,
  /dependency mutation:\s*`?(completed|enabled|true|passed)/i,
]

const forbiddenExactFiles = new Set(['package-lock.json', '.dockerignore'])
const forbiddenPrefixes = [
  'server/routes/',
  'server/workers/',
  'server/config/',
  'database/',
  'docker/',
  'public/',
  'tests/',
  'src/',
  'supabase/migrations/',
  'supabase/functions/',
]

function fail(message) {
  console.error(`${packet} diagnostics failed: ${message}`)
  process.exit(1)
}

function read(file) {
  if (!fs.existsSync(file)) fail(`missing required file ${file}`)
  return fs.readFileSync(file, 'utf8')
}

function gitLines(args) {
  return execFileSync('git', args, { env: gitEnv, encoding: 'utf8' }).trim().split('\n').filter(Boolean)
}

function gitQuiet(args, label) {
  try {
    execFileSync('git', args, { env: gitEnv, stdio: 'pipe' })
  } catch {
    fail(label)
  }
}

function extractSection(text, heading) {
  const marker = `## ${heading}`
  const start = text.indexOf(marker)
  if (start === -1) return ''
  const rest = text.slice(start + marker.length)
  const next = rest.search(/\n## |\n# /)
  return marker + (next === -1 ? rest : rest.slice(0, next))
}

const docsCorpus = [
  ...packetFiles.map(read),
  extractSection(read('implementation-status-and-next-phase.md'), 'RP-INTERNAL-BETA Supabase Target Owner Decision 1'),
  extractSection(read('docs/production-beta-blocker-inventory.md'), 'RP-INTERNAL-BETA Supabase Target Owner Decision 1'),
].join('\n')

for (const file of requiredFiles) {
  read(file)
}

for (const text of requiredText) {
  if (!docsCorpus.includes(text)) fail(`missing required text: ${text}`)
}

for (const pattern of forbiddenClaims) {
  if (pattern.test(docsCorpus)) fail(`forbidden claim matched ${pattern}`)
}

const record = JSON.parse(read(`${packetDir}/supabase-target-owner-decision-record.json`))
const expected = {
  packet,
  decision: 'completed_source_derived_staging_supabase_target_owner_decision_for_guarded_validation_planning',
  execution: 'completed_docs_only_supabase_target_owner_decision_no_remote_execution',
  sourceMerge: '803b7198410082c9e426b7fe0c3b05685eb15682',
  priorPacket: 'RP-INTERNAL-BETA-SUPABASE-TARGET-OWNER-INPUT-1',
  approvedRuntimeTarget: 'google_cloud_managed_runtime_target',
  environmentClass: 'google_cloud_managed_internal_beta',
  approvedNonProductionSupabaseTarget: 'wmyyttnynmteqgcdishd',
  targetName: 'Reeditpro',
  targetClass: 'staging',
  approvalScope: 'future_guarded_rls_storage_validation_planning_only',
  remoteSupabaseTarget: 'staging_named_for_guarded_validation_planning',
  supabaseTargetProject: 'wmyyttnynmteqgcdishd',
  targetAdoptionStatus: 'source_derived_owner_decision_recorded',
  remoteMutationApproval: 'not_approved',
  sqlMigrationApplyApproval: 'not_approved',
  remoteValidationApproval: 'guarded_prompt_required',
  sqlAdvisorStorageReadbackApproval: 'not_approved_until_guarded_validation_prompt',
  serviceRoleSecretPayloadAccessPolicy: 'forbidden',
  frontendServiceRoleCredentialExposure: 'forbidden',
  publicBucketArtifactPolicy: 'blocked',
  readiness: 'ready_for_guarded_supabase_target_rls_storage_validation_1r',
  internalBetaEndToEndStatus: 'not_ready_pending_guarded_supabase_rls_storage_validation_and_runtime_implementation',
  rlsValidation: 'not_run',
  storageValidation: 'not_run',
  serviceRoleRuntime: 'blocked_pending_guarded_rls_storage_validation',
  pr818MergeSha: '803b7198410082c9e426b7fe0c3b05685eb15682',
  pr212Reference: 'historical_supporting_open_pr_body',
  soundContextReference: 'not_present_in_current_integration_not_used_as_required_source',
  supabaseTargetTouched: 'none',
  sqlExecuted: 'none',
  migrationDeployed: 'no',
  packageLock: 'unchanged',
  generatedArtifactsCommitted: 'none',
  nextMilestone: 'RP-INTERNAL-BETA-SUPABASE-TARGET-RLS-STORAGE-VALIDATION-1R',
}

for (const [key, value] of Object.entries(expected)) {
  if (record[key] !== value) fail(`record ${key} mismatch`)
}

for (const key of [
  'pr577Excluded',
  'googleCloudApiCall',
  'cloudRunServiceCreation',
  'cloudRunJobCreation',
  'cloudRunDeployment',
  'iamMutation',
  'secretManagerPayloadAccess',
  'serviceRoleSecretPayloadAccess',
  'frontendServiceRoleCredentialExposureOccurred',
  'gcsBucketCreation',
  'gcsObjectCreation',
  'gcsObjectRead',
  'remoteSupabaseMutation',
  'sqlExecution',
  'storageBucketCreation',
  'storageObjectCreation',
  'storageObjectRead',
  'serviceRoleRouteExecution',
  'approvedSnapshotPersistence',
  'creditMutation',
  'creditReservationCreation',
  'creditSpend',
  'jobEnqueue',
  'jobEventWrite',
  'workerLeaseClaim',
  'workerDispatch',
  'workerExecution',
  'providerModelCall',
  'modelCall',
  'rawPromptExecution',
  'signedUrlCreation',
  'publicArtifactCreation',
  'remotionExecution',
  'ffmpegExecution',
  'ffprobeExecution',
  'mediaProcessing',
  'deployment',
  'internalBetaUnlock',
  'externalBetaUnlock',
  'productionUnlock',
]) {
  const expectedValue = key === 'pr577Excluded' ? true : false
  if (record[key] !== expectedValue) fail(`${key} mismatch`)
}

if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready tool count must remain 0')

const priorRecord = JSON.parse(read('docs/internal-beta/rp-internal-beta-supabase-target-owner-input-1/supabase-target-owner-input-record.json'))
if (priorRecord.decision !== 'blocked_pending_named_supabase_target_owner_input') fail('prior owner-input decision changed')
if (priorRecord.historicalTargetReferencesAdopted !== false) fail('prior owner-input record should remain historical')

const packageJson = JSON.parse(read('package.json'))
if (packageJson.scripts?.['rp-internal-beta-supabase-target-owner-decision-1:diagnostics'] !== 'node scripts/validation/rp-internal-beta-supabase-target-owner-decision-1-diagnostics.mjs') {
  fail('missing owner decision diagnostics package script')
}

gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock.json changed')
for (const file of [
  'supabase/migrations',
  'supabase/functions',
  '.dockerignore',
  'database/migration-drafts',
  'database/test-sql',
  'server/routes',
  'server/workers',
  'server/config',
  'docker',
  'src',
]) {
  gitQuiet(['diff', '--quiet', '--', file], `${file} changed`)
}

const changedFiles = [...new Set([
  ...gitLines(['diff', '--name-only', 'HEAD']),
  ...gitLines(['ls-files', '--others', '--exclude-standard']),
])]
const stagedFiles = gitLines(['diff', '--cached', '--name-only'])

for (const file of [...changedFiles, ...stagedFiles]) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file ${file}`)
  if (
    forbiddenExactFiles.has(file) ||
    forbiddenPrefixes.some((prefix) => file.startsWith(prefix)) ||
    file.endsWith('.sql') ||
    file.endsWith('.mp4') ||
    file.endsWith('.mov') ||
    file.endsWith('.mkv') ||
    file.endsWith('.webm') ||
    file.endsWith('.srt') ||
    file.endsWith('.zip') ||
    file.endsWith('.tar') ||
    file.endsWith('.tgz')
  ) {
    fail(`forbidden changed path ${file}`)
  }
}

for (const file of changedFiles) {
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) continue
  if (file.startsWith('scripts/validation/')) continue
  if (followOnSupabaseTargetRlsStorageValidation1rFiles.includes(file)) continue
  const text = file === 'implementation-status-and-next-phase.md' || file === 'docs/production-beta-blocker-inventory.md'
    ? extractSection(fs.readFileSync(file, 'utf8'), 'RP-INTERNAL-BETA Supabase Target Owner Decision 1')
    : fs.readFileSync(file, 'utf8')
  for (const pattern of forbiddenClaims) {
    if (pattern.test(text)) fail(`forbidden claim ${pattern} in ${file}`)
  }
}

console.log(`${packet} diagnostics passed`)
