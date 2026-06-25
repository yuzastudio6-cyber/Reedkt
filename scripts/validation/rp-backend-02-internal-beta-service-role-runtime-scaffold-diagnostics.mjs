#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-BACKEND-02-INTERNAL-BETA-SERVICE-ROLE-RUNTIME-SCAFFOLD'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetDir = 'docs/internal-beta/rp-backend-02-internal-beta-service-role-runtime-scaffold'
const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/runtime-scaffold-matrix.md`,
  `${packetDir}/fail-closed-gates.md`,
  `${packetDir}/service-role-runtime-boundary.md`,
  `${packetDir}/readiness-gate.md`,
  `${packetDir}/scaffold-record.json`,
  'docs/activation-phase-rp-backend-02-internal-beta-service-role-runtime-scaffold-results.md',
  'docs/implementation-prompts/prompt-rp-backend-02-internal-beta-service-role-runtime-scaffold.md',
  'docs/implementation-prompts/prompt-rp-credits-01-internal-beta-credit-ledger-runtime-scaffold.md',
  'docs/implementation-prompts/prompt-rp-jobs-01-internal-beta-job-queue-runtime-scaffold.md',
  'docs/implementation-prompts/prompt-rp-artifacts-01-internal-beta-private-artifact-manifest-scaffold.md',
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
  'server/services/internal-beta-service-role-runtime-scaffold.ts',
  'scripts/validation/rp-backend-01-internal-beta-service-role-api-contracts-diagnostics.mjs',
  'scripts/validation/rp-backend-02-internal-beta-service-role-runtime-scaffold-diagnostics.mjs',
  'scripts/validation/rp-jobs-01-internal-beta-job-queue-runtime-scaffold-diagnostics.mjs',
]

const allowedChangedFiles = new Set([
  ...requiredFiles,
  'docs/internal-beta/rp-credits-01-internal-beta-credit-ledger-runtime-scaffold/source-audit.md',
  'docs/internal-beta/rp-credits-01-internal-beta-credit-ledger-runtime-scaffold/credit-ledger-scaffold-matrix.md',
  'docs/internal-beta/rp-credits-01-internal-beta-credit-ledger-runtime-scaffold/approval-reservation-boundary.md',
  'docs/internal-beta/rp-credits-01-internal-beta-credit-ledger-runtime-scaffold/stripe-billing-boundary.md',
  'docs/internal-beta/rp-credits-01-internal-beta-credit-ledger-runtime-scaffold/readiness-gate.md',
  'docs/internal-beta/rp-credits-01-internal-beta-credit-ledger-runtime-scaffold/credit-scaffold-record.json',
  'docs/activation-phase-rp-credits-01-internal-beta-credit-ledger-runtime-scaffold-results.md',
  'docs/implementation-prompts/prompt-rp-jobs-01-internal-beta-job-queue-runtime-scaffold.md',
  'server/services/internal-beta-credit-ledger-runtime-scaffold.ts',
  'scripts/validation/rp-credits-01-internal-beta-credit-ledger-runtime-scaffold-diagnostics.mjs',
  'docs/internal-beta/rp-jobs-01-internal-beta-job-queue-runtime-scaffold/source-audit.md',
  'docs/internal-beta/rp-jobs-01-internal-beta-job-queue-runtime-scaffold/job-queue-scaffold-matrix.md',
  'docs/internal-beta/rp-jobs-01-internal-beta-job-queue-runtime-scaffold/worker-runtime-boundary.md',
  'docs/internal-beta/rp-jobs-01-internal-beta-job-queue-runtime-scaffold/readiness-gate.md',
  'docs/internal-beta/rp-jobs-01-internal-beta-job-queue-runtime-scaffold/job-scaffold-record.json',
  'docs/activation-phase-rp-jobs-01-internal-beta-job-queue-runtime-scaffold-results.md',
  'server/services/internal-beta-job-queue-runtime-scaffold.ts',
  'package.json',
])

const requiredText = [
  packet,
  'completed_disabled_backend_service_role_runtime_scaffold_no_execution',
  'completed_fail_closed_scaffold_no_route_execution',
  '`RP-BACKEND-01-INTERNAL-BETA-SERVICE-ROLE-API-CONTRACTS` is merged at `079f3ea2e00c4844165898ce9f5aea7c1d27bf96`',
  'Data foundation status: `local_migration_validation_passed`',
  'Internal beta end-to-end status: `not_ready`',
  'Product-ready end-to-end local OSS tools: `0`',
  '#577 remains open/draft/blocked and excluded as source-of-truth',
  'Runtime scaffold functions added: `8`',
  'Runtime scaffold status: `disabled_pending_runtime_gate`',
  'Route handler registration: `0`',
  'Mock handler registration: `0`',
  'Supabase mutation handlers implemented: `0`',
  'Route execution: `false`',
  'Worker execution: `false`',
  'Provider/model calls: `false`',
  'Render/export execution: `false`',
  'Credit mutation: `false`',
  'Supabase mutation: `false`',
  'Private artifact access enabled: `false`',
  'Public artifacts created: `none`',
  'Stripe/payment processing: `disabled`',
  'Next recommended milestone: `RP-CREDITS-01-INTERNAL-BETA-CREDIT-LEDGER-RUNTIME-SCAFFOLD`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'Supabase remote environment touched: `none`',
  'SQL executed: `none`',
  'No remote Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, private media processing, user media processing, live route handler registration, worker dispatch, provider/model execution, render/export execution, private artifact access enablement, package installation beyond dependency validation, dependency mutation, package-lock mutation, Dockerfile change, requirements change, or broad service-role handler was enabled.',
]

const forbiddenClaims = [
  /Internal beta end-to-end status:\s*`?(ready|enabled|unlocked|passed)/i,
  /internal beta unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /external beta unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /production unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /Route handler registration:\s*`?[1-9]/i,
  /Mock handler registration:\s*`?[1-9]/i,
  /Supabase mutation handlers implemented:\s*`?[1-9]/i,
  /Route execution:\s*`?true/i,
  /Worker execution:\s*`?true/i,
  /Provider\/model calls:\s*`?true/i,
  /Render\/export execution:\s*`?true/i,
  /Credit mutation:\s*`?true/i,
  /Supabase mutation:\s*`?true/i,
  /Private artifact access enabled:\s*`?true/i,
  /Public artifacts created:(?!\s*`?none`?)/i,
  /Stripe\/payment processing:(?!\s*`?disabled`?)/i,
  /Supabase remote environment touched:(?!\s*`?none`?)/i,
  /SQL executed:(?!\s*`?none`?)/i,
  /live route handler registration:\s*`?(completed|enabled|true|passed)/i,
  /worker dispatch:\s*`?(completed|enabled|true|passed)/i,
  /provider\/model execution:\s*`?(completed|enabled|true|passed)/i,
  /render\/export execution:\s*`?(completed|enabled|true|passed)/i,
  /private artifact access enablement:\s*`?(completed|enabled|true|passed)/i,
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
    .replace(/\n## RP-BACKEND-01[\s\S]*?(?=\n## |\n# |$)/g, '\n')
    .replace(/\n## RP-CREDITS-01[\s\S]*?(?=\n## |\n# |$)/g, '\n')
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

const record = JSON.parse(read(`${packetDir}/scaffold-record.json`))
if (record.decision !== 'completed_disabled_backend_service_role_runtime_scaffold_no_execution') fail('record decision mismatch')
if (record.execution !== 'completed_fail_closed_scaffold_no_route_execution') fail('record execution mismatch')
if (record.baseMerge !== '079f3ea2e00c4844165898ce9f5aea7c1d27bf96') fail('base merge mismatch')
if (record.dataFoundationStatus !== 'local_migration_validation_passed') fail('data foundation status mismatch')
if (record.internalBetaEndToEndStatus !== 'not_ready') fail('internal beta status must stay not_ready')
if (record.runtimeScaffoldFunctionsAdded !== 8) fail('runtime scaffold function count mismatch')
if (record.runtimeScaffoldStatus !== 'disabled_pending_runtime_gate') fail('runtime scaffold status mismatch')
if (record.routeHandlerRegistration !== 0) fail('route handler registration must stay 0')
if (record.mockHandlerRegistration !== 0) fail('mock handler registration must stay 0')
if (record.supabaseMutationHandlersImplemented !== 0) fail('supabase mutation handler count must stay 0')
if (record.routeExecution !== false) fail('route execution must remain false')
if (record.workerExecution !== false) fail('worker execution must remain false')
if (record.providerModelCalls !== false) fail('provider/model calls must remain false')
if (record.renderExportExecution !== false) fail('render/export execution must remain false')
if (record.creditMutation !== false) fail('credit mutation must remain false')
if (record.supabaseMutation !== false) fail('supabase mutation must remain false')
if (record.privateArtifactAccessEnabled !== false) fail('private artifact access must remain disabled')
if (record.publicArtifactsCreated !== false) fail('public artifacts must remain false')
if (record.stripePaymentProcessing !== false) fail('stripe payment processing must remain false')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready tool count must remain 0')

const scaffold = read('server/services/internal-beta-service-role-runtime-scaffold.ts')
const routeIds = scaffold.match(/routeId: 'internalBeta\.[^']+'/g) ?? []
if (routeIds.length !== 8) fail(`expected 8 scaffold route ids, found ${routeIds.length}`)
for (const name of [
  'createInternalBetaSessionScaffold',
  'commitInternalBetaApprovedPlanScaffold',
  'createInternalBetaCreditReservationScaffold',
  'enqueueInternalBetaJobScaffold',
  'getInternalBetaJobStatusScaffold',
  'writeInternalBetaArtifactManifestScaffold',
  'createInternalBetaPrivateArtifactAccessScaffold',
  'readInternalBetaQaReportScaffold',
]) {
  if (!scaffold.includes(`function ${name}`)) fail(`missing scaffold function ${name}`)
}
for (const required of [
  "status: 'disabled_pending_runtime_gate'",
  'routeExecution: false',
  'workerExecution: false',
  'providerModelCalls: false',
  'renderExportExecution: false',
  'creditMutation: false',
  'supabaseMutation: false',
  'privateArtifactAccessEnabled: false',
  'publicArtifactsCreated: false',
  'stripePaymentProcessing: false',
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

const routeFile = read('src/backend/api/routes/internal-beta-api-routes.ts')
if (routeFile.includes('mockHandlerName')) fail('internal beta routes must not have mock handlers')
if (/status:\s*'mock_ready'|status:\s*'frontend_safe_ready'/.test(routeFile)) fail('internal beta routes must not be mock/frontend ready')
if (!routeFile.includes("id: 'internalBeta.privateArtifactAccess.create'") || !routeFile.includes("status: 'disabled'")) {
  fail('private artifact access route must exist and remain disabled')
}

const mockRouter = read('src/backend/api/mock-api-router.ts')
if (/internalBeta\./.test(mockRouter)) fail('mock router must not register internal beta handlers')

const packageJson = JSON.parse(read('package.json'))
const expectedScript = 'node scripts/validation/rp-backend-02-internal-beta-service-role-runtime-scaffold-diagnostics.mjs'
if (packageJson.scripts?.['rp-backend-02:internal-beta-service-role-runtime-scaffold:diagnostics'] !== expectedScript) {
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
      'server/services/internal-beta-service-role-runtime-scaffold.ts',
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
