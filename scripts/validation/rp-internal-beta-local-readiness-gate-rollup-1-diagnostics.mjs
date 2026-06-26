#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-INTERNAL-BETA-LOCAL-READINESS-GATE-ROLLUP-1'
const packetDir = 'docs/internal-beta/rp-internal-beta-local-readiness-gate-rollup-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/local-readiness-gate-rollup.md`,
  `${packetDir}/readiness-matrix.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/local-readiness-gate-rollup-record.json`,
  'docs/activation-phase-rp-internal-beta-local-readiness-gate-rollup-1-results.md',
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
  'scripts/validation/rp-internal-beta-local-readiness-gate-rollup-1.mjs',
  'scripts/validation/rp-internal-beta-local-readiness-gate-rollup-1-diagnostics.mjs',
  'package.json',
]

const allowedChangedFiles = new Set(requiredFiles)

const approvedSnapshotLocalRuntimeFiles = [
  'docs/internal-beta/rp-internal-beta-approved-snapshot-persistence-local-runtime-1/source-audit.md',
  'docs/internal-beta/rp-internal-beta-approved-snapshot-persistence-local-runtime-1/runtime-contract.md',
  'docs/internal-beta/rp-internal-beta-approved-snapshot-persistence-local-runtime-1/validation-results.md',
  'docs/internal-beta/rp-internal-beta-approved-snapshot-persistence-local-runtime-1/readiness-gate.md',
  'docs/internal-beta/rp-internal-beta-approved-snapshot-persistence-local-runtime-1/safety-boundary.md',
  'docs/internal-beta/rp-internal-beta-approved-snapshot-persistence-local-runtime-1/approved-snapshot-local-runtime-record.json',
  'docs/activation-phase-rp-internal-beta-approved-snapshot-persistence-local-runtime-1-results.md',
  'server/services/internal-beta-approved-snapshot-persistence-local-runtime.ts',
  'server/smoke/internal-beta-approved-snapshot-persistence-local-runtime-smoke.ts',
  'scripts/validation/rp-internal-beta-approved-snapshot-persistence-local-runtime-1-diagnostics.mjs',
]

for (const file of approvedSnapshotLocalRuntimeFiles) {
  allowedChangedFiles.add(file)
}

const requiredText = [
  packet,
  'blocked_internal_beta_not_ready_missing_supabase_credential_context_and_runtime_gates',
  'completed_local_readiness_gate_rollup_no_remote_execution',
  'blocked_missing_approved_supabase_access_token_alias_and_readonly_db_url_alias',
  'blocked_pending_supabase_target_validation_and_runtime_enablement',
  'approved_supabase_credential_context_present',
  'confirmed_supabase_target_rls_storage_validation',
  'guarded_worker_runtime_rpc_staging_sql_execution',
  'service_role_runtime_enablement',
  'approved_snapshot_persistence_runtime',
  'credit_ledger_transaction_runtime',
  'job_queue_lease_event_runtime',
  'private_artifact_manifest_storage_runtime',
  'remotion_private_preview_export_runtime',
  'provider_runtime_owner_approval_if_needed',
  'qa_cleanup_observability_rollback_gates',
  'negative_e2e_runtime_gate_regression',
  'Internal beta end-to-end ready: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  'PR #577 remains open/draft/blocked and excluded as source-of-truth',
  'RP-INTERNAL-BETA-SUPABASE-TARGET-RLS-STORAGE-VALIDATION-1R-CONFIRMED-RUN',
  'No remote Supabase command, remote Supabase mutation, SQL execution, SQL mutation, migration apply, RLS policy apply, storage bucket creation, storage object creation, storage object read, service-role secret payload access, frontend service-role credential exposure, service-role route execution, Google Cloud API call, Cloud Run service creation, Cloud Run job creation, Cloud Run deployment, IAM mutation, GCS bucket creation, GCS object access, provider call, model call, raw prompt execution, worker execution, worker dispatch, worker lease claim, route execution, browser capture, Remotion execution, FFmpeg execution, FFprobe execution, media processing, signed URL creation, public artifact creation, credit mutation, credit reservation creation, credit spend, job enqueue, job event write, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, final render/export, preview artifact creation, private media processing, user media processing, package installation beyond dependency validation, dependency mutation, package-lock mutation, Dockerfile change, requirements change, or broad service-role handler was enabled.',
]

