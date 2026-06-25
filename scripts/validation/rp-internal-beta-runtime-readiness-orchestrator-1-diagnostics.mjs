#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-INTERNAL-BETA-RUNTIME-READINESS-ORCHESTRATOR-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const packetDir = 'docs/internal-beta/rp-internal-beta-runtime-readiness-orchestrator-1'

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/runtime-readiness-orchestrator.md`,
  `${packetDir}/component-matrix.md`,
  `${packetDir}/readiness-gate.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/runtime-readiness-orchestrator-record.json`,
  'docs/activation-phase-rp-internal-beta-runtime-readiness-orchestrator-1-results.md',
  'docs/implementation-prompts/prompt-rp-internal-beta-runtime-readiness-orchestrator-1.md',
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
  'server/services/internal-beta-runtime-readiness-orchestrator.ts',
  'server/smoke/internal-beta-runtime-readiness-orchestrator-smoke.ts',
  'scripts/validation/rp-internal-beta-runtime-readiness-orchestrator-1-diagnostics.mjs',
]

const allowedChangedFiles = new Set([
  ...requiredFiles,
  'package.json',
  'docs/activation-phase-rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed-results.md',
  'docs/implementation-prompts/prompt-rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed.md',
  'docs/internal-beta/rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed/confirmed-runner-record.json',
  'docs/internal-beta/rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed/confirmed-runner.md',
  'docs/internal-beta/rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed/readiness-gate.md',
  'docs/internal-beta/rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed/source-audit.md',
  'scripts/validation/rp-internal-beta-supabase-target-rls-storage-validation-1r-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed.mjs',
  'scripts/validation/rp-backend-02-internal-beta-service-role-runtime-scaffold-diagnostics.mjs',
  'scripts/validation/rp-credits-01-internal-beta-credit-ledger-runtime-scaffold-diagnostics.mjs',
  'scripts/validation/rp-jobs-01-internal-beta-job-queue-runtime-scaffold-diagnostics.mjs',
  'scripts/validation/rp-artifacts-01-internal-beta-private-artifact-manifest-scaffold-diagnostics.mjs',
  'scripts/validation/rp-render-01-internal-beta-remotion-render-worker-scaffold-diagnostics.mjs',
  'scripts/validation/rp-provider-01-internal-beta-disabled-provider-adapter-scaffold-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-e2e-negative-gate-tests-1-diagnostics.mjs',
])

const requiredText = [
  packet,
  'completed_internal_beta_runtime_readiness_orchestrator_fail_closed',
  'completed_local_orchestrator_scaffold_no_runtime_execution',
  'blocked_pending_supabase_target_validation_and_runtime_enablement',
  'integration head `a2af3ca8c2d9f7bfd93996a0458a41239b380dbe`',
  'PR #577 remains open/draft/blocked and excluded as source-of-truth',
  'Exact open duplicate PR: `none`',
  'Exact remote duplicate branch: `none`',
  'Internal beta end-to-end ready: `false`',
  'Internal beta end-to-end status: `not_ready`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'Supabase environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  'Service-role route execution: `none`',
  'Worker execution: `none`',
  'Provider/model calls: `none`',
  'Remotion execution: `none`',
  'Signed URLs created: `none`',
  'Public artifacts created: `none`',
  'Internal beta unlock: `false`',
  'External beta unlock: `false`',
  'Production unlock: `false`',
  'Service-role runtime: `8`',
  'Credit-ledger runtime: `6`',
  'Job-queue runtime: `8`',
  'Private artifact manifest: `8`',
  'Remotion render worker: `8`',
  'Provider adapter: `8`',
  'Total disabled operations: `46`',
  'confirmed_supabase_target_rls_storage_validation',
  'guarded_worker_runtime_rpc_staging_sql_execution',
  'RP-INTERNAL-BETA-SUPABASE-TARGET-RLS-STORAGE-VALIDATION-1R-CONFIRMED-RUN',
  'No Supabase mutation, SQL execution, migration apply, RLS policy apply, storage bucket creation, storage object creation, storage object read, Secret Manager payload access, service-role route execution, provider call, model call, raw prompt execution, worker execution, worker dispatch, worker lease claim, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, credit reservation creation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, package-lock mutation, final render/export, preview artifact creation, private media processing, user media processing, Remotion execution, FFmpeg execution, FFprobe execution, media processing, package installation beyond dependency validation, Dockerfile change, requirements change, or broad service-role handler was enabled.',
]

const forbiddenClaims = [
  /Internal beta end-to-end ready:\s*`?true/i,
  /Internal beta end-to-end status:\s*`?(ready|enabled|unlocked|passed)/i,
  /internal beta unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /external beta unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /production unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /Supabase mutation:\s*`?true/i,
  /SQL executed:(?!\s*`?none`?)/i,
  /Migration deployed:(?!\s*`?no`?)/i,
  /Service-role route execution:(?!\s*`?none`?)/i,
  /Worker execution:(?!\s*`?(false|none)`?)/i,
  /Worker dispatch:\s*`?true/i,
  /Provider\/model calls:(?!\s*`?none`?)/i,
  /Model call:\s*`?true/i,
  /Raw prompt execution:\s*`?true/i,
  /Remotion execution:(?!\s*`?none`?)/i,
  /Render\/export execution:\s*`?true/i,
  /Storage write:\s*`?true/i,
  /Storage read:\s*`?true/i,
  /Signed URLs created:(?!\s*`?none`?)/i,
  /Public artifacts created:(?!\s*`?none`?)/i,
  /Credit mutation:\s*`?true/i,
  /Credit reservation creation:\s*`?(true|completed|enabled|passed)/i,
  /Stripe.*processing:\s*`?(true|completed|enabled|passed)/i,
  /Package-lock:\s*`?changed/i,
  /Generated artifacts committed:(?!\s*`?none`?)/i,
  /dependency mutation:\s*`?(completed|enabled|true|passed)/i,
]

const forbiddenExactFiles = new Set([
  'package-lock.json',
  '.dockerignore',
])

const forbiddenPrefixes = [
  'server/routes/',
  'server/workers/',
  'supabase/',
  'database/',
  'docker/',
  'public/',
  'tests/',
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

const packetDocsCorpus = requiredFiles
  .filter((file) =>
    file.startsWith(packetDir) ||
    file === 'docs/activation-phase-rp-internal-beta-runtime-readiness-orchestrator-1-results.md' ||
    file === 'docs/implementation-prompts/prompt-rp-internal-beta-runtime-readiness-orchestrator-1.md',
  )
  .map(read)
  .join('\n')

for (const text of requiredText) {
  if (!docsCorpus.includes(text)) fail(`missing required text: ${text}`)
}

for (const pattern of forbiddenClaims) {
  if (pattern.test(packetDocsCorpus)) fail(`forbidden packet claim matched ${pattern}`)
}

const record = JSON.parse(read(`${packetDir}/runtime-readiness-orchestrator-record.json`))
if (record.decision !== 'completed_internal_beta_runtime_readiness_orchestrator_fail_closed') fail('record decision mismatch')
if (record.execution !== 'completed_local_orchestrator_scaffold_no_runtime_execution') fail('record execution mismatch')
if (record.status !== 'blocked_pending_supabase_target_validation_and_runtime_enablement') fail('record status mismatch')
if (record.baseIntegrationHead !== 'a2af3ca8c2d9f7bfd93996a0458a41239b380dbe') fail('base integration head mismatch')
if (record.internalBetaEndToEndReady !== false) fail('internal beta end-to-end ready must be false')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count must remain 0')
if (record.componentCounts?.total !== 46) fail('total disabled operation count must be 46')
for (const [key, expected] of Object.entries({
  serviceRoleRuntime: 8,
  creditLedgerRuntime: 6,
  jobQueueRuntime: 8,
  privateArtifactManifest: 8,
  remotionRenderWorker: 8,
  providerAdapter: 8,
})) {
  if (record.componentCounts?.[key] !== expected) fail(`${key} count mismatch`)
}
for (const key of [
  'unsafeExecutionDetected',
  'remoteSupabaseMutation',
  'sqlExecution',
  'migrationApply',
  'serviceRoleRouteExecution',
  'workerExecution',
  'workerDispatch',
  'providerModelCall',
  'modelCall',
  'secretPayloadAccess',
  'rawPromptExecution',
  'remotionExecution',
  'ffmpegExecution',
  'ffprobeExecution',
  'mediaProcessing',
  'renderExportExecution',
  'storageWrite',
  'storageRead',
  'signedUrlCreation',
  'publicArtifactCreation',
  'creditMutation',
  'stripePaymentProcessing',
  'internalBetaUnlock',
  'externalBetaUnlock',
  'productionUnlock',
]) {
  if (record[key] !== false) fail(`${key} must remain false`)
}
if (record.packageLock !== 'unchanged') fail('package lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')

const orchestrator = read('server/services/internal-beta-runtime-readiness-orchestrator.ts')
for (const required of [
  'INTERNAL_BETA_SERVICE_ROLE_RUNTIME_SCAFFOLDS',
  'INTERNAL_BETA_CREDIT_LEDGER_RUNTIME_SCAFFOLDS',
  'INTERNAL_BETA_JOB_QUEUE_RUNTIME_SCAFFOLDS',
  'INTERNAL_BETA_PRIVATE_ARTIFACT_MANIFEST_SCAFFOLDS',
  'INTERNAL_BETA_REMOTION_RENDER_WORKER_SCAFFOLDS',
  'INTERNAL_BETA_PROVIDER_ADAPTER_SCAFFOLDS',
  'createInternalBetaRuntimeReadinessOrchestratorReport',
  'assertInternalBetaRuntimeReadinessOrchestratorFailClosed',
  'blocked_pending_supabase_target_validation_and_runtime_enablement',
  'productReadyEndToEndLocalOssTools: 0',
  'unsafeExecutionDetected: false',
]) {
  if (!orchestrator.includes(required)) fail(`orchestrator missing ${required}`)
}
for (const pattern of [
  /\.from\(/,
  /\.insert\(/,
  /\.update\(/,
  /\.delete\(/,
  /\.rpc\(/,
  /createClient\(/,
  /fetch\(/,
  /exec(File)?Sync\(/,
  /spawn\(/,
  /renderMedia\(/,
  /renderStill\(/,
  /bundle\(/,
]) {
  if (pattern.test(orchestrator)) fail(`orchestrator contains forbidden runtime signal ${pattern}`)
}

const smoke = read('server/smoke/internal-beta-runtime-readiness-orchestrator-smoke.ts')
for (const required of [
  'createInternalBetaRuntimeReadinessOrchestratorReport',
  'assertInternalBetaRuntimeReadinessOrchestratorFailClosed',
  'report.componentCounts.total === 46',
  'report.safety.remoteSupabaseMutation === false',
  'report.safety.sqlExecution === false',
  'report.safety.workerExecution === false',
  'report.safety.providerModelCall === false',
  'report.safety.remotionExecution === false',
  'report.safety.signedUrlCreation === false',
  'report.safety.publicArtifactCreation === false',
  'report.safety.internalBetaUnlock === false',
  'must_not_appear',
]) {
  if (!smoke.includes(required)) fail(`smoke missing ${required}`)
}
for (const pattern of [
  /\.from\(/,
  /\.insert\(/,
  /\.update\(/,
  /\.delete\(/,
  /\.rpc\(/,
  /createClient\(/,
  /fetch\(/,
  /exec(File)?Sync\(/,
  /spawn\(/,
  /renderMedia\(/,
  /renderStill\(/,
  /bundle\(/,
]) {
  if (pattern.test(smoke)) fail(`smoke contains forbidden runtime signal ${pattern}`)
}

const packageJson = JSON.parse(read('package.json'))
if (packageJson.scripts?.['smoke:internal-beta-runtime-readiness-orchestrator'] !== 'tsx server/smoke/internal-beta-runtime-readiness-orchestrator-smoke.ts') {
  fail('missing runtime readiness orchestrator smoke script')
}
if (packageJson.scripts?.['rp-internal-beta-runtime-readiness-orchestrator-1:diagnostics'] !== 'node scripts/validation/rp-internal-beta-runtime-readiness-orchestrator-1-diagnostics.mjs') {
  fail('missing runtime readiness orchestrator diagnostics script')
}

gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock.json changed')
for (const file of [
  'supabase',
  'database',
  'docker',
  '.dockerignore',
  'server/routes',
  'server/workers',
  'public',
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
    file.endsWith('.webm') ||
    file.endsWith('.mp3') ||
    file.endsWith('.wav') ||
    file.endsWith('.png') ||
    file.endsWith('.jpg') ||
    file.endsWith('.jpeg')
  ) {
    fail(`forbidden changed file ${file}`)
  }
}

const changedAdditions = execFileSync('git', ['diff', '--unified=0', 'HEAD', '--', ...changedFiles], {
  env: gitEnv,
  encoding: 'utf8',
})
  .split('\n')
  .filter((line) => line.startsWith('+') && !line.startsWith('+++'))
  .map((line) => line.slice(1))
  .join('\n')
for (const pattern of [
  /internal beta unlock(?:ed)?\s*[:=]\s*(true|enabled|passed|completed)/i,
  /external beta unlock(?:ed)?\s*[:=]\s*(true|enabled|passed|completed)/i,
  /production unlock(?:ed)?\s*[:=]\s*(true|enabled|passed|completed)/i,
  /Supabase mutation:\s*`?true/i,
  /SQL executed:(?!\s*`?none`?)/i,
  /service-role route execution:\s*`?(true|completed|enabled|passed)/i,
  /worker execution:\s*`?(true|completed|enabled|passed)/i,
  /provider\/model calls:\s*`?(true|completed|enabled|passed)/i,
  /render\/export execution:\s*`?(true|completed|enabled|passed)/i,
  /signed URL creation:\s*`?(true|completed|enabled|passed)/i,
  /public artifact creation:\s*`?(true|completed|enabled|passed)/i,
]) {
  if (pattern.test(changedAdditions)) fail(`forbidden changed-file claim matched ${pattern}`)
}

console.log(`${packet} diagnostics passed`)
