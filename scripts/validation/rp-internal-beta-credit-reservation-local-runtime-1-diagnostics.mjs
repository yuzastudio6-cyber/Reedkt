#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-INTERNAL-BETA-CREDIT-RESERVATION-LOCAL-RUNTIME-1'
const packetDir = 'docs/internal-beta/rp-internal-beta-credit-reservation-local-runtime-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/runtime-contract.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/readiness-gate.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/credit-reservation-local-runtime-record.json`,
  'docs/activation-phase-rp-internal-beta-credit-reservation-local-runtime-1-results.md',
]

const requiredFiles = [
  ...packetFiles,
  'server/services/internal-beta-credit-reservation-local-runtime.ts',
  'server/smoke/internal-beta-credit-reservation-local-runtime-smoke.ts',
  'implementation-status-and-next-phase.md',
  'docs/production-beta-blocker-inventory.md',
  'scripts/validation/rp-internal-beta-credit-reservation-local-runtime-1-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-approved-snapshot-persistence-local-runtime-1-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-local-readiness-gate-rollup-1-diagnostics.mjs',
  'package.json',
]

const allowedChangedFiles = new Set(requiredFiles)

for (const file of [
  'docs/internal-beta/rp-internal-beta-job-queue-local-runtime-1/source-audit.md',
  'docs/internal-beta/rp-internal-beta-job-queue-local-runtime-1/runtime-contract.md',
  'docs/internal-beta/rp-internal-beta-job-queue-local-runtime-1/validation-results.md',
  'docs/internal-beta/rp-internal-beta-job-queue-local-runtime-1/readiness-gate.md',
  'docs/internal-beta/rp-internal-beta-job-queue-local-runtime-1/safety-boundary.md',
  'docs/internal-beta/rp-internal-beta-job-queue-local-runtime-1/job-queue-local-runtime-record.json',
  'docs/activation-phase-rp-internal-beta-job-queue-local-runtime-1-results.md',
  'server/services/internal-beta-job-queue-local-runtime.ts',
  'server/smoke/internal-beta-job-queue-local-runtime-smoke.ts',
  'scripts/validation/rp-internal-beta-job-queue-local-runtime-1-diagnostics.mjs',
  'scripts/validation/rp-jobs-01-internal-beta-job-queue-runtime-scaffold-diagnostics.mjs',
]) {
  allowedChangedFiles.add(file)
}

const requiredText = [
  packet,
  'completed_local_credit_reservation_runtime_no_remote_credit_mutation',
  'completed_backend_local_credit_reservation_validation_no_stripe_or_supabase',
  'local_credit_reservation_validated_no_remote_mutation',
  'blocked_invalid_credit_reservation_input',
  'Local credit reservation record created: `true`',
  'Local ledger entry created: `true`',
  'Remote credit mutation: `false`',
  'Real credit mutation: `false`',
  'Wallet balance mutation: `false`',
  'Stripe/payment processing: `false`',
  'Supabase persistence: `false`',
  'Internal beta end-to-end ready: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'Next safe milestone: `RP-INTERNAL-BETA-JOB-QUEUE-LOCAL-RUNTIME-1`',
  'No Supabase mutation, SQL execution, migration apply, RLS policy apply, storage bucket creation, storage object creation, storage object read, Secret Manager payload access, service-role secret payload access, frontend service-role credential exposure, service-role route execution, provider call, model call, worker execution, worker dispatch, worker lease claim, route execution, browser capture, signed URL creation, public artifact creation, real credit mutation, wallet balance mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, package-lock mutation, raw prompt execution, final render/export, preview artifact creation, private media processing, user media processing, Remotion execution, FFmpeg execution, FFprobe execution, media processing, Docker execution, package installation beyond dependency validation, or broad service-role handler was enabled.',
]