const forbiddenClaims = [
  /Internal beta end-to-end ready:\s*`?true/i,
  /Internal beta end-to-end status:\s*`?(ready|enabled|unlocked|passed)/i,
  /internal beta unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /external beta unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /production unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /Remote Supabase command:\s*`?true/i,
  /Remote Supabase mutation:\s*`?true/i,
  /SQL execution:\s*`?true/i,
  /SQL mutation:\s*`?true/i,
  /SQL executed:(?!\s*`?none`?)/i,
  /Migration apply:\s*`?true/i,
  /Migration deployed:(?!\s*`?no`?)/i,
  /Storage object read:\s*`?true/i,
  /Service-role secret payload access:\s*`?true/i,
  /Frontend service-role credential exposure:\s*`?true/i,
  /Service-role route execution:\s*`?true/i,
  /Worker execution:\s*`?true/i,
  /Worker dispatch:\s*`?true/i,
  /Provider\/model calls:\s*`?(true|completed|enabled|passed)/i,
  /Signed URL creation:\s*`?true/i,
  /Public artifact creation:\s*`?true/i,
  /Credit mutation:\s*`?true/i,
  /Job enqueue:\s*`?true/i,
  /Package-lock:\s*`?changed/i,
  /Generated artifacts committed:(?!\s*`?none`?)/i,
]

const forbiddenExactFiles = new Set(['package-lock.json', '.dockerignore'])
const forbiddenPrefixes = [
  'server/routes/',
  'server/workers/',
  'supabase/',
  'database/',
  'docker/',
  'public/',
  'tests/',
  'src/',
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

const docsCorpus = requiredFiles
  .filter((file) => file.startsWith('docs/') || file === 'implementation-status-and-next-phase.md')
  .map(read)
  .join('\n')

const packetCorpus = requiredFiles
  .filter((file) => file.startsWith(packetDir) || file === 'docs/activation-phase-rp-internal-beta-local-readiness-gate-rollup-1-results.md')
  .map(read)
  .join('\n')

for (const text of requiredText) {
  if (!docsCorpus.includes(text)) fail(`missing required text: ${text}`)
}

for (const pattern of forbiddenClaims) {
  if (packetCorpus.match(pattern)) fail(`forbidden packet claim matched ${pattern}`)
}

const record = JSON.parse(read(`${packetDir}/local-readiness-gate-rollup-record.json`))
if (record.decision !== 'blocked_internal_beta_not_ready_missing_supabase_credential_context_and_runtime_gates') {
  fail('record decision mismatch')
}
if (record.execution !== 'completed_local_readiness_gate_rollup_no_remote_execution') fail('record execution mismatch')
if (record.internalBetaEndToEndReady !== false) fail('internal beta readiness must remain false')
if (record.internalBetaEndToEndStatus !== 'not_ready') fail('internal beta status must remain not_ready')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count must remain 0')
if (record.currentSupabaseCredentialContext !== 'blocked_missing_approved_supabase_access_token_alias_and_readonly_db_url_alias') {
  fail('credential context blocker mismatch')
}
if (record.currentSupabaseValidation !== 'blocked_missing_approved_supabase_access_token_alias_and_readonly_db_url_alias') {
  fail('current Supabase validation blocker mismatch')
}
if (record.runtimeReadinessStatus !== 'blocked_pending_supabase_target_validation_and_runtime_enablement') {
  fail('runtime readiness status mismatch')
}
if (record.componentCounts?.total !== 46) fail('total disabled operation count must be 46')
if (!record.requiredBeforeInternalBeta?.includes('approved_supabase_credential_context_present')) {
  fail('missing approved credential context gate')
}
if (!record.requiredBeforeInternalBeta?.includes('negative_e2e_runtime_gate_regression')) {
  fail('missing negative runtime regression gate')
}
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')

for (const key of [
  'remoteSupabaseCommand',
  'remoteSupabaseMutation',
  'sqlExecution',
  'sqlMutation',
  'migrationApply',
  'rlsPolicyApply',
  'storageBucketCreation',
  'storageObjectCreation',
  'storageObjectRead',
  'serviceRoleSecretPayloadAccess',
  'frontendServiceRoleCredentialExposure',
  'serviceRoleRouteExecution',
  'googleCloudApiCall',
  'cloudRunServiceCreation',
  'cloudRunJobCreation',
  'cloudRunDeployment',
  'iamMutation',
  'gcsBucketCreation',
  'gcsObjectAccess',
  'providerModelCall',
  'modelCall',
  'rawPromptExecution',
  'workerExecution',
  'workerDispatch',
  'workerLeaseClaim',
  'routeExecution',
  'browserCapture',
  'remotionExecution',
  'ffmpegExecution',
  'ffprobeExecution',
  'mediaProcessing',
  'signedUrlCreation',
  'publicArtifactCreation',
  'creditMutation',
  'creditReservationCreation',
  'creditSpend',
  'jobEnqueue',
  'jobEventWrite',
  'stripePaymentProcessing',
  'deployment',
  'internalBetaUnlock',
  'externalBetaUnlock',
  'productionUnlock',
  'finalRenderExport',
  'previewArtifactCreation',
  'privateMediaProcessing',
  'userMediaProcessing',
  'dependencyMutation',
]) {
  if (record[key] !== false) fail(`${key} must remain false`)
}

const runner = read('scripts/validation/rp-internal-beta-local-readiness-gate-rollup-1.mjs')
for (const required of [
  'completed_local_readiness_gate_rollup_no_remote_execution',
  'blocked_internal_beta_not_ready_missing_supabase_credential_context_and_runtime_gates',
  'blocked_missing_approved_supabase_access_token_alias_and_readonly_db_url_alias',
  'RP-INTERNAL-BETA-SUPABASE-TARGET-RLS-STORAGE-VALIDATION-1R-CONFIRMED-RUN',
  '/tmp/reeditpro-rp-internal-beta-local-readiness-gate-rollup-1',
]) {
  if (!runner.includes(required)) fail(`runner missing ${required}`)
}
for (const pattern of [
  /exec(File)?Sync\(/,
  /spawn\(/,
  /fetch\(/,
  /createClient\(/,
  /\.from\(/,
  /\.insert\(/,
  /\.delete\(/,
  /\.rpc\(/,
  /renderMedia\(/,
  /renderStill\(/,
  /bundle\(/,
]) {
  if (pattern.test(runner)) fail(`runner contains forbidden execution signal ${pattern}`)
}

const packageJson = JSON.parse(read('package.json'))
if (packageJson.scripts?.['rp-internal-beta-local-readiness-gate-rollup-1'] !== 'node scripts/validation/rp-internal-beta-local-readiness-gate-rollup-1.mjs') {
  fail('missing local readiness rollup runner script')
}
if (packageJson.scripts?.['rp-internal-beta-local-readiness-gate-rollup-1:diagnostics'] !== 'node scripts/validation/rp-internal-beta-local-readiness-gate-rollup-1-diagnostics.mjs') {
  fail('missing local readiness rollup diagnostics script')
}

gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock changed')
for (const blocked of ['supabase', 'server/routes', 'server/workers', 'docker', 'src', 'database', '.dockerignore']) {
  gitQuiet(['diff', '--quiet', '--', blocked], `${blocked} changed`)
}

const changed = [
  ...new Set([
    ...gitLines(['diff', '--name-only', 'HEAD']),
    ...gitLines(['ls-files', '--others', '--exclude-standard']),
    ...gitLines(['diff', '--cached', '--name-only']),
  ]),
]

for (const file of changed) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file ${file}`)
  if (forbiddenExactFiles.has(file) || forbiddenPrefixes.some((prefix) => file.startsWith(prefix))) {
    fail(`forbidden changed file ${file}`)
  }
  if (/\.(sql|mp4|mov|mkv|webm|zip|gz|tar|tgz|env)$/.test(file)) fail(`forbidden artifact ${file}`)
}

console.log(`${packet} diagnostics passed`)
