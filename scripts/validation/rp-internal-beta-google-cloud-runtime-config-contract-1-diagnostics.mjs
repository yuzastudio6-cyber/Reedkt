#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-INTERNAL-BETA-GOOGLE-CLOUD-RUNTIME-CONFIG-CONTRACT-1'
const packetDir = 'docs/internal-beta/rp-internal-beta-google-cloud-runtime-config-contract-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  'server/config/internal-beta-google-cloud-runtime-config-contract.ts',
  `${packetDir}/source-audit.md`,
  `${packetDir}/runtime-config-contract.md`,
  `${packetDir}/runtime-gate-matrix.md`,
  `${packetDir}/supabase-boundary.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/readiness-gate.md`,
  `${packetDir}/google-cloud-runtime-config-contract-record.json`,
  'docs/activation-phase-rp-internal-beta-google-cloud-runtime-config-contract-1-results.md',
  'docs/implementation-prompts/prompt-rp-internal-beta-supabase-target-rls-storage-validation-1.md',
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
  'scripts/validation/rp-internal-beta-google-cloud-environment-owner-input-1-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-google-cloud-runtime-config-contract-1-diagnostics.mjs',
]

const followOnSupabaseTargetRlsStorageValidationFiles = [
  'docs/internal-beta/rp-internal-beta-supabase-target-rls-storage-validation-1/source-audit.md',
  'docs/internal-beta/rp-internal-beta-supabase-target-rls-storage-validation-1/target-validation.md',
  'docs/internal-beta/rp-internal-beta-supabase-target-rls-storage-validation-1/rls-validation-boundary.md',
  'docs/internal-beta/rp-internal-beta-supabase-target-rls-storage-validation-1/storage-validation-boundary.md',
  'docs/internal-beta/rp-internal-beta-supabase-target-rls-storage-validation-1/service-role-boundary.md',
  'docs/internal-beta/rp-internal-beta-supabase-target-rls-storage-validation-1/readiness-gate.md',
  'docs/internal-beta/rp-internal-beta-supabase-target-rls-storage-validation-1/safety-boundary.md',
  'docs/internal-beta/rp-internal-beta-supabase-target-rls-storage-validation-1/supabase-target-rls-storage-validation-record.json',
  'docs/activation-phase-rp-internal-beta-supabase-target-rls-storage-validation-1-results.md',
  'docs/implementation-prompts/prompt-rp-internal-beta-supabase-target-owner-input-1.md',
  'scripts/validation/rp-internal-beta-supabase-target-rls-storage-validation-1-diagnostics.mjs',
]

const followOnSupabaseTargetOwnerDecisionFiles = [
  'scripts/validation/rp-internal-beta-supabase-target-owner-decision-1-diagnostics.mjs',
]

const followOnSupabaseTargetRlsStorageValidation1rConfirmedFiles = [
  'docs/internal-beta/rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed/source-audit.md',
  'docs/internal-beta/rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed/confirmed-runner.md',
  'docs/internal-beta/rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed/readiness-gate.md',
  'docs/internal-beta/rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed/safety-boundary.md',
  'docs/internal-beta/rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed/confirmed-runner-record.json',
  'docs/activation-phase-rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed-results.md',
  'docs/implementation-prompts/prompt-rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed.md',
  'scripts/validation/rp-internal-beta-supabase-target-rls-storage-validation-1r-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed.mjs',
  'scripts/validation/rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed-diagnostics.mjs',
]

const allowedChangedFiles = new Set([
  ...requiredFiles,
  ...followOnSupabaseTargetRlsStorageValidationFiles,
  ...followOnSupabaseTargetOwnerDecisionFiles,
  ...followOnSupabaseTargetRlsStorageValidation1rConfirmedFiles,
  'package.json',
])

