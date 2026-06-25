#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-JOBS-01-INTERNAL-BETA-JOB-QUEUE-RUNTIME-SCAFFOLD'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetDir = 'docs/internal-beta/rp-jobs-01-internal-beta-job-queue-runtime-scaffold'
const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/job-queue-scaffold-matrix.md`,
  `${packetDir}/worker-runtime-boundary.md`,
  `${packetDir}/readiness-gate.md`,
  `${packetDir}/job-scaffold-record.json`,
  'docs/activation-phase-rp-jobs-01-internal-beta-job-queue-runtime-scaffold-results.md',
  'docs/implementation-prompts/prompt-rp-artifacts-01-internal-beta-private-artifact-manifest-scaffold.md',
  'docs/implementation-prompts/prompt-rp-render-01-internal-beta-remotion-render-worker-scaffold.md',
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
  'server/services/internal-beta-job-queue-runtime-scaffold.ts',
  'scripts/validation/rp-backend-01-internal-beta-service-role-api-contracts-diagnostics.mjs',
  'scripts/validation/rp-backend-02-internal-beta-service-role-runtime-scaffold-diagnostics.mjs',
  'scripts/validation/rp-credits-01-internal-beta-credit-ledger-runtime-scaffold-diagnostics.mjs',
  'scripts/validation/rp-jobs-01-internal-beta-job-queue-runtime-scaffold-diagnostics.mjs',
  'scripts/validation/rp-artifacts-01-internal-beta-private-artifact-manifest-scaffold-diagnostics.mjs',
]

const allowedChangedFiles = new Set([
  ...requiredFiles,
  'docs/internal-beta/rp-artifacts-01-internal-beta-private-artifact-manifest-scaffold/source-audit.md',
  'docs/internal-beta/rp-artifacts-01-internal-beta-private-artifact-manifest-scaffold/artifact-manifest-scaffold-matrix.md',
  'docs/internal-beta/rp-artifacts-01-internal-beta-private-artifact-manifest-scaffold/private-artifact-boundary.md',
  'docs/internal-beta/rp-artifacts-01-internal-beta-private-artifact-manifest-scaffold/readiness-gate.md',
  'docs/internal-beta/rp-artifacts-01-internal-beta-private-artifact-manifest-scaffold/artifact-scaffold-record.json',
  'docs/activation-phase-rp-artifacts-01-internal-beta-private-artifact-manifest-scaffold-results.md',
  'server/services/internal-beta-private-artifact-manifest-scaffold.ts',
  'package.json',
])

const requiredText = [
  packet,
  'completed_disabled_internal_beta_job_queue_runtime_scaffold_no_worker_execution',
  'completed_fail_closed_job_queue_scaffold_no_route_or_worker_execution',
  '`RP-CREDITS-01-INTERNAL-BETA-CREDIT-LEDGER-RUNTIME-SCAFFOLD` is merged at `eb832fa5c3c9e744a9e60fc742f932a2e2b48516`',
  'Internal beta end-to-end status: `not_ready`',
  'Product-ready end-to-end local OSS tools: `0`',
  '#577 remains open/draft/blocked and excluded as source-of-truth',
  'Exact open duplicate PR: `none`',
  'Exact remote duplicate branch: `none`',
  'Related worker/runtime draft PRs: `context_only_not_claimed`',
  'Job queue runtime scaffold operations added: `8`',
  'Runtime scaffold status: `disabled_pending_job_queue_runtime_gate`',
  'Job enqueue executed: `false`',
  'Job event write executed: `false`',
  'Worker lease claim executed: `false`',
  'Worker heartbeat executed: `false`',
  'Worker dispatch executed: `false`',
  'Route execution: `false`',
  'Credit mutation: `false`',
  'Supabase mutation: `false`',
  'Provider/model calls: `false`',
  'Render/export execution: `false`',
  'Internal beta unlock: `false`',
  'Public artifacts created: `none`',
  'Next recommended milestone: `RP-ARTIFACTS-01-INTERNAL-BETA-PRIVATE-ARTIFACT-MANIFEST-SCAFFOLD`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'Supabase remote environment touched: `none`',
  'SQL executed: `none`',
  'No remote Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, worker dispatch, worker lease claim, worker heartbeat, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, job enqueue, job event write, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, private media processing, user media processing, package installation beyond dependency validation, dependency mutation, package-lock mutation, Dockerfile change, requirements change, or broad service-role handler was enabled.',
]

const forbiddenClaims = [
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
  /Route execution:\s*`?true/i,
  /Credit mutation:\s*`?true/i,
  /Supabase mutation:\s*`?true/i,
  /Provider\/model calls:\s*`?true/i,
  /Render\/export execution:\s*`?true/i,
  /Public artifacts created:(?!\s*`?none`?)/i,
  /Supabase remote environment touched:(?!\s*`?none`?)/i,
  /SQL executed:(?!\s*`?none`?)/i,
  /job enqueue:\s*`?(completed|enabled|true|passed)/i,
  /job event write:\s*`?(completed|enabled|true|passed)/i,
  /worker lease claim:\s*`?(completed|enabled|true|passed)/i,
  /worker heartbeat:\s*`?(completed|enabled|true|passed)/i,
  /worker dispatch:\s*`?(completed|enabled|true|passed)/i,
  /provider\/model execution:\s*`?(completed|enabled|true|passed)/i,
  /render\/export execution:\s*`?(completed|enabled|true|passed)/i,
  /signed URL(?:s)?\s*:\s*`?(created|enabled|true|passed)/i,
  /public artifact(?:s)?\s*:\s*`?(created|enabled|true|passed)/i,
  /package-lock:\s*`?changed/i,
  /dependency mutation:\s*`?(completed|enabled|true|passed)/i,
  /package installation:\s*`?(completed|enabled|true|passed)/i,
]

