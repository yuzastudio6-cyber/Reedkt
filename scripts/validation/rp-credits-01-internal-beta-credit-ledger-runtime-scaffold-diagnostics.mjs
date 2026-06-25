#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-CREDITS-01-INTERNAL-BETA-CREDIT-LEDGER-RUNTIME-SCAFFOLD'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetDir = 'docs/internal-beta/rp-credits-01-internal-beta-credit-ledger-runtime-scaffold'
const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/credit-ledger-scaffold-matrix.md`,
  `${packetDir}/approval-reservation-boundary.md`,
  `${packetDir}/stripe-billing-boundary.md`,
  `${packetDir}/readiness-gate.md`,
  `${packetDir}/credit-scaffold-record.json`,
  'docs/activation-phase-rp-credits-01-internal-beta-credit-ledger-runtime-scaffold-results.md',
  'docs/implementation-prompts/prompt-rp-credits-01-internal-beta-credit-ledger-runtime-scaffold.md',
  'docs/implementation-prompts/prompt-rp-jobs-01-internal-beta-job-queue-runtime-scaffold.md',
  'docs/implementation-prompts/prompt-rp-artifacts-01-internal-beta-private-artifact-manifest-scaffold.md',
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
  'server/services/internal-beta-credit-ledger-runtime-scaffold.ts',
  'scripts/validation/rp-backend-01-internal-beta-service-role-api-contracts-diagnostics.mjs',
  'scripts/validation/rp-backend-02-internal-beta-service-role-runtime-scaffold-diagnostics.mjs',
  'scripts/validation/rp-credits-01-internal-beta-credit-ledger-runtime-scaffold-diagnostics.mjs',
  'scripts/validation/rp-jobs-01-internal-beta-job-queue-runtime-scaffold-diagnostics.mjs',
]

const allowedChangedFiles = new Set([
  ...requiredFiles,
  'docs/internal-beta/rp-jobs-01-internal-beta-job-queue-runtime-scaffold/source-audit.md',
  'docs/internal-beta/rp-jobs-01-internal-beta-job-queue-runtime-scaffold/job-queue-scaffold-matrix.md',
  'docs/internal-beta/rp-jobs-01-internal-beta-job-queue-runtime-scaffold/worker-runtime-boundary.md',
  'docs/internal-beta/rp-jobs-01-internal-beta-job-queue-runtime-scaffold/readiness-gate.md',
  'docs/internal-beta/rp-jobs-01-internal-beta-job-queue-runtime-scaffold/job-scaffold-record.json',
  'docs/activation-phase-rp-jobs-01-internal-beta-job-queue-runtime-scaffold-results.md',
  'server/services/internal-beta-job-queue-runtime-scaffold.ts',
  'package.json',
])

for (const file of [
  'docs/internal-beta/rp-internal-beta-runtime-readiness-orchestrator-1/source-audit.md',
  'docs/internal-beta/rp-internal-beta-runtime-readiness-orchestrator-1/runtime-readiness-orchestrator.md',
  'docs/internal-beta/rp-internal-beta-runtime-readiness-orchestrator-1/component-matrix.md',
  'docs/internal-beta/rp-internal-beta-runtime-readiness-orchestrator-1/readiness-gate.md',
  'docs/internal-beta/rp-internal-beta-runtime-readiness-orchestrator-1/safety-boundary.md',
  'docs/internal-beta/rp-internal-beta-runtime-readiness-orchestrator-1/runtime-readiness-orchestrator-record.json',
  'docs/activation-phase-rp-internal-beta-runtime-readiness-orchestrator-1-results.md',
  'docs/implementation-prompts/prompt-rp-internal-beta-runtime-readiness-orchestrator-1.md',
  'server/services/internal-beta-runtime-readiness-orchestrator.ts',
  'server/smoke/internal-beta-runtime-readiness-orchestrator-smoke.ts',
  'scripts/validation/rp-backend-02-internal-beta-service-role-runtime-scaffold-diagnostics.mjs',
  'scripts/validation/rp-credits-01-internal-beta-credit-ledger-runtime-scaffold-diagnostics.mjs',
  'scripts/validation/rp-jobs-01-internal-beta-job-queue-runtime-scaffold-diagnostics.mjs',
  'scripts/validation/rp-artifacts-01-internal-beta-private-artifact-manifest-scaffold-diagnostics.mjs',
  'scripts/validation/rp-render-01-internal-beta-remotion-render-worker-scaffold-diagnostics.mjs',
  'scripts/validation/rp-provider-01-internal-beta-disabled-provider-adapter-scaffold-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-e2e-negative-gate-tests-1-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-runtime-readiness-orchestrator-1-diagnostics.mjs',
]) {
  allowedChangedFiles.add(file)
}

const requiredText = [
  packet,
  'completed_disabled_internal_beta_credit_ledger_runtime_scaffold_no_spend',
  'completed_fail_closed_credit_ledger_scaffold_no_credit_mutation',
  '`RP-BACKEND-02-INTERNAL-BETA-SERVICE-ROLE-RUNTIME-SCAFFOLD` is merged at `98f3c6f5fa93f2b28eba9c2ce17a801ea3654476`',
  'Policy source: `pricing-and-credits.md` and `credit-ledger-architecture.md`',
  'Internal beta end-to-end status: `not_ready`',
  'Product-ready end-to-end local OSS tools: `0`',
  '#577 remains open/draft/blocked and excluded as source-of-truth',
  'Credit ledger runtime scaffold operations added: `6`',
  'Runtime scaffold status: `disabled_pending_credit_ledger_runtime_gate`',
  'Credit mutation: `false`',
  'Credit reservation created: `false`',
  'Credit spend executed: `false`',
  'Credit release executed: `false`',
  'Credit refund executed: `false`',
  'Stripe/payment processing: `disabled`',
  'Supabase mutation: `false`',
  'Route execution: `false`',
  'Worker execution: `false`',
  'Provider/model calls: `false`',
  'Render/export execution: `false`',
  'Internal beta unlock: `false`',
  'Public artifacts created: `none`',
  'Next recommended milestone: `RP-JOBS-01-INTERNAL-BETA-JOB-QUEUE-RUNTIME-SCAFFOLD`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'Supabase remote environment touched: `none`',
  'SQL executed: `none`',
  'No remote Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, credit reservation creation, credit spend, credit release, credit refund, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, private media processing, user media processing, package installation beyond dependency validation, dependency mutation, package-lock mutation, Dockerfile change, requirements change, or broad service-role handler was enabled.',
]

const forbiddenClaims = [
  /Internal beta end-to-end status:\s*`?(ready|enabled|unlocked|passed)/i,
  /internal beta unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /external beta unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /production unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /Credit mutation:\s*`?true/i,
  /Credit reservation created:\s*`?true/i,
  /Credit spend executed:\s*`?true/i,
  /Credit release executed:\s*`?true/i,
  /Credit refund executed:\s*`?true/i,
  /Stripe\/payment processing:(?!\s*`?disabled`?)/i,
  /Supabase mutation:\s*`?true/i,
  /Route execution:\s*`?true/i,
  /Worker execution:\s*`?true/i,
  /Provider\/model calls:\s*`?true/i,
  /Render\/export execution:\s*`?true/i,
  /Public artifacts created:(?!\s*`?none`?)/i,
  /Supabase remote environment touched:(?!\s*`?none`?)/i,
  /SQL executed:(?!\s*`?none`?)/i,
  /credit reservation creation:\s*`?(completed|enabled|true|passed)/i,
  /credit spend:\s*`?(completed|enabled|true|passed)/i,
  /credit release:\s*`?(completed|enabled|true|passed)/i,
  /credit refund:\s*`?(completed|enabled|true|passed)/i,
  /stripe checkout:\s*`?(completed|enabled|true|passed)/i,
  /stripe webhook:\s*`?(completed|enabled|true|passed)/i,
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
    .replace(/\n## RP-JOBS-01[\s\S]*?(?=\n## |\n# |$)/g, '\n')
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

const record = JSON.parse(read(`${packetDir}/credit-scaffold-record.json`))
if (record.decision !== 'completed_disabled_internal_beta_credit_ledger_runtime_scaffold_no_spend') fail('record decision mismatch')
if (record.execution !== 'completed_fail_closed_credit_ledger_scaffold_no_credit_mutation') fail('record execution mismatch')
if (record.baseMerge !== '98f3c6f5fa93f2b28eba9c2ce17a801ea3654476') fail('base merge mismatch')
if (record.internalBetaEndToEndStatus !== 'not_ready') fail('internal beta status must stay not_ready')
if (record.creditLedgerRuntimeScaffoldOperationsAdded !== 6) fail('credit ledger operation count mismatch')
if (record.runtimeScaffoldStatus !== 'disabled_pending_credit_ledger_runtime_gate') fail('runtime scaffold status mismatch')
if (record.creditMutation !== false) fail('credit mutation must remain false')
if (record.creditReservationCreated !== false) fail('credit reservation must remain false')
if (record.creditSpendExecuted !== false) fail('credit spend must remain false')
if (record.creditReleaseExecuted !== false) fail('credit release must remain false')
if (record.creditRefundExecuted !== false) fail('credit refund must remain false')
if (record.stripePaymentProcessing !== false) fail('stripe payment processing must remain false')
if (record.supabaseMutation !== false) fail('supabase mutation must remain false')
if (record.routeExecution !== false) fail('route execution must remain false')
if (record.workerExecution !== false) fail('worker execution must remain false')
if (record.providerModelCalls !== false) fail('provider/model calls must remain false')
if (record.renderExportExecution !== false) fail('render/export execution must remain false')
if (record.internalBetaUnlock !== false) fail('internal beta unlock must remain false')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready tool count must remain 0')

const scaffold = read('server/services/internal-beta-credit-ledger-runtime-scaffold.ts')
const operations = scaffold.match(/operation: '[^']+'/g) ?? []
if (operations.length !== 6) fail(`expected 6 credit ledger operations, found ${operations.length}`)
for (const name of [
  'createInternalBetaCreditReservationRuntimeScaffold',
  'validateInternalBetaCreditReservationRuntimeScaffold',
  'spendInternalBetaReservedCreditsRuntimeScaffold',
  'releaseInternalBetaReservedCreditsRuntimeScaffold',
  'refundInternalBetaCreditsForFailedGenerationRuntimeScaffold',
  'readInternalBetaCreditLedgerRuntimeScaffold',
]) {
  if (!scaffold.includes(`function ${name}`)) fail(`missing scaffold function ${name}`)
}
for (const required of [
  "status: 'disabled_pending_credit_ledger_runtime_gate'",
  'stripePaymentProcessing: false',
  'creditMutation: false',
  'supabaseMutation: false',
  'workerExecution: false',
  'providerModelCalls: false',
  'renderExportExecution: false',
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
const expectedScript = 'node scripts/validation/rp-credits-01-internal-beta-credit-ledger-runtime-scaffold-diagnostics.mjs'
if (packageJson.scripts?.['rp-credits-01:internal-beta-credit-ledger-runtime-scaffold:diagnostics'] !== expectedScript) {
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
      'server/services/internal-beta-credit-ledger-runtime-scaffold.ts',
      'server/services/internal-beta-job-queue-runtime-scaffold.ts',
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