const requiredText = [
  packet,
  'completed_backend_only_google_cloud_runtime_config_contract_no_runtime_execution',
  'completed_server_config_contract_no_cloud_or_supabase_execution',
  'Source merge: `643589bb30fb43a91312b292cd751b31b1dea6e0`',
  'Prior packet: `RP-INTERNAL-BETA-GOOGLE-CLOUD-ENVIRONMENT-OWNER-INPUT-1`',
  'Approved runtime target: `google_cloud_managed_runtime_target`',
  'Environment class: `google_cloud_managed_internal_beta`',
  'Readiness: `ready_for_supabase_target_rls_storage_validation`',
  'Internal beta end-to-end status: `not_ready_pending_supabase_rls_storage_and_runtime_implementation`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Backend-only contract file: `server/config/internal-beta-google-cloud-runtime-config-contract.ts`',
  'Runtime enabled: `false`',
  'Runtime execution allowed: `false`',
  'Deployment approved: `false`',
  'Google Cloud project ID: `reeditpro`',
  'Primary runtime region: `us-east1`',
  'Secondary runtime region: `europe-west1`',
  'Staging activation region: `us-central1`',
  'Supabase target project: `source_reference_names_recorded_no_remote_target_selected`',
  'Supabase remote environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  'RLS/storage remote validation: `not_run`',
  'Google Cloud API call: `false`',
  'Cloud Run service creation: `false`',
  'Cloud Run job creation: `false`',
  'Cloud Run deployment: `false`',
  'IAM mutation: `false`',
  'Secret Manager payload access: `false`',
  'GCS bucket creation: `false`',
  'GCS object creation: `false`',
  'GCS object read: `false`',
  'Remote Supabase mutation: `false`',
  'SQL execution: `false`',
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
  'Storage object creation: `false`',
  'Storage object read: `false`',
  'Signed URL creation: `false`',
  'Public artifact creation: `false`',
  'Deployment: `false`',
  'Internal beta unlock: `false`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'Google Cloud API calls executed: `none`',
  'Cloud Run service creation: `none`',
  'Cloud Run job creation: `none`',
  'GCS object access: `none`',
  'Provider requests created: `none`',
  'Provider/model calls executed: `none`',
  'Worker execution: `none`',
  'Render/export execution: `none`',
  'Signed URLs created: `none`',
  'Public artifacts created: `none`',
  'Next recommended milestone: `RP-INTERNAL-BETA-SUPABASE-TARGET-RLS-STORAGE-VALIDATION-1`',
  'No remote Supabase mutation, SQL execution, Secret Manager payload access, Google Cloud API call, Cloud Run service creation, Cloud Run job creation, Cloud Run deployment, IAM mutation, GCS bucket creation, GCS object access, provider call, model call, raw prompt execution, worker execution, worker dispatch, worker lease claim, route execution, service-role route execution, browser capture, Remotion execution, FFmpeg execution, FFprobe execution, media processing, storage object creation, storage object read, signed URL creation, public artifact creation, credit mutation, credit reservation creation, credit spend, job enqueue, job event write, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, final render/export, preview artifact creation, private media processing, user media processing, package installation beyond dependency validation, dependency mutation, package-lock mutation, Dockerfile change, requirements change, or broad service-role handler was enabled.',
]

const requiredContractText = [
  'INTERNAL_BETA_GOOGLE_CLOUD_RUNTIME_CONFIG_CONTRACT',
  'validateInternalBetaGoogleCloudRuntimeConfigContract',
  'completed_backend_only_google_cloud_runtime_config_contract_no_runtime_execution',
  'completed_server_config_contract_no_cloud_or_supabase_execution',
  'runtimeEnabled: false',
  'runtimeExecutionAllowed: false',
  'deploymentApproved: false',
  "projectId: 'reeditpro'",
  "primaryRuntimeRegion: 'us-east1'",
  "secondaryRuntimeRegion: 'europe-west1'",
  "stagingActivationRegion: 'us-central1'",
  "targetProject: 'source_reference_names_recorded_no_remote_target_selected'",
  "serviceRoleRuntime: 'blocked_pending_supabase_target_rls_storage_validation'",
  "nextMilestone: 'RP-INTERNAL-BETA-SUPABASE-TARGET-RLS-STORAGE-VALIDATION-1'",
]

