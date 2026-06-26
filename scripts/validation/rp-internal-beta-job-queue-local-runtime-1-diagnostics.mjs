#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-INTERNAL-BETA-JOB-QUEUE-LOCAL-RUNTIME-1'
const packetDir = 'docs/internal-beta/rp-internal-beta-job-queue-local-runtime-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/runtime-contract.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/readiness-gate.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/job-queue-local-runtime-record.json`,
  'docs/activation-phase-rp-internal-beta-job-queue-local-runtime-1-results.md',
]

const requiredFiles = [
  ...packetFiles,
  'server/services/internal-beta-job-queue-local-runtime.ts',
  'server/smoke/internal-beta-job-queue-local-runtime-smoke.ts',
  'implementation-status-and-next-phase.md',
  'docs/production-beta-blocker-inventory.md',
  'scripts/validation/rp-internal-beta-job-queue-local-runtime-1-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-credit-reservation-local-runtime-1-diagnostics.mjs',
  'scripts/validation/rp-jobs-01-internal-beta-job-queue-runtime-scaffold-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-local-readiness-gate-rollup-1-diagnostics.mjs',
  'package.json',
]

const allowedChangedFiles = new Set(requiredFiles)

const requiredText = [
  packet,
  'completed_local_job_queue_metadata_runtime_no_worker_execution',
  'completed_backend_local_job_queue_validation_no_route_or_worker_execution',
  'local_job_queue_metadata_validated_no_worker_execution',
  'blocked_invalid_job_queue_input',
  'Local job batch record created: `true`',
  'Local job records created: `2`',
  'Local job dependency records created: `1`',
  'Local job event records created: `2`',
  'Job enqueue executed: `false`',
  'Job event write executed: `false`',
  'Worker lease claim executed: `false`',
  'Worker heartbeat executed: `false`',
  'Worker dispatch executed: `false`',
  'Worker execution: `false`',
  'Supabase persistence: `false`',
  'Internal beta end-to-end ready: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'Next safe milestone: `RP-INTERNAL-BETA-PRIVATE-ARTIFACT-MANIFEST-LOCAL-RUNTIME-1`',
  'No Supabase mutation, SQL execution, migration apply, RLS policy apply, storage bucket creation, storage object creation, storage object read, Secret Manager payload access, service-role secret payload access, frontend service-role credential exposure, service-role route execution, provider call, model call, worker execution, worker dispatch, worker lease claim, worker heartbeat, route execution, browser capture, signed URL creation, public artifact creation, real credit mutation, job enqueue execution, job event write execution, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, package-lock mutation, raw prompt execution, final render/export, preview artifact creation, private media processing, user media processing, Remotion execution, FFmpeg execution, FFprobe execution, media processing, Docker execution, package installation beyond dependency validation, or broad service-role handler was enabled.',
]

const forbiddenClaims = [
  /Internal beta end-to-end ready:\s*`?true/i,
  /Internal beta end-to-end status:\s*`?(ready|enabled|unlocked|passed)/i,
  /internal beta unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /external beta unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /production unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /Job enqueue executed:\s*`?true/i,
  /Job event write executed:\s*`?true/i,
  /Worker lease claim executed:\s*`?true/i,
  /Worker heartbeat executed:\s*`?true/i,
  /Worker dispatch executed:\s*`?true/i,
  /Worker execution:\s*`?true/i,
  /Supabase persistence:\s*`?true/i,
  /Remote Supabase mutation:\s*`?true/i,
  /SQL execution:\s*`?true/i,
  /Service-role route execution:\s*`?true/i,
  /Provider\/model call:\s*`?true/i,
  /Signed URL creation:\s*`?true/i,
  /Public artifact creation:\s*`?true/i,
  /Package-lock:\s*`?(changed|mutated)/i,
  /Generated artifacts committed:(?!\s*`?none`?)/i,
]

const forbiddenExactFiles = new Set(['package-lock.json', '.dockerignore'])
const forbiddenPrefixes = [
  'supabase/',
  'docker/',
  '.github/workflows/',
  'server/routes/',
  'server/workers/',
  'server/config/',
  'src/',
  'database/',
  'public/',
  'tests/',
]

const allowedServerFiles = new Set([
  'server/services/internal-beta-job-queue-local-runtime.ts',
  'server/smoke/internal-beta-job-queue-local-runtime-smoke.ts',
])

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

const docsCorpus = [
  ...packetFiles,
  'implementation-status-and-next-phase.md',
  'docs/production-beta-blocker-inventory.md',
].map(read).join('\n')

for (const token of requiredText) {
  if (!docsCorpus.includes(token)) fail(`missing required text: ${token}`)
}

const packetCorpus = packetFiles.map(read).join('\n')
for (const pattern of forbiddenClaims) {
  if (pattern.test(packetCorpus)) fail(`forbidden docs claim matched ${pattern}`)
}

