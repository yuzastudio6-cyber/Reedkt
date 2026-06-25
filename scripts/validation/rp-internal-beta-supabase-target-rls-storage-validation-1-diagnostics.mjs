#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-INTERNAL-BETA-SUPABASE-TARGET-RLS-STORAGE-VALIDATION-1'
const packetDir = 'docs/internal-beta/rp-internal-beta-supabase-target-rls-storage-validation-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/target-validation.md`,
  `${packetDir}/rls-validation-boundary.md`,
  `${packetDir}/storage-validation-boundary.md`,
  `${packetDir}/service-role-boundary.md`,
  `${packetDir}/readiness-gate.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/supabase-target-rls-storage-validation-record.json`,
  'docs/activation-phase-rp-internal-beta-supabase-target-rls-storage-validation-1-results.md',
  'docs/implementation-prompts/prompt-rp-internal-beta-supabase-target-owner-input-1.md',
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
  'scripts/validation/rp-internal-beta-google-cloud-runtime-config-contract-1-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-supabase-target-rls-storage-validation-1-diagnostics.mjs',
]

const followOnSupabaseTargetOwnerInputFiles = [
  'docs/internal-beta/rp-internal-beta-supabase-target-owner-input-1/source-audit.md',
  'docs/internal-beta/rp-internal-beta-supabase-target-owner-input-1/owner-input-review.md',
  'docs/internal-beta/rp-internal-beta-supabase-target-owner-input-1/historical-target-candidates.md',
  'docs/internal-beta/rp-internal-beta-supabase-target-owner-input-1/remote-validation-boundary.md',
  'docs/internal-beta/rp-internal-beta-supabase-target-owner-input-1/secret-and-service-role-boundary.md',
  'docs/internal-beta/rp-internal-beta-supabase-target-owner-input-1/readiness-gate.md',
  'docs/internal-beta/rp-internal-beta-supabase-target-owner-input-1/safety-boundary.md',
  'docs/internal-beta/rp-internal-beta-supabase-target-owner-input-1/supabase-target-owner-input-record.json',
  'docs/activation-phase-rp-internal-beta-supabase-target-owner-input-1-results.md',
  'docs/implementation-prompts/prompt-rp-internal-beta-supabase-target-owner-decision-1.md',
  'scripts/validation/rp-internal-beta-supabase-target-owner-input-1-diagnostics.mjs',
]