const forbiddenClaims = [
  /Internal beta end-to-end status:\s*`?(ready|enabled|unlocked|passed)/i,
  /internal beta unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /external beta unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /production unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /Runtime enabled:\s*`?true/i,
  /Runtime execution allowed:\s*`?true/i,
  /Deployment approved:\s*`?true/i,
  /Google Cloud API calls? (?:executed|created)?:\s*`?(true|completed|enabled|passed|created)/i,
  /Google Cloud API call:\s*`?(true|completed|enabled|passed)/i,
  /Cloud Run service creation:\s*`?(true|completed|enabled|passed)/i,
  /Cloud Run job creation:\s*`?(true|completed|enabled|passed)/i,
  /Cloud Run deployment:\s*`?(true|completed|enabled|passed)/i,
  /IAM mutation:\s*`?(true|completed|enabled|passed)/i,
  /Secret Manager payload access:\s*`?(true|completed|enabled|passed|accessed)/i,
  /GCS bucket creation:\s*`?(true|completed|enabled|passed)/i,
  /GCS object (?:creation|read):\s*`?true/i,
  /GCS object access:\s*`?(true|completed|enabled|passed|accessed|created|read)/i,
  /Remote Supabase mutation:\s*`?true/i,
  /Supabase remote environment touched:(?!\s*`?none`?)/i,
  /SQL execution:\s*`?true/i,
  /SQL executed:(?!\s*`?none`?)/i,
  /Migration deployed:(?!\s*`?no`?)/i,
  /RLS\/storage remote validation:\s*`?(passed|completed|true|enabled)/i,
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
  /Provider requests created:(?!\s*`?none`?)/i,
  /Provider\/model calls?(?: executed)?:\s*`?(true|completed|enabled|passed)/i,
  /Provider\/model call:\s*`?(true|completed|enabled|passed)/i,
  /Model call:\s*`?true/i,
  /Raw prompt execution:\s*`?true/i,
  /Remotion execution:\s*`?(true|completed|enabled|passed)/i,
  /FFmpeg execution:\s*`?(true|completed|enabled|passed)/i,
  /FFprobe execution:\s*`?(true|completed|enabled|passed)/i,
  /Media processing:\s*`?(true|completed|enabled|passed)/i,
  /Storage object creation:\s*`?true/i,
  /Storage object read:\s*`?true/i,
  /Signed URL creation:\s*`?true/i,
  /Public artifact creation:\s*`?true/i,
  /Render\/export execution:(?!\s*`?(false|none|not_run)`?)/i,
  /Signed URLs created:(?!\s*`?none`?)/i,
  /Public artifacts created:(?!\s*`?none`?)/i,
  /deployment:\s*`?(completed|enabled|true|passed)/i,
  /package-lock:\s*`?changed/i,
  /dependency mutation:\s*`?(completed|enabled|true|passed)/i,
  /package installation:\s*`?(completed|enabled|true|passed)/i,
]

const forbiddenExactFiles = new Set(['package-lock.json', '.dockerignore'])
const forbiddenPrefixes = [
  'server/routes/',
  'server/workers/',
  'database/',
  'docker/',
  'public/',
  'tests/',
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
    .replace(/\n## RP-INTERNAL-BETA Runtime Enablement Plan 1[\s\S]*?(?=\n## |\n# |$)/g, '\n')
    .replace(/\n## RP-INTERNAL-BETA Runtime Enablement Owner Approval 1[\s\S]*?(?=\n## |\n# |$)/g, '\n')
    .replace(/\n## RP-INTERNAL-BETA Named Runtime Target Approval 1[\s\S]*?(?=\n## |\n# |$)/g, '\n')
    .replace(/\n## RP-INTERNAL-BETA Runtime Target Owner Decision 1[\s\S]*?(?=\n## |\n# |$)/g, '\n')
    .replace(/\n## RP-INTERNAL-BETA Google Cloud Managed Runtime Target Approval 1[\s\S]*?(?=\n## |\n# |$)/g, '\n')
    .replace(/\n## RP-INTERNAL-BETA Google Cloud Managed Runtime Implementation Plan 1[\s\S]*?(?=\n## |\n# |$)/g, '\n')
    .replace(/\n## RP-INTERNAL-BETA Google Cloud Environment Boundary 1[\s\S]*?(?=\n## |\n# |$)/g, '\n')
    .replace(/\n## RP-INTERNAL-BETA Google Cloud Environment Owner Input 1[\s\S]*?(?=\n## |\n# |$)/g, '\n')
    .replace(/\n## RP-INTERNAL-BETA Supabase Target RLS Storage Validation 1[\s\S]*?(?=\n## |\n# |$)/g, '\n')
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

const contractText = read('server/config/internal-beta-google-cloud-runtime-config-contract.ts')
for (const text of requiredContractText) {
  if (!contractText.includes(text)) fail(`missing contract text: ${text}`)
}
for (const forbidden of [
  '@google-cloud/',
  '@supabase/',
  'createClient(',
  'process.env.SUPABASE_SERVICE_ROLE_KEY',
  'process.env.GOOGLE_APPLICATION_CREDENTIALS',
  'execFileSync(',
  'fetch(',
  'gcloud',
  'SecretManagerServiceClient',
  'Storage(',
]) {
  if (contractText.includes(forbidden)) fail(`contract contains forbidden runtime dependency or call: ${forbidden}`)
}

const record = JSON.parse(read(`${packetDir}/google-cloud-runtime-config-contract-record.json`))
if (record.packet !== packet) fail('record packet mismatch')
if (record.decision !== 'completed_backend_only_google_cloud_runtime_config_contract_no_runtime_execution') fail('record decision mismatch')
if (record.execution !== 'completed_server_config_contract_no_cloud_or_supabase_execution') fail('record execution mismatch')
if (record.sourceMerge !== '643589bb30fb43a91312b292cd751b31b1dea6e0') fail('source merge mismatch')
if (record.priorPacket !== 'RP-INTERNAL-BETA-GOOGLE-CLOUD-ENVIRONMENT-OWNER-INPUT-1') fail('prior packet mismatch')
if (record.approvedRuntimeTarget !== 'google_cloud_managed_runtime_target') fail('approved runtime target mismatch')
if (record.environmentClass !== 'google_cloud_managed_internal_beta') fail('environment class mismatch')
if (record.readiness !== 'ready_for_supabase_target_rls_storage_validation') fail('readiness mismatch')
if (record.internalBetaEndToEndStatus !== 'not_ready_pending_supabase_rls_storage_and_runtime_implementation') fail('internal beta status mismatch')
if (record.runtimeEnabled !== false) fail('runtime must remain disabled')
if (record.runtimeExecutionAllowed !== false) fail('runtime execution must remain false')
if (record.deploymentApproved !== false) fail('deployment approval must remain false')
if (record.googleCloudProjectId !== 'reeditpro') fail('project id mismatch')
if (record.primaryRuntimeRegion !== 'us-east1') fail('primary region mismatch')
if (record.secondaryRuntimeRegion !== 'europe-west1') fail('secondary region mismatch')
if (record.stagingActivationRegion !== 'us-central1') fail('staging region mismatch')
if (record.supabaseTargetProject !== 'source_reference_names_recorded_no_remote_target_selected') fail('Supabase target must remain unresolved')
for (const key of [
  'googleCloudApiCall',
  'cloudRunServiceCreation',
  'cloudRunJobCreation',
  'cloudRunDeployment',
  'iamMutation',
  'secretManagerPayloadAccess',
  'gcsBucketCreation',
  'gcsObjectCreation',
  'gcsObjectRead',
  'remoteSupabaseMutation',
  'sqlExecution',
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
  'storageObjectCreation',
  'storageObjectRead',
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
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready tool count must remain 0')
if (record.nextMilestone !== 'RP-INTERNAL-BETA-SUPABASE-TARGET-RLS-STORAGE-VALIDATION-1') fail('next milestone mismatch')

const packageJson = JSON.parse(read('package.json'))
if (packageJson.scripts?.['rp-internal-beta-google-cloud-runtime-config-contract-1:diagnostics'] !== 'node scripts/validation/rp-internal-beta-google-cloud-runtime-config-contract-1-diagnostics.mjs') {
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
  'docker',
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
  const text = stripHistoricalSections(fs.readFileSync(file, 'utf8'))
  for (const pattern of forbiddenClaims) {
    if (pattern.test(text)) fail(`forbidden claim ${pattern} in ${file}`)
  }
}

console.log(`${packet} diagnostics passed`)