const forbiddenExactFiles = new Set([
  'package-lock.json',
  '.dockerignore',
])

const forbiddenPrefixes = [
  'server/routes/',
  'server/workers/',
  'database/',
  'docker/',
  'public/',
  'tests/',
  'supabase/migrations/',
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
    .replace(/\n## RP-ARTIFACTS-01[\s\S]*?(?=\n## |\n# |$)/g, '\n')
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

const record = JSON.parse(read(`${packetDir}/job-scaffold-record.json`))
if (record.decision !== 'completed_disabled_internal_beta_job_queue_runtime_scaffold_no_worker_execution') fail('record decision mismatch')
if (record.execution !== 'completed_fail_closed_job_queue_scaffold_no_route_or_worker_execution') fail('record execution mismatch')
if (record.baseMerge !== 'eb832fa5c3c9e744a9e60fc742f932a2e2b48516') fail('base merge mismatch')
if (record.internalBetaEndToEndStatus !== 'not_ready') fail('internal beta status must stay not_ready')
if (record.jobQueueRuntimeScaffoldOperationsAdded !== 8) fail('job queue operation count mismatch')
if (record.runtimeScaffoldStatus !== 'disabled_pending_job_queue_runtime_gate') fail('runtime scaffold status mismatch')
if (record.exactOpenDuplicatePr !== 'none') fail('exact open duplicate PR must be none')
if (record.exactRemoteDuplicateBranch !== 'none') fail('exact remote duplicate branch must be none')
if (record.jobEnqueueExecuted !== false) fail('job enqueue must remain false')
if (record.jobEventWriteExecuted !== false) fail('job event write must remain false')
if (record.workerLeaseClaimExecuted !== false) fail('worker lease claim must remain false')
if (record.workerHeartbeatExecuted !== false) fail('worker heartbeat must remain false')
if (record.workerDispatchExecuted !== false) fail('worker dispatch must remain false')
if (record.routeExecution !== false) fail('route execution must remain false')
if (record.creditMutation !== false) fail('credit mutation must remain false')
if (record.supabaseMutation !== false) fail('supabase mutation must remain false')
if (record.providerModelCalls !== false) fail('provider/model calls must remain false')
if (record.renderExportExecution !== false) fail('render/export execution must remain false')
if (record.internalBetaUnlock !== false) fail('internal beta unlock must remain false')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready tool count must remain 0')

const scaffold = read('server/services/internal-beta-job-queue-runtime-scaffold.ts')
const operations = scaffold.match(/operation: '[^']+'/g) ?? []
if (operations.length !== 8) fail(`expected 8 job queue operations, found ${operations.length}`)
for (const name of [
  'createInternalBetaJobBatchRuntimeScaffold',
  'enqueueInternalBetaJobRuntimeScaffold',
  'readInternalBetaJobStatusRuntimeScaffold',
  'appendInternalBetaJobEventRuntimeScaffold',
  'claimInternalBetaWorkerLeaseRuntimeScaffold',
  'heartbeatInternalBetaWorkerLeaseRuntimeScaffold',
  'scheduleInternalBetaJobRetryRuntimeScaffold',
  'cancelInternalBetaJobRuntimeScaffold',
]) {
  if (!scaffold.includes(`function ${name}`)) fail(`missing scaffold function ${name}`)
}
for (const required of [
  "status: 'disabled_pending_job_queue_runtime_gate'",
  'routeExecution: false',
  'workerExecution: false',
  'providerModelCalls: false',
  'renderExportExecution: false',
  'creditMutation: false',
  'supabaseMutation: false',
  'privateArtifactAccessEnabled: false',
  'publicArtifactsCreated: false',
  'internalBetaUnlock: false',
]) {
  if (!scaffold.includes(required)) fail(`missing scaffold boundary ${required}`)
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
  /registerMockRouteHandler\(/,
]) {
  if (pattern.test(scaffold)) fail(`scaffold contains forbidden runtime signal ${pattern}`)
}

const packageJson = JSON.parse(read('package.json'))
const expectedScript = 'node scripts/validation/rp-jobs-01-internal-beta-job-queue-runtime-scaffold-diagnostics.mjs'
if (packageJson.scripts?.['rp-jobs-01:internal-beta-job-queue-runtime-scaffold:diagnostics'] !== expectedScript) {
  fail('missing package diagnostics script')
}

gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock.json changed')
for (const file of [
  'supabase/migrations',
  '.dockerignore',
  'database/migration-drafts',
  'database/test-sql',
  'server/routes',
  'server/workers',
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
    (![
      'server/services/internal-beta-job-queue-runtime-scaffold.ts',
      'server/services/internal-beta-private-artifact-manifest-scaffold.ts',
    ].includes(file) &&
      forbiddenPrefixes.some((prefix) => file.startsWith(prefix))) ||
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
  const text = stripHistoricalSections(read(file))
  for (const pattern of forbiddenClaims) {
    if (pattern.test(text)) fail(`forbidden changed-file claim in ${file}: ${pattern}`)
  }
}

console.log(`${packet} diagnostics passed`)