const followOnSupabaseTargetOwnerDecisionFiles = [
  'docs/internal-beta/rp-internal-beta-supabase-target-owner-decision-1/source-audit.md',
  'docs/internal-beta/rp-internal-beta-supabase-target-owner-decision-1/owner-decision.md',
  'docs/internal-beta/rp-internal-beta-supabase-target-owner-decision-1/target-boundary.md',
  'docs/internal-beta/rp-internal-beta-supabase-target-owner-decision-1/remote-validation-planning-boundary.md',
  'docs/internal-beta/rp-internal-beta-supabase-target-owner-decision-1/secret-service-role-boundary.md',
  'docs/internal-beta/rp-internal-beta-supabase-target-owner-decision-1/readiness-gate.md',
  'docs/internal-beta/rp-internal-beta-supabase-target-owner-decision-1/safety-boundary.md',
  'docs/internal-beta/rp-internal-beta-supabase-target-owner-decision-1/supabase-target-owner-decision-record.json',
  'docs/activation-phase-rp-internal-beta-supabase-target-owner-decision-1-results.md',
  'docs/implementation-prompts/prompt-rp-internal-beta-supabase-target-rls-storage-validation-1r.md',
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

const allowedChangedFiles = new Set([...requiredFiles, ...followOnSupabaseTargetOwnerInputFiles, ...followOnSupabaseTargetOwnerDecisionFiles, ...followOnSupabaseTargetRlsStorageValidation1rFiles, 'package.json'])

const requiredText = [
  packet,
  'blocked_pending_named_supabase_target_rls_storage_validation',
  'completed_docs_only_supabase_target_rls_storage_validation_review_no_remote_execution',
  'Source merge: `d312d15aebeeafed5a7eac82c108ff33a39572c7`',
  'Prior packet: `RP-INTERNAL-BETA-GOOGLE-CLOUD-RUNTIME-CONFIG-CONTRACT-1`',
  'Approved runtime target: `google_cloud_managed_runtime_target`',
  'Environment class: `google_cloud_managed_internal_beta`',
  'Readiness: `blocked_pending_named_non_production_supabase_target_and_guarded_remote_validation`',
  'Internal beta end-to-end status: `not_ready_pending_supabase_target_rls_storage_and_runtime_implementation`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Remote Supabase target: `not_named`',
  'Supabase target project: `source_reference_names_recorded_no_remote_target_selected`',
  'RLS validation: `not_run`',
  'Storage validation: `not_run`',
  'Service-role runtime: `blocked_pending_named_supabase_target_rls_storage_validation`',
  'Supabase remote environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  'RLS/storage remote validation: `not_run`',
  'Storage buckets created: `none`',
  'Storage objects created: `none`',
  'Service-role secret payload access: `none`',
  'Remote Supabase mutation: `false`',
  'SQL execution: `false`',
  'Storage bucket creation: `false`',
  'Storage object creation: `false`',
  'Storage object read: `false`',
  'Service-role secret payload access: `false`',
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
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'Next recommended milestone: `RP-INTERNAL-BETA-SUPABASE-TARGET-OWNER-INPUT-1`',
  'No remote Supabase mutation, SQL execution, migration execution, RLS policy apply, storage bucket creation, storage object creation, storage object read, service-role secret payload access, service-role route execution, Google Cloud API call, Cloud Run service creation, Cloud Run job creation, Cloud Run deployment, IAM mutation, GCS bucket creation, GCS object access, provider call, model call, raw prompt execution, worker execution, worker dispatch, worker lease claim, route execution, browser capture, Remotion execution, FFmpeg execution, FFprobe execution, media processing, signed URL creation, public artifact creation, credit mutation, credit reservation creation, credit spend, job enqueue, job event write, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, final render/export, preview artifact creation, private media processing, user media processing, package installation beyond dependency validation, dependency mutation, package-lock mutation, Dockerfile change, requirements change, or broad service-role handler was enabled.',
]

const forbiddenClaims = [
  /Internal beta end-to-end status:\s*`?(ready|enabled|unlocked|passed)/i,
  /internal beta unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /external beta unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /production unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /Remote Supabase target:\s*`(?!not_named`)/i,
  /Supabase target project:\s*`(?!source_reference_names_recorded_no_remote_target_selected`)/i,
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
  /Service-role secret payload access:\s*`?(true|completed|enabled|passed|accessed)/i,
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
  /Provider\/model calls executed:(?!\s*`?none`?)/i,
  /Model call:\s*`?true/i,
  /Raw prompt execution:\s*`?true/i,
  /Remotion execution:\s*`?(true|completed|enabled|passed)/i,
  /FFmpeg execution:\s*`?(true|completed|enabled|passed)/i,
  /FFprobe execution:\s*`?(true|completed|enabled|passed)/i,
  /Media processing:\s*`?(true|completed|enabled|passed)/i,
  /Signed URL creation:\s*`?true/i,
  /Signed URLs created:(?!\s*`?none`?)/i,
  /Public artifact creation:\s*`?true/i,
  /Public artifacts created:(?!\s*`?none`?)/i,
  /Google Cloud API call:\s*`?(true|completed|enabled|passed)/i,
  /Cloud Run service creation:\s*`?(true|completed|enabled|passed)/i,
  /Cloud Run job creation:\s*`?(true|completed|enabled|passed)/i,
  /deployment:\s*`?(completed|enabled|true|passed)/i,
  /package-lock:\s*`?changed/i,
  /dependency mutation:\s*`?(completed|enabled|true|passed)/i,
  /package installation:\s*`?(completed|enabled|true|passed)/i,
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

function stripHistoricalSections(text) {
  return text
    .replace(/\n## RP-DATA-0[1-4][\s\S]*?(?=\n## |\n# |$)/g, '\n')
    .replace(/\n## RP-BACKEND-0[1-2][\s\S]*?(?=\n## |\n# |$)/g, '\n')
    .replace(/\n## RP-CREDITS-01[\s\S]*?(?=\n## |\n# |$)/g, '\n')
    .replace(/\n## RP-JOBS-01[\s\S]*?(?=\n## |\n# |$)/g, '\n')
    .replace(/\n## RP-ARTIFACTS-01[\s\S]*?(?=\n## |\n# |$)/g, '\n')
    .replace(/\n## RP-RENDER-01[\s\S]*?(?=\n## |\n# |$)/g, '\n')
    .replace(/\n## RP-PROVIDER-01[\s\S]*?(?=\n## |\n# |$)/g, '\n')
    .replace(/\n## RP-INTERNAL-BETA Runtime Enablement Plan 1[\s\S]*?(?=\n## |\n# |$)/g, '\n')
    .replace(/\n## RP-INTERNAL-BETA Runtime Enablement Owner Approval 1[\s\S]*?(?=\n## |\n# |$)/g, '\n')
    .replace(/\n## RP-INTERNAL-BETA Named Runtime Target Approval 1[\s\S]*?(?=\n## |\n# |$)/g, '\n')
    .replace(/\n## RP-INTERNAL-BETA Runtime Target Owner Decision 1[\s\S]*?(?=\n## |\n# |$)/g, '\n')
    .replace(/\n## RP-INTERNAL-BETA Google Cloud Managed Runtime Target Approval 1[\s\S]*?(?=\n## |\n# |$)/g, '\n')
    .replace(/\n## RP-INTERNAL-BETA Google Cloud Managed Runtime Implementation Plan 1[\s\S]*?(?=\n## |\n# |$)/g, '\n')
    .replace(/\n## RP-INTERNAL-BETA Google Cloud Environment Boundary 1[\s\S]*?(?=\n## |\n# |$)/g, '\n')
    .replace(/\n## RP-INTERNAL-BETA Google Cloud Environment Owner Input 1[\s\S]*?(?=\n## |\n# |$)/g, '\n')
    .replace(/\n## RP-INTERNAL-BETA Google Cloud Runtime Config Contract 1[\s\S]*?(?=\n## |\n# |$)/g, '\n')
    .replace(/\n## RP-INTERNAL-BETA Supabase Target Owner Input 1[\s\S]*?(?=\n## |\n# |$)/g, '\n')
    .replace(/\n## RP-INTERNAL-BETA Supabase Target Owner Decision 1[\s\S]*?(?=\n## |\n# |$)/g, '\n')
    .replace(/\n## RP-INTERNAL-BETA Supabase Target RLS Storage Validation 1R[\s\S]*?(?=\n## |\n# |$)/g, '\n')
    .replace(/\n## Track A[\s\S]*?(?=\n## |\n# |$)/g, '\n')
}

const docsCorpus = requiredFiles
  .filter((file) => file.startsWith('docs/') || file === 'implementation-status-and-next-phase.md')
  .map((file) => stripHistoricalSections(read(file)))
  .join('\n')

for (const text of requiredText) {
  if (!docsCorpus.includes(text)) fail(`missing required text: ${text}`)
}

for (const pattern of forbiddenClaims) {
  if (pattern.test(docsCorpus)) fail(`forbidden claim matched ${pattern}`)
}

const record = JSON.parse(read(`${packetDir}/supabase-target-rls-storage-validation-record.json`))
if (record.packet !== packet) fail('record packet mismatch')
if (record.decision !== 'blocked_pending_named_supabase_target_rls_storage_validation') fail('record decision mismatch')
if (record.execution !== 'completed_docs_only_supabase_target_rls_storage_validation_review_no_remote_execution') fail('record execution mismatch')
if (record.sourceMerge !== 'd312d15aebeeafed5a7eac82c108ff33a39572c7') fail('source merge mismatch')
if (record.priorPacket !== 'RP-INTERNAL-BETA-GOOGLE-CLOUD-RUNTIME-CONFIG-CONTRACT-1') fail('prior packet mismatch')
if (record.readiness !== 'blocked_pending_named_non_production_supabase_target_and_guarded_remote_validation') fail('readiness mismatch')
if (record.internalBetaEndToEndStatus !== 'not_ready_pending_supabase_target_rls_storage_and_runtime_implementation') fail('internal beta status mismatch')
if (record.supabaseTargetProject !== 'source_reference_names_recorded_no_remote_target_selected') fail('Supabase target project must remain unresolved')
if (record.remoteSupabaseTarget !== 'not_named') fail('remote Supabase target must remain unnamed')
if (record.rlsValidation !== 'not_run') fail('RLS validation must remain not_run')
if (record.storageValidation !== 'not_run') fail('storage validation must remain not_run')
if (record.serviceRoleRuntime !== 'blocked_pending_named_supabase_target_rls_storage_validation') fail('service-role runtime mismatch')
for (const key of [
  'googleCloudApiCall',
  'cloudRunServiceCreation',
  'cloudRunJobCreation',
  'cloudRunDeployment',
  'iamMutation',
  'secretManagerPayloadAccess',
  'serviceRoleSecretPayloadAccess',
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
  if (record[key] !== false) fail(`${key} must remain false`)
}
if (record.supabaseTargetTouched !== 'none') fail('Supabase target touched must remain none')
if (record.sqlExecuted !== 'none') fail('SQL executed must remain none')
if (record.migrationDeployed !== 'no') fail('migration deployed must remain no')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready tool count must remain 0')
if (record.nextMilestone !== 'RP-INTERNAL-BETA-SUPABASE-TARGET-OWNER-INPUT-1') fail('next milestone mismatch')

const packageJson = JSON.parse(read('package.json'))
if (packageJson.scripts?.['rp-internal-beta-supabase-target-rls-storage-validation-1:diagnostics'] !== 'node scripts/validation/rp-internal-beta-supabase-target-rls-storage-validation-1-diagnostics.mjs') {
  fail('missing diagnostics package script')
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
  if (followOnSupabaseTargetOwnerDecisionFiles.includes(file)) continue
  if (followOnSupabaseTargetRlsStorageValidation1rFiles.includes(file)) continue
  const text = stripHistoricalSections(fs.readFileSync(file, 'utf8'))
  for (const pattern of forbiddenClaims) {
    if (pattern.test(text)) fail(`forbidden claim ${pattern} in ${file}`)
  }
}

console.log(`${packet} diagnostics passed`)
