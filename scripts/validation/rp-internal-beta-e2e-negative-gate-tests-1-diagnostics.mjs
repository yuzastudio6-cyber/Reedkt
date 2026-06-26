#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-INTERNAL-BETA-E2E-NEGATIVE-GATE-TESTS-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const packetDir = 'docs/internal-beta/rp-internal-beta-e2e-negative-gate-tests-1'

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/negative-gate-test-matrix.md`,
  `${packetDir}/gate-safety-boundary.md`,
  `${packetDir}/readiness-gate.md`,
  `${packetDir}/negative-gate-record.json`,
  'docs/activation-phase-rp-internal-beta-e2e-negative-gate-tests-1-results.md',
  'docs/implementation-prompts/prompt-rp-internal-beta-e2e-negative-gate-tests-1.md',
  'docs/implementation-prompts/prompt-rp-internal-beta-runtime-enablement-plan-1.md',
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
  'server/smoke/internal-beta-e2e-negative-gate-tests-smoke.ts',
  'scripts/validation/rp-provider-01-internal-beta-disabled-provider-adapter-scaffold-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-e2e-negative-gate-tests-1-diagnostics.mjs',
]

const allowedChangedFiles = new Set([...requiredFiles, 'package.json'])

for (const file of [
  'docs/internal-beta/rp-internal-beta-runtime-enablement-plan-1/source-audit.md',
  'docs/internal-beta/rp-internal-beta-runtime-enablement-plan-1/runtime-enablement-matrix.md',
  'docs/internal-beta/rp-internal-beta-runtime-enablement-plan-1/owner-approval-register.md',
  'docs/internal-beta/rp-internal-beta-runtime-enablement-plan-1/safety-boundary.md',
  'docs/internal-beta/rp-internal-beta-runtime-enablement-plan-1/readiness-gate.md',
  'docs/internal-beta/rp-internal-beta-runtime-enablement-plan-1/runtime-enablement-record.json',
  'docs/activation-phase-rp-internal-beta-runtime-enablement-plan-1-results.md',
  'docs/implementation-prompts/prompt-rp-internal-beta-runtime-enablement-owner-approval-1.md',
  'scripts/validation/rp-internal-beta-runtime-enablement-plan-1-diagnostics.mjs',
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
  'docs/internal-beta/rp-internal-beta-e2e-negative-gate-tests-1r/source-audit.md',
  'docs/internal-beta/rp-internal-beta-e2e-negative-gate-tests-1r/negative-gate-test-matrix.md',
  'docs/internal-beta/rp-internal-beta-e2e-negative-gate-tests-1r/readiness-gate.md',
  'docs/internal-beta/rp-internal-beta-e2e-negative-gate-tests-1r/gate-safety-boundary.md',
  'docs/internal-beta/rp-internal-beta-e2e-negative-gate-tests-1r/negative-gate-record.json',
  'docs/activation-phase-rp-internal-beta-e2e-negative-gate-tests-1r-results.md',
  'scripts/validation/rp-internal-beta-e2e-negative-gate-tests-1r-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-qa-cleanup-observability-local-runtime-1-diagnostics.mjs',
]) {
  allowedChangedFiles.add(file)
}

const requiredText = [
  packet,
  'completed_internal_beta_negative_gate_tests_for_disabled_runtime_lane',
  'completed_tests_only_no_runtime_unlock',
  '`RP-PROVIDER-01-INTERNAL-BETA-DISABLED-PROVIDER-ADAPTER-SCAFFOLD` is merged at `f7d8a79ed68b0505da33b6056cd0ea1424dc46f4`',
  'Internal beta end-to-end status: `not_ready`',
  'Product-ready end-to-end local OSS tools: `0`',
  '#577 remains open/draft/blocked and excluded as source-of-truth',
  'Exact open duplicate PR: `none`',
  'Exact remote duplicate branch: `none`',
  'no generation before approved plan and credit approval',
  'no credit spend without reservation',
  'no frontend/direct provider or raw prompt execution path',
  'no worker execution from raw chat',
  'no public artifact or signed URL without a future private artifact policy',
  'Basic/Pro no-Veo and Premium final-fallback-only Veo policy',
  'Next recommended milestone: `RP-INTERNAL-BETA-RUNTIME-ENABLEMENT-PLAN-1`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'Supabase remote environment touched: `none`',
  'SQL executed: `none`',
  'Provider requests created: `none`',
  'Provider/model calls executed: `none`',
  'Worker execution: `none`',
  'Render/export execution: `none`',
  'Signed URLs created: `none`',
  'Public artifacts created: `none`',
  'No remote Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, raw prompt execution, worker execution, worker dispatch, route execution, browser capture, Remotion execution, FFmpeg execution, FFprobe execution, media processing, storage object creation, storage object read, signed URL creation, public artifact creation, credit mutation, credit reservation creation, credit spend, job enqueue, job event write, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, final render/export, preview artifact creation, private media processing, user media processing, package installation beyond dependency validation, dependency mutation, package-lock mutation, Dockerfile change, requirements change, or broad service-role handler was enabled.',
]

const forbiddenClaims = [
  /Internal beta end-to-end status:\s*`?(ready|enabled|unlocked|passed)/i,
  /internal beta unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /external beta unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /production unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /Provider\/model calls(?: executed)?:\s*`?(true|completed|enabled|passed)/i,
  /Provider requests created:(?!\s*`?none`?)/i,
  /Model call:\s*`?true/i,
  /Raw prompt execution:\s*`?true/i,
  /Worker dispatch executed:\s*`?true/i,
  /Worker execution:(?!\s*`?(false|none)`?)/i,
  /Route execution:\s*`?true/i,
  /Credit mutation:\s*`?true/i,
  /Credit reservation creation:\s*`?(true|completed|enabled|passed)/i,
  /Credit spend:\s*`?(true|completed|enabled|passed)/i,
  /Supabase mutation:\s*`?true/i,
  /Render\/export execution:(?!\s*`?(false|none)`?)/i,
  /Signed URLs created:(?!\s*`?none`?)/i,
  /Public artifacts created:(?!\s*`?none`?)/i,
  /Supabase remote environment touched:(?!\s*`?none`?)/i,
  /SQL executed:(?!\s*`?none`?)/i,
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
    .replace(/\n## Track A[\s\S]*?(?=\n## |\n# |$)/g, '\n')
    .replace(/\n## RP-INTERNAL-BETA Runtime[\s\S]*?(?=\n## |\n# |$)/g, '\n')
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

const record = JSON.parse(read(`${packetDir}/negative-gate-record.json`))
if (record.decision !== 'completed_internal_beta_negative_gate_tests_for_disabled_runtime_lane') fail('record decision mismatch')
if (record.execution !== 'completed_tests_only_no_runtime_unlock') fail('record execution mismatch')
if (record.baseMerge !== 'f7d8a79ed68b0505da33b6056cd0ea1424dc46f4') fail('base merge mismatch')
if (record.internalBetaEndToEndStatus !== 'not_ready') fail('internal beta status must stay not_ready')
if (!record.negativeGateSmokeAdded) fail('negative gate smoke flag missing')
for (const gate of [
  'no_generation_before_approval',
  'no_credit_spend_without_reservation',
  'no_frontend_provider_call_or_raw_prompt_execution',
  'no_worker_execution_from_raw_chat',
  'no_public_artifact_or_signed_url_without_policy',
  'basic_pro_no_veo',
  'premium_veo_final_fallback_only',
]) {
  if (!record.negativeGatesCovered?.includes(gate)) fail(`missing negative gate ${gate}`)
}
if (record.exactOpenDuplicatePr !== 'none') fail('exact open duplicate PR must be none')
if (record.exactRemoteDuplicateBranch !== 'none') fail('exact remote duplicate branch must be none')
for (const key of [
  'routeExecution',
  'workerExecution',
  'workerDispatchExecuted',
  'providerModelCalls',
  'modelCall',
  'rawPromptExecution',
  'creditMutation',
  'supabaseMutation',
  'renderExportExecution',
  'signedUrlCreation',
  'publicArtifactCreation',
  'internalBetaUnlock',
]) {
  if (record[key] !== false) fail(`${key} must remain false`)
}
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready tool count must remain 0')

const smoke = read('server/smoke/internal-beta-e2e-negative-gate-tests-smoke.ts')
for (const required of [
  'createInternalBetaCreditReservationRuntimeScaffold',
  'spendInternalBetaReservedCreditsRuntimeScaffold',
  'enqueueInternalBetaJobRuntimeScaffold',
  'prepareInternalBetaProviderPromptPayloadScaffold',
  'prepareInternalBetaRenderWorkerJobScaffold',
  'prepareInternalBetaPrivateArtifactAccessScaffold',
  'compileEditingIntent',
  'Basic must reject Veo',
  'Premium must keep Veo final fallback only',
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
  /registerMockRouteHandler\(/,
  /createSignedUrl/i,
  /renderMedia\(/,
  /renderStill\(/,
  /bundle\(/,
]) {
  if (pattern.test(smoke)) fail(`smoke contains forbidden runtime signal ${pattern}`)
}

const packageJson = JSON.parse(read('package.json'))
if (packageJson.scripts?.['smoke:internal-beta-e2e-negative-gate-tests'] !== 'tsx server/smoke/internal-beta-e2e-negative-gate-tests-smoke.ts') {
  fail('missing smoke package script')
}
if (packageJson.scripts?.['rp-internal-beta-e2e-negative-gate-tests-1:diagnostics'] !== 'node scripts/validation/rp-internal-beta-e2e-negative-gate-tests-1-diagnostics.mjs') {
  fail('missing diagnostics package script')
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
  const text = stripHistoricalSections(read(file))
  for (const pattern of forbiddenClaims) {
    if (pattern.test(text)) fail(`forbidden changed-file claim in ${file}: ${pattern}`)
  }
}

console.log(`${packet} diagnostics passed`)