const forbiddenClaims = [
  /Internal beta end-to-end ready:\s*`?true/i,
  /Internal beta end-to-end status:\s*`?(ready|enabled|unlocked|passed)/i,
  /internal beta unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /external beta unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /production unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /Remote credit mutation:\s*`?true/i,
  /Real credit mutation:\s*`?true/i,
  /Wallet balance mutation:\s*`?true/i,
  /Stripe\/payment processing:\s*`?true/i,
  /Supabase persistence:\s*`?true/i,
  /Remote Supabase mutation:\s*`?true/i,
  /SQL execution:\s*`?true/i,
  /Migration apply:\s*`?true/i,
  /Service-role route execution:\s*`?true/i,
  /Worker execution:\s*`?true/i,
  /Worker dispatch:\s*`?true/i,
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
  'server/services/internal-beta-credit-reservation-local-runtime.ts',
  'server/smoke/internal-beta-credit-reservation-local-runtime-smoke.ts',
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

const record = JSON.parse(read(`${packetDir}/credit-reservation-local-runtime-record.json`))
if (record.decision !== 'completed_local_credit_reservation_runtime_no_remote_credit_mutation') fail('record decision mismatch')
if (record.execution !== 'completed_backend_local_credit_reservation_validation_no_stripe_or_supabase') fail('record execution mismatch')
if (record.localRuntimeStatus !== 'local_credit_reservation_validated_no_remote_mutation') fail('local runtime status mismatch')
if (record.invalidInputBlocker !== 'blocked_invalid_credit_reservation_input') fail('invalid input blocker mismatch')
if (record.localCreditReservationRecordCreated !== true) fail('local reservation flag mismatch')
if (record.localLedgerEntryCreated !== true) fail('local ledger flag mismatch')
if (record.internalBetaEndToEndReady !== false) fail('internal beta must remain blocked')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count must remain 0')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')
for (const key of [
  'remoteCreditMutation',
  'realCreditMutation',
  'walletBalanceMutation',
  'stripePaymentProcessing',
  'persistedToSupabase',
  'remoteSupabaseMutation',
  'sqlExecution',
  'migrationApply',
  'serviceRoleRouteExecution',
  'serviceRoleSecretPayloadAccess',
  'frontendServiceRoleCredentialExposure',
  'jobEnqueue',
  'workerExecution',
  'workerDispatch',
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

const service = read('server/services/internal-beta-credit-reservation-local-runtime.ts')
for (const token of [
  'createInternalBetaCreditReservationLocalRuntime',
  'INTERNAL_BETA_CREDIT_RESERVATION_LOCAL_RUNTIME_RULE',
  'local_credit_reservation_validated_no_remote_mutation',
  'blocked_invalid_credit_reservation_input',
  'creditEstimateStatus must be approved',
  'idempotencyKeyHash',
  'credit_reservation_',
  'credit_ledger_reservation_',
  'localCreditReservationRecordCreated: ok',
  'localLedgerEntryCreated: ok',
  'remoteCreditMutation: false',
  'stripePaymentProcessing: false',
  'persistedToSupabase: false',
  'realCreditMutation: false',
  'walletBalanceMutation: false',
  'signedUrl',
  'stripeSecret',
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

const smoke = read('server/smoke/internal-beta-credit-reservation-local-runtime-smoke.ts')
for (const token of [
  'same reservation basis should hash deterministically',
  'credit estimate must be approved before local reservation',
  'idempotency key is required',
  'raw prompt',
  'signed/public URL',
  'internal-beta-credit-reservation-local-runtime-smoke passed',
]) {
  if (!smoke.includes(token)) fail(`smoke missing token ${token}`)
}

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['smoke:internal-beta-credit-reservation-local-runtime'] !==
  'tsx server/smoke/internal-beta-credit-reservation-local-runtime-smoke.ts'
) {
  fail('missing credit reservation local runtime smoke script')
}
if (
  packageJson.scripts?.['rp-internal-beta-credit-reservation-local-runtime-1:diagnostics'] !==
  'node scripts/validation/rp-internal-beta-credit-reservation-local-runtime-1-diagnostics.mjs'
) {
  fail('missing credit reservation local runtime diagnostics script')
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