const record = JSON.parse(read(`${packetDir}/job-queue-local-runtime-record.json`))
if (record.decision !== 'completed_local_job_queue_metadata_runtime_no_worker_execution') fail('record decision mismatch')
if (record.execution !== 'completed_backend_local_job_queue_validation_no_route_or_worker_execution') fail('record execution mismatch')
if (record.localRuntimeStatus !== 'local_job_queue_metadata_validated_no_worker_execution') fail('local runtime status mismatch')
if (record.invalidInputBlocker !== 'blocked_invalid_job_queue_input') fail('invalid input blocker mismatch')
if (record.localJobBatchRecordCreated !== true) fail('local job batch flag mismatch')
if (record.localJobRecordsCreated !== 2) fail('local job count mismatch')
if (record.localJobDependencyRecordsCreated !== 1) fail('local dependency count mismatch')
if (record.localJobEventRecordsCreated !== 2) fail('local event count mismatch')
if (record.internalBetaEndToEndReady !== false) fail('internal beta must remain blocked')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count must remain 0')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')
for (const key of [
  'jobEnqueueExecution',
  'jobEventWriteExecution',
  'workerLeaseClaim',
  'workerHeartbeat',
  'workerExecution',
  'workerDispatch',
  'routeExecution',
  'persistedToSupabase',
  'remoteSupabaseMutation',
  'sqlExecution',
  'migrationApply',
  'serviceRoleRouteExecution',
  'creditMutation',
  'realCreditMutation',
  'providerModelCall',
  'rawPromptExecution',
  'renderExportExecution',
  'previewArtifactCreation',
  'finalExportCreation',
  'storageObjectCreation',
  'storageObjectRead',
  'signedUrlCreation',
  'publicArtifactCreation',
  'internalBetaUnlock',
  'externalBetaUnlock',
  'productionUnlock',
]) {
  if (record[key] !== false) fail(`${key} must remain false`)
}

const service = read('server/services/internal-beta-job-queue-local-runtime.ts')
for (const token of [
  'createInternalBetaJobQueueLocalRuntime',
  'INTERNAL_BETA_JOB_QUEUE_LOCAL_RUNTIME_RULE',
  'local_job_queue_metadata_validated_no_worker_execution',
  'blocked_invalid_job_queue_input',
  'queued_metadata_only',
  'workerLeaseClaimed: false',
  'workerExecution: false',
  'workerDispatch: false',
  'jobEventWriteExecution: false',
  'job_batch_',
  'job_',
  'job_dependency_',
  'job_event_',
  'signedUrl',
  'providerApiKey',
  'serviceRoleKey',
]) {
  if (!service.includes(token)) fail(`service missing token ${token}`)
}
for (const pattern of [
  /\.from\(/,
  /\.insert\(/,
  /\.delete\(/,
  /\.rpc\(/,
  /createClient\(/,
  /fetch\(/,
  /exec(File)?Sync\(/,
  /spawn\(/,
  /registerMockRouteHandler\(/,
]) {
  if (pattern.test(service)) fail(`service contains forbidden runtime signal ${pattern}`)
}

const smoke = read('server/smoke/internal-beta-job-queue-local-runtime-smoke.ts')
for (const token of [
  'same job queue basis should hash deterministically',
  'creditReservationId',
  'must not depend on itself',
  'raw prompt',
  'signed/public URL',
  'internal-beta-job-queue-local-runtime-smoke passed',
]) {
  if (!smoke.includes(token)) fail(`smoke missing token ${token}`)
}

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['smoke:internal-beta-job-queue-local-runtime'] !==
  'tsx server/smoke/internal-beta-job-queue-local-runtime-smoke.ts'
) {
  fail('missing job queue local runtime smoke script')
}
if (
  packageJson.scripts?.['rp-internal-beta-job-queue-local-runtime-1:diagnostics'] !==
  'node scripts/validation/rp-internal-beta-job-queue-local-runtime-1-diagnostics.mjs'
) {
  fail('missing job queue local runtime diagnostics script')
}

gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock changed')
for (const blocked of ['supabase', 'docker', 'src', 'database', '.github/workflows', '.dockerignore']) {
  gitQuiet(['diff', '--quiet', '--', blocked], `${blocked} changed`)
}

const changed = [...new Set([
  ...gitLines(['diff', '--name-only', 'HEAD']),
  ...gitLines(['ls-files', '--others', '--exclude-standard']),
  ...gitLines(['diff', '--cached', '--name-only']),
])]

for (const file of changed) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file ${file}`)
  if (forbiddenExactFiles.has(file) || forbiddenPrefixes.some((prefix) => file.startsWith(prefix))) {
    if (!allowedServerFiles.has(file)) fail(`forbidden changed file ${file}`)
  }
  if (/\.(sql|mp4|mov|mkv|webm|zip|gz|tar|tgz|env)$/.test(file)) fail(`forbidden artifact ${file}`)
}

console.log(`${packet} diagnostics passed`)
