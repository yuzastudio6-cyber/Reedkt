#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-PROVIDER-01-INTERNAL-BETA-DISABLED-PROVIDER-ADAPTER-SCAFFOLD'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetDir = 'docs/internal-beta/rp-provider-01-internal-beta-disabled-provider-adapter-scaffold'
const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/provider-adapter-scaffold-matrix.md`,
  `${packetDir}/provider-runtime-boundary.md`,
  `${packetDir}/readiness-gate.md`,
  `${packetDir}/provider-scaffold-record.json`,
  'docs/activation-phase-rp-provider-01-internal-beta-disabled-provider-adapter-scaffold-results.md',
  'docs/implementation-prompts/prompt-rp-provider-01-internal-beta-disabled-provider-adapter-scaffold.md',
  'docs/implementation-prompts/prompt-rp-internal-beta-e2e-negative-gate-tests-1.md',
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
  'server/services/internal-beta-disabled-provider-adapter-scaffold.ts',
  'scripts/validation/rp-render-01-internal-beta-remotion-render-worker-scaffold-diagnostics.mjs',
  'scripts/validation/rp-provider-01-internal-beta-disabled-provider-adapter-scaffold-diagnostics.mjs',
]

const allowedChangedFiles = new Set([
  ...requiredFiles,
  'docs/internal-beta/rp-internal-beta-e2e-negative-gate-tests-1/source-audit.md',
  'docs/internal-beta/rp-internal-beta-e2e-negative-gate-tests-1/negative-gate-test-matrix.md',
  'docs/internal-beta/rp-internal-beta-e2e-negative-gate-tests-1/gate-safety-boundary.md',
  'docs/internal-beta/rp-internal-beta-e2e-negative-gate-tests-1/readiness-gate.md',
  'docs/internal-beta/rp-internal-beta-e2e-negative-gate-tests-1/negative-gate-record.json',
  'docs/activation-phase-rp-internal-beta-e2e-negative-gate-tests-1-results.md',
  'docs/implementation-prompts/prompt-rp-internal-beta-runtime-enablement-plan-1.md',
  'server/smoke/internal-beta-e2e-negative-gate-tests-smoke.ts',
  'scripts/validation/rp-internal-beta-e2e-negative-gate-tests-1-diagnostics.mjs',
  'package.json',
])

const requiredText = [
  packet,
  'completed_disabled_internal_beta_provider_adapter_scaffold_no_provider_calls',
  'completed_fail_closed_provider_adapter_scaffold_no_model_execution',
  '`RP-RENDER-01-INTERNAL-BETA-REMOTION-RENDER-WORKER-SCAFFOLD` is merged at `1f33b4a4dddc8403b7d6f1096eccb24e38d96879`',
  'Internal beta end-to-end status: `not_ready`',
  'Product-ready end-to-end local OSS tools: `0`',
  '#577 remains open/draft/blocked and excluded as source-of-truth',
  'Exact open duplicate PR: `none`',
  'Exact remote duplicate branch: `none`',
  'Provider adapter scaffold operations added: `8`',
  'Runtime scaffold status: `disabled_pending_provider_adapter_runtime_gate`',
  'Provider/model calls: `false`',
  'Model call: `false`',
  'Secret payload access: `false`',
  'Raw prompt execution: `false`',
  'Worker dispatch executed: `false`',
  'Worker execution: `false`',
  'Route execution: `false`',
  'Credit mutation: `false`',
  'Supabase mutation: `false`',
  'Render/export execution: `false`',
  'Storage write: `false`',
  'Signed URL creation: `false`',
  'Public artifact creation: `false`',
  'Internal beta unlock: `false`',
  'Basic/Pro no-Veo and Premium Veo final-fallback-only',
  'no 1080P default',
  'Next recommended milestone: `RP-INTERNAL-BETA-E2E-NEGATIVE-GATE-TESTS-1`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'Supabase remote environment touched: `none`',
  'SQL executed: `none`',
  'Provider requests created: `none`',
  'Provider/model calls executed: `none`',
  'Secret payload access: `none`',
  'Signed URLs created: `none`',
  'Public artifacts created: `none`',
  'No remote Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, raw prompt execution, worker execution, worker dispatch, route execution, browser capture, Remotion execution, FFmpeg execution, FFprobe execution, media processing, storage object creation, storage object read, signed URL creation, public artifact creation, credit mutation, job enqueue, job event write, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, final render/export, preview artifact creation, private media processing, user media processing, package installation beyond dependency validation, dependency mutation, package-lock mutation, Dockerfile change, requirements change, or broad service-role handler was enabled.',
]

const forbiddenClaims = [
  /Internal beta end-to-end status:\s*`?(ready|enabled|unlocked|passed)/i,
  /internal beta unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /external beta unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /production unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /Provider\/model calls:\s*`?true/i,
  /Provider\/model calls executed:(?!\s*`?none`?)/i,
  /Provider requests created:(?!\s*`?none`?)/i,
  /Model call:\s*`?true/i,
  /Secret payload access:\s*`?(true|completed|enabled|passed)/i,
  /(^|\n)\s*-?\s*Secret payload access:(?!\s*`?(false|none)`?)/i,
  /Raw prompt execution:\s*`?true/i,
  /Worker dispatch executed:\s*`?true/i,
  /Worker execution:\s*`?true/i,
  /Route execution:\s*`?true/i,
  /Credit mutation:\s*`?true/i,
  /Supabase mutation:\s*`?true/i,
  /Render\/export execution:\s*`?true/i,
  /Storage write:\s*`?true/i,
  /Signed URL creation:\s*`?true/i,
  /Public artifact creation:\s*`?true/i,
  /Signed URLs created:(?!\s*`?none`?)/i,
  /Public artifacts created:(?!\s*`?none`?)/i,
  /Supabase remote environment touched:(?!\s*`?none`?)/i,
  /SQL executed:(?!\s*`?none`?)/i,
  /provider call:\s*`?(completed|enabled|true|passed)/i,
  /model call:\s*`?(completed|enabled|true|passed)/i,
  /raw prompt execution:\s*`?(completed|enabled|true|passed)/i,
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
    .replace(/\n## RP-JOBS-01[\s\S]*?(?=\n## |\n# |$)/g, '\n')
    .replace(/\n## RP-ARTIFACTS-01[\s\S]*?(?=\n## |\n# |$)/g, '\n')
    .replace(/\n## RP-RENDER-01[\s\S]*?(?=\n## |\n# |$)/g, '\n')
    .replace(/\n## RP-INTERNAL-BETA-E2E[\s\S]*?(?=\n## |\n# |$)/g, '\n')
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

const record = JSON.parse(read(`${packetDir}/provider-scaffold-record.json`))
if (record.decision !== 'completed_disabled_internal_beta_provider_adapter_scaffold_no_provider_calls') fail('record decision mismatch')
if (record.execution !== 'completed_fail_closed_provider_adapter_scaffold_no_model_execution') fail('record execution mismatch')
if (record.baseMerge !== '1f33b4a4dddc8403b7d6f1096eccb24e38d96879') fail('base merge mismatch')
if (record.internalBetaEndToEndStatus !== 'not_ready') fail('internal beta status must stay not_ready')
if (record.providerAdapterScaffoldOperationsAdded !== 8) fail('provider operation count mismatch')
if (record.runtimeScaffoldStatus !== 'disabled_pending_provider_adapter_runtime_gate') fail('runtime scaffold status mismatch')
if (record.exactOpenDuplicatePr !== 'none') fail('exact open duplicate PR must be none')
if (record.exactRemoteDuplicateBranch !== 'none') fail('exact remote duplicate branch must be none')
for (const key of [
  'providerModelCalls',
  'modelCall',
  'secretPayloadAccess',
  'rawPromptExecution',
  'workerDispatchExecuted',
  'workerExecution',
  'routeExecution',
  'creditMutation',
  'supabaseMutation',
  'renderExportExecution',
  'storageWrite',
  'signedUrlCreation',
  'publicArtifactCreation',
  'internalBetaUnlock',
]) {
  if (record[key] !== false) fail(`${key} must remain false`)
}
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready tool count must remain 0')

const scaffold = read('server/services/internal-beta-disabled-provider-adapter-scaffold.ts')
const operations = scaffold.match(/operation: '[^']+'/g) ?? []
if (operations.length !== 8) fail(`expected 8 provider operations, found ${operations.length}`)
for (const name of [
  'readInternalBetaProviderRouteScaffold',
  'preflightInternalBetaProviderRequestScaffold',
  'prepareInternalBetaProviderPromptPayloadScaffold',
  'checkInternalBetaProviderCostCapScaffold',
  'checkInternalBetaProviderSecretBoundaryScaffold',
  'prepareInternalBetaProviderFallbackPolicyScaffold',
  'readInternalBetaProviderStatusScaffold',
  'classifyInternalBetaProviderFailureScaffold',
]) {
  if (!scaffold.includes(`function ${name}`)) fail(`missing scaffold function ${name}`)
}
for (const required of [
  "status: 'disabled_pending_provider_adapter_runtime_gate'",
  'routeExecution: false',
  'workerExecution: false',
  'workerDispatch: false',
  'providerModelCalls: false',
  'modelCall: false',
  'secretPayloadAccess: false',
  'rawPromptExecution: false',
  'creditMutation: false',
  'supabaseMutation: false',
  'renderExportExecution: false',
  'storageWrite: false',
  'signedUrlCreation: false',
  'publicArtifactCreation: false',
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
  /createSignedUrl/i,
  /signedUrl:\s*true/i,
  /secretPayloadAccess:\s*true/i,
  /providerModelCalls:\s*true/i,
  /modelCall:\s*true/i,
  /rawPromptExecution:\s*true/i,
  /workerDispatch:\s*true/i,
  /internalBetaUnlock:\s*true/i,
  /chat\.completions/i,
  /responses\.create/i,
  /images\.generate/i,
  /generateContent/i,
]) {
  if (pattern.test(scaffold)) fail(`scaffold contains forbidden runtime signal ${pattern}`)
}

const packageJson = JSON.parse(read('package.json'))
const expectedScript = 'node scripts/validation/rp-provider-01-internal-beta-disabled-provider-adapter-scaffold-diagnostics.mjs'
if (packageJson.scripts?.['rp-provider-01:internal-beta-disabled-provider-adapter-scaffold:diagnostics'] !== expectedScript) {
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
    (file !== 'server/services/internal-beta-disabled-provider-adapter-scaffold.ts' &&
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
